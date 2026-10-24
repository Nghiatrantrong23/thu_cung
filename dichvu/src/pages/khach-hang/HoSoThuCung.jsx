import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import PetIllustration from '../../components/PetIllustration.jsx'
import './HoSoThuCung.css'
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
    <div className="pet-profiles">
      <div className="pet-profiles__heading">
        <div>
          <h1>Hồ sơ thú cưng</h1>
          <p>Lưu thông tin sức khỏe và thói quen của từng bé để nhân viên chăm sóc đúng cách.</p>
        </div>
        <button type="button" onClick={startAdd} className="pet-profiles__add">+ Thêm thú cưng</button>
      </div>

      <dl className="pet-profiles__summary">
        <div><dt>Tổng số thú cưng</dt><dd>{pets.length}</dd></div>
        <div><dt>Đang theo dõi</dt><dd>{pets.filter(p => p.active).length}</dd></div>
        <div><dt>Ngừng theo dõi</dt><dd>{pets.filter(p => !p.active).length}</dd></div>
      </dl>

      <div className="pet-profiles__grid">
        {pets.length === 0 && <p className="pet-profiles__empty">Bạn chưa có thú cưng nào. Hãy điền form bên dưới để thêm bé đầu tiên.</p>}
        {pets.map((p) => {
          const isActive = mode === 'edit' && p.id === selectedId
          return <article key={p.id} onClick={() => selectPet(p)} aria-current={isActive ? 'true' : undefined}
            className={`pet-profile-card ${isActive ? 'pet-profile-card--selected' : ''}`}>
            <div className="pet-profile-card__top">
              <div className={`pet-profile-card__avatar ${p.species === 'Mèo' ? 'pet-profile-card__avatar--cat' : ''}`}><PetIllustration species={p.species}/></div>
              <div className="pet-profile-card__identity"><h2>{p.name}</h2><p>{p.species}{p.breed ? ` · ${p.breed}` : ''}</p></div>
            </div>
            <div className="pet-profile-card__status"><StatusBadge status={p.active ? 'Đang theo dõi' : 'Ngừng theo dõi'}/></div>
            <dl className="pet-profile-card__details">
              <div><dt>Giới tính</dt><dd>{p.gender || '—'}</dd></div>
              <div><dt>Ngày sinh</dt><dd>{p.birthDate ? formatDateVN(p.birthDate) : '—'}</dd></div>
              <div><dt>Cân nặng</dt><dd>{p.weightKg != null ? `${formatWeight(p.weightKg)} kg` : '—'}</dd></div>
            </dl>
            <div className="pet-profile-card__note">{p.healthNote && <span>Có ghi chú sức khỏe</span>}</div>
            <div className="pet-profile-card__actions">
              <button type="button" onClick={(e) => { e.stopPropagation(); selectPet(p) }}>Xem</button>
              {p.active && <button type="button" onClick={(e) => { e.stopPropagation(); selectPet(p) }}>Chỉnh sửa</button>}
            </div>
          </article>
        })}
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
