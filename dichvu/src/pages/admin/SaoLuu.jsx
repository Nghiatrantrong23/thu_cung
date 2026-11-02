import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../data/khoXacThuc.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'

const btnPrimary = 'rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-50'
const btnSecondary = 'rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition'
const btnDanger = 'rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100 transition'
const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'

const DEMO_BACKUPS = [
  { id: 'BK-1102', time: '2026-11-02 02:00', type: 'Tự động', size: '48,2 MB', status: 'Hoàn tất' },
  { id: 'BK-1101', time: '2026-11-01 02:00', type: 'Tự động', size: '47,9 MB', status: 'Hoàn tất' },
  { id: 'BK-1100', time: '2026-10-31 02:00', type: 'Tự động', size: '47,5 MB', status: 'Hoàn tất' },
  { id: 'BK-1099', time: '2026-10-30 14:20', type: 'Thủ công', size: '47,3 MB', status: 'Hoàn tất' },
]

const POLICY = {
  every: 'Hằng ngày',
  at: '02:00',
  keep: 14,
  loc: 'Kho lưu trữ ngoài máy chủ (mã hóa AES-256)',
  lastTest: '2026-07-15',
}

export default function SaoLuu() {
  const { apiCall } = useAuth()
  const [backups, setBackups] = useState(DEMO_BACKUPS)
  const [policy, setPolicy] = useState(POLICY)
  const [loading, setLoading] = useState(true)
  const [backingUp, setBackingUp] = useState(false)
  const [toast, setToast] = useState('')
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [restoreConfirm, setRestoreConfirm] = useState('')
  const [restoreError, setRestoreError] = useState('')

  const TODAY = new Date().toISOString().slice(0, 10)

  const load = useCallback(() => {
    setLoading(true)
    apiCall('/admin/backups')
      .then(res => {
        if (res.ok && res.data) {
          if (Array.isArray(res.data.backups)) setBackups(res.data.backups)
          if (res.data.policy) setPolicy({ ...POLICY, ...res.data.policy })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [apiCall])

  useEffect(() => { load() }, [load])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function backupNow() {
    setBackingUp(true)
    try {
      const res = await apiCall('/admin/backups', { method: 'POST' })
      if (res.ok && res.data?.backup) {
        setBackups(b => [res.data.backup, ...b])
        showToast('Đã tạo bản sao lưu thủ công thành công')
      } else {
        // Demo mode
        const newB = { id: `BK-${1103 + backups.length - 3}`, time: new Date().toLocaleString('vi-VN'), type: 'Thủ công', size: '48,3 MB', status: 'Hoàn tất' }
        setBackups(b => [newB, ...b])
        showToast('Đã tạo bản sao lưu (mô phỏng)')
      }
    } catch {
      showToast('Lỗi khi tạo bản sao lưu')
    } finally {
      setBackingUp(false)
    }
  }

  async function testRestore() {
    try {
      await apiCall('/admin/backups/test-restore', { method: 'POST' })
    } catch { /* ignore */ }
    setPolicy(p => ({ ...p, lastTest: TODAY }))
    showToast('Đã ghi nhận lần thử khôi phục trên môi trường test')
  }

  async function doRestore() {
    if (restoreConfirm.trim() !== 'KHÔI PHỤC') {
      return setRestoreError('Gõ đúng cụm "KHÔI PHỤC" để xác nhận.')
    }
    try {
      await apiCall(`/admin/backups/${restoreTarget}/restore`, { method: 'POST' })
      showToast(`Đã khôi phục từ ${restoreTarget} (mô phỏng)`)
    } catch {
      showToast(`Khôi phục từ ${restoreTarget} (mô phỏng)`)
    }
    setRestoreTarget(null); setRestoreConfirm(''); setRestoreError('')
  }

  const daysSinceTest = Math.round((new Date(TODAY) - new Date(policy.lastTest)) / 864e5)

  return (
    <div>
      <PageHeading
        title="Sao lưu và khôi phục"
        subtitle="Sao lưu tự động hằng ngày. Dữ liệu được mã hóa và lưu ngoài máy chủ."
        actions={
          <div className="flex gap-2">
            <button onClick={testRestore} className={btnSecondary}>Thử khôi phục (test)</button>
            <button onClick={backupNow} disabled={backingUp} className={btnPrimary}>
              {backingUp ? 'Đang sao lưu…' : 'Sao lưu ngay'}
            </button>
          </div>
        }
      />

      {/* Policy summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-4">
        <div>
          <p className="text-xs font-semibold text-slate-500">Lịch tự động</p>
          <p className="mt-1 font-bold text-slate-800">{policy.every} lúc {policy.at}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Số bản giữ lại</p>
          <p className="mt-1 font-bold text-slate-800">{policy.keep} bản gần nhất</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Nơi lưu</p>
          <p className="mt-1 font-bold text-slate-800">{policy.loc}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Thử khôi phục gần nhất</p>
          <p className="mt-1 font-bold text-slate-800">{policy.lastTest}</p>
        </div>
      </div>

      {daysSinceTest > 90 ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Đã {daysSinceTest} ngày chưa thử khôi phục. Nên thử định kỳ (tối đa 90 ngày) để chắc chắn bản sao dùng được.
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Đã thử khôi phục {daysSinceTest} ngày trước – trong ngưỡng an toàn.
        </div>
      )}

      {/* Confirm restore panel */}
      {restoreTarget && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 font-bold text-rose-700">Khôi phục từ {restoreTarget}</h3>
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Dữ liệu hiện tại sẽ bị thay bằng dữ liệu của bản sao lưu. Hệ thống tự tạo một bản sao lưu trước khi khôi phục. Nên báo trước cho nhân viên và tạm ngưng nhận lịch.
          </div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            Gõ <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">KHÔI PHỤC</code> để xác nhận
          </label>
          <input
            className={inputCls}
            value={restoreConfirm}
            onChange={e => { setRestoreConfirm(e.target.value); setRestoreError('') }}
            placeholder="KHÔI PHỤC"
          />
          {restoreError && <p className="mt-2 text-sm text-rose-600">{restoreError}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={doRestore} className={btnDanger}>Khôi phục</button>
            <button onClick={() => { setRestoreTarget(null); setRestoreConfirm(''); setRestoreError('') }} className={btnSecondary}>Hủy</button>
          </div>
        </div>
      )}

      {/* Backups table */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Mã', 'Thời gian', 'Loại', 'Dung lượng', 'Trạng thái', ''].map(h => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Đang tải…</td></tr>
              ) : backups.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Chưa có bản sao lưu.</td></tr>
              ) : backups.map((b, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-slate-700">{b.id}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{b.time}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{b.type}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{b.size}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      b.status === 'Hoàn tất' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {b.status === 'Hoàn tất' && (
                      <button
                        onClick={() => { setRestoreTarget(b.id); setRestoreConfirm(''); setRestoreError('') }}
                        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-rose-300 hover:text-rose-700 transition"
                      >
                        Khôi phục
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

