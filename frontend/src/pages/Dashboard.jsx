import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import DashboardShell from '../components/layout/DashboardShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import { getEmailLogs } from '../services/emailService'
import { pushToast } from '../hooks/useToast'

const formatRelativeTime = (value) => {
  if (!value) return 'Never'
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true)
      try {
        const { data } = await getEmailLogs(1, 100)
        setLogs(data.logs || [])
      } catch (error) {
        pushToast('Failed to fetch dashboard activity', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [])

  const stats = useMemo(() => {
    const totalEmailsSent = logs.reduce((sum, log) => sum + (log.sentCount || 0), 0)
    const totalRecipients = logs.reduce((sum, log) => sum + (log.recipients?.length || 0), 0)
    const lastSent = logs[0]?.timestamp || null
    return { totalEmailsSent, totalRecipients, lastSent }
  }, [logs])

  return (
    <DashboardShell>
      <section className="grid gap-4 md:grid-cols-3">
        {[{ label: 'Total Emails Sent', value: stats.totalEmailsSent }, { label: 'Total Recipients Reached', value: stats.totalRecipients }, { label: 'Last Sent', value: formatRelativeTime(stats.lastSent) }].map((item) => (
          <Card key={item.label} hover>
            <p className="text-sm text-text-secondary">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{loading ? <Spinner size="sm" /> : item.value}</p>
          </Card>
        ))}
      </section>

      <section className="mt-5 flex flex-wrap gap-3">
        <Button onClick={() => navigate('/compose')}>Compose New Email</Button>
        <Button variant="ghost" onClick={() => navigate('/logs')}>View All Logs</Button>
      </section>

      <section className="mt-6">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Badge status="info">Last 5</Badge>
          </div>

          {loading ? (
            <div className="py-8 text-center text-text-secondary">Loading activity...</div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Inbox size={40} className="text-text-secondary" />
              <p className="text-text-secondary">No emails sent yet. Compose your first email!</p>
              <Button onClick={() => navigate('/compose')}>Compose First Email</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary">
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Subject</th>
                    <th className="px-2 py-2">Recipients</th>
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 5).map((log) => (
                    <Fragment key={log._id}>
                      <tr className="cursor-pointer border-b border-border/60 hover:bg-surface-2" onClick={() => setExpanded((prev) => ({ ...prev, [log._id]: !prev[log._id] }))}>
                        <td className="px-2 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-2 py-3">{log.subject}</td>
                        <td className="px-2 py-3">{log.recipients?.length || 0}</td>
                        <td className="px-2 py-3"><Badge status={log.status}>{log.status}</Badge></td>
                      </tr>
                      {expanded[log._id] ? (
                        <tr>
                          <td colSpan={4} className="px-2 pb-3 text-xs text-text-secondary">{log.recipients?.join(', ')}</td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </DashboardShell>
  )
}

export default Dashboard
