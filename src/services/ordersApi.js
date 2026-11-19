import { get, post, patch } from './api.js'

function toArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.detalles)) return data.detalles
  if (Array.isArray(data?.lineas)) return data.lineas
  return []
}

function toOrderArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.ordenes)) return data.ordenes
  if (Array.isArray(data?.orders)) return data.orders
  if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    if (Array.isArray(data.data.content)) return data.data.content
    if (Array.isArray(data.data.ordenes)) return data.data.ordenes
  }
  return []
}

function mapOrderItem(dto = {}, fallback = {}) {
  const d = dto?.producto ?? dto?.product ?? dto
  const quantity = Number(dto.quantity ?? dto.cantidad ?? fallback.quantity ?? 0) || 0
  const price = Number(dto.price ?? dto.precio ?? dto.precioUnitario ?? d?.price ?? d?.precio ?? fallback.price ?? 0) || 0
  const discount = Number(dto.discount ?? dto.descuento ?? d?.discount ?? d?.descuento ?? fallback.discount ?? 0) || 0
  const subtotalRaw = dto.subtotal ?? dto.totalLinea ?? dto.total
  const subtotal = subtotalRaw != null ? Number(subtotalRaw) || 0 : Math.round(price * (1 - discount / 100)) * quantity
  return {
    productId: dto.productId ?? dto.productoId ?? d?.id ?? fallback.productId,
    name: dto.name ?? dto.nombre ?? d?.name ?? d?.nombre ?? fallback.name ?? 'Producto',
    price,
    discount,
    quantity,
    subtotal,
    image: dto.image ?? dto.imagen ?? d?.image ?? d?.imagen ?? fallback.image ?? '',
  }
}

export function mapOrder(dto = {}, extra = {}) {
  const raw = dto?.data ?? dto?.orden ?? dto?.order ?? dto
  const d = raw && typeof raw === 'object' ? raw : {}
  const fallbackItems = Array.isArray(extra.items) ? extra.items : []
  const items = toArray(d).length ? toArray(d).map((it, i) => mapOrderItem(it, fallbackItems[i] || {})) : fallbackItems
  const totalRaw = d.total ?? d.montoTotal ?? d.totalAmount ?? extra.total
  const createdAt = d.createdAt ?? d.fechaCreacion ?? d.fecha ?? d.fechaPedido ?? extra.createdAt ?? new Date().toISOString()
  return {
    id: d.id ?? d._id ?? extra.id ?? null,
    orderNumber: d.orderNumber ?? d.numeroOrden ?? d.numero ?? d.codigo ?? d.id ?? extra.orderNumber ?? null,
    status: String(d.status ?? d.estado ?? extra.status ?? 'paid').toLowerCase(),
    total: totalRaw != null ? Number(totalRaw) || 0 : items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0),
    items,
    shippingAddress: d.shippingAddress ?? d.direccionEnvio ?? d.direccion ?? extra.shippingAddress ?? '',
    instructions: d.instructions ?? d.instrucciones ?? d.indicaciones ?? extra.instructions ?? '',
    customer: d.customer ?? d.cliente ?? extra.customer ?? null,
    // El backend serializa el enum como ENVIO/RETIRO; la UI trabaja en minúsculas.
    deliveryType: String(d.deliveryType ?? d.tipoEntrega ?? extra.deliveryType ?? 'envio').toLowerCase(),
    createdAt,
  }
}

export async function listMyOrders() {
  const data = await get('/orders/me')
  return toOrderArray(data).map((o) => mapOrder(o))
}

export async function listOrders() {
  const data = await get('/orders')
  return toOrderArray(data).map((o) => mapOrder(o))
}

export async function getOrderById(id) {
  const data = await get(`/orders/${id}`)
  const raw = data?.data ?? data?.orden ?? data?.order ?? data
  if (!raw || (typeof raw === 'object' && !raw.id && !raw._id && !raw.numeroOrden && !raw.orderNumber && !Array.isArray(raw.items) && !Array.isArray(raw.detalles))) {
    return null
  }
  return mapOrder(raw)
}

// El enum del backend está en español (PAGADA, EN_PREPARACION, ...).
// Aceptamos tanto los valores de la UI en minúsculas como los alias antiguos
// en inglés para que cualquier llamador envíe siempre un enum válido.
const ORDER_STATUS_TO_BACKEND = {
  paid: 'PAGADA',
  pagada: 'PAGADA',
  processing: 'EN_PREPARACION',
  en_preparacion: 'EN_PREPARACION',
  shipped: 'ENVIADA',
  enviada: 'ENVIADA',
  delivered: 'ENTREGADA',
  entregada: 'ENTREGADA',
  cancelled: 'CANCELADA',
  cancelada: 'CANCELADA',
}

export async function updateOrderStatus(id, status) {
  const key = String(status).toLowerCase()
  const estado = ORDER_STATUS_TO_BACKEND[key] || key.toUpperCase()
  const data = await patch(`/orders/${id}/status`, { estado })
  const raw = data?.data ?? data?.orden ?? data?.order ?? data
  return raw ? mapOrder(raw) : { id, status }
}

export async function createOrder(orderData) {
  const items = (orderData.items || []).map((it) => ({
    productoId: it.productId,
    cantidad: it.quantity,
  }))
  const customer = orderData.customer || {}
  const payload = {
    direccionEnvio: orderData.shippingAddress,
    // TipoEntrega del backend es un enum: ENVIO / RETIRO (case-sensitive).
    tipoEntrega: String(orderData.deliveryType || 'envio').toUpperCase(),
    instrucciones: orderData.instructions || '',
    contactoNombre: customer.firstName || '',
    contactoApellido: customer.lastName || '',
    contactoEmail: customer.email || '',
    contactoTelefono: customer.phone || '',
    items,
  }
  const data = await post('/orders', payload)
  return mapOrder(data, {
    items: orderData.displayItems,
    shippingAddress: orderData.shippingAddress,
    instructions: orderData.instructions,
    customer: orderData.customer,
    deliveryType: orderData.deliveryType,
  })
}

export function isStockInsufficientError(error) {
  const msg = String(error?.message || '').toLowerCase()
  const status = error?.status || error?.response?.status
  if (status === 409 || status === 422) return true
  return /stock|insuficient|disponib|agotad/.test(msg)
}
