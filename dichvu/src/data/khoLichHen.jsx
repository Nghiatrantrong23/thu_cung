import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './khoXacThuc.jsx'

const BookingContext = createContext(null)

export function BookingProvider({ children }) {
  const { user, apiCall } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Tai danh sach lich hen tu backend API
  const fetchBookings = useCallback(async () => {
    if (!user) {
      setBookings([])
      setInitialized(true)
      return
    }
    setLoading(true)
    try {
      const result = await apiCall('/api/lich-hen')
      if (result.ok) {
        setBookings(result.data.lichHen ?? [])
      } else {
        console.error('[khoLichHen] Lỗi tải lịch hẹn:', result.error)
        setBookings([])
      }
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [user, apiCall])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Goi API tinh khung gio trong: GET /api/lich-hen/khung-gio-trong
  const fetchAvailableSlots = useCallback(
    async (date, duration) => {
      if (!date || !duration || duration <= 0) return { ok: true, slots: [] }
      try {
        const result = await apiCall(`/api/lich-hen/khung-gio-trong?ngay=${date}&thoiLuong=${duration}`)
        if (result.ok) {
          return { ok: true, slots: result.data.slots ?? [], reason: result.data.reason ?? null }
        }
        return { ok: false, slots: [], error: result.error }
      } catch (err) {
        return { ok: false, slots: [], error: 'Lỗi kiểm tra khung giờ' }
      }
    },
    [apiCall],
  )

  // Dat lich truc tuyen: POST /api/lich-hen
  const addBooking = useCallback(
    async (data) => {
      const payload = {
        thuCungId: Number(data.thuCungId || data.petId),
        ngay: data.date,
        gioStart: data.start,
        dichVuIds: data.dichVuIds || [],
        ghiChu: data.note || data.ghiChu || '',
      }

      const result = await apiCall('/api/lich-hen', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (result.ok) {
        const created = result.data.booking || result.data.lichHen
        setBookings((prev) => [created, ...prev])
        return { ok: true, booking: created, message: result.data.message }
      }

      return { ok: false, message: result.error || 'Đặt lịch thất bại.' }
    },
    [apiCall],
  )

  // Huy lich hen: PATCH /api/lich-hen/:id/huy
  const cancelBooking = useCallback(
    async (id) => {
      const result = await apiCall(`/api/lich-hen/${id}/huy`, {
        method: 'PATCH',
      })
      if (result.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: 'Đã hủy', trangThai: 'Đã hủy' } : b)),
        )
        return { ok: true, message: result.data.message }
      }
      return { ok: false, message: result.error || 'Hủy lịch thất bại.' }
    },
    [apiCall],
  )

  // Danh gia lich hen da hoan thanh: POST /api/lich-hen/:id/danh-gia
  const reviewBooking = useCallback(
    async (id, stars, comment) => {
      if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
        return { ok: false, message: 'Vui lòng chọn số sao từ 1 đến 5.' }
      }
      const result = await apiCall(`/api/lich-hen/${id}/danh-gia`, {
        method: 'POST',
        body: JSON.stringify({ stars, comment: comment.trim() }),
      })
      if (result.ok) {
        const review = result.data.review || { stars, comment: comment.trim() }
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, review } : b)))
        return { ok: true, message: result.data.message }
      }
      return { ok: false, message: result.error || 'Gửi đánh giá thất bại.' }
    },
    [apiCall],
  )

  const value = useMemo(
    () => ({
      bookings,
      loading,
      initialized,
      fetchBookings,
      fetchAvailableSlots,
      addBooking,
      cancelBooking,
      reviewBooking,
    }),
    [bookings, loading, initialized, fetchBookings, fetchAvailableSlots, addBooking, cancelBooking, reviewBooking],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBookings() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBookings phải nằm trong BookingProvider')
  return ctx
}
