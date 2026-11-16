import { useEffect, useState } from 'react'
import { getMetrics } from '../../services/dashboardApi.js'
import { formatPrice } from '../../utils/format.js'
import AdminTable from '../../components/admin/AdminTable'
import StatusBadge from '../../components/admin/StatusBadge'
import LoadingScreen from '../../components/LoadingScreen'

function formatDate(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('es-CL')
  } catch {
    return '-'
  }
}

function normalizeStatus(value) {
  return String(value || '').toLowerCase()
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getMetrics()
      setMetrics(data)
    } catch (err) {
      setError(err.message || 'Error al cargar las métricas.')
      setMetrics(null)
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
        const data = await getMetrics()
        if (active) setMetrics(data)
      } catch (err) {
        if (active) setError(err.message || 'Error al cargar las métricas.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <LoadingScreen message="Cargando métricas..." />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Resumen general de la veterinaria.
          </p>
        </div>
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
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-12 text-slate-500">
        No se pudieron cargar las métricas.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Resumen general de la veterinaria.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase">
            Órdenes de compra
          </p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">
            {metrics.totalOrders}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase">
            Solicitudes de servicio
          </p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">
            {metrics.totalRequests}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase">
            Usuarios registrados
          </p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">
            {metrics.totalUsers}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase">
            Productos en catálogo
          </p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">
            {metrics.totalProducts}
          </p>
        </div>
      </div>

      {metrics.criticalStockProducts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Productos con stock crítico
          </h2>
          <AdminTable headers={['Código', 'Nombre', 'Stock', 'Stock crítico']}>
            {metrics.criticalStockProducts.map((product) => (
              <tr key={product.id}>
                <td className="py-3 px-4 font-medium">{product.code}</td>
                <td className="py-3 px-4">{product.name}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">
                    {product.stock}
                  </span>
                </td>
                <td className="py-3 px-4">{product.stockCritical}</td>
              </tr>
            ))}
          </AdminTable>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Últimas órdenes de compra
          </h2>
          {metrics.recentOrders.length === 0 ? (
            <p className="text-slate-500 text-sm">No hay órdenes registradas.</p>
          ) : (
            <AdminTable headers={['Nº Orden', 'Cliente', 'Total', 'Fecha', 'Estado']}>
              {metrics.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                  <td className="py-3 px-4">{order.customerName}</td>
                  <td className="py-3 px-4">{formatPrice(order.total)}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {formatDate(order.date)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={normalizeStatus(order.status)} />
                  </td>
                </tr>
              ))}
            </AdminTable>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Últimas solicitudes de servicio
          </h2>
          {metrics.recentRequests.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No hay solicitudes registradas.
            </p>
          ) : (
            <AdminTable headers={['Servicio', 'Cliente', 'Fecha', 'Estado']}>
              {metrics.recentRequests.map((request) => (
                <tr key={request.id}>
                  <td className="py-3 px-4 font-medium">{request.serviceName}</td>
                  <td className="py-3 px-4">{request.customerName}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {formatDate(request.date)}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={normalizeStatus(request.status)} />
                  </td>
                </tr>
              ))}
            </AdminTable>
          )}
        </div>
      </div>
    </div>
  )
}
