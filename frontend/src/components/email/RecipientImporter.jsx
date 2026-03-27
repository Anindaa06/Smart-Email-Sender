import { useMemo, useState } from 'react'
import Handlebars from 'handlebars'
import { AlertCircle, Upload } from 'lucide-react'
import Button from '../ui/Button'
import { uploadRecipients } from '../../services/emailService'
import { pushToast } from '../../hooks/useToast'

const RecipientImporter = ({ onImport }) => {
  const [file, setFile] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState(null)
  const [showSkipped, setShowSkipped] = useState(false)

  const handleSelect = (selectedFile) => {
    if (!selectedFile) return
    const valid = selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx')
    if (!valid) {
      pushToast('Only CSV and Excel files are supported', 'error')
      return
    }
    setFile(selectedFile)
  }

  const summary = useMemo(() => {
    if (!result) return ''
    return `${result.validCount} recipients imported • ${result.invalidCount} rows skipped`
  }, [result])

  const parseFile = async () => {
    if (!file) return
    setParsing(true)
    try {
      const { data } = await uploadRecipients(file)
      setResult(data)
      onImport(data.valid || [])
      pushToast('Recipients imported successfully', 'success')
    } catch (error) {
      pushToast(error.response?.data?.message || 'Failed to parse file', 'error')
    } finally {
      setParsing(false)
    }
  }

  const sampleRender = (template, row) => {
    try {
      return Handlebars.compile(template || '', { strict: false })(row || {})
    } catch {
      return template || ''
    }
  }

  return (
    <div className="rounded border border-dashed border-border bg-surface-2 p-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded border border-border/60 bg-surface px-4 py-6 text-center transition-all duration-150 hover:border-accent/50">
        <Upload size={18} className="text-accent" />
        <p className="text-sm text-text-primary">Drop CSV or Excel file here, or click to browse</p>
        <p className="text-xs text-text-secondary">Accepted formats: .csv, .xlsx</p>
        <input type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => handleSelect(e.target.files?.[0])} />
      </label>

      {file ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <p className="font-medium">{file.name}</p>
            <p className="text-text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <Button onClick={parseFile} isLoading={parsing}>Parse File</Button>
        </div>
      ) : null}

      {result ? (
        <div className="mt-3 space-y-2 text-sm">
          <p className="font-medium text-success">{summary}</p>
          {result.invalidCount > 0 ? (
            <div>
              <button type="button" className="text-accent" onClick={() => setShowSkipped((prev) => !prev)}>
                {showSkipped ? 'Hide skipped rows' : 'Show skipped rows'}
              </button>
              {showSkipped ? (
                <div className="mt-2 space-y-1 rounded border border-border bg-surface p-2">
                  {result.invalid.map((item) => (
                    <p key={`${item.rowNumber}-${item.reason}`} className="text-xs text-warning">
                      <AlertCircle size={12} className="mr-1 inline" /> Row {item.rowNumber}: {item.reason}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {result.valid?.[0] ? (
            <p className="text-xs text-text-secondary">Sample rendered preview: {sampleRender('Hello {{name}}', result.valid[0])}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default RecipientImporter
