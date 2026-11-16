import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { listOrders, updateOrderStatus } from '../../services/ordersApi.js'
import { formatPrice } from '../../utils/format.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminTable from '../../components/admin/AdminTable'
import StatusBadge from '../../components/admin/StatusBadge'
import LoadingScreen from '../../components/LoadingScreen'

const ORDER_STATUSES = [
  { value: 'paid', label: 'Pagada' },
  { value: 'processing', label: 'En preparación' },
  { value: 'shipped', label: 'Enviada' },
  { value: 'delivered', label: 'Entregada' },
  { value: 'cancelled', label: 'Cancelada' },
]

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getCustomerName(order) {
  const c = order?.customer || order?.cliente || {}
  const name = `${c.firstName || c.nombre || ''} ${c.lastName || c.apellido || ''}`.trim()
  if (name) return name
  if (c.email || c.correo) return c.email || c.correo
  return order?.userId || order?.usuarioId || '-'
}

export default function AdminOrdenesPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const { isAdmin } = useAuth()

  async function loadOrders() {
    setLoading(true)
    setError(null)
    try {
      const data = await listOrders()
      setOrders([...data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))
    } catch (err) {
      setError(err.message || 'Error al cargar las órdenes.')
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
        const data = await listOrders()
        if (active) setOrders([...data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))
      } catch (err) {
        if (active) setError(err.message || 'Error al cargar las órdenes.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function handleOrderStatusChange(id, status) {
    setUpdatingId(id)
    setActionError(null)
    try {
      await updateOrderStatus(id, status)
      await loadOrders()
    } catch (err) {
      setActionError(err.message || 'Error al actualizar el estado de la orden.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Órdenes de compra" />

      <section>
        {actionError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {actionError}
          </div>
        )}

        {loading && <LoadingScreen message="Cargando órdenes..." />}

        {!loading && error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
            <p className="text-rose-700 font-medium">{error}</p>
            <button
              type="button"
              onClick={loadOrders}
              className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <AdminTable
            headers={['Nº orden', 'Cliente', 'Total', 'Fecha', 'Estado', 'Detalle']}
          >
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-6 px-4 text-center text-sm text-slate-500"
                >
                  No hay órdenes registradas.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id || order.orderNumber}>
                  <td className="py-3 px-4 font-medium">{order.orderNumber || order.id}</td>
                  <td className="py-3 px-4">{getCustomerName(order)}</td>
                  <td className="py-3 px-4">{formatPrice(order.total)}</td>
                  <td className="py-3 px-4">{formatDate(order.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.status} />
                      {isAdmin ? (
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleOrderStatusChange(order.id || order.orderNumber, e.target.value)
                          }
                          disabled={updatingId === (order.id || order.orderNumber)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400">Solo lectura</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/admin/ordenes/${order.id || order.orderNumber}`}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </AdminTable>
        )}
      </section>
    </div>
  )
}
