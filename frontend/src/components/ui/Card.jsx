const Card = ({ children, className = '', hover = false }) => {
  return (
    <div className={`rounded border border-border bg-surface p-6 shadow-card ${hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl' : ''} ${className}`}>
      {children}
    </div>
  )
}

export default Card
