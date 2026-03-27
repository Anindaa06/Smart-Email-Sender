const statusStyles = {
  success: 'bg-success/10 text-success border-success/30',
  partial: 'bg-warning/10 text-warning border-warning/30',
  failed: 'bg-error/10 text-error border-error/30',
  info: 'bg-accent-subtle text-accent border-accent/40',
}

const Badge = ({ status = 'info', children }) => {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[status] || statusStyles.info}`}>{children}</span>
}

export default Badge
