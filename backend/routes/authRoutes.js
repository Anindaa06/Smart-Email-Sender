import express from 'express'
import rateLimit from 'express-rate-limit'
import { body } from 'express-validator'
import {
  getMe,
  getUserPreferences,
  login,
  logout,
  register,
  saveSmtpConfig,
  updateSendingPreferences,
} from '../controllers/authController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { validateRequest } from '../middleware/validateRequest.js'

const router = express.Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
})

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validateRequest,
  register,
)

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  login,
)

router.get('/me', authMiddleware, getMe)

router.put(
  '/smtp-config',
  authMiddleware,
  [
    body('host').trim().notEmpty().withMessage('SMTP host is required'),
    body('port').isInt({ min: 1, max: 65535 }).withMessage('SMTP port must be between 1 and 65535'),
    body('user').isEmail().withMessage('SMTP user must be a valid email'),
    body('pass').trim().notEmpty().withMessage('SMTP password is required'),
  ],
  validateRequest,
  saveSmtpConfig,
)

router.get('/preferences', authMiddleware, getUserPreferences)

router.put(
  '/preferences',
  authMiddleware,
  [
    body('batchSize').isInt({ min: 1, max: 100 }).withMessage('batchSize must be between 1 and 100'),
    body('delayBetweenBatches').isInt({ min: 500, max: 30000 }).withMessage('delayBetweenBatches must be between 500 and 30000'),
    body('maxRetriesPerEmail').isInt({ min: 1, max: 5 }).withMessage('maxRetriesPerEmail must be between 1 and 5'),
  ],
  validateRequest,
  updateSendingPreferences,
)

router.post('/logout', logout)

export default router
