import express from 'express'
import { body, param, query } from 'express-validator'
import { getEmailLogs, retryFailedEmailLog, sendBulkEmail } from '../controllers/emailController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { predictSpam, predictSendTime, predictPerformance } from '../services/mlService.js'

const router = express.Router()

router.post(
  '/send',
  authMiddleware,
  [
    body('recipients').isArray({ min: 1 }).withMessage('Recipients must be a non-empty array'),
    body('recipients.*.email').isEmail().withMessage('Each recipient must include a valid email'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  validateRequest,
  sendBulkEmail,
)

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { subject, body, recipientCount, sendTime } = req.body

    const [spamResult, sendTimeResult, performanceResult] = await Promise.allSettled([
      predictSpam(subject, body),
      predictSendTime(),
      predictPerformance(subject, recipientCount, sendTime),
    ])

    res.json({
      spam: spamResult.status === 'fulfilled' ? spamResult.value : null,
      sendTime: sendTimeResult.status === 'fulfilled' ? sendTimeResult.value : null,
      performance: performanceResult.status === 'fulfilled' ? performanceResult.value : null,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post(
  '/retry/:logId',
  authMiddleware,
  [param('logId').isMongoId().withMessage('Invalid log id')],
  validateRequest,
  retryFailedEmailLog,
)

router.get(
  '/logs',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validateRequest,
  getEmailLogs,
)

export default router
