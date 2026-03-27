import crypto from 'crypto'
import User from '../models/User.js'
import EmailLog from '../models/EmailLog.js'
import { decrypt } from '../utils/encryptCredentials.js'
import { createTransporter } from '../config/nodemailer.js'
import { sendEmailBatch } from '../utils/sendEmailBatch.js'
import { emitProgress } from '../routes/progressRoutes.js'

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const normalizeRecipients = (recipients = []) => recipients.map((recipient) => {
  if (typeof recipient === 'string') {
    return { email: recipient }
  }
  return recipient
})

export const sendBulkEmail = async (req, res, next) => {
  try {
    const { recipients, subject, message } = req.body

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'Recipients must be a non-empty array' })
    }

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Subject and message are required' })
    }

    const normalizedRecipients = normalizeRecipients(recipients)
    const invalidRecipients = normalizedRecipients.filter((recipient) => !isValidEmail(recipient.email || ''))
    if (invalidRecipients.length > 0) {
      return res.status(400).json({ message: 'One or more recipient emails are invalid' })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const decryptedConfig = {
      host: user.smtpConfig.host ? decrypt(user.smtpConfig.host) : '',
      port: user.smtpConfig.port || 587,
      user: user.smtpConfig.user ? decrypt(user.smtpConfig.user) : '',
      pass: user.smtpConfig.pass ? decrypt(user.smtpConfig.pass) : '',
    }

    if (!decryptedConfig.host || !decryptedConfig.user || !decryptedConfig.pass) {
      return res.status(400).json({ message: 'SMTP credentials are incomplete. Please save SMTP config first.' })
    }

    const transporter = createTransporter(decryptedConfig)
    await transporter.verify()

    const log = await EmailLog.create({
      userId: req.user.id,
      recipients: normalizedRecipients.map((recipient) => ({ ...recipient, status: 'pending', attempts: 0 })),
      subject,
      message,
      status: 'partial',
      sentCount: 0,
      failedCount: 0,
      errorDetails: '',
    })

    const jobId = crypto.randomUUID()

    res.json({ jobId, logId: log._id, total: normalizedRecipients.length })

    ;(async () => {
      try {
        await sendEmailBatch({
          userId: req.user.id,
          recipients: normalizedRecipients,
          subject,
          message,
          transporter,
          logId: log._id,
          fromAddress: decryptedConfig.user,
          onProgress: async () => {
            const latest = await EmailLog.findById(log._id)
            if (!latest) return
            emitProgress(jobId, {
              sent: latest.sentCount,
              failed: latest.failedCount,
              total: latest.recipients.length,
            })
          },
          emitProgress: (data) => emitProgress(jobId, data),
        })
      } catch (error) {
        emitProgress(jobId, { done: true, error: error.message || 'Sending failed' })
      }
    })()
  } catch (error) {
    return next(error)
  }
}

export const retryFailedEmailLog = async (req, res, next) => {
  try {
    const log = await EmailLog.findOne({ _id: req.params.logId, userId: req.user.id })
    if (!log) {
      return res.status(404).json({ message: 'Email log not found' })
    }

    const updated = (log.recipients || []).map((recipient) => {
      if (typeof recipient === 'string') {
        return { email: recipient, status: 'retrying', attempts: 0, nextRetryAt: new Date() }
      }

      if (recipient.status === 'failed') {
        return {
          ...recipient,
          status: 'retrying',
          nextRetryAt: new Date(),
        }
      }

      return recipient
    })

    log.recipients = updated
    await log.save()

    return res.json({ message: 'Retry queued for failed recipients' })
  } catch (error) {
    return next(error)
  }
}

export const getEmailLogs = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.max(Number(req.query.limit) || 20, 1)
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      EmailLog.find({ userId: req.user.id }).sort({ timestamp: -1 }).skip(skip).limit(limit),
      EmailLog.countDocuments({ userId: req.user.id }),
    ])

    return res.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    })
  } catch (error) {
    return next(error)
  }
}
