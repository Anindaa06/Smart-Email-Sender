import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import emailRoutes from './routes/emailRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import scheduleRoutes from './routes/scheduleRoutes.js'
import progressRoutes from './routes/progressRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { startScheduler } from './workers/emailScheduler.js'
import { startRetryWorker } from './workers/retryWorker.js'

dotenv.config()

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/schedule', scheduleRoutes)
app.use('/api/progress', progressRoutes)
app.get('/api/health', (req, res) => res.json({ status: 'OK' }))

app.use(errorHandler)

const startServer = async () => {
  await connectDB()
  startScheduler()
  startRetryWorker()

  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`)
  })
}

startServer()
