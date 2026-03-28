import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardShell from '../components/layout/DashboardShell'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import RecipientList from '../components/email/RecipientList'
import EmailComposer from '../components/email/EmailComposer'
import EmailPreviewModal from '../components/email/EmailPreviewModal'
import RecipientImporter from '../components/email/RecipientImporter'
import VariableHelper from '../components/email/VariableHelper'
import ScheduleModal from '../components/email/ScheduleModal'
import SendingProgress from '../components/email/SendingProgress'
import MLInsightsPanel from '../components/email/MLInsightsPanel'
import useAuth from '../hooks/useAuth'
import { pushToast } from '../hooks/useToast'
import { sendBulkEmail } from '../services/emailService'

const blankRecipient = () => ({ id: Date.now() + Math.random(), email: '', name: '', company: '', error: '' })

const Compose = () => {
  const navigate = useNavigate()
  const { smtpConfig, updateSmtpConfig } = useAuth()
  const [smtpForm, setSmtpForm] = useState({
    host: smtpConfig.host || '',
    port: smtpConfig.port || 587,
    user: smtpConfig.user || '',
    pass: smtpConfig.pass || '',
  })
  const [showSmtp, setShowSmtp] = useState(true)
  const [showPass, setShowPass] = useState(false)
  const [recipients, setRecipients] = useState([blankRecipient()])
  const [validRecipients, setValidRecipients] = useState([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [progressJob, setProgressJob] = useState(null)

  const canSend = useMemo(() => validRecipients.length > 0 && subject.trim() && message.trim(), [validRecipients, subject, message])

  const handleSaveConfig = async () => {
    try {
      await updateSmtpConfig(smtpForm)
      pushToast('SMTP config saved successfully', 'success')
    } catch (error) {
      pushToast(error.response?.data?.message || 'Failed to save SMTP config', 'error')
    }
  }

  const handleImport = (importedRecipients) => {
    setRecipients((prev) => {
      const existing = new Set(prev.map((item) => String(item.email || '').toLowerCase()))
      const merged = [...prev]
      importedRecipients.forEach((recipient, index) => {
        const email = String(recipient.email || '').toLowerCase()
        if (!email || existing.has(email)) return
        existing.add(email)
        merged.push({ id: Date.now() + index + Math.random(), ...recipient, email, error: '' })
      })
      return merged
    })
  }

  const handleSend = async () => {
    if (!canSend) {
      pushToast('Please add recipients, subject and message', 'warning')
      return
    }

    setIsSending(true)

    try {
      const { data } = await sendBulkEmail({ recipients: validRecipients, subject, message })
      setProgressJob({ jobId: data.jobId, total: data.total, logId: data.logId })
      pushToast('Sending started. Live progress is now active.', 'info')
      setIsPreviewOpen(false)
    } catch (error) {
      pushToast(error.response?.data?.message || 'Failed to send email', 'error')
      setIsSending(false)
    }
  }

  const emailPayload = {
    recipients: validRecipients,
    subject,
    message,
  }

  return (
    <DashboardShell>
      <div className={`grid gap-4 xl:grid-cols-[1.2fr_1fr] ${isSending ? 'opacity-95' : ''}`}>
        <div className="space-y-4">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sender Configuration</h2>
              <button type="button" className="text-text-secondary" onClick={() => setShowSmtp((prev) => !prev)} disabled={isSending}>
                {showSmtp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>

            {showSmtp ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="SMTP Host" value={smtpForm.host} onChange={(e) => setSmtpForm((p) => ({ ...p, host: e.target.value }))} placeholder="smtp.gmail.com" disabled={isSending} />
                <Input label="Port" type="number" value={smtpForm.port} onChange={(e) => setSmtpForm((p) => ({ ...p, port: e.target.value }))} disabled={isSending} />
                <Input label="Sender Email" value={smtpForm.user} onChange={(e) => setSmtpForm((p) => ({ ...p, user: e.target.value }))} placeholder="you@gmail.com" disabled={isSending} />
                <Input
                  label="App Password"
                  type={showPass ? 'text' : 'password'}
                  value={smtpForm.pass}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, pass: e.target.value }))}
                  rightIcon={<button type="button" onClick={() => setShowPass((prev) => !prev)} className="text-xs">{showPass ? 'Hide' : 'Show'}</button>}
                  disabled={isSending}
                />
                <div className="md:col-span-2">
                  <Button onClick={handleSaveConfig} disabled={isSending}>Save Configuration</Button>
                </div>
              </div>
            ) : null}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recipients</h2>
              <span className="rounded-full border border-border bg-surface-2 px-2 py-1 text-xs text-text-secondary">{validRecipients.length} valid recipients</span>
            </div>
            <div className="space-y-4">
              <RecipientImporter onImport={handleImport} />
              <RecipientList recipients={recipients} setRecipients={setRecipients} onChange={setValidRecipients} disabled={isSending} />
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold">Compose</h2>
            <EmailComposer subject={subject} setSubject={setSubject} message={message} setMessage={setMessage} />
            <div className="mt-3">
              <VariableHelper subject={subject} message={message} recipients={validRecipients} />
            </div>
            <div className="mt-3">
              <MLInsightsPanel subject={subject} message={message} recipientCount={validRecipients.length} />
            </div>

            <div className="sticky bottom-0 mt-4 flex flex-wrap gap-2 bg-surface pt-3">
              <Button variant="ghost" onClick={() => setIsPreviewOpen(true)} disabled={!canSend || isSending}>Preview Email</Button>
              <Button variant="ghost" onClick={() => setIsScheduleOpen(true)} disabled={!canSend || isSending}>Schedule Send</Button>
              <Button onClick={handleSend} isLoading={isSending && !progressJob} disabled={!canSend || isSending}>
                Send to All ({validRecipients.length})
              </Button>
            </div>

            {progressJob ? (
              <div className="mt-3 space-y-2">
                <SendingProgress
                  jobId={progressJob.jobId}
                  total={progressJob.total}
                  onComplete={(data) => {
                    setIsSending(false)
                    pushToast(`Send completed: ${data.sent || 0} sent, ${data.failed || 0} failed`, 'success')
                  }}
                />
                <Button variant="ghost" onClick={() => navigate('/logs')}>View in Logs</Button>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="hidden xl:block">
          <Card className="sticky top-6">
            <h2 className="mb-3 text-lg font-semibold">Email Preview</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-text-secondary">From:</span> {smtpForm.user || <span className="italic text-text-secondary">Not set</span>}</p>
              <p><span className="text-text-secondary">To:</span> {validRecipients.length ? validRecipients.map((r) => r.email).join(', ') : <span className="italic text-text-secondary">No recipients yet</span>}</p>
              <p><span className="text-text-secondary">Subject:</span> {subject || <span className="italic text-text-secondary">No subject</span>}</p>
              <div className="min-h-[180px] whitespace-pre-wrap rounded border border-border bg-surface-2 p-3">{message || <span className="italic text-text-secondary">Start writing your message...</span>}</div>
            </div>
          </Card>
        </div>
      </div>

      <EmailPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onConfirm={handleSend}
        sender={smtpForm.user}
        recipients={validRecipients}
        subject={subject}
        message={message}
        isSending={isSending}
      />

      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        emailData={emailPayload}
      />
    </DashboardShell>
  )
}

export default Compose
