import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash, FaLock, FaSpinner, FaUser } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { login as loginRequest } from '../../services/auth'
import { buildStorageUrl, getPublicSystemSettings } from '../../services/adminApi'
import backgroundImage from '../../assets/background_image.png'
import bagongPilipinasLogo from '../../assets/Bagong Pilipinas Logo.png'
import dmwLogo from '../../assets/DMW Logo.png'
import owwaLogo from '../../assets/OWWA Regional Logo.png'

const FOOTER_HEIGHT_PX = 74
const CONTENT_VERTICAL_SPACING_PX = 24
const theme = {
  primary: '#0038A8',
  primaryDark: '#002e87',
  primaryLight: '#2d5ec0',
  accent: '#FCD116',
  danger: '#CE1126',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  backgroundLight: '#f8fafc',
  backgroundWhite: '#ffffff',
  borderColor: '#d6e0ff',
}
const FOOTER_TAGLINE = 'Overseas Workers Welfare Administration — Regional Welfare Office IX'

export default function Login({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [branding, setBranding] = useState({
    title: 'Overseas Workers Welfare Administration - Region 9',
    subtitle: 'Integrated Programs and Services Monitoring System',
    logos: [bagongPilipinasLogo, dmwLogo, owwaLogo],
    authBackground: backgroundImage,
  })

  const navigate = useNavigate()

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    let mounted = true
    getPublicSystemSettings()
      .then((data) => {
        if (!mounted) return
        const logos = [data?.logo_primary_url, data?.logo_secondary_url, data?.logo_tertiary_url]
          .filter(Boolean)
        const fallbackLogos = [data?.logo_primary_path, data?.logo_secondary_path, data?.logo_tertiary_path]
          .filter(Boolean)
          .map((path) => buildStorageUrl(path))
          .filter(Boolean)
        setBranding({
          title: data?.app_name || 'Overseas Workers Welfare Administration - Region 9',
          subtitle: 'Integrated Programs and Services Monitoring System',
          logos: logos.length ? logos : (fallbackLogos.length ? fallbackLogos : [bagongPilipinasLogo, dmwLogo, owwaLogo]),
          authBackground: data?.auth_background_url || (data?.auth_background_path ? buildStorageUrl(data.auth_background_path) : backgroundImage),
        })
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.add('login-page-active')
    document.body.classList.add('login-page-active')
    return () => {
      document.documentElement.classList.remove('login-page-active')
      document.body.classList.remove('login-page-active')
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const session = await loginRequest({
        username: form.username,
        password: form.password,
      })

      onLoginSuccess?.(session)
      toast.success('Login successful. Welcome to OIPSMS.')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const errorMessage = error.message || 'Unable to sign in.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const isMobile = windowWidth < 576
  const logoSize = isMobile ? 52 : 62
  const cardPadding = isMobile ? '30px 20px' : '40px'
  const labelFontSize = isMobile ? '0.85rem' : '0.9rem'
  const inputFontSize = isMobile ? '14px' : '16px'
  const currentYear = new Date().getFullYear()

  return (
    <div
      id="login-page"
      className="d-flex flex-column position-relative login-page-root"
      style={{
        minHeight: '100vh',
        height: '100dvh',
        maxHeight: '-webkit-fill-available',
        overflow: 'hidden',
        boxSizing: 'border-box',
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingTop: 0,
        paddingBottom: 0,
        zIndex: 1,
      }}
    >
      <div
        className="position-fixed"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${branding.authBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: theme.backgroundLight,
          filter: 'blur(3px)',
          transform: 'scale(1.04)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <div
        className="position-fixed"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(160deg, rgba(0, 56, 168, 0.5), rgba(252, 209, 22, 0.2), rgba(206, 17, 38, 0.32))',
          zIndex: 1,
          pointerEvents: 'none',
        }}
        aria-hidden
      />

      <div
        className="flex-grow-1 d-flex align-items-center justify-content-center position-relative min-h-0"
        style={{
          zIndex: 2,
          paddingTop: `${CONTENT_VERTICAL_SPACING_PX}px`,
          paddingBottom: `${FOOTER_HEIGHT_PX + CONTENT_VERTICAL_SPACING_PX}px`,
        }}
      >
        <div
          className="bg-white rounded-4 shadow-lg position-relative"
          style={{
            maxWidth: '420px',
            width: '100%',
            padding: cardPadding,
            border: `1px solid ${theme.borderColor}`,
            animation: 'fadeIn 0.6s ease-in-out',
            zIndex: 1,
          }}
        >
          <div className="d-flex justify-content-center align-items-center mb-4 gap-3">
            {branding.logos.map((logoSrc, index) => (
              <div
                className="rounded-circle border bg-white d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
                style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
                key={`${logoSrc}-${index}`}
              >
                <img src={logoSrc} alt={`Login Logo ${index + 1}`} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
              </div>
            ))}
          </div>

          <h5
            className="text-center fw-bold"
            style={{
              marginTop: '0.25rem',
              marginBottom: '0.35rem',
              color: theme.primaryDark,
              fontSize: isMobile ? '1.35rem' : '1.5rem',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            {branding.title}
          </h5>
          <p
            className="text-center fw-semibold"
            style={{
              color: '#334155',
              fontSize: isMobile ? '0.88rem' : '0.96rem',
              lineHeight: 1.35,
              letterSpacing: '0.01em',
              marginBottom: '1.5rem',
            }}
          >
            {branding.subtitle}
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="username" className="mb-1 fw-semibold d-block" style={{ fontSize: labelFontSize, color: theme.textSecondary }}>
              Username
            </label>
            <div className="mb-3 position-relative">
              <FaUser className="position-absolute top-50 translate-middle-y text-muted" size={16} style={{ left: '15px', zIndex: 1 }} />
              <input
                type="text"
                name="username"
                id="username"
                className="form-control fw-semibold"
                placeholder="Username"
                value={form.username}
                onChange={handleInputChange}
                disabled={isSubmitting}
                autoComplete="username"
                style={{
                  paddingLeft: '45px',
                  backgroundColor: theme.backgroundWhite,
                  color: theme.textPrimary,
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: inputFontSize,
                  transition: 'all 0.3s ease',
                }}
                onFocus={(event) => {
                  event.target.style.borderColor = theme.primary
                  event.target.style.boxShadow = '0 0 0 0.2rem rgba(0, 56, 168, 0.2)'
                }}
                onBlur={(event) => {
                  event.target.style.borderColor = '#d1d5db'
                  event.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <label htmlFor="password" className="mb-1 fw-semibold d-block" style={{ fontSize: labelFontSize, color: theme.textSecondary }}>
              Password
            </label>
            <div className="mb-3 position-relative">
              <FaLock className="position-absolute top-50 translate-middle-y text-muted" size={16} style={{ left: '15px', zIndex: 1 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                className="form-control fw-semibold"
                placeholder="Password"
                value={form.password}
                onChange={handleInputChange}
                disabled={isSubmitting}
                style={{
                  paddingLeft: '45px',
                  paddingRight: '45px',
                  backgroundColor: theme.backgroundWhite,
                  color: theme.textPrimary,
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: inputFontSize,
                  transition: 'all 0.3s ease',
                }}
                onFocus={(event) => {
                  event.target.style.borderColor = theme.primary
                  event.target.style.boxShadow = '0 0 0 0.2rem rgba(0, 56, 168, 0.2)'
                }}
                onBlur={(event) => {
                  event.target.style.borderColor = '#d1d5db'
                  event.target.style.boxShadow = 'none'
                }}
              />
              <span
                onClick={() => !isSubmitting && setShowPassword(!showPassword)}
                className="position-absolute top-50 translate-middle-y text-muted"
                style={{ right: '15px', cursor: isSubmitting ? 'not-allowed' : 'pointer', zIndex: 1 }}
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </span>
            </div>

            <button
              type="submit"
              className="w-100 py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center"
              disabled={isSubmitting}
              style={{
                backgroundColor: theme.primary,
                color: theme.backgroundWhite,
                border: 'none',
                borderRadius: '8px',
                fontSize: inputFontSize,
                transition: 'all 0.3s ease-in-out',
                position: 'relative',
                overflow: 'hidden',
                marginTop: '10px',
              }}
              onMouseEnter={(event) => {
                if (!isSubmitting) {
                  event.currentTarget.style.backgroundColor = theme.primaryDark
                  event.currentTarget.style.transform = 'translateY(-2px)'
                  event.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 56, 168, 0.35)'
                }
              }}
              onMouseLeave={(event) => {
                if (!isSubmitting) {
                  event.currentTarget.style.backgroundColor = theme.primary
                  event.currentTarget.style.transform = 'translateY(0)'
                  event.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 56, 168, 0.3)'
                }
              }}
              onMouseDown={(event) => {
                if (!isSubmitting) {
                  event.currentTarget.style.transform = 'translateY(0)'
                  event.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 56, 168, 0.3)'
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="fa-spin me-2" size={18} />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>

          </form>
        </div>
      </div>

      <footer
        className="position-fixed bottom-0 start-0 w-100"
        style={{
          zIndex: 2,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 -16px 36px rgba(2, 10, 28, 0.28)',
          background: 'linear-gradient(145deg, rgba(6, 31, 87, 0.94), rgba(10, 58, 143, 0.92) 55%, rgba(0, 46, 135, 0.93))',
          padding: isMobile ? '10px 12px' : '12px 16px',
        }}
      >
        <div
          className="mx-auto text-center"
          style={{
            maxWidth: '1080px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: isMobile ? '-10px' : '-12px',
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(252, 209, 22, 0.9), transparent)',
            }}
            aria-hidden
          />
          <p className="mb-1 fw-semibold" style={{ fontSize: isMobile ? '11px' : '12.5px', color: 'rgba(255,255,255,0.98)', letterSpacing: '0.02em' }}>
            © {currentYear} OIPSMS
          </p>
          <p className="mb-0" style={{ fontSize: isMobile ? '10px' : '11.5px', color: 'rgba(230, 239, 255, 0.92)' }}>
            {FOOTER_TAGLINE}
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}