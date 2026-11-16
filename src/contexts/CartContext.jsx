/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getProductById } from '../services/productsApi.js'
import { createOrder as createOrderApi } from '../services/ordersApi.js'
import { calculateDiscountedPrice } from '../utils/format.js'

const CartContext = createContext(null)
const STORAGE_KEY = 'vsm_cart'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [details, setDetails] = useState({})
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    let active = true
    ;(async () => {
      const ids = [...new Set(items.map((i) => i.productId).filter(Boolean))]
      if (ids.length === 0) {
        if (active) {
          setDetails({})
          setDetailsLoading(false)
          setDetailsError(null)
        }
        return
      }
      setDetailsLoading(true)
      setDetailsError(null)
      try {
        const results = await Promise.allSettled(ids.map((id) => getProductById(id)))
        if (!active) return
        const next = {}
        let hadError = false
        results.forEach((res, idx) => {
          const id = ids[idx]
          if (res.status === 'fulfilled' && res.value) {
            next[id] = res.value
          } else {
            hadError = true
          }
        })
        setDetails((prev) => {
          const merged = { ...prev }
          ids.forEach((id) => {
            if (next[id]) merged[id] = next[id]
          })
          return merged
        })
        if (hadError && Object.keys(next).length === 0) {
          setDetailsError('No se pudieron cargar los productos del carrito.')
        }
      } catch (err) {
        if (active) setDetailsError(err.message || 'Error al cargar el carrito.')
      } finally {
        if (active) setDetailsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [items])

  function addToCart(productId, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((item) => String(item.productId) === String(productId))
      if (existing) {
        return prev.map((item) =>
          String(item.productId) === String(productId)
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }
      return [...prev, { productId, quantity }]
    })
  }

  function removeFromCart(productId) {
    setItems((prev) => prev.filter((item) => String(item.productId) !== String(productId)))
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        String(item.productId) === String(productId) ? { ...item, quantity } : item,
      ),
    )
  }

  function clearCart() {
    setItems([])
  }

  const enrichedItems = useMemo(
    () =>
      items.map((item) => {
        const product = details[item.productId] || details[String(item.productId)] || null
        const unitPrice = product
          ? calculateDiscountedPrice(product.price, product.discount)
          : 0
        return {
          ...item,
          product,
          unitPrice,
          subtotal: unitPrice * item.quantity,
        }
      }),
    [items, details],
  )

  const cartTotal = useMemo(
    () => enrichedItems.reduce((sum, item) => sum + (item.subtotal || 0), 0),
    [enrichedItems],
  )

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  async function checkout({ userId, shippingAddress, instructions = '', customer, deliveryType } = {}) {
    const displayItems = enrichedItems.map((it) => ({
      productId: it.productId,
      name: it.product?.name || 'Producto',
      price: Number(it.product?.price) || 0,
      discount: Number(it.product?.discount) || 0,
      quantity: it.quantity,
      subtotal: it.subtotal,
      image: it.product?.image || '',
    }))
    const order = await createOrderApi({
      userId,
      items,
      displayItems,
      shippingAddress,
      instructions,
      customer,
      deliveryType,
    })
    setItems([])
    return order
  }

  const value = {
    items,
    enrichedItems,
    cartCount,
    cartTotal,
    detailsLoading,
    detailsError,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkout,
    isReady: true,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
