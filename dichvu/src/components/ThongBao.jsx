import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../data/khoXacThuc.jsx'

export default function ThongBao({ defaultOpen = false }) {
  const { apiCall } = useAuth()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    const result = await apiCall('/api/thong-bao')
    if (result.ok) { setItems(result.data.thongBao); setError('') }
    else setError(result.error)
    setLoading(false)
  }, [apiCall])
  useEffect(() => { load() }, [load])
  async function read(id) {
    const result = await apiCall(`/api/thong-bao/${id}/da-doc`, { method: 'PATCH' })
    if (result.ok) setItems(rows => rows.map(row => row.id === id ? { ...row, read: true } : row))
    else setError(result.error)
  }
  return (
    <details open={defaultOpen || undefined} className="my-4 rounded-xl border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer font-bold text-brand-800">Thông báo ({items.filter(item => !item.read).length} chưa đọc trong 50 tin gần nhất)</summary>
      <button type="button" onClick={load} disabled={loading} className="my-3 font-semibold text-brand-700 disabled:opacity-50">{loading ? 'Đang tải...' : 'Tải lại thông báo'}</button>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {!loading && !items.length && !error && <p className="text-slate-500">Chưa có thông báo.</p>}
      <ul className="max-h-80 space-y-3 overflow-auto">
        {items.map(item => <li key={item.id} className={`rounded-lg border p-3 ${item.read ? 'border-slate-100' : 'border-brand-200 bg-brand-50'}`}>
          <p className="font-bold">{item.title}</p><p className="text-sm text-slate-600">{item.message}</p>
          {!item.read && <button type="button" onClick={() => read(item.id)} className="mt-2 text-sm font-bold text-brand-700">Đánh dấu đã đọc</button>}
        </li>)}
      </ul>
    </details>
  )
}
