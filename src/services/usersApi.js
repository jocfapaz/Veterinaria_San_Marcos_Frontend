import { get, post, put, del } from './api.js'

const ROLE_MAP = {
  ADMIN: 'admin',
  VENDEDOR: 'vendedor',
  VETERINARIO: 'veterinario',
  CLIENTE: 'client',
}

const ROLE_TO_BACKEND = {
  admin: 'ADMIN',
  vendedor: 'VENDEDOR',
  veterinario: 'VETERINARIO',
  client: 'CLIENTE',
}

function toArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.usuarios)) return data.usuarios
  return []
}

export function mapUser(dto = {}) {
  const raw = dto?.data ?? dto?.usuario ?? dto
  const d = raw && typeof raw === 'object' ? raw : dto

  const roleKey = (d.rol || 'CLIENTE').toUpperCase()

  return {
    id: d.id ?? d._id,
    run: d.run || '',
    email: d.email || '',
    firstName: d.nombre || '',
    lastName: d.apellido || '',
    role: ROLE_MAP[roleKey] || 'client',
    birthDate: d.fechaNacimiento || '',
    phone: d.telefono || '',
    address: d.direccion || '',
    region: d.region || '',
    commune: d.comuna || '',
    active: d.activo ?? true,
  }
}

function toUserPayload(data = {}) {
  const payload = {
    run: data.run || undefined,
    email: data.email || undefined,
    nombre: data.firstName || undefined,
    apellido: data.lastName || undefined,
    rol: ROLE_TO_BACKEND[data.role] || 'CLIENTE',
    fechaNacimiento: data.birthDate || null,
    telefono: data.phone || undefined,
    direccion: data.address || undefined,
    region: data.region || undefined,
    comuna: data.commune || undefined,
  }

  if (data.password && data.password.trim()) {
    payload.password = data.password
  }

  return payload
}

export async function listUsers() {
  const data = await get('/users')
  // El backend hace soft delete (activo=false) pero sigue devolviendo esos
  // usuarios en GET /users. No los mostramos para que "Eliminar" tenga efecto.
  return toArray(data).map(mapUser).filter((user) => user.active !== false)
}

export async function getUserById(id) {
  const data = await get(`/users/${id}`)
  return data ? mapUser(data) : null
}

export async function createUser(userData) {
  const data = await post('/users', toUserPayload(userData))
  return data ? mapUser(data) : null
}

export async function updateUser(id, userData) {
  const data = await put(`/users/${id}`, toUserPayload(userData))
  return data ? mapUser(data) : null
}

export async function deleteUser(id) {
  return del(`/users/${id}`)
}
