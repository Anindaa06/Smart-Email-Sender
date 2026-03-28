import { Redis } from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
}

export const redisConnection = new Redis(redisConfig)

redisConnection.on('connect', () => console.log('Redis connected'))
redisConnection.on('error', (err) => console.error('Redis error:', err.message))

export default redisConfig
