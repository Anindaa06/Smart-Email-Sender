const Input = ({ label, type = 'text', value, onChange, placeholder, error, leftIcon, rightIcon, className = '', ...props }) => {
  return (
    <div className={`w-full ${className}`}>
      {label ? <label className="mb-2 block text-sm font-medium text-text-secondary">{label}</label> : null}
      <div className="relative">
        {leftIcon ? <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">{leftIcon}</div> : null}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-sm border border-border bg-surface-2 px-3 py-2.5 text-text-primary outline-none transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/50 ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}`}
          {...props}
        />
        {rightIcon ? <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">{rightIcon}</div> : null}
      </div>
      {error ? <p className="mt-1 text-sm text-error">{error}</p> : null}
    </div>
  )
}

export default Input
