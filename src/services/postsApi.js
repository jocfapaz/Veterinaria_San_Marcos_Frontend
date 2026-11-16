import { get } from './api.js'
import { normalizeImagePath } from '../utils/imageUrl.js'

function toArray(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.posts)) return data.posts
  if (Array.isArray(data?.publicaciones)) return data.publicaciones
  return []
}

function parseContent(contenido) {
  if (Array.isArray(contenido)) return contenido
  if (typeof contenido === 'string') {
    try {
      const parsed = JSON.parse(contenido)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return [{ type: 'paragraph', text: contenido }]
    }
  }
  return []
}

export function mapPost(dto = {}) {
  const raw = dto?.data ?? dto?.post ?? dto?.publicacion ?? dto
  const d = raw && typeof raw === 'object' ? raw : dto

  return {
    id: d.id ?? d._id,
    slug: d.slug || '',
    title: d.titulo || '',
    category: d.categoria || '',
    excerpt: d.extracto || '',
    image: normalizeImagePath(d.imagen || ''),
    alt: d.alt || d.title || '',
    date: d.fecha || d.createdAt || '',
    content: parseContent(d.contenido),
    published: d.publicado ?? true,
    createdAt: d.createdAt || '',
    updatedAt: d.updatedAt || '',
  }
}

export async function listPosts() {
  const data = await get('/posts')
  return toArray(data).map(mapPost)
}

export async function getPostBySlug(slug) {
  const data = await get(`/posts/${encodeURIComponent(slug)}`)
  return data ? mapPost(data) : null
}
