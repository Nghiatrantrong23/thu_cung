import { useEffect } from 'react'

export default function ConfirmDialog({ title, children, confirmLabel, cancelLabel = 'Quay lại', onConfirm, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-xl font-extrabold text-slate-800">
          {title}
        </h2>
        <div className="mt-2 text-slate-600">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-slate-600 hover:border-brand-600 hover:text-brand-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white hover:bg-rose-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
