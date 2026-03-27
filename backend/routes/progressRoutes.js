import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()
const progressClients = new Map()

export const emitProgress = (jobId, data) => {
  const client = progressClients.get(jobId)
  if (!client) return
  client.write(`data: ${JSON.stringify(data)}\n\n`)
}

router.get('/:jobId', authMiddleware, (req, res) => {
  const { jobId } = req.params

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // SSE connections stored in-memory. For multi-instance deployments, use Redis pub/sub to broadcast progress across instances.
  progressClients.set(jobId, res)
  res.write(`data: ${JSON.stringify({ connected: true, jobId })}\n\n`)

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n')
  }, 15000)

  req.on('close', () => {
    clearInterval(heartbeat)
    progressClients.delete(jobId)
  })
})

export default router
