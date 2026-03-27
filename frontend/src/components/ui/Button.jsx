import Spinner from './Spinner'

const variantStyles = {
  primary: 'bg-accent text-white hover:bg-accent-hover border border-accent/50',
  ghost: 'bg-transparent border border-border hover:bg-surface-2 text-text-primary',
  danger: 'bg-error/10 hover:bg-error/20 text-error border border-error/30',
  success: 'bg-success/10 hover:bg-success/20 text-success border border-success/30',
}

const sizeStyles = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

const Button = ({ variant = 'primary', size = 'md', isLoading = false, disabled = false, onClick, children, className = '', type = 'button' }) => {
  const isDisabled = disabled || isLoading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {isLoading ? <Spinner size="sm" color="currentColor" /> : null}
      {children}
    </button>
  )
}

export default Button
