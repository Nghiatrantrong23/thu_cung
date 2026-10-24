import {Link} from 'react-router-dom'
import {useAuth} from '../data/khoXacThuc.jsx'
import {staffNavigation} from '../lib/staffNavigation.js'
import {ROLE_LABEL} from '../lib/tienIchXacThuc.js'
export default function RoleHome(){
  const {user}=useAuth(),links=staffNavigation(user.roleKey).slice(1)
  return <main className="p-5 sm:p-7"><div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-brand-700">{ROLE_LABEL[user.roleKey]}</p><h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Xin chào, {user.fullName}</h1><p className="mt-2 text-sm text-slate-500">Chọn công việc bạn cần xử lý hôm nay.</p></div><span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800">Không gian làm việc</span></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{links.map(item=><Link key={item.path} to={item.path} className="group flex min-h-36 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"><div className="flex items-center justify-between"><span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">{item.short}</span><span aria-hidden="true" className="text-slate-400">↗</span></div><h2 className="mt-4 font-bold text-slate-800">{item.label}</h2><p className="mt-1 text-xs text-slate-500">{item.group}</p></Link>)}</div>
  </main>
}
