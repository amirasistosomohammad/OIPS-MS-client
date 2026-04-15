const LONG_DATE = { month: 'long', day: 'numeric', year: 'numeric' }

/** Match ISO date at start: 2026-04-14, 2026-04-14T12:00:00, 2026-04-14 12:00:00 */
function parseLeadingCalendarYmd(s) {
  const m = String(s).trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]), rest: String(s).trim().slice(10) }
}

function calendarDateFromYmd(y, mo, d) {
  return new Date(y, mo - 1, d)
}

function hasExplicitTimeInTail(rest) {
  const t = String(rest || '').trim()
  if (!t) return false
  if (/^[T ]\d/.test(t)) return true
  if (/^\d{1,2}:\d{2}/.test(t)) return true
  return false
}

/** API often sends ...T00:00:00.000000Z for a pure calendar date — show date only. */
function isMidnightPlaceholderTail(rest) {
  const t = String(rest || '').trim()
  if (!t) return true
  return /^T00:00:00(\.\d+)?(Z|[+-]00:00)?$/i.test(t) || /^ 00:00:00(\.\d+)?$/.test(t)
}

/**
 * Calendar date: "May 13, 2004" (for API date strings YYYY-MM-DD or leading ISO).
 */
export function formatLongDate(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '-'
    return value.toLocaleDateString('en-US', LONG_DATE)
  }
  const s = String(value).trim()
  const ymd = parseLeadingCalendarYmd(s)
  if (ymd) {
    const local = calendarDateFromYmd(ymd.y, ymd.mo, ymd.d)
    if (Number.isNaN(local.getTime())) return s || '-'
    return local.toLocaleDateString('en-US', LONG_DATE)
  }
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s || '-'
  return d.toLocaleDateString('en-US', LONG_DATE)
}

/**
 * Long date from calendar Y-M-D; append local time when the value includes a time part.
 */
export function formatDisplayDateTime(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '-'
    const datePart = value.toLocaleDateString('en-US', LONG_DATE)
    const h = value.getHours()
    const mi = value.getMinutes()
    const sec = value.getSeconds()
    const ms = value.getMilliseconds()
    if (h === 0 && mi === 0 && sec === 0 && ms === 0) {
      return datePart
    }
    const timePart = value.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    return `${datePart}, ${timePart}`
  }
  const s = String(value).trim()
  if (!s) return '-'
  const ymd = parseLeadingCalendarYmd(s)
  if (ymd) {
    const local = calendarDateFromYmd(ymd.y, ymd.mo, ymd.d)
    if (Number.isNaN(local.getTime())) return s
    const datePart = local.toLocaleDateString('en-US', LONG_DATE)
    if (!hasExplicitTimeInTail(ymd.rest) || isMidnightPlaceholderTail(ymd.rest)) {
      return datePart
    }
    const full = new Date(s)
    if (Number.isNaN(full.getTime())) {
      return datePart
    }
    const timePart = full.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    return `${datePart}, ${timePart}`
  }
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  const datePart = d.toLocaleDateString('en-US', LONG_DATE)
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
  return `${datePart}, ${timePart}`
}

let pesoFormatter

export function formatPhilippinePeso(value) {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  if (!pesoFormatter) {
    pesoFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
  }
  return pesoFormatter.format(n)
}
