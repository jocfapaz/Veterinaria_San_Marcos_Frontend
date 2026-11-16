export function normalizeImagePath(path) {
  if (!path) return ''
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }
  let clean = path
  if (clean.startsWith('/assets/')) {
    clean = clean.slice('/assets/'.length)
  } else if (clean.startsWith('assets/')) {
    clean = clean.slice('assets/'.length)
  }
  return clean.startsWith('/') ? clean : `/${clean}`
}
