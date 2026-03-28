import mongoose from 'mongoose'

const emailAnalyticsSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailLog',
    required: true,
    index: true,
  },
  recipientEmail: { type: String, required: true },
  trackingId: { type: String, required: true, unique: true, index: true },
  opened: { type: Boolean, default: false },
  openCount: { type: Number, default: 0 },
  firstOpenAt: { type: Date },
  lastOpenAt: { type: Date },
  openUserAgent: { type: String },
  openIpAddress: { type: String },
  clicked: { type: Boolean, default: false },
  clickCount: { type: Number, default: 0 },
  firstClickAt: { type: Date },
  lastClickAt: { type: Date },
  clickedUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('EmailAnalytics', emailAnalyticsSchema)
