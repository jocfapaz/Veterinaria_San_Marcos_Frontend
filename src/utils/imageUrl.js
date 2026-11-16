export function normalizeImagePath(path) {
  if (!path) return ''
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }
  return path.startsWith('/') ? path : `/${path}`
}
