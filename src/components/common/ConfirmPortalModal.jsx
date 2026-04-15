import { useState } from 'react'
import SystemPortalModal from './SystemPortalModal'

export default function ConfirmPortalModal({ isOpen, title, message, confirmLabel = 'Confirm', onConfirm, onClose, danger = false }) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      await onConfirm?.()
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <SystemPortalModal
      isOpen={isOpen}
      title={title}
      subtitle=""
      onClose={onClose}
      modalClassName="portal-system-modal-compact portal-system-modal-confirm"
    >
      <p className="portal-confirm-message text-secondary">{message}</p>
      <div className="account-approvals-detail-footer portal-system-footer portal-confirm-footer">
        <button type="button" className="btn btn-light account-approvals-detail-close-btn" onClick={onClose} disabled={isProcessing}>
          Cancel
        </button>
        <button type="button" className={`btn account-approvals-detail-close-btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={handleConfirm} disabled={isProcessing}>
          {isProcessing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Processing...
            </>
          ) : confirmLabel}
        </button>
      </div>
    </SystemPortalModal>
  )
}
