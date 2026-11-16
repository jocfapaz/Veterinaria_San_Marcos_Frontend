import { get, post, put, del } from './api.js'
import { normalizeImagePath } from '../utils/imageUrl.js'

function toArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.servicios)) return data.servicios
  return []
}

function mapService(dto = {}) {
  const raw = dto?.data ?? dto?.servicio ?? dto
  const d = raw && typeof raw === 'object' ? raw : dto
  return {
    ...d,
    id: d.id ?? d._id ?? d.code ?? d.codigo,
    code: d.code ?? d.codigo ?? '',
    name: d.name ?? d.nombre ?? '',
    category: d.category ?? d.categoria ?? '',
    species: d.species ?? d.especie ?? d.especies ?? '',
    duration: d.duration ?? d.duracion ?? '',
    description: d.description ?? d.descripcion ?? '',
    note: d.note ?? d.nota ?? d.observaciones ?? '',
    price: Number(d.price ?? d.precio ?? 0) || 0,
    image: normalizeImagePath(d.image ?? d.imagen ?? d.imageUrl ?? d.imagenUrl ?? ''),
  }
}

function toServicePayload(data = {}) {
  return {
    code: data.code,
    codigo: data.code,
    name: data.name,
    nombre: data.name,
    description: data.description,
    descripcion: data.description,
    category: data.category,
    categoria: data.category,
    species: data.species,
    especie: data.species,
    duration: data.duration,
    duracion: data.duration,
    price: Number(data.price) || 0,
    precio: Number(data.price) || 0,
    note: data.note,
    nota: data.note,
    observaciones: data.note,
    image: data.image,
    imagen: data.image,
  }
}

export async function listServices() {
  const data = await get('/servicios')
  return toArray(data).map(mapService)
}

export async function listServicesByCategory(category) {
  if (!category || category === 'Todas') return listServices()
  try {
    const data = await get(`/servicios?categoria=${encodeURIComponent(category)}`)
    return toArray(data).map(mapService)
  } catch {
    const all = await listServices()
    return all.filter((s) => s.category === category)
  }
}

export async function getServiceById(id) {
  const data = await get(`/servicios/${id}`)
  const raw = data?.data ?? data?.servicio ?? data
  return raw ? mapService(raw) : null
}

export async function createService(serviceData) {
  const data = await post('/servicios', toServicePayload(serviceData))
  return data ? mapService(data) : null
}

export async function updateService(id, serviceData) {
  const data = await put(`/servicios/${id}`, toServicePayload(serviceData))
  return data ? mapService(data) : null
}

export async function deleteService(id) {
  return del(`/servicios/${id}`)
}
