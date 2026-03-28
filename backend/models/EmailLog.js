import mongoose from 'mongoose'

const emailLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipients: { type: [mongoose.Schema.Types.Mixed], default: [] },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  queueJobId: { type: String },
  status: {
    type: String,
    enum: ['queued', 'processing', 'success', 'partial', 'failed'],
    default: 'queued',
  },
  sentCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  errorDetails: { type: String, default: '' },
  processedAt: { type: Date },
  // Analytics fields
  totalOpens: { type: Number, default: 0 },
  totalClicks: { type: Number, default: 0 },
  openRate: { type: Number, default: 0 },
  clickRate: { type: Number, default: 0 },
  // ML predictions captured at queue time
  mlPredictions: {
    spamProbability: Number,
    predictedOpenRate: Number,
    performanceTier: String,
  },
  timestamp: { type: Date, default: Date.now },
})

const EmailLog = mongoose.model('EmailLog', emailLogSchema)

export default EmailLog
