import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { services as defaultMockServices } from '../../data/duLieuMau.js'
import { useAuth } from '../../data/khoXacThuc.jsx'
import {
  CLOSE,
  OPEN,
  addDays,
  formatDateVN,
  formatVND,
  toHHMM,
  toISODate,
  toMin,
} from '../../lib/tinhGioTrong.js'

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-400'

function Field({ label, required, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-bold text-slate-700">
        {label}
        {required && <span className="text-accent-600"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default function DatLichTaiQuay() {
  const navigate = useNavigate()
  const { apiCall } = useAuth()
  const today = toISODate(new Date())

  // Tra cuu khach hang
  const [phone, setPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [customer, setCustomer] = useState(null)
  const [pets, setPets] = useState([])
  const [searchError, setSearchError] = useState('')

  // Khach moi
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newPetName, setNewPetName] = useState('')
  const [newPetSpecies, setNewPetSpecies] = useState('Chó')

  // Thong tin dat lich
  const [servicesList, setServicesList] = useState([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [petId, setPetId] = useState('')
  const [date, setDate] = useState(() => addDays(1))
  const [start, setStart] = useState('09:00')
  const [selected, setSelected] = useState([])
  const [note, setNote] = useState('')

  // Khung gio trong tu server
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  // 1. Tai danh sach dich vu
  useEffect(() => {
    let cancelled = false
    fetch('/api/dich-vu')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.dichVu && data.dichVu.length > 0) {
          const list = data.dichVu.map((s) => ({
            id: s.id,
            name: s.ten,
            durationMin: s.thoiLuongPhut,
            price: s.gia,
          }))
          setServicesList(list)
          setSelected([list[0].id])
        } else if (!cancelled) {
          setServicesList(defaultMockServices)
          setSelected([defaultMockServices[0].id])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServicesList(defaultMockServices)
          setSelected([defaultMockServices[0].id])
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingServices(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 2. Tra cuu khach theo SDT
  async function handleSearchCustomer(e) {
    if (e) e.preventDefault()
    setSearchError('')
    const cleanPhone = phone.trim()
    if (!cleanPhone || !/^\d{9,11}$/.test(cleanPhone)) {
      setSearchError('Vui lòng nhập số điện thoại hợp lệ (9-11 số).')
      return
    }

    setSearching(true)
    setCustomer(null)
    setPets([])
    setIsNewCustomer(false)

    try {
      const res = await apiCall(`/api/khach-hang/tra-cuu?sdt=${cleanPhone}`)
      if (res.ok && res.data.found) {
        setCustomer(res.data.customer)
        setPets(res.data.pets || [])
        if (res.data.pets && res.data.pets.length > 0) {
          setPetId(String(res.data.pets[0].id))
        }
      } else {
        setCustomer(null)
        setSearchError('Không tìm thấy thông tin khách hàng. Bạn có thể tạo hồ sơ khách mới bên dưới.')
        setIsNewCustomer(true)
      }
    } finally {
      setSearching(false)
    }
  }

  // 3. Tinh toan thoi luong va gia
  const chosen = servicesList.filter((s) => selected.includes(s.id))
  const duration = chosen.reduce((sum, s) => sum + s.durationMin, 0)
  const total = chosen.reduce((sum, s) => sum + s.price, 0)

  // 4. Lay khung gio trong tu server
  useEffect(() => {
    if (!date || duration <= 0) {
      setSlots([])
      return
    }
    let cancelled = false
    setLoadingSlots(true)
    apiCall(`/api/lich-hen/khung-gio-trong?ngay=${date}&thoiLuong=${duration}`).then((res) => {
      if (!cancelled) {
        if (res.ok) {
          const serverSlots = res.data.slots || []
          setSlots(serverSlots)
          if (serverSlots.length > 0 && !serverSlots.includes(start)) {
            setStart(serverSlots[0])
          }
        } else {
          setSlots([])
        }
        setLoadingSlots(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [date, duration, apiCall])

  const startValid = slots.includes(start)
  const endTime = startValid ? toHHMM(toMin(start) + duration) : ''

  function toggleService(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function validate() {
    const e = {}
    if (!customer && !isNewCustomer) {
      e.customer = 'Vui lòng tìm khách hoặc tạo hồ sơ khách mới.'
    }
    if (isNewCustomer) {
      if (!phone.trim()) e.phone = 'Vui lòng nhập số điện thoại.'
      if (!newCustName.trim()) e.custName = 'Vui lòng nhập họ tên khách hàng.'
      if (!newPetName.trim()) e.petName = 'Vui lòng nhập tên thú cưng.'
    } else {
      if (!petId) e.pet = 'Vui lòng chọn thú cưng.'
    }
    if (!date) e.date = 'Vui lòng chọn ngày hẹn.'
    else if (date < today) e.date = 'Ngày hẹn không được ở quá khứ.'
    if (chosen.length === 0) e.services = 'Vui lòng chọn ít nhất một dịch vụ.'
    if (!startValid) e.start = 'Vui lòng chọn giờ hẹn còn trống.'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setSubmitError('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsSubmitting(true)
    try {
      const payload = {
        sdt: phone.trim(),
        hoTen: isNewCustomer ? newCustName.trim() : customer.hoTen,
        khachHangId: customer ? customer.id : null,
        thuCungId: !isNewCustomer && petId ? Number(petId) : null,
        tenThuCung: isNewCustomer ? newPetName.trim() : null,
        loaiThuCung: isNewCustomer ? newPetSpecies : null,
        ngay: date,
        gioStart: start,
        dichVuIds: selected,
        ghiChu: note.trim(),
      }

      const res = await apiCall('/api/lich-hen/tai-quay', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        setSubmitError(res.error || 'Đặt lịch thất bại.')
        return
      }

      setCreated({
        id: res.data.lichHenId,
        customerName: isNewCustomer ? newCustName : customer.hoTen,
        phone: phone.trim(),
        petName: isNewCustomer ? newPetName : pets.find((p) => String(p.id) === String(petId))?.name,
        date,
        start,
        end: endTime,
        services: chosen.map((s) => s.name),
        total,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setCreated(null)
    setCustomer(null)
    setPets([])
    setPhone('')
    setIsNewCustomer(false)
    setNewCustName('')
    setNewPetName('')
    setNote('')
    setErrors({})
    setSubmitError('')
  }

  if (created) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Đặt lịch tại quầy thành công!</h1>
            <p className="text-slate-500">Mã lịch hẹn #{created.id} đã được tạo ở trạng thái Chờ xác nhận.</p>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
          {[
            ['Mã lịch hẹn', `#${created.id}`],
            ['Khách hàng', `${created.customerName} (${created.phone})`],
            ['Thú cưng', created.petName],
            ['Thời gian', `${formatDateVN(created.date)}, ${created.start} đến ${created.end}`],
            ['Dịch vụ', created.services.join(', ')],
            ['Tạm tính', `${formatVND(created.total)} VNĐ`],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-3 px-4 py-3">
              <dt className="font-semibold text-slate-500">{k}</dt>
              <dd className="col-span-2 font-semibold text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full bg-brand-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-800"
          >
            Đặt lịch khác
          </button>
          <button
            type="button"
            onClick={() => navigate('/le-tan')}
            className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-bold text-slate-600 hover:border-brand-600 hover:text-brand-700"
          >
            Về trang Lễ tân
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">MH-02b: Đặt lịch tại quầy (Lễ tân)</h1>
          <p className="mt-1 text-sm text-slate-500">Tiếp nhận khách vãng lai hoặc khách gọi điện đặt lịch tại quầy.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:border-brand-600"
        >
          Quay lại
        </button>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {/* Phan 1: Tim khach hang */}
        <div className="border-b border-slate-200 pb-6">
          <h2 className="text-lg font-bold text-slate-800">1. Thông tin khách hàng</h2>
          <form onSubmit={handleSearchCustomer} className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="search-sdt" className="mb-1.5 block text-sm font-bold text-slate-700">
                Số điện thoại: <span className="text-accent-600">*</span>
              </label>
              <input
                id="search-sdt"
                type="text"
                placeholder="Nhập 09xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-50"
            >
              {searching ? 'Đang tìm...' : 'Tìm khách'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsNewCustomer(true)
                setCustomer(null)
                setPets([])
                setSearchError('')
              }}
              className="rounded-xl border border-brand-600 px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50"
            >
              + Tạo hồ sơ khách mới
            </button>
          </form>

          {searchError && (
            <p className="mt-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-xl">{searchError}</p>
          )}

          {customer && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-emerald-900">
                  Khách hàng: {customer.hoTen} ({pets.length} thú cưng)
                </p>
                <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  Đã có tài khoản
                </span>
              </div>
              <p className="mt-1 text-sm text-emerald-700">SĐT: {customer.soDienThoai}</p>
            </div>
          )}

          {isNewCustomer && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
              <p className="text-xs font-semibold text-blue-800">
                Khách chưa có tài khoản: hệ thống sẽ tự tạo tài khoản tạm (tên đăng nhập là số điện thoại, mật khẩu tạm).
                Khách có thể đổi mật khẩu khi đăng nhập lần đầu.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Họ tên khách hàng:" required htmlFor="newCustName" error={errors.custName}>
                  <input
                    id="newCustName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Tên thú cưng:" required htmlFor="newPetName" error={errors.petName}>
                  <input
                    id="newPetName"
                    type="text"
                    placeholder="Bé Mướp"
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">Loài:</label>
                <div className="flex gap-4">
                  {['Chó', 'Mèo'].map((sp) => (
                    <label key={sp} className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="species"
                        value={sp}
                        checked={newPetSpecies === sp}
                        onChange={(e) => setNewPetSpecies(e.target.value)}
                        className="accent-brand-700"
                      />
                      {sp}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Phan 2: Thong tin lich hen */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800">2. Thông tin lịch hẹn</h2>

          {!isNewCustomer && customer && (
            <Field label="Thú cưng:" required htmlFor="pet" error={errors.pet}>
              {pets.length > 0 ? (
                <select id="pet" value={petId} onChange={(e) => setPetId(e.target.value)} className={inputCls}>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.species})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-amber-700">Khách chưa có thú cưng nào. Vui lòng chuyển sang Tạo hồ sơ khách mới.</p>
              )}
            </Field>
          )}

          {/* Ngay gio */}
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Ngày hẹn:" required htmlFor="date" error={errors.date}>
              <input id="date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </Field>

            <Field label="Giờ hẹn:" required htmlFor="start" error={errors.start}>
              <select
                id="start"
                value={startValid ? start : ''}
                onChange={(e) => setStart(e.target.value)}
                disabled={loadingSlots || slots.length === 0}
                className={inputCls}
              >
                <option value="">
                  {duration === 0
                    ? 'Chọn dịch vụ trước'
                    : loadingSlots
                    ? 'Đang tính...'
                    : slots.length === 0
                    ? 'Hết giờ trống'
                    : 'Chọn giờ'}
                </option>
                {slots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Giờ kết thúc dự kiến:" htmlFor="end">
              <input id="end" readOnly value={endTime} placeholder="--:--" className={inputCls} />
            </Field>
          </div>

          <p className="text-xs text-slate-500">Giờ mở cửa 08:00 đến 19:00. Chỉ hiển thị các giờ còn trống và đủ thời lượng theo ca trực.</p>

          {/* Danh muc dich vu */}
          <fieldset>
            <legend className="mb-1.5 text-sm font-bold text-slate-700">
              Chọn dịch vụ: <span className="text-accent-600">*</span>
            </legend>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-brand-50 text-left text-slate-600">
                  <tr>
                    <th className="w-16 px-4 py-2.5 font-bold">Chọn</th>
                    <th className="px-4 py-2.5 font-bold">Tên dịch vụ</th>
                    <th className="px-4 py-2.5 font-bold">Thời lượng</th>
                    <th className="px-4 py-2.5 text-right font-bold">Giá (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {servicesList.map((s) => {
                    const checked = selected.includes(s.id)
                    return (
                      <tr key={s.id} className={checked ? 'bg-brand-50/60' : 'bg-white'}>
                        <td className="px-4 py-3">
                          <input
                            id={`svc-${s.id}`}
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(s.id)}
                            className="h-4 w-4 cursor-pointer accent-brand-700"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <label htmlFor={`svc-${s.id}`} className="cursor-pointer font-bold text-slate-800">
                            {s.name}
                          </label>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.durationMin} phút</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-800">{formatVND(s.price)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </fieldset>

          {/* Ghi chu */}
          <Field label="Ghi chú:" htmlFor="note">
            <textarea
              id="note"
              rows={2}
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú sức khỏe hoặc yêu cầu của khách tại quầy."
              className={inputCls}
            />
          </Field>

          {/* Tong ket */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3">
            <p className="text-slate-700">
              Tổng thời lượng dự kiến: <strong>{duration} phút</strong>
            </p>
            <p className="text-slate-700">
              Tổng tạm tính: <strong className="text-lg text-accent-600">{formatVND(total)} VNĐ</strong>
            </p>
          </div>

          {submitError && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {submitError}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-brand-700 px-7 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang đặt lịch...' : 'Đặt lịch'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full border border-slate-300 px-7 py-3 text-sm font-extrabold uppercase tracking-wide text-slate-600 transition hover:border-brand-600"
            >
              Quay lại
            </button>
          </div>
          <p className="text-xs text-slate-500">Sau khi đặt, lịch hẹn ở trạng thái &quot;Chờ xác nhận&quot; và được chuyển sang MH-05 để chọn nhân viên.</p>
        </form>
      </div>
    </div>
  )
}
