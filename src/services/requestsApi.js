import { get, post, patch } from './api.js'

function toArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.solicitudes)) return data.solicitudes
  if (Array.isArray(data?.requests)) return data.requests
  if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    if (Array.isArray(data.data.content)) return data.data.content
    if (Array.isArray(data.data.solicitudes)) return data.data.solicitudes
    if (Array.isArray(data.data.requests)) return data.data.requests
  }
  return []
}

function normalizeStatus(status) {
  const s = String(status ?? '').toLowerCase().trim()
  if (!s) return 'pending'
  if (['pending', 'pendiente', 'pendientes'].includes(s)) return 'pending'
  if (['confirmed', 'confirmada', 'confirmado', 'aprobada', 'aprobado', 'accepted'].includes(s)) return 'confirmed'
  if (['cancelled', 'canceled', 'cancelada', 'cancelado', 'rechazada', 'rechazado', 'rejected'].includes(s)) return 'cancelled'
  if (['completed', 'completada', 'completado', 'atendida', 'atendido', 'done'].includes(s)) return 'completed'
  return s
}

function statusToBackend(status) {
  const map = {
    pending: 'PENDIENTE',
    confirmed: 'CONFIRMADA',
    completed: 'COMPLETADA',
    cancelled: 'CANCELADA',
  }
  return map[normalizeStatus(status)] || 'PENDIENTE'
}

export function mapRequest(dto = {}) {
  const raw = dto?.data ?? dto?.solicitud ?? dto?.request ?? dto
  const d = raw && typeof raw === 'object' ? raw : {}
  const createdAt = d.createdAt ?? d.fechaCreacion ?? null
  const requestedDate = d.fechaSolicitada ?? d.requestedDate ?? null
  const appointmentDate = d.fechaCita ?? d.appointmentDate ?? null
  const appointmentTime = d.horaCita ?? d.appointmentTime ?? null
  const comment = d.comentario ?? d.comment ?? ''
  return {
    id: d.id ?? d._id ?? null,
    userId: d.usuarioId ?? d.userId ?? null,
    userName: d.usuarioNombre ?? d.userName ?? '',
    serviceId: d.servicioId ?? d.serviceId ?? null,
    serviceName: d.servicioNombre ?? d.serviceName ?? '',
    petId: d.mascotaId ?? d.petId ?? null,
    petName: d.mascotaNombre ?? d.petName ?? '',
    species: d.especie ?? d.species ?? '',
    requestedDate,
    appointmentDate,
    appointmentTime,
    createdAt,
    comment,
    status: normalizeStatus(d.estado ?? d.status),
  }
}

export async function listMyRequests() {
  const data = await get('/service-requests/me')
  return toArray(data).map(mapRequest)
}

export async function createRequest(payload = {}) {
  const body = {
    servicioId: payload.serviceId,
    mascotaNombre: payload.petName,
    especie: payload.species,
    fechaSolicitada: payload.requestedDate,
    comentario: payload.comment || '',
  }
  const data = await post('/service-requests', body)
  return mapRequest(data)
}

export async function listRequests() {
  const data = await get('/service-requests')
  return toArray(data).map(mapRequest)
}

export async function getRequestById(id) {
  const data = await get(`/service-requests/${id}`)
  return mapRequest(data)
}

export async function updateRequestStatus(id, status) {
  const data = await patch(`/service-requests/${id}/status`, { estado: statusToBackend(status) })
  return mapRequest(data)
}

export async function updateRequestAppointment(id, appointmentDate, appointmentTime) {
  const data = await patch(`/service-requests/${id}/date-time`, {
    fechaCita: appointmentDate,
    horaCita: appointmentTime,
  })
  return mapRequest(data)
}

export async function updateRequestComment(id, comment) {
  const data = await patch(`/service-requests/${id}/comment`, { comentario: comment })
  return mapRequest(data)
}

export async function updateRequest(id, payload = {}) {
  let result = {}

  if (payload.status != null) {
    result = await updateRequestStatus(id, payload.status)
  }

  if (payload.appointmentDate != null || payload.appointmentTime != null) {
    const updated = await updateRequestAppointment(
      id,
      payload.appointmentDate,
      payload.appointmentTime,
    )
    result = { ...result, ...updated }
  }

  if (payload.comment != null) {
    const updated = await updateRequestComment(id, payload.comment)
    result = { ...result, ...updated }
  }

  return result
}

export async function cancelRequest(id) {
  const data = await patch(`/service-requests/${id}/cancel`)
  return mapRequest(data)
}
