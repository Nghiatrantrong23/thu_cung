import { useEffect, useState } from 'react'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { Photo } from '../nhan-vien/ChungCuChamSoc.jsx'

export default function AnhChamSocCuaToi({ bookingId }) {
  const { apiCall, token } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setData(null)
    apiCall(`/api/lich-hen/${bookingId}/chung-cu`).then(result => {
      if (!active) return
      if (result.ok) { setData(result.data); setError('') }
      else setError(result.error)
    })
    return () => { active = false }
  }, [apiCall, bookingId])
  if (error) return <p role="alert" className="mt-4 text-rose-700">{error}</p>
  return <section className="mt-6 border-t pt-5"><h3 className="font-extrabold">Nhật ký chăm sóc</h3>
    {!data ? <p className="text-sm text-slate-500">Đang tải…</p> : <>
      {data.notes.length ? <ul className="mt-2 space-y-2">{data.notes.map(note => <li key={note.id} className="rounded-lg bg-slate-50 p-3 text-sm">{note.text}<span className="block text-slate-500">{note.author} · {new Date(note.createdAt).toLocaleString('vi-VN')}</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-500">Chưa có ghi chú.</p>}
      {data.photoConsent ? <div className="mt-4 space-y-4">{[['Truoc','Ảnh trước chăm sóc'],['Sau','Ảnh sau chăm sóc']].map(([kind,label]) => <div key={kind}><h4 className="font-bold">{label}</h4><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{data.images.filter(item => item.kind === kind).map(item => <Photo key={item.id} bookingId={bookingId} item={item} token={token}/>)}</div>{!data.images.some(item => item.kind === kind) && <p className="text-sm text-slate-500">Chưa có ảnh.</p>}</div>)}</div> : <p className="mt-3 text-sm text-slate-500">Ảnh chăm sóc chưa được chủ nuôi cho phép hiển thị. Có thể đổi trong hồ sơ thú cưng.</p>}
    </>}
  </section>
}
