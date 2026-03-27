import { NavLink } from 'react-router-dom'
import { ClipboardList, LayoutDashboard, LogOut, Mail, Send, Settings, User } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import Button from '../ui/Button'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: Mail, label: 'Compose', to: '/compose' },
  { icon: ClipboardList, label: 'Logs', to: '/logs' },
  { icon: Settings, label: 'Settings', to: '/settings' },
]

const Sidebar = ({ collapsed = false }) => {
  const { user, logout } = useAuth()
  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'SM'

  return (
    <aside className={`flex h-screen flex-col border-r border-border bg-surface px-3 py-4 transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="mb-6 flex items-center gap-2 px-2">
        <Send size={18} className="text-accent" />
        {!collapsed ? <span className="font-display text-xl italic">Smart Mailer</span> : null}
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `flex items-center gap-3 rounded px-3 py-2 text-sm transition-all duration-150 hover:bg-surface-2 ${isActive ? 'border-r-2 border-accent bg-accent-subtle font-medium text-accent' : 'text-text-secondary'}`}
          >
            <item.icon size={16} />
            {!collapsed ? <span>{item.label}</span> : null}
          </NavLink>
        ))}
      </nav>
      <div className="rounded border border-border bg-surface-2 p-2">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-subtle text-xs font-semibold text-accent">
            <User size={14} />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{user?.name || 'User'}</p>
              <p className="truncate text-xs text-text-secondary">{user?.email || ''}</p>
            </div>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" className="w-full" onClick={logout}>
          <LogOut size={14} />
          {!collapsed ? 'Logout' : null}
        </Button>
      </div>
    </aside>
  )
}

export default Sidebar
