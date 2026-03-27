import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import emailRoutes from './routes/emailRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()
connectDB()

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/email', emailRoutes)
app.get('/api/health', (req, res) => res.json({ status: 'OK' }))

app.use(errorHandler)

app.listen(process.env.PORT || 5000, () => {
  console.log(`?? Server running on port ${process.env.PORT || 5000}`)
})
