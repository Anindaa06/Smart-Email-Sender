import { addScheduledEmailJob } from '../queue/emailQueue.js'
import ScheduledEmail from '../models/ScheduledEmail.js'
import logger from '../config/logger.js'

export const scheduleEmailCampaign = async ({ userId, recipients, subject, message, scheduledAt }) => {
  const now = new Date()
  const delay = scheduledAt.getTime() - now.getTime()

  if (delay < 60000) {
    throw new Error('Scheduled time must be at least 1 minute in the future')
  }

  const scheduledRecord = await ScheduledEmail.create({ userId, recipients, subject, message, scheduledAt, status: 'pending', recipientCount: recipients.length })

  const job = await addScheduledEmailJob(
    { userId: userId.toString(), recipients, subject, message, scheduledEmailId: scheduledRecord._id.toString(), logId: null },
    delay,
  )

  scheduledRecord.bullJobId = String(job.id)
  await scheduledRecord.save()

  logger.info('[Scheduler] Campaign scheduled', { scheduledEmailId: scheduledRecord._id, jobId: job.id })
  return { scheduledRecord, jobId: job.id }
}

export const cancelScheduledCampaign = async (scheduledEmailId, userId) => {
  const record = await ScheduledEmail.findOne({ _id: scheduledEmailId, userId, status: 'pending' })

  if (!record) throw new Error('Scheduled email not found or already processed')

  const { scheduledEmailQueue } = await import('../queue/emailQueue.js')
  try {
    const job = await scheduledEmailQueue.getJob(record.bullJobId)
    if (job) await job.remove()
  } catch (err) {
    logger.warn('[Scheduler] Could not remove BullMQ job', { error: err.message })
  }

  record.status = 'cancelled'
  await record.save()
  logger.info('[Scheduler] Campaign cancelled', { scheduledEmailId })
  return record
}
