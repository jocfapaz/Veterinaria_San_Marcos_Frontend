import { post } from './api.js'

function toArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.detalles)) return data.detalles
  if (Array.isArray(data?.lineas)) return data.lineas
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
  return {
    id: d.id ?? d._id ?? extra.id ?? null,
    orderNumber: d.orderNumber ?? d.numeroOrden ?? d.numero ?? d.codigo ?? d.id ?? extra.orderNumber ?? null,
    status: String(d.status ?? d.estado ?? extra.status ?? 'paid').toLowerCase(),
    total: totalRaw != null ? Number(totalRaw) || 0 : items.reduce((s, it) => s + (Number(it.subtotal) || 0), 0),
    items,
    shippingAddress: d.shippingAddress ?? d.direccionEnvio ?? d.direccion ?? extra.shippingAddress ?? '',
    instructions: d.instructions ?? d.instrucciones ?? extra.instructions ?? '',
    customer: d.customer ?? d.cliente ?? extra.customer ?? null,
    deliveryType: d.deliveryType ?? d.tipoEntrega ?? extra.deliveryType ?? null,
    createdAt: d.createdAt ?? d.fechaCreacion ?? d.fecha ?? extra.createdAt ?? new Date().toISOString(),
  }
}

export async function createOrder(orderData) {
  const items = (orderData.items || []).map((it) => ({
    productoId: it.productId,
    productId: it.productId,
    cantidad: it.quantity,
    quantity: it.quantity,
  }))
  const payload = {
    items,
    usuarioId: orderData.userId,
    userId: orderData.userId,
    direccionEnvio: orderData.shippingAddress,
    shippingAddress: orderData.shippingAddress,
    instrucciones: orderData.instructions || '',
    instructions: orderData.instructions || '',
    tipoEntrega: orderData.deliveryType,
    deliveryType: orderData.deliveryType,
    cliente: orderData.customer
      ? {
          nombre: orderData.customer.firstName,
          apellido: orderData.customer.lastName,
          email: orderData.customer.email,
          telefono: orderData.customer.phone,
        }
      : undefined,
    customer: orderData.customer,
  }
  const data = await post('/ordenes', payload)
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
