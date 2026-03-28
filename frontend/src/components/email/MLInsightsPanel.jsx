import { useState } from 'react'
import { Brain, Sparkles } from 'lucide-react'
import Button from '../ui/Button'
import { analyzeEmail } from '../../services/mlService'
import { pushToast } from '../../hooks/useToast'

const MLInsightsPanel = ({ subject, message, recipientCount }) => {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const { data } = await analyzeEmail({
        subject,
        body: message,
        recipientCount,
        sendTime: null,
      })
      setInsights(data)
    } catch {
      pushToast('ML analysis is currently unavailable', 'warning')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded border border-border bg-surface-2 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold"><Brain size={16} /> ML Insights</h3>
        <Button size="sm" variant="ghost" onClick={runAnalysis} isLoading={loading}>
          <Sparkles size={14} /> Analyze
        </Button>
      </div>

      {insights ? (
        <div className="space-y-2 text-xs text-text-secondary">
          <p>Spam probability: <span className="text-text-primary">{Math.round((insights.spam?.spam_probability || 0) * 100)}%</span></p>
          <p>Best send time: <span className="text-text-primary">{insights.sendTime?.recommended_day_name || '-'} {insights.sendTime?.recommended_hour ?? ''}:00</span></p>
          <p>Performance tier: <span className="text-text-primary">{insights.performance?.performance_tier || '-'}</span></p>
          <ul className="list-disc pl-4">
            {(insights.performance?.suggestions || []).map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-text-secondary">Run analysis to preview spam risk, send-time recommendation, and expected performance.</p>
      )}
    </div>
  )
}

export default MLInsightsPanel
