import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { decrypt, encrypt } from '../utils/encryptCredentials.js'

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

const buildDecryptedSmtp = (smtpConfig = {}) => ({
  host: smtpConfig.host ? decrypt(smtpConfig.host) : '',
  port: smtpConfig.port || 587,
  user: smtpConfig.user ? decrypt(smtpConfig.user) : '',
  pass: smtpConfig.pass ? decrypt(smtpConfig.pass) : '',
})

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const user = await User.create({ name, email, password })
    const token = makeToken(user._id)

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    return next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = makeToken(user._id)

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        smtpConfig: buildDecryptedSmtp(user.smtpConfig),
      },
    })
  } catch (error) {
    return next(error)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      smtpConfig: buildDecryptedSmtp(user.smtpConfig),
      sendingPreferences: user.sendingPreferences,
      createdAt: user.createdAt,
    })
  } catch (error) {
    return next(error)
  }
}

export const saveSmtpConfig = async (req, res, next) => {
  try {
    const { host, port, user, pass } = req.body

    await User.findByIdAndUpdate(req.user.id, {
      smtpConfig: {
        host: encrypt(host),
        port: Number(port) || 587,
        user: encrypt(user),
        pass: encrypt(pass),
      },
    })

    return res.json({ message: 'SMTP config saved successfully' })
  } catch (error) {
    return next(error)
  }
}

export const getUserPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('sendingPreferences')
    if (!user) return res.status(404).json({ message: 'User not found' })
    return res.json({ preferences: user.sendingPreferences })
  } catch (error) {
    return next(error)
  }
}

export const updateSendingPreferences = async (req, res, next) => {
  try {
    const { batchSize, delayBetweenBatches, maxRetriesPerEmail } = req.body

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.sendingPreferences = {
      batchSize,
      delayBetweenBatches,
      maxRetriesPerEmail,
    }

    await user.save()

    return res.json({
      message: 'Preferences updated successfully',
      preferences: user.sendingPreferences,
    })
  } catch (error) {
    return next(error)
  }
}

export const logout = async (req, res) => {
  return res.json({ message: 'Logged out successfully' })
}
