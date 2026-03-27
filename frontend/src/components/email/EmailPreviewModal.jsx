import { useMemo, useState } from 'react'
import Handlebars from 'handlebars'
import { X } from 'lucide-react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

const safeRender = (template, data) => {
  try {
    return Handlebars.compile(template || '', { strict: false })(data || {})
  } catch {
    return template || ''
  }
}

const highlightVariables = (text = '') =>
  text.replace(/\{\{(\w+)\}\}/g, '<span style="color: var(--accent); font-weight: 600;">{{$1}}</span>')

const EmailPreviewModal = ({ isOpen, onClose, onConfirm, sender, recipients, subject, message, isSending }) => {
  const [selectedEmail, setSelectedEmail] = useState('')

  const previewRecipient = useMemo(() => {
    if (!recipients?.length) return null
    if (!selectedEmail) return recipients[0]
    return recipients.find((r) => r.email === selectedEmail) || recipients[0]
  }, [recipients, selectedEmail])

  if (!isOpen) return null

  const renderedSubject = previewRecipient ? safeRender(subject, previewRecipient) : subject
  const renderedMessage = previewRecipient ? safeRender(message, previewRecipient) : message

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
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Preview for:</span>
            <select
              value={previewRecipient?.email || ''}
              onChange={(e) => setSelectedEmail(e.target.value)}
              className="rounded border border-border bg-surface-2 px-2 py-1 text-sm"
            >
              {(recipients || []).map((recipient) => (
                <option key={recipient.email} value={recipient.email}>
                  {recipient.name ? `${recipient.name} (${recipient.email})` : recipient.email}
                </option>
              ))}
            </select>
          </div>
          <p><span className="text-text-secondary">From:</span> {sender || 'sender@email.com'}</p>
          <div className="space-y-1">
            <p className="text-text-secondary">To:</p>
            <div className="flex flex-wrap gap-2">
              {recipients.length ? recipients.map((r) => <Badge key={r.email} status="info">{r.email}</Badge>) : <span className="text-text-secondary">No recipients</span>}
            </div>
          </div>
          <p>
            <span className="text-text-secondary">Subject:</span>{' '}
            {previewRecipient ? (
              <strong>{renderedSubject || '(No subject)'}</strong>
            ) : (
              <strong dangerouslySetInnerHTML={{ __html: highlightVariables(renderedSubject || '(No subject)') }} />
            )}
          </p>
          <div className="max-h-64 overflow-auto whitespace-pre-wrap rounded border border-border bg-surface-2 p-3 text-sm">
            {previewRecipient ? (
              renderedMessage || 'No message body.'
            ) : (
              <span dangerouslySetInnerHTML={{ __html: highlightVariables(renderedMessage || 'No message body.') }} />
            )}
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
