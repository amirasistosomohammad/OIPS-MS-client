import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import bagongPilipinasLogo from '../assets/Bagong Pilipinas Logo.png'
import dmwLogo from '../assets/DMW Logo.png'
import owwaLogo from '../assets/OWWA Regional Logo.png'
import { getPublicSystemSettings, publicStorageUrlFromPaths } from '../services/adminApi'

const BRAND_NAME = 'Overseas Workers Welfare Administration - Region 9'
const BRAND_TAGLINE = 'Integrated Programs and Services Monitoring System'

const DEFAULT_BRANDING = {
  topbar_title: BRAND_NAME,
  topbar_subtitle: BRAND_TAGLINE,
  logos: [bagongPilipinasLogo, dmwLogo, owwaLogo],
}

/** Keeps topbar stable across remounts (e.g. route changes) — no logo/title flash. */
let topbarBrandingCache = null

const Topbar = ({ user, onToggleSidebar, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [branding, setBranding] = useState(() => topbarBrandingCache || DEFAULT_BRANDING)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    let mounted = true
    getPublicSystemSettings()
      .then((data) => {
        if (!mounted) return
        const logoPaths = [
          publicStorageUrlFromPaths(data?.logo_primary_path, data?.logo_primary_url),
          publicStorageUrlFromPaths(data?.logo_secondary_path, data?.logo_secondary_url),
          publicStorageUrlFromPaths(data?.logo_tertiary_path, data?.logo_tertiary_url),
        ].filter(Boolean)
        const next = {
          topbar_title: data?.app_name || BRAND_NAME,
          topbar_subtitle: BRAND_TAGLINE,
          logos: logoPaths.length ? logoPaths : [bagongPilipinasLogo, dmwLogo, owwaLogo],
        }
        topbarBrandingCache = next
        setBranding(next)
      })
      .catch(() => {})

    const onUpdated = () => {
      getPublicSystemSettings()
        .then((data) => {
          if (!mounted) return
          const logoPaths = [
            publicStorageUrlFromPaths(data?.logo_primary_path, data?.logo_primary_url),
            publicStorageUrlFromPaths(data?.logo_secondary_path, data?.logo_secondary_url),
            publicStorageUrlFromPaths(data?.logo_tertiary_path, data?.logo_tertiary_url),
          ].filter(Boolean)
          const next = {
            topbar_title: data?.app_name || BRAND_NAME,
            topbar_subtitle: BRAND_TAGLINE,
            logos: logoPaths.length ? logoPaths : [bagongPilipinasLogo, dmwLogo, owwaLogo],
          }
          topbarBrandingCache = next
          setBranding(next)
        })
        .catch(() => {})
    }
    window.addEventListener('oipsms-settings-updated', onUpdated)
    return () => {
      mounted = false
      window.removeEventListener('oipsms-settings-updated', onUpdated)
    }
  }, [])

  const handleLogout = async () => {
    setShowDropdown(false)
    await onLogout?.()
  }

  return (
    <nav className={`sb-topnav navbar navbar-expand navbar-dark${showDropdown ? ' dropdown-open' : ''}`}>
      <Link to="/dashboard" className="navbar-brand d-flex align-items-center text-decoration-none">
        <div className="sb-topnav-logo-group sb-topnav-logo-gap flex-shrink-0">
          {branding.logos.map((logoSrc, index) => (
            <div className="sb-topnav-logo-circle" key={`${logoSrc}-${index}`}>
              <img src={logoSrc} alt={`Topbar Logo ${index + 1}`} className="sb-topnav-logo-img" />
            </div>
          ))}
        </div>
        <div className="d-flex flex-column sb-topnav-brand-text">
          <span className="sb-topnav-brand-name" title={branding.topbar_title}>{branding.topbar_title}</span>
          <span className="sb-topnav-brand-tagline d-none d-sm-inline">{branding.topbar_subtitle}</span>
        </div>
      </Link>

      <button
        type="button"
        className="btn btn-link text-decoration-none order-2 order-lg-0"
        id="sidebarToggle"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <i className="fas fa-bars" />
      </button>

      <ul className="navbar-nav ms-auto align-items-center">
        <li className="nav-item dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="nav-link dropdown-toggle d-flex align-items-center"
            onClick={(event) => {
              event.preventDefault()
              setShowDropdown((previous) => !previous)
            }}
            aria-expanded={showDropdown}
            aria-haspopup="true"
            id="userDropdown"
          >
            <div className="sb-topnav-user-icon-circle me-2 flex-shrink-0">
              <div className="sb-topnav-user-icon-inner">
                <i className="fas fa-user sb-topnav-user-icon" />
              </div>
            </div>
            <span className="d-none d-lg-inline">{user?.name || user?.username || 'User'}</span>
          </button>
          <ul className={`dropdown-menu dropdown-menu-end ${showDropdown ? 'show' : ''}`} aria-labelledby="userDropdown">
            <li className="dropdown-header">{user?.name || user?.username || 'User'}</li>
            <li>
              <span className="dropdown-item small text-muted py-1">{user?.username || user?.email || 'No username'}</span>
            </li>
            <li className="dropdown-separator" />
            <li>
              <button type="button" className="dropdown-item custom-dropdown-item logout-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt fa-fw me-2" />
                Logout
              </button>
            </li>
          </ul>
        </li>
      </ul>
      <style>{`
        .custom-dropdown-item {
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          padding: 0.375rem 1rem;
          color: #212529;
          transition: all 0.15s ease-in-out;
        }
        .custom-dropdown-item:hover {
          background-color: #f8f9fa;
          color: #16181b;
        }
        .logout-item { color: #dc3545 !important; }
        .logout-item:hover {
          background-color: rgba(220, 53, 69, 0.1) !important;
          color: #dc3545 !important;
        }
      `}</style>
    </nav>
  )
}

export default Topbar