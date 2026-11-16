import { get, post, put, patch, del } from './api.js'
import { normalizeImagePath } from '../utils/imageUrl.js'

function toArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.productos)) return data.productos
  return []
}

export function mapProduct(dto = {}) {
  const raw = dto?.data ?? dto?.producto ?? dto
  const d = raw && typeof raw === 'object' ? raw : dto
  const discount = Number(d.descuento ?? d.discount ?? 0) || 0
  const price = Number(d.precio ?? d.price ?? 0) || 0
  const finalPrice = d.precioFinal != null ? Number(d.precioFinal) : null
  return {
    ...d,
    id: d.id ?? d._id,
    code: d.codigo ?? d.code ?? '',
    name: d.nombre ?? d.name ?? '',
    description: d.descripcion ?? d.description ?? '',
    presentation: d.presentacion ?? d.presentation ?? '',
    price,
    discount,
    finalPrice,
    stock: d.stock != null ? Number(d.stock) : 0,
    stockCritical:
      d.stockCritico != null
        ? Number(d.stockCritico)
        : d.stockCritical != null
          ? Number(d.stockCritical)
          : 0,
    image: normalizeImagePath(d.imagen ?? d.image ?? ''),
    categoryId: d.categoriaId ?? d.categoryId ?? null,
    category: d.categoriaNombre ?? d.category ?? d.categoria ?? '',
    active: d.activo ?? d.active ?? true,
  }
}

function toAdminProductPayload(data = {}) {
  return {
    nombre: data.name || '',
    descripcion: data.description || '',
    presentacion: data.presentation || '',
    precio: Number(data.price) || 0,
    descuento: Number(data.discount) || 0,
    stock: Number(data.stock) || 0,
    stockCritico: Number(data.stockCritical) || 0,
    imagen: data.image || '',
    categoriaId: Number(data.categoryId) || null,
  }
}

// ── Endpoints públicos ──

export async function listProducts() {
  const data = await get('/products')
  return toArray(data).map(mapProduct)
}

export async function listProductsByCategory(category) {
  if (!category || category === 'Todas') return listProducts()
  if (/^\d+$/.test(String(category))) {
    const data = await get(`/products?categoryId=${category}`)
    return toArray(data).map(mapProduct)
  }
  const all = await listProducts()
  return all.filter((p) => p.category === category)
}

export async function listProductOffers() {
  const data = await get('/products?onSale=true')
  return toArray(data).map(mapProduct)
}

export async function getProductById(id) {
  const data = await get(`/products/${id}`)
  const raw = data?.data ?? data?.producto ?? data
  return raw ? mapProduct(raw) : null
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

export async function listProductCategories() {
  const cats = await listCategories('PRODUCTO')
  return cats.map((c) => c.name)
}

// ── Endpoints de admin ──

export async function listAdminProducts() {
  const data = await get('/admin/products')
  return toArray(data).map(mapProduct)
}

export async function getAdminProductById(id) {
  const data = await get(`/admin/products/${id}`)
  const raw = data?.data ?? data?.producto ?? data
  return raw ? mapProduct(raw) : null
}

export async function createProduct(productData) {
  const data = await post('/admin/products', toAdminProductPayload(productData))
  return data ? mapProduct(data) : null
}

export async function updateProduct(id, productData) {
  const data = await put(`/admin/products/${id}`, toAdminProductPayload(productData))
  return data ? mapProduct(data) : null
}

export async function deleteProduct(id) {
  return del(`/admin/products/${id}`)
}

export async function toggleProduct(id) {
  const data = await patch(`/admin/products/${id}/toggle`)
  return data ? mapProduct(data) : null
}
