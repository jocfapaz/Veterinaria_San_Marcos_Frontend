import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { listAdminServices, deleteService } from '../../services/servicesApi.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminTable from '../../components/admin/AdminTable'
import LoadingScreen from '../../components/LoadingScreen'

export default function AdminServiciosPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const { isAdmin } = useAuth()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listAdminServices()
      setServices(data)
    } catch (err) {
      setError(err.message || 'Error al cargar los servicios.')
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
        const data = await listAdminServices()
        if (active) setServices(data)
      } catch (err) {
        if (active) setError(err.message || 'Error al cargar los servicios.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return
    setDeletingId(id)
    setActionError(null)
    try {
      await deleteService(id)
      await load()
    } catch (err) {
      setActionError(err.message || 'Error al eliminar el servicio.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestión de Servicios"
        actionLabel={isAdmin ? '+ Nuevo servicio' : undefined}
        actionTo={isAdmin ? '/admin/servicios/nuevo' : undefined}
      />

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {loading && <LoadingScreen message="Cargando servicios..." />}

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

      {!loading && !error && services.length === 0 && (
        <div className="text-center py-12 text-slate-500">No hay servicios registrados.</div>
      )}

      {!loading && !error && services.length > 0 && (
        <AdminTable
          headers={['ID', 'Código', 'Categoría', 'Nombre', 'Especie', 'Duración', 'Precio', isAdmin ? 'Acciones' : undefined].filter(Boolean)}
        >
          {services.map((service) => (
            <tr key={service.id}>
              <td className="py-3 px-4 font-medium">{service.id}</td>
              <td className="py-3 px-4">{service.code}</td>
              <td className="py-3 px-4">{service.category}</td>
              <td className="py-3 px-4">{service.name}</td>
              <td className="py-3 px-4">{service.species}</td>
              <td className="py-3 px-4">{service.duration}</td>
              <td className="py-3 px-4">
                ${Number(service.price || 0).toLocaleString('es-CL')}
              </td>
              {isAdmin && (
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/servicios/${service.id}/editar`}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(service.id)}
                      disabled={deletingId === service.id}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
                    >
                      {deletingId === service.id ? 'Eliminando...' : 'Eliminar'}
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
