import { Check, X } from 'lucide-react'
import { isValidEmail } from '../../utils/validators'
import Input from '../ui/Input'

const RecipientField = ({ value, onChange, onRemove, error, index }) => {
  const valid = value && isValidEmail(value)

  return (
    <div className="fade-slide-up space-y-1">
      <div className="flex items-start gap-2">
        <Input
          label={`Recipient ${index + 1}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="recipient@example.com"
          rightIcon={valid ? <Check size={14} className="text-success" /> : null}
          error={error}
          className="flex-1"
        />
        <button
          type="button"
          onClick={onRemove}
          className="mt-8 inline-flex h-10 w-10 items-center justify-center rounded border border-border bg-surface-2 text-text-secondary transition-all duration-150 hover:bg-error/10 hover:text-error"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default RecipientField
