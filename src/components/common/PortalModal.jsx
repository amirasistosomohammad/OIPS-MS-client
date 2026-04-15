import { createPortal } from 'react-dom'

export default function PortalModal({ isOpen, children, onBackdropClick }) {
  if (!isOpen) return null

  return createPortal(
    <div className="account-approvals-detail-overlay" role="dialog" aria-modal="true">
      <div className="account-approvals-detail-backdrop modal-backdrop-animation" onClick={onBackdropClick} aria-hidden />
      {children}
    </div>,
    document.body,
  )
}
