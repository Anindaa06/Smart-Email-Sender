import api from './api'

export const register = (data) => api.post('/api/auth/register', data)
export const login = (credentials) => api.post('/api/auth/login', credentials)
export const getMe = () => api.get('/api/auth/me')
export const saveSmtpConfig = (config) => api.put('/api/auth/smtp-config', config)
export const logout = () => api.post('/api/auth/logout')
