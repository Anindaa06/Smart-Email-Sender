import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('smb_token'))
  const [smtpConfig, setSmtpConfig] = useState({ host: '', port: 587, user: '', pass: '' })
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = Boolean(token && user)

  const login = async (credentials) => {
    const { data } = await authService.login(credentials)
    localStorage.setItem('smb_token', data.token)
    localStorage.setItem('smb_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    setSmtpConfig(data.user.smtpConfig || { host: '', port: 587, user: '', pass: '' })
    return data
  }

  const register = async (payload) => {
    const { data } = await authService.register(payload)
    return data
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      // No-op by design: local session is always cleared.
    }

    localStorage.removeItem('smb_token')
    localStorage.removeItem('smb_user')
    setToken(null)
    setUser(null)
    setSmtpConfig({ host: '', port: 587, user: '', pass: '' })
    window.location.href = '/login'
  }

  const updateSmtpConfig = async (config) => {
    await authService.saveSmtpConfig(config)
    setSmtpConfig({
      host: config.host,
      port: Number(config.port),
      user: config.user,
      pass: config.pass,
    })
  }

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('smb_token')
      if (!storedToken) {
        setIsLoading(false)
        return
      }

      try {
        const { data } = await authService.getMe()
        setToken(storedToken)
        setUser({ id: data.id, name: data.name, email: data.email })
        setSmtpConfig(data.smtpConfig || { host: '', port: 587, user: '', pass: '' })
      } catch (error) {
        localStorage.removeItem('smb_token')
        localStorage.removeItem('smb_user')
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      smtpConfig,
      login,
      register,
      logout,
      updateSmtpConfig,
    }),
    [user, token, isLoading, isAuthenticated, smtpConfig],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
