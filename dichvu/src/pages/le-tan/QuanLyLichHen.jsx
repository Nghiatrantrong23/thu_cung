import NhatKyLich from '../../components/NhatKyLich.jsx'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { homePath } from '../../lib/tienIchXacThuc.js'
import { toISODate, formatDateVN, formatVND } from '../../lib/tinhGioTrong.js'
import HuyHieuTrangThai from '../../components/HuyHieuTrangThai.jsx'


const states = { ChoXacNhan: 'Chờ xác nhận', DaXacNhan: 'Đã xác nhận', DangThucHien: 'Đang thực hiện', HoanThanh: 'Hoàn thành', DaHuy: 'Đã hủy', TuChoi: 'Từ chối' }
const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2'
const button = 'rounded-full border border-slate-300 px-5 py-2 font-bold disabled:opacity-40'

export default function QuanLyLichHen() {
  const { user, apiCall } = useAuth()
  const [day, setDay] = useState(toISODate(new Date()))
  const [status, setStatus] = useState('ChoXacNhan')
  const [rows, setRows] = useState([])
  const [selected, setSelected] = useState(null)
  const [people, setPeople] = useState([])
  const [staff, setStaff] = useState('')
  const [note, setNote] = useState('')
  const [newDay,setNewDay]=useState(''),[newTime,setNewTime]=useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion(v => v + 1), [])
  useEffect(() => {
    let active = true
    setLoading(true); setError(''); setSelected(null)
    const params = new URLSearchParams()
    if (day) params.set('ngay', day)
    if (status) params.set('trangThai', status)
    apiCall(`/api/lich-hen?${params}`).then(result => {
      if (!active) return
      if (result.ok) setRows(result.data.lichHen)
      else { setRows([]); setError(result.error) }
      setLoading(false)
    })
    return () => { active = false }
  }, [apiCall, day, status, version])
  useEffect(() => {
    let active = true
    setPeople([]); setStaff(''); setNote(''); setStaffError('')
    setNewDay(selected?.date||'');setNewTime(selected?.start||'')
    if (!selected || selected.trangThaiDB !== 'ChoXacNhan') { setStaffLoading(false); return }
    setStaffLoading(true)
    apiCall(`/api/lich-hen/${selected.id}/nhan-vien-kha-dung`).then(result => {
      if (!active) return
      if (result.ok) setPeople(result.data.nhanVien)
      else setStaffError(result.error)
      setStaffLoading(false)
    })
    return () => { active = false }
  }, [selected, apiCall])
  async function act(action) {
    if (busy || !selected) return
    setError(''); setNotice('')
    if (action === 'phan-cong' && !staff) { setError('Vui lòng chọn nhân viên.'); return }
    if (action !== 'phan-cong' && !note.trim()) { setError('Vui lòng nhập lý do/ghi chú.'); return }
    setBusy(true)
    const endpoint = action === 'doi-lich' ? 'doi-lich' : action === 'huy' ? 'huy' : 'xu-ly'
    const result = await apiCall(`/api/lich-hen/${selected.id}/${endpoint}`, { method: 'PATCH',
      body: JSON.stringify({ hanhDong: action, nhanVienId: staff ? Number(staff) : undefined, lyDo: note.trim() || undefined, ...(action==='doi-lich'?{ngay:newDay,gioStart:newTime}:{}) }) })
    setBusy(false)
    if (result.ok) { setNotice(result.data.message); reload() }
    else { setError(result.error); if (result.status === 409) reload() }
  }
  return <div className="mx-auto max-w-6xl px-4 py-8">
    <nav className="mb-5 flex flex-wrap gap-4 font-bold text-brand-700">
      <Link to={homePath(user)}>Trang nhân sự</Link><Link to="/le-tan/dat-lich-tai-quay">+ Đặt lịch hộ khách</Link>
    </nav>
    <h1 className="text-2xl font-extrabold text-slate-800">Quản lý lịch hẹn và phân công</h1>

    <div className="my-5 flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm">
      <label>Ngày hẹn<input aria-label="Ngày hẹn" type="date" value={day} disabled={busy} onChange={e => setDay(e.target.value)} className={input} /></label>
      <label>Trạng thái<select aria-label="Trạng thái" value={status} disabled={busy} onChange={e => setStatus(e.target.value)} className={input}>
        <option value="">Tất cả</option>{Object.entries(states).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
      </select></label>
      <button type="button" disabled={busy || loading} onClick={reload} className={button}>Tải lại danh sách</button>
    </div>
    {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-4 text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {loading ? <p role="status">Đang tải lịch hẹn...</p> : <div className="grid gap-5 lg:grid-cols-2">
      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm"><caption className="p-3 text-left font-bold">Danh sách lịch hẹn</caption>
          <thead className="bg-slate-50"><tr>{['Mã / Khách hàng', 'Thú cưng / Dịch vụ', 'Ngày giờ', 'Trạng thái', ''].map((s, i) => <th key={i} className="p-3">{s}</th>)}</tr></thead>
          <tbody>{rows.map(row => <tr key={row.id} className={`border-t border-slate-100 ${selected?.id === row.id ? 'bg-brand-50' : ''}`}>
            <td className="p-3">#{row.id}<br />{row.customerName}</td>
            <td className="p-3">{row.petName}<br /><span className="text-slate-500">{row.serviceNames.join(', ')}</span></td>
            <td className="p-3">{formatDateVN(row.date)}<br />{row.start}–{row.end}</td>
            <td className="p-3"><HuyHieuTrangThai status={row.status} /></td>
            <td className="p-3"><button type="button" disabled={busy} onClick={() => { setSelected(row); setError(''); setNotice('') }} className="font-bold text-brand-700">Xem #{row.id}</button></td>
          </tr>)}</tbody>
        </table>{!rows.length && <p className="p-4 text-slate-500">Không có lịch hẹn phù hợp.</p>}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        {!selected ? <p className="text-slate-500">Chọn lịch hẹn để xem chi tiết và xử lý.</p> : <>
          <h2 className="mb-4 text-lg font-extrabold">Chi tiết lịch hẹn #{selected.id}</h2>
          {selected.careIssue&&<p className="my-3 rounded-lg bg-amber-50 p-3 text-amber-800">Cần xử lý từ nhân viên: {selected.careIssue}</p>}
          <dl className="space-y-3 text-sm">
            <div><dt className="font-bold">Khách hàng</dt><dd>{selected.customerName} · {selected.customerPhone}</dd></div>
            <div><dt className="font-bold">Thú cưng</dt><dd>{selected.petName} ({selected.species}){selected.weightKg ? ` · ${selected.weightKg} kg` : ''}</dd><dd>{selected.healthNote || 'Không có ghi chú sức khỏe.'}</dd></div>
            <div><dt className="font-bold">Dịch vụ và thời gian</dt><dd>{selected.serviceNames.join(', ')}</dd><dd>{formatDateVN(selected.date)} {selected.start}–{selected.end}</dd><dd>Tạm tính: {formatVND(selected.total)} VNĐ</dd></div>
            <div><dt className="font-bold">Nhân viên phụ trách</dt><dd>{selected.staff || 'Chưa phân công'}</dd></div>
            <div><dt className="font-bold">Ghi chú</dt><dd className="whitespace-pre-wrap">{selected.note || 'Không có'}</dd></div>
          </dl>
          {selected.trangThaiDB === 'ChoXacNhan' && <div className="mt-4">
            <label htmlFor="dispatch-staff" className="font-bold">Nhân viên phụ trách</label>
            <select id="dispatch-staff" value={staff} onChange={e => setStaff(e.target.value)} disabled={busy || staffLoading || !!staffError} className={`${input} mt-2`}>
              <option value="">{staffLoading ? 'Đang kiểm tra...' : 'Chọn nhân viên'}</option>
              {people.map(person => <option key={person.id} value={person.id}>{person.name} · ca {person.start}–{person.end}</option>)}
            </select>
            {staffError && <p role="alert" className="mt-2 text-red-700">{staffError}</p>}
            {!staffLoading && !staffError && !people.length && <p className="mt-2 text-amber-800">Chưa có nhân viên phù hợp. Bạn có thể giữ chờ xác nhận và ghi chú.</p>}
          </div>}
          {['ChoXacNhan', 'DaXacNhan'].includes(selected.trangThaiDB) && <div className="mt-4">
            <label htmlFor="dispatch-note" className="font-bold">Lý do / ghi chú</label>
            <textarea id="dispatch-note" value={note} onChange={e => setNote(e.target.value)} disabled={busy} maxLength={300} rows={3} className={`${input} mt-2`} />
            <p className="mt-1 text-xs text-slate-500">Bắt buộc khi giữ chờ, từ chối hoặc hủy lịch. Tối đa 300 ký tự. Lý do được lưu trong nhật ký xử lý.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {selected.trangThaiDB === 'ChoXacNhan' ? <>
                <button type="button" onClick={() => act('phan-cong')} disabled={busy || staffLoading || !staff} className={`${button} bg-brand-700 text-white`}>Xác nhận và phân công</button>
                <button type="button" onClick={() => act('giu-cho')} disabled={busy} className={button}>Giữ chờ xác nhận</button>
                <button type="button" onClick={() => act('tu-choi')} disabled={busy} className={`${button} text-red-700`}>Từ chối lịch hẹn</button>
              </> : <button type="button" onClick={() => act('huy')} disabled={busy} className={`${button} text-red-700`}>Hủy lịch</button>}
            </div>
            <div className="mt-4 grid gap-3"><label>Ngày mới<input type="date" value={newDay} onChange={e=>setNewDay(e.target.value)} className={input} disabled={busy}/></label><label>Giờ mới<input type="time" step="1800" value={newTime} onChange={e=>setNewTime(e.target.value)} className={input} disabled={busy}/></label><button type="button" className={button} disabled={busy} onClick={()=>act('doi-lich')}>Đổi giờ và chờ phân công lại</button></div>
            {busy && <p role="status" className="mt-3">Đang lưu...</p>}
          </div>}
          <NhatKyLich id={selected.id} version={version}/>
        </>}
      </section>
    </div>}
  </div>
}
