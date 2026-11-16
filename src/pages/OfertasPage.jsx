import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { listProductOffers } from '../services/productsApi.js'
import { formatPrice, calculateDiscountedPrice } from '../utils/format.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useCart } from '../contexts/CartContext.jsx'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import ProductCard from '../components/ProductCard'
import LoadingScreen from '../components/LoadingScreen'

export default function OfertasPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { addToCart } = useCart()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadOffers() {
    setLoading(true)
    setError(null)
    try {
      const data = await listProductOffers()
      setOffers(data)
    } catch (err) {
      setError(err.message || 'Error al cargar las ofertas.')
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
        const data = await listProductOffers()
        if (active) setOffers(data)
      } catch (err) {
        if (active) setError(err.message || 'Error al cargar las ofertas.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  function handleAddToCart(productId) {
    if (!currentUser) {
      navigate('/login')
      return
    }
    addToCart(productId, 1)
    alert('Producto añadido al carrito')
  }

  const totalSavings = offers.reduce(
    (sum, product) =>
      sum + (Number(product.price) - calculateDiscountedPrice(product.price, product.discount)),
    0,
  )
  const maxDiscount = offers.length ? Math.max(...offers.map((p) => Number(p.discount) || 0)) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Ofertas de la Semana"
        subtitle="Ahorra en medicamentos, vacunas y suplementos seleccionados."
      />

      <div className="flex flex-wrap gap-3">
        <Link
          to="/tienda"
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          ← Volver a la tienda
        </Link>
        <Link
          to="/categorias"
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
        >
          Ver por categoría
        </Link>
      </div>

      {loading && <LoadingScreen message="Cargando ofertas..." />}

      {!loading && error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <p className="text-rose-700 font-medium">{error}</p>
          <button
            type="button"
            onClick={loadOffers}
            className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && offers.length === 0 && (
        <EmptyState
          title="No hay ofertas disponibles"
          message="Vuelve pronto, estamos preparando nuevos descuentos para ti."
          actionLabel="Ver catálogo completo"
          actionTo="/tienda"
        />
      )}

      {!loading && !error && offers.length > 0 && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-600 rounded-2xl p-5 text-white shadow-sm">
              <p className="text-emerald-100 text-sm font-medium">
                Productos en oferta
              </p>
              <p className="text-3xl font-extrabold mt-1">{offers.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Mayor descuento</p>
              <p className="text-3xl font-extrabold mt-1 text-rose-600">
                {maxDiscount}%
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Ahorro potencial</p>
              <p className="text-3xl font-extrabold mt-1 text-emerald-700">
                {formatPrice(totalSavings)}
              </p>
            </div>
          </section>

          <section aria-label="Productos en oferta" className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-xl font-bold text-slate-900">
                Productos en descuento
              </h2>
              <span className="text-sm text-slate-500">{offers.length} ofertas</span>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {offers.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onAdd={handleAddToCart}
                />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
