/** @param {unknown} password */
export function evaluatePasswordStrength(password) {
  const p = password == null ? '' : String(password)
  return {
    minLength: p.length >= 8,
    hasLetter: /[A-Za-z]/.test(p),
    hasNumber: /[0-9]/.test(p),
  }
}

/** @param {unknown} password */
export function isPasswordStrong(password) {
  const v = evaluatePasswordStrength(password)
  return v.minLength && v.hasLetter && v.hasNumber
}

/** Required password field (create user, change password). @returns {string|null} */
export function passwordStrengthMessage(password) {
  if (!String(password ?? '').trim()) return 'Password is required.'
  if (!isPasswordStrong(password)) return 'Use at least 8 characters with at least one letter and one number.'
  return null
}

/** Optional password (e.g. edit user — blank keeps current). @returns {string|null} */
export function passwordStrengthMessageOptional(password) {
  const p = String(password ?? '').trim()
  if (!p) return null
  if (!isPasswordStrong(p)) return 'Use at least 8 characters with at least one letter and one number.'
  return null
}
