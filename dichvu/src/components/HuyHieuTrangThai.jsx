const STYLES = {
  'Chờ xác nhận': 'bg-amber-100 text-amber-800',
  'Đã xác nhận': 'bg-sky-100 text-sky-800',
  'Đang thực hiện': 'bg-indigo-100 text-indigo-800',
  'Hoàn thành': 'bg-emerald-100 text-emerald-800',
  'Đã hủy': 'bg-slate-100 text-slate-700',
  'Từ chối': 'bg-rose-100 text-rose-800',
  'Đang theo dõi': 'bg-emerald-100 text-emerald-800',
  'Ngừng theo dõi': 'bg-slate-200 text-slate-600',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${
        STYLES[status] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  )
}
