import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

const icons = {
  success: <CheckCircle2 size={16} />,
  error: <AlertCircle size={16} />,
  warning: <AlertCircle size={16} />,
  info: <AlertCircle size={16} />,
}

const toastStyles = {
  success: 'border-success/40 bg-success/10',
  error: 'border-error/40 bg-error/10',
  warning: 'border-warning/40 bg-warning/10',
  info: 'border-accent/40 bg-accent-subtle',
}

const ToastItem = ({ toast, onRemove }) => {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const startedAt = Date.now()
    const duration = 4000
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt
      setProgress(Math.max(0, 100 - (elapsed / duration) * 100))
    }, 100)

    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className={`relative min-w-[280px] max-w-[360px] overflow-hidden rounded border p-3 text-sm text-text-primary shadow-card ${toastStyles[toast.type] || toastStyles.info}`}
      style={{ animation: 'toastIn 0.2s ease both' }}
    >
      <div className="flex items-start gap-2">
        <span>{icons[toast.type] || icons.info}</span>
        <p className="flex-1 leading-5">{toast.message}</p>
        <button type="button" className="text-text-secondary transition-colors hover:text-text-primary" onClick={() => onRemove(toast.id)}>
          <X size={16} />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 bg-accent transition-all" style={{ width: `${progress}%` }} />
    </div>
  )
}

const Toast = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

export default Toast
