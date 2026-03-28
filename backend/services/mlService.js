import axios from 'axios'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 10000,
})

export const checkMLHealth = async () => {
  try {
    const res = await mlClient.get('/health')
    return res.data
  } catch {
    return { status: 'unavailable' }
  }
}

export const predictSpam = async (subject, body) => {
  try {
    const res = await mlClient.post('/predict-spam', { subject, body })
    return res.data
  } catch (err) {
    console.warn('[ML] Spam prediction failed:', err.message)
    return { spam_probability: 0, is_spam: false, confidence: 'unavailable' }
  }
}

export const predictSendTime = async (previousSendTimes = [], openRates = []) => {
  try {
    const res = await mlClient.post('/predict-send-time', {
      previous_send_times: previousSendTimes,
      open_rates: openRates,
    })
    return res.data
  } catch (err) {
    console.warn('[ML] Send time prediction failed:', err.message)
    return null
  }
}

export const predictPerformance = async (subject, recipientCount, sendTime = null) => {
  try {
    const res = await mlClient.post('/predict-performance', {
      subject,
      recipient_count: recipientCount,
      send_time: sendTime,
    })
    return res.data
  } catch (err) {
    console.warn('[ML] Performance prediction failed:', err.message)
    return null
  }
}
