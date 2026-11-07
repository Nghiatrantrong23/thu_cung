import {useEffect,useId,useRef,useState} from 'react'
import {formatVND} from '../lib/tinhGioTrong.js'
import './RevenueChart.css'
const money=value=>`${formatVND(value)} ₫`
const axis=value=>{
  const magnitude=Math.abs(value),number=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:1})
  return magnitude>=1000000?`${number.format(value/1000000)} tr`:magnitude>=1000?`${number.format(value/1000)} nghìn`:number.format(value)
}
export default function RevenueChart({rows,title,unit}) {
  const id=useId()
  const region=useRef(null),[viewportWidth,setViewportWidth]=useState(680)
  useEffect(()=>{
    if(!region.current||typeof ResizeObserver==='undefined')return
    const observer=new ResizeObserver(entries=>setViewportWidth(Math.max(320,Math.floor(entries[0].contentRect.width))))
    observer.observe(region.current);return()=>observer.disconnect()
  },[])
  const [selected,setSelected]=useState(()=>Math.max(0,rows.findLastIndex(row=>row.collected||row.refunded)))
  const current=rows[selected]||rows[0]
  if(!rows.length)return null
  const width=Math.max(viewportWidth,rows.length*38+110),height=320,left=85,right=20,top=24,bottom=264
  const minimum=Math.min(0,...rows.map(row=>row.net)),maximum=Math.max(1000,...rows.flatMap(row=>[row.collected,row.refunded,row.net]))
  const step=(width-left-right)/rows.length,y=value=>bottom-(value-minimum)/(maximum-minimum)*(bottom-top),zero=y(0)
  const center=index=>left+step*(index+0.5),barWidth=Math.min(18,step*0.28)
  const ticks=Array.from({length:5},(_,index)=>minimum+(maximum-minimum)*index/4)
  const line=rows.map((row,index)=>`${center(index)},${y(row.net)}`).join(' ')
  const stride=Math.max(1,Math.ceil(rows.length/16))
  const hasMoney=rows.some(row=>row.collected||row.refunded)
  return <section className="revenue-visual" aria-labelledby={id}>
    <div className="revenue-visual-heading"><div><h2 id={id}>Biểu đồ doanh thu · {title}</h2><p>{unit==='month'?'Tổng hợp theo tháng':'Tổng hợp theo ngày'} · Đơn vị: đồng (VND)</p></div><ul className="revenue-legend" aria-label="Chú giải"><li><i className="revenue-swatch collected"/>Đã thu</li><li><i className="revenue-swatch refunded"/>Đã hoàn</li><li><i className="revenue-swatch net"/>Thực thu</li></ul></div>
    <p className="revenue-hint">Chọn một {unit==='month'?'tháng':'ngày'} trên biểu đồ để xem số tiền. Có thể dùng Tab rồi Enter; cuộn ngang nếu biểu đồ dài.</p>
    {!hasMoney&&<p role="status" className="revenue-empty">Chưa có giao dịch thành công trong kỳ; các mốc thời gian có giá trị 0.</p>}
    <div ref={region} className="revenue-scroll" tabIndex={0} role="region" aria-label="Biểu đồ doanh thu có thể cuộn ngang"><div style={{minWidth:width}}>
      <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`Đã thu, đã hoàn và thực thu — ${title}`}>
        {ticks.map((value,index)=><g key={index}><line x1={left} x2={width-right} y1={y(value)} y2={y(value)} stroke="#e2e8f0" strokeDasharray="3 4"/><text x={left-10} y={y(value)+4} textAnchor="end" className="revenue-axis">{axis(value)}</text></g>)}
        <line x1={left} x2={width-right} y1={zero} y2={zero} stroke="#94a3b8"/>
        {rows.map((row,index)=><g key={row.key}>
          <rect x={center(index)-barWidth-2} y={y(row.collected)} width={barWidth} height={Math.max(0,zero-y(row.collected))} rx="3" fill="#00796f"/>
          <rect x={center(index)+2} y={y(row.refunded)} width={barWidth} height={Math.max(0,zero-y(row.refunded))} rx="3" fill="#e99b43"/>
          {(index%stride===0||index===rows.length-1)&&<text x={center(index)} y={bottom+26} textAnchor="middle" className="revenue-axis">{row.label}</text>}
        </g>)}
        <polyline points={line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round"/>
        {rows.map((row,index)=><g key={row.key} role="button" tabIndex={0} aria-label={`${row.fullLabel}: đã thu ${money(row.collected)}, đã hoàn ${money(row.refunded)}, thực thu ${money(row.net)}`} aria-pressed={selected===index} className="revenue-point" onClick={()=>setSelected(index)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(index)}}}>
          <title>{row.fullLabel}: đã thu {money(row.collected)}; đã hoàn {money(row.refunded)}; thực thu {money(row.net)}</title>
          <rect className="revenue-hit" x={left+index*step} y={top-8} width={step} height={bottom-top+16} fill={selected===index?'#00796f':'transparent'} fillOpacity={selected===index?0.06:1} rx="5"/>
          <circle cx={center(index)} cy={y(row.net)} r={selected===index?5:3} fill="#6366f1" stroke="white" strokeWidth="1.5"/>
        </g>)}
      </svg>
    </div></div>
    <div className="revenue-inspect" aria-live="polite"><strong>{current.fullLabel}</strong><dl>{[['Đã thu',current.collected],['Đã hoàn',current.refunded],['Thực thu',current.net]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{money(value)}</dd></div>)}</dl></div>
  </section>
}
