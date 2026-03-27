import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { isValidEmail, isValidPassword } from '../../utils/validators'
import { pushToast } from '../../hooks/useToast'
import Input from '../ui/Input'
import Button from '../ui/Button'

const RegisterForm = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!isValidEmail(form.email)) next.email = 'Enter a valid email'
    if (!isValidPassword(form.password)) next.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password })
      pushToast('Account created! Please log in.', 'success')
      navigate('/login')
    } catch (error) {
      pushToast(error.response?.data?.message || 'Failed to register', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input label="Full Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} error={errors.name} placeholder="Jane Smith" />
      <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} error={errors.email} placeholder="you@example.com" />
      <Input label="Password" type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} error={errors.password} placeholder="••••••••" />
      <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} error={errors.confirmPassword} placeholder="••••••••" />
      <Button type="submit" className="w-full" isLoading={isSubmitting}>Create Account</Button>
      <p className="text-center text-sm text-text-secondary">Already have an account? <Link to="/login" className="text-accent hover:text-accent-hover">Login</Link></p>
    </form>
  )
}

export default RegisterForm
