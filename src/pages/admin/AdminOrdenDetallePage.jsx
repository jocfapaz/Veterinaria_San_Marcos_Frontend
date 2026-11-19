import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getOrderById, updateOrderStatus } from '../../services/ordersApi.js'
import { formatPrice } from '../../utils/format.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import LoadingScreen from '../../components/LoadingScreen'
import StatusBadge from '../../components/admin/StatusBadge'

// El backend devuelve el estado en español (PAGADA, EN_PREPARACION, ...)
// y mapOrder lo deja en minúsculas. Usamos esos mismos valores en la UI.
const ORDER_STATUSES = [
  { value: 'pagada', label: 'Pagada' },
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'entregada', label: 'Entregada' },
  { value: 'cancelada', label: 'Cancelada' },
]

// OrdenService solo permite avanzar de uno en uno y cancelar antes de entregar.
const NEXT_STATUS = {
  pagada: 'en_preparacion',
  en_preparacion: 'enviada',
  enviada: 'entregada',
}

function availableStatuses(current) {
  const next = NEXT_STATUS[current]
  return ORDER_STATUSES.filter(
    (s) =>
      s.value === current ||
      s.value === next ||
      (s.value === 'cancelada' &&
        current !== 'entregada' &&
        current !== 'cancelada')
  )
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('es-CL')
}

function getCustomerInfo(order) {
  const c = order?.customer || order?.cliente || {}
  const name = `${c.firstName || c.nombre || ''} ${c.lastName || c.apellido || ''}`.trim()
  return {
    name: name || order?.userId || order?.usuarioId || 'No disponible',
    email: c.email || c.correo || '',
    phone: c.phone || c.telefono || '',
  }
}

export default function AdminOrdenDetallePage() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getOrderById(id)
      setOrder(data)
    } catch (err) {
      setError(err.message || 'Error al cargar la orden.')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getOrderById(id)
        if (!active) return
        setOrder(data)
      } catch (err) {
        if (active) {
          setError(err.message || 'Error al cargar la orden.')
          setOrder(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  async function handleStatusChange(status) {
    if (!order) return
    setSaving(true)
    setActionError(null)
    try {
      const updated = await updateOrderStatus(order.id || id, status)
      setOrder((prev) => ({ ...(updated || prev), status: (updated?.status || status) }))
    } catch (err) {
      setActionError(err.message || 'Error al actualizar el estado.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Detalle de orden" />
        <LoadingScreen message="Cargando orden..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Detalle de orden" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <p className="text-rose-700 font-medium">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" onClick={load} className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors">
              Reintentar
            </button>
            <Link to="/admin/ordenes" className="inline-flex items-center justify-center py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors">
              Volver a órdenes
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Detalle de orden" />
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Orden no encontrada</h2>
          <p className="text-slate-500 mb-6">La orden solicitada no existe o no está disponible.</p>
          <Link to="/admin/ordenes" className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors">
            Volver a órdenes
          </Link>
        </div>
      </div>
    )
  }

  const items = Array.isArray(order.items) ? order.items : []
  const customer = getCustomerInfo(order)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <AdminPageHeader title={`Orden ${order.orderNumber || order.id}`} />
        <Link to="/admin/ordenes" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
          ← Volver a órdenes
        </Link>
      </div>

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{actionError}</div>
      )}

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</p>
            <p className="text-base font-bold text-slate-900">{customer.name}</p>
            {customer.email && <p className="text-sm text-slate-600">{customer.email}</p>}
            {customer.phone && <p className="text-sm text-slate-600">{customer.phone}</p>}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Información</p>
            <p className="text-sm text-slate-600">Fecha: <span className="font-medium text-slate-900">{formatDate(order.createdAt)}</span></p>
            <p className="text-sm text-slate-600">Nº orden: <span className="font-medium text-slate-900">{order.orderNumber || order.id}</span></p>
            {order.shippingAddress && <p className="text-sm text-slate-600">Envío: <span className="font-medium text-slate-900">{order.shippingAddress}</span></p>}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</p>
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={order.status} />
              {isAdmin ? (
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={saving}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  {availableStatuses(order.status).map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-slate-500">Modo solo lectura</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Items</h3>
          {items.length === 0 ? (
            <p className="text-sm text-slate-500">No hay items disponibles para esta orden.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Producto</th>
                    <th className="py-3 px-4 font-semibold text-center">Cantidad</th>
                    <th className="py-3 px-4 font-semibold text-right">Precio</th>
                    <th className="py-3 px-4 font-semibold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.productId || idx}>
                      <td className="py-3 px-4 text-slate-900 font-medium">{item.name}</td>
                      <td className="py-3 px-4 text-center">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">{formatPrice(item.price)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatPrice(item.subtotal ?? Number(item.price || 0) * (item.quantity || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <div className="text-right">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-extrabold text-emerald-700">{formatPrice(order.total)}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
