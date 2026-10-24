const variants = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'text-brand-700 hover:bg-brand-50',
}
export default function Button({variant='primary',pending=false,disabled=false,type='button',className='',children,...props}) {
  return <button {...props} type={type} disabled={disabled||pending} aria-busy={pending||undefined}
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]||variants.primary} ${className}`}>
    {pending&&<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true"/>}{children}
  </button>
}
