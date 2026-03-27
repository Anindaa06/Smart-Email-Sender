import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import DashboardShell from '../components/layout/DashboardShell'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import RecipientList from '../components/email/RecipientList'
import EmailComposer from '../components/email/EmailComposer'
import EmailPreviewModal from '../components/email/EmailPreviewModal'
import useAuth from '../hooks/useAuth'
import { pushToast } from '../hooks/useToast'
import { sendBulkEmail } from '../services/emailService'

const Compose = () => {
  const { smtpConfig, updateSmtpConfig } = useAuth()
  const [smtpForm, setSmtpForm] = useState({
    host: smtpConfig.host || '',
    port: smtpConfig.port || 587,
    user: smtpConfig.user || '',
    pass: smtpConfig.pass || '',
  })
  const [showSmtp, setShowSmtp] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [recipients, setRecipients] = useState([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendingProgress, setSendingProgress] = useState({ sent: 0, total: 0 })

  const canSend = useMemo(() => recipients.length > 0 && subject.trim() && message.trim(), [recipients, subject, message])

  const handleSaveConfig = async () => {
    try {
      await updateSmtpConfig(smtpForm)
      pushToast('SMTP config saved successfully', 'success')
    } catch (error) {
      pushToast(error.response?.data?.message || 'Failed to save SMTP config', 'error')
    }
  }

  const handleSend = async () => {
    if (!canSend) {
      pushToast('Please add recipients, subject and message', 'warning')
      return
    }

    setIsSending(true)
    setSendingProgress({ sent: 0, total: recipients.length })

    try {
      const { data } = await sendBulkEmail({ recipients, subject, message })
      setSendingProgress({ sent: data.sent, total: data.total })
      if (data.failed > 0) {
        pushToast(`Sent to ${data.sent} recipients, ${data.failed} failed`, 'warning')
      } else {
        pushToast(`? Sent to ${data.sent} recipients`, 'success')
      }
      setIsPreviewOpen(false)
    } catch (error) {
      pushToast(error.response?.data?.message || 'Failed to send email', 'error')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <DashboardShell>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sender Configuration</h2>
              <button type="button" className="text-text-secondary" onClick={() => setShowSmtp((prev) => !prev)}>
                {showSmtp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>

            {showSmtp ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="SMTP Host" value={smtpForm.host} onChange={(e) => setSmtpForm((p) => ({ ...p, host: e.target.value }))} placeholder="smtp.gmail.com" />
                <Input label="Port" type="number" value={smtpForm.port} onChange={(e) => setSmtpForm((p) => ({ ...p, port: e.target.value }))} />
                <Input label="Sender Email" value={smtpForm.user} onChange={(e) => setSmtpForm((p) => ({ ...p, user: e.target.value }))} placeholder="you@gmail.com" />
                <Input
                  label="App Password"
                  type={showPass ? 'text' : 'password'}
                  value={smtpForm.pass}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, pass: e.target.value }))}
                  rightIcon={<button type="button" onClick={() => setShowPass((prev) => !prev)} className="text-xs">{showPass ? 'Hide' : 'Show'}</button>}
                />
                <div className="md:col-span-2">
                  <Button onClick={handleSaveConfig}>Save Configuration</Button>
                </div>
              </div>
            ) : null}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recipients</h2>
              <span className="rounded-full border border-border bg-surface-2 px-2 py-1 text-xs text-text-secondary">{recipients.length} recipients</span>
            </div>
            <RecipientList onChange={setRecipients} />
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold">Compose</h2>
            <EmailComposer subject={subject} setSubject={setSubject} message={message} setMessage={setMessage} />
            <div className="sticky bottom-0 mt-4 flex flex-wrap gap-2 bg-surface pt-3">
              <Button variant="ghost" onClick={() => setIsPreviewOpen(true)}>Preview Email</Button>
              <Button onClick={handleSend} isLoading={isSending} disabled={!canSend}>
                {isSending ? `Sending... (${sendingProgress.sent}/${sendingProgress.total})` : `Send to All ${recipients.length ? `(${recipients.length})` : ''} Recipients`}
              </Button>
            </div>
          </Card>
        </div>

        <div className="hidden xl:block">
          <Card className="sticky top-6">
            <h2 className="mb-3 text-lg font-semibold">Email Preview</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-text-secondary">From:</span> {smtpForm.user || <span className="italic text-text-secondary">Not set</span>}</p>
              <p><span className="text-text-secondary">To:</span> {recipients.length ? recipients.join(', ') : <span className="italic text-text-secondary">No recipients yet</span>}</p>
              <p><span className="text-text-secondary">Subject:</span> {subject || <span className="italic text-text-secondary">No subject</span>}</p>
              <div className="min-h-[180px] whitespace-pre-wrap rounded border border-border bg-surface-2 p-3">{message || <span className="italic text-text-secondary">Start writing your message...</span>}</div>
            </div>
          </Card>
        </div>
      </div>

      <EmailPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} onConfirm={handleSend} sender={smtpForm.user} recipients={recipients} subject={subject} message={message} isSending={isSending} />
    </DashboardShell>
  )
}

export default Compose
