import test from 'node:test'
import assert from 'node:assert/strict'
import {staffNavigation} from '../src/lib/staffNavigation.js'
import {statusPresentation} from '../src/lib/statusPresentation.js'

test('care menu exposes only home and assigned care, no financial or dispatch links',()=>{
  assert.deepEqual(staffNavigation('care').map(x=>x.path),['/nhan-vien','/nhan-vien/lich-lam-viec'])
})
test('reception cannot see management or account administration',()=>{
  const paths=staffNavigation('reception').map(x=>x.path)
  assert.equal(paths.length,5)
  assert.ok(paths.includes('/le-tan/khieu-nai'))
  assert.ok(paths.every(x=>x.startsWith('/le-tan')))
})
test('manager and admin keep their distinct menus without care actions',()=>{
  const manager=staffNavigation('manager').map(x=>x.path),admin=staffNavigation('admin').map(x=>x.path)
  assert.ok(manager.includes('/quan-ly/ca-lam-viec'))
  assert.ok(!manager.includes('/admin/tai-khoan'))
  assert.ok(admin.includes('/admin/tai-khoan'))
  assert.ok(!admin.some(x=>x.startsWith('/nhan-vien')))
})
test('customer and unknown roles get no staff menu',()=>{
  assert.deepEqual(staffNavigation('customer'),[])
  assert.deepEqual(staffNavigation('other'),[])
  assert.deepEqual(staffNavigation('__proto__'),[])
})
test('refund approval, partial refund and payment completion remain distinct',()=>{
  assert.equal(statusPresentation('complaint','ChoHoanTien').label,'Đã duyệt, chờ thực chi')
  assert.equal(statusPresentation('invoice','HoanTienMotPhan').label,'Hoàn tiền một phần')
  assert.notEqual(statusPresentation('invoice','ThanhToanMotPhan').tone,'emerald')
})
test('unknown status does not become success or a different domain status',()=>{
  assert.deepEqual(statusPresentation('invoice','HoanThanh'),{label:'HoanThanh',tone:'slate'})
  assert.deepEqual(statusPresentation('future','NewStatus'),{label:'NewStatus',tone:'slate'})
})
