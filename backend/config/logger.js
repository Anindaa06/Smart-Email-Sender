import winston from 'winston'
import fs from 'fs'

const { combine, timestamp, printf, colorize, json } = winston.format

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs', { recursive: true })
}

const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : ''
  return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`
})

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
    }),
    new winston.transports.File({ filename: 'logs/queue.log', level: 'info' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
})

export default logger
