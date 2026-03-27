import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'

const getKey = () => {
  const baseKey = process.env.ENCRYPTION_KEY || ''
  if (!baseKey) {
    throw new Error('ENCRYPTION_KEY is not configured')
  }

  return crypto.createHash('sha256').update(baseKey).digest()
}

export const encrypt = (plainText) => {
  if (!plainText) {
    return ''
  }

  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  let encrypted = cipher.update(String(plainText), 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
}

export const decrypt = (encryptedText) => {
  if (!encryptedText) {
    return ''
  }

  const [ivHex, encryptedHex] = encryptedText.split(':')
  if (!ivHex || !encryptedHex) {
    return ''
  }

  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
