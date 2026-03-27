import { X } from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

const EmailPreviewModal = ({ isOpen, onClose, onConfirm, sender, recipients, subject, message, isSending }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded border border-border bg-surface shadow-card" style={{ animation: 'fadeSlideUp 0.2s ease both' }}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-2xl italic">Email Preview</h2>
          <button type="button" className="text-text-secondary hover:text-text-primary" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <p><span className="text-text-secondary">From:</span> {sender || 'sender@email.com'}</p>
          <div className="space-y-1">
            <p className="text-text-secondary">To:</p>
            <div className="flex flex-wrap gap-2">
              {recipients.length ? recipients.map((r) => <Badge key={r} status="info">{r}</Badge>) : <span className="text-text-secondary">No recipients</span>}
            </div>
          </div>
          <p><span className="text-text-secondary">Subject:</span> <strong>{subject || '(No subject)'}</strong></p>
          <div className="max-h-64 overflow-auto whitespace-pre-wrap rounded border border-border bg-surface-2 p-3 text-sm">
            {message || 'No message body.'}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={onConfirm} isLoading={isSending}>Confirm & Send</Button>
        </div>
      </div>
    </div>
  )
}

export default EmailPreviewModal
