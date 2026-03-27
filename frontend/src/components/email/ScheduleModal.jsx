import { useMemo, useState } from 'react'
import { CalendarClock, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { scheduleEmail } from '../../services/scheduleService'
import { pushToast } from '../../hooks/useToast'
import Button from '../ui/Button'

const toLocalInputValue = (date) => {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const ScheduleModal = ({ isOpen, onClose, emailData }) => {
  const navigate = useNavigate()
  const minDate = useMemo(() => new Date(Date.now() + 2 * 60 * 1000), [])
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(minDate))
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const confirmSchedule = async () => {
    const selected = new Date(scheduledAt)
    if (selected <= new Date(Date.now() + 2 * 60 * 1000)) {
      pushToast('Please pick a time at least 2 minutes in the future', 'warning')
      return
    }

    setSaving(true)
    try {
      await scheduleEmail({ ...emailData, scheduledAt: selected.toISOString() })
      pushToast('Email scheduled successfully', 'success')
      onClose()
      navigate('/logs')
    } catch (error) {
      pushToast(error.response?.data?.message || 'Failed to schedule email', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded border border-border bg-surface p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-2xl italic"><CalendarClock size={18} /> Schedule Send</h2>
          <button type="button" onClick={onClose}><X size={16} /></button>
        </div>
        <label className="mb-2 block text-sm text-text-secondary">Send Date & Time</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          min={toLocalInputValue(minDate)}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full rounded border border-border bg-surface-2 px-3 py-2"
        />
        <p className="mt-2 text-sm text-text-secondary">
          Will send on {new Date(scheduledAt).toLocaleDateString()} at {new Date(scheduledAt).toLocaleTimeString()}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={confirmSchedule} isLoading={saving}>Confirm Schedule</Button>
        </div>
      </div>
    </div>
  )
}

export default ScheduleModal
