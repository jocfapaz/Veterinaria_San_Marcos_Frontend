import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { REGIONS, COMMUNES_BY_REGION } from '../mockDB.js'
import { formatPrice } from '../utils/format.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useCart } from '../contexts/CartContext.jsx'
import { createOrder, isStockInsufficientError } from '../services/ordersApi.js'
import { saveLastOrder } from '../utils/lastOrder.js'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import FormInput from '../components/admin/FormInput'
import FormSelect from '../components/admin/FormSelect'
import Button from '../components/Button'
import LoadingScreen from '../components/LoadingScreen'

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  region: '',
  commune: '',
  address: '',
  addressDetail: '',
  deliveryType: 'envio',
  instructions: '',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^(\+?56\s?)?9\s?\d{4}\s?\d{4}$/

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { items, enrichedItems, cartTotal, detailsLoading, clearCart } = useCart()

  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    region: currentUser?.region || '',
    commune: currentUser?.commune || '',
    address: currentUser?.address || '',
  }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [stockError, setStockError] = useState(null)

  const communes = form.region ? COMMUNES_BY_REGION[form.region] || [] : []
  const isDelivery = form.deliveryType === 'envio'

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'region') next.commune = ''
      return next
    })
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setSubmitError(null)
    setStockError(null)
  }

  function validate() {
    const next = {}
    if (!form.firstName.trim()) next.firstName = 'Ingresa tu nombre'
    if (!form.lastName.trim()) next.lastName = 'Ingresa tu apellido'
    if (!form.email.trim()) next.email = 'Ingresa tu correo'
    else if (!EMAIL_REGEX.test(form.email)) next.email = 'Correo no válido'
    if (!form.phone.trim()) next.phone = 'Ingresa tu teléfono'
    else if (!PHONE_REGEX.test(form.phone.trim()))
      next.phone = 'Formato: +56 9 1234 5678'

    if (isDelivery) {
      if (!form.region) next.region = 'Selecciona tu región'
      if (!form.commune) next.commune = 'Selecciona tu comuna'
      if (!form.address.trim()) next.address = 'Ingresa tu dirección'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function buildShippingAddress() {
    return isDelivery
      ? `${form.address}${form.addressDetail ? ` (${form.addressDetail})` : ''}, ${form.commune}, ${form.region}`
      : 'Retiro en tienda'
  }

  function buildDisplayItems() {
    return enrichedItems.map((it) => ({
      productId: it.productId,
      name: it.product?.name || 'Producto',
      price: Number(it.product?.price) || 0,
      discount: Number(it.product?.discount) || 0,
      quantity: it.quantity,
      subtotal: it.subtotal,
      image: it.product?.image || '',
    }))
  }

  async function handlePay() {
    if (!validate() || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    setStockError(null)

    const shippingAddress = buildShippingAddress()
    const customer = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
    }
    const displayItems = buildDisplayItems()

    try {
      const order = await createOrder({
        userId: currentUser?.id,
        items,
        displayItems,
        shippingAddress,
        instructions: form.instructions.trim(),
        customer,
        deliveryType: form.deliveryType,
      })
      const paidOrder = {
        ...order,
        status: 'paid',
        shippingAddress: order.shippingAddress || shippingAddress,
        instructions: order.instructions || form.instructions.trim(),
        customer: order.customer || customer,
        deliveryType: order.deliveryType || form.deliveryType,
      }
      saveLastOrder(paidOrder)
      clearCart()
      navigate('/pago/exito')
    } catch (err) {
      if (isStockInsufficientError(err)) {
        setStockError(err.message || 'Stock insuficiente para uno o más productos.')
      } else {
        setSubmitError(err.message || 'No se pudo procesar el pago. Intenta nuevamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleSimulateFailure() {
    if (!validate()) return
    const snapshot = {
      customer: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
      },
      deliveryType: form.deliveryType,
      shippingAddress: buildShippingAddress(),
      instructions: form.instructions.trim(),
      items: buildDisplayItems(),
      total: cartTotal,
      createdAt: new Date().toISOString(),
      orderNumber: null,
      status: 'failed',
      reason: 'La transacción fue rechazada por la entidad de pago.',
    }
    saveLastOrder(snapshot)
    navigate('/pago/error')
  }

  if (detailsLoading && enrichedItems.length > 0 && enrichedItems.every((it) => !it.product)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PageHeader title="Finalizar Compra" subtitle="Completa tus datos para confirmar el pedido." />
        <LoadingScreen message="Cargando checkout..." />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <PageHeader
          title="Finalizar Compra"
          subtitle="Completa tus datos para confirmar el pedido."
        />
        <EmptyState
          title="No hay productos para pagar"
          message="Agrega productos a tu carrito antes de iniciar el checkout."
          actionLabel="Ir a la tienda"
          actionTo="/tienda"
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader
        title="Finalizar Compra"
        subtitle="Completa tus datos personales, dirección de envío e indicaciones de entrega."
      />

      {(submitError || stockError) && (
        <div className={`mt-6 rounded-lg border p-4 text-sm ${stockError ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          <p className="font-semibold">{stockError ? 'Stock insuficiente' : 'Error en el pago'}</p>
          <p className="mt-1">{stockError || submitError}</p>
          {stockError && <p className="mt-2 text-xs">Ajusta las cantidades en tu carrito y vuelve a intentarlo. Tu carrito no se ha modificado.</p>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-8">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            handlePay()
          }}
          className="lg:col-span-2 space-y-6"
        >
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              1. Datos personales
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput id="firstName" name="firstName" label="Nombre" value={form.firstName} onChange={handleChange} error={errors.firstName} required />
              <FormInput id="lastName" name="lastName" label="Apellido" value={form.lastName} onChange={handleChange} error={errors.lastName} required />
              <FormInput id="email" name="email" type="email" label="Correo electrónico" value={form.email} onChange={handleChange} error={errors.email} required />
              <FormInput id="phone" name="phone" type="tel" label="Teléfono" placeholder="+56 9 1234 5678" value={form.phone} onChange={handleChange} error={errors.phone} required />
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              2. Dirección de envío
            </h2>

            <fieldset className="flex flex-wrap gap-3">
              <legend className="text-sm font-semibold text-slate-700 w-full mb-2">Tipo de entrega</legend>
              {[
                { value: 'envio', label: 'Envío a domicilio' },
                { value: 'retiro', label: 'Retiro en tienda' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                    form.deliveryType === option.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <input type="radio" name="deliveryType" value={option.value} checked={form.deliveryType === option.value} onChange={handleChange} className="accent-emerald-600" />
                  {option.label}
                </label>
              ))}
            </fieldset>

            {isDelivery ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <FormSelect id="region" name="region" label="Región" value={form.region} onChange={handleChange} error={errors.region} options={[{ value: '', label: 'Selecciona una región' }, ...REGIONS.map((region) => ({ value: region, label: region }))]} />
                <FormSelect id="commune" name="commune" label="Comuna" value={form.commune} onChange={handleChange} error={errors.commune} disabled={!form.region} options={[{ value: '', label: form.region ? 'Selecciona una comuna' : 'Primero elige una región' }, ...communes.map((c) => ({ value: c, label: c }))]} />
                <FormInput id="address" name="address" label="Dirección" placeholder="Calle y número" value={form.address} onChange={handleChange} error={errors.address} className="sm:col-span-2" required />
                <FormInput id="addressDetail" name="addressDetail" label="Detalle (opcional)" placeholder="Depto., casa, oficina" value={form.addressDetail} onChange={handleChange} className="sm:col-span-2" />
              </div>
            ) : (
              <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                Tu pedido se preparará para retiro en <strong>Av. San Marcos #1234, Rancagua</strong>. Te avisaremos por correo cuando esté listo.
              </p>
            )}
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              3. Indicaciones de entrega
            </h2>
            <label htmlFor="instructions" className="block text-sm font-semibold text-slate-700">
              Indicaciones para la entrega (opcional)
            </label>
            <textarea id="instructions" name="instructions" rows={4} value={form.instructions} onChange={handleChange} placeholder="Ej: Dejar el pedido en la portería, llamar al llegar, horario preferido..." className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
          </section>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" className="flex-1 py-3" disabled={submitting || detailsLoading}>
              {submitting ? 'Procesando...' : 'Confirmar y Pagar'}
            </Button>
            <button type="button" onClick={handleSimulateFailure} disabled={submitting} className="flex-1 py-3 px-4 font-semibold rounded-lg border border-rose-300 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors text-sm disabled:opacity-50">
              Simular pago fallido
            </button>
          </div>
        </form>

        <aside className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
            Resumen del pedido
          </h2>

          <ul className="space-y-3 text-sm text-slate-600">
            {enrichedItems.map((item) => {
              const name = item.product?.name || 'Producto'
              return (
                <li key={item.productId} className="flex justify-between gap-3">
                  <span>
                    {name}{' '}
                    <span className="text-slate-400">x{item.quantity}</span>
                  </span>
                  <span className="font-medium text-slate-800 whitespace-nowrap">
                    {formatPrice(item.subtotal)}
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="space-y-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal estimado</span>
              <span className="font-medium text-slate-800">{formatPrice(cartTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span className="text-emerald-600 font-medium">Gratis</span>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Total estimado</h3>
              <span className="text-2xl font-extrabold text-emerald-600">{formatPrice(cartTotal)}</span>
            </div>
            <p className="text-xs text-slate-400">El total final será calculado por el sistema al confirmar la compra.</p>
          </div>

          <Link to="/carrito" className="block text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline py-1">
            ← Volver al carrito
          </Link>
        </aside>
      </div>
    </div>
  )
}
