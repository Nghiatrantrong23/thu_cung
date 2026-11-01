import { useEffect, useState } from 'react'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { toISODate } from '../../lib/tinhGioTrong.js'

const field = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900'
const button = 'rounded-full bg-brand-700 px-5 py-2 font-bold text-white disabled:opacity-50'
const sections = [ ['thu-cung','Thú cưng'], ['lich-hen','Lịch hẹn'], ['hoa-don','Hóa đơn'], ['khieu-nai','Khiếu nại'] ]
function petAge(birthDate) {
  if (!birthDate) return ''
  const [year, month, day] = birthDate.split('-').map(Number)
  const [nowYear, nowMonth, nowDay] = toISODate(new Date()).split('-').map(Number)
  const months = (nowYear - year) * 12 + nowMonth - month - (nowDay < day ? 1 : 0)
  return months >= 12 ? `${Math.floor(months / 12)} tuổi` : `${Math.max(months, 0)} tháng tuổi`
}

export default function KhachHangTaiQuay() {
  const { apiCall } = useAuth()
  const [kind, setKind] = useState('sdt')
  const [term, setTerm] = useState('')
  const [search, setSearch] = useState(null)
  const [page, setPage] = useState(1)
  const [results, setResults] = useState({ customers: [], total: 0 })
  const [customer, setCustomer] = useState(null)
  const [section, setSection] = useState('thu-cung')
  const [sectionPage, setSectionPage] = useState(1)
  const [history, setHistory] = useState({ items: [], total: 0 })
  const [newCustomer, setNewCustomer] = useState({ fullName: '', phone: '', email: '' })
  const [newPet, setNewPet] = useState({ name: '', species: 'Chó', breed: '', gender: '', birthDate: '', weightKg: '', vaccination: 'ChuaRo', allergy: '', temperament: '', healthNote: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [historyVersion, setHistoryVersion] = useState(0)

  useEffect(() => {
    if (!search) return
    let active = true
    apiCall(`/api/khach-hang?loai=${encodeURIComponent(search.kind)}&tim=${encodeURIComponent(search.term)}&page=${page}`).then(res => {
      if (!active) return
      if (res.ok) setResults(res.data)
      else setError(res.error)
    })
    return () => { active = false }
  }, [apiCall, search, page])
  useEffect(() => {
    if (!customer) return
    let active = true
    apiCall(`/api/khach-hang/${customer.id}/${section}?page=${sectionPage}`).then(res => {
      if (!active) return
      if (res.ok) setHistory(res.data)
      else setError(res.error)
    })
    return () => { active = false }
  }, [apiCall, customer, section, sectionPage, historyVersion])

  function doSearch(e) {
    e.preventDefault(); setError(''); setMessage(''); setCustomer(null); setPage(1)
    setSearch({ kind, term: term.trim() })
  }
  async function createCustomer(e) {
    e.preventDefault(); if (busy) return
    setBusy(true); setError(''); setMessage('')
    const res = await apiCall('/api/khach-hang/tai-quay', { method: 'POST', body: JSON.stringify(newCustomer) })
    setBusy(false)
    if (!res.ok) { setError(res.error); return }
    setCustomer(res.data.customer); setSection('thu-cung'); setSectionPage(1)
    setNewCustomer({ fullName: '', phone: '', email: '' }); setMessage('Đã tạo hồ sơ khách. Khách chưa có quyền đăng nhập.')
  }
  async function createPet(e) {
    e.preventDefault(); if (busy || !customer) return
    setBusy(true); setError(''); setMessage('')
    const res = await apiCall(`/api/khach-hang/${customer.id}/thu-cung`, { method: 'POST', body: JSON.stringify(newPet) })
    setBusy(false)
    if (!res.ok) { setError(res.error); return }
    setNewPet({ name: '', species: 'Chó', breed: '', gender: '', birthDate: '', weightKg: '', vaccination: 'ChuaRo', allergy: '', temperament: '', healthNote: '' })
    setSection('thu-cung'); setSectionPage(1); setHistoryVersion(v => v + 1); setMessage('Đã thêm thú cưng vào hồ sơ.')
  }
  const updatePet = (name, value) => setNewPet(prev => ({ ...prev, [name]: value }))
  return <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-7">
    <header><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Lễ tân</p><h1 className="mt-2 text-2xl font-extrabold">Hồ sơ khách hàng</h1><p className="mt-2 text-slate-600">Tìm khách, tạo hồ sơ tại quầy và thêm thú cưng trước khi đặt lịch.</p></header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{message}</p>}
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border bg-white p-5"><h2 className="text-lg font-extrabold">Tra cứu khách</h2>
        <form onSubmit={doSearch} className="mt-4 flex flex-wrap items-end gap-3"><label className="min-w-36 flex-1 text-sm font-bold">Tìm theo<select className={field} value={kind} onChange={e => setKind(e.target.value)}>{[['sdt','Số điện thoại'],['ten','Họ tên'],['email','Email'],['thu-cung','Tên thú cưng'],['ma-lich','Mã lịch']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="min-w-44 flex-[2] text-sm font-bold">Từ khóa<input className={field} value={term} required onChange={e => setTerm(e.target.value)} /></label><button className={button}>Tìm</button></form>
        {search && <div className="mt-4"><p className="text-sm text-slate-600">{results.total} hồ sơ phù hợp</p><ul className="mt-2 space-y-2">{results.customers.map(item => <li key={item.id}><button className="w-full rounded-xl border p-3 text-left hover:border-brand-600" onClick={() => { setCustomer(item); setSectionPage(1); setHistoryVersion(v => v + 1); setError('') }}><strong>{item.fullName}</strong><span className="block text-sm text-slate-600">{item.phone} · {item.email || 'Chưa có email'}</span></button></li>)}</ul>{results.total > 20 && <div className="mt-3 flex gap-3"><button disabled={page === 1} onClick={() => setPage(p => p-1)}>Trang trước</button><span>Trang {page}</span><button disabled={page*20 >= results.total} onClick={() => setPage(p => p+1)}>Trang sau</button></div>}</div>}
      </section>
      <section className="rounded-2xl border bg-white p-5"><h2 className="text-lg font-extrabold">Tạo khách tại quầy</h2><form onSubmit={createCustomer} className="mt-4 space-y-3">
        <label className="block text-sm font-bold">Họ tên *<input className={field} required maxLength={100} value={newCustomer.fullName} onChange={e => setNewCustomer(p => ({ ...p, fullName: e.target.value }))}/></label>
        <label className="block text-sm font-bold">Số điện thoại (10 số) *<input className={field} required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={newCustomer.phone} onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))}/></label>
        <label className="block text-sm font-bold">Email (tùy chọn)<input className={field} type="email" maxLength={100} value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))}/></label>
        <p className="text-sm text-slate-600">Hồ sơ mới chưa có mật khẩu hoặc quyền đăng nhập. Không gửi email mời trong đợt này.</p><button className={button} disabled={busy}>{busy ? 'Đang lưu…' : 'Tạo hồ sơ'}</button>
      </form></section>
    </div>
    {customer && <section className="space-y-5 rounded-2xl border bg-white p-5"><div><h2 className="text-xl font-extrabold">{customer.fullName}</h2><p className="text-sm text-slate-600">{customer.phone} · {customer.email || 'Chưa có email'} · {customer.loginActive ? 'Đã có đăng nhập' : 'Chưa kích hoạt đăng nhập'}</p></div>
      <nav aria-label="Phần hồ sơ" className="flex flex-wrap gap-2">{sections.map(([key,label]) => <button key={key} className={`rounded-full border px-4 py-2 font-bold ${section === key ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-slate-300'}`} onClick={() => { setSection(key); setSectionPage(1); setHistory({ items: [], total: 0 }) }}>{label}</button>)}</nav>
      <p className="text-sm text-slate-600">{history.total} mục</p><ul className="space-y-2">{history.items.map(item => <li key={item.id} className="rounded-xl border p-3"><strong>#{item.id} {item.name || item.petName || ''}</strong><p className="text-sm text-slate-600">{item.species || item.status || ''} {item.amount != null ? `· ${Number(item.amount).toLocaleString('vi-VN')} ₫` : ''}</p>{section === 'thu-cung' && <p className="text-sm text-slate-600">{[item.breed,item.gender,item.birthDate ? petAge(item.birthDate) : '',item.weightKg ? `${item.weightKg} kg` : '',`Tiêm phòng: ${{ChuaRo:'Chưa rõ',DaTiem:'Đã tiêm',ChuaTiem:'Chưa tiêm'}[item.vaccination] || 'Chưa rõ'}`,item.allergy ? `Dị ứng: ${item.allergy}` : '',item.temperament ? `Tính cách: ${item.temperament}` : '',item.healthNote].filter(Boolean).join(' · ')}</p>}</li>)}</ul>
      {history.total > 20 && <div className="flex gap-3"><button disabled={sectionPage === 1} onClick={() => setSectionPage(p => p-1)}>Trang trước</button><span>Trang {sectionPage}</span><button disabled={sectionPage*20 >= history.total} onClick={() => setSectionPage(p => p+1)}>Trang sau</button></div>}
      <form onSubmit={createPet} className="space-y-3 border-t pt-5"><h3 className="font-extrabold">Thêm thú cưng cho {customer.fullName}</h3><div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-bold">Tên *<input className={field} required maxLength={50} value={newPet.name} onChange={e => updatePet('name',e.target.value)}/></label>
        <label className="text-sm font-bold">Loài *<select className={field} value={newPet.species} onChange={e => updatePet('species',e.target.value)}><option>Chó</option><option>Mèo</option></select></label>
        <label className="text-sm font-bold">Giống<input className={field} maxLength={50} value={newPet.breed} onChange={e => updatePet('breed',e.target.value)}/></label>
        <label className="text-sm font-bold">Giới tính<select className={field} value={newPet.gender} onChange={e => updatePet('gender',e.target.value)}><option value="">Chưa rõ</option><option>Đực</option><option>Cái</option></select></label>
        <label className="text-sm font-bold">Ngày sinh<input className={field} type="date" value={newPet.birthDate} onChange={e => updatePet('birthDate',e.target.value)}/></label>
        <label className="text-sm font-bold">Cân nặng (kg)<input className={field} type="number" min="0.01" max="999.99" step="0.01" value={newPet.weightKg} onChange={e => updatePet('weightKg',e.target.value)}/></label>
        <label className="text-sm font-bold">Tiêm phòng<select className={field} value={newPet.vaccination} onChange={e => updatePet('vaccination',e.target.value)}><option value="ChuaRo">Chưa rõ</option><option value="DaTiem">Đã tiêm</option><option value="ChuaTiem">Chưa tiêm</option></select></label>
        <label className="text-sm font-bold">Dị ứng<input className={field} maxLength={500} value={newPet.allergy} onChange={e => updatePet('allergy',e.target.value)}/></label>
        <label className="text-sm font-bold">Tính cách<input className={field} maxLength={500} value={newPet.temperament} onChange={e => updatePet('temperament',e.target.value)}/></label>
      </div><label className="block text-sm font-bold">Ghi chú sức khỏe<textarea className={field} maxLength={500} value={newPet.healthNote} onChange={e => updatePet('healthNote',e.target.value)}/></label><button className={button} disabled={busy}>{busy ? 'Đang lưu…' : 'Thêm thú cưng'}</button></form>
    </section>}
  </main>
}
