import { createOrder, mapOrder } from './ordersApi.js'

describe('ordersApi', () => {
  beforeEach(() => {
    localStorage.clear()
    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        status: 201,
        headers: new Map(),
        json: () =>
          Promise.resolve({
            id: 1,
            numeroOrden: 'ORD-0001',
            estado: 'PAGADA',
            total: 1000,
            tipoEntrega: 'ENVIO',
            detalles: [],
          }),
      })
    )
  })

  function lastCallBody() {
    return JSON.parse(window.fetch.calls.mostRecent().args[1].body)
  }

  it('envía tipoEntrega como enum del backend (ENVIO/RETIRO)', async () => {
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
})
