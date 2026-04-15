import React, { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { DUE_NOTIFICATIONS_CHANGED_EVENT, getDashboardData } from '../services/adminApi'

const Layout = ({ user, onLogout }) => {
  const [sidebarToggled, setSidebarToggled] = React.useState(false)
  const [unreadDueNotificationCount, setUnreadDueNotificationCount] = useState(0)
  const location = useLocation()

  const refreshUnreadDueNotifications = useCallback(async () => {
    if (!user) {
      setUnreadDueNotificationCount(0)
      return
    }
    try {
      const data = await getDashboardData()
      setUnreadDueNotificationCount(Number(data?.stats?.notifications_open) || 0)
    } catch {
      /* keep last known count on transient errors */
    }
  }, [user])

  useEffect(() => {
    refreshUnreadDueNotifications()
  }, [refreshUnreadDueNotifications])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handler = () => {
      refreshUnreadDueNotifications()
    }
    window.addEventListener(DUE_NOTIFICATIONS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(DUE_NOTIFICATIONS_CHANGED_EVENT, handler)
  }, [refreshUnreadDueNotifications])

  const toggleSidebar = () => setSidebarToggled((previous) => !previous)
  const closeSidebar = () => setSidebarToggled(false)

  const handleMainClick = () => {
    if (window.innerWidth < 768 && sidebarToggled) closeSidebar()
  }

  useEffect(() => {
    const body = document.body
    if (sidebarToggled) body.classList.add('sb-sidenav-toggled')
    else body.classList.remove('sb-sidenav-toggled')
    return () => body.classList.remove('sb-sidenav-toggled')
  }, [sidebarToggled])

  useEffect(() => {
    // Route changes should never stay blocked by stale overlays/modals.
    const closeSidebarFrame = window.requestAnimationFrame(() => {
      setSidebarToggled(false)
    })
    Swal.close()
    document.body.classList.remove('swal2-shown', 'swal2-height-auto')
    document.documentElement.classList.remove('swal2-shown', 'swal2-height-auto')
    return () => window.cancelAnimationFrame(closeSidebarFrame)
  }, [location.pathname])

  return (
    <div className="sb-nav-fixed">
      <Topbar user={user} onToggleSidebar={toggleSidebar} onLogout={onLogout} />
      <div id="layoutSidenav">
        <div id="layoutSidenav_nav">
          <Sidebar user={user} onCloseSidebar={closeSidebar} unreadDueNotificationCount={unreadDueNotificationCount} />
        </div>
        <div id="layoutSidenav_content" onClick={handleMainClick} role="presentation">
          <main>
            <div className="container-fluid page-enter py-4">
              <Outlet key={location.pathname} />
            </div>
          </main>
          <Footer />
        </div>
      </div>
      {sidebarToggled && window.innerWidth < 768 ? (
        <div className="mobile-sidebar-overlay" onClick={closeSidebar} onKeyDown={() => {}} role="button" tabIndex={0} aria-label="Close menu" />
      ) : null}
    </div>
  )
}

export default Layout