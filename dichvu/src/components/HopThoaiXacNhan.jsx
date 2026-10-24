import Modal from './ui/Modal.jsx'
import Button from './ui/Button.jsx'
export default function ConfirmDialog({title,children,confirmLabel,cancelLabel='Quay lại',onConfirm,onClose,busy=false}){
  return <Modal title={title} onClose={onClose} busy={busy} footer={<><Button variant="secondary" onClick={onClose} disabled={busy} autoFocus>{cancelLabel}</Button><Button variant="danger" onClick={onConfirm} pending={busy}>{confirmLabel}</Button></>}>{children}</Modal>
}
