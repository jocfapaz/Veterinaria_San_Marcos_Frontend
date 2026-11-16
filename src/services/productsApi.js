import { get, post, put, del } from './api.js'
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
  const raw = dto?.data ?? dto?.producto ?? dto
  const d = raw && typeof raw === 'object' ? raw : dto
  return {
    ...d,
    id: d.id ?? d._id ?? d.code ?? d.codigo,
    code: d.code ?? d.codigo ?? '',
    name: d.name ?? d.nombre ?? '',
    category: d.category ?? d.categoria ?? '',
    presentation: d.presentation ?? d.presentacion ?? '',
    description: d.description ?? d.descripcion ?? '',
    stock: d.stock != null ? Number(d.stock) : 0,
    stockCritical: d.stockCritical != null ? Number(d.stockCritical) : (d.stockCritico != null ? Number(d.stockCritico) : 0),
    price,
    discount,
    image: normalizeImagePath(d.image ?? d.imagen ?? d.imageUrl ?? d.imagenUrl ?? ''),
  }
}

function toProductPayload(data = {}) {
  return {
    code: data.code,
    codigo: data.code,
    name: data.name,
    nombre: data.name,
    category: data.category,
    categoria: data.category,
    presentation: data.presentation,
    presentacion: data.presentation,
    description: data.description,
    descripcion: data.description,
    price: Number(data.price) || 0,
    precio: Number(data.price) || 0,
    stock: Number(data.stock) || 0,
    stockCritical: Number(data.stockCritical) || 0,
    stockCritico: Number(data.stockCritical) || 0,
    discount: Number(data.discount) || 0,
    descuento: Number(data.discount) || 0,
    image: data.image,
    imagen: data.image,
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

export async function createProduct(productData) {
  const data = await post('/productos', toProductPayload(productData))
  return data ? mapProduct(data) : null
}

export async function updateProduct(id, productData) {
  const data = await put(`/productos/${id}`, toProductPayload(productData))
  return data ? mapProduct(data) : null
}

export async function deleteProduct(id) {
  return del(`/productos/${id}`)
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
