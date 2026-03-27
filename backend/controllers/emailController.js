import User from '../models/User.js'
import EmailLog from '../models/EmailLog.js'
import { decrypt } from '../utils/encryptCredentials.js'
import { createTransporter } from '../config/nodemailer.js'

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const sendBulkEmail = async (req, res, next) => {
  try {
    const { recipients, subject, message } = req.body

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'Recipients must be a non-empty array' })
    }

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Subject and message are required' })
    }

    const invalidRecipients = recipients.filter((email) => !isValidEmail(email))
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

    const results = await Promise.allSettled(
      recipients.map((to) =>
        transporter.sendMail({
          from: decryptedConfig.user,
          to,
          subject,
          text: message,
          html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        }),
      ),
    )

    const sentCount = results.filter((result) => result.status === 'fulfilled').length
    const failedCount = results.length - sentCount

    let status = 'success'
    if (sentCount === 0) {
      status = 'failed'
    } else if (failedCount > 0) {
      status = 'partial'
    }

    const errorDetails = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason?.message || 'Unknown error')
      .join(' | ')

    const log = await EmailLog.create({
      userId: req.user.id,
      recipients,
      subject,
      message,
      status,
      sentCount,
      failedCount,
      errorDetails,
    })

    return res.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: recipients.length,
      logId: log._id,
    })
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
