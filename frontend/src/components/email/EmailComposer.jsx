import Input from '../ui/Input'

const EmailComposer = ({ subject, setSubject, message, setMessage }) => {
  return (
    <div className="space-y-4">
      <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Quarterly update" />
      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[180px] w-full rounded border border-border bg-surface-2 p-4 font-sans text-text-primary outline-none transition-all duration-150 focus:border-accent focus:ring-2 focus:ring-accent/40"
          placeholder="Write your email..."
        />
      </div>
    </div>
  )
}

export default EmailComposer
