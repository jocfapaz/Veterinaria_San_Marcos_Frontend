import { get } from './api.js'
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
  return {
    ...dto,
    id: dto.id ?? dto._id ?? dto.code ?? dto.codigo,
    name: dto.name ?? dto.nombre ?? '',
    category: dto.category ?? dto.categoria ?? '',
    species: dto.species ?? dto.especie ?? dto.especies ?? '',
    duration: dto.duration ?? dto.duracion ?? '',
    description: dto.description ?? dto.descripcion ?? '',
    note: dto.note ?? dto.nota ?? dto.observaciones ?? '',
    price: Number(dto.price ?? dto.precio ?? 0) || 0,
    image: normalizeImagePath(dto.image ?? dto.imagen ?? dto.imageUrl ?? dto.imagenUrl ?? ''),
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
