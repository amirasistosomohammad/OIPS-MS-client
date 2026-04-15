import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Login from './pages/public/Login'
import Layout from './layout/Layout'
import { clearSession, fetchCurrentUser, getStoredSession, logout as logoutRequest, saveSession } from './services/auth'
import { confirmAction, showErrorAlert } from './services/alerts'
const ActivityLogsPage = lazy(() => import('./pages/modules/tabs/ActivityLogsPage'))
const BeneficiaryRegistryPage = lazy(() => import('./pages/modules/tabs/BeneficiaryRegistryPage'))
const DashboardPage = lazy(() => import('./pages/modules/tabs/DashboardPage'))
const NotificationsPage = lazy(() => import('./pages/modules/tabs/NotificationsPage'))
const ProgramEnrollmentsPage = lazy(() => import('./pages/modules/tabs/ProgramEnrollmentsPage'))
const ProgramUpdatesPage = lazy(() => import('./pages/modules/tabs/ProgramUpdatesPage'))
const ProgramSettingsPage = lazy(() => import('./pages/modules/tabs/ProgramSettingsPage'))
const ReportsAnalyticsPage = lazy(() => import('./pages/modules/tabs/ReportsAnalyticsPage'))
const UserManagementPage = lazy(() => import('./pages/modules/tabs/UserManagementPage'))
const SystemSettingsPage = lazy(() => import('./pages/modules/SystemSettingsPage'))

function RouteLoadingFallback() {
  return (
    <div className="d-flex align-items-center justify-content-center py-5">
      <div className="spinner-border text-primary" role="status" aria-hidden="true" />
      <span className="ms-2 text-secondary">Loading page...</span>
    </div>
  )
}

function ProtectedRoute({ isAuthenticated, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  const [auth, setAuth] = useState({ token: '', user: null, isAuthenticated: false })
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let mounted = true

    const restoreSession = async () => {
      const session = getStoredSession()

      if (!session) {
        if (mounted) setIsInitializing(false)
        return
      }

      try {
        const user = await fetchCurrentUser(session.token)
        if (!mounted) return

        const nextSession = { ...session, user }
        saveSession(nextSession)
        setAuth({ token: nextSession.token, user: nextSession.user, isAuthenticated: true })
      } catch (error) {
        const isInvalidSession = error?.status === 401 || error?.status === 403 || error?.status === 422

        if (isInvalidSession) {
          clearSession()
          if (mounted) setAuth({ token: '', user: null, isAuthenticated: false })
        } else if (mounted) {
          // Keep local session on transient failures (e.g. temporary API downtime) to avoid forced logout on refresh.
          setAuth({
            token: session.token,
            user: session.user || null,
            isAuthenticated: true,
          })
        }
      } finally {
        if (mounted) setIsInitializing(false)
      }
    }

    restoreSession()
    return () => {
      mounted = false
    }
  }, [])

  const actions = useMemo(
    () => ({
      handleLoginSuccess(session) {
        saveSession(session)
        setAuth({ token: session.token, user: session.user, isAuthenticated: true })
      },
      async handleLogout() {
        const result = await confirmAction({
          title: 'Logout account?',
          text: 'You will need to sign in again to continue.',
          confirmButtonText: 'Yes, logout',
        })

        if (!result.isConfirmed) return

        const current = getStoredSession()
        try {
          await logoutRequest(current?.token || auth.token)
          toast.success('Logged out successfully.')
        } catch {
          await showErrorAlert({
            title: 'Logout failed',
            text: 'Unable to logout right now. Please try again.',
          })
        } finally {
          clearSession()
          setAuth({ token: '', user: null, isAuthenticated: false })
        }
      },
    }),
    [auth.token],
  )

  if (isInitializing) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center bg-white">
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-2"
            role="status"
            style={{ width: '2.2rem', height: '2.2rem', borderWidth: '0.2em' }}
          />
          <p className="mb-0 text-secondary fw-semibold" style={{ letterSpacing: '0.01em' }}>
            Loading session...
          </p>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to={auth.isAuthenticated ? '/dashboard' : '/login'} replace />} />
        <Route
          path="/login"
          element={
            auth.isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={actions.handleLoginSuccess} />
            )
          }
        />
        <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={auth.isAuthenticated}>
              <Layout user={auth.user} onLogout={actions.handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage user={auth.user} />} />
          <Route path="beneficiaries" element={<BeneficiaryRegistryPage />} />
          <Route path="enrollments" element={<ProgramEnrollmentsPage />} />
          <Route path="program-updates" element={<ProgramUpdatesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="program-settings" element={<ProgramSettingsPage />} />
          <Route path="user-management" element={<UserManagementPage />} />
          <Route path="activity-logs" element={<ActivityLogsPage />} />
          <Route path="reports" element={<ReportsAnalyticsPage />} />
          <Route path="system-settings" element={<SystemSettingsPage user={auth.user} />} />
        </Route>
        <Route path="*" element={<Navigate to={auth.isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={3200}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        toastClassName="owwa-toast"
        bodyClassName="owwa-toast-body"
        progressClassName="owwa-toast-progress"
      />
    </BrowserRouter>
  )
}

export default App
