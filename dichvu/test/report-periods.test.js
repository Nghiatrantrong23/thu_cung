import test from 'node:test'
import assert from 'node:assert/strict'
import {reportPeriod,revenueBuckets} from '../src/lib/reportPeriods.js'

test('report selectors resolve day, month, quarter and year with inclusive calendar bounds',()=>{
  assert.deepEqual(reportPeriod({mode:'day',day:'2026-10-25'}),{from:'2026-10-25',to:'2026-10-25',unit:'day',title:'Ngày 25/10/2026'})
  assert.equal(reportPeriod({mode:'month',month:'2024-02'}).to,'2024-02-29')
  assert.equal(reportPeriod({mode:'month',month:'2026-02'}).to,'2026-02-28')
  assert.deepEqual(reportPeriod({mode:'quarter',year:'2026',quarter:'4'}),{from:'2026-10-01',to:'2026-12-31',unit:'month',title:'Quý 4/2026'})
  assert.equal(reportPeriod({mode:'year',year:2024}).from,'2024-01-01')
  assert.equal(reportPeriod({mode:'year',year:2024}).to,'2024-12-31')
})
test('invalid dates and oversized custom periods never normalize silently',()=>{
  for(const params of [{mode:'day',day:'2026-02-29'},{mode:'month',month:'2026-13'},{mode:'quarter',year:'2026',quarter:5},{mode:'year',year:''},{mode:'custom',from:'2026-02-10',to:'2026-02-01'},{mode:'custom',from:'2024-01-01',to:'2025-01-01'}])assert.throws(()=>reportPeriod(params))
  assert.equal(reportPeriod({mode:'custom',from:'2024-01-01',to:'2024-12-31'}).unit,'month')
})
test('daily chart includes zero days and uses exact currency sums rather than a supplied net field',()=>{
  const rows=revenueBuckets([{date:'2026-10-25',collected:0.1,refunded:0.2,net:999}], '2026-10-24','2026-10-26','day')
  assert.equal(rows.length,3)
  assert.equal(rows[0].collected,0)
  assert.equal(rows[1].net,-0.1)
  assert.equal(rows[2].refunded,0)
  assert.equal(rows[1].label,'25/10')
})
test('quarter and year charts group all daily movements once and keep empty months',()=>{
  const daily=[{date:'2026-10-01',collected:45000,refunded:0},{date:'2026-10-31',collected:105000,refunded:50000},{date:'2026-11-10',collected:200000,refunded:300000},{date:'2027-01-01',collected:999999,refunded:0}]
  const quarter=revenueBuckets(daily,'2026-10-01','2026-12-31','month')
  assert.equal(quarter.length,3)
  assert.deepEqual(quarter.map(row=>[row.collected,row.refunded,row.net]),[[150000,50000,100000],[200000,300000,-100000],[0,0,0]])
  const year=revenueBuckets(daily,'2026-01-01','2026-12-31','month')
  assert.equal(year.length,12)
  assert.equal(year.reduce((sum,row)=>sum+row.collected,0),350000)
  assert.equal(year.reduce((sum,row)=>sum+row.net,0),0)
})
test('leap days and cross-year custom buckets do not depend on OS timezone',()=>{
  const original=process.env.TZ
  try {
    const values=[]
    for(const timezone of ['America/Los_Angeles','Asia/Ho_Chi_Minh']) {
      process.env.TZ=timezone
      values.push(revenueBuckets([{date:'2024-02-29',collected:'100.20',refunded:'0.10'}],'2024-02-01','2024-02-29','day'))
    }
    assert.deepEqual(values[0],values[1]);assert.equal(values[0].length,29);assert.equal(values[0][28].net,100.1)
    assert.equal(revenueBuckets([],'2025-12-20','2026-01-10','month').length,2)
  } finally {if(original===undefined)delete process.env.TZ;else process.env.TZ=original}
})
test('empty chart is real zeros and malformed money is rejected',()=>{
  assert.ok(revenueBuckets([],'2026-01-01','2026-12-31','month').every(row=>row.collected===0&&row.refunded===0&&row.net===0))
  assert.throws(()=>revenueBuckets([{date:'2026-10-25',collected:-1,refunded:0}],'2026-10-25','2026-10-25','day'))
  assert.throws(()=>revenueBuckets([{date:'2026-10-25',collected:NaN,refunded:0}],'2026-10-25','2026-10-25','day'))
})
