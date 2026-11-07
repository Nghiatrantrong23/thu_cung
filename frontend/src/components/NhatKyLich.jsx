import { useEffect, useState } from 'react'
import { useAuth } from '../data/khoXacThuc.jsx'
export default function NhatKyLich({ id, version = 0 }) {
  const { apiCall } = useAuth()
  const [items, setItems] = useState([]), [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setItems([]); setError('')
    apiCall(`/api/lich-hen/${id}/nhat-ky`).then(result => {
      if (!active) return
      if (result.ok) setItems(result.data.nhatKy)
      else setError(result.error)
    })
    return () => { active = false }
  }, [id, version, apiCall])
  return <details className="mt-4 rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer font-bold">Nhật ký xử lý</summary>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!items.length && !error && <p className="mt-2 text-sm text-slate-500">Chưa có nhật ký.</p>}
    <ul className="mt-3 space-y-3 text-sm">{items.map(row => <li key={row.id} className="border-t border-slate-100 pt-2"><p className="font-bold">{row.action} · {row.actor}</p><p className="whitespace-pre-wrap">{row.note}</p></li>)}</ul>
  </details>
}
