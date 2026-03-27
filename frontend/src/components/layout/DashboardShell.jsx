import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const DashboardShell = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev)
    } else {
      setIsDesktopCollapsed((prev) => !prev)
    }
  }

  const showSidebar = isMobile ? isMobileOpen : true

  return (
    <div className="min-h-screen bg-bg text-text-primary md:flex">
      {showSidebar ? (
        <div className={`fixed inset-y-0 left-0 z-40 md:static ${isMobile ? 'translate-x-0' : ''}`}>
          <Sidebar collapsed={!isMobile && isDesktopCollapsed} />
        </div>
      ) : null}

      {isMobileOpen ? <button type="button" className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setIsMobileOpen(false)} /> : null}

      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <TopBar onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

export default DashboardShell
