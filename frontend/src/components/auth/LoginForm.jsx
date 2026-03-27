import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { pushToast } from '../../hooks/useToast'
import Input from '../ui/Input'
import Button from '../ui/Button'

const LoginForm = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await login({ email: form.email, password: form.password })
      pushToast('Logged in successfully', 'success')
      navigate('/dashboard')
    } catch (error) {
      pushToast(error.response?.data?.message || 'Failed to login', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="you@example.com" required />
      <Input label="Password" type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="••••••••" required />
      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input type="checkbox" checked={form.remember} onChange={(e) => setForm((prev) => ({ ...prev, remember: e.target.checked }))} className="h-4 w-4 rounded border-border bg-surface" />
        Remember me
      </label>
      <Button type="submit" className="w-full" isLoading={isSubmitting}>Sign In</Button>
      <p className="text-center text-sm text-text-secondary">Don't have an account? <Link to="/register" className="text-accent hover:text-accent-hover">Register</Link></p>
    </form>
  )
}

export default LoginForm
