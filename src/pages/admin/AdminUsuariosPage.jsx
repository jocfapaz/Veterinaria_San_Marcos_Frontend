import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  listUsers,
  deleteUser,
} from '../../services/usersApi.js'
import { formatRun } from '../../utils/run.js'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminTable from '../../components/admin/AdminTable'
import RoleBadge from '../../components/admin/RoleBadge'
import LoadingScreen from '../../components/LoadingScreen'

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listUsers()
      setUsers(data)
    } catch (err) {
      setError(err.message || 'Error al cargar los usuarios.')
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
        const data = await listUsers()
        if (active) setUsers(data)
      } catch (err) {
        if (active) setError(err.message || 'Error al cargar los usuarios.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return
    setDeletingId(id)
    setActionError(null)
    try {
      await deleteUser(id)
      await load()
    } catch (err) {
      setActionError(err.message || 'Error al eliminar el usuario.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestión de Usuarios"
        actionLabel="+ Nuevo usuario"
        actionTo="/admin/usuarios/nuevo"
      />

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {actionError}
        </div>
      )}

      {loading && <LoadingScreen message="Cargando usuarios..." />}

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

      {!loading && !error && users.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No hay usuarios registrados.
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <AdminTable
          headers={['ID', 'RUN', 'Email', 'Nombre', 'Rol', 'Teléfono', 'Acciones']}
        >
          {users.map((user) => (
            <tr key={user.id}>
              <td className="py-3 px-4 font-medium">{user.id}</td>
              <td className="py-3 px-4">{formatRun(user.run)}</td>
              <td className="py-3 px-4">{user.email}</td>
              <td className="py-3 px-4">
                {user.firstName} {user.lastName}
              </td>
              <td className="py-3 px-4">
                <RoleBadge role={user.role} />
              </td>
              <td className="py-3 px-4">{user.phone}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/usuarios/${user.id}/editar`}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(user.id)}
                    disabled={deletingId === user.id}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
                  >
                    {deletingId === user.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  )
}
