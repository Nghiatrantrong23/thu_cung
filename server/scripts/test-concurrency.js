import dotenv from 'dotenv'
dotenv.config()

async function testConcurrency() {
  console.log('Testing concurrency and 409 Conflict handling...')

  // 1. Login nguyenan
  const loginRes = await fetch('http://localhost:5000/api/auth/dang-nhap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenDangNhap: 'nguyenan', matKhau: '12345678' })
  })
  const { accessToken } = await loginRes.json()

  // 2. Lay khung gio trong ngay 2026-10-25 cho dich vu Spa (120 phut)
  const slotRes = await fetch('http://localhost:5000/api/lich-hen/khung-gio-trong?ngay=2026-10-25&thoiLuong=120', {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const { slots } = await slotRes.json()
  console.log('Available slots on 2026-10-25:', slots.slice(0, 5))

  if (slots.length === 0) {
    console.log('No slots available to test')
    return
  }

  const targetSlot = slots[0] // e.g. 08:00
  console.log(`Targeting slot ${targetSlot} on 2026-10-25 (CAPACITY = 2)...`)

  // CAPACITY = 2. Neu gui 3 request dong thoi vao cung 1 slot:
  // Request 1: thanh cong (201)
  // Request 2: thanh cong (201)
  // Request 3: bi chan boi 409 Conflict!
  const sendBooking = (idx) =>
    fetch('http://localhost:5000/api/lich-hen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        thuCungId: 1, // Bé Miu Miu
        ngay: '2026-10-25',
        gioStart: targetSlot,
        dichVuIds: [3], // Spa thư giãn 120 phút
        ghiChu: `Concurrent test ${idx}`
      })
    }).then(async (res) => ({
      idx,
      status: res.status,
      body: await res.json()
    }))

  console.log('Sending 3 concurrent booking requests...')
  const results = await Promise.all([sendBooking(1), sendBooking(2), sendBooking(3)])

  results.forEach((r) => {
    console.log(`Request #${r.idx}: Status ${r.status} ->`, r.body.message || r.body.error)
  })

  const successCount = results.filter((r) => r.status === 201).length
  const conflictCount = results.filter((r) => r.status === 409).length

  console.log(`\nResults: ${successCount} Success (201), ${conflictCount} Conflict (409)`)
  if (successCount === 2 && conflictCount === 1) {
    console.log('>>> ACCEPTANCE CRITERIA PASSED: Anti-double-booking & concurrency constraint working perfectly! <<<')
  } else {
    console.log('>>> Result summary:', { successCount, conflictCount })
  }
}

testConcurrency().catch(console.error)
