import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { FaEdit, FaEye, FaPlus, FaTrash } from 'react-icons/fa'
import { motion as Motion } from 'framer-motion'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ConfirmPortalModal from '../../components/common/ConfirmPortalModal'
import FormPortalModal from '../../components/common/FormPortalModal'
import SystemPortalModal from '../../components/common/SystemPortalModal'
import {
  buildStorageUrl,
  createBeneficiary,
  createEnrollment,
  createProgram,
  createProgramUpdate,
  createUser,
  deleteBeneficiary,
  deleteEnrollment,
  deleteNotification,
  deleteProgram,
  deleteProgramUpdate,
  deleteUser,
  listActivityLogs,
  listBeneficiaries,
  listEnrollments,
  listFieldTemplates,
  listNotifications,
  listProgramUpdates,
  listPrograms,
  getDashboardData,
  getReportSummary,
  listStatusOptions,
  listUsers,
  markNotificationRead,
  notifyDueNotificationsChanged,
  updateBeneficiary,
  updateEnrollment,
  updateProgram,
  updateUser,
} from '../../services/adminApi'
import { toast } from 'react-toastify'
import { formatDisplayDateTime, formatLongDate, formatPhilippinePeso } from '../../utils/displayFormat'
import { passwordStrengthMessage, passwordStrengthMessageOptional } from '../../utils/passwordRules'

function ModulePageShell({ children }) {
  return (
    <div className="card border-0 shadow-sm w-100 module-registry-shell mb-3">
      <div className="card-body p-0">{children}</div>
    </div>
  )
}

function ModulePageHeader({ title, subtitle, iconClassName = 'fas fa-th-large', rightSlot }) {
  return (
    <div className="module-registry-header-strip">
      <Motion.div
        className="module-registry-header-panel"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
          <div className="d-flex align-items-start gap-3 min-w-0">
            <div className="module-registry-header-icon" aria-hidden="true">
              <i className={iconClassName} />
            </div>
            <div className="min-w-0">
              <h2 className="mb-1 module-registry-header-title">{title}</h2>
              <p className="mb-0 module-registry-header-subtitle">{subtitle}</p>
            </div>
          </div>
          {rightSlot ? <div className="flex-shrink-0 d-flex align-items-center gap-2 flex-wrap justify-content-lg-end">{rightSlot}</div> : null}
        </div>
      </Motion.div>
    </div>
  )
}

function ModuleSearchPanelRow({ label, inputId, search, onSearchChange, placeholder, clearAriaLabel = 'Clear search' }) {
  return (
    <Motion.div
      className="module-panel module-search-panel module-search-panel-accent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.24 }}
    >
      <div className="module-search-icon-wrap">
        <i className="fas fa-search" />
      </div>
      <div className="module-search-content">
        <label className="module-search-label" htmlFor={inputId}>{label}</label>
        <div className="module-search-input-wrap">
          <input
            id={inputId}
            type="text"
            className="form-control module-filter-input module-search-input"
            placeholder={placeholder}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {search.trim() ? (
            <button type="button" className="module-search-clear-btn" aria-label={clearAriaLabel} onClick={() => onSearchChange('')}>
              <i className="fas fa-times" />
            </button>
          ) : null}
        </div>
      </div>
    </Motion.div>
  )
}

const DATA_TABLE_DATE_KEYS = new Set([
  'date_enrolled',
  'next_update_due_at',
  'last_update_at',
  'update_date',
  'due_date',
  'action_time',
  'created_at',
  'updated_at',
  'birthdate',
])

const DATA_TABLE_PESO_KEYS = new Set(['amount_received', 'total_amount'])

function formatDataTableCell(column, row, rowIndex) {
  if (typeof column.render === 'function') {
    return column.render(row, rowIndex)
  }
  const key = column.key
  const raw = row[key]
  if (DATA_TABLE_DATE_KEYS.has(key)) {
    return formatDisplayDateTime(raw)
  }
  if (DATA_TABLE_PESO_KEYS.has(key)) {
    return formatPhilippinePeso(raw)
  }
  return raw ?? '-'
}

function DataTable({
  columns,
  rows,
  onViewRow,
  onEditRow,
  onDeleteRow,
  isLoading = false,
  showRowNumber = false,
  actionsPosition = 'end',
  enablePagination = false,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50],
  getRowClassName,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(pageSize)
  const totalPages = enablePagination ? Math.max(1, Math.ceil(rows.length / rowsPerPage)) : 1
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedRows = useMemo(() => {
    if (!enablePagination) return rows
    const start = (safeCurrentPage - 1) * rowsPerPage
    return rows.slice(start, start + rowsPerPage)
  }, [rows, enablePagination, safeCurrentPage, rowsPerPage])

  const visiblePageNumbers = useMemo(() => {
    if (!enablePagination) return []
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const start = Math.max(1, Math.min(safeCurrentPage - 2, totalPages - 4))
    return Array.from({ length: 5 }, (_, i) => start + i)
  }, [enablePagination, totalPages, safeCurrentPage])

  const renderActions = (row) => (
    <td>
      <div className="module-action-group">
        {onViewRow ? (
          <button type="button" className="btn btn-sm module-action-btn action-view" onClick={() => onViewRow(row)} title="View details">
            <FaEye />
            <span>View</span>
          </button>
        ) : null}
        {onEditRow ? (
          <button type="button" className="btn btn-sm module-action-btn action-edit" onClick={() => onEditRow(row)} title="Edit record">
            <FaEdit />
            <span>Edit</span>
          </button>
        ) : null}
        {onDeleteRow ? (
          <button type="button" className="btn btn-sm module-action-btn action-delete" onClick={() => onDeleteRow(row)} title="Delete record">
            <FaTrash />
            <span>Delete</span>
          </button>
        ) : null}
      </div>
    </td>
  )

  return (
    <Motion.div className="module-panel module-table-panel overflow-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }}>
      <table className="table table-hover align-middle mb-0 module-data-table">
        <thead>
          <tr>
            {showRowNumber ? <th style={{ minWidth: 64 }}>#</th> : null}
            {(onViewRow || onEditRow || onDeleteRow) && actionsPosition === 'start' ? <th style={{ minWidth: 220 }}>Actions</th> : null}
            {columns.map((column) => (
              <th key={column.key} style={{ minWidth: column.minWidth || 120 }} className={column.className || ''}>
                {column.label}
              </th>
            ))}
            {(onViewRow || onEditRow || onDeleteRow) && actionsPosition !== 'start' ? <th style={{ minWidth: 220 }}>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={`skeleton-${index}`}>
                {showRowNumber ? (
                  <td>
                    <span className="module-skeleton-line" />
                  </td>
                ) : null}
                {(onViewRow || onEditRow || onDeleteRow) && actionsPosition === 'start' ? (
                  <td>
                    <span className="module-skeleton-line" />
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td key={column.key}>
                    <span className="module-skeleton-line" />
                  </td>
                ))}
                {(onViewRow || onEditRow || onDeleteRow) && actionsPosition !== 'start' ? (
                  <td>
                    <span className="module-skeleton-line" />
                  </td>
                ) : null}
              </tr>
            ))
          ) : paginatedRows.length ? (
            paginatedRows.map((row, index) => (
              <tr key={row.id || index} className={typeof getRowClassName === 'function' ? getRowClassName(row, index) : undefined}>
                {showRowNumber ? <td className="module-row-number">{(safeCurrentPage - 1) * rowsPerPage + index + 1}</td> : null}
                {(onViewRow || onEditRow || onDeleteRow) && actionsPosition === 'start' ? renderActions(row) : null}
                {columns.map((column) => (
                  <td key={column.key} className={column.className || ''}>
                    {formatDataTableCell(column, row, index)}
                  </td>
                ))}
                {(onViewRow || onEditRow || onDeleteRow) && actionsPosition !== 'start' ? renderActions(row) : null}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (showRowNumber ? 1 : 0) + ((onViewRow || onEditRow || onDeleteRow) ? 1 : 0)} className="text-center text-muted py-4">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {enablePagination && !isLoading && rows.length > 0 ? (
        <div className="module-table-pagination">
          <span className="module-pagination-meta">
            Showing {(safeCurrentPage - 1) * rowsPerPage + 1}-{Math.min(safeCurrentPage * rowsPerPage, rows.length)} of {rows.length}
          </span>
          <div className="module-pagination-controls">
            <div className="module-pagination-limit-group">
              <label className="module-pagination-label" htmlFor="rows-per-page-select">Rows:</label>
              <select
                id="rows-per-page-select"
                className="form-select form-select-sm module-pagination-select"
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value))
                  setCurrentPage(1)
                }}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="btn btn-sm btn-light module-page-nav-btn" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}>
              Prev
            </button>
            {visiblePageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                className={`btn btn-sm module-page-btn module-page-number-btn ${page === safeCurrentPage ? 'btn-primary active' : 'btn-light'}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button type="button" className="btn btn-sm btn-light module-page-nav-btn" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}>
              Next
            </button>
          </div>
        </div>
      ) : null}
    </Motion.div>
  )
}

function humanizeRecordKey(key) {
  return String(key)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatRecordValue(value, key = '') {
  if (value === null || value === undefined || value === '') return '-'
  const keyLower = String(key).toLowerCase()
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  if (typeof value === 'number' && (keyLower.includes('amount') || keyLower.includes('price'))) {
    return formatPhilippinePeso(value)
  }
  if (typeof value === 'string') {
    const isAmountKey = keyLower.includes('amount') || keyLower.includes('price')
    if (isAmountKey && /^-?\d+(\.\d+)?$/.test(value.trim())) {
      return formatPhilippinePeso(Number(value))
    }
    const looksLikeDateKey =
      keyLower.includes('date') || keyLower.endsWith('_at') || keyLower === 'birthdate' || keyLower.includes('time')
    if (looksLikeDateKey && /^\d{4}-\d{2}-\d{2}/.test(value.trim())) {
      return formatDisplayDateTime(value)
    }
  }
  return String(value)
}

function pickRecordTitle(record, fallback = 'Record') {
  if (!record) return fallback
  const preferredKeys = ['title', 'name', 'program_name', 'beneficiary_name', 'username', 'program_code', 'action_type', 'description']
  for (const key of preferredKeys) {
    const candidate = record[key]
    if (candidate !== null && candidate !== undefined && String(candidate).trim() !== '') {
      return String(candidate)
    }
  }
  return fallback
}

const ENROLLMENT_VIEW_HIDDEN_KEYS = ['input_payload', 'beneficiary_id', 'program_id']
const PROGRAM_UPDATE_VIEW_HIDDEN_KEYS = ['update_payload', 'program_enrollment_id', 'status_option_id']

function RecordDetails({ record, eyebrow = 'Record overview', heroIconClass = 'fas fa-file-alt', hideKeys = [] }) {
  if (!record) return null
  const skipKeys = new Set(['password', 'password_hash', 'token', ...hideKeys])
  const entries = Object.entries(record).filter(([key]) => !skipKeys.has(key))
  const title = pickRecordTitle(record)

  return (
    <div className="beneficiary-details-card">
      <div className="beneficiary-details-hero">
        <div className="beneficiary-details-avatar-wrap">
          <div className="module-record-details-hero-icon" aria-hidden="true">
            <i className={heroIconClass} />
          </div>
        </div>
        <div className="beneficiary-details-hero-content">
          <p className="beneficiary-details-eyebrow mb-1">{eyebrow}</p>
          <h4 className="beneficiary-details-name mb-0">{title}</h4>
        </div>
      </div>
      <div className="beneficiary-details-grid" style={{ gridTemplateColumns: '1fr' }}>
        <section className="beneficiary-details-section">
          <h6>Details</h6>
          <div className="beneficiary-details-items">
            {entries.map(([key, value]) => (
              <div className="beneficiary-details-item" key={key}>
                <span>{humanizeRecordKey(key)}</span>
                <p>{formatRecordValue(value, key)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function BeneficiaryDetailsCard({ record }) {
  if (!record) return null

  const fullName = [record.first_name, record.middle_name, record.last_name].filter(Boolean).join(' ').trim() || 'Unnamed Beneficiary'
  const initials = `${record.first_name?.[0] || ''}${record.last_name?.[0] || ''}`.toUpperCase() || 'N/A'
  const metaChips = [
    { label: 'Field Office', value: record.field_office || '-' },
    { label: 'Sex', value: record.sex || '-' },
  ]

  const identityDetails = [
    { label: 'Birthdate', value: formatLongDate(record.birthdate) },
    { label: 'Contact Number', value: record.contact_number || '-' },
  ]

  const ofwDetails = [
    { label: 'Name of OFW', value: record.ofw_name || '-' },
    { label: 'Relationship to OFW', value: record.relationship_to_ofw || '-' },
  ]

  return (
    <div className="beneficiary-details-card">
      <div className="beneficiary-details-hero">
        <div className="beneficiary-details-avatar-wrap">
          {record.profile_photo_url ? (
            <img src={record.profile_photo_url} alt={fullName} className="beneficiary-details-avatar" />
          ) : (
            <div className="beneficiary-details-avatar-fallback">{initials}</div>
          )}
        </div>
        <div className="beneficiary-details-hero-content">
          <p className="beneficiary-details-eyebrow mb-1">Profile Overview</p>
          <h4 className="beneficiary-details-name mb-1">{fullName}</h4>
          <div className="beneficiary-details-meta">
            {metaChips.map((chip) => (
              <span key={chip.label} className="beneficiary-details-chip">
                <small>{chip.label}</small>
                <strong>{chip.value}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="beneficiary-details-grid">
        <section className="beneficiary-details-section">
          <h6>Identity Information</h6>
          <div className="beneficiary-details-items">
            {identityDetails.map((item) => (
              <div className="beneficiary-details-item" key={item.label}>
                <span>{item.label}</span>
                <p>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="beneficiary-details-section">
          <h6>OFW Linkage Information</h6>
          <div className="beneficiary-details-items">
            {ofwDetails.map((item) => (
              <div className="beneficiary-details-item" key={item.label}>
                <span>{item.label}</span>
                <p>{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function ModuleProfilingTabs({ value, onChange, tabs }) {
  return (
    <div className="module-profiling-tabs-wrap">
      <ul className="nav nav-tabs module-profiling-tabs mb-0" role="tablist">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab.id}>
            <button
              type="button"
              role="tab"
              aria-selected={value === tab.id}
              className={`nav-link ${value === tab.id ? 'active' : ''}`}
              onClick={() => onChange(tab.id)}
            >
              {tab.icon ? <i className={`${tab.icon} me-2`} aria-hidden /> : null}
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProgramTemplatePage({ title, subtitle, columns, rows, iconClassName = 'fas fa-graduation-cap' }) {
  const searchId = useId()
  const [search, setSearch] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return rows
    return rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(keyword)))
  }, [rows, search])

  return (
    <Motion.div className="page-enter" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: 'easeOut' }}>
      <ModulePageShell>
        <ModulePageHeader
          title={title}
          subtitle={subtitle}
          iconClassName={iconClassName}
          rightSlot={<span className="badge text-bg-primary align-self-center">{filteredRows.length} records</span>}
        />
      </ModulePageShell>
      <ModuleSearchPanelRow
        label="Search records"
        inputId={searchId}
        search={search}
        onSearchChange={setSearch}
        placeholder={`Search ${title}...`}
      />
      <DataTable
        columns={columns}
        rows={filteredRows}
        isLoading={false}
        showRowNumber
        actionsPosition="start"
        enablePagination
        pageSize={10}
        onViewRow={setSelectedRecord}
      />
      <SystemPortalModal
        isOpen={Boolean(selectedRecord)}
        title={`${title} — Record Details`}
        subtitle="Review the fields shown below for this list entry."
        onClose={() => setSelectedRecord(null)}
      >
        <RecordDetails record={selectedRecord} eyebrow="Beneficiary record" heroIconClass={iconClassName} />
      </SystemPortalModal>
    </Motion.div>
  )
}

export function DashboardPage({ user }) {
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    upcoming_notifications: [],
  })
  const [reportSummary, setReportSummary] = useState({
    enrollments_by_program: [],
    updates_by_status: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([getDashboardData(), getReportSummary()])
      .then(([dash, report]) => {
        if (mounted) {
          setDashboardData(dash)
          setReportSummary(report)
        }
      })
      .catch((error) => {
        toast.error(error.message || 'Unable to load dashboard data.')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const stats = dashboardData.stats || {}

  const statCards = [
    { label: 'Total Beneficiaries', value: stats.beneficiaries ?? 0 },
    { label: 'Active Enrollments', value: stats.active_enrollments ?? 0 },
    { label: 'Program Updates', value: stats.program_updates ?? 0 },
    { label: 'Open Notifications', value: stats.notifications_open ?? 0 },
  ]

  const keyMetricsChartData = useMemo(
    () => [
      { name: 'Beneficiaries', value: Number(stats.beneficiaries) || 0 },
      { name: 'Enrollments', value: Number(stats.active_enrollments) || 0 },
      { name: 'Updates', value: Number(stats.program_updates) || 0 },
      { name: 'Open notes', value: Number(stats.notifications_open) || 0 },
    ],
    [stats],
  )

  const enrollmentsChartData = useMemo(() => {
    const rows = reportSummary.enrollments_by_program || []
    return rows.slice(0, 12).map((r) => ({
      name: String(r.program_code || r.program_name || '—').slice(0, 12),
      value: Number(r.total) || 0,
    }))
  }, [reportSummary.enrollments_by_program])

  const updatesByStatusChartData = useMemo(() => {
    const rows = reportSummary.updates_by_status || []
    return rows.slice(0, 10).map((r) => ({
      name: String(r.status_label || '—').slice(0, 14),
      value: Number(r.total) || 0,
    }))
  }, [reportSummary.updates_by_status])

  const chartAxisTick = { fontSize: 11, fill: '#6b7280' }
  const chartTooltipCursorFill = 'rgba(10, 58, 143, 0.1)'

  return (
    <Motion.div className="page-enter" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: 'easeOut' }}>
      <ModulePageShell>
        <ModulePageHeader
          title="System Dashboard"
          subtitle={`Welcome, ${user?.name || user?.username || 'System Administrator'}.`}
          iconClassName="fas fa-tachometer-alt"
        />
        <div className="px-3 pt-3 pb-2 border-bottom module-registry-summary-wrap">
          <div className="row g-3">
            {statCards.map((card) => (
              <div className="col-12 col-sm-6 col-xl-3" key={card.label}>
                <div className="module-registry-summary-card h-100">
                  <div className="module-registry-summary-icon">
                    <i className="fas fa-chart-pie" />
                  </div>
                  <div className="module-registry-summary-label">{card.label}</div>
                  <div className="module-registry-summary-value">{isLoading ? '...' : card.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3">
          <div className="row g-3 mb-3">
            <div className="col-12 col-lg-6">
              <div className="module-registry-summary-card h-100">
                <div className="module-registry-summary-label mb-2">Key metrics overview</div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={keyMetricsChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <XAxis dataKey="name" tick={chartAxisTick} />
                      <YAxis allowDecimals={false} tick={chartAxisTick} />
                      <Tooltip cursor={{ fill: chartTooltipCursorFill }} contentStyle={{ fontSize: '0.8rem' }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--primary-color)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="module-registry-summary-card h-100">
                <div className="module-registry-summary-label mb-2">Enrollments by program</div>
                <div style={{ height: 260 }}>
                  {enrollmentsChartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={enrollmentsChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                        <XAxis dataKey="name" tick={chartAxisTick} />
                        <YAxis allowDecimals={false} tick={chartAxisTick} />
                        <Tooltip cursor={{ fill: chartTooltipCursorFill }} contentStyle={{ fontSize: '0.8rem' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--primary-light)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-secondary small">No enrollment breakdown yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12">
              <div className="module-registry-summary-card">
                <div className="module-registry-summary-label mb-2">Program updates by status</div>
                <div style={{ height: 240 }}>
                  {updatesByStatusChartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={updatesByStatusChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                        <XAxis dataKey="name" tick={chartAxisTick} />
                        <YAxis allowDecimals={false} tick={chartAxisTick} />
                        <Tooltip cursor={{ fill: chartTooltipCursorFill }} contentStyle={{ fontSize: '0.8rem' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="var(--primary-color)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-secondary small">No update status distribution yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <div className="module-registry-summary-card h-100">
                <div className="module-registry-summary-icon">
                  <i className="fas fa-clipboard-check" />
                </div>
                <div className="module-registry-summary-label">Update Compliance</div>
                <div className="module-registry-summary-value text-start small fw-normal lh-base mt-2">
                  <p className="mb-1 text-secondary">
                    Due Today: <span className="fw-semibold text-dark">{stats.notifications_due_today ?? 0}</span>
                  </p>
                  <p className="mb-0 text-secondary">
                    Overdue: <span className="fw-semibold text-danger">{stats.notifications_overdue ?? 0}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="module-registry-summary-card h-100">
                <div className="module-registry-summary-icon">
                  <i className="fas fa-bell" />
                </div>
                <div className="module-registry-summary-label">Upcoming Notifications</div>
                {dashboardData.upcoming_notifications?.length ? (
                  <div className="d-flex flex-column gap-2 mt-2">
                    {dashboardData.upcoming_notifications.slice(0, 5).map((item) => (
                      <div key={item.id} className="border rounded-3 p-2 bg-white">
                        <div className="fw-semibold small">{item.title}</div>
                        <small className="text-secondary d-block">{item.beneficiary_name || '-'} | {item.program_name || '-'}</small>
                        <small className="text-secondary">Due: {item.due_date ? formatDisplayDateTime(item.due_date) : 'N/A'}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-0 text-secondary small mt-2">No pending notifications.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </ModulePageShell>
    </Motion.div>
  )
}

/** Matches server-seeded primary admin; omitted from the User Management table. */
const USER_MANAGEMENT_HIDDEN_ADMIN_USERNAME = 'admin@admin.com'

export function UserManagementPage() {
  const userSearchId = useId()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewItem, setViewItem] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    listUsers()
      .then((data) => {
        if (mounted) setUsers(data)
      })
      .catch((error) => {
        toast.error(error.message || 'Failed to load users.')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const filteredUsers = useMemo(() => {
    const rows = users.filter((row) => String(row.username || '').toLowerCase() !== USER_MANAGEMENT_HIDDEN_ADMIN_USERNAME)
    const keyword = search.trim().toLowerCase()
    if (!keyword) return rows
    return rows.filter((row) =>
      [row.name, row.username, row.role, row.field_office].some((value) => String(value || '').toLowerCase().includes(keyword)),
    )
  }, [users, search])

  const columns = [
    { key: 'name', label: 'Full Name' },
    { key: 'username', label: 'Username' },
    { key: 'role', label: 'Role' },
    { key: 'field_office', label: 'Field Office' },
  ]

  const userFormFields = useMemo(
    () => [
      { name: 'name', label: 'Full Name', required: true, placeholder: 'Enter full name' },
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'e.g. regional.admin',
        validate: (value) => {
          const trimmed = String(value ?? '').trim()
          if (!trimmed) return null
          if (!/^[a-zA-Z0-9@._-]+$/.test(trimmed)) {
            return 'Use letters, numbers, dots, underscores, hyphens, and @ only.'
          }
          return null
        },
      },
      { name: 'field_office', label: 'Field Office', placeholder: 'e.g. RWO IX' },
      {
        name: 'password',
        label: editItem ? 'New password' : 'Password',
        type: 'password',
        required: !editItem,
        colClass: 'col-12',
        placeholder: editItem ? 'Leave blank to keep current password' : 'At least 8 characters, one letter and one number',
        passwordCriteria: true,
        validate: (value) => (editItem ? passwordStrengthMessageOptional(value) : passwordStrengthMessage(value)),
      },
    ],
    [editItem],
  )

  const handleSubmit = async (payload) => {
    const body = {
      name: String(payload.name ?? '').trim(),
      username: String(payload.username ?? '').trim(),
      field_office: String(payload.field_office ?? '').trim() || undefined,
      role: 'admin',
    }
    if (editItem) {
      const pw = String(payload.password ?? '').trim()
      if (pw) body.password = pw
    } else {
      body.password = payload.password
    }
    try {
      if (editItem) {
        await updateUser(editItem.id, body)
        toast.success('User updated successfully.')
      } else {
        await createUser(body)
        toast.success('User created successfully.')
      }
      setUsers(await listUsers())
    } catch (error) {
      toast.error(error.message || 'Unable to save user.')
      throw error
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteUser(deleteItem.id)
      toast.success('User deleted successfully.')
      setDeleteItem(null)
      setUsers(await listUsers())
    } catch (error) {
      toast.error(error.message || 'Unable to delete user.')
    }
  }

  return (
    <Motion.div className="page-enter" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: 'easeOut' }}>
      <ModulePageShell>
        <ModulePageHeader
          title="User Management"
          subtitle="Manage administrator accounts and field office assignments in one place."
          iconClassName="fas fa-users-cog"
          rightSlot={
            <button
              type="button"
              className="btn btn-primary module-registry-add-btn"
              onClick={() => {
                setEditItem(null)
                setFormOpen(true)
              }}
            >
              <FaPlus className="me-2" />
              Add User
            </button>
          }
        />
      </ModulePageShell>
      <ModuleSearchPanelRow
        label="Search users"
        inputId={userSearchId}
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by name, username, role, or field office..."
      />
      <DataTable
        columns={columns}
        rows={filteredUsers}
        isLoading={isLoading}
        showRowNumber
        actionsPosition="start"
        enablePagination
        pageSize={10}
        onViewRow={setViewItem}
        onEditRow={(row) => {
          setEditItem(row)
          setFormOpen(true)
        }}
        onDeleteRow={setDeleteItem}
      />
      <SystemPortalModal
        isOpen={Boolean(viewItem)}
        title="User Details"
        subtitle="Review account details and field office assignment."
        onClose={() => setViewItem(null)}
      >
        <RecordDetails record={viewItem} eyebrow="System user" heroIconClass="fas fa-user-shield" />
      </SystemPortalModal>
      <FormPortalModal
        isOpen={formOpen}
        title={editItem ? 'Update User' : 'Add User'}
        subtitle="Maintain user account information."
        fields={userFormFields}
        initialValues={editItem || { field_office: 'RWO IX' }}
        onSubmit={handleSubmit}
        onClose={() => {
          setFormOpen(false)
          setEditItem(null)
        }}
        submitLabel={editItem ? 'Update User' : 'Create User'}
      />
      <ConfirmPortalModal
        isOpen={Boolean(deleteItem)}
        title="Delete user record?"
        message={`This action will remove ${deleteItem?.name || 'this user'} from the system.`}
        confirmLabel="Delete User"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteItem(null)}
      />
    </Motion.div>
  )
}

export function ProgramSettingsPage() {
  const programSearchId = useId()
  const [programs, setPrograms] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewItem, setViewItem] = useState(null)
  const [programViewTab, setProgramViewTab] = useState('catalog')
  const [programRosterRows, setProgramRosterRows] = useState([])
  const [programRosterLoading, setProgramRosterLoading] = useState(false)
  const [programRosterSelectedEnrollment, setProgramRosterSelectedEnrollment] = useState(null)
  const [programRosterUpdates, setProgramRosterUpdates] = useState([])
  const [programRosterUpdatesLoading, setProgramRosterUpdatesLoading] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    listPrograms()
      .then((data) => {
        if (mounted) setPrograms(data)
      })
      .catch((error) => {
        toast.error(error.message || 'Failed to load programs.')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!viewItem?.id) return
    setProgramViewTab('catalog')
    setProgramRosterRows([])
    setProgramRosterSelectedEnrollment(null)
    setProgramRosterUpdates([])
  }, [viewItem?.id])

  useEffect(() => {
    if (!viewItem?.id || programViewTab !== 'roster') return
    let cancelled = false
    setProgramRosterLoading(true)
    setProgramRosterSelectedEnrollment(null)
    setProgramRosterUpdates([])
    listEnrollments({ program_id: viewItem.id })
      .then((data) => {
        if (!cancelled) setProgramRosterRows(data || [])
      })
      .catch((error) => {
        if (!cancelled) toast.error(error.message || 'Failed to load program enrollments.')
      })
      .finally(() => {
        if (!cancelled) setProgramRosterLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [viewItem?.id, programViewTab])

  useEffect(() => {
    if (!programRosterSelectedEnrollment?.id) {
      setProgramRosterUpdates([])
      return
    }
    let cancelled = false
    setProgramRosterUpdatesLoading(true)
    listProgramUpdates({ program_enrollment_id: programRosterSelectedEnrollment.id })
      .then((data) => {
        if (!cancelled) setProgramRosterUpdates(data || [])
      })
      .catch((error) => {
        if (!cancelled) toast.error(error.message || 'Failed to load program updates.')
      })
      .finally(() => {
        if (!cancelled) setProgramRosterUpdatesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [programRosterSelectedEnrollment?.id])

  const filteredPrograms = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return programs
    return programs.filter((row) =>
      [row.program_code, row.program_name, row.program_type, row.update_mode].some((value) => String(value || '').toLowerCase().includes(keyword)),
    )
  }, [programs, search])

  const totalPrograms = programs.length
  const activePrograms = programs.filter((row) => row.is_active !== false && row.is_active !== 'false').length
  const inactivePrograms = totalPrograms - activePrograms

  const columns = [
    { key: 'program_code', label: 'Program Code' },
    { key: 'program_name', label: 'Program Name' },
    { key: 'program_type', label: 'Program Type' },
    { key: 'update_mode', label: 'Update Mode' },
    { key: 'update_interval_months', label: 'Interval (Months)' },
    { key: 'is_active', label: 'Status' },
  ]

  const fields = [
    { name: 'program_code', label: 'Program Code', required: true },
    { name: 'program_name', label: 'Program Name', required: true },
    { name: 'program_type', label: 'Program Type' },
    { name: 'update_mode', label: 'Update Mode' },
    { name: 'update_interval_months', label: 'Update Interval (Months)', type: 'number' },
    { name: 'is_active', label: 'Status', type: 'select', options: [{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }] },
  ]

  const handleSubmit = async (payload) => {
    const normalized = {
      ...payload,
      is_active: payload.is_active === true || payload.is_active === 'true',
      update_interval_months: payload.update_interval_months ? Number(payload.update_interval_months) : null,
    }
    try {
      if (editItem) {
        await updateProgram(editItem.id, normalized)
        toast.success('Program updated successfully.')
      } else {
        await createProgram(normalized)
        toast.success('Program created successfully.')
      }
      setPrograms(await listPrograms())
    } catch (error) {
      toast.error(error.message || 'Unable to save program.')
      throw error
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteProgram(deleteItem.id)
      toast.success('Program deleted successfully.')
      setDeleteItem(null)
      setPrograms(await listPrograms())
    } catch (error) {
      toast.error(error.message || 'Unable to delete program.')
    }
  }

  return (
    <Motion.div className="page-enter" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: 'easeOut' }}>
      <ModulePageShell>
        <ModulePageHeader
          title="Program Settings"
          subtitle="Manage program configuration and settings in one place."
          iconClassName="fas fa-cogs"
          rightSlot={
            <button
              type="button"
              className="btn btn-primary module-registry-add-btn"
              onClick={() => {
                setEditItem(null)
                setFormOpen(true)
              }}
            >
              <FaPlus className="me-2" />
              Add Program
            </button>
          }
        />
        <div className="px-3 pt-3 pb-2 border-bottom module-registry-summary-wrap">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="module-registry-summary-card">
                <div className="module-registry-summary-icon">
                  <i className="fas fa-layer-group" />
                </div>
                <div className="module-registry-summary-label">Total Programs</div>
                <div className="module-registry-summary-value">{isLoading ? '...' : totalPrograms}</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="module-registry-summary-card">
                <div className="module-registry-summary-icon">
                  <i className="fas fa-check-circle" />
                </div>
                <div className="module-registry-summary-label">Active Programs</div>
                <div className="module-registry-summary-value">{isLoading ? '...' : activePrograms}</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="module-registry-summary-card">
                <div className="module-registry-summary-icon">
                  <i className="fas fa-pause-circle" />
                </div>
                <div className="module-registry-summary-label">Inactive Programs</div>
                <div className="module-registry-summary-value">{isLoading ? '...' : inactivePrograms}</div>
              </div>
            </div>
          </div>
        </div>
      </ModulePageShell>
      <ModuleSearchPanelRow
        label="Search programs"
        inputId={programSearchId}
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by code, name, type, or update mode..."
      />
      <DataTable
        columns={columns}
        rows={filteredPrograms}
        isLoading={isLoading}
        showRowNumber
        actionsPosition="start"
        enablePagination
        pageSize={10}
        onViewRow={setViewItem}
        onEditRow={(row) => {
          setEditItem(row)
          setFormOpen(true)
        }}
        onDeleteRow={setDeleteItem}
      />
      <SystemPortalModal
        isOpen={Boolean(viewItem)}
        title="Program details"
        subtitle="Catalog settings, enrolled beneficiaries, and their program updates."
        modalClassName="portal-system-modal-enrollment"
        onClose={() => setViewItem(null)}
      >
        <ModuleProfilingTabs
          value={programViewTab}
          onChange={setProgramViewTab}
          tabs={[
            { id: 'catalog', label: 'Catalog', icon: 'fas fa-cogs' },
            { id: 'roster', label: 'Enrollments & updates', icon: 'fas fa-users' },
          ]}
        />
        {programViewTab === 'catalog' ? (
          <div className="mt-3">
            <RecordDetails record={viewItem} eyebrow="Program catalog" heroIconClass="fas fa-cogs" />
          </div>
        ) : (
          <div className="module-profiling-panel mt-3">
            <p className="small text-secondary mb-3">
              Beneficiaries enrolled in this program. Use <strong>View</strong> on a row to load all updates for that enrollment.
            </p>
            <DataTable
              columns={[
                { key: 'beneficiary_name', label: 'Beneficiary' },
                { key: 'beneficiary_no', label: 'Beneficiary No.' },
                { key: 'batch', label: 'Batch' },
                { key: 'enrollment_status', label: 'Status' },
                { key: 'date_enrolled', label: 'Enrolled', render: (row) => formatDisplayDateTime(row.date_enrolled) },
                { key: 'next_update_due_at', label: 'Next due', render: (row) => formatDisplayDateTime(row.next_update_due_at) },
              ]}
              rows={programRosterRows}
              isLoading={programRosterLoading}
              showRowNumber
              enablePagination
              pageSize={5}
              onViewRow={setProgramRosterSelectedEnrollment}
            />
            {programRosterSelectedEnrollment ? (
              <div className="mt-4 pt-3 border-top module-profiling-updates-block">
                <h6 className="mb-2 fw-semibold">
                  <i className="fas fa-clipboard-check me-2 text-primary" aria-hidden />
                  Updates — {programRosterSelectedEnrollment.beneficiary_name}
                  {programRosterSelectedEnrollment.batch ? ` · ${programRosterSelectedEnrollment.batch}` : ''}
                </h6>
                <DataTable
                  columns={[
                    { key: 'status_label', label: 'Status' },
                    { key: 'update_date', label: 'Update date', render: (row) => formatDisplayDateTime(row.update_date) },
                    { key: 'amount_received', label: 'Amount', render: (row) => formatPhilippinePeso(row.amount_received) },
                    { key: 'remarks', label: 'Remarks' },
                  ]}
                  rows={programRosterUpdates}
                  isLoading={programRosterUpdatesLoading}
                  showRowNumber
                  enablePagination
                  pageSize={5}
                />
              </div>
            ) : (
              !programRosterLoading &&
              programRosterRows.length > 0 && (
                <p className="small text-muted mt-3 mb-0">Select <strong>View</strong> on an enrollment to load its updates.</p>
              )
            )}
          </div>
        )}
      </SystemPortalModal>
      <FormPortalModal
        isOpen={formOpen}
        title={editItem ? 'Update Program' : 'Add Program'}
        subtitle="Maintain program configuration records."
        fields={fields}
        initialValues={editItem || { is_active: true }}
        onSubmit={handleSubmit}
        onClose={() => {
          setFormOpen(false)
          setEditItem(null)
        }}
        submitLabel={editItem ? 'Update Program' : 'Create Program'}
      />
      <ConfirmPortalModal
        isOpen={Boolean(deleteItem)}
        title="Delete program record?"
        message={`This action will remove ${deleteItem?.program_name || 'this program'} from the configuration list.`}
        confirmLabel="Delete Program"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteItem(null)}
      />
    </Motion.div>
  )
}

export function ActivityLogsPage() {
  const logsSearchId = useId()
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)

  useEffect(() => {
    listActivityLogs()
      .then(setLogs)
      .catch((error) => toast.error(error.message || 'Unable to load activity logs.'))
      .finally(() => setIsLoading(false))
  }, [])

  const columns = [
    { key: 'action_time', label: 'Date & Time', minWidth: 170 },
    { key: 'action_type', label: 'Action', minWidth: 100 },
    { key: 'table_name', label: 'Table', minWidth: 110 },
    { key: 'description', label: 'Description', minWidth: 260 },
  ]

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return logs
    return logs.filter((row) =>
      [row.action_type, row.table_name, row.description, row.action_time].some((value) => String(value || '').toLowerCase().includes(keyword)),
    )
  }, [logs, search])

  return (
    <Motion.div className="page-enter" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: 'easeOut' }}>
      <ModulePageShell>
        <ModulePageHeader
          title="Activity Logs"
          subtitle="Review system actions, affected records, and change details in one place."
          iconClassName="fas fa-history"
        />
      </ModulePageShell>
      <ModuleSearchPanelRow
        label="Search activity logs"
        inputId={logsSearchId}
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by action, table, or description..."
      />
      <DataTable
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        showRowNumber
        actionsPosition="start"
        enablePagination
        pageSize={10}
        onViewRow={setSelectedRecord}
      />
      <SystemPortalModal
        isOpen={Boolean(selectedRecord)}
        title="Activity Log Details"
        subtitle="Review who changed what, when, and on which table."
        onClose={() => setSelectedRecord(null)}
      >
        <RecordDetails record={selectedRecord} eyebrow="Audit entry" heroIconClass="fas fa-history" />
      </SystemPortalModal>
    </Motion.div>
  )
}

export function MemberProfilingPage() {
  const columns = [
    { key: 'beneficiary_no', label: 'Beneficiary No.' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'first_name', label: 'First Name' },
    { key: 'program', label: 'Program' },
    { key: 'field_office', label: 'Field Office' },
  ]
  const rows = [
    { id: 1, beneficiary_no: 'OWWA-1001', last_name: 'Dela Cruz', first_name: 'Ana', program: 'SESP', field_office: 'RWO IX' },
    { id: 2, beneficiary_no: 'OWWA-1002', last_name: 'Santos', first_name: 'Mark', program: 'SUP', field_office: 'RWO IX' },
  ]
  return <ProgramTemplatePage title="Member Profiling" subtitle="Manage and view all members' profiling data on programs and services." columns={columns} rows={rows} iconClassName="fas fa-id-card" />
}

export function BeneficiaryRegistryPage() {
  const beneficiarySearchId = useId()
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [beneficiaryViewTab, setBeneficiaryViewTab] = useState('profile')
  const [beneficiaryViewEnrollments, setBeneficiaryViewEnrollments] = useState([])
  const [beneficiaryViewEnrollmentsLoading, setBeneficiaryViewEnrollmentsLoading] = useState(false)
  const [beneficiaryViewSelectedEnrollment, setBeneficiaryViewSelectedEnrollment] = useState(null)
  const [beneficiaryViewUpdates, setBeneficiaryViewUpdates] = useState([])
  const [beneficiaryViewUpdatesLoading, setBeneficiaryViewUpdatesLoading] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)

  useEffect(() => {
    if (!viewItem?.id) return
    setBeneficiaryViewTab('profile')
    setBeneficiaryViewEnrollments([])
    setBeneficiaryViewSelectedEnrollment(null)
    setBeneficiaryViewUpdates([])
  }, [viewItem?.id])

  useEffect(() => {
    if (!viewItem?.id || beneficiaryViewTab !== 'programs') return
    let cancelled = false
    setBeneficiaryViewEnrollmentsLoading(true)
    setBeneficiaryViewSelectedEnrollment(null)
    setBeneficiaryViewUpdates([])
    listEnrollments({ beneficiary_id: viewItem.id })
      .then((data) => {
        if (!cancelled) setBeneficiaryViewEnrollments(data || [])
      })
      .catch((error) => {
        if (!cancelled) toast.error(error.message || 'Failed to load enrollments.')
      })
      .finally(() => {
        if (!cancelled) setBeneficiaryViewEnrollmentsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [viewItem?.id, beneficiaryViewTab])

  useEffect(() => {
    if (!beneficiaryViewSelectedEnrollment?.id) {
      setBeneficiaryViewUpdates([])
      return
    }
    let cancelled = false
    setBeneficiaryViewUpdatesLoading(true)
    listProgramUpdates({ program_enrollment_id: beneficiaryViewSelectedEnrollment.id })
      .then((data) => {
        if (!cancelled) setBeneficiaryViewUpdates(data || [])
      })
      .catch((error) => {
        if (!cancelled) toast.error(error.message || 'Failed to load program updates.')
      })
      .finally(() => {
        if (!cancelled) setBeneficiaryViewUpdatesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [beneficiaryViewSelectedEnrollment?.id])

  useEffect(() => {
    let mounted = true
    listBeneficiaries()
      .then((data) => {
        if (mounted) {
          setRows((data || []).map((row) => ({
            ...row,
            profile_photo_url: row.profile_photo_path ? buildStorageUrl(row.profile_photo_path) : null,
          })))
        }
      })
      .catch((error) => toast.error(error.message || 'Failed to load beneficiaries.'))
      .finally(() => {
        if (mounted) setIsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const columns = [
    {
      key: 'profile_photo_url',
      label: 'Photo',
      minWidth: 90,
      render: (row) => row.profile_photo_url
        ? <img src={row.profile_photo_url} alt={`${row.first_name || ''} ${row.last_name || ''}`.trim()} className="beneficiary-photo-thumb" />
        : <div className="beneficiary-photo-fallback">{`${row.first_name?.[0] || ''}${row.last_name?.[0] || ''}` || 'N/A'}</div>,
    },
    { key: 'last_name', label: 'Last Name' },
    { key: 'first_name', label: 'First Name' },
    { key: 'field_office', label: 'Field Office', className: 'hide-on-mobile' },
    { key: 'relationship_to_ofw', label: 'OFW Relationship', className: 'hide-on-tablet' },
    { key: 'contact_number', label: 'Contact', className: 'hide-on-tablet' },
  ]

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return rows
    return rows.filter((row) =>
      [row.beneficiary_no, row.last_name, row.first_name, row.ofw_name, row.field_office].some((value) => String(value || '').toLowerCase().includes(keyword)),
    )
  }, [rows, search])

  const totalBeneficiaries = rows.length
  const activeBeneficiaries = rows.filter((row) => row.is_active !== false).length
  const inactiveBeneficiaries = totalBeneficiaries - activeBeneficiaries

  const fields = [
    {
      name: 'profile_photo',
      label: 'Profile Photo',
      type: 'file',
      accept: 'image/*',
      existingImageField: 'profile_photo_url',
      colClass: 'col-12',
      wrapperClass: 'beneficiary-photo-top-field',
      helpText: 'Upload a clear 2x2 or valid ID-style image (JPG, PNG, WEBP up to 3MB).',
    },
    { name: 'identity_section', label: 'Beneficiary Identity', type: 'section', icon: 'fas fa-id-card' },
    { name: 'last_name', label: 'Last Name', required: true, placeholder: 'Enter last name' },
    { name: 'first_name', label: 'First Name', required: true, placeholder: 'Enter first name' },
    { name: 'middle_name', label: 'Middle Name', placeholder: 'Enter middle name' },
    { name: 'birthdate', label: 'Birthdate', type: 'date' },
    {
      name: 'sex',
      label: 'Sex',
      type: 'select',
      options: [
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
      ],
      placeholder: 'Select sex',
    },
    {
      name: 'field_office',
      label: 'Field Office',
      type: 'select',
      placeholder: 'Select field office',
      options: [
        { value: 'RWO IX', label: 'RWO IX' },
        { value: 'RWO NCR', label: 'RWO NCR' },
        { value: 'RWO I', label: 'RWO I' },
        { value: 'RWO II', label: 'RWO II' },
        { value: 'RWO III', label: 'RWO III' },
        { value: 'RWO IV-A', label: 'RWO IV-A' },
        { value: 'RWO IV-B', label: 'RWO IV-B' },
        { value: 'RWO V', label: 'RWO V' },
        { value: 'RWO VI', label: 'RWO VI' },
        { value: 'RWO VII', label: 'RWO VII' },
        { value: 'RWO VIII', label: 'RWO VIII' },
        { value: 'RWO X', label: 'RWO X' },
        { value: 'RWO XI', label: 'RWO XI' },
        { value: 'RWO XII', label: 'RWO XII' },
        { value: 'RWO CAR', label: 'RWO CAR' },
        { value: 'RWO CARAGA', label: 'RWO CARAGA' },
        { value: 'RWO BARMM', label: 'RWO BARMM' },
      ],
    },
    { name: 'contact_number', label: 'Contact Number', placeholder: 'e.g. 0917XXXXXXX' },
    { name: 'ofw_section', label: 'OFW Linkage Information', type: 'section', icon: 'fas fa-link' },
    { name: 'ofw_name', label: 'Name of OFW', colClass: 'col-12', placeholder: 'Enter OFW full name' },
    {
      name: 'relationship_to_ofw',
      label: 'Relationship to OFW',
      type: 'select',
      placeholder: 'Select relationship',
      options: [
        { value: 'Self', label: 'Self' },
        { value: 'Spouse', label: 'Spouse' },
        { value: 'Child', label: 'Child' },
        { value: 'Sibling', label: 'Sibling' },
        { value: 'Parent', label: 'Parent' },
        { value: 'Other Relative', label: 'Other Relative' },
      ],
    },
  ]

  const refresh = async () => {
    const data = await listBeneficiaries()
    setRows((data || []).map((row) => ({
      ...row,
      profile_photo_url: row.profile_photo_path ? buildStorageUrl(row.profile_photo_path) : null,
    })))
  }

  const beneficiaryInitialValues = useMemo(() => {
    if (!editItem) return { field_office: 'RWO IX' }
    return {
      ...editItem,
      // HTML date inputs only accept YYYY-MM-DD values.
      birthdate: editItem.birthdate ? String(editItem.birthdate).slice(0, 10) : '',
    }
  }, [editItem])

  const handleSubmit = async (payload) => {
    try {
      if (editItem) {
        await updateBeneficiary(editItem.id, payload)
        toast.success('Beneficiary updated successfully.')
      } else {
        await createBeneficiary(payload)
        toast.success('Beneficiary created successfully.')
      }
      await refresh()
    } catch (error) {
      toast.error(error.message || 'Unable to save beneficiary.')
      throw error
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteBeneficiary(deleteItem.id)
      toast.success('Beneficiary deleted successfully.')
      setDeleteItem(null)
      await refresh()
    } catch (error) {
      toast.error(error.message || 'Unable to delete beneficiary.')
    }
  }

  return (
    <Motion.div className="page-enter" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: 'easeOut' }}>
      <ModulePageShell>
        <ModulePageHeader
          title="Beneficiary Registry"
          subtitle="Official records of beneficiaries enrolled in OWWA programs and services."
          iconClassName="fas fa-address-card"
          rightSlot={
            <button type="button" className="btn btn-primary module-registry-add-btn flex-shrink-0" onClick={() => { setEditItem(null); setFormOpen(true) }}>
              <FaPlus className="me-2" />
              Add Beneficiary
            </button>
          }
        />
        <div className="px-3 pt-3 pb-2 border-bottom module-registry-summary-wrap">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="module-registry-summary-card">
                <div className="module-registry-summary-icon">
                  <i className="fas fa-users" />
                </div>
                <div className="module-registry-summary-label">Total Beneficiaries</div>
                <div className="module-registry-summary-value">{isLoading ? '...' : totalBeneficiaries}</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="module-registry-summary-card">
                <div className="module-registry-summary-icon">
                  <i className="fas fa-user-check" />
                </div>
                <div className="module-registry-summary-label">Active Profiles</div>
                <div className="module-registry-summary-value">{isLoading ? '...' : activeBeneficiaries}</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="module-registry-summary-card">
                <div className="module-registry-summary-icon">
                  <i className="fas fa-user-slash" />
                </div>
                <div className="module-registry-summary-label">Inactive Profiles</div>
                <div className="module-registry-summary-value">{isLoading ? '...' : inactiveBeneficiaries}</div>
              </div>
            </div>
          </div>
        </div>
      </ModulePageShell>
      <ModuleSearchPanelRow
        label="Search Beneficiary"
        inputId={beneficiarySearchId}
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by beneficiary no., name, OFW name, or field office"
        clearAriaLabel="Clear beneficiary search"
      />
      <DataTable
        columns={columns}
        rows={filteredRows}
        isLoading={isLoading}
        showRowNumber
        actionsPosition="start"
        enablePagination
        pageSize={10}
        onViewRow={setViewItem}
        onEditRow={(row) => { setEditItem(row); setFormOpen(true) }}
        onDeleteRow={setDeleteItem}
      />
      <SystemPortalModal
        isOpen={Boolean(viewItem)}
        title="Beneficiary profile"
        subtitle="Profile overview, enrolled programs, and program updates."
        modalClassName="portal-system-modal-enrollment"
        onClose={() => setViewItem(null)}
      >
        <ModuleProfilingTabs
          value={beneficiaryViewTab}
          onChange={setBeneficiaryViewTab}
          tabs={[
            { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
            { id: 'programs', label: 'Programs & updates', icon: 'fas fa-link' },
          ]}
        />
        {beneficiaryViewTab === 'profile' ? (
          <div className="mt-3">
            <BeneficiaryDetailsCard record={viewItem} />
          </div>
        ) : (
          <div className="module-profiling-panel mt-3">
            <p className="small text-secondary mb-3">
              Programs this beneficiary is enrolled in. Use <strong>View</strong> on a row to see all updates for that enrollment.
            </p>
            <DataTable
              columns={[
                { key: 'program_code', label: 'Code' },
                { key: 'program_name', label: 'Program' },
                { key: 'batch', label: 'Batch' },
                { key: 'enrollment_status', label: 'Status' },
                { key: 'date_enrolled', label: 'Enrolled', render: (row) => formatDisplayDateTime(row.date_enrolled) },
                { key: 'next_update_due_at', label: 'Next due', render: (row) => formatDisplayDateTime(row.next_update_due_at) },
              ]}
              rows={beneficiaryViewEnrollments}
              isLoading={beneficiaryViewEnrollmentsLoading}
              showRowNumber
              enablePagination
              pageSize={5}
              onViewRow={setBeneficiaryViewSelectedEnrollment}
            />
            {beneficiaryViewSelectedEnrollment ? (
              <div className="mt-4 pt-3 border-top module-profiling-updates-block">
                <h6 className="mb-2 fw-semibold">
                  <i className="fas fa-clipboard-check me-2 text-primary" aria-hidden />
                  Updates — {beneficiaryViewSelectedEnrollment.program_code}
                  {beneficiaryViewSelectedEnrollment.batch ? ` · ${beneficiaryViewSelectedEnrollment.batch}` : ''}
                </h6>
                <DataTable
                  columns={[
                    { key: 'status_label', label: 'Status' },
                    { key: 'update_date', label: 'Update date', render: (row) => formatDisplayDateTime(row.update_date) },
                    { key: 'amount_received', label: 'Amount', render: (row) => formatPhilippinePeso(row.amount_received) },
                    { key: 'remarks', label: 'Remarks' },
                  ]}
                  rows={beneficiaryViewUpdates}
                  isLoading={beneficiaryViewUpdatesLoading}
                  showRowNumber
                  enablePagination
                  pageSize={5}
                />
              </div>
            ) : (
              !beneficiaryViewEnrollmentsLoading &&
              beneficiaryViewEnrollments.length > 0 && (
                <p className="small text-muted mt-3 mb-0">Select <strong>View</strong> on an enrollment to load its updates.</p>
              )
            )}
          </div>
        )}
      </SystemPortalModal>
      <FormPortalModal
        isOpen={formOpen}
        title={editItem ? 'Update Beneficiary' : 'Add Beneficiary'}
        subtitle="Maintain beneficiary profile details."
        fields={fields}
        initialValues={beneficiaryInitialValues}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditItem(null) }}
        submitLabel={editItem ? 'Update Beneficiary' : 'Create Beneficiary'}
      />
      <ConfirmPortalModal
        isOpen={Boolean(deleteItem)}
        title="Delete beneficiary record?"
        message={`This action will remove ${deleteItem?.first_name || 'this'} ${deleteItem?.last_name || 'beneficiary'} from the registry.`}
        confirmLabel="Delete Beneficiary"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteItem(null)}
      />
    </Motion.div>
  )
}

export function ProgramEnrollmentsPage() {
  const enrollmentSearchId = useId()
  const enrollmentBeneficiarySelectId = useId()
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [beneficiaries, setBeneficiaries] = useState([])
  const [programs, setPrograms] = useState([])
  const [templateRows, setTemplateRows] = useState([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [enrollmentFormState, setEnrollmentFormState] = useState({})

  useEffect(() => {
    Promise.all([listEnrollments(), listBeneficiaries(), listPrograms(), listFieldTemplates()])
      .then(([enrollments, b, p, templates]) => {
        setRows(enrollments)
        setBeneficiaries(
          (b || []).map((row) => ({
            ...row,
            profile_photo_url: row.profile_photo_path ? buildStorageUrl(row.profile_photo_path) : null,
          })),
        )
        setPrograms(p.filter((item) => item.is_active))
        setTemplateRows(templates.filter((item) => item.is_active))
      })
      .catch((error) => toast.error(error.message || 'Failed to load enrollment data.'))
      .finally(() => setIsLoading(false))
  }, [])

  const refresh = async () => setRows(await listEnrollments())

  const beneficiaryOptions = beneficiaries.map((item) => {
    const nameLine = [item.last_name, item.first_name].filter(Boolean).join(', ')
    const withMiddle = item.middle_name ? `${nameLine} ${item.middle_name}`.trim() : nameLine
    const label = [withMiddle || 'Unnamed beneficiary', item.field_office].filter(Boolean).join(' · ')
    return { value: item.id, label }
  })
  const programOptions = programs.map((item) => ({ value: item.id, label: `${item.program_code} - ${item.program_name}` }))

  const columns = [
    { key: 'beneficiary_name', label: 'Beneficiary' },
    { key: 'program_code', label: 'Program Code' },
    { key: 'batch', label: 'Batch' },
    { key: 'enrollment_status', label: 'Status' },
    { key: 'date_enrolled', label: 'Date Enrolled', render: (row) => formatDisplayDateTime(row.date_enrolled) },
    { key: 'next_update_due_at', label: 'Next Due', render: (row) => formatDisplayDateTime(row.next_update_due_at) },
  ]

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return rows
    return rows.filter((row) =>
      [row.beneficiary_name, row.program_name, row.program_code, row.batch, row.enrollment_status].some((value) => String(value || '').toLowerCase().includes(keyword)),
    )
  }, [rows, search])

  const fields = [
    {
      name: 'beneficiary_id',
      label: 'Beneficiary',
      type: 'select',
      required: true,
      options: beneficiaryOptions,
      colClass: 'col-12',
      inputId: enrollmentBeneficiarySelectId,
      placeholder: 'Select beneficiary',
      helpText: 'Choose a beneficiary; the profile preview updates on the right.',
      adjacentLeftColClass: 'col-12 col-lg-5 col-xl-4 enrollment-beneficiary-select-col',
      adjacentRightColClass: 'col-12 col-lg-7 col-xl-8 enrollment-beneficiary-preview-col',
      adjacent: (form) => {
        const rawId = form.beneficiary_id
        const id = rawId === '' || rawId == null ? 0 : Number(rawId)
        const record = id ? beneficiaries.find((b) => Number(b.id) === id) : null
        return (
          <div className="enrollment-beneficiary-adjacent">
            <div className="portal-form-section-title enrollment-beneficiary-adjacent-heading">
              <i className="fas fa-id-card me-2" aria-hidden="true" />
              Selected beneficiary profile
            </div>
            {!record ? (
              <div className="enrollment-beneficiary-preview enrollment-beneficiary-preview-empty enrollment-beneficiary-preview-inline">
                <p className="mb-0 small text-secondary">
                  Select a beneficiary on the left to view identity and OFW linkage details.
                </p>
              </div>
            ) : (
              <div className="enrollment-beneficiary-preview-card">
                <BeneficiaryDetailsCard record={record} />
              </div>
            )}
          </div>
        )
      },
    },
    { name: 'program_id', label: 'Program', type: 'select', required: true, options: programOptions, colClass: 'col-12' },
    { name: 'batch', label: 'Batch' },
    { name: 'date_enrolled', label: 'Date Enrolled', type: 'date' },
    {
      name: 'enrollment_status',
      label: 'Enrollment Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'suspended', label: 'Suspended' },
      ],
    },
    { name: 'notes', label: 'Notes' },
  ]

  const selectedProgramId = Number(enrollmentFormState.program_id || editItem?.program_id || 0)
  const dynamicTemplateFields = templateRows
    .filter((item) => item.program_id === selectedProgramId && item.field_scope === 'input')
    .sort((a, b) => a.display_order - b.display_order)
    .map((item) => ({
      name: `dynamic_${item.field_key}`,
      label: item.field_label,
      type: item.field_type === 'textarea' ? 'textarea' : item.field_type === 'date' ? 'date' : item.field_type === 'number' ? 'number' : 'text',
      required: Boolean(item.is_required),
      colClass: 'col-md-6',
    }))

  const formFields = [...fields, ...dynamicTemplateFields]

  const extractDynamicPayload = (payload) => {
    const dynamic = {}
    Object.entries(payload).forEach(([key, value]) => {
      if (key.startsWith('dynamic_') && value !== '' && value != null) {
        dynamic[key.replace('dynamic_', '')] = value
      }
    })
    return dynamic
  }

  const toPayload = (payload) => ({
    beneficiary_id: Number(payload.beneficiary_id),
    program_id: Number(payload.program_id),
    batch: payload.batch || null,
    date_enrolled: payload.date_enrolled || null,
    enrollment_status: payload.enrollment_status || 'active',
    notes: payload.notes || null,
    input_payload: extractDynamicPayload(payload),
  })

  const handleSubmit = async (payload) => {
    try {
      if (editItem) {
        await updateEnrollment(editItem.id, toPayload(payload))
        toast.success('Enrollment updated successfully.')
      } else {
        await createEnrollment(toPayload(payload))
        toast.success('Enrollment created successfully.')
      }
      await refresh()
    } catch (error) {
      toast.error(error.message || 'Unable to save enrollment.')
      throw error
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteEnrollment(deleteItem.id)
      toast.success('Enrollment deleted successfully.')
      setDeleteItem(null)
      await refresh()
    } catch (error) {
      toast.error(error.message || 'Unable to delete enrollment.')
    }
  }

  const editInitialValues = editItem
    ? {
        ...editItem,
        beneficiary_id: editItem.beneficiary_id?.toString(),
        program_id: editItem.program_id?.toString(),
        ...Object.fromEntries(Object.entries(editItem.input_payload || {}).map(([k, v]) => [`dynamic_${k}`, v])),
      }
    : { enrollment_status: 'active' }

  return (
    <Motion.div className="page-enter" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: 'easeOut' }}>
      <ModulePageShell>
        <ModulePageHeader
          title="Program Enrollments"
          subtitle="Enroll beneficiaries into OWWA programs and maintain enrollment status."
          iconClassName="fas fa-user-plus"
          rightSlot={
            <button type="button" className="btn btn-primary module-registry-add-btn" onClick={() => { setEditItem(null); setEnrollmentFormState({}); setFormOpen(true) }}>
              <FaPlus className="me-2" />
              Add Enrollment
            </button>
          }
        />
      </ModulePageShell>
      <ModuleSearchPanelRow
        label="Search enrollments"
        inputId={enrollmentSearchId}
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by beneficiary, program, batch, or status..."
      />
      <DataTable
        columns={columns}
        rows={filteredRows}
        isLoading={isLoading}
        showRowNumber
        actionsPosition="start"
        enablePagination
        pageSize={10}
        onViewRow={setViewItem}
        onEditRow={(row) => { setEditItem(row); setEnrollmentFormState(row); setFormOpen(true) }}
        onDeleteRow={setDeleteItem}
      />
      <SystemPortalModal
        isOpen={Boolean(viewItem)}
        title="Enrollment Details"
        subtitle="Review beneficiary, program, enrollment status, and key dates for this record."
        onClose={() => setViewItem(null)}
      >
        <RecordDetails
          record={viewItem}
          eyebrow="Program enrollment"
          heroIconClass="fas fa-user-plus"
          hideKeys={ENROLLMENT_VIEW_HIDDEN_KEYS}
        />
      </SystemPortalModal>
      <FormPortalModal
        isOpen={formOpen}
        title={editItem ? 'Update Enrollment' : 'Add Enrollment'}
        subtitle="Link beneficiary and program details."
        fields={formFields}
        initialValues={editInitialValues}
        onFormChange={setEnrollmentFormState}
        onSubmit={handleSubmit}
        onClose={() => { setFormOpen(false); setEditItem(null); setEnrollmentFormState({}) }}
        submitLabel={editItem ? 'Update Enrollment' : 'Create Enrollment'}
        modalClassName="portal-system-modal-enrollment"
      />
      <ConfirmPortalModal
        isOpen={Boolean(deleteItem)}
        title="Delete enrollment record?"
        message="This will remove the enrollment and related progress history."
        confirmLabel="Delete Enrollment"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteItem(null)}
      />
    </Motion.div>
  )
}

export function ProgramUpdatesPage() {
  const updatesSearchId = useId()
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [enrollments, setEnrollments] = useState([])
  const [statusOptions, setStatusOptions] = useState([])
  const [templateRows, setTemplateRows] = useState([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [addUpdateFormSeed, setAddUpdateFormSeed] = useState(0)
  const [viewItem, setViewItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [updateFormState, setUpdateFormState] = useState({})

  useEffect(() => {
    Promise.all([listProgramUpdates(), listEnrollments(), listStatusOptions(), listFieldTemplates()])
      .then(([updates, e, s, templates]) => {
        setRows(updates)
        setEnrollments(e)
        setStatusOptions(s.filter((item) => item.is_active))
        setTemplateRows(templates.filter((item) => item.is_active))
      })
      .catch((error) => toast.error(error.message || 'Failed to load program updates.'))
      .finally(() => setIsLoading(false))
  }, [])

  const refresh = async () => setRows(await listProgramUpdates())
  const selectedEnrollmentId = Number(updateFormState.program_enrollment_id || 0)
  const selectedEnrollment = enrollments.find((item) => item.id === selectedEnrollmentId)
  const selectedProgramId = selectedEnrollment?.program_id

  const enrollmentOptions = useMemo(
    () =>
      enrollments.map((item) => ({
        value: item.id,
        label: `${item.beneficiary_name} - ${item.program_code}`,
      })),
    [enrollments],
  )

  const statusOptionItems = useMemo(
    () =>
      statusOptions
        .filter((item) => !selectedProgramId || item.program_id === selectedProgramId)
        .map((item) => ({
          value: item.id,
          label: `${item.program_code}: ${item.status_label}`,
        })),
    [statusOptions, selectedProgramId],
  )

  const columns = [
    { key: 'beneficiary_name', label: 'Beneficiary' },
    { key: 'program_name', label: 'Program' },
    { key: 'status_label', label: 'Status' },
    { key: 'update_date', label: 'Update Date', render: (row) => formatDisplayDateTime(row.update_date) },
    { key: 'amount_received', label: 'Amount Received', render: (row) => formatPhilippinePeso(row.amount_received) },
    { key: 'remarks', label: 'Remarks' },
  ]

  const fields = useMemo(() => {
    const baseFields = [
      { name: 'program_enrollment_id', label: 'Enrollment', type: 'select', required: true, options: enrollmentOptions, colClass: 'col-12' },
      { name: 'status_option_id', label: 'Status', type: 'select', options: statusOptionItems, colClass: 'col-12' },
      { name: 'update_date', label: 'Update Date', type: 'date', required: true },
      { name: 'amount_received', label: 'Amount Received', type: 'number' },
      { name: 'remarks', label: 'Remarks' },
    ]
    const dynamicUpdateFields = templateRows
      .filter((item) => item.program_id === selectedProgramId && item.field_scope === 'update')
      .sort((a, b) => a.display_order - b.display_order)
      .map((item) => ({
        name: `dynamic_${item.field_key}`,
        label: item.field_label,
        type: item.field_type === 'textarea' ? 'textarea' : item.field_type === 'date' ? 'date' : item.field_type === 'number' ? 'number' : 'text',
        required: Boolean(item.is_required),
        colClass: 'col-md-6',
      }))
    return [...baseFields, ...dynamicUpdateFields]
  }, [enrollmentOptions, statusOptionItems, templateRows, selectedProgramId])

  // `addUpdateFormSeed` bumps when opening the modal so the default date is always "today".
  // eslint-disable-next-line react-hooks/exhaustive-deps -- invalidation-only dependency
  const addUpdateInitialValues = useMemo(() => ({ update_date: new Date().toISOString().slice(0, 10) }), [addUpdateFormSeed])

  const closeAddUpdateModal = useCallback(() => {
    setFormOpen(false)
    setUpdateFormState({})
  }, [])

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return rows
    return rows.filter((row) => [row.beneficiary_name, row.program_name, row.status_label, row.remarks].some((value) => String(value || '').toLowerCase().includes(keyword)))
  }, [rows, search])

  const handleSubmit = async (payload) => {
    const updatePayload = {}
    Object.entries(payload).forEach(([key, value]) => {
      if (key.startsWith('dynamic_') && value !== '' && value != null) {
        updatePayload[key.replace('dynamic_', '')] = value
      }
    })

    try {
      await createProgramUpdate({
        program_enrollment_id: Number(payload.program_enrollment_id),
        status_option_id: payload.status_option_id ? Number(payload.status_option_id) : null,
        amount_received: payload.amount_received ? Number(payload.amount_received) : null,
        update_date: payload.update_date,
        remarks: payload.remarks || null,
        update_payload: updatePayload,
      })
      toast.success('Program update saved successfully.')
      await refresh()
    } catch (error) {
      toast.error(error.message || 'Unable to save update.')
      throw error
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    try {
      await deleteProgramUpdate(deleteItem.id)
      toast.success('Program update deleted successfully.')
      setDeleteItem(null)
      await refresh()
    } catch (error) {
      toast.error(error.message || 'Unable to delete update.')
    }
  }

  return (
    <Motion.div className="page-enter" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: 'easeOut' }}>
      <ModulePageShell>
        <ModulePageHeader
          title="Program Updates"
          subtitle="Record periodic status and assistance updates per enrollment."
          iconClassName="fas fa-sync-alt"
          rightSlot={
            <button
              type="button"
              className="btn btn-primary module-registry-add-btn"
              onClick={() => {
                setAddUpdateFormSeed((previous) => previous + 1)
                setFormOpen(true)
              }}
            >
              <FaPlus className="me-2" />
              Add Update
            </button>
          }
        />
      </ModulePageShell>
      <ModuleSearchPanelRow
        label="Search updates"
        inputId={updatesSearchId}
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by beneficiary, program, status, or remarks..."
      />
      <DataTable
        columns={columns}
        rows={filteredRows}
        isLoading={isLoading}
        showRowNumber
        actionsPosition="start"
        enablePagination
        pageSize={10}
        onViewRow={setViewItem}
        onDeleteRow={setDeleteItem}
      />
      <SystemPortalModal
        isOpen={Boolean(viewItem)}
        title="Program Update Details"
        subtitle="Review beneficiary, program, status, assistance amount, and remarks for this update."
        onClose={() => setViewItem(null)}
      >
        <RecordDetails
          record={viewItem}
          eyebrow="Program update"
          heroIconClass="fas fa-sync-alt"
          hideKeys={PROGRAM_UPDATE_VIEW_HIDDEN_KEYS}
        />
      </SystemPortalModal>
      <FormPortalModal
        isOpen={formOpen}
        title="Add Program Update"
        subtitle="Capture update status, amount received, and remarks."
        fields={fields}
        initialValues={addUpdateInitialValues}
        onFormChange={setUpdateFormState}
        onSubmit={handleSubmit}
        onClose={closeAddUpdateModal}
        submitLabel="Save Update"
      />
      <ConfirmPortalModal
        isOpen={Boolean(deleteItem)}
        title="Delete update entry?"
        message="This will remove the selected update entry."
        confirmLabel="Delete Update"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteItem(null)}
      />
    </Motion.div>
  )
}

function isDueNotificationUnread(row) {
  return String(row?.status || '').toLowerCase() !== 'read'
}

export function NotificationsPage() {
  const notificationsSearchId = useId()
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [isMarkingRead, setIsMarkingRead] = useState(false)

  useEffect(() => {
    listNotifications()
      .then(setRows)
      .catch((error) => toast.error(error.message || 'Failed to load notifications.'))
      .finally(() => setIsLoading(false))
  }, [])

  const refresh = async () => setRows(await listNotifications())
  const columns = [
    {
      key: 'status',
      label: 'Read state',
      minWidth: 140,
      render: (row) => {
        const unread = isDueNotificationUnread(row)
        return (
          <span className={unread ? 'due-notification-pill due-notification-pill-unread' : 'due-notification-pill due-notification-pill-read'}>
            <span className="due-notification-pill-dot" aria-hidden />
            {unread ? 'Unread' : 'Read'}
          </span>
        )
      },
    },
    { key: 'beneficiary_name', label: 'Beneficiary' },
    { key: 'program_name', label: 'Program' },
    { key: 'title', label: 'Title' },
    { key: 'due_date', label: 'Due Date', render: (row) => formatDisplayDateTime(row.due_date) },
  ]
  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return rows
    return rows.filter((row) => {
      const fields = [row.beneficiary_name, row.program_name, row.title, row.status].map((v) => String(v || '').toLowerCase())
      const matchesField = fields.some((v) => v.includes(keyword))
      const readHint = isDueNotificationUnread(row) ? 'unread open' : 'read'
      return matchesField || readHint.includes(keyword)
    })
  }, [rows, search])

  const { unreadCount, readCount } = useMemo(() => {
    let unread = 0
    let read = 0
    for (const row of filteredRows) {
      if (isDueNotificationUnread(row)) unread += 1
      else read += 1
    }
    return { unreadCount: unread, readCount: read }
  }, [filteredRows])

  const handleMarkRead = async (row) => {
    if (!row?.id) return
    setIsMarkingRead(true)
    try {
      await markNotificationRead(row.id)
      toast.success('Notification marked as read.')
      await refresh()
      notifyDueNotificationsChanged()
      setSelected(null)
    } catch (error) {
      toast.error(error.message || 'Unable to update notification.')
    } finally {
      setIsMarkingRead(false)
    }
  }

  const handleDeleteNotification = async () => {
    if (!deleteItem) return
    try {
      await deleteNotification(deleteItem.id)
      toast.success('Notification deleted successfully.')
      if (selected?.id === deleteItem.id) setSelected(null)
      setDeleteItem(null)
      await refresh()
      notifyDueNotificationsChanged()
    } catch (error) {
      toast.error(error.message || 'Unable to delete notification.')
    }
  }

  return (
    <Motion.div className="page-enter" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: 'easeOut' }}>
      <ModulePageShell>
        <ModulePageHeader
          title="Due Notifications"
          subtitle="Track due/overdue beneficiary update notices."
          iconClassName="fas fa-bell"
        />
      </ModulePageShell>
      <ModuleSearchPanelRow
        label="Search notifications"
        inputId={notificationsSearchId}
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by beneficiary, program, title, status, or type unread / read..."
      />
      {!isLoading && filteredRows.length ? (
        <Motion.div
          className="due-notification-summary-bar"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
        >
          <span className="due-notification-summary-chip due-notification-summary-chip-unread">
            <i className="fas fa-envelope-open-text me-1" aria-hidden />
            Unread
            <strong>{unreadCount}</strong>
          </span>
          <span className="due-notification-summary-chip due-notification-summary-chip-read">
            <i className="fas fa-check-double me-1" aria-hidden />
            Read
            <strong>{readCount}</strong>
          </span>
        </Motion.div>
      ) : null}
      <DataTable
        columns={columns}
        rows={filteredRows}
        isLoading={isLoading}
        showRowNumber
        actionsPosition="start"
        enablePagination
        pageSize={10}
        onViewRow={setSelected}
        onDeleteRow={setDeleteItem}
        getRowClassName={(row) => (isDueNotificationUnread(row) ? 'due-notification-row-unread' : 'due-notification-row-read')}
      />
      <SystemPortalModal
        isOpen={Boolean(selected)}
        title="Notification Details"
        subtitle="Review due notice details; mark as read when action is complete."
        onClose={() => setSelected(null)}
      >
        <RecordDetails record={selected} eyebrow="Due notification" heroIconClass="fas fa-bell" />
        <div className="portal-notification-actions portal-notification-actions-split">
          <button
            type="button"
            className="btn btn-outline-danger account-approvals-detail-close-btn"
            onClick={() => {
              setDeleteItem(selected)
              setSelected(null)
            }}
            disabled={!selected || isMarkingRead}
          >
            Delete
          </button>
          <button
            type="button"
            className="btn btn-primary account-approvals-detail-close-btn"
            onClick={() => handleMarkRead(selected)}
            disabled={!selected || !isDueNotificationUnread(selected) || isMarkingRead}
            aria-busy={isMarkingRead}
          >
            {isMarkingRead ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Marking as read…
              </>
            ) : isDueNotificationUnread(selected) ? (
              'Mark as Read'
            ) : (
              'Already Read'
            )}
          </button>
        </div>
      </SystemPortalModal>
      <ConfirmPortalModal
        isOpen={Boolean(deleteItem)}
        title="Delete this notification?"
        message={
          deleteItem
            ? `This will permanently remove "${String(deleteItem.title || 'this notice').trim() || 'this notice'}" from the due notifications list.`
            : ''
        }
        confirmLabel="Delete Notification"
        danger
        onConfirm={handleDeleteNotification}
        onClose={() => setDeleteItem(null)}
      />
    </Motion.div>
  )
}

const scholarColumns = [
  { key: 'last_name', label: 'Last Name' },
  { key: 'first_name', label: 'First Name' },
  { key: 'school_name', label: 'School' },
  { key: 'course', label: 'Course' },
  { key: 'year_level', label: 'Year Level' },
]

const scholarRows = [
  { id: 1, last_name: 'Garcia', first_name: 'John', school_name: 'WMSU', course: 'BSIT', year_level: '3rd Year' },
  { id: 2, last_name: 'Torres', first_name: 'Mae', school_name: 'Ateneo de Zamboanga', course: 'BSN', year_level: '2nd Year' },
]

export function SkillsEmploymentPage() {
  return <ProgramTemplatePage title="Skills for Employment Scholarship Program (SESP)" subtitle="Manage and view all SESP beneficiary records." columns={scholarColumns} rows={scholarRows} />
}
export function SeafarerUpgradingPage() {
  return <ProgramTemplatePage title="Seafarer's Upgrading Program (SUP)" subtitle="Manage and view all SUP beneficiary records." columns={scholarColumns} rows={scholarRows} />
}
export function InformationTechnologyPage() {
  return <ProgramTemplatePage title="Information Technology (IT) Program" subtitle="Manage and view all IT Program beneficiary records." columns={scholarColumns} rows={scholarRows} />
}
export function EducationalDevelopmentPage() {
  return <ProgramTemplatePage title="Educational for Development Scholarship Program (EDSP)" subtitle="Manage and view all EDSP beneficiary records." columns={scholarColumns} rows={scholarRows} />
}
export function OfwDependentPage() {
  return <ProgramTemplatePage title="OFW Dependent Scholarship Program (ODSP)" subtitle="Manage and view all ODSP beneficiary records." columns={scholarColumns} rows={scholarRows} />
}
export function EducationLivelihoodPage() {
  return <ProgramTemplatePage title="Education and Livelihood Assistance Program (ELAP)" subtitle="Manage and view all ELAP beneficiary records." columns={scholarColumns} rows={scholarRows} />
}
export function TuloyAralPage() {
  return <ProgramTemplatePage title="Tuloy Aral Program (TAP)" subtitle="Manage and view all TAP beneficiary records." columns={scholarColumns} rows={scholarRows} />
}
export function CongressionalMigrantPage() {
  return <ProgramTemplatePage title="Congressional Migrant Workers Scholarship Program (CMWSP)" subtitle="Manage and view all CMWSP beneficiary records." columns={scholarColumns} rows={scholarRows} />
}
export function BalikPinasPage() {
  return <ProgramTemplatePage title="Balik-Pinas Hanapbuhay Program" subtitle="Manage and view all Balik-Pinas Hanapbuhay beneficiary records." columns={scholarColumns} rows={scholarRows} />
}
export function ReportsAnalyticsPage() {
  const reportDateFromId = useId()
  const reportDateToId = useId()
  const [filters, setFilters] = useState({ from: '', to: '' })
  const [report, setReport] = useState({ enrollments_by_program: [], updates_by_status: [] })
  const [isLoading, setIsLoading] = useState(false)

  const loadReport = async (nextFilters = filters) => {
    setIsLoading(true)
    try {
      const data = await getReportSummary(nextFilters)
      setReport(data)
    } catch (error) {
      toast.error(error.message || 'Unable to load report summary.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enrollmentColumns = [
    { key: 'program_code', label: 'Program Code' },
    { key: 'program_name', label: 'Program Name' },
    { key: 'total', label: 'Total Enrollments' },
  ]

  const updateColumns = [
    { key: 'status_label', label: 'Status' },
    { key: 'total', label: 'Update Count' },
    { key: 'total_amount', label: 'Total Amount Received', render: (row) => formatPhilippinePeso(row.total_amount) },
  ]

  return (
    <Motion.div className="page-enter" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: 'easeOut' }}>
      <ModulePageShell>
        <ModulePageHeader
          title="Reports"
          subtitle="Generate summary analytics for enrollments and update outcomes."
          iconClassName="fas fa-chart-bar"
        />
      </ModulePageShell>
      <Motion.div
        className="module-panel module-search-panel module-search-panel-accent align-items-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.24 }}
      >
        <div className="module-search-icon-wrap">
          <i className="fas fa-filter" />
        </div>
        <div className="module-search-content flex-grow-1 w-100">
          <label className="module-search-label" htmlFor={reportDateFromId}>Report period</label>
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label small text-secondary mb-1" htmlFor={reportDateFromId}>From</label>
              <input
                id={reportDateFromId}
                type="date"
                className="form-control module-filter-input module-search-input"
                value={filters.from}
                onChange={(event) => setFilters((previous) => ({ ...previous, from: event.target.value }))}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small text-secondary mb-1" htmlFor={reportDateToId}>To</label>
              <input
                id={reportDateToId}
                type="date"
                className="form-control module-filter-input module-search-input"
                value={filters.to}
                onChange={(event) => setFilters((previous) => ({ ...previous, to: event.target.value }))}
              />
            </div>
            <div className="col-md-4">
              <button type="button" className="btn btn-primary module-registry-add-btn w-100" onClick={() => loadReport(filters)} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Generate Summary'}
              </button>
            </div>
          </div>
        </div>
      </Motion.div>

      <div className="row g-3">
        <div className="col-lg-6 d-flex flex-column gap-2">
          <div className="px-1">
            <h3 className="h6 fw-bold text-primary mb-1">Enrollments by Program</h3>
            <p className="small text-secondary mb-0">Program distribution of enrolled beneficiaries.</p>
          </div>
          <DataTable columns={enrollmentColumns} rows={report.enrollments_by_program || []} isLoading={isLoading} showRowNumber enablePagination pageSize={10} />
        </div>
        <div className="col-lg-6 d-flex flex-column gap-2">
          <div className="px-1">
            <h3 className="h6 fw-bold text-primary mb-1">Updates by Status</h3>
            <p className="small text-secondary mb-0">Total updates and assistance amounts per status.</p>
          </div>
          <DataTable columns={updateColumns} rows={report.updates_by_status || []} isLoading={isLoading} showRowNumber enablePagination pageSize={10} />
        </div>
      </div>
    </Motion.div>
  )
}
export function DataBackupPage() {
  return (
    <Motion.div className="page-enter" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, ease: 'easeOut' }}>
           <ModulePageShell>
        <ModulePageHeader
          title="Data Backup"
          subtitle="Manage backup schedules and restore points for system continuity."
          iconClassName="fas fa-database"
        />
      </ModulePageShell>
    </Motion.div>
  )
}
