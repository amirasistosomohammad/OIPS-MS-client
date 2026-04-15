import { useEffect, useMemo, useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { evaluatePasswordStrength } from '../../utils/passwordRules'
import SystemPortalModal from './SystemPortalModal'

function FileField({ field, value, onChange, disabled, existingImageUrl }) {
  const previewUrl = useMemo(() => (value instanceof File ? URL.createObjectURL(value) : null), [value])
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const activePreview = previewUrl || existingImageUrl || null

  return (
    <>
      <input
        type="file"
        accept={field.accept}
        className="form-control portal-form-input"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
        required={field.required}
        disabled={disabled}
      />
      {activePreview ? (
        <div className="portal-file-preview-wrap mt-2">
          <img src={activePreview} alt="Selected beneficiary profile" className="portal-file-preview-image" />
        </div>
      ) : null}
    </>
  )
}

export default function FormPortalModal({
  isOpen,
  title,
  subtitle,
  fields,
  initialValues,
  onSubmit,
  onClose,
  submitLabel = 'Save',
  onFormChange,
  formClassName = 'portal-module-form-modal',
  modalClassName = '',
  belowFields = null,
}) {
  const [form, setForm] = useState(() => initialValues || {})
  const [isSaving, setIsSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [passwordVisibleByField, setPasswordVisibleByField] = useState({})

  // Parent often passes inline `initialValues={{ ... }}` — new object every render. Sync only when
  // content actually changes or modal opens, not on referential churn (prevents render loops / UI hang).
  const initialValuesSignature = useMemo(() => JSON.stringify(initialValues ?? {}), [initialValues])

  useEffect(() => {
    if (!isOpen) return
    setForm(initialValues || {})
    setFieldErrors({})
    setPasswordVisibleByField({})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialValuesSignature captures content; raw initialValues changes every render from inline objects
  }, [isOpen, initialValuesSignature])

  useEffect(() => {
    if (!isOpen) return
    onFormChange?.(form)
  }, [form, onFormChange, isOpen])

  const clearFieldError = (name) => {
    setFieldErrors((previous) => {
      if (!previous[name]) return previous
      const next = { ...previous }
      delete next[name]
      return next
    })
  }

  const updateField = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }))
    clearFieldError(name)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    for (const field of fields) {
      if (field.type === 'section') continue
      const raw = form[field.name]
      if (field.required) {
        if (field.type === 'file') {
          if (!raw) nextErrors[field.name] = `${field.label} is required.`
        } else if (String(raw ?? '').trim() === '') {
          nextErrors[field.name] = `${field.label} is required.`
        }
      }
      if (nextErrors[field.name] || !field.validate) continue
      const message = field.validate(raw, form)
      if (message) nextErrors[field.name] = message
    }
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors)
      return
    }
    setFieldErrors({})
    setIsSaving(true)
    try {
      await onSubmit?.(form)
      onClose?.()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SystemPortalModal isOpen={isOpen} title={title} subtitle={subtitle} onClose={onClose} modalClassName={modalClassName}>
      <form onSubmit={handleSubmit} className={formClassName}>
        <div className="row g-3">
          {fields.map((field) => {
            if (field.type === 'section') {
              return (
                <div className="col-12" key={field.name}>
                  <div className="portal-form-section-title">
                    {field.icon ? <i className={`${field.icon} me-2`} aria-hidden="true" /> : null}
                    {field.label}
                  </div>
                </div>
              )
            }

            const fieldError = fieldErrors[field.name]
            const passwordStrength = field.passwordCriteria ? evaluatePasswordStrength(form[field.name] ?? '') : null
            const showPwCriteriaOpen = field.passwordCriteria && String(form[field.name] ?? '').length > 0

            const control = (
              <>
                <label className="form-label fw-semibold portal-form-label" htmlFor={field.inputId || undefined}>
                  {field.label}
                  {field.required ? <span className="portal-form-required"> *</span> : null}
                </label>
                {field.type === 'select' ? (
                  <select
                    id={field.inputId}
                    className={`form-select portal-form-input${fieldError ? ' is-invalid' : ''}`}
                    value={form[field.name] ?? ''}
                    onChange={(event) => updateField(field.name, event.target.value)}
                    required={field.required}
                    disabled={isSaving}
                  >
                    <option value="">{field.placeholder || 'Select'}</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={field.inputId}
                    className={`form-control portal-form-input${fieldError ? ' is-invalid' : ''}`}
                    rows={field.rows || 3}
                    placeholder={field.placeholder}
                    value={form[field.name] ?? ''}
                    onChange={(event) => updateField(field.name, event.target.value)}
                    required={field.required}
                    disabled={isSaving}
                  />
                ) : field.type === 'file' ? (
                  <FileField
                    field={field}
                    value={form[field.name]}
                    existingImageUrl={field.existingImageField ? form[field.existingImageField] : null}
                    disabled={isSaving}
                    onChange={(nextFile) => updateField(field.name, nextFile)}
                  />
                ) : field.type === 'password' ? (
                  <div className="input-group portal-password-input-group">
                    <input
                      id={field.inputId}
                      type={passwordVisibleByField[field.name] ? 'text' : 'password'}
                      className={`form-control portal-form-input${fieldError ? ' is-invalid' : ''}`}
                      placeholder={field.placeholder}
                      value={form[field.name] ?? ''}
                      onChange={(event) => updateField(field.name, event.target.value)}
                      required={field.required}
                      disabled={isSaving}
                      autoComplete={field.autoComplete || 'new-password'}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary portal-password-toggle"
                      onClick={() =>
                        !isSaving &&
                        setPasswordVisibleByField((previous) => ({
                          ...previous,
                          [field.name]: !previous[field.name],
                        }))
                      }
                      disabled={isSaving}
                      tabIndex={-1}
                      aria-label={passwordVisibleByField[field.name] ? 'Hide password' : 'Show password'}
                    >
                      {passwordVisibleByField[field.name] ? <FaEyeSlash size={16} aria-hidden /> : <FaEye size={16} aria-hidden />}
                    </button>
                  </div>
                ) : (
                  <input
                    id={field.inputId}
                    type={field.type || 'text'}
                    className={`form-control portal-form-input${fieldError ? ' is-invalid' : ''}`}
                    placeholder={field.placeholder}
                    value={form[field.name] ?? ''}
                    onChange={(event) => updateField(field.name, event.target.value)}
                    required={field.required}
                    disabled={isSaving}
                  />
                )}
                {field.passwordCriteria && passwordStrength ? (
                  <div className={`password-criteria-wrapper ${showPwCriteriaOpen ? 'password-criteria-visible' : ''}`}>
                    <div className="password-criteria-inner">
                      <ul className="password-criteria-content small text-secondary mb-0 ps-3 list-unstyled">
                        <li className={passwordStrength.minLength ? 'text-success' : ''}>• At least 8 characters</li>
                        <li className={passwordStrength.hasLetter ? 'text-success' : ''}>• Contains a letter</li>
                        <li className={passwordStrength.hasNumber ? 'text-success' : ''}>• Contains a number</li>
                      </ul>
                    </div>
                  </div>
                ) : null}
                <div className={`oips-field-feedback-wrap${fieldError ? ' oips-field-feedback-wrap-visible' : ''}`}>
                  {fieldError ? <div className="oips-field-feedback-inner">{fieldError}</div> : null}
                </div>
                {field.helpText ? <div className="portal-form-help">{field.helpText}</div> : null}
              </>
            )

            if (field.adjacent) {
              const leftCol = field.adjacentLeftColClass ?? 'col-12 col-lg-6'
              const rightCol = field.adjacentRightColClass ?? 'col-12 col-lg-6'
              return (
                <div className="col-12" key={field.name}>
                  <div className={`row g-3 align-items-stretch ${field.adjacentRowClass || 'enrollment-field-split-row'}`.trim()}>
                    <div className={`${leftCol} ${field.wrapperClass || ''}`.trim()}>
                      {control}
                    </div>
                    <div className={`${rightCol} enrollment-field-adjacent-slot`.trim()}>
                      {field.adjacent(form, { isSaving, field })}
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div className={`${field.colClass || 'col-md-6'} ${field.wrapperClass || ''}`.trim()} key={field.name}>
                {control}
              </div>
            )
          })}
        </div>
        {typeof belowFields === 'function' ? belowFields(form, { isSaving }) : belowFields}
        <div className="account-approvals-detail-footer portal-system-footer mt-4">
          <button type="button" className="btn btn-light account-approvals-detail-close-btn" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary account-approvals-detail-close-btn" disabled={isSaving}>
            {isSaving ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </SystemPortalModal>
  )
}
