import api from './api'

export const scheduleEmail = (payload) => api.post('/api/schedule', payload)
export const getScheduledEmails = () => api.get('/api/schedule')
export const cancelScheduledEmail = (id) => api.delete(`/api/schedule/${id}`)
