import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const ReactSwal = withReactContent(Swal)

export function confirmAction({ title, text, confirmButtonText = 'Yes', cancelButtonText = 'Cancel' }) {
  return ReactSwal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    confirmButtonColor: '#0038A8',
    cancelButtonColor: '#64748b',
    focusCancel: true,
  })
}

export function showErrorAlert({ title = 'Request failed', text = 'Please try again.' }) {
  return ReactSwal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: '#CE1126',
  })
}
