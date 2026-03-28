import { v4 as uuidv4 } from 'uuid'
import EmailLog from '../models/EmailLog.js'
import EmailAnalytics from '../models/EmailAnalytics.js'
import logger from '../config/logger.js'

export const generateTrackingId = () => uuidv4()

export const trackOpen = async (req, res) => {
  const { trackingId } = req.params

  try {
    const analytics = await EmailAnalytics.findOne({ trackingId })

    if (analytics) {
      const now = new Date()
      const isFirstOpen = !analytics.opened

      await EmailAnalytics.findOneAndUpdate(
        { trackingId },
        {
          $set: {
            opened: true,
            lastOpenAt: now,
            openUserAgent: req.headers['user-agent'] || '',
            openIpAddress: req.ip,
            ...(isFirstOpen && { firstOpenAt: now }),
          },
          $inc: { openCount: 1 },
        },
      )

      if (isFirstOpen) {
        const log = await EmailLog.findByIdAndUpdate(analytics.campaignId, { $inc: { totalOpens: 1 } }, { new: true })
        if (log) {
          const totalRecipients = log.recipients?.length || 1
          log.openRate = Math.round((log.totalOpens / totalRecipients) * 100)
          await log.save()
        }
      }
    }
  } catch (err) {
    logger.error('[Tracking] Open track error', { error: err.message })
  }

  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
  })
  res.end(pixel)
}

export const trackClick = async (req, res) => {
  const { trackingId } = req.params
  const { url } = req.query
  const redirectUrl = url ? Buffer.from(url, 'base64').toString('utf8') : '/'

  try {
    const analytics = await EmailAnalytics.findOne({ trackingId })

    if (analytics) {
      const now = new Date()
      const isFirstClick = !analytics.clicked

      await EmailAnalytics.findOneAndUpdate(
        { trackingId },
        {
          $set: {
            clicked: true,
            lastClickAt: now,
            clickedUrl: redirectUrl,
            ...(isFirstClick && { firstClickAt: now }),
          },
          $inc: { clickCount: 1 },
        },
      )

      if (isFirstClick) {
        const log = await EmailLog.findByIdAndUpdate(analytics.campaignId, { $inc: { totalClicks: 1 } }, { new: true })
        if (log) {
          const totalRecipients = log.recipients?.length || 1
          log.clickRate = Math.round((log.totalClicks / totalRecipients) * 100)
          await log.save()
        }
      }
    }
  } catch (err) {
    logger.error('[Tracking] Click track error', { error: err.message })
  }

  res.redirect(302, redirectUrl)
}

export const getCampaignAnalytics = async (req, res) => {
  try {
    const { logId } = req.params
    const analytics = await EmailAnalytics.find({ campaignId: logId })
    const log = await EmailLog.findById(logId)

    res.json({
      campaign: {
        subject: log?.subject,
        totalRecipients: log?.recipients?.length || 0,
        totalOpens: log?.totalOpens || 0,
        totalClicks: log?.totalClicks || 0,
        openRate: log?.openRate || 0,
        clickRate: log?.clickRate || 0,
      },
      recipients: analytics,
    })
  } catch (err) {
    logger.error('[Tracking] Analytics fetch failed', { error: err.message })
    res.status(500).json({ message: err.message })
  }
}

export const generateTrackingPixel = (trackingId) => {
  const baseUrl = process.env.TRACKING_BASE_URL || 'http://localhost:5000'
  return `<img src="${baseUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none" alt="" />`
}

export const generateTrackedLink = (originalUrl, trackingId) => {
  const baseUrl = process.env.TRACKING_BASE_URL || 'http://localhost:5000'
  const encodedUrl = Buffer.from(originalUrl).toString('base64')
  return `${baseUrl}/api/track/click/${trackingId}?url=${encodedUrl}`
}
