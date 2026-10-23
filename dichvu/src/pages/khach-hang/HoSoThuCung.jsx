import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { usePets } from '../../data/khoThuCung.jsx'
import { formatDateVN, toISODate } from '../../lib/tinhGioTrong.js'
import {
  GENDERS,
  SPECIES,
  emptyForm,
  formToPet,
  formatWeight,
  toForm,
  validatePet,
} from '../../lib/tienIchThuCung.js'

const inputCls =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-slate-800 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-400'
const btnPrimary =
  'rounded-full bg-brand-700 px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400'
const btnGhost =
  'rounded-full border border-slate-300 px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-slate-600 transition hover:border-brand-600 hover:text-brand-700'
const btnDanger =
  'rounded-full border border-rose-300 px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-rose-700 transition hover:bg-rose-50'

function Field({ id, label, required, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-slate-700">
        {label}{required && <span className="text-accent-600"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-sm text-slate-500">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-semibold text-red-600">{error}</p>}
    </div>
  )
}

function StatusBadge({ status }) {
  const ok = status === 'Dang theo doi' || status === 'Đang theo dõi'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
      {ok ? 'Đang theo dõi' : 'Ngừng theo dõi'}
    </span>
  )
}

export default function PetsPage() {
  const { pets, loading, initialized, addPet, updatePet, setActive } = usePets()
  const location = useLocation()

  const startNew = Boolean(location.state?.new) || (initialized && pets.length === 0)
  const [mode, setMode] = useState(startNew ? 'new' : 'edit')
  const [selectedId, setSelectedId] = useState(startNew ? null : (pets[0]?.id ?? null))
  const [form, setForm] = useState(() => (startNew || !pets[0] ? emptyForm() : toForm(pets[0])))
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [confirmStop, setConfirmStop] = useState(false)
  const [saving, setSaving] = useState(false)

  const selected = mode === 'edit' ? pets.find((p) => p.id === selectedId) ?? null : null
  const inactive = selected ? !selected.active : false
  const today = toISODate(new Date())

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }
  const invalid = (key) => (errors[key] ? 'border-red-400' : 'border-slate-300')

  function selectPet(pet) {
    setMode('edit'); setSelectedId(pet.id); setForm(toForm(pet)); setErrors({}); setNotice(null)
  }
  function startAdd() {
    setMode('new'); setSelectedId(null); setForm(emptyForm()); setErrors({}); setNotice(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validatePet(form, pets, mode === 'edit' ? selectedId : null)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true); setNotice(null)
    const data = formToPet(form)
    if (mode === 'new') {
      const result = await addPet(data)
      setSaving(false)
      if (result.ok) {
        setMode('edit'); setSelectedId(result.pet.id); setForm(toForm(result.pet))
        setNotice({ type: 'ok', text: `Đã thêm thú cưng ${result.pet.name}. Bạn có thể đặt lịch cho bé ở mục Đặt lịch.` })
      } else {
        setNotice({ type: 'error', text: result.error || 'Thêm thất bại, vui lòng thử lại.' })
      }
    } else {
      const result = await updatePet(selectedId, data)
      setSaving(false)
      if (result.ok) {
        setForm(toForm(result.pet))
        setNotice({ type: 'ok', text: result.message || 'Đã lưu thay đổi.' })
      } else {
        setNotice({ type: 'error', text: result.error || 'Lưu thất bại, vui lòng thử lại.' })
      }
    }
  }

  async function requestStop() {
    setSaving(true)
    const result = await setActive(selected.id, false)
    setSaving(false); setConfirmStop(false)
    if (result.ok) setNotice({ type: 'ok', text: result.message })
    else setNotice({ type: 'error', text: result.error })
  }

  async function doResume() {
    setSaving(true)
    const result = await setActive(selected.id, true)
    setSaving(false)
    if (result.ok) setNotice({ type: 'ok', text: result.message })
    else setNotice({ type: 'error', text: result.error })
  }

  if (!initialized) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">Hồ sơ thú cưng của tôi</h1>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          <svg className="mx-auto mb-3 h-8 w-8 animate-spin text-brand-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Đang tải thú cưng...
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-slate-800 sm:text-3xl">Hồ sơ thú cưng của tôi</h1>
        <button type="button" onClick={startAdd} className={btnGhost}>+ Thêm thú cưng mới</button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-brand-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-bold">Tên</th>
              <th className="px-4 py-3 font-bold">Loài</th>
              <th className="px-4 py-3 font-bold">Giống</th>
              <th className="px-4 py-3 font-bold">Giới tính</th>
              <th className="px-4 py-3 font-bold">Ngày sinh</th>
              <th className="px-4 py-3 text-right font-bold">Cân nặng (kg)</th>
              <th className="px-4 py-3 font-bold">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pets.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Bạn chưa có thú cưng nào. Hãy điền form bên dưới để thêm bé đầu tiên.</td></tr>
            )}
            {pets.map((p) => {
              const isActive = mode === 'edit' && p.id === selectedId
              return (
                <tr key={p.id} onClick={() => selectPet(p)} aria-selected={isActive}
                  className={`cursor-pointer transition ${isActive ? 'bg-brand-50' : 'hover:bg-slate-50'} ${p.active ? '' : 'text-slate-400'}`}>
                  <td className="px-4 py-3">
                    <button type="button" onClick={(e) => { e.stopPropagation(); selectPet(p) }}
                      className={`font-extrabold underline-offset-2 hover:underline ${p.active ? 'text-brand-700' : 'text-slate-500'}`}>
                      {p.name}
                    </button>
                  </td>
                  <td className="px-4 py-3">{p.species}</td>
                  <td className="px-4 py-3">{p.breed || '-'}</td>
                  <td className="px-4 py-3">{p.gender || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{p.birthDate ? formatDateVN(p.birthDate) : '-'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.weightKg != null ? formatWeight(p.weightKg) : '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.active ? 'Đang theo dõi' : 'Ngừng theo dõi'} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {notice && (
        <p role={notice.type === 'error' ? 'alert' : 'status'}
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${notice.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
          {notice.text}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-extrabold text-slate-800">
          {mode === 'new' ? 'Thêm thú cưng mới' : `Thông tin thú cưng: ${selected?.name ?? ''}`}
        </h2>
        <fieldset disabled={inactive || saving} className="mt-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="pet-name" label="Tên thú cưng:" required error={errors.name}>
              <input id="pet-name" value={form.name} maxLength={50} onChange={setField('name')} className={`${inputCls} ${invalid('name')}`} />
            </Field>
            <Field id="pet-species" label="Loài:" required error={errors.species} hint="Hệ thống chỉ nhận chó và mèo">
              <select id="pet-species" value={form.species} onChange={setField('species')} className={`${inputCls} ${invalid('species')}`}>
                <option value="">Chọn loài</option>
                {SPECIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field id="pet-breed" label="Giống loài:">
              <input id="pet-breed" value={form.breed} maxLength={50} onChange={setField('breed')} className={`${inputCls} border-slate-300`} />
            </Field>
            <Field id="pet-gender" label="Giới tính:">
              <select id="pet-gender" value={form.gender} onChange={setField('gender')} className={`${inputCls} border-slate-300`}>
                <option value="">Chưa rõ</option>
                {GENDERS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field id="pet-birthDate" label="Ngày sinh:" error={errors.birthDate}>
              <input id="pet-birthDate" type="date" max={today} value={form.birthDate} onChange={setField('birthDate')} className={`${inputCls} ${invalid('birthDate')}`} />
            </Field>
            <Field id="pet-weight" label="Cân nặng (kg):" error={errors.weight}>
              <input id="pet-weight" inputMode="decimal" placeholder="Ví dụ: 4,2" value={form.weight} onChange={setField('weight')} className={`${inputCls} ${invalid('weight')}`} />
            </Field>
          </div>
          <Field id="pet-healthNote" label="Ghi chú sức khỏe:" hint="Dị ứng, bệnh nền, điều cần lưu ý khi chăm sóc.">
            <textarea id="pet-healthNote" rows={3} maxLength={300} value={form.healthNote} onChange={setField('healthNote')} className={`${inputCls} border-slate-300`} />
          </Field>
        </fieldset>

        {inactive && (
          <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
            {selected.name} đang ở trạng thái Ngừng theo dõi nên không sửa được. Bấm Theo dõi lại để tiếp tục sử dụng.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {mode === 'new' ? (
            <>
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Đang lưu...' : 'Thêm thú cưng mới'}</button>
              {pets.length > 0 && <button type="button" onClick={() => selectPet(pets[0])} className={btnGhost}>Hủy</button>}
            </>
          ) : (
            <>
              <button type="submit" disabled={inactive || saving} className={btnPrimary}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              {inactive
                ? <button type="button" disabled={saving} onClick={doResume} className={btnGhost}>{saving ? 'Đang xử lý...' : 'Theo dõi lại'}</button>
                : <button type="button" disabled={saving} onClick={() => setConfirmStop(true)} className={btnDanger}>Ngừng theo dõi</button>
              }
            </>
          )}
        </div>
        <p className="mt-3 text-sm text-slate-500">Thú cưng đã có lịch hẹn không xóa được, chỉ chuyển sang Ngừng theo dõi.</p>
      </form>

      {confirmStop && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-800">Ngừng theo dõi {selected.name}?</h3>
            <p className="mt-2 text-sm text-slate-600">Hồ sơ và lịch sử chăm sóc vẫn được giữ lại. Bạn có thể theo dõi lại bất cứ lúc nào.</p>
            <div className="mt-5 flex gap-3">
              <button type="button" disabled={saving} onClick={requestStop}
                className="flex-1 rounded-full bg-rose-600 py-2.5 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-50">
                {saving ? 'Đang xử lý...' : 'Ngừng theo dõi'}
              </button>
              <button type="button" onClick={() => setConfirmStop(false)} className={`flex-1 ${btnGhost}`}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}