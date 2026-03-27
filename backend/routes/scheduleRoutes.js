import express from 'express'
import { body } from 'express-validator'
import ScheduledEmail from '../models/ScheduledEmail.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { validateRequest } from '../middleware/validateRequest.js'

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
      const minSchedule = new Date(Date.now() + 2 * 60 * 1000)

      if (sendAt <= minSchedule) {
        return res.status(400).json({ message: 'scheduledAt must be at least 2 minutes in the future' })
      }

      const job = await ScheduledEmail.create({
        userId: req.user.id,
        recipients,
        subject,
        message,
        scheduledAt: sendAt,
        recipientCount: recipients.length,
      })

      return res.status(201).json({
        job: {
          id: job._id,
          scheduledAt: job.scheduledAt,
          recipientCount: job.recipientCount,
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
    const job = await ScheduledEmail.findOne({ _id: req.params.id, userId: req.user.id })
    if (!job) {
      return res.status(404).json({ message: 'Scheduled job not found' })
    }

    if (job.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending jobs can be cancelled' })
    }

    job.status = 'cancelled'
    await job.save()

    return res.json({ message: 'Scheduled email cancelled' })
  } catch (error) {
    return next(error)
  }
})

export default router
