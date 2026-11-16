import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { listAdminProducts, deleteProduct } from '../../services/productsApi.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminTable from '../../components/admin/AdminTable'
import LoadingScreen from '../../components/LoadingScreen'

function isLowStock(product) {
  return (Number(product.stockCritical) || 0) > 0 && (Number(product.stock) || 0) <= (Number(product.stockCritical) || 0)
}

export default function AdminProductosPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const { isAdmin } = useAuth()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listAdminProducts()
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
        const data = await listAdminProducts()
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

  async function handleDelete(id) {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return
    setDeletingId(id)
    setActionError(null)
    try {
      await deleteProduct(id)
      await load()
    } catch (err) {
      setActionError(err.message || 'Error al eliminar el producto.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestión de Productos"
        actionLabel={isAdmin ? '+ Nuevo producto' : undefined}
        actionTo={isAdmin ? '/admin/productos/nuevo' : undefined}
      />

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {loading && <LoadingScreen message="Cargando productos..." />}

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

      {!loading && !error && products.length === 0 && (
        <div className="text-center py-12 text-slate-500">No hay productos registrados.</div>
      )}

      {!loading && !error && products.length > 0 && (
        <AdminTable
          headers={[
            'ID',
            'Código',
            'Categoría',
            'Nombre',
            'Stock',
            'Precio',
            'Descuento',
            isAdmin ? 'Acciones' : undefined,
          ].filter(Boolean)}
        >
          {products.map((product) => (
            <tr key={product.id}>
              <td className="py-3 px-4 font-medium">{product.id}</td>
              <td className="py-3 px-4">{product.code}</td>
              <td className="py-3 px-4">{product.category}</td>
              <td className="py-3 px-4">{product.name}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span>{product.stock}</span>
                  {isLowStock(product) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">
                      Stock crítico
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                ${Number(product.price || 0).toLocaleString('es-CL')}
              </td>
              <td className="py-3 px-4">
                {Number(product.discount) > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    -{product.discount}%
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              {isAdmin && (
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/productos/${product.id}/editar`}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
                    >
                      {deletingId === product.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  )
}
