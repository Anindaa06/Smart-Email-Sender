import express from 'express'
import { body } from 'express-validator'
import ScheduledEmail from '../models/ScheduledEmail.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { cancelScheduledCampaign, scheduleEmailCampaign } from '../services/schedulerService.js'

const router = express.Router()

router.post(
  '/',
  authMiddleware,
  [
    body('recipients').isArray({ min: 1 }).withMessage('Recipients must be a non-empty array'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid datetime'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { recipients, subject, message, scheduledAt } = req.body
      const sendAt = new Date(scheduledAt)

      const { scheduledRecord, jobId } = await scheduleEmailCampaign({
        userId: req.user.id,
        recipients,
        subject,
        message,
        scheduledAt: sendAt,
      })

      return res.status(201).json({
        job: {
          id: scheduledRecord._id,
          scheduledAt: scheduledRecord.scheduledAt,
          recipientCount: scheduledRecord.recipientCount,
          bullJobId: jobId,
        },
      })
    } catch (error) {
      return next(error)
    }
  },
)

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const jobs = await ScheduledEmail.find({ userId: req.user.id }).sort({ createdAt: -1 })
    return res.json({ jobs })
  } catch (error) {
    return next(error)
  }
})

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const job = await ScheduledEmail.findOne({ _id: req.params.id, userId: req.user.id })
    if (!job) {
      return res.status(404).json({ message: 'Scheduled job not found' })
    }
    return res.json({ job })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    await cancelScheduledCampaign(req.params.id, req.user.id)
    return res.json({ message: 'Scheduled email cancelled' })
  } catch (error) {
    return next(error)
  }
})

export default router
