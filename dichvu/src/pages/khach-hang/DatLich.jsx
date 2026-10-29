import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../data/khoXacThuc.jsx'
import { usePets } from '../../data/khoThuCung.jsx'
import { useBookings } from '../../data/khoLichHen.jsx'
import { availabilityMessage } from '../../lib/bookingAvailability.js'
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
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-400 read-only:bg-slate-100'

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

export default function BookingPage() {
  const navigate = useNavigate()
  const { addBooking, fetchAvailableSlots } = useBookings()
  const today = toISODate(new Date())
  const { user } = useAuth()
  const { activePets } = usePets()

  const [servicesList, setServicesList] = useState([])
  const [loadingServices, setLoadingServices] = useState(true)

  const [petId, setPetId] = useState('')
  const [date, setDate] = useState(() => addDays(3))
  const [start, setStart] = useState('09:00')
  const [selected, setSelected] = useState([])
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [created, setCreated] = useState(null)
  const [step, setStep] = useState(0)
  const steps = ['Thú cưng', 'Dịch vụ', 'Ngày giờ', 'Ghi chú', 'Xác nhận']

  // Khung gio trong tu server
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotReason, setSlotReason] = useState(null)
  const [slotError, setSlotError] = useState('')
  const [slotVersion, setSlotVersion] = useState(0)

  // 1. Tai danh sach dich vu tu backend API
  useEffect(() => {
    let cancelled = false
    fetch('/api/dich-vu')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.dichVu)) {
          const list = data.dichVu.map((s) => ({
            id: s.id,
            name: s.ten,
            durationMin: s.thoiLuongPhut,
            price: s.gia,
            loai: s.loai,
          }))
          setServicesList(list)
          setSelected(list.length ? [list[0].id] : [])
        } else if (!cancelled) {
          setSubmitError('Không tải được danh mục dịch vụ. Vui lòng thử lại sau.')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSubmitError('Không tải được danh mục dịch vụ. Vui lòng thử lại sau.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingServices(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 2. Tu dong chon thu cung dau tien neu chua chon
  useEffect(() => {
    if (!petId && activePets.length > 0) {
      setPetId(String(activePets[0].id))
    }
  }, [activePets, petId])

  const pet = activePets.find((p) => String(p.id) === String(petId))
  const chosen = servicesList.filter((s) => selected.includes(s.id))
  const duration = chosen.reduce((sum, s) => sum + s.durationMin, 0)
  const total = chosen.reduce((sum, s) => sum + s.price, 0)

  // 3. Tai khung gio trong tu backend moi khi date hoac duration thay doi
  useEffect(() => {
    if (!date || duration <= 0) {
      setSlots([])
      setStart('');setSlotReason(null);setSlotError('');setLoadingSlots(false)
      return
    }
    let cancelled = false
    setLoadingSlots(true)
    setSlots([]);setStart('');setSlotReason(null);setSlotError('');setErrors(prev=>({...prev,start:undefined}))
    fetchAvailableSlots(date, duration).then((res) => {
      if (!cancelled) {
        if (res.ok) {
          const serverSlots = res.slots || []
          setSlots(serverSlots)
          setSlotReason(res.reason)
          setStart(current=>serverSlots.includes(current)?current:serverSlots[0]||'')
        } else {
          setSlots([])
          setSlotError(res.error||'Không thể kiểm tra khung giờ.')
        }
        setLoadingSlots(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [date, duration, fetchAvailableSlots, slotVersion])

  const startValid = slots.includes(start)
  const endTime = startValid ? toHHMM(toMin(start) + duration) : ''

  function toggleService(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function validate() {
    const e = {}
    if (!petId) e.pet = 'Vui lòng chọn thú cưng.'
    if (!date) e.date = 'Vui lòng chọn ngày hẹn.'
    else if (date < today) e.date = 'Ngày hẹn không được ở quá khứ.'
    if (chosen.length === 0) e.services = 'Vui lòng chọn ít nhất một dịch vụ.'
    if (!startValid) e.start = 'Vui lòng chọn giờ hẹn còn trống.'
    return e
  }

  function nextStep() {
    const all = validate()
    const keys = [['pet'], ['services'], ['date', 'start'], [], []][step]
    const current = Object.fromEntries(keys.filter((key) => all[key]).map((key) => [key, all[key]]))
    setErrors(current)
    if (Object.keys(current).length === 0) setStep((value) => Math.min(value + 1, 4))
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setSubmitError('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsSubmitting(true)
    try {
      const result = await addBooking({
        owner: user?.username,
        petId: pet.id,
        thuCungId: pet.id,
        petName: pet.name,
        species: pet.species,
        date,
        start,
        end: endTime,
        duration,
        total,
        dichVuIds: selected,
        serviceNames: chosen.map((s) => s.name),
        note: note.trim(),
      })

      if (!result.ok) {
        setSubmitError(result.message)
        return
      }
      setCreated(result.booking)
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setCreated(null)
    setStep(0)
    if (servicesList.length > 0) {
      setSelected([servicesList[0].id])
    }
    setNote('')
    setErrors({})
    setSubmitError('')
  }

  if (activePets.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h1 className="text-2xl font-extrabold text-slate-800">Bạn chưa có thú cưng để đặt lịch</h1>
        <p className="mt-2 text-slate-500">Hãy thêm hồ sơ thú cưng trước, sau đó quay lại đặt lịch cho bé.</p>
        <Link
          to="/ho-so-thu-cung"
          state={{ new: true }}
          className="mt-6 inline-block rounded-full bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-800"
        >
          Thêm thú cưng
        </Link>
      </div>
    )
  }

  if (created) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-700">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Đã gửi yêu cầu đặt lịch</h1>
            <p className="text-slate-500">Lễ tân sẽ xác nhận và phân công nhân viên cho bé.</p>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
          {[
            ['Mã lịch hẹn', `#${created.id}`],
            ['Thú cưng', `${created.petName || pet?.name} (${created.species || pet?.species})`],
            ['Thời gian', `${formatDateVN(created.date || date)}, ${created.start || start} đến ${created.end || endTime}`],
            ['Dịch vụ', (created.serviceNames || chosen.map((s) => s.name)).join(', ')],
            ['Tạm tính', `${formatVND(created.total || total)} VNĐ`],
            ['Ghi chú', created.note || created.ghiChu || note || 'Không có'],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-3 px-4 py-3">
              <dt className="font-semibold text-slate-500">{k}</dt>
              <dd className="col-span-2 font-semibold text-slate-800">{v}</dd>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-3 px-4 py-3">
            <dt className="font-semibold text-slate-500">Trạng thái</dt>
            <dd className="col-span-2">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Chờ xác nhận</span>
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/lich-hen"
            state={{ select: created.id }}
            className="rounded-full bg-brand-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-800"
          >
            Xem lịch hẹn
          </Link>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-bold text-slate-600 hover:border-brand-600 hover:text-brand-700"
          >
            Đặt lịch khác
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">Đặt lịch dịch vụ</h1>
      <ol aria-label="Các bước đặt lịch" className="mt-5 grid grid-cols-5 gap-1 text-center text-xs sm:gap-2 sm:text-sm">
        {steps.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined}>
          <button type="button" disabled={index > step} onClick={() => setStep(index)} className={`w-full rounded-xl px-1 py-2 font-bold ${step === index ? 'bg-brand-700 text-white' : index < step ? 'bg-brand-50 text-brand-800' : 'bg-slate-100 text-slate-500'}`}>
            <span className="block">{index + 1}</span><span>{label}</span>
          </button>
        </li>)}
      </ol>
      <p className="mt-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
        Giờ mở cửa {toHHMM(OPEN)} đến {toHHMM(CLOSE)}. Lịch hẹn phải kết thúc trước {toHHMM(CLOSE)}. Chỉ hiển thị các
        giờ còn trống và đủ thời lượng theo ca trực.
      </p>

      <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {step === 0 && <>{/* Thú cưng */}
        <Field label="Thú cưng:" required htmlFor="pet" error={errors.pet}>
          <div className="flex items-center gap-3">
            <select id="pet" value={petId} onChange={(e) => setPetId(e.target.value)} className={inputCls}>
              {activePets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species})
                </option>
              ))}
            </select>
            <Link to="/ho-so-thu-cung" state={{ new: true }} className="shrink-0 text-sm font-bold text-brand-700 hover:underline">
              + Thêm thú cưng
            </Link>
          </div>
          {pet?.healthNote && (
            <p className="mt-1.5 text-sm text-amber-700">Lưu ý sức khỏe: {pet.healthNote}</p>
          )}
        </Field>

        </>}
        {step === 2 && <>{/* Ngày, giờ */}
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
                  ? 'Đang kiểm tra giờ...'
                  : slots.length === 0
                  ? slotError ? 'Không tải được giờ hẹn' : slotReason==='NO_SHIFTS' ? 'Chưa có ca làm' : 'Chưa có giờ phù hợp'
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

        {duration > 0 && !loadingSlots && slots.length === 0 && date >= today && (
          <div className="-mt-3 space-y-2 text-sm font-semibold text-amber-800">
            <p role={slotError?'alert':'status'}>{availabilityMessage({error:slotError,reason:slotReason,duration})}</p>
            <button type="button" className="font-bold text-brand-700 underline" onClick={()=>setSlotVersion(v=>v+1)}>Kiểm tra lại giờ hẹn</button>
          </div>
        )}
        {slots.length > 0 && start && !startValid && (
          <p className="-mt-3 text-sm font-semibold text-amber-700">
            Giờ {start} không còn trống với lựa chọn hiện tại. Vui lòng chọn giờ khác.
          </p>
        )}

        </>}
        {step === 1 && <>{/* Dịch vụ */}
        <fieldset>
          <legend className="mb-1.5 text-sm font-bold text-slate-700">
            Chọn dịch vụ: <span className="text-accent-600">*</span>
          </legend>
          {loadingServices ? (
            <p className="text-sm text-slate-500 py-3">Đang tải danh mục dịch vụ...</p>
          ) : (
            servicesList.length === 0 ? <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Chưa có dịch vụ đang bán. Vui lòng quay lại sau.</p> : <div className="overflow-x-auto rounded-xl border border-slate-200">
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
          )}
          {errors.services && (
            <p role="alert" className="mt-1.5 text-sm font-semibold text-red-600">
              {errors.services}
            </p>
          )}
        </fieldset>

        </>}
        {step === 3 && <>{/* Ghi chú */}
        <Field label="Ghi chú:" htmlFor="note">
          <textarea
            id="note"
            rows={3}
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: bé hơi nhát nước, cần tắm nhẹ tay."
            className={inputCls}
          />
        </Field>

        </>}
        {step === 4 && <>{/* Tổng kết */}
        <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
          <p><strong>Thú cưng:</strong> {pet?.name}</p>
          <p><strong>Dịch vụ:</strong> {chosen.map((service) => service.name).join(', ')}</p>
          <p><strong>Thời gian:</strong> {formatDateVN(date)}, {start}–{endTime}</p>
          <p><strong>Ghi chú:</strong> {note.trim() || 'Không có'}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3">
          <p className="text-slate-700">
            Tổng thời lượng dự kiến: <strong>{duration} phút</strong>
          </p>
          <p className="text-slate-700">
            Tổng tạm tính: <strong className="text-lg text-accent-600">{formatVND(total)} VNĐ</strong>
          </p>
        </div>
        <p className="-mt-3 text-sm text-slate-500">Sau khi gửi, lịch hẹn ở trạng thái “Chờ xác nhận”.</p>

        {submitError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {submitError}
          </p>
        )}

        </>}
        <div className="flex flex-wrap gap-3">
          {step > 0 && <button type="button" onClick={() => setStep((value) => value - 1)} className="rounded-full border border-slate-300 px-7 py-3 text-sm font-bold text-slate-700">Bước trước</button>}
          {step < 4 ? <button type="button" onClick={nextStep} className="rounded-full bg-brand-700 px-7 py-3 text-sm font-bold text-white">Tiếp tục</button> : <button
            type="submit"
            disabled={isSubmitting || !startValid}
            className="rounded-full bg-brand-700 px-7 py-3 text-sm font-extrabold uppercase tracking-wide text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Đang gửi yêu cầu...' : 'Xác nhận đặt lịch'}
          </button>}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-slate-300 px-7 py-3 text-sm font-extrabold uppercase tracking-wide text-slate-600 transition hover:border-brand-600 hover:text-brand-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    </form>
  )
}
