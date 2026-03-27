import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  smtpConfig: {
    host: { type: String, default: '' },
    port: { type: Number, default: 587 },
    user: { type: String, default: '' },
    pass: { type: String, default: '' },
  },
  sendingPreferences: {
    batchSize: { type: Number, default: 10, min: 1, max: 100 },
    delayBetweenBatches: { type: Number, default: 1000, min: 500, max: 30000 },
    maxRetriesPerEmail: { type: Number, default: 3, min: 1, max: 5 },
  },
  createdAt: { type: Date, default: Date.now },
})

userSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) {
    return next()
  }

  this.password = await bcrypt.hash(this.password, 12)
  return next()
})

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model('User', userSchema)

export default User
