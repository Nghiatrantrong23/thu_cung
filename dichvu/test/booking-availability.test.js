import test from 'node:test'
import assert from 'node:assert/strict'
import {availabilityMessage} from '../src/lib/bookingAvailability.js'
test('unconfigured care shifts are explained separately from capacity and transport errors',()=>{
  assert.match(availabilityMessage({reason:'NO_SHIFTS',duration:90}),/chưa có ca/)
  assert.match(availabilityMessage({reason:'NO_CAPACITY',duration:90}),/90 phút/)
  assert.match(availabilityMessage({reason:'PAST_DATE',duration:90}),/đã qua/)
  const error=availabilityMessage({error:'Phiên hết hạn',reason:'NO_SHIFTS',duration:90})
  assert.match(error,/Phiên hết hạn/);assert.doesNotMatch(error,/chưa có ca/)
})
