import { useEffect, useMemo, useState } from 'react'

const resolveBase = () => import.meta.env.VITE_API_URL || 'http://localhost:5000'

const SendingProgress = ({ jobId, total, onComplete }) => {
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: total || 0, processed: 0, done: false })

  useEffect(() => {
    if (!jobId) return undefined

    const token = localStorage.getItem('smb_token')
    const source = new EventSource(`${resolveBase()}/api/progress/${jobId}?token=${encodeURIComponent(token || '')}`)

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setProgress((prev) => ({ ...prev, ...data, total: data.total || prev.total }))
        if (data.done) {
          source.close()
          onComplete?.(data)
        }
      } catch {
        // Ignore malformed events.
      }
    }

    source.onerror = () => {
      source.close()
    }

    return () => source.close()
  }, [jobId, onComplete])

  const percent = useMemo(() => {
    const base = progress.total || total || 1
    const completed = progress.processed || progress.sent + progress.failed
    return Math.min(100, Math.round((completed / base) * 100))
  }, [progress, total])

  const remaining = Math.max(0, (progress.total || total || 0) - (progress.sent + progress.failed))

  return (
    <div className="rounded border border-border bg-surface-2 p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>Sending in progress...</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-border">
        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-text-secondary">
        <p>Sent: {progress.sent || 0}</p>
        <p>Failed: {progress.failed || 0}</p>
        <p>Remaining: {remaining}</p>
      </div>
      {progress.chunkIndex ? (
        <p className="mt-1 text-xs text-text-secondary">Batch {progress.chunkIndex} of {progress.totalChunks || '?'}</p>
      ) : null}
    </div>
  )
}

export default SendingProgress
