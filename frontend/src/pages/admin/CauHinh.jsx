import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../data/khoXacThuc.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'

const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1'
const btnPrimary = 'rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-50'
const btnSecondary = 'rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition'

const DEFAULT_CONFIG = {
  name: 'PetCare Trảng Bàng',
  addr: '12 Quốc lộ 22, Trảng Bàng, Tây Ninh',
  open: '07:30',
  close: '20:00',
  hol: '2026-12-25, 2027-01-01',
  freeH: 24,
  fee: 30,
  maxR: 2,
  rH: 12,
  slot: 60,
  par: 4,
  ret: 24,
  tpl: 'Chào {ten_khach}, PetCare nhắc lịch của {thu_cung} lúc {gio}. Trân trọng!',
}

function Section({ title, children }) {
  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

export default function CauHinh() {
  const { apiCall } = useAuth()
  const [cfg, setCfg] = useState(DEFAULT_CONFIG)
  const [original, setOriginal] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const load = useCallback(() => {
    setLoading(true)
    apiCall('/admin/config')
      .then(res => {
        if (res.ok && res.data?.config) {
          setCfg({ ...DEFAULT_CONFIG, ...res.data.config })
          setOriginal({ ...DEFAULT_CONFIG, ...res.data.config })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [apiCall])

  useEffect(() => { load() }, [load])

  function set(key, value) { setCfg(c => ({ ...c, [key]: value })) }

  async function save() {
    // validate
    if (!cfg.name.trim()) return setMsg({ type: 'error', text: 'Nhập tên cơ sở.' })
    if (cfg.open >= cfg.close) return setMsg({ type: 'error', text: 'Giờ mở cửa phải trước giờ đóng cửa.' })
    if (cfg.fee < 0 || cfg.fee > 100) return setMsg({ type: 'error', text: 'Phí hủy muộn từ 0 đến 100%.' })
    if (cfg.slot < 15 || cfg.slot > 240) return setMsg({ type: 'error', text: 'Khung giờ từ 15 đến 240 phút.' })
    if (cfg.par < 1 || cfg.par > 50) return setMsg({ type: 'error', text: 'Số lịch song song từ 1 đến 50.' })
    if (cfg.ret < 12) return setMsg({ type: 'error', text: 'Giữ nhật ký tối thiểu 12 tháng.' })
    if (!cfg.tpl.includes('{gio}')) return setMsg({ type: 'error', text: 'Mẫu thông báo cần có biến {gio}.' })

    setSaving(true); setMsg({ type: '', text: '' })
    try {
      const res = await apiCall('/admin/config', { method: 'PUT', body: JSON.stringify(cfg) })
      if (res.ok) {
        setOriginal(cfg)
        setMsg({ type: 'success', text: 'Đã lưu cấu hình thành công.' })
      } else {
        setMsg({ type: 'error', text: res.error || 'Lưu thất bại.' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Lỗi kết nối.' })
    } finally {
      setSaving(false)
    }
  }

  const changed = JSON.stringify(cfg) !== JSON.stringify(original)

  if (loading) {
    return (
      <div>
        <PageHeading title="Cấu hình hệ thống" subtitle="Mọi thay đổi được ghi vào nhật ký." />
        <div className="mt-6 text-sm text-slate-500">Đang tải cấu hình…</div>
      </div>
    )
  }

  return (
    <div>
      <PageHeading
        title="Cấu hình hệ thống"
        subtitle="Mọi thay đổi được ghi vào nhật ký."
        actions={
          <div className="flex gap-2">
            {changed && (
              <button onClick={() => { setCfg(original); setMsg({ type: '', text: '' }) }} className={btnSecondary}>
                Hoàn tác
              </button>
            )}
            <button onClick={save} disabled={saving || !changed} className={btnPrimary}>
              {saving ? 'Đang lưu…' : 'Lưu cấu hình'}
            </button>
          </div>
        }
      />

      {msg.text && (
        <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
          msg.type === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Section title="Thông tin cơ sở">
          <Field label="Tên cơ sở *">
            <input className={inputCls} value={cfg.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label="Địa chỉ">
            <input className={inputCls} value={cfg.addr} onChange={e => set('addr', e.target.value)} />
          </Field>
          <Field label="Giờ mở cửa">
            <input type="time" className={inputCls} value={cfg.open} onChange={e => set('open', e.target.value)} />
          </Field>
          <Field label="Giờ đóng cửa">
            <input type="time" className={inputCls} value={cfg.close} onChange={e => set('close', e.target.value)} />
          </Field>
        </Section>

        <div className="mt-6">
          <label className={labelCls}>Ngày nghỉ lễ (YYYY-MM-DD, cách nhau bởi dấu phẩy)</label>
          <input
            className={inputCls}
            value={cfg.hol}
            onChange={e => set('hol', e.target.value)}
            placeholder="VD: 2026-12-25, 2027-01-01"
          />
        </div>

        <Section title="Chính sách hủy / đổi lịch">
          <Field label="Hủy miễn phí trước (giờ)">
            <input type="number" min="0" className={inputCls} value={cfg.freeH} onChange={e => set('freeH', +e.target.value)} />
          </Field>
          <Field label="Phí hủy muộn (% giá dịch vụ)">
            <input type="number" min="0" max="100" className={inputCls} value={cfg.fee} onChange={e => set('fee', +e.target.value)} />
          </Field>
          <Field label="Số lần đổi lịch tối đa">
            <input type="number" min="0" className={inputCls} value={cfg.maxR} onChange={e => set('maxR', +e.target.value)} />
          </Field>
          <Field label="Chỉ được đổi trước (giờ)">
            <input type="number" min="0" className={inputCls} value={cfg.rH} onChange={e => set('rH', +e.target.value)} />
          </Field>
        </Section>

        <Section title="Lịch hẹn">
          <Field label="Thời lượng mỗi khung giờ (phút)">
            <input type="number" min="15" max="240" className={inputCls} value={cfg.slot} onChange={e => set('slot', +e.target.value)} />
          </Field>
          <Field label="Số lịch song song tối đa">
            <input type="number" min="1" max="50" className={inputCls} value={cfg.par} onChange={e => set('par', +e.target.value)} />
          </Field>
          <Field label="Giữ nhật ký (tháng, tối thiểu 12)">
            <input type="number" min="12" className={inputCls} value={cfg.ret} onChange={e => set('ret', +e.target.value)} />
          </Field>
        </Section>

        <div className="mt-6">
          <label className={labelCls}>Mẫu thông báo nhắc lịch</label>
          <textarea
            rows={2}
            className={`${inputCls} resize-none`}
            value={cfg.tpl}
            onChange={e => set('tpl', e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">Biến dùng được: {'{ten_khach}'} {'{thu_cung}'} {'{gio}'}</p>
        </div>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Gửi email đặt lại mật khẩu và thanh toán qua cổng thật chưa được nghiệm thu – cần thử riêng trước khi bật cho khách.
        </div>
      </div>
    </div>
  )
}

