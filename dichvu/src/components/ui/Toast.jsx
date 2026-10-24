import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react'
const Context=createContext(null)
export function ToastProvider({children}) {
  const [items,setItems]=useState([]),timers=useRef(new Map()),sequence=useRef(0)
  const dismiss=useCallback(id=>{clearTimeout(timers.current.get(id));timers.current.delete(id);setItems(rows=>rows.filter(row=>row.id!==id))},[])
  useEffect(()=>()=>{for(const timer of timers.current.values())clearTimeout(timer);timers.current.clear()},[])
  const notify=useCallback((message,{kind='success'}={})=>{
    const id=++sequence.current;setItems(rows=>[...rows,{id,message,kind}]);
    if(kind!=='error')timers.current.set(id,setTimeout(()=>dismiss(id),7000))
    return id
  },[dismiss])
  return <Context.Provider value={notify}>{children}<div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3" aria-label="Thông báo thao tác">
    {items.map(row=><div key={row.id} role={row.kind==='error'?'alert':'status'} className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg ${row.kind==='error'?'border-rose-200 bg-rose-50 text-rose-900':'border-brand-200 bg-white text-slate-800'}`}><span className="min-w-0 flex-1 break-words text-sm">{row.message}</span><button type="button" className="-m-2 grid min-h-11 min-w-11 place-items-center rounded-lg" aria-label="Đóng thông báo" onClick={()=>dismiss(row.id)}>✕</button></div>)}
  </div></Context.Provider>
}
export function useToast(){const notify=useContext(Context);if(!notify)throw new Error('useToast requires ToastProvider');return notify}
