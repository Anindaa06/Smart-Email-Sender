const sizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
}

const Spinner = ({ size = 'md', color = 'var(--accent)', fullPage = false }) => {
  const spinner = (
    <svg className={`animate-spin ${sizes[size] || sizes.md}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color }} aria-label="Loading">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" className="opacity-90" />
    </svg>
  )

  if (fullPage) {
    return <div className="flex min-h-screen items-center justify-center bg-bg">{spinner}</div>
  }

  return spinner
}

export default Spinner
