import express from 'express'
import { trackOpen, trackClick, getCampaignAnalytics } from '../controllers/trackingController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/open/:trackingId', trackOpen)
router.get('/click/:trackingId', trackClick)
router.get('/analytics/:logId', authMiddleware, getCampaignAnalytics)

export default router
