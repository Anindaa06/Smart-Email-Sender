import { Queue } from 'bullmq'
import redisConfig from '../config/redis.js'
import logger from '../config/logger.js'

export const emailQueue = new Queue('email-sending', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 30000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600,
    },
    removeOnFail: {
      count: 200,
    },
  },
})

export const scheduledEmailQueue = new Queue('scheduled-emails', {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
})

export const addEmailJob = async (jobData) => {
  const job = await emailQueue.add('send-bulk-email', jobData, { priority: 1 })
  logger.info('[Queue] Job added', { jobId: job.id })
  return job
}

export const addScheduledEmailJob = async (jobData, delay) => {
  const job = await scheduledEmailQueue.add('send-scheduled-email', jobData, { delay, priority: 2 })
  logger.info('[Queue] Scheduled job added', { jobId: job.id, delay })
  return job
}

export default emailQueue
