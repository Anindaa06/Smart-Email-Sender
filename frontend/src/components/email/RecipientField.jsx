import { Check, X } from 'lucide-react'
import { isValidEmail } from '../../utils/validators'
import Input from '../ui/Input'

const RecipientField = ({ recipient, onChange, onRemove, index, disabled }) => {
  const valid = recipient.email && isValidEmail(recipient.email)

  return (
    <div className="fade-slide-up space-y-1">
      <div className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
        <Input
          label={`Recipient ${index + 1} Email`}
          value={recipient.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="recipient@example.com"
          rightIcon={valid ? <Check size={14} className="text-success" /> : null}
          error={recipient.error}
          disabled={disabled}
        />
        <Input
          label="Name"
          value={recipient.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Jane"
          disabled={disabled}
        />
        <Input
          label="Company"
          value={recipient.company || ''}
          onChange={(e) => onChange({ company: e.target.value })}
          placeholder="Acme"
          disabled={disabled}
        />
        <button type="button" onClick={onRemove} disabled={disabled} className="mt-8 inline-flex h-10 w-10 items-center justify-center rounded border border-border bg-surface-2 text-text-secondary transition-all duration-150 hover:bg-error/10 hover:text-error">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default RecipientField
