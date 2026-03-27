import express from 'express'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { uploadFile } from '../middleware/uploadMiddleware.js'
import { parseRecipientsFromFile } from '../utils/parseRecipients.js'

const router = express.Router()

router.post('/recipients', authMiddleware, (req, res, next) => {
  uploadFile.single('file')(req, res, async (err) => {
    try {
      if (err) {
        const message = err.message === 'Only CSV and Excel files are supported'
          ? err.message
          : 'File upload failed'
        return res.status(400).json({ message })
      }

      if (!req.file) {
        return res.status(400).json({ message: 'File is required' })
      }

      const parsed = await parseRecipientsFromFile(req.file.buffer, req.file.originalname)

      if (!parsed.validCount) {
        return res.status(400).json({ message: 'No valid recipients found in file' })
      }

      return res.json(parsed)
    } catch (error) {
      return next(error)
    }
  })
})

export default router
