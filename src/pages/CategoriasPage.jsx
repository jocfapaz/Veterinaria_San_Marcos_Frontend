import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  listProductsByCategory,
  listProductCategories,
} from '../services/productsApi.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useCart } from '../contexts/CartContext.jsx'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import ProductCard from '../components/ProductCard'
import LoadingScreen from '../components/LoadingScreen'

const CATEGORY_ICONS = {
  'Antibióticos': '💊',
  'Antiparasitarios': '🛡️',
  'Antiinflamatorios': '🩹',
  'Dermatología': '🧴',
  'Digestivo': '🫃',
  'Cardíaco': '❤️',
  'Analgésicos': '💉',
  'Vacunas': '💉',
  'Suplementos': '⭐',
}

export default function CategoriasPage() {
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { addToCart } = useCart()

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const cats = await listProductCategories()
        if (active) setCategories(cats)
      } catch {
        if (active) setCategories([])
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function load(category) {
    setLoading(true)
    setError(null)
    try {
      const [data, all] = await Promise.all([
        listProductsByCategory(category),
        listProductsByCategory('Todas'),
      ])
      setProducts(data)
      setTotalCount(all.length)
    } catch (err) {
      setError(err.message || 'Error al cargar los productos.')
      setProducts([])
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
        const [data, all] = await Promise.all([
          listProductsByCategory(selectedCategory),
          listProductsByCategory('Todas'),
        ])
        if (!active) return
        setProducts(data)
        setTotalCount(all.length)
      } catch (err) {
        if (active) {
          setError(err.message || 'Error al cargar los productos.')
          setProducts([])
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [selectedCategory])

  function handleAddToCart(productId) {
    if (!currentUser) {
      navigate('/login')
      return
    }
    addToCart(productId, 1)
    alert('Producto añadido al carrito')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageHeader
        title="Categorías de Productos"
        subtitle="Encuentra rápidamente los medicamentos y vacunas según el tipo de producto que necesitas."
      />

      <div className="flex flex-wrap gap-3">
        <Link
          to="/tienda"
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          ← Volver a la tienda
        </Link>
        <Link
          to="/ofertas"
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
        >
          Ver ofertas →
        </Link>
      </div>

      <section aria-label="Listado de categorías">
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <li>
            <button
              type="button"
              onClick={() => setSelectedCategory('Todas')}
              className={`w-full h-full p-4 rounded-xl border text-center transition-colors ${
                selectedCategory === 'Todas'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-700'
              }`}
            >
              <span className="block text-2xl mb-1">🗂️</span>
              <span className="block text-sm font-bold">Todas</span>
              <span
                className={`block text-xs mt-1 ${
                  selectedCategory === 'Todas'
                    ? 'text-emerald-100'
                    : 'text-slate-500'
                }`}
              >
                {totalCount} productos
              </span>
            </button>
          </li>

          {categories.map((category) => {
            const isActive = selectedCategory === category
            return (
              <li key={category}>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full h-full p-4 rounded-xl border text-center transition-colors ${
                    isActive
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-700'
                  }`}
                >
                  <span className="block text-2xl mb-1">
                    {CATEGORY_ICONS[category] || '📦'}
                  </span>
                  <span className="block text-sm font-bold">{category}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-label="Productos de la categoría seleccionada" className="space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-xl font-bold text-slate-900">
            {selectedCategory === 'Todas'
              ? 'Todos los productos'
              : selectedCategory}
          </h2>
          <span className="text-sm text-slate-500">
            {products.length} {products.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        {loading && <LoadingScreen message="Cargando productos..." />}

        {!loading && error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
            <p className="text-rose-700 font-medium">{error}</p>
            <button
              type="button"
              onClick={() => load(selectedCategory)}
              className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <EmptyState
            title="Sin productos en esta categoría"
            message="Prueba con otra categoría o revisa el catálogo completo de la tienda."
            actionLabel="Ir a la tienda"
            actionTo="/tienda"
          />
        )}

        {!loading && !error && products.length > 0 && (
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
      </section>
    </div>
  )
}
