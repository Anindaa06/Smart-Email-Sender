import { useEffect, useMemo, useState } from 'react'
import { isValidEmail } from '../../utils/validators'
import { pushToast } from '../../hooks/useToast'
import Button from '../ui/Button'
import RecipientField from './RecipientField'

const RecipientList = ({ onChange }) => {
  const [items, setItems] = useState([{ id: Date.now(), value: '', error: '' }])

  const validRecipients = useMemo(() => items.filter((item) => isValidEmail(item.value)).map((item) => item.value.trim()), [items])

  useEffect(() => {
    onChange(validRecipients)
  }, [validRecipients, onChange])

  const addRecipient = () => {
    if (items.length >= 50) {
      pushToast('Maximum 50 recipients allowed', 'warning')
      return
    }
    setItems((prev) => [...prev, { id: Date.now() + Math.random(), value: '', error: '' }])
  }

  const removeRecipient = (id) => {
    if (items.length === 1) {
      pushToast('At least one recipient field is required', 'warning')
      return
    }
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateRecipient = (id, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, value, error: value && !isValidEmail(value) ? 'Invalid email address' : '' }
          : item,
      ),
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <RecipientField
          key={item.id}
          value={item.value}
          error={item.error}
          index={index}
          onChange={(value) => updateRecipient(item.id, value)}
          onRemove={() => removeRecipient(item.id)}
        />
      ))}
      <Button variant="ghost" onClick={addRecipient}>+ Add Recipient</Button>
    </div>
  )
}

export default RecipientList
