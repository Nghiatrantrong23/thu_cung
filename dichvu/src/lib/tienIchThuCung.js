import { toISODate } from './tinhGioTrong.js'

export const SPECIES = ['Chó', 'Mèo'] // Hệ thống chỉ nhận chó và mèo
export const GENDERS = ['Đực', 'Cái']
const OPEN_STATUSES = ['Chờ xác nhận', 'Đã xác nhận', 'Đang thực hiện']

const norm = (s) => String(s ?? '').trim().toLowerCase()

// Chấp nhận dấu phẩy kiểu Việt ("4,2"). Trả về null nếu để trống, NaN nếu không phải số.
export function parseWeight(str) {
  const s = String(str ?? '').trim().replace(',', '.')
  if (s === '') return null
  if (!/^\d+(\.\d+)?$/.test(s)) return NaN
  return Number(s)
}

export function formatWeight(n) {
  if (n == null) return ''
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(n)
}

export function emptyForm() {
  return { name: '', species: '', breed: '', gender: '', birthDate: '', weight: '', healthNote: '' }
}

export function toForm(pet) {
  return {
    name: pet.name,
    species: pet.species,
    breed: pet.breed ?? '',
    gender: pet.gender ?? '',
    birthDate: pet.birthDate ?? '',
    weight: formatWeight(pet.weightKg),
    healthNote: pet.healthNote ?? '',
  }
}

export function formToPet(form) {
  const weight = parseWeight(form.weight)
  return {
    name: form.name.trim(),
    species: form.species,
    breed: form.breed.trim(),
    gender: form.gender,
    birthDate: form.birthDate,
    weightKg: Number.isNaN(weight) ? null : weight,
    healthNote: form.healthNote.trim(),
  }
}

export function validatePet(form, ownerPets, editingId = null, now = new Date()) {
  const e = {}
  const name = form.name.trim()

  if (!name) e.name = 'Vui lòng nhập tên thú cưng.'
  else if (name.length > 50) e.name = 'Tên tối đa 50 ký tự.'
  else if (
    form.species &&
    ownerPets.some((p) => p.id !== editingId && norm(p.name) === norm(name) && p.species === form.species)
  ) {
    e.name = 'Bạn đã có thú cưng cùng tên và loài này.'
  }

  if (!SPECIES.includes(form.species)) e.species = 'Vui lòng chọn loài (chỉ nhận chó và mèo).'

  if (form.birthDate && form.birthDate > toISODate(now)) e.birthDate = 'Ngày sinh không được ở tương lai.'

  const w = parseWeight(form.weight)
  if (Number.isNaN(w) || (w !== null && (w < 0.1 || w > 100))) e.weight = 'Cân nặng phải là số từ 0,1 đến 100 kg.'

  return e
}

// Thú cưng đang có lịch chưa kết thúc thì chưa ngừng theo dõi được.
export function hasOpenAppointment(bookings, owner, petId) {
  return bookings.some((b) => b.owner === owner && b.petId === petId && OPEN_STATUSES.includes(b.status))
}

export function countAppointments(bookings, owner, petId) {
  return bookings.filter((b) => b.owner === owner && b.petId === petId).length
}
