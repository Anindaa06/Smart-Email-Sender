import mongoose from 'mongoose'

const emailLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Mixed is used to keep backward compatibility with historical logs that stored recipients as string arrays.
  recipients: { type: [mongoose.Schema.Types.Mixed], default: [] },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['success', 'partial', 'failed'], default: 'success' },
  sentCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  errorDetails: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
})

const EmailLog = mongoose.model('EmailLog', emailLogSchema)

export default EmailLog
