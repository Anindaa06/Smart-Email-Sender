import jwt from 'jsonwebtoken'

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null
  const queryToken = req.query?.token || null
  const token = headerToken || queryToken

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: decoded.id }
    return next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
