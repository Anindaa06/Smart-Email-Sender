import { Fragment, useEffect, useMemo, useState } from 'react'
import DashboardShell from '../components/layout/DashboardShell'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { getEmailLogs } from '../services/emailService'
import { pushToast } from '../hooks/useToast'

const statusTabs = ['all', 'success', 'partial', 'failed']

const Logs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await getEmailLogs(page)
        setLogs(data.logs)
        setPages(data.pages)
        setTotal(data.total)
      } catch (error) {
        pushToast('Failed to load logs', 'error')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [page])

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

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by subject" className="min-w-[260px]" />
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatus(tab)}
                className={`rounded-sm border px-3 py-2 text-sm transition-all duration-150 ${status === tab ? 'border-accent bg-accent-subtle text-accent' : 'border-border text-text-secondary hover:bg-surface-2'}`}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-surface-2" />
            ))}
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
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <Fragment key={log._id}>
                    <tr className="cursor-pointer border-b border-border/60 hover:bg-surface-2" onClick={() => setExpanded((prev) => ({ ...prev, [log._id]: !prev[log._id] }))}>
                      <td className="px-2 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-2 py-3">{log.subject}</td>
                      <td className="px-2 py-3">{log.recipients.length}</td>
                      <td className="px-2 py-3"><Badge status={log.status}>{log.status}</Badge></td>
                      <td className="px-2 py-3">{log.sentCount}/{log.failedCount}</td>
                    </tr>
                    {expanded[log._id] ? (
                      <tr>
                        <td colSpan={5} className="space-y-2 px-2 pb-3">
                          <div className="flex flex-wrap gap-2">
                            {log.recipients.map((recipient) => (
                              <span key={recipient} className="rounded-full border border-border bg-surface-2 px-2 py-1 text-xs">{recipient}</span>
                            ))}
                          </div>
                          {log.errorDetails ? <p className="text-xs text-error">Error: {log.errorDetails}</p> : null}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <span className="text-sm text-text-secondary">Page {page} of {pages}</span>
          <Button variant="ghost" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next</Button>
        </div>
      </Card>
    </DashboardShell>
  )
}

export default Logs
