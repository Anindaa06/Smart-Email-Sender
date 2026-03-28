import User from '../models/User.js'
import EmailLog from '../models/EmailLog.js'
import { addEmailJob } from '../queue/emailQueue.js'
import { predictPerformance, predictSpam } from '../services/mlService.js'

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

    if (!user.smtpConfig?.host) {
      return res.status(400).json({ message: 'SMTP credentials are incomplete. Please save SMTP config first.' })
    }

    const [spamPrediction, performancePrediction] = await Promise.all([
      predictSpam(subject, message),
      predictPerformance(subject, normalizedRecipients.length, null),
    ])

    const emailLog = await EmailLog.create({
      userId: req.user.id,
      recipients: normalizedRecipients.map((recipient) => ({
        email: recipient.email,
        name: recipient.name || '',
        company: recipient.company || '',
        status: 'pending',
        attempts: 0,
      })),
      subject,
      message,
      status: 'queued',
      sentCount: 0,
      failedCount: 0,
      timestamp: new Date(),
      mlPredictions: {
        spamProbability: spamPrediction?.spam_probability || 0,
        predictedOpenRate: performancePrediction?.expected_open_rate || 0,
        performanceTier: performancePrediction?.performance_tier || 'unknown',
      },
    })

    const prefs = user.sendingPreferences || {}

    const job = await addEmailJob({
      userId: req.user.id,
      recipients: normalizedRecipients,
      subject,
      message,
      logId: emailLog._id.toString(),
      batchSize: prefs.batchSize || 10,
      delayBetweenBatches: prefs.delayBetweenBatches || 1000,
    })

    await EmailLog.findByIdAndUpdate(emailLog._id, { queueJobId: String(job.id) })

    return res.status(202).json({
      success: true,
      message: 'Email job queued successfully',
      jobId: job.id,
      logId: emailLog._id,
      recipientCount: normalizedRecipients.length,
    })
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

    const failedRecipients = (log.recipients || [])
      .map((recipient) => (typeof recipient === 'string' ? { email: recipient, status: 'failed' } : recipient))
      .filter((recipient) => recipient.status === 'failed')

    if (!failedRecipients.length) {
      return res.status(400).json({ message: 'No failed recipients found for retry' })
    }

    const user = await User.findById(req.user.id)
    const prefs = user?.sendingPreferences || {}

    const retryLog = await EmailLog.create({
      userId: req.user.id,
      recipients: failedRecipients.map((recipient) => ({ ...recipient, status: 'pending', attempts: Number(recipient.attempts || 0) })),
      subject: log.subject,
      message: log.message,
      status: 'queued',
      sentCount: 0,
      failedCount: 0,
      timestamp: new Date(),
    })

    const job = await addEmailJob({
      userId: req.user.id,
      recipients: failedRecipients,
      subject: log.subject,
      message: log.message,
      logId: retryLog._id.toString(),
      batchSize: prefs.batchSize || 10,
      delayBetweenBatches: prefs.delayBetweenBatches || 1000,
    })

    return res.json({ message: 'Retry queued for failed recipients', jobId: job.id, logId: retryLog._id })
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
