import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, User } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import ThemeToggle from '../ui/ThemeToggle'

const TopBar = ({ onToggleSidebar }) => {
  const location = useLocation()
  const { user } = useAuth()

  const title = useMemo(() => {
    const map = {
      '/dashboard': 'Dashboard',
      '/compose': 'Compose Email',
      '/logs': 'Email Logs',
    }
    return map[location.pathname] || 'Smart Bulk Mailer'
  }, [location.pathname])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded border border-border text-text-secondary transition-all duration-150 hover:bg-surface-2 md:hidden" onClick={onToggleSidebar}>
          <Menu size={16} />
        </button>
        <h1 className="font-display text-2xl italic text-text-primary">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <p className="hidden items-center gap-1 text-sm text-text-secondary sm:flex">
          {greeting}, {user?.name?.split(' ')[0] || 'there'} <User size={14} />
        </p>
      </div>
    </header>
  )
}

export default TopBar
