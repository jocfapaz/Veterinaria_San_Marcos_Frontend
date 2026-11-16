import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { listRequests, updateRequest } from '../../services/requestsApi.js'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminTable from '../../components/admin/AdminTable'
import StatusBadge from '../../components/admin/StatusBadge'
import LoadingScreen from '../../components/LoadingScreen'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
]

const EDITABLE_STATUSES = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
]

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('es-CL')
}

function formatDateTime(date, time) {
  const d = formatDate(date)
  if (!d || d === '-') return '-'
  return time ? `${d} ${time}` : d
}

function getClientName(request) {
  const c = request?.customer || request?.cliente || request?.usuario || request?.user || {}
  const name = `${c.firstName || c.nombre || ''} ${c.lastName || c.apellido || ''}`.trim()
  if (name) return name
  if (c.email || c.correo) return c.email || c.correo
  return request?.userId || '-'
}

export default function AdminSolicitudesPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)
  const [actionError, setActionError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listRequests()
      setRequests([...data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))
    } catch (err) {
      setError(err.message || 'Error al cargar las solicitudes.')
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
        const data = await listRequests()
        if (active) setRequests([...data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))
      } catch (err) {
        if (active) setError(err.message || 'Error al cargar las solicitudes.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return requests
    return requests.filter((r) => (r.status || 'pending') === statusFilter)
  }, [requests, statusFilter])

  async function handleStatusChange(id, status) {
    setUpdatingId(id)
    setActionError(null)
    try {
      const updated = await updateRequest(id, { status })
      setRequests((prev) => prev.map((r) => (String(r.id) === String(id) ? { ...r, ...updated, status: updated?.status || status } : r)))
    } catch (err) {
      setActionError(err.message || 'Error al actualizar el estado.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Solicitudes de servicios" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="filtro-estado" className="text-sm font-medium text-slate-700">Estado:</label>
          <select
            id="filtro-estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-emerald-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-slate-500">{filtered.length} solicitud(es)</p>
      </div>

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{actionError}</div>
      )}

      {loading && <LoadingScreen message="Cargando solicitudes..." />}

      {!loading && error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <p className="text-rose-700 font-medium">{error}</p>
          <button type="button" onClick={load} className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors">
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <AdminTable headers={['ID', 'Cliente', 'Servicio', 'Mascota', 'Fecha solicitada', 'Cita', 'Estado', 'Acciones']}>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-6 px-4 text-center text-sm text-slate-500">
                {requests.length === 0 ? 'No hay solicitudes registradas.' : 'No hay solicitudes con el estado seleccionado.'}
              </td>
            </tr>
          ) : (
            filtered.map((request) => (
              <tr key={request.id}>
                <td className="py-3 px-4 font-medium">{request.id}</td>
                <td className="py-3 px-4">{getClientName(request)}</td>
                <td className="py-3 px-4">{request.service?.name || request.serviceId || '-'}</td>
                <td className="py-3 px-4">{request.petName || '-'}{request.species ? ` (${request.species})` : ''}</td>
                <td className="py-3 px-4">{formatDate(request.requestedDate || request.createdAt)}</td>
                <td className="py-3 px-4">{formatDateTime(request.appointmentDate, request.appointmentTime)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={request.status} />
                    <select
                      value={request.status || 'pending'}
                      onChange={(e) => handleStatusChange(request.id, e.target.value)}
                      disabled={updatingId === request.id}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      {EDITABLE_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Link to={`/admin/solicitudes/${request.id}`} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors">
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))
          )}
        </AdminTable>
      )}
    </div>
  )
}
