import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { listProducts } from '../services/productsApi.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useCart } from '../contexts/CartContext.jsx'
import ProductCard from '../components/ProductCard'
import LoadingScreen from '../components/LoadingScreen'
import EmptyState from '../components/EmptyState'

export default function TiendaPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { addToCart } = useCart()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadProducts() {
    setLoading(true)
    setError(null)
    try {
      const data = await listProducts()
      setProducts(data)
    } catch (err) {
      setError(err.message || 'Error al cargar los productos.')
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
        const data = await listProducts()
        if (active) setProducts(data)
      } catch (err) {
        if (active) setError(err.message || 'Error al cargar los productos.')
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <section className="space-y-8">
          <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                Catálogo de Productos
              </h1>
              <p className="mt-2 text-base text-slate-600">
                Medicamentos y vacunas disponibles para venta directa en
                Veterinaria San Marcos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/categorias"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                Ver por categoría
              </Link>
              <Link
                to="/ofertas"
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                Ver ofertas
              </Link>
            </div>
          </div>

          {loading && <LoadingScreen message="Cargando productos..." />}

          {!loading && error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
              <p className="text-rose-700 font-medium">{error}</p>
              <button
                type="button"
                onClick={loadProducts}
                className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-xl font-bold text-slate-900">
                  Todos los productos
                </h2>
                <span className="text-sm text-slate-500">
                  {products.length} {products.length === 1 ? 'resultado' : 'resultados'}
                </span>
              </div>

              {products.length === 0 ? (
                <EmptyState
                  title="No hay productos disponibles"
                  message="Aún no se han publicado productos en la tienda."
                  actionLabel="Ir al inicio"
                  actionTo="/"
                />
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      {...product}
                      onAdd={handleAddToCart}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
