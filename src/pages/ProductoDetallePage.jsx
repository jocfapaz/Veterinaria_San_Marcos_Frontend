import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getProductById, listProductsByCategory } from '../services/productsApi.js'
import { formatPrice, calculateDiscountedPrice } from '../utils/format.js'
import { normalizeImagePath } from '../utils/imageUrl.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useCart } from '../contexts/CartContext.jsx'
import Breadcrumbs from '../components/Breadcrumbs'
import Button from '../components/Button'
import QuantitySelector from '../components/QuantitySelector'
import ProductCard from '../components/ProductCard'
import LoadingScreen from '../components/LoadingScreen'

export default function ProductoDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [success, setSuccess] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getProductById(id)
      setProduct(data)
      if (data?.category) {
        const related = await listProductsByCategory(data.category)
        setRelatedProducts(related.filter((p) => String(p.id) !== String(data.id)).slice(0, 3))
      } else {
        setRelatedProducts([])
      }
    } catch (err) {
      setError(err.message || 'Error al cargar el producto.')
      setProduct(null)
      setRelatedProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      setQuantity(1)
      setSuccess(false)
      setLoading(true)
      setError(null)
      try {
        const data = await getProductById(id)
        if (!active) return
        setProduct(data)
        if (data?.category) {
          const related = await listProductsByCategory(data.category)
          if (!active) return
          setRelatedProducts(related.filter((p) => String(p.id) !== String(data.id)).slice(0, 3))
        } else {
          setRelatedProducts([])
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Error al cargar el producto.')
          setProduct(null)
          setRelatedProducts([])
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs
          items={[
            { label: 'Inicio', to: '/' },
            { label: 'Tienda', to: '/tienda' },
            { label: 'Cargando...' },
          ]}
        />
        <LoadingScreen message="Cargando producto..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs
          items={[
            { label: 'Inicio', to: '/' },
            { label: 'Tienda', to: '/tienda' },
            { label: 'Error' },
          ]}
        />
        <div className="mt-8 text-center py-16 bg-white rounded-2xl border border-rose-200 shadow-sm space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">No se pudo cargar el producto</h1>
          <p className="text-rose-600">{error}</p>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs
          items={[
            { label: 'Inicio', to: '/' },
            { label: 'Tienda', to: '/tienda' },
            { label: 'Producto no encontrado' },
          ]}
        />
        <div className="mt-8 text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Producto no encontrado
          </h1>
          <p className="text-slate-500 mb-6">
            El producto que buscas no existe o fue eliminado.
          </p>
          <Link
            to="/tienda"
            className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    )
  }

  const finalPrice = calculateDiscountedPrice(product.price, product.discount)
  const imageSrc = normalizeImagePath(product.image)

  function handleAddToCart() {
    if (!currentUser) {
      navigate('/login')
      return
    }
    addToCart(product.id, quantity)
    setSuccess(true)
    setQuantity(1)
    setTimeout(() => setSuccess(false), 3000)
  }

  function handleAddRelated(productId) {
    if (!currentUser) {
      navigate('/login')
      return
    }
    addToCart(productId, 1)
    alert('Producto añadido al carrito')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <Breadcrumbs
        items={[
          { label: 'Inicio', to: '/' },
          { label: 'Tienda', to: '/tienda' },
          { label: product.name },
        ]}
      />

      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="relative flex justify-center bg-slate-50 rounded-xl p-6 border border-slate-100 min-h-[16rem]">
          {product.discount > 0 && (
            <span className="absolute top-4 right-4 bg-rose-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              -{product.discount}%
            </span>
          )}
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full max-w-sm h-auto object-contain rounded-lg"
            />
          ) : (
            <div className="flex items-center justify-center text-slate-400">Sin imagen</div>
          )}
        </div>

        <div className="space-y-5">
          <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>

          <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-200">
            Categoría: {product.category} &nbsp;|&nbsp; Presentación:{' '}
            {product.presentation}
          </p>

          <div className="flex items-baseline gap-3">
            {product.discount > 0 && (
              <p className="text-xl text-slate-400 line-through">
                {formatPrice(product.price)}
              </p>
            )}
            <p className="text-3xl font-extrabold text-emerald-700">
              {formatPrice(finalPrice)}
            </p>
          </div>

          <p className="text-emerald-600 font-medium text-sm">
            ✓ Disponible
          </p>

          <p className="text-slate-600 leading-relaxed text-sm">
            {product.description ||
              `Producto de la categoría ${String(product.category || '').toLowerCase()}. Presentación: ${product.presentation || '-'}. Indicado para el cuidado y bienestar de tu mascota. Consulta a nuestro equipo veterinario ante cualquier duda.`}
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t border-slate-100">
            <QuantitySelector value={quantity} onChange={setQuantity} />
            <Button onClick={handleAddToCart} className="w-full sm:w-auto py-3 px-6">
              Añadir al carrito
            </Button>
          </div>

          {success && (
            <div className="p-3 text-sm text-emerald-800 rounded-lg bg-emerald-50 border border-emerald-200">
              ✓ Producto añadido al carrito.
            </div>
          )}
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">
            Otros productos de {String(product.category || '').toLowerCase()}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} {...p} onAdd={handleAddRelated} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
