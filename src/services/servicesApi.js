import { get, post, put, patch, del } from './api.js'
import { normalizeImagePath } from '../utils/imageUrl.js'

function toArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.servicios)) return data.servicios
  return []
}

export function mapService(dto = {}) {
  const raw = dto?.data ?? dto?.servicio ?? dto
  const d = raw && typeof raw === 'object' ? raw : dto
  return {
    ...d,
    id: d.id ?? d._id,
    code: d.codigo ?? d.code ?? '',
    name: d.nombre ?? d.name ?? '',
    description: d.descripcion ?? d.description ?? '',
    species: d.especie ?? d.species ?? d.especies ?? '',
    duration: d.duracion ?? d.duration ?? '',
    note: d.nota ?? d.note ?? d.observaciones ?? '',
    price: Number(d.precio ?? d.price ?? 0) || 0,
    image: normalizeImagePath(d.imagen ?? d.image ?? ''),
    categoryId: d.categoriaId ?? d.categoryId ?? null,
    category: d.categoriaNombre ?? d.category ?? d.categoria ?? '',
    active: d.activo ?? d.active ?? true,
  }
}

function toAdminServicePayload(data = {}) {
  return {
    nombre: data.name || '',
    descripcion: data.description || '',
    especie: data.species || '',
    duracion: data.duration || '',
    precio: Number(data.price) || 0,
    imagen: data.image || '',
    nota: data.note || '',
    categoriaId: Number(data.categoryId) || null,
  }
}

// ── Endpoints públicos ──

export async function listServices() {
  const data = await get('/services')
  return toArray(data).map(mapService)
}

export async function listServicesByCategory(category) {
  if (!category || category === 'Todas') return listServices()
  if (/^\d+$/.test(String(category))) {
    const data = await get(`/services?categoryId=${category}`)
    return toArray(data).map(mapService)
  }
  const all = await listServices()
  return all.filter((s) => s.category === category)
}

export async function getServiceById(id) {
  const data = await get(`/services/${id}`)
  const raw = data?.data ?? data?.servicio ?? data
  return raw ? mapService(raw) : null
}

// ── Categorías ──

export async function listCategories(type) {
  const params = type ? `?type=${encodeURIComponent(type)}` : ''
  const data = await get(`/categories${params}`)
  return toArray(data).map((c) => ({
    id: c.id,
    name: c.nombre ?? c.name ?? '',
    type: c.tipo ?? c.type ?? '',
    description: c.descripcion ?? c.description ?? '',
  }))
}

export async function listServiceCategories() {
  const cats = await listCategories('SERVICIO')
  return cats.map((c) => c.name)
}

// ── Endpoints de admin ──

export async function listAdminServices() {
  const data = await get('/admin/services')
  return toArray(data).map(mapService)
}

export async function getAdminServiceById(id) {
  const data = await get(`/admin/services/${id}`)
  const raw = data?.data ?? data?.servicio ?? data
  return raw ? mapService(raw) : null
}

export async function createService(serviceData) {
  const data = await post('/admin/services', toAdminServicePayload(serviceData))
  return data ? mapService(data) : null
}

export async function updateService(id, serviceData) {
  const data = await put(`/admin/services/${id}`, toAdminServicePayload(serviceData))
  return data ? mapService(data) : null
}

export async function deleteService(id) {
  return del(`/admin/services/${id}`)
}

export async function toggleService(id) {
  const data = await patch(`/admin/services/${id}/toggle`)
  return data ? mapService(data) : null
}
