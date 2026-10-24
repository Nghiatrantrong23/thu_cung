import {cloneElement,useId} from 'react'
export const inputClass='min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100'
export default function FormField({label,hint,error,required=false,children}) {
  const generated=useId(),id=children.props.id||generated
  const described=[children.props['aria-describedby'],hint?`${id}-hint`:null,error?`${id}-error`:null].filter(Boolean).join(' ')
  return <div className="min-w-0 space-y-1.5"><label htmlFor={id} className="block text-sm font-semibold text-slate-700">{label}{required&&<span className="ml-1 text-rose-600" aria-hidden="true">*</span>}</label>
    {cloneElement(children,{id,required:required||children.props.required,'aria-invalid':error?true:undefined,'aria-describedby':described||undefined,className:`${inputClass} ${children.props.className||''}`})}
    {hint&&<p id={`${id}-hint`} className="text-sm text-slate-500">{hint}</p>}{error&&<p id={`${id}-error`} role="alert" className="text-sm text-rose-700">{error}</p>}
  </div>
}
