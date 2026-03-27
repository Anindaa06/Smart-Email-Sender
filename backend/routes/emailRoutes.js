import express from 'express'
import { body, query } from 'express-validator'
import { getEmailLogs, sendBulkEmail } from '../controllers/emailController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { validateRequest } from '../middleware/validateRequest.js'

const router = express.Router()

router.post(
  '/send',
  authMiddleware,
  [
    body('recipients').isArray({ min: 1 }).withMessage('Recipients must be a non-empty array'),
    body('recipients.*').isEmail().withMessage('Each recipient must be a valid email'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  validateRequest,
  sendBulkEmail,
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
