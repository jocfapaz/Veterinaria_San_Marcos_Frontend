import { get } from './api.js'
import { normalizeImagePath } from '../utils/imageUrl.js'

function toArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.productos)) return data.productos
  return []
}

function mapProduct(dto = {}) {
  const discount = Number(dto.discount ?? dto.descuento ?? 0) || 0
  const price = Number(dto.price ?? dto.precio ?? 0) || 0
  return {
    ...dto,
    id: dto.id ?? dto._id ?? dto.code ?? dto.codigo,
    name: dto.name ?? dto.nombre ?? '',
    category: dto.category ?? dto.categoria ?? '',
    presentation: dto.presentation ?? dto.presentacion ?? '',
    description: dto.description ?? dto.descripcion ?? '',
    price,
    discount,
    image: normalizeImagePath(dto.image ?? dto.imagen ?? dto.imageUrl ?? dto.imagenUrl ?? ''),
  }
}

export async function listProducts() {
  const data = await get('/productos')
  return toArray(data).map(mapProduct)
}

export async function listProductsByCategory(category) {
  if (!category || category === 'Todas') return listProducts()
  try {
    const data = await get(`/productos?categoria=${encodeURIComponent(category)}`)
    return toArray(data).map(mapProduct)
  } catch {
    const all = await listProducts()
    return all.filter((p) => p.category === category)
  }
}

export async function listProductOffers() {
  try {
    const data = await get('/productos/ofertas')
    return toArray(data).map(mapProduct)
  } catch {
    const all = await listProducts()
    return all.filter((p) => (Number(p.discount) || 0) > 0)
  }
}

export async function getProductById(id) {
  const data = await get(`/productos/${id}`)
  const raw = data?.data ?? data?.producto ?? data
  return raw ? mapProduct(raw) : null
}

export async function listProductCategories() {
  try {
    const data = await get('/productos/categorias')
    const list = toArray(data)
    if (list.length && typeof list[0] === 'string') return list
    return list.map((c) => c?.name ?? c?.nombre ?? c?.category ?? c?.categoria).filter(Boolean)
  } catch {
    const all = await listProducts()
    return [...new Set(all.map((p) => p.category).filter(Boolean))]
  }
}
