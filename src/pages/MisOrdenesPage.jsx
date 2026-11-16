import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { listMyOrders } from '../services/ordersApi.js'
import { formatPrice } from '../utils/format.js'
import PageHeader from '../components/PageHeader'
import LoadingScreen from '../components/LoadingScreen'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/admin/StatusBadge'

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('es-CL')
}

export default function MisOrdenesPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listMyOrders()
      const sorted = [...data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      setOrders(sorted)
    } catch (err) {
      setError(err.message || 'Error al cargar tus órdenes.')
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
        const data = await listMyOrders()
        if (!active) return
        const sorted = [...data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        setOrders(sorted)
      } catch (err) {
        if (active) setError(err.message || 'Error al cargar tus órdenes.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <PageHeader
        title="Mis órdenes"
        subtitle="Revisa el historial de tus compras, su estado y el detalle de cada pedido."
      />

      {loading && <LoadingScreen message="Cargando tus órdenes..." />}

      {!loading && error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <p className="text-rose-700 font-medium">{error}</p>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <EmptyState
          title="Aún no tienes órdenes"
          message="Cuando realices una compra, podrás ver aquí el estado y detalle de tus pedidos."
          actionLabel="Ir a la tienda"
          actionTo="/tienda"
        />
      )}

      {!loading && !error && orders.length > 0 && (
        <ul className="space-y-4">
          {orders.map((order) => {
            const itemCount = Array.isArray(order.items) ? order.items.length : 0
            return (
              <li key={order.id || order.orderNumber}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">
                        Orden {order.orderNumber || order.id}
                      </h2>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-slate-600">
                      Fecha: <span className="font-medium text-slate-800">{formatDate(order.createdAt)}</span>
                    </p>
                    <p className="text-sm text-slate-600">
                      {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
                      <p className="text-xl font-extrabold text-emerald-700">{formatPrice(order.total)}</p>
                    </div>
                    <Link
                      to={`/mis-ordenes/${order.id || order.orderNumber}`}
                      className="inline-flex items-center justify-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
