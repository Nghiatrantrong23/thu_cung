import {useTheme} from '../data/khoGiaoDien.jsx'
export default function ThemeToggle(){
  const context=useTheme()
  if(!context)return null
  const {theme,toggleTheme}=context,label=theme==='dark'?'Chuyển sang giao diện sáng':'Chuyển sang giao diện tối'
  return <button type="button" className="theme-toggle" onClick={toggleTheme} title={label} aria-label={label} aria-pressed={theme==='dark'}>
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{theme==='dark'?<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>:<path d="M20.8 13.1A9 9 0 0 1 10.9 3.2a9 9 0 1 0 9.9 9.9Z"/>}</svg>
  </button>
}
