import useTheme from '../../hooks/useTheme'
import { Moon, Sun } from 'lucide-react'

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button type="button" onClick={toggleTheme} className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-surface-2 text-text-primary transition-all duration-150 active:scale-[0.97] hover:bg-surface" aria-label="Toggle theme">
      <span className="transition-all duration-150">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</span>
    </button>
  )
}

export default ThemeToggle
