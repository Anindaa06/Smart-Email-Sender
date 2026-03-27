import { Fragment, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock3, Loader2, RotateCcw } from 'lucide-react'
import DashboardShell from '../components/layout/DashboardShell'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { getEmailLogs, retryFailedEmails } from '../services/emailService'
import { cancelScheduledEmail, getScheduledEmails } from '../services/scheduleService'
import { pushToast } from '../hooks/useToast'

const statusTabs = ['all', 'success', 'partial', 'failed']

const renderRecipientStatus = (recipient) => {
  const status = recipient.status || 'pending'
  if (status === 'sent') return <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 size={12} /> sent</span>
  if (status === 'failed') return <span className="inline-flex items-center gap-1 text-error"><AlertCircle size={12} /> failed</span>
  if (status === 'retrying') return <span className="inline-flex items-center gap-1 text-warning"><Loader2 size={12} className="animate-spin" /> retry {Math.min(recipient.attempts || 0, 5)}/5</span>
  return <span className="inline-flex items-center gap-1 text-text-secondary"><Clock3 size={12} /> pending</span>
}

const normalizeRecipients = (recipients = []) => recipients.map((recipient) => (typeof recipient === 'string' ? { email: recipient, status: 'sent', attempts: 1 } : recipient))

const Logs = () => {
  const [activeTab, setActiveTab] = useState('sent')
  const [logs, setLogs] = useState([])
  const [scheduled, setScheduled] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [expanded, setExpanded] = useState({})

  const loadLogs = async () => {
    setLoading(true)
    try {
      const { data } = await getEmailLogs(page)
      setLogs(data.logs)
      setPages(data.pages)
      setTotal(data.total)
    } catch {
      pushToast('Failed to load logs', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadScheduled = async () => {
    try {
      const { data } = await getScheduledEmails()
      setScheduled(data.jobs || [])
    } catch {
      pushToast('Failed to load scheduled emails', 'error')
    }
  }

  useEffect(() => {
    loadLogs()
  }, [page])

  useEffect(() => {
    loadScheduled()
    const timer = setInterval(loadScheduled, 30000)
    return () => clearInterval(timer)
  }, [])

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const subjectMatch = log.subject.toLowerCase().includes(query.toLowerCase())
      const statusMatch = status === 'all' || log.status === status
      return subjectMatch && statusMatch
    })
  }, [logs, query, status])

  return (
    <DashboardShell>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl italic">Email Logs</h2>
          <Badge status="info">Total {total}</Badge>
        </div>

        <div className="mb-4 flex gap-2">
          <Button variant={activeTab === 'sent' ? 'primary' : 'ghost'} onClick={() => setActiveTab('sent')}>Sent Logs</Button>
          <Button variant={activeTab === 'scheduled' ? 'primary' : 'ghost'} onClick={() => setActiveTab('scheduled')}>Scheduled Emails</Button>
        </div>

        {activeTab === 'sent' ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by subject" className="min-w-[260px]" />
              <div className="flex flex-wrap gap-2">
                {statusTabs.map((tab) => (
                  <button key={tab} type="button" onClick={() => setStatus(tab)} className={`rounded-sm border px-3 py-2 text-sm transition-all duration-150 ${status === tab ? 'border-accent bg-accent-subtle text-accent' : 'border-border text-text-secondary hover:bg-surface-2'}`}>
                    {tab[0].toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded bg-surface-2" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-14 text-center text-text-secondary">No logs match the current filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-secondary">
                      <th className="px-2 py-2">Timestamp</th>
                      <th className="px-2 py-2">Subject</th>
                      <th className="px-2 py-2">Recipients</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Sent/Failed</th>
                      <th className="px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((log) => {
                      const recipients = normalizeRecipients(log.recipients)
                      return (
                        <Fragment key={log._id}>
                          <tr className="cursor-pointer border-b border-border/60 hover:bg-surface-2" onClick={() => setExpanded((prev) => ({ ...prev, [log._id]: !prev[log._id] }))}>
                            <td className="px-2 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="px-2 py-3">{log.subject}</td>
                            <td className="px-2 py-3">{recipients.length}</td>
                            <td className="px-2 py-3"><Badge status={log.status}>{log.status}</Badge></td>
                            <td className="px-2 py-3">{log.sentCount}/{log.failedCount}</td>
                            <td className="px-2 py-3">
                              {(log.status === 'partial' || log.status === 'failed') ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    try {
                                      await retryFailedEmails(log._id)
                                      pushToast('Retry triggered successfully', 'success')
                                      loadLogs()
                                    } catch {
                                      pushToast('Failed to trigger retry', 'error')
                                    }
                                  }}
                                >
                                  <RotateCcw size={14} /> Retry Failed
                                </Button>
                              ) : null}
                            </td>
                          </tr>
                          {expanded[log._id] ? (
                            <tr>
                              <td colSpan={6} className="space-y-2 px-2 pb-3">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-text-secondary">
                                      <th className="py-1 text-left">Email</th>
                                      <th className="py-1 text-left">Status</th>
                                      <th className="py-1 text-left">Attempts</th>
                                      <th className="py-1 text-left">Next Retry</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {recipients.map((recipient) => (
                                      <tr key={`${log._id}-${recipient.email}`}>
                                        <td className="py-1">{recipient.email}</td>
                                        <td className="py-1">{renderRecipientStatus(recipient)}</td>
                                        <td className="py-1">{recipient.attempts || 0}</td>
                                        <td className="py-1">{recipient.nextRetryAt ? new Date(recipient.nextRetryAt).toLocaleString() : '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {log.errorDetails ? <p className="text-xs text-error">Error: {log.errorDetails}</p> : null}
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <span className="text-sm text-text-secondary">Page {page} of {pages}</span>
              <Button variant="ghost" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next</Button>
            </div>
          </>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="px-2 py-2">Scheduled For</th>
                  <th className="px-2 py-2">Subject</th>
                  <th className="px-2 py-2">Recipients</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scheduled.map((job) => (
                  <tr key={job._id} className="border-b border-border/60">
                    <td className="px-2 py-3">{new Date(job.scheduledAt).toLocaleString()}</td>
                    <td className="px-2 py-3">{job.subject}</td>
                    <td className="px-2 py-3">{job.recipientCount}</td>
                    <td className="px-2 py-3"><Badge status={job.status === 'sent' ? 'success' : job.status === 'failed' ? 'failed' : 'info'}>{job.status}</Badge></td>
                    <td className="px-2 py-3">
                      {job.status === 'pending' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            try {
                              await cancelScheduledEmail(job._id)
                              pushToast('Scheduled job cancelled', 'success')
                              loadScheduled()
                            } catch {
                              pushToast('Failed to cancel scheduled job', 'error')
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      ) : null}
                      {job.status === 'sent' && job.emailLogId ? (
                        <Button size="sm" variant="ghost" onClick={() => setActiveTab('sent')}>View Log</Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardShell>
  )
}

export default Logs
