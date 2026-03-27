import cron from 'node-cron'
import EmailLog from '../models/EmailLog.js'
import User from '../models/User.js'
import { decrypt } from '../utils/encryptCredentials.js'
import { createTransporter } from '../config/nodemailer.js'
import { personalizeEmail, personalizeSubject } from '../utils/personalizeEmail.js'
import { scheduleRetry } from '../utils/retryQueue.js'

const toRecipientObject = (recipient) => (typeof recipient === 'string' ? { email: recipient, status: 'pending', attempts: 0 } : recipient)

const retryLog = async (log) => {
  const user = await User.findById(log.userId)
  if (!user) return

  const decryptedConfig = {
    host: decrypt(user.smtpConfig.host),
    port: user.smtpConfig.port || 587,
    user: decrypt(user.smtpConfig.user),
    pass: decrypt(user.smtpConfig.pass),
  }

  const transporter = createTransporter(decryptedConfig)
  await transporter.verify()

  const recipients = (log.recipients || []).map(toRecipientObject)
  const due = recipients.filter((r) => r.status === 'retrying' && r.nextRetryAt && new Date(r.nextRetryAt) <= new Date())

  for (const recipient of due) {
    try {
      const personalizedSubject = personalizeSubject(log.subject, recipient)
      const personalizedMessage = personalizeEmail(log.message, recipient)

      await transporter.sendMail({
        from: decryptedConfig.user,
        to: recipient.email,
        subject: personalizedSubject,
        text: personalizedMessage,
        html: `<p>${personalizedMessage.replace(/\n/g, '<br>')}</p>`,
      })

      recipient.status = 'sent'
      recipient.lastAttemptAt = new Date()
      recipient.attempts = Number(recipient.attempts || 0) + 1
      recipient.errorMessage = ''
      recipient.nextRetryAt = null
    } catch (error) {
      recipient.lastAttemptAt = new Date()
      recipient.attempts = Number(recipient.attempts || 0) + 1
      recipient.errorMessage = error.message || 'Retry failed'
      await scheduleRetry(log._id, recipient.email, recipient.attempts)
      if (recipient.attempts >= 5) {
        recipient.status = 'failed'
        recipient.nextRetryAt = null
      }
    }
  }

  const sentCount = recipients.filter((r) => r.status === 'sent').length
  const failedCount = recipients.filter((r) => r.status !== 'sent').length

  log.recipients = recipients
  log.sentCount = sentCount
  log.failedCount = failedCount
  log.status = sentCount === recipients.length ? 'success' : sentCount === 0 ? 'failed' : 'partial'
  await log.save()
}

export const startRetryWorker = () => {
  // For production, use Bull queue with built-in backoff support instead of a cron-based retry approach.
  cron.schedule('*/30 * * * * *', async () => {
    const logs = await EmailLog.find({ recipients: { $elemMatch: { status: 'retrying', nextRetryAt: { $lte: new Date() } } } })

    for (const log of logs) {
      await retryLog(log)
    }
  })
}
