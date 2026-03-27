import { useEffect } from 'react'
import { isValidEmail } from '../../utils/validators'
import { pushToast } from '../../hooks/useToast'
import Button from '../ui/Button'
import RecipientField from './RecipientField'

const RecipientList = ({ recipients, setRecipients, onChange, disabled = false }) => {
  useEffect(() => {
    const validRecipients = recipients
      .filter((item) => isValidEmail(item.email || ''))
      .map((item) => {
        const { id, error, ...rest } = item
        return { ...rest, email: item.email.trim().toLowerCase() }
      })
    onChange(validRecipients)
  }, [recipients, onChange])

  const addRecipient = () => {
    if (recipients.length >= 50) {
      pushToast('Maximum 50 recipients allowed', 'warning')
      return
    }
    setRecipients((prev) => [...prev, { id: Date.now() + Math.random(), email: '', name: '', company: '', error: '' }])
  }

  const removeRecipient = (id) => {
    if (recipients.length === 1) {
      pushToast('At least one recipient field is required', 'warning')
      return
    }
    setRecipients((prev) => prev.filter((item) => item.id !== id))
  }

  const updateRecipient = (id, patch) => {
    setRecipients((prev) => prev.map((item) => {
      if (item.id !== id) return item
      const next = { ...item, ...patch }
      const email = String(next.email || '')
      next.error = email && !isValidEmail(email) ? 'Invalid email address' : ''
      return next
    }))
  }

  return (
    <div className="space-y-3">
      {recipients.map((recipient, index) => (
        <RecipientField
          key={recipient.id}
          recipient={recipient}
          index={index}
          onChange={(patch) => updateRecipient(recipient.id, patch)}
          onRemove={() => removeRecipient(recipient.id)}
          disabled={disabled}
        />
      ))}
      <Button variant="ghost" onClick={addRecipient} disabled={disabled}>+ Add Recipient</Button>
    </div>
  )
}

export default RecipientList
