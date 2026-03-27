import api from './api'

export const sendBulkEmail = ({ recipients, subject, message }) =>
  api.post('/api/email/send', { recipients, subject, message })

export const getEmailLogs = (page = 1, limit = 20) => api.get(`/api/email/logs?page=${page}&limit=${limit}`)
