import api from './api'

export const analyzeEmail = ({ subject, body, recipientCount, sendTime }) =>
  api.post('/api/email/analyze', { subject, body, recipientCount, sendTime })
