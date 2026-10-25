import PageHeading from '../../components/ui/PageHeading.jsx'
import CustomerEmptyState from '../../components/ui/CustomerEmptyState.jsx'
import { DateInput } from '../../components/ui/DateTimeInput.jsx'
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

  const [step, setStep] = useState(1)
  const [petId, setPetId] = useState('')
  const [date, setDate] = useState(() => addDays(3))
  const [start, setStart] = useState('09:00')
  const [selected, setSelected] = useState([])
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

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
        if (!cancelled && data.dichVu && data.dichVu.length > 0) {
          const list = data.dichVu.map((s) => ({
            id: s.id,
            name: s.ten,
            durationMin: s.thoiLuongPhut,
            price: s.gia,
            loai: s.loai,
          }))
          setServicesList(list)
          setSelected([list[0].id])
        } else if (!cancelled) {
          setServicesList([])
        }
      })
      .catch(() => {
        if (!cancelled) setSubmitError('Không tải được danh mục dịch vụ. Vui lòng tải lại trang.')
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

  async function handleSubmit(ev) {
    ev.preventDefault()
    if (step !== 3) return
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
    setStep(1)
    setCreated(null)
    if (servicesList.length > 0) {
      setSelected([servicesList[0].id])
    }
    setNote('')
    setErrors({})
    setSubmitError('')
  }

  if (activePets.length === 0) {
    return <div className="space-y-6"><PageHeading title="Đặt lịch dịch vụ" description="Chọn thú cưng, thời gian và dịch vụ chăm sóc phù hợp."/><CustomerEmptyState title="Thêm hồ sơ thú cưng để đặt lịch" description="Bạn chưa có thú cưng đang theo dõi. Hãy thêm hồ sơ hoặc theo dõi lại một bé, sau đó quay lại chọn giờ chăm sóc." to="/ho-so-thu-cung" state={{new:true}} action="Thêm thú cưng"/></div>
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
            ['Tạm tính', `${formatVND(created.total || total)} ₫`],
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
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <PageHeading title="Đặt lịch dịch vụ" description="Chọn thú cưng, thời gian và dịch vụ chăm sóc phù hợp."/>
      <ol className="customer-booking-guide" aria-label="Các bước đặt lịch">{['Chọn thú cưng', 'Chọn dịch vụ', 'Chọn giờ và xác nhận'].map((label,index)=><li key={label} aria-current={step===index+1?'step':undefined} className={step===index+1?'font-bold text-brand-800':''}><span>{index+1}</span>{label}</li>)}</ol>
      <p className="mt-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
        Giờ mở cửa {toHHMM(OPEN)} đến {toHHMM(CLOSE)}. Lịch hẹn phải kết thúc trước {toHHMM(CLOSE)}. Chỉ hiển thị các
        giờ còn trống và đủ thời lượng theo ca trực.
      </p>

      <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
<section hidden={step!==1}>
        {/* Thú cưng */}
        <Field label="Thú cưng:" required htmlFor="pet" error={errors.pet}>
          <div className="flex items-center gap-3">
            <div id="pet" className="grid flex-1 gap-3 sm:grid-cols-2" role="group" aria-label="Chọn thú cưng">{activePets.map(p=><button type="button" key={p.id} aria-pressed={String(p.id)===petId} onClick={()=>setPetId(String(p.id))} className={`rounded-xl border p-4 text-left ${String(p.id)===petId?'border-brand-600 bg-brand-50':'border-slate-200'}`}><strong>{p.name}</strong><span className="block text-sm text-slate-500">{p.species}</span></button>)}</div>
            <Link to="/ho-so-thu-cung" state={{ new: true }} className="shrink-0 text-sm font-bold text-brand-700 hover:underline">
              + Thêm thú cưng
            </Link>
          </div>
          {pet?.healthNote && (
            <p className="mt-1.5 text-sm text-amber-700">Lưu ý sức khỏe: {pet.healthNote}</p>
          )}
        </Field>

</section>
<section hidden={step!==2}>
        <fieldset><legend className="mb-3 font-bold">Chọn dịch vụ chăm sóc</legend>
          {loadingServices ? <p role="status">Đang tải dịch vụ...</p> : <div className="grid gap-3 sm:grid-cols-2">{servicesList.map(service=><label key={service.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${selected.includes(service.id)?'border-brand-600 bg-brand-50':'border-slate-200'}`}><input type="checkbox" checked={selected.includes(service.id)} onChange={()=>toggleService(service.id)}/><span><strong className="block">{service.name}</strong><span className="mt-2 block text-sm text-slate-600">{service.durationMin} phút · {formatVND(service.price)} ₫</span></span></label>)}</div>}
          {!loadingServices&&!servicesList.length&&<p role="alert">Chưa có dịch vụ để đặt lịch.</p>}
        </fieldset>
</section>
<section hidden={step!==3} className="space-y-5">
        {/* Ngày, giờ */}
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Ngày hẹn:" required htmlFor="date" error={errors.date}>
            <DateInput id="date"  min={today} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>

          <Field label="Giờ hẹn:" required htmlFor="start" error={errors.start}>
            <div id="start" role="group" aria-label="Giờ hẹn còn trống" className="flex flex-wrap gap-2">{loadingSlots?<p role="status">Đang kiểm tra giờ...</p>:slots.map(t=><button key={t} type="button" aria-pressed={start===t} onClick={()=>setStart(t)} className={`rounded-full border px-4 py-2 font-bold ${start===t?'border-brand-700 bg-brand-700 text-white':'border-slate-200 bg-white text-slate-700'}`}>{t}</button>)}</div>
          </Field>

          <Field label="Giờ kết thúc dự kiến:" htmlFor="end">
            <input id="end" readOnly value={endTime} placeholder="--:--" className={inputCls} />
          </Field>
        </div>

        {duration > 0 && !loadingSlots && slots.length === 0 && date >= today && (
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-relaxed text-amber-800">
            <p role={slotError?'alert':'status'}>{availabilityMessage({error:slotError,reason:slotReason,duration})}</p>
            <button type="button" className="font-bold text-brand-700 underline" onClick={()=>setSlotVersion(v=>v+1)}>Kiểm tra lại giờ hẹn</button>
          </div>
        )}
        {slots.length > 0 && start && !startValid && (
          <p className="text-sm font-semibold leading-relaxed text-amber-700">
            Giờ {start} không còn trống với lựa chọn hiện tại. Vui lòng chọn giờ khác.
          </p>
        )}

        {/* Ghi chú */}
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

        </section>
        {/* Tổng kết */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 px-4 py-3">
          <p className="text-slate-700">
            Tổng thời lượng dự kiến: <strong>{duration} phút</strong>
          </p>
          <p className="text-slate-700">
            Tổng tạm tính: <strong className="text-lg text-accent-600">{formatVND(total)} ₫</strong>
          </p>
        </div>
        <p className="-mt-3 text-sm text-slate-500">Sau khi gửi, lịch hẹn ở trạng thái “Chờ xác nhận”.</p>

        {submitError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {submitError}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          {step>1&&<button type="button" className="rounded-full border px-6 py-3 font-bold" onClick={()=>setStep(step-1)}>Bước trước</button>}
          {step<3&&<button type="button" className="rounded-full bg-brand-700 px-6 py-3 font-bold text-white disabled:opacity-50" disabled={step===1?!petId:loadingServices||!selected.length} onClick={()=>setStep(step+1)}>Tiếp tục →</button>}
          <button
            type="submit"
            hidden={step!==3}
            disabled={isSubmitting || loadingSlots || !startValid}
            className="rounded-full bg-brand-700 px-7 py-3 text-sm font-extrabold tracking-normal text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Đang gửi yêu cầu...' : 'Xác nhận đặt lịch'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-slate-300 px-7 py-3 text-sm font-extrabold tracking-normal text-slate-600 transition hover:border-brand-600 hover:text-brand-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    </form>
  )
}
