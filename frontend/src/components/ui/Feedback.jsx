import Button from './Button.jsx'
export function Skeleton({label='Đang tải dữ liệu',rows=3}) {
  return <div role="status" aria-label={label} aria-busy="true" className="space-y-3"><span className="sr-only">{label}</span>{Array.from({length:rows},(_,i)=><div key={i} aria-hidden="true" className="h-14 animate-pulse rounded-xl bg-slate-100"/>)}</div>
}
export function EmptyState({title='Chưa có dữ liệu',description,action}) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center"><span aria-hidden="true" className="mx-auto mb-3 block text-3xl text-brand-600">◇</span><h3 className="font-bold text-slate-800">{title}</h3>{description&&<p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>}{action&&<div className="mt-5">{action}</div>}</div>
}
export function ErrorState({message,onRetry,pending=false}) {
  return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><p role="alert" className="text-sm font-semibold text-rose-800">{message||'Không tải được dữ liệu. Vui lòng thử lại.'}</p>{onRetry&&<Button variant="secondary" className="mt-3" pending={pending} onClick={onRetry}>Thử lại</Button>}</div>
}
