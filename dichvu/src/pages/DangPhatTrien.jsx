import { Link } from 'react-router-dom'

export default function ComingSoon({ title, code, backTo = '/dat-lich', backLabel = 'Về trang Đặt lịch' }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h1 className="text-2xl font-extrabold text-slate-800">{title}</h1>
      <p className="mt-2 text-slate-500">
        Màn hình này{code ? ` (${code})` : ''} sẽ được làm ở bước tiếp theo.
      </p>
      <Link
        to={backTo}
        className="mt-6 inline-block rounded-full bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800"
      >
        {backLabel}
      </Link>
    </div>
  )
}
