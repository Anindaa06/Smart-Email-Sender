import api from './api'

export const sendBulkEmail = ({ recipients, subject, message }) =>
  api.post('/api/email/send', { recipients, subject, message })

export const getEmailLogs = (page = 1, limit = 20) => api.get(`/api/email/logs?page=${page}&limit=${limit}`)

export const uploadRecipients = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/api/upload/recipients', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const retryFailedEmails = (logId) => api.post(`/api/email/retry/${logId}`)
