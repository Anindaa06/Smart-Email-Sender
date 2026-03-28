import mongoose from 'mongoose'

const scheduledEmailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipients: { type: [mongoose.Schema.Types.Mixed], default: [] },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'sent', 'failed', 'cancelled'],
    default: 'pending',
  },
  bullJobId: { type: String },
  createdAt: { type: Date, default: Date.now },
  sentAt: { type: Date },
  errorDetails: { type: String, default: '' },
  emailLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailLog' },
  recipientCount: { type: Number, default: 0 },
})

const ScheduledEmail = mongoose.model('ScheduledEmail', scheduledEmailSchema)

export default ScheduledEmail
