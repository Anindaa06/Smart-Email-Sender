import { Worker } from 'bullmq'
import { v4 as uuidv4 } from 'uuid'
import redisConfig from '../config/redis.js'
import { createTransporter } from '../config/nodemailer.js'
import { decrypt } from '../utils/encryptCredentials.js'
import { personalizeEmail, personalizeSubject } from '../utils/templateEngine.js'
import EmailLog from '../models/EmailLog.js'
import User from '../models/User.js'
import ScheduledEmail from '../models/ScheduledEmail.js'
import EmailAnalytics from '../models/EmailAnalytics.js'
import logger from '../config/logger.js'
import { generateTrackingPixel } from '../controllers/trackingController.js'

const CONCURRENCY = 3

const processEmailJob = async (job) => {
  const { userId, recipients, subject, message, logId, batchSize, delayBetweenBatches, scheduledEmailId } = job.data

  console.log(`[Worker] Processing job ${job.id} for user ${userId}`)

  const user = await User.findById(userId)
  if (!user || !user.smtpConfig?.host) {
    throw new Error('User SMTP configuration not found')
  }

  const smtpConfig = {
    host: decrypt(user.smtpConfig.host),
    port: user.smtpConfig.port,
    user: decrypt(user.smtpConfig.user),
    pass: decrypt(user.smtpConfig.pass),
  }

  const transporter = createTransporter(smtpConfig)
  await transporter.verify()

  const chunks = []
  for (let i = 0; i < recipients.length; i += (batchSize || 10)) {
    chunks.push(recipients.slice(i, i + (batchSize || 10)))
  }

  let sentCount = 0
  let failedCount = 0
  const recipientResults = []

  if (logId) {
    await EmailLog.findByIdAndUpdate(logId, { status: 'processing', queueJobId: String(job.id) })
  }

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const chunk = chunks[chunkIndex]

    await job.updateProgress({
      currentBatch: chunkIndex + 1,
      totalBatches: chunks.length,
      sent: sentCount,
      failed: failedCount,
      total: recipients.length,
    })

    const chunkResults = await Promise.allSettled(
      chunk.map(async (recipient) => {
        const recipientObj = typeof recipient === 'string' ? { email: recipient } : recipient
        const personalizedBody = personalizeEmail(message, recipientObj)
        const personalizedSubject = personalizeSubject(subject, recipientObj)

        const trackingId = uuidv4()

        if (logId) {
          await EmailAnalytics.create({
            campaignId: logId,
            recipientEmail: recipientObj.email,
            trackingId,
          })
        }

        const trackingPixel = generateTrackingPixel(trackingId)
        const htmlBody = `<p>${personalizedBody.replace(/\n/g, '<br>')}</p>${trackingPixel}`

        return transporter.sendMail({
          from: smtpConfig.user,
          to: recipientObj.email,
          subject: personalizedSubject,
          text: personalizedBody,
          html: htmlBody,
        })
      }),
    )

    for (let i = 0; i < chunkResults.length; i += 1) {
      const result = chunkResults[i]
      const recipient = typeof chunk[i] === 'string' ? { email: chunk[i] } : chunk[i]

      if (result.status === 'fulfilled') {
        sentCount += 1
        recipientResults.push({ ...recipient, status: 'sent', attempts: 1 })
      } else {
        failedCount += 1
        recipientResults.push({
          ...recipient,
          status: 'failed',
          attempts: 1,
          errorMessage: result.reason?.message || 'Send failed',
        })
      }
    }

    if (logId) {
      await EmailLog.findByIdAndUpdate(logId, { sentCount, failedCount, recipients: recipientResults })
    }

    if (chunkIndex < chunks.length - 1 && delayBetweenBatches) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches))
    }
  }

  const finalStatus = failedCount === 0 ? 'success' : sentCount === 0 ? 'failed' : 'partial'

  if (logId) {
    await EmailLog.findByIdAndUpdate(logId, {
      status: finalStatus,
      sentCount,
      failedCount,
      recipients: recipientResults,
      processedAt: new Date(),
    })
  }

  if (scheduledEmailId) {
    await ScheduledEmail.findByIdAndUpdate(scheduledEmailId, {
      status: finalStatus === 'failed' ? 'failed' : 'sent',
      sentAt: new Date(),
      emailLogId: logId,
    })
  }

  console.log(`[Worker] Job ${job.id} complete: sent=${sentCount} failed=${failedCount}`)
  return { sent: sentCount, failed: failedCount, total: recipients.length, status: finalStatus }
}

export const startEmailWorker = () => {
  const worker = new Worker('email-sending', processEmailJob, {
    connection: redisConfig,
    concurrency: CONCURRENCY,
  })

  worker.on('completed', (job, result) => {
    console.log(`[Worker] Job ${job.id} completed`, result)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message)
  })

  worker.on('progress', (job, progress) => {
    console.log(`[Worker] Job ${job.id} progress`, progress)
  })

  logger.info('Email worker started')
  return worker
}

export const startScheduledEmailWorker = () => {
  const worker = new Worker('scheduled-emails', processEmailJob, {
    connection: redisConfig,
    concurrency: 2,
  })

  worker.on('completed', (job) => {
    console.log(`[Scheduler Worker] Scheduled job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Scheduler Worker] Job ${job?.id} failed`, err.message)
  })

  logger.info('Scheduled email worker started')
  return worker
}

