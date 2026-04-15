import { useState } from 'react'
import PortalModal from './PortalModal'

export default function SystemPortalModal({ isOpen, title, subtitle, children, onClose, modalClassName = '' }) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    if (isClosing) return
    setIsClosing(true)
    window.setTimeout(() => {
      setIsClosing(false)
      onClose?.()
    }, 200)
  }

  return (
    <PortalModal isOpen={isOpen} onBackdropClick={handleClose}>
      <div className={`account-approvals-detail-modal modal-content-animation portal-system-modal ${modalClassName}${isClosing ? ' exit' : ''}`.trim()}>
        <div className="account-approvals-detail-header portal-system-header">
          <div className="account-approvals-detail-header-text pe-4">
            <h5 className="mb-1 fw-bold">{title}</h5>
            {subtitle ? <p className="mb-0 small portal-system-subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="btn-close-custom" onClick={handleClose} aria-label="Close modal">
            <span aria-hidden>&times;</span>
          </button>
        </div>
        <div className="account-approvals-detail-body portal-system-body">
          {children}
        </div>
      </div>
    </PortalModal>
  )
}
