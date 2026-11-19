import {
  createOrder,
  getOrderById,
  isStockInsufficientError,
  listMyOrders,
  listOrders,
  mapOrder,
  updateOrderStatus,
} from './ordersApi.js'

describe('ordersApi', () => {
  beforeEach(() => {
    localStorage.clear()
    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Map(),
        json: () => Promise.resolve({}),
      })
    )
  })

  function respondWith(data, status = 200) {
    window.fetch.and.returnValue(
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        statusText: 'OK',
        headers: new Map(),
        json: () => Promise.resolve(data),
      })
    )
  }

  function lastCallUrl() {
    return window.fetch.calls.mostRecent().args[0]
  }

  function lastCallBody() {
    return JSON.parse(window.fetch.calls.mostRecent().args[1].body)
  }

  function mappedItem(item, fallback) {
    return mapOrder({ detalles: [item] }, fallback ? { items: [fallback] } : {}).items[0]
  }

  it('envía tipoEntrega como enum del backend (ENVIO/RETIRO)', async () => {
    respondWith({ id: 1, numeroOrden: 'ORD-0001', estado: 'PAGADA', total: 1000, tipoEntrega: 'ENVIO', detalles: [] }, 201)

    await createOrder({
      items: [{ productId: 7, quantity: 2 }],
      deliveryType: 'envio',
      shippingAddress: 'Calle 1',
      customer: { firstName: 'Ana' },
    })

    expect(lastCallBody().tipoEntrega).toBe('ENVIO')
  })

  it('normaliza el enum del backend a minúsculas para la UI', () => {
    const order = mapOrder({ id: 2, tipoEntrega: 'RETIRO', direccionEnvio: 'Retiro en tienda' })

    expect(order.deliveryType).toBe('retiro')
  })

  it('mapea entregas y estados con nombres alternativos del backend', () => {
    const order = mapOrder({
      _id: 'abc',
      codigo: 'ORD-9',
      estado: 'PENDIENTE',
      montoTotal: '2500',
      fechaCreacion: '2026-01-01',
      direccion: 'Calle 2',
      indicaciones: 'Dejar en portería',
      cliente: { nombre: 'Luis' },
      tipoEntrega: 'ENVIO',
    })

    expect(order.id).toBe('abc')
    expect(order.orderNumber).toBe('ORD-9')
    expect(order.status).toBe('pendiente')
    expect(order.total).toBe(2500)
    expect(order.createdAt).toBe('2026-01-01')
    expect(order.shippingAddress).toBe('Calle 2')
    expect(order.instructions).toBe('Dejar en portería')
    expect(order.customer).toEqual({ nombre: 'Luis' })
    expect(order.deliveryType).toBe('envio')
  })

  it('usa valores por defecto cuando el dto viene vacío', () => {
    const order = mapOrder({})

    expect(order.id).toBeNull()
    expect(order.orderNumber).toBeNull()
    expect(order.status).toBe('paid')
    expect(order.total).toBe(0)
    expect(order.items).toEqual([])
    expect(order.shippingAddress).toBe('')
    expect(order.instructions).toBe('')
    expect(order.customer).toBeNull()
    expect(order.deliveryType).toBe('envio')
    expect(order.createdAt).toEqual(jasmine.any(String))
  })

  it('acepta items en array, items, lineas y detalles', () => {
    expect(mapOrder([{ id: 3, name: 'A', quantity: 1, price: 10 }]).items.length).toBe(1)
    expect(mapOrder({ items: [{ id: 4, name: 'B' }] }).items.length).toBe(1)
    expect(mapOrder({ lineas: [{ id: 5, name: 'C' }] }).items.length).toBe(1)
    expect(mapOrder({ detalles: [{ id: 6, name: 'D' }] }).items.length).toBe(1)
  })

  it('lee el pedido desde data, orden y order', () => {
    expect(mapOrder({ data: { id: 10 } }).id).toBe(10)
    expect(mapOrder({ orden: { id: 11 } }).id).toBe(11)
    expect(mapOrder({ order: { id: 12 } }).id).toBe(12)
  })

  it('suma los subtotales cuando el backend no envía el total', () => {
    const order = mapOrder({
      detalles: [
        { price: 100, quantity: 2, descuento: 10 },
        { precio: 50, cantidad: 1, subtotal: 40 },
      ],
    })

    expect(order.total).toBe(220)
  })

  it('mapea items con los nombres de producto del backend', () => {
    const first = mappedItem({
      producto: { id: 21, nombre: 'Producto A', precio: 100, descuento: 10, imagen: 'a.png' },
    })
    const second = mappedItem({
      product: { id: 22, name: 'Producto B', price: 200, discount: 20, image: 'b.png' },
    })
    const third = mappedItem({ quantity: 3, productId: 23, nombre: 'Producto C', imagen: 'c.png' })
    const fourth = mappedItem({ cantidad: 4, productoId: 24, name: 'Producto D', image: 'd.png' })

    expect(first.productId).toBe(21)
    expect(first.name).toBe('Producto A')
    expect(first.price).toBe(100)
    expect(first.discount).toBe(10)
    expect(first.image).toBe('a.png')
    expect(second.productId).toBe(22)
    expect(second.name).toBe('Producto B')
    expect(third.quantity).toBe(3)
    expect(third.productId).toBe(23)
    expect(fourth.quantity).toBe(4)
    expect(fourth.productId).toBe(24)
  })

  it('mapea items con precioUnitario, totalLinea y total', () => {
    expect(mappedItem({ precioUnitario: 90, totalLinea: 180 }).price).toBe(90)
    expect(mappedItem({ precioUnitario: 90, totalLinea: 180 }).subtotal).toBe(180)
    expect(mappedItem({ total: 77 }).subtotal).toBe(77)
    expect(mappedItem({ subtotal: '88' }).subtotal).toBe(88)
    expect(mappedItem({ subtotal: 'no-numero' }).subtotal).toBe(0)
  })

  it('aplica el fallback de items cuando el dto no trae detalles', () => {
    const fallback = { productId: 31, name: 'Desde carrito', price: 15, quantity: 2 }
    const order = mapOrder({}, { items: [fallback] })

    expect(order.items[0]).toEqual(fallback)
  })

  it('usa el fallback para quantity, price, discount, productId, name e image', () => {
    const item = mappedItem(
      { producto: { id: 41, nombre: 'P', price: 10, descuento: 5, imagen: 'p.png' } },
      { quantity: 6, price: 20, discount: 8, productId: 42, name: 'Fallback', image: 'f.png' }
    )

    expect(item.quantity).toBe(6)
    expect(item.price).toBe(10)
    expect(item.subtotal).toBe(60)
    expect(item.productId).toBe(41)
  })

  it('listMyOrders acepta las distintas formas de respuesta del backend', async () => {
    respondWith([{ id: 1 }])
    expect((await listMyOrders())[0].id).toBe(1)
    expect(lastCallUrl()).toMatch(/\/orders\/me$/)

    respondWith({ content: [{ id: 2 }] })
    expect((await listMyOrders())[0].id).toBe(2)

    respondWith({ data: [{ id: 3 }] })
    expect((await listMyOrders())[0].id).toBe(3)

    respondWith({ items: [{ id: 4 }] })
    expect((await listMyOrders())[0].id).toBe(4)

    respondWith({ ordenes: [{ id: 5 }] })
    expect((await listMyOrders())[0].id).toBe(5)

    respondWith({ orders: [{ id: 6 }] })
    expect((await listMyOrders())[0].id).toBe(6)
  })

  it('listMyOrders reconoce data.content y data.ordenes', async () => {
    respondWith({ data: { content: [{ id: 7 }] } })
    expect((await listMyOrders())[0].id).toBe(7)

    respondWith({ data: { ordenes: [{ id: 8 }] } })
    expect((await listMyOrders())[0].id).toBe(8)

    respondWith({})
    expect(await listMyOrders()).toEqual([])
  })

  it('listOrders usa el endpoint de administración', async () => {
    respondWith([{ id: 9 }])
    expect((await listOrders())[0].id).toBe(9)
    expect(lastCallUrl()).toMatch(/\/orders$/)
  })

  it('getOrderById acepta data, orden, order y raw, y devuelve null si no hay pedido', async () => {
    respondWith({ data: { id: 10 } })
    expect((await getOrderById(10)).id).toBe(10)
    expect(lastCallUrl()).toMatch(/\/orders\/10$/)

    respondWith({ orden: { id: 11 } })
    expect((await getOrderById(11)).id).toBe(11)

    respondWith({ order: { id: 12 } })
    expect((await getOrderById(12)).id).toBe(12)

    respondWith({ _id: 13 })
    expect((await getOrderById(13)).id).toBe(13)

    respondWith({ numeroOrden: 'ORD-14' })
    expect((await getOrderById(14)).orderNumber).toBe('ORD-14')

    respondWith({ orderNumber: 'ORD-15' })
    expect((await getOrderById(15)).orderNumber).toBe('ORD-15')

    respondWith({ items: [{ id: 1 }] })
    expect((await getOrderById(16)).items.length).toBe(1)

    respondWith({ detalles: [{ id: 2 }] })
    expect((await getOrderById(17)).items.length).toBe(1)

    respondWith(null)
    expect(await getOrderById(18)).toBeNull()

    respondWith({})
    expect(await getOrderById(19)).toBeNull()
  })

  it('updateOrderStatus mapea la respuesta y usa el fallback si está vacía', async () => {
    respondWith({ data: { id: 20, estado: 'PAGADA' } })
    expect((await updateOrderStatus(20, 'pagada')).status).toBe('pagada')
    expect(lastCallBody()).toEqual({ estado: 'pagada' })

    respondWith({ orden: { id: 21, estado: 'ENVIADA' } })
    expect((await updateOrderStatus(21, 'enviada')).id).toBe(21)

    respondWith({ order: { id: 22, estado: 'ENTREGADA' } })
    expect((await updateOrderStatus(22, 'entregada')).id).toBe(22)

    respondWith({ id: 23, estado: 'CANCELADA' })
    expect((await updateOrderStatus(23, 'cancelada')).id).toBe(23)

    respondWith(null)
    expect(await updateOrderStatus(24, 'pendiente')).toEqual({ id: 24, status: 'pendiente' })
  })

  it('createOrder construye el payload completo del backend', async () => {
    respondWith({ id: 25, tipoEntrega: 'RETIRO' }, 201)

    const order = await createOrder({
      items: [{ productId: 1, quantity: 2 }],
      deliveryType: 'retiro',
      shippingAddress: 'Calle 3',
      instructions: 'Sin cebolla',
      customer: {
        firstName: 'Ana',
        lastName: 'Pérez',
        email: 'ana@correo.cl',
        phone: '+56912345678',
      },
      displayItems: [{ name: 'Producto', price: 10, quantity: 2 }],
    })

    expect(lastCallBody()).toEqual({
      direccionEnvio: 'Calle 3',
      tipoEntrega: 'RETIRO',
      instrucciones: 'Sin cebolla',
      contactoNombre: 'Ana',
      contactoApellido: 'Pérez',
      contactoEmail: 'ana@correo.cl',
      contactoTelefono: '+56912345678',
      items: [{ productoId: 1, cantidad: 2 }],
    })
    expect(order.deliveryType).toBe('retiro')
    expect(order.instructions).toBe('Sin cebolla')
  })

  it('createOrder usa valores por defecto y respeta el enum ya en mayúsculas', async () => {
    respondWith({ id: 26 }, 201)

    await createOrder({ deliveryType: 'ENVIO' })

    expect(lastCallBody()).toEqual({
      tipoEntrega: 'ENVIO',
      instrucciones: '',
      contactoNombre: '',
      contactoApellido: '',
      contactoEmail: '',
      contactoTelefono: '',
      items: [],
    })
    expect(JSON.stringify(lastCallBody()).includes('direccionEnvio')).toBeFalse()
  })

  it('isStockInsufficientError detecta estados y mensajes de stock', () => {
    expect(isStockInsufficientError({ status: 409 })).toBeTrue()
    expect(isStockInsufficientError({ response: { status: 422 } })).toBeTrue()
    expect(isStockInsufficientError({ message: 'Stock insuficiente' })).toBeTrue()
    expect(isStockInsufficientError({ message: 'Producto agotado' })).toBeTrue()
    expect(isStockInsufficientError({ message: 'Sin disponibilidad' })).toBeTrue()
    expect(isStockInsufficientError({ message: 'Error en el pago' })).toBeFalse()
    expect(isStockInsufficientError()).toBeFalse()
  })
})
