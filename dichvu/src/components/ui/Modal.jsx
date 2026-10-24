import {useId,useLayoutEffect,useRef} from 'react'
import {createPortal} from 'react-dom'
import Button from './Button.jsx'
let locks=0,originalOverflow=''
export default function Modal({open=true,title,children,onClose,busy=false,drawer=false,footer}) {
  const titleId=useId(),dialog=useRef(null),closeRef=useRef(onClose),busyRef=useRef(busy)
  closeRef.current=onClose;busyRef.current=busy
  useLayoutEffect(()=>{
    if(!open)return
    const element=dialog.current,previous=document.activeElement
    if(locks++===0){originalOverflow=document.body.style.overflow;document.body.style.overflow='hidden'}
    element.showModal()
    function cancel(event){event.preventDefault();if(!busyRef.current)closeRef.current?.()}
    function trapFocus(event){
      if(event.key!=='Tab')return
      const targets=[...element.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(node=>!node.disabled&&node.tabIndex>=0&&!node.closest('[hidden],[inert]')&&node.getClientRects().length)
      const first=targets[0],last=targets.at(-1),active=document.activeElement
      if(!first){event.preventDefault();element.focus();return}
      if(event.shiftKey&&(active===first||!element.contains(active))){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&(active===last||!element.contains(active))){event.preventDefault();first.focus()}
    }
    element.addEventListener('cancel',cancel)
    element.addEventListener('keydown',trapFocus)
    return()=>{element.removeEventListener('cancel',cancel);element.removeEventListener('keydown',trapFocus);element.close();if(--locks===0)document.body.style.overflow=originalOverflow;if(previous?.isConnected)previous.focus()}
  },[open])
  if(!open)return null
  return createPortal(<dialog ref={dialog} aria-labelledby={titleId} aria-modal="true" aria-busy={busy||undefined}
    className={`pc-dialog ${drawer?'pc-drawer':''}`} onClick={event=>{
      if(event.target!==event.currentTarget||busy)return
      const rect=event.currentTarget.getBoundingClientRect()
      if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose?.()
    }}>
    <div className="flex max-h-[90dvh] flex-col"><header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4"><h2 id={titleId} className="pt-2 text-lg font-extrabold text-slate-900">{title}</h2><Button variant="ghost" onClick={onClose} disabled={busy} aria-label="Đóng hộp thoại">✕</Button></header>
    <div className="min-h-0 overflow-y-auto p-5">{children}</div>{footer&&<footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 p-4">{footer}</footer>}</div>
  </dialog>,document.body)
}
export function Drawer(props){return <Modal {...props} drawer/>}
