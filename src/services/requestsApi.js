import { get, post, patch, put } from './api.js'

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

function mapService(dto = {}) {
  const s = dto?.servicio ?? dto?.service ?? dto
  if (!s || typeof s !== 'object') return null
  return {
    id: s.id ?? s._id ?? dto.serviceId ?? dto.servicioId ?? null,
    name: s.name ?? s.nombre ?? dto.serviceName ?? dto.nombreServicio ?? '',
    price: Number(s.price ?? s.precio ?? s.costo ?? dto.price ?? dto.precio ?? 0) || 0,
    category: s.category ?? s.categoria ?? '',
    duration: s.duration ?? s.duracion ?? '',
  }
}

export function mapRequest(dto = {}) {
  const raw = dto?.data ?? dto?.solicitud ?? dto?.request ?? dto
  const d = raw && typeof raw === 'object' ? raw : {}
  const service = mapService(d) || {
    id: d.serviceId ?? d.servicioId ?? null,
    name: d.serviceName ?? d.nombreServicio ?? '',
    price: Number(d.price ?? d.precio ?? d.costo ?? 0) || 0,
    category: d.serviceCategory ?? d.categoriaServicio ?? '',
    duration: d.serviceDuration ?? d.duracionServicio ?? '',
  }
  const createdAt = d.createdAt ?? d.fechaCreacion ?? d.fecha ?? d.fechaSolicitud ?? null
  const requestedDate = d.requestedDate ?? d.fechaSolicitada ?? d.fechaPreferida ?? d.preferredDate ?? d.fechaDeseada ?? null
  const appointmentDate = d.appointmentDate ?? d.fechaCita ?? d.fechaProgramada ?? d.scheduledDate ?? null
  const appointmentTime = d.appointmentTime ?? d.horaCita ?? d.horaProgramada ?? d.scheduledTime ?? null
  const comment = d.comment ?? d.comentario ?? d.comentarios ?? d.notes ?? d.notas ?? d.observaciones ?? ''
  return {
    id: d.id ?? d._id ?? d.codigo ?? d.requestNumber ?? null,
    userId: d.userId ?? d.usuarioId ?? d.clientId ?? d.clienteId ?? null,
    serviceId: service.id ?? d.serviceId ?? d.servicioId ?? null,
    service,
    petName: d.petName ?? d.nombreMascota ?? d.mascota ?? '',
    species: d.species ?? d.especie ?? '',
    requestedDate,
    appointmentDate,
    appointmentTime,
    createdAt,
    comment,
    status: normalizeStatus(d.status ?? d.estado),
  }
}

export async function listMyRequests() {
  try {
    const data = await get('/solicitudes/mis-solicitudes')
    return toArray(data).map(mapRequest)
  } catch {
    const data = await get('/solicitudes')
    return toArray(data).map(mapRequest)
  }
}

export async function createRequest(payload = {}) {
  const body = {
    servicioId: payload.serviceId,
    serviceId: payload.serviceId,
    usuarioId: payload.userId,
    userId: payload.userId,
    nombreMascota: payload.petName,
    petName: payload.petName,
    mascota: payload.petName,
    especie: payload.species,
    species: payload.species,
    fechaSolicitada: payload.requestedDate,
    requestedDate: payload.requestedDate,
    fechaPreferida: payload.requestedDate,
    preferredDate: payload.requestedDate,
  }
  const data = await post('/solicitudes', body)
  const raw = data?.data ?? data?.solicitud ?? data?.request ?? data
  return mapRequest(raw && typeof raw === 'object' ? raw : {})
}

export async function listRequests() {
  const data = await get('/solicitudes')
  return toArray(data).map(mapRequest)
}

export async function getRequestById(id) {
  const data = await get(`/solicitudes/${id}`)
  const raw = data?.data ?? data?.solicitud ?? data?.request ?? data
  if (!raw || (typeof raw === 'object' && !raw.id && !raw._id && !raw.codigo && !raw.requestNumber)) {
    return null
  }
  return mapRequest(raw)
}

export async function updateRequest(id, payload = {}) {
  const body = {
    status: payload.status,
    estado: payload.status ?? payload.estado,
    appointmentDate: payload.appointmentDate,
    fechaCita: payload.appointmentDate,
    fechaProgramada: payload.appointmentDate,
    appointmentTime: payload.appointmentTime,
    horaCita: payload.appointmentTime,
    horaProgramada: payload.appointmentTime,
  }
  try {
    const data = await patch(`/solicitudes/${id}`, body)
    const raw = data?.data ?? data?.solicitud ?? data?.request ?? data
    return raw && typeof raw === 'object' ? mapRequest(raw) : { id, ...payload }
  } catch {
    const data = await put(`/solicitudes/${id}`, body)
    const raw = data?.data ?? data?.solicitud ?? data?.request ?? data
    return raw && typeof raw === 'object' ? mapRequest(raw) : { id, ...payload }
  }
}

export async function cancelRequest(id) {
  const payload = { status: 'cancelled', estado: 'cancelled' }
  try {
    const data = await patch(`/solicitudes/${id}/cancelar`, payload)
    const raw = data?.data ?? data?.solicitud ?? data?.request ?? data
    return raw && typeof raw === 'object' ? mapRequest(raw) : { id, status: 'cancelled' }
  } catch {
    try {
      const data = await patch(`/solicitudes/${id}`, payload)
      const raw = data?.data ?? data?.solicitud ?? data?.request ?? data
      return raw && typeof raw === 'object' ? mapRequest(raw) : { id, status: 'cancelled' }
    } catch {
      const data = await put(`/solicitudes/${id}`, payload)
      const raw = data?.data ?? data?.solicitud ?? data?.request ?? data
      return raw && typeof raw === 'object' ? mapRequest(raw) : { id, status: 'cancelled' }
    }
  }
}
