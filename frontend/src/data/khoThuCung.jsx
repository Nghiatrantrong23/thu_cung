import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './khoXacThuc.jsx'

const PetContext = createContext(null)

export function PetProvider({ children }) {
  const { user, apiCall } = useAuth()
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const activePets = useMemo(() => pets.filter((p) => p.active), [pets])

  // Tai danh sach thu cung khi dang nhap
  const fetchPets = useCallback(async () => {
    if (!user) {
      setPets([])
      setInitialized(true)
      return
    }
    setLoading(true)
    try {
      const result = await apiCall('/api/thu-cung')
      if (result.ok) {
        setPets(result.data.pets ?? [])
      } else {
        console.error('[khoThuCung] Lỗi tải thú cưng:', result.error)
        setPets([])
      }
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [user, apiCall])

  useEffect(() => {
    fetchPets()
  }, [fetchPets])

  // Them thu cung moi: POST /api/thu-cung
  const addPet = useCallback(
    async (data) => {
      const result = await apiCall('/api/thu-cung', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (result.ok) {
        setPets((prev) => [...prev, result.data.pet])
        return { ok: true, pet: result.data.pet, message: result.data.message }
      }
      return { ok: false, error: result.error }
    },
    [apiCall],
  )

  // Cap nhat thu cung: PUT /api/thu-cung/:id
  const updatePet = useCallback(
    async (id, data) => {
      const result = await apiCall(`/api/thu-cung/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      if (result.ok) {
        setPets((prev) => prev.map((p) => (p.id === id ? result.data.pet : p)))
        return { ok: true, pet: result.data.pet, message: result.data.message }
      }
      return { ok: false, error: result.error }
    },
    [apiCall],
  )

  // Doi trang thai: PATCH /api/thu-cung/:id/trang-thai
  const setActive = useCallback(
    async (id, active) => {
      const result = await apiCall(`/api/thu-cung/${id}/trang-thai`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      })
      if (result.ok) {
        setPets((prev) => prev.map((p) => (p.id === id ? result.data.pet : p)))
        return { ok: true, pet: result.data.pet, message: result.data.message }
      }
      return { ok: false, error: result.error }
    },
    [apiCall],
  )

  const value = useMemo(
    () => ({ pets, activePets, loading, initialized, addPet, updatePet, setActive, fetchPets }),
    [pets, activePets, loading, initialized, addPet, updatePet, setActive, fetchPets],
  )
  return <PetContext.Provider value={value}>{children}</PetContext.Provider>
}

export function usePets() {
  const ctx = useContext(PetContext)
  if (!ctx) throw new Error('usePets phải nằm trong PetProvider')
  return ctx
}

