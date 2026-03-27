import cron from 'node-cron'
import ScheduledEmail from '../models/ScheduledEmail.js'
import EmailLog from '../models/EmailLog.js'
import User from '../models/User.js'
import { decrypt } from '../utils/encryptCredentials.js'
import { createTransporter } from '../config/nodemailer.js'
import { sendEmailBatch } from '../utils/sendEmailBatch.js'

const normalizeRecipients = (recipients = []) => recipients.map((recipient) => {
  if (typeof recipient === 'string') return { email: recipient }
  return recipient
})

const processScheduledJob = async (job) => {
  job.status = 'processing'
  await job.save()

  try {
    const user = await User.findById(job.userId)
    if (!user) throw new Error('User not found')

    const decryptedConfig = {
      host: decrypt(user.smtpConfig.host),
      port: user.smtpConfig.port || 587,
      user: decrypt(user.smtpConfig.user),
      pass: decrypt(user.smtpConfig.pass),
    }

    const transporter = createTransporter(decryptedConfig)
    await transporter.verify()

    const recipients = normalizeRecipients(job.recipients)
    const log = await EmailLog.create({
      userId: user._id,
      recipients: recipients.map((r) => ({ ...r, status: 'pending', attempts: 0 })),
      subject: job.subject,
      message: job.message,
      status: 'partial',
      sentCount: 0,
      failedCount: 0,
      errorDetails: '',
    })

    await sendEmailBatch({
      userId: user._id,
      recipients,
      subject: job.subject,
      message: job.message,
      transporter,
      logId: log._id,
      fromAddress: decryptedConfig.user,
    })

    job.status = 'sent'
    job.sentAt = new Date()
    job.emailLogId = log._id
    await job.save()
  } catch (error) {
    job.status = 'failed'
    job.errorDetails = error.message || 'Unknown scheduler error'
    await job.save()
  }
}

export const startScheduler = () => {
  // For production scale, replace node-cron with Bull/BullMQ + Redis to support multiple server instances without double-processing.
  cron.schedule('* * * * *', async () => {
    const dueJobs = await ScheduledEmail.find({ status: 'pending', scheduledAt: { $lte: new Date() } })

    for (const job of dueJobs) {
      await processScheduledJob(job)
    }
  })
}
