const iso=date=>date.toISOString().slice(0,10)
function validDay(value) {
  return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&iso(new Date(value+'T00:00:00Z'))===value
}
function yearValue(value) {
  const year=Number(value)
  if(!/^\d{4}$/.test(String(value))||!Number.isInteger(year)||year<1900||year>9999)throw new Error('Nhập năm từ 1900 đến 9999.')
  return year
}
const first=(year,month)=>`${year}-${String(month).padStart(2,'0')}-01`
const last=(year,month)=>iso(new Date(Date.UTC(year,month,0)))
export function reportPeriod({mode,day,month,year,quarter,from,to}) {
  if(mode==='day') {
    if(!validDay(day))throw new Error('Chọn ngày báo cáo hợp lệ.')
    return {from:day,to:day,unit:'day',title:`Ngày ${day.slice(8)}/${day.slice(5,7)}/${day.slice(0,4)}`}
  }
  if(mode==='month') {
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month||''))throw new Error('Chọn tháng báo cáo hợp lệ.')
    const y=yearValue(month.slice(0,4)),m=Number(month.slice(5))
    return {from:first(y,m),to:last(y,m),unit:'day',title:`Tháng ${String(m).padStart(2,'0')}/${y}`}
  }
  if(mode==='quarter') {
    const y=yearValue(year),q=Number(quarter)
    if(![1,2,3,4].includes(q))throw new Error('Chọn quý từ 1 đến 4.')
    return {from:first(y,(q-1)*3+1),to:last(y,q*3),unit:'month',title:`Quý ${q}/${y}`}
  }
  if(mode==='year') {
    const y=yearValue(year)
    return {from:first(y,1),to:last(y,12),unit:'month',title:`Năm ${y}`}
  }
  if(mode!=='custom'||!validDay(from)||!validDay(to)||from>to)throw new Error('Ngày bắt đầu phải hợp lệ và không sau ngày kết thúc.')
  const span=(Date.parse(to+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/86400000
  if(span>365)throw new Error('Mỗi báo cáo tối đa 366 ngày.')
  return {from,to,unit:span>62?'month':'day',title:'Khoảng ngày tùy chọn'}
}
function cents(value) {
  const amount=Number(value)
  if(!Number.isFinite(amount)||amount<0||!Number.isSafeInteger(Math.round(amount*100)))throw new Error('Số tiền báo cáo không hợp lệ.')
  return Math.round(amount*100)
}
export function revenueBuckets(daily,from,to,unit) {
  reportPeriod({mode:'custom',from,to})
  if(!['day','month'].includes(unit))throw new Error('Đơn vị biểu đồ không hợp lệ.')
  const buckets=new Map()
  for(let cursor=new Date(from+'T00:00:00Z');iso(cursor)<=to;cursor.setUTCDate(cursor.getUTCDate()+1)) {
    const date=iso(cursor),key=unit==='month'?date.slice(0,7):date
    if(!buckets.has(key))buckets.set(key,{key,label:unit==='month'?`${key.slice(5)}/${key.slice(0,4)}`:`${date.slice(8)}/${date.slice(5,7)}`,fullLabel:unit==='month'?`Tháng ${key.slice(5)}/${key.slice(0,4)}`:`Ngày ${date.slice(8)}/${date.slice(5,7)}/${date.slice(0,4)}`,collected:0,refunded:0})
  }
  for(const row of daily) {
    if(!validDay(row.date)||row.date<from||row.date>to)continue
    const key=unit==='month'?row.date.slice(0,7):row.date,bucket=buckets.get(key)
    bucket.collected+=cents(row.collected);bucket.refunded+=cents(row.refunded)
    if(!Number.isSafeInteger(bucket.collected)||!Number.isSafeInteger(bucket.refunded))throw new Error('Tổng báo cáo vượt giới hạn.')
  }
  return [...buckets.values()].map(row=>({...row,collected:row.collected/100,refunded:row.refunded/100,net:(row.collected-row.refunded)/100}))
}
