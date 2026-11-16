import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getOrderById } from '../services/ordersApi.js'
import { formatPrice } from '../utils/format.js'
import Breadcrumbs from '../components/Breadcrumbs'
import LoadingScreen from '../components/LoadingScreen'
import StatusBadge from '../components/admin/StatusBadge'

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('es-CL')
}

export default function OrdenDetallePage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs
          items={[
            { label: 'Inicio', to: '/' },
            { label: 'Mis órdenes', to: '/mis-ordenes' },
            { label: 'Cargando...' },
          ]}
        />
        <LoadingScreen message="Cargando detalle de la orden..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Inicio', to: '/' },
            { label: 'Mis órdenes', to: '/mis-ordenes' },
            { label: 'Error' },
          ]}
        />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <p className="text-rose-700 font-medium">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              Reintentar
            </button>
            <Link
              to="/mis-ordenes"
              className="inline-flex items-center justify-center py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors"
            >
              Volver al historial
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Inicio', to: '/' },
            { label: 'Mis órdenes', to: '/mis-ordenes' },
            { label: 'No encontrada' },
          ]}
        />
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Orden no encontrada</h1>
          <p className="text-slate-500 mb-6">La orden que buscas no existe o no tienes acceso a ella.</p>
          <Link
            to="/mis-ordenes"
            className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            Volver al historial
          </Link>
        </div>
      </div>
    )
  }

  const items = Array.isArray(order.items) ? order.items : []
  const customer = order.customer || {}
  const customerName = `${customer.firstName || customer.nombre || ''} ${customer.lastName || customer.apellido || ''}`.trim()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Inicio', to: '/' },
          { label: 'Mis órdenes', to: '/mis-ordenes' },
          { label: `Orden ${order.orderNumber || order.id || ''}` },
        ]}
      />

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                Orden {order.orderNumber || order.id}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-slate-600">
              Fecha: <span className="font-medium text-slate-800">{formatDate(order.createdAt)}</span>
            </p>
            {customerName && (
              <p className="text-sm text-slate-600">
                Cliente: <span className="font-medium text-slate-800">{customerName}</span>
              </p>
            )}
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
            <p className="text-2xl font-extrabold text-emerald-700">{formatPrice(order.total)}</p>
            <p className="text-xs text-slate-400 mt-1">Total calculado por el sistema</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {(order.shippingAddress || order.deliveryType) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 font-medium">Entrega</p>
                <p className="text-slate-900 font-semibold mt-0.5">
                  {order.deliveryType === 'retiro' ? 'Retiro en tienda' : (order.shippingAddress || '-')}
                </p>
              </div>
              {order.instructions && (
                <div>
                  <p className="text-slate-500 font-medium">Indicaciones</p>
                  <p className="text-slate-900 font-semibold mt-0.5">{order.instructions}</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Productos</h2>
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">No hay detalle de productos disponible.</p>
            ) : (
              <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {items.map((item, idx) => (
                  <li key={item.productId || idx} className="p-4 flex items-center justify-between gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-slate-500">
                        Cantidad: {item.quantity}
                        {item.price != null ? ` · ${formatPrice(item.price)} c/u` : ''}
                      </p>
                    </div>
                    <p className="font-bold text-slate-900 whitespace-nowrap">
                      {formatPrice(item.subtotal ?? Number(item.price || 0) * (item.quantity || 0))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/mis-ordenes"
              className="flex-1 text-center py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors"
            >
              ← Volver al historial
            </Link>
            <Link
              to="/tienda"
              className="flex-1 text-center py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              Ir a la tienda
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
