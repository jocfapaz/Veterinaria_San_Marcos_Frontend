const PENDING = {
  label: 'Pendiente',
  class: 'bg-amber-100 text-amber-700 border-amber-200',
}

export default function StatusBadge({ status }) {
  // El backend devuelve PAGADA, EN_PREPARACION, etc. y mapOrder lo pasa a
  // minúsculas. Se mantienen los alias en inglés por compatibilidad.
  const map = {
    pending: PENDING,
    confirmed: {
      label: 'Confirmada',
      class: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    completed: {
      label: 'Completada',
      class: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    cancelled: {
      label: 'Cancelada',
      class: 'bg-slate-100 text-slate-500 border-slate-200',
    },
    cancelada: {
      label: 'Cancelada',
      class: 'bg-slate-100 text-slate-500 border-slate-200',
    },
    paid: {
      label: 'Pagada',
      class: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    pagada: {
      label: 'Pagada',
      class: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    processing: {
      label: 'En preparación',
      class: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    en_preparacion: {
      label: 'En preparación',
      class: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    shipped: {
      label: 'Enviada',
      class: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
    enviada: {
      label: 'Enviada',
      class: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
    delivered: {
      label: 'Entregada',
      class: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    entregada: {
      label: 'Entregada',
      class: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  }
  const config = map[status] || PENDING
  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${config.class}`}
    >
      {config.label}
    </span>
  )
}
