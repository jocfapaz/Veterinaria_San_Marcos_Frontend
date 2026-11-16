export function formatPrice(amount) {
  const value = Number(amount) || 0
  return `$${value.toLocaleString('es-CL')}`
}

export function calculateDiscountedPrice(price, discount) {
  const p = Number(price) || 0
  const d = Number(discount) || 0
  return Math.round(p * (1 - d / 100))
}
