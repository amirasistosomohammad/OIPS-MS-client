import { useCallback, useEffect, useState } from 'react'
import {
  FaCalendarCheck,
  FaClock,
  FaCog,
  FaDatabase,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaImage,
  FaLock,
  FaSave,
  FaSpinner,
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import {
  buildStorageUrl,
  changeMyPassword,
  downloadBackup,
  getBackupList,
  getBackupSchedule,
  getPublicSystemSettings,
  removeSystemLogo,
  updateBackupSchedule,
  updateSystemSettings,
  uploadAuthBackground,
  uploadSystemLogo,
} from '../../services/adminApi'
import { formatDisplayDateTime } from '../../utils/displayFormat'
import { evaluatePasswordStrength, isPasswordStrong } from '../../utils/passwordRules'
import './SystemSettingsPage.css'

export default function SystemSettingsPage({ user }) {
  const [activeTab, setActiveTab] = useState('password')
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false)

  const [systemSettings, setSystemSettings] = useState({
    app_name: '',
    logo_path: null,
    logo_primary_path: null,
    logo_secondary_path: null,
    logo_tertiary_path: null,
    logo_primary_url: null,
    logo_secondary_url: null,
    logo_tertiary_url: null,
    auth_background_path: null,
    auth_background_url: null,
    logo_updated_at: null,
    auth_background_updated_at: null,
  })
  const [systemForm, setSystemForm] = useState({ app_name: '' })
  const [systemErrors, setSystemErrors] = useState({})
  const [systemSettingsLoading, setSystemSettingsLoading] = useState(true)
  const [systemSaving, setSystemSaving] = useState(false)
  const [logoLoading, setLogoLoading] = useState(false)
  const [backgroundLoading, setBackgroundLoading] = useState(false)

  const [backupLoading, setBackupLoading] = useState(false)
  const [backupSchedule, setBackupSchedule] = useState({
    frequency: 'off',
    run_at_time: '02:00',
    timezone: 'Asia/Manila',
    last_run_at: null,
    next_run_at: null,
  })
  const [backupScheduleForm, setBackupScheduleForm] = useState({ frequency: 'off', run_at_time: '02:00' })
  const [backupScheduleLoading, setBackupScheduleLoading] = useState(false)
  const [backupScheduleSaving, setBackupScheduleSaving] = useState(false)
  const [backupList, setBackupList] = useState([])
  const [backupListLoading, setBackupListLoading] = useState(false)
  const [backupLatestLoading, setBackupLatestLoading] = useState(false)
  const [backupDownloadingFilename, setBackupDownloadingFilename] = useState(null)

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'new_password') {
      setShowPasswordCriteria(value.length > 0)
    }
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const newPasswordValidation = evaluatePasswordStrength(passwordForm.new_password)

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!passwordForm.current_password.trim()) errors.current_password = 'Current password is required.'
    if (!passwordForm.new_password.trim()) errors.new_password = 'New password is required.'
    else if (!isPasswordStrong(passwordForm.new_password)) {
      errors.new_password = 'Use at least 8 characters with at least one letter and one number.'
    }
    if (!passwordForm.new_password_confirmation.trim()) {
      errors.new_password_confirmation = 'Confirm your new password.'
    } else if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      errors.new_password_confirmation = 'Passwords do not match.'
    }
    setPasswordErrors(errors)
    if (Object.keys(errors).length) return

    setPasswordLoading(true)
    try {
      await changeMyPassword(passwordForm)
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      })
      setPasswordErrors({})
      setShowPasswordCriteria(false)
      toast.success('Password changed successfully.')
    } catch (error) {
      toast.error(error.message || 'Failed to change password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  useEffect(() => {
    const loadSettings = async () => {
      setSystemSettingsLoading(true)
      try {
        const data = await getPublicSystemSettings()
        setSystemSettings({
          app_name: data?.app_name || '',
          logo_path: data?.logo_path || null,
          logo_primary_path: data?.logo_primary_path || null,
          logo_secondary_path: data?.logo_secondary_path || null,
          logo_tertiary_path: data?.logo_tertiary_path || null,
          logo_primary_url: data?.logo_primary_url || null,
          logo_secondary_url: data?.logo_secondary_url || null,
          logo_tertiary_url: data?.logo_tertiary_url || null,
          auth_background_path: data?.auth_background_path || null,
          auth_background_url: data?.auth_background_url || null,
          logo_updated_at: null,
          auth_background_updated_at: null,
        })
        setSystemForm({ app_name: data?.app_name || '' })
      } catch (error) {
        toast.error(error.message || 'Failed to load system settings.')
      } finally {
        setSystemSettingsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSystemSubmit = async (event) => {
    event.preventDefault()
    if (!systemForm.app_name.trim()) {
      setSystemErrors({ app_name: 'Application name is required.' })
      return
    }
    setSystemSaving(true)
    try {
      const payload = { app_name: systemForm.app_name.trim() }
      const data = await updateSystemSettings(payload)
      setSystemSettings((prev) => ({
        ...prev,
        app_name: data?.app_name || prev.app_name,
        logo_path: data?.logo_path ?? prev.logo_path,
        logo_primary_path: data?.logo_primary_path ?? prev.logo_primary_path,
        logo_secondary_path: data?.logo_secondary_path ?? prev.logo_secondary_path,
        logo_tertiary_path: data?.logo_tertiary_path ?? prev.logo_tertiary_path,
        logo_primary_url: data?.logo_primary_url ?? prev.logo_primary_url,
        logo_secondary_url: data?.logo_secondary_url ?? prev.logo_secondary_url,
        logo_tertiary_url: data?.logo_tertiary_url ?? prev.logo_tertiary_url,
        auth_background_path: data?.auth_background_path ?? prev.auth_background_path,
        auth_background_url: data?.auth_background_url ?? prev.auth_background_url,
      }))
      setSystemForm({ app_name: data?.app_name || payload.app_name })
      window.dispatchEvent(new CustomEvent('oipsms-settings-updated'))
      toast.success('System settings updated successfully.')
    } catch (error) {
      toast.error(error.message || 'Failed to update system settings.')
    } finally {
      setSystemSaving(false)
    }
  }

  const handleLogoChange = async (event, slot = 'legacy') => {
    const file = event.target.files?.[0]
    if (!file) return
    setLogoLoading(true)
    try {
      const data = await uploadSystemLogo(file, slot)
      setSystemSettings((prev) => ({
        ...prev,
        logo_path: data?.logo_path ?? prev.logo_path,
        logo_primary_path: data?.logo_primary_path ?? prev.logo_primary_path,
        logo_secondary_path: data?.logo_secondary_path ?? prev.logo_secondary_path,
        logo_tertiary_path: data?.logo_tertiary_path ?? prev.logo_tertiary_path,
        logo_primary_url: data?.logo_primary_url ?? prev.logo_primary_url,
        logo_secondary_url: data?.logo_secondary_url ?? prev.logo_secondary_url,
        logo_tertiary_url: data?.logo_tertiary_url ?? prev.logo_tertiary_url,
        logo_updated_at: Date.now(),
      }))
      window.dispatchEvent(new CustomEvent('oipsms-settings-updated'))
      toast.success('Logo updated successfully.')
    } catch (error) {
      toast.error(error.message || 'Failed to upload logo.')
    } finally {
      setLogoLoading(false)
      event.target.value = ''
    }
  }

  const handleRemoveLogo = async (slot) => {
    try {
      const data = await removeSystemLogo(slot)
      setSystemSettings((prev) => ({
        ...prev,
        logo_path: data?.logo_path ?? prev.logo_path,
        logo_primary_path: data?.logo_primary_path ?? prev.logo_primary_path,
        logo_secondary_path: data?.logo_secondary_path ?? prev.logo_secondary_path,
        logo_tertiary_path: data?.logo_tertiary_path ?? prev.logo_tertiary_path,
        logo_primary_url: data?.logo_primary_url ?? prev.logo_primary_url,
        logo_secondary_url: data?.logo_secondary_url ?? prev.logo_secondary_url,
        logo_tertiary_url: data?.logo_tertiary_url ?? prev.logo_tertiary_url,
        logo_updated_at: Date.now(),
      }))
      window.dispatchEvent(new CustomEvent('oipsms-settings-updated'))
      toast.success('Logo removed successfully.')
    } catch (error) {
      toast.error(error.message || 'Failed to remove logo.')
    }
  }

  const handleAuthBackgroundChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBackgroundLoading(true)
    try {
      const data = await uploadAuthBackground(file)
      setSystemSettings((prev) => ({
        ...prev,
        auth_background_path: data?.auth_background_path || prev.auth_background_path,
        auth_background_url: data?.auth_background_url || prev.auth_background_url,
        auth_background_updated_at: Date.now(),
      }))
      window.dispatchEvent(new CustomEvent('oipsms-settings-updated'))
      toast.success('Background updated successfully.')
    } catch (error) {
      toast.error(error.message || 'Failed to upload background image.')
    } finally {
      setBackgroundLoading(false)
      event.target.value = ''
    }
  }

  const fetchBackupSchedule = useCallback(async () => {
    setBackupScheduleLoading(true)
    try {
      const data = await getBackupSchedule()
      setBackupSchedule({
        frequency: data?.frequency ?? 'off',
        run_at_time: data?.run_at_time ?? '02:00',
        timezone: data?.timezone ?? 'Asia/Manila',
        last_run_at: data?.last_run_at ?? null,
        next_run_at: data?.next_run_at ?? null,
      })
      setBackupScheduleForm({ frequency: data?.frequency || 'off', run_at_time: data?.run_at_time || '02:00' })
    } catch (error) {
      toast.error(error.message || 'Failed to load backup schedule.')
    } finally {
      setBackupScheduleLoading(false)
    }
  }, [])

  const fetchBackupList = useCallback(async () => {
    setBackupListLoading(true)
    try {
      const data = await getBackupList()
      setBackupList(Array.isArray(data?.backups) ? data.backups : [])
    } catch (error) {
      toast.error(error.message || 'Failed to load backup history.')
    } finally {
      setBackupListLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'backup') return undefined
    fetchBackupSchedule()
    fetchBackupList()
    const id = setInterval(() => {
      fetchBackupList()
    }, 5000)
    return () => clearInterval(id)
  }, [activeTab, fetchBackupList, fetchBackupSchedule])

  const saveBlobDownload = async (response, fallbackName) => {
    const disposition = response.headers.get('Content-Disposition')
    const matched = disposition?.match(/filename="?([^";\n]+)"?/)
    const filename = matched?.[1]?.trim() || fallbackName
    const blob = await response.blob()
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
  }

  const handleDownloadBackup = async () => {
    setBackupLoading(true)
    try {
      const response = await downloadBackup('/admin/backup')
      await saveBlobDownload(response, `oipsms-backup-${new Date().toISOString().slice(0, 10)}.sql`)
      toast.success('SQL backup downloaded successfully.')
      fetchBackupList()
      fetchBackupSchedule()
    } catch (error) {
      toast.error(error.message || 'Failed to download backup.')
    } finally {
      setBackupLoading(false)
    }
  }

  const handleBackupScheduleSubmit = async (event) => {
    event.preventDefault()
    setBackupScheduleSaving(true)
    try {
      const data = await updateBackupSchedule(backupScheduleForm)
      setBackupSchedule((prev) => ({
        ...prev,
        frequency: data?.frequency ?? prev.frequency,
        run_at_time: data?.run_at_time ?? prev.run_at_time,
        timezone: data?.timezone ?? prev.timezone,
        next_run_at: data?.next_run_at ?? prev.next_run_at,
      }))
      toast.success('Backup schedule updated.')
    } catch (error) {
      toast.error(error.message || 'Failed to update schedule.')
    } finally {
      setBackupScheduleSaving(false)
    }
  }

  const handleDownloadLatestBackup = async () => {
    setBackupLatestLoading(true)
    try {
      const response = await downloadBackup('/admin/backup/download/latest')
      await saveBlobDownload(response, 'oipsms-backup-latest.sql')
      toast.success('Latest scheduled backup downloaded.')
    } catch (error) {
      toast.error(error.message || 'Failed to download latest backup.')
    } finally {
      setBackupLatestLoading(false)
    }
  }

  const handleDownloadBackupFile = async (filename) => {
    setBackupDownloadingFilename(filename)
    try {
      const response = await downloadBackup(`/admin/backup/download/file/${encodeURIComponent(filename)}`)
      await saveBlobDownload(response, filename)
      toast.success('Backup downloaded.')
    } catch (error) {
      toast.error(error.message || 'Failed to download backup file.')
    } finally {
      setBackupDownloadingFilename(null)
    }
  }

  const withCache = (url) => (url ? `${url}${url.includes('?') ? '&' : '?'}t=${systemSettings.logo_updated_at || systemSettings.auth_background_updated_at || 'init'}` : null)
  const logoPrimaryUrl = withCache(systemSettings.logo_primary_url || (systemSettings.logo_primary_path ? buildStorageUrl(systemSettings.logo_primary_path) : null))
  const logoSecondaryUrl = withCache(systemSettings.logo_secondary_url || (systemSettings.logo_secondary_path ? buildStorageUrl(systemSettings.logo_secondary_path) : null))
  const logoTertiaryUrl = withCache(systemSettings.logo_tertiary_url || (systemSettings.logo_tertiary_path ? buildStorageUrl(systemSettings.logo_tertiary_path) : null))
  const bgUrl = withCache(systemSettings.auth_background_url || (systemSettings.auth_background_path ? buildStorageUrl(systemSettings.auth_background_path) : null))
  const logoSlots = [
    { key: 'primary', label: 'Logo 1', url: logoPrimaryUrl, inputId: 'settings-logo-primary' },
    { key: 'secondary', label: 'Logo 2', url: logoSecondaryUrl, inputId: 'settings-logo-secondary' },
    { key: 'tertiary', label: 'Logo 3', url: logoTertiaryUrl, inputId: 'settings-logo-tertiary' },
  ]
  const uploadedSlots = logoSlots.filter((slot) => Boolean(slot.url))
  const emptySlots = logoSlots.filter((slot) => !slot.url)
  const uploadedLogoCount = uploadedSlots.length
  const nextAddSlot = emptySlots[0] || null
  const roleLabel = 'Administrator'

  return (
    <div className="system-settings-container page-enter">
      <div className="system-settings-header">
        <div className="system-settings-header-icon-wrap">
          <FaCog className="system-settings-header-gear" aria-hidden="true" />
        </div>
        <div className="system-settings-header-text">
          <h1 className="system-settings-header-title">System configuration</h1>
          <p className="system-settings-header-subtitle">
            {user?.name || user?.username || 'Administrator'} • {roleLabel}
          </p>
          <p className="system-settings-header-desc">Administrative configuration, security, and data protection</p>
        </div>
      </div>
      <div className="system-settings-row">
        <div className="system-settings-card system-settings-card-left">
          <h2 className="system-settings-menu-title">Settings Menu</h2>
          <nav className="system-settings-nav">
            <button
              type="button"
              className={`system-settings-nav-btn ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <FaLock className="system-settings-nav-icon" aria-hidden="true" />
              <div className="system-settings-nav-text">
                <span className="system-settings-nav-label">Change Password</span>
                <span className="system-settings-nav-desc">Modify account credentials</span>
              </div>
            </button>
            <button
              type="button"
              className={`system-settings-nav-btn ${activeTab === 'branding' ? 'active' : ''}`}
              onClick={() => setActiveTab('branding')}
            >
              <FaImage className="system-settings-nav-icon" aria-hidden="true" />
              <div className="system-settings-nav-text">
                <span className="system-settings-nav-label">System Branding</span>
                <span className="system-settings-nav-desc">Configure application branding</span>
              </div>
            </button>
            <button
              type="button"
              className={`system-settings-nav-btn ${activeTab === 'backup' ? 'active' : ''}`}
              onClick={() => setActiveTab('backup')}
            >
              <FaDatabase className="system-settings-nav-icon" aria-hidden="true" />
              <div className="system-settings-nav-text">
                <span className="system-settings-nav-label">Data Backup</span>
                <span className="system-settings-nav-desc">Export system data for security</span>
              </div>
            </button>
          </nav>
        </div>
        <div className="system-settings-card system-settings-card-right">
          <div className="system-settings-content-body">
            {activeTab === 'password' && (
              <div className="system-settings-tab-panel tab-transition-enter">
                <h2 className="system-settings-card-title">
                  <FaLock className="system-settings-card-title-icon" aria-hidden="true" />
                  <span>Change Administrator Password</span>
                </h2>
                <div className="system-settings-admin-note">
                  <strong>Administrator Note:</strong> As a system administrator, you can only change your password. Personal information
                  modifications are restricted for security reasons.
                </div>
                <form onSubmit={handlePasswordSubmit} className="system-settings-form">
                  <div className="system-settings-form-group">
                    <label htmlFor="settings-current-password" className="system-settings-label">
                      Current Password <span className="system-settings-required">*</span>
                    </label>
                    <div className="input-group mb-2">
                      <span className="input-group-text">
                        <FaLock size={14} />
                      </span>
                      <input
                        id="settings-current-password"
                        name="current_password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.current_password}
                        onChange={handlePasswordChange}
                        autoComplete="current-password"
                        className={`form-control ${passwordErrors.current_password ? 'is-invalid' : ''}`}
                        disabled={passwordLoading}
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => !passwordLoading && setShowCurrentPassword(!showCurrentPassword)}
                        disabled={passwordLoading}
                        aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <div
                      className={`oips-field-feedback-wrap${passwordErrors.current_password ? ' oips-field-feedback-wrap-visible' : ''}`}
                    >
                      {passwordErrors.current_password ? (
                        <div className="oips-field-feedback-inner">{passwordErrors.current_password}</div>
                      ) : null}
                    </div>
                  </div>
                  <div className="system-settings-form-group">
                    <label htmlFor="settings-new-password" className="system-settings-label">
                      New Password <span className="system-settings-required">*</span>
                    </label>
                    <div className="input-group mb-2">
                      <span className="input-group-text">
                        <FaLock size={14} />
                      </span>
                      <input
                        id="settings-new-password"
                        name="new_password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.new_password}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                        className={`form-control border-start-0 ps-2 fw-semibold ${
                          passwordForm.new_password && isPasswordStrong(passwordForm.new_password)
                            ? 'is-valid'
                            : passwordForm.new_password
                              ? 'is-invalid'
                              : ''
                        }`}
                        disabled={passwordLoading}
                        placeholder="Create a new password"
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => !passwordLoading && setShowNewPassword(!showNewPassword)}
                        disabled={passwordLoading}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <div className={`password-criteria-wrapper ${showPasswordCriteria ? 'password-criteria-visible' : ''}`}>
                      <div className="password-criteria-inner">
                        <ul className="password-criteria-content small text-secondary mb-3 ps-3 list-unstyled">
                          <li className={newPasswordValidation.minLength ? 'text-success' : ''}>• At least 8 characters</li>
                          <li className={newPasswordValidation.hasLetter ? 'text-success' : ''}>• Contains a letter</li>
                          <li className={newPasswordValidation.hasNumber ? 'text-success' : ''}>• Contains a number</li>
                        </ul>
                      </div>
                    </div>
                    <div className={`oips-field-feedback-wrap${passwordErrors.new_password ? ' oips-field-feedback-wrap-visible' : ''}`}>
                      {passwordErrors.new_password ? <div className="oips-field-feedback-inner">{passwordErrors.new_password}</div> : null}
                    </div>
                  </div>
                  <div className="system-settings-form-group">
                    <label htmlFor="settings-confirm-password" className="system-settings-label">
                      Confirm New Password <span className="system-settings-required">*</span>
                    </label>
                    <div className="input-group mb-1">
                      <span className="input-group-text">
                        <FaLock size={14} />
                      </span>
                      <input
                        id="settings-confirm-password"
                        name="new_password_confirmation"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.new_password_confirmation}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                        className={`form-control ${passwordErrors.new_password_confirmation ? 'is-invalid' : ''}`}
                        disabled={passwordLoading}
                        placeholder="Confirm new password"
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => !passwordLoading && setShowConfirmPassword(!showConfirmPassword)}
                        disabled={passwordLoading}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <div
                      className={`oips-field-feedback-wrap${
                        passwordErrors.new_password_confirmation ? ' oips-field-feedback-wrap-visible' : ''
                      }`}
                    >
                      {passwordErrors.new_password_confirmation ? (
                        <div className="oips-field-feedback-inner">{passwordErrors.new_password_confirmation}</div>
                      ) : null}
                    </div>
                  </div>
                  <div className="system-settings-form-footer">
                    <button type="submit" className="system-settings-btn-primary" disabled={passwordLoading} aria-busy={passwordLoading}>
                      {passwordLoading ? (
                        <>
                          <FaSpinner className="spinner" aria-hidden="true" />
                          <span>Changing Password…</span>
                        </>
                      ) : (
                        <>
                          <FaLock aria-hidden="true" />
                          <span>Change Administrator Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
            {activeTab === 'branding' && (
              <div className="system-settings-tab-panel tab-transition-enter">
                <h2 className="system-settings-card-title">
                  <FaImage className="system-settings-card-title-icon" aria-hidden="true" />
                  <span>System Branding</span>
                </h2>
                {systemSettingsLoading ? (
                  <div className="system-settings-loading">
                    <FaSpinner className="spinner" aria-hidden="true" />
                    <span>Loading branding…</span>
                  </div>
                ) : (
                  <form onSubmit={handleSystemSubmit} className="system-settings-form">
                    <div className="system-settings-admin-note">
                      <strong>Logo settings:</strong> Uploaded logos are shown in the Topbar and Login page.
                      <span className="ms-1 fw-semibold">Uploaded logos: {uploadedLogoCount}</span>
                    </div>
                    <div className="system-settings-logo-grid">
                      {uploadedSlots.map((slot) => (
                        <div className="system-settings-logo-card" key={slot.key}>
                          <label className="system-settings-label mb-2">{slot.label}</label>
                          <div className="system-settings-logo-row">
                            <div className="system-settings-logo-preview">
                              <img src={slot.url} alt={slot.label} />
                            </div>
                            <div className="system-settings-logo-actions">
                              <input
                                id={slot.inputId}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                                onChange={(event) => handleLogoChange(event, slot.key)}
                                disabled={logoLoading}
                                className="system-settings-logo-input"
                              />
                              <label htmlFor={slot.inputId} className="system-settings-logo-btn">
                                {logoLoading ? (
                                  <>
                                    <FaSpinner className="spinner" aria-hidden="true" />
                                    <span>Uploading…</span>
                                  </>
                                ) : 'Replace logo'}
                              </label>
                              <button
                                type="button"
                                className="system-settings-btn-secondary system-settings-logo-remove-btn"
                                onClick={() => handleRemoveLogo(slot.key)}
                                disabled={uploadedLogoCount <= 1 || logoLoading}
                                title={uploadedLogoCount <= 1 ? 'At least one logo must remain.' : 'Remove logo'}
                              >
                                Remove
                              </button>
                              <span className="system-settings-logo-hint">PNG, JPG, WEBP, SVG up to 2MB.</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {nextAddSlot ? (
                        <div className="system-settings-logo-card system-settings-logo-card-add">
                          <label className="system-settings-label mb-2">
                            Add Logo ({nextAddSlot.label})
                          </label>
                          <div className="system-settings-logo-row">
                            <div className="system-settings-logo-preview">
                              <span className="system-settings-logo-placeholder">
                                <FaImage aria-hidden="true" />
                              </span>
                            </div>
                            <div className="system-settings-logo-actions">
                              <input
                                id={nextAddSlot.inputId}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                                onChange={(event) => handleLogoChange(event, nextAddSlot.key)}
                                disabled={logoLoading}
                                className="system-settings-logo-input"
                              />
                              <label htmlFor={nextAddSlot.inputId} className="system-settings-logo-btn">
                                {logoLoading ? (
                                  <>
                                    <FaSpinner className="spinner" aria-hidden="true" />
                                    <span>Uploading…</span>
                                  </>
                                ) : 'Upload logo'}
                              </label>
                              <span className="system-settings-logo-hint">You can add up to 3 logos.</span>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="system-settings-branding-preview-wrap">
                      <label className="system-settings-label">Login &amp; register background</label>
                      <div className="system-settings-logo-row">
                        <div className="system-settings-logo-preview system-settings-bg-preview">
                          {bgUrl ? (
                            <img src={bgUrl} alt="Auth background" />
                          ) : (
                            <span className="system-settings-logo-placeholder">
                              <FaImage aria-hidden="true" />
                            </span>
                          )}
                        </div>
                        <div className="system-settings-logo-actions">
                          <input
                            id="settings-auth-background"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif"
                            onChange={handleAuthBackgroundChange}
                            disabled={backgroundLoading}
                            className="system-settings-logo-input"
                          />
                          <label htmlFor="settings-auth-background" className="system-settings-logo-btn">
                            {backgroundLoading ? (
                              <>
                                <FaSpinner className="spinner" aria-hidden="true" />
                                <span>Uploading…</span>
                              </>
                            ) : (
                              'Change background'
                            )}
                          </label>
                          <span className="system-settings-logo-hint">JPEG, PNG, GIF, WebP, AVIF up to 5MB.</span>
                        </div>
                      </div>
                    </div>
                    <div className="system-settings-branding-text-grid">
                      <div className="system-settings-form-group">
                      <label htmlFor="settings-app-name" className="system-settings-label">
                        Application name <span className="system-settings-required">*</span>
                      </label>
                      <input
                        id="settings-app-name"
                        name="app_name"
                        type="text"
                        value={systemForm.app_name}
                        onChange={(e) => setSystemForm((prev) => ({ ...prev, app_name: e.target.value }))}
                        className={`system-settings-input ${systemErrors.app_name ? 'error' : ''}`}
                        disabled={systemSaving}
                        placeholder="Enter application name"
                        maxLength={255}
                      />
                      </div>
                    </div>
                    <div className="system-settings-form-footer">
                      <button type="submit" className="system-settings-btn-primary" disabled={systemSaving} aria-busy={systemSaving}>
                        {systemSaving ? (
                          <>
                            <FaSpinner className="spinner" aria-hidden="true" />
                            <span>Saving…</span>
                          </>
                        ) : (
                          <>
                            <FaSave aria-hidden="true" />
                            <span>Save Branding</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            {activeTab === 'backup' && (
              <div className="system-settings-tab-panel tab-transition-enter">
                <h2 className="system-settings-card-title">
                  <FaDatabase className="system-settings-card-title-icon" aria-hidden="true" />
                  <span>Data Backup</span>
                </h2>
                <div className="system-settings-admin-note system-settings-backup-note">
                  <strong>Security &amp; compliance:</strong> Create full database (SQL) backups for disaster recovery and audit.
                  Manual backup downloads a fresh SQL dump; automated backup runs on a schedule and stores a copy on the server.
                </div>
                <section className="system-settings-backup-section">
                  <h3 className="system-settings-backup-section-title">Manual backup</h3>
                  <p className="system-settings-card-desc system-settings-backup-desc">
                    Download a complete SQL dump of the database now. Use for one-off backups or before major changes.
                  </p>
                  <div className="system-settings-form-footer">
                    <button type="button" className="system-settings-btn-primary" onClick={handleDownloadBackup} disabled={backupLoading} aria-busy={backupLoading}>
                      {backupLoading ? (
                        <>
                          <FaSpinner className="spinner" aria-hidden="true" />
                          <span>Generating SQL backup…</span>
                        </>
                      ) : (
                        <>
                          <FaDownload aria-hidden="true" />
                          <span>Download SQL backup now</span>
                        </>
                      )}
                    </button>
                  </div>
                </section>
                <section className="system-settings-backup-section system-settings-backup-schedule-section">
                  <h3 className="system-settings-backup-section-title">
                    <FaClock className="system-settings-backup-section-icon" aria-hidden="true" />
                    Automated backup schedule
                  </h3>
                  <p className="system-settings-card-desc system-settings-backup-desc">
                    Schedule automatic SQL backups. The system runs backups at the configured time and keeps the latest file
                    available for download.
                  </p>
                  {backupScheduleLoading ? (
                    <div className="system-settings-loading">
                      <FaSpinner className="spinner" aria-hidden="true" />
                      <span>Loading schedule…</span>
                    </div>
                  ) : (
                    <form onSubmit={handleBackupScheduleSubmit} className="system-settings-form system-settings-backup-schedule-form">
                      <div className="system-settings-backup-schedule-row">
                        <div className="system-settings-form-group system-settings-backup-form-group">
                          <label htmlFor="backup-frequency" className="system-settings-label">
                            Frequency
                          </label>
                          <select
                            id="backup-frequency"
                            name="frequency"
                            value={backupScheduleForm.frequency}
                            onChange={(e) => setBackupScheduleForm((prev) => ({ ...prev, frequency: e.target.value }))}
                            className="system-settings-input system-settings-select"
                            disabled={backupScheduleSaving}
                          >
                            <option value="off">Off</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </div>
                        <div className="system-settings-form-group system-settings-backup-form-group">
                          <label htmlFor="backup-run-at" className="system-settings-label">
                            Run at (PH time)
                          </label>
                          <input
                            id="backup-run-at"
                            name="run_at_time"
                            type="time"
                            value={backupScheduleForm.run_at_time}
                            onChange={(e) => setBackupScheduleForm((prev) => ({ ...prev, run_at_time: e.target.value }))}
                            className="system-settings-input"
                            disabled={backupScheduleSaving}
                          />
                        </div>
                      </div>
                      <div className="system-settings-backup-status-row">
                        <div className="system-settings-backup-status-item">
                          <FaCalendarCheck className="system-settings-backup-status-icon" aria-hidden="true" />
                          <span className="system-settings-backup-status-label">Last backup:</span>
                          <span className="system-settings-backup-status-value">{formatDisplayDateTime(backupSchedule.last_run_at)}</span>
                        </div>
                        <div className="system-settings-backup-status-item">
                          <FaClock className="system-settings-backup-status-icon" aria-hidden="true" />
                          <span className="system-settings-backup-status-label">Next backup:</span>
                          <span className="system-settings-backup-status-value">
                            {backupSchedule.frequency === 'off' ? '—' : formatDisplayDateTime(backupSchedule.next_run_at)}
                          </span>
                        </div>
                      </div>
                      <div className="system-settings-form-footer system-settings-backup-schedule-footer">
                        <button type="submit" className="system-settings-btn-primary" disabled={backupScheduleSaving} aria-busy={backupScheduleSaving}>
                          {backupScheduleSaving ? (
                            <>
                              <FaSpinner className="spinner" aria-hidden="true" />
                              <span>Saving…</span>
                            </>
                          ) : (
                            <>
                              <FaSave aria-hidden="true" />
                              <span>Save schedule</span>
                            </>
                          )}
                        </button>
                        <button type="button" className="system-settings-btn-secondary" onClick={handleDownloadLatestBackup} disabled={backupLatestLoading} aria-busy={backupLatestLoading}>
                          {backupLatestLoading ? (
                            <>
                              <FaSpinner className="spinner" aria-hidden="true" />
                              <span>Downloading latest…</span>
                            </>
                          ) : (
                            <>
                              <FaDownload aria-hidden="true" />
                              <span>Download latest scheduled backup</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                  <div className="system-settings-backup-table-wrap">
                    <h4 className="system-settings-backup-table-title">Automated backup history</h4>
                    <p className="system-settings-card-desc system-settings-backup-table-desc">
                      SQL files created by the scheduled backup. Download any file for your records.
                    </p>
                    {backupListLoading ? (
                      <div className="system-settings-loading system-settings-backup-table-loading">
                        <FaSpinner className="spinner" aria-hidden="true" />
                        <span>Loading backup history…</span>
                      </div>
                    ) : backupList.length === 0 ? (
                      <div className="system-settings-backup-table-empty">
                        No automated backups yet. Enable a schedule above and wait for the first run, or use &quot;Download SQL backup
                        now&quot; for a manual backup.
                      </div>
                    ) : (
                      <div className="system-settings-backup-table-scroll">
                        <table className="system-settings-backup-table" role="grid" aria-label="Automated backup history">
                          <thead>
                            <tr>
                              <th scope="col">Backup date</th>
                              <th scope="col">Download</th>
                            </tr>
                          </thead>
                          <tbody>
                            {backupList.map((item) => (
                              <tr key={item.filename}>
                                <td className="system-settings-backup-table-date">{formatDisplayDateTime(item.created_at)}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="system-settings-backup-table-download-btn"
                                    onClick={() => handleDownloadBackupFile(item.filename)}
                                    disabled={backupDownloadingFilename === item.filename}
                                  >
                                    {backupDownloadingFilename === item.filename ? (
                                      <>
                                        <FaSpinner className="spinner" aria-hidden="true" />
                                        <span>Downloading…</span>
                                      </>
                                    ) : (
                                      <>
                                        <FaDownload aria-hidden="true" />
                                        <span>Download</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
