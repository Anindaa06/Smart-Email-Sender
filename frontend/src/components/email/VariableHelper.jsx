import { useMemo } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const extractVariables = (text = '') => [...new Set([...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))]

const VariableHelper = ({ subject, message, recipients }) => {
  const variables = useMemo(() => {
    const fromSubject = extractVariables(subject)
    const fromMessage = extractVariables(message)
    return [...new Set([...fromSubject, ...fromMessage])]
  }, [subject, message])

  if (!variables.length) return null

  return (
    <div className="rounded border border-border bg-surface-2 p-3">
      <p className="mb-2 text-sm text-text-secondary">Use {'{{name}}'}, {'{{company}}'} to personalize each email</p>
      <div className="flex flex-wrap gap-2">
        {variables.map((name) => {
          const allHaveField = recipients.length > 0 && recipients.every((r) => String(r?.[name] ?? '').trim())
          return (
            <span key={name} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${allHaveField ? 'border-success/40 bg-success/10 text-success' : 'border-warning/40 bg-warning/10 text-warning'}`}>
              {allHaveField ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />} {name}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default VariableHelper
