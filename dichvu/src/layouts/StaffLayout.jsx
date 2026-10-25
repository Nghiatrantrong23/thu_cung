import './StaffLayout.css'
import WorkIcon from '../components/ui/WorkIcon.jsx'
import {useEffect,useState} from 'react'
import {NavLink,useLocation,useNavigate} from 'react-router-dom'
import {useAuth} from '../data/khoXacThuc.jsx'
import {ROLE_LABEL} from '../lib/tienIchXacThuc.js'
import {staffNavigation} from '../lib/staffNavigation.js'
import {Drawer} from '../components/ui/Modal.jsx'
import Button from '../components/ui/Button.jsx'
import BieuTuongDauChan from '../components/BieuTuongDauChan.jsx'
import ThongBao from '../components/ThongBao.jsx'
export function StaffNavigation({role,onNavigate}) {
  let previous=''
  return <nav aria-label="Điều hướng nhân sự" className="space-y-1">{staffNavigation(role).map(item=>{
    const heading=previous!==item.group;previous=item.group
    return <div key={item.path}>{heading&&<p className="px-3 pb-2 pt-6 text-xs font-bold uppercase tracking-widest text-slate-500">{item.group}</p>}
      <NavLink to={item.path} end onClick={onNavigate} className={({isActive})=>`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive?'bg-brand-50 text-brand-800':'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-brand-700"><WorkIcon name={item.path}/></span>{item.label}</NavLink>
    </div>
  })}</nav>
}
export default function StaffLayout({children}) {
  const {user,logout}=useAuth(),location=useLocation(),navigate=useNavigate()
  const [menu,setMenu]=useState(false),[signingOut,setSigningOut]=useState(false)
  const links=staffNavigation(user.roleKey),current=links.find(item=>item.path===location.pathname)
  useEffect(()=>{setMenu(false)},[location.pathname])
  async function signOut(){setSigningOut(true);try{await logout();navigate('/dang-nhap',{replace:true})}finally{setSigningOut(false)}}
  const logo=<NavLink to={links[0]?.path||'/dang-nhap'} className="flex items-center gap-3 px-3 py-2 font-extrabold text-brand-800"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white"><BieuTuongDauChan className="h-6 w-6"/></span><span className="text-xl tracking-tight">PetCare<span className="block text-xs font-semibold uppercase tracking-[.18em] text-slate-500">Workspace</span></span></NavLink>
  return <div className="min-h-screen bg-slate-50">
    <a href="#staff-content" className="sr-only z-[90] rounded-lg bg-brand-700 p-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4" onClick={event=>{event.preventDefault();document.getElementById('staff-content')?.focus()}}>Đến nội dung chính</a>
    <aside className="pc-staff-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 lg:flex">{logo}<StaffNavigation role={user.roleKey}/><div className="mt-auto border-t border-slate-100 px-3 pt-5 text-xs leading-5 text-slate-500">Chăm sóc tận tâm.<br/>Quản lý mỗi ngày.</div></aside>
    <div className="pc-staff-body min-w-0 lg:pl-64"><header className="pc-staff-header border-b border-slate-200 bg-white px-4 py-4 sm:px-7"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><Button variant="secondary" className="shrink-0 lg:hidden" aria-label="Mở menu nhân sự" aria-expanded={menu} onClick={()=>setMenu(true)}><WorkIcon name="menu"/></Button><div className="min-w-0"><nav aria-label="Đường dẫn" className="text-xs font-medium text-slate-600"><NavLink to={links[0]?.path||'/dang-nhap'} className="hover:text-brand-700">PetCare</NavLink> / {current?.group||'Công việc'}</nav><p className="truncate text-sm font-bold text-slate-800">{current?.label||'Không gian làm việc'}</p></div></div><div className="flex shrink-0 items-center gap-3"><ThongBao compact/><div className="hidden text-right sm:block"><p className="max-w-48 truncate text-sm font-bold text-slate-800">{user.fullName}</p><p className="text-xs text-slate-500">{ROLE_LABEL[user.roleKey]}</p></div><Button variant="secondary" pending={signingOut} onClick={signOut}>Đăng xuất</Button></div></div></header>
    <section id="staff-content" tabIndex={-1} aria-label={current?.label||'Nội dung công việc'} className="pc-workspace mx-auto min-w-0 max-w-7xl px-4 py-6 outline-none sm:px-7">{children}</section></div>
    <Drawer open={menu} title="Menu nhân sự" onClose={()=>setMenu(false)}>{logo}<StaffNavigation role={user.roleKey} onNavigate={()=>setMenu(false)}/><p className="mt-6 border-t border-slate-200 pt-4 text-sm font-semibold text-slate-600">{user.fullName} · {ROLE_LABEL[user.roleKey]}</p></Drawer>
  </div>
}
