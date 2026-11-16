import { useState } from 'react'
import { useRequests } from '../contexts/RequestContext.jsx'
import { formatPrice } from '../utils/format.js'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import LoadingScreen from '../components/LoadingScreen'

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Completada',
}

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  completed: 'bg-sky-50 text-sky-700 border-sky-200',
}

function formatDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('es-CL')
}

function formatDateTime(date, time) {
  const d = formatDate(date)
  if (!d) return null
  return time ? `${d} ${time}` : d
}

export default function MiSolicitudPage() {
  const { requests, loading, error, cancelRequest, refreshRequests } = useRequests()
  const [cancellingId, setCancellingId] = useState(null)
  const [actionError, setActionError] = useState(null)

  async function handleCancel(id) {
    if (!window.confirm('¿Seguro que deseas cancelar esta solicitud?')) return
    setCancellingId(id)
    setActionError(null)
    try {
      await cancelRequest(id)
    } catch (err) {
      setActionError(err.message || 'No se pudo cancelar la solicitud.')
    } finally {
      setCancellingId(null)
    }
  }

  if (loading && requests.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PageHeader
          title="Mis solicitudes"
          subtitle="Revisa el estado y detalle de las solicitudes de servicios."
        />
        <LoadingScreen message="Cargando solicitudes..." />
      </div>
    )
  }

  if (error && requests.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PageHeader
          title="Mis solicitudes"
          subtitle="Revisa el estado y detalle de las solicitudes de servicios."
        />
        <div className="mt-8 text-center py-16 bg-white rounded-2xl border border-rose-200 shadow-sm space-y-4">
          <h2 className="text-xl font-bold text-slate-900">No se pudieron cargar las solicitudes</h2>
          <p className="text-rose-600">{error}</p>
          <button
            type="button"
            onClick={refreshRequests}
            className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!loading && requests.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PageHeader
          title="Mis solicitudes"
          subtitle="Revisa el estado y detalle de las solicitudes de servicios."
        />
        <EmptyState
          title="No tienes solicitudes"
          message="Solicita un servicio para ver aquí su estado y seguimiento."
          actionLabel="Ver servicios"
          actionTo="/servicios"
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader
        title="Mis solicitudes"
        subtitle="Revisa el estado y detalle de las solicitudes de servicios."
      />

      {(error || actionError) && (
        <div className="mt-6 space-y-2">
          {error && (
            <div className="p-3 text-sm text-rose-800 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between gap-4">
              <span>{error}</span>
              <button type="button" onClick={refreshRequests} className="font-semibold underline underline-offset-2">
                Reintentar
              </button>
            </div>
          )}
          {actionError && (
            <div className="p-3 text-sm text-rose-800 rounded-lg bg-rose-50 border border-rose-200">
              {actionError}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 space-y-4">
        {requests.map((request) => {
          const status = request.status || 'pending'
          const serviceName = request.service?.name || 'Servicio'
          const servicePrice = request.service?.price
          const requested = formatDate(request.requestedDate)
          const created = formatDate(request.createdAt)
          const appointment = formatDateTime(request.appointmentDate, request.appointmentTime)
          const canCancel = status === 'pending' || status === 'confirmed'
          const isCancelling = String(cancellingId) === String(request.id)

          return (
            <article
              key={request.id ?? `${serviceName}-${request.createdAt}`}
              className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{serviceName}</h2>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
                    >
                      {STATUS_LABELS[status] || status}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600 space-y-1">
                    {(request.petName || request.species) && (
                      <p>
                        <span className="font-medium text-slate-700">Mascota:</span>{' '}
                        {request.petName || '—'}
                        {request.species ? ` (${request.species})` : ''}
                      </p>
                    )}
                    {requested && (
                      <p>
                        <span className="font-medium text-slate-700">Fecha solicitada:</span> {requested}
                      </p>
                    )}
                    {appointment && (
                      <p>
                        <span className="font-medium text-slate-700">Cita programada:</span> {appointment}
                      </p>
                    )}
                    {created && (
                      <p>
                        <span className="font-medium text-slate-700">Creada:</span> {created}
                      </p>
                    )}
                    {request.comment ? (
                      <p className="whitespace-pre-wrap">
                        <span className="font-medium text-slate-700">Comentarios:</span> {request.comment}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
                  {servicePrice != null && servicePrice !== '' && (
                    <p className="font-extrabold text-slate-900 text-lg">{formatPrice(servicePrice)}</p>
                  )}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => handleCancel(request.id)}
                      disabled={isCancelling}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isCancelling ? 'Cancelando...' : 'Cancelar solicitud'}
                    </button>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
