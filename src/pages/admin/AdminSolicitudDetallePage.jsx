import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getRequestById, updateRequest } from '../../services/requestsApi.js'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import LoadingScreen from '../../components/LoadingScreen'
import StatusBadge from '../../components/admin/StatusBadge'

const STATUSES = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
]

function toInputDate(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value)
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('es-CL')
}

function getClientName(request) {
  const c = request?.customer || request?.cliente || request?.usuario || request?.user || {}
  const name = `${c.firstName || c.nombre || ''} ${c.lastName || c.apellido || ''}`.trim()
  if (name) return name
  if (c.email || c.correo) return c.email || c.correo
  return request?.userId || '-'
}

export default function AdminSolicitudDetallePage() {
  const { id } = useParams()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ status: 'pending', appointmentDate: '', appointmentTime: '' })

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getRequestById(id)
      setRequest(data)
      if (data) {
        setForm({
          status: data.status || 'pending',
          appointmentDate: toInputDate(data.appointmentDate),
          appointmentTime: data.appointmentTime || '',
        })
      }
    } catch (err) {
      setError(err.message || 'Error al cargar la solicitud.')
      setRequest(null)
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
        const data = await getRequestById(id)
        if (!active) return
        setRequest(data)
        if (data) {
          setForm({
            status: data.status || 'pending',
            appointmentDate: toInputDate(data.appointmentDate),
            appointmentTime: data.appointmentTime || '',
          })
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Error al cargar la solicitud.')
          setRequest(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [id])

  async function handleSave(e) {
    e.preventDefault()
    if (!request) return
    setSaving(true)
    setActionError(null)
    setSuccess(false)
    try {
      const updated = await updateRequest(request.id || id, {
        status: form.status,
        appointmentDate: form.appointmentDate || null,
        appointmentTime: form.appointmentTime || null,
      })
      setRequest((prev) => ({ ...(prev || {}), ...(updated || {}), status: updated?.status || form.status, appointmentDate: updated?.appointmentDate ?? form.appointmentDate, appointmentTime: updated?.appointmentTime ?? form.appointmentTime }))
      setSuccess(true)
    } catch (err) {
      setActionError(err.message || 'Error al actualizar la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Detalle de solicitud" />
        <LoadingScreen message="Cargando solicitud..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Detalle de solicitud" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <p className="text-rose-700 font-medium">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" onClick={load} className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors">Reintentar</button>
            <Link to="/admin/solicitudes" className="inline-flex items-center justify-center py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors">Volver a solicitudes</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Detalle de solicitud" />
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Solicitud no encontrada</h2>
          <p className="text-slate-500 mb-6">La solicitud no existe o no está disponible.</p>
          <Link to="/admin/solicitudes" className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors">Volver a solicitudes</Link>
        </div>
      </div>
    )
  }

  const clientName = getClientName(request)
  const inputClass = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <AdminPageHeader title={`Solicitud ${request.id}`} />
        <Link to="/admin/solicitudes" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">← Volver a solicitudes</Link>
      </div>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</p>
            <p className="text-base font-bold text-slate-900">{clientName}</p>
            {request.userId && <p className="text-sm text-slate-600">Usuario: {request.userId}</p>}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Servicio y mascota</p>
            <p className="text-sm text-slate-900 font-medium">{request.service?.name || request.serviceId || '-'}</p>
            <p className="text-sm text-slate-600">Mascota: {request.petName || '-'}{request.species ? ` (${request.species})` : ''}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fechas y estado</p>
            <p className="text-sm text-slate-600">Solicitada: <span className="font-medium text-slate-900">{formatDate(request.requestedDate)}</span></p>
            <p className="text-sm text-slate-600">Creada: <span className="font-medium text-slate-900">{formatDate(request.createdAt)}</span></p>
            <div className="pt-1"><StatusBadge status={request.status} /></div>
          </div>
        </div>

        {request.comment ? (
          <div className="p-6 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Comentarios</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{request.comment}</p>
          </div>
        ) : null}

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Actualizar solicitud</h3>

          {actionError && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{actionError}</div>}
          {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Solicitud actualizada correctamente.</div>}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="estado" className="text-xs font-semibold text-slate-700">Estado</label>
              <select id="estado" value={form.status} onChange={(e) => { setForm((p) => ({ ...p, status: e.target.value })); setSuccess(false) }} disabled={saving} className={inputClass}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fecha-cita" className="text-xs font-semibold text-slate-700">Fecha de cita</label>
              <input id="fecha-cita" type="date" value={form.appointmentDate} onChange={(e) => { setForm((p) => ({ ...p, appointmentDate: e.target.value })); setSuccess(false) }} disabled={saving} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="hora-cita" className="text-xs font-semibold text-slate-700">Hora de cita</label>
              <input id="hora-cita" type="time" value={form.appointmentTime} onChange={(e) => { setForm((p) => ({ ...p, appointmentTime: e.target.value })); setSuccess(false) }} disabled={saving} className={inputClass} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
