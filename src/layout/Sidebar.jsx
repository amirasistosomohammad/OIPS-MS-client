import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const Sidebar = ({ user, onCloseSidebar, unreadDueNotificationCount = 0 }) => {
  const location = useLocation()

  const isActiveLink = (href) => {
    const normalize = (path) => (path || '').replace(/\/+$/, '') || '/'
    return normalize(location.pathname) === normalize(href)
  }

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768 && onCloseSidebar) onCloseSidebar()
  }

  const handleMenuNavigation = () => {
    closeSidebarOnMobile()
  }

  const isAdmin = user?.role === 'admin' || user?.username === 'admin@admin.com'

  const menuSections = [
    {
      heading: 'OPERATIONS',
      items: [
        { icon: 'fas fa-tachometer-alt', label: 'Dashboard', href: '/dashboard' },
        { icon: 'fas fa-address-card', label: 'Beneficiary Registry', href: '/beneficiaries' },
        { icon: 'fas fa-link', label: 'Program Enrollments', href: '/enrollments' },
        { icon: 'fas fa-clipboard-check', label: 'Program Updates', href: '/program-updates' },
        { icon: 'fas fa-bell', label: 'Due Notifications', href: '/notifications' },
      ],
    },
    {
      heading: 'MASTER DATA',
      items: [{ icon: 'fas fa-cogs', label: 'Program Catalog', href: '/program-settings' }],
    },
    ...(isAdmin
      ? [
          {
            heading: 'SYSTEM ADMINISTRATION',
            items: [
              { icon: 'fas fa-user-shield', label: 'User Management', href: '/user-management' },
              { icon: 'fas fa-clipboard-list', label: 'Activity Logs', href: '/activity-logs' },
              { icon: 'fas fa-chart-line', label: 'Reports', href: '/reports' },
              { icon: 'fas fa-cog', label: 'System Settings', href: '/system-settings' },
            ],
          },
        ]
      : []),
  ]

  return (
    <nav className="sb-sidenav accordion sb-sidenav-dark" id="sidenavAccordion">
      <div className="sb-sidenav-menu">
        {menuSections.map((section) => (
          <React.Fragment key={section.heading}>
            <div className="sb-sidenav-menu-heading">{section.heading}</div>
            <ul className="nav">
              {section.items.map((item) => {
                const isActive = isActiveLink(item.href)
                const showDueBadge = item.href === '/notifications' && unreadDueNotificationCount > 0
                const showTrailing = showDueBadge || isActive
                return (
                  <li className="nav-item" key={item.href}>
                    <NavLink
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      to={item.href}
                      onClick={handleMenuNavigation}
                    >
                      <i className={`sb-nav-link-icon ${item.icon}`} />
                      <span className="sb-nav-link-label">{item.label}</span>
                      {showTrailing ? (
                        <span className="sb-nav-link-trailing">
                          {showDueBadge ? (
                            <span className="sb-nav-link-badge rounded-pill" title={`${unreadDueNotificationCount} unread due notification(s)`}>
                              {unreadDueNotificationCount > 99 ? '99+' : unreadDueNotificationCount}
                            </span>
                          ) : null}
                          {isActive ? <i className="fas fa-chevron-right sb-nav-link-arrow" aria-hidden /> : null}
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </React.Fragment>
        ))}
      </div>
      <div className="sb-sidenav-footer">
        <div className="small">Logged in as</div>
        <div className="user-name">{user?.name || user?.username || 'User'}</div>
        <div className="small text-white-50">{isAdmin ? 'System Administrator' : 'System User'}</div>
      </div>
    </nav>
  )
}

export default Sidebar