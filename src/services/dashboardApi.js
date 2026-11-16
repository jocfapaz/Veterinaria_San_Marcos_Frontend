import { get } from './api.js'
import { formatPrice } from '../utils/format.js'

function mapCriticalProduct(dto = {}) {
  const d = dto && typeof dto === 'object' ? dto : {}
  return {
    id: d.id,
    code: d.codigo || '',
    name: d.nombre || '',
    stock: d.stock != null ? Number(d.stock) : 0,
    stockCritical: d.stockCritico != null ? Number(d.stockCritico) : 0,
  }
}

function mapRecentOrder(dto = {}) {
  const d = dto && typeof dto === 'object' ? dto : {}
  return {
    id: d.id,
    orderNumber: d.numeroOrden || d.numero || '',
    date: d.fechaOrden || d.createdAt || '',
    total: Number(d.total) || 0,
    status: d.estado || '',
    customerName: d.clienteNombre || '',
  }
}

function mapRecentRequest(dto = {}) {
  const d = dto && typeof dto === 'object' ? dto : {}
  return {
    id: d.id,
    serviceName: d.servicioNombre || '',
    date: d.fechaSolicitada || '',
    status: d.estado || '',
    customerName: d.clienteNombre || '',
  }
}

export function mapMetrics(dto = {}) {
  const d = dto && typeof dto === 'object' ? dto : {}
  const raw = d?.data ?? d
  const data = raw && typeof raw === 'object' ? raw : d

  return {
    totalOrders: Number(data.totalOrdenes ?? 0),
    totalRequests: Number(data.totalSolicitudes ?? 0),
    totalUsers: Number(data.totalUsuarios ?? 0),
    totalProducts: Number(data.totalProductos ?? 0),
    criticalStockProducts: Array.isArray(data.productosStockCritico)
      ? data.productosStockCritico.map(mapCriticalProduct)
      : [],
    recentOrders: Array.isArray(data.ultimasOrdenes)
      ? data.ultimasOrdenes.map(mapRecentOrder)
      : [],
    recentRequests: Array.isArray(data.ultimasSolicitudes)
      ? data.ultimasSolicitudes.map(mapRecentRequest)
      : [],
  }
}

export async function getMetrics() {
  const data = await get('/dashboard/metrics')
  return mapMetrics(data)
}

export { formatPrice }
