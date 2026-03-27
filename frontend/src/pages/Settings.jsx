import { useEffect, useState } from 'react'
import DashboardShell from '../components/layout/DashboardShell'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { getPreferences, updatePreferences } from '../services/authService'
import { pushToast } from '../hooks/useToast'

const Settings = () => {
  const [prefs, setPrefs] = useState({ batchSize: 10, delayBetweenBatches: 1000, maxRetriesPerEmail: 3 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getPreferences()
        setPrefs(data.preferences)
      } catch {
        pushToast('Failed to load preferences', 'error')
      }
    }

    load()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await updatePreferences(prefs)
      pushToast('Preferences saved successfully', 'success')
    } catch {
      pushToast('Failed to save preferences', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell>
      <Card className="max-w-2xl">
        <h2 className="mb-4 font-display text-3xl italic">Sending Preferences</h2>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-text-secondary">Batch Size: {prefs.batchSize} emails per batch</label>
            <input type="range" min={1} max={100} value={prefs.batchSize} onChange={(e) => setPrefs((p) => ({ ...p, batchSize: Number(e.target.value) }))} className="w-full" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-text-secondary">Delay Between Batches: {(prefs.delayBetweenBatches / 1000).toFixed(1)} seconds</label>
            <input type="range" min={500} max={30000} step={500} value={prefs.delayBetweenBatches} onChange={(e) => setPrefs((p) => ({ ...p, delayBetweenBatches: Number(e.target.value) }))} className="w-full" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-text-secondary">Max Retries</label>
            <select value={prefs.maxRetriesPerEmail} onChange={(e) => setPrefs((p) => ({ ...p, maxRetriesPerEmail: Number(e.target.value) }))} className="rounded border border-border bg-surface-2 px-3 py-2">
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <Button onClick={save} isLoading={saving}>Save Preferences</Button>
        </div>
      </Card>
    </DashboardShell>
  )
}

export default Settings
