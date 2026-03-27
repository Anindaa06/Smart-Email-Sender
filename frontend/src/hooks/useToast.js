import { useCallback, useEffect, useState } from 'react'

let subscribers = []

export const pushToast = (message, type = 'info') => {
  subscribers.forEach((fn) => fn({ message, type }))
}

const useToast = () => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])

  useEffect(() => {
    const listener = (payload) => showToast(payload.message, payload.type)
    subscribers.push(listener)
    return () => {
      subscribers = subscribers.filter((fn) => fn !== listener)
    }
  }, [showToast])

  return { toasts, showToast, removeToast }
}

export default useToast
