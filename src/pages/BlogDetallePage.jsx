import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getPostBySlug } from '../services/postsApi.js'
import { normalizeImagePath } from '../utils/imageUrl.js'
import Breadcrumbs from '../components/Breadcrumbs'
import LoadingScreen from '../components/LoadingScreen'

export default function BlogDetallePage() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getPostBySlug(slug)
      setPost(data)
    } catch (err) {
      setError(err.message || 'Error al cargar el artículo.')
      setPost(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getPostBySlug(slug)
        if (active) setPost(data)
      } catch (err) {
        if (active) {
          setError(err.message || 'Error al cargar el artículo.')
          setPost(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs
          items={[
            { label: 'Inicio', to: '/' },
            { label: 'Blog', to: '/blog' },
            { label: 'Cargando...' },
          ]}
        />
        <LoadingScreen message="Cargando artículo..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs
          items={[
            { label: 'Inicio', to: '/' },
            { label: 'Blog', to: '/blog' },
            { label: 'Error' },
          ]}
        />
        <div className="mt-8 text-center py-16 bg-white rounded-2xl border border-rose-200 shadow-sm space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">No se pudo cargar el artículo</h1>
          <p className="text-rose-600">{error}</p>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumbs
          items={[
            { label: 'Inicio', to: '/' },
            { label: 'Blog', to: '/blog' },
            { label: 'Artículo no encontrado' },
          ]}
        />
        <div className="mt-8 text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Artículo no encontrado
          </h1>
          <p className="text-slate-500 mb-6">
            El artículo que buscas no existe o fue eliminado.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors"
          >
            Volver al blog
          </Link>
        </div>
      </div>
    )
  }

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const imageSrc = normalizeImagePath(post.image)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Inicio', to: '/' },
          { label: 'Blog', to: '/blog' },
          { label: post.title },
        ]}
      />

      <article className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
            {post.category}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {post.title}
          </h1>
          <p className="text-slate-400 text-sm">{formattedDate}</p>
        </div>

        {imageSrc && (
          <div className="overflow-hidden rounded-xl border border-slate-100 shadow-inner">
            <img
              src={imageSrc}
              alt={post.alt || post.title}
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}

        <div className="space-y-4 text-slate-600 leading-relaxed text-base sm:text-lg">
          {Array.isArray(post.content) && post.content.map((block, index) => {
            if (block.type === 'callout') {
              return (
                <div
                  key={index}
                  className="bg-emerald-50/60 border-l-4 border-emerald-500 p-4 rounded-r-lg text-emerald-900 text-sm sm:text-base"
                >
                  <p>{block.text}</p>
                  <Link
                    to="/servicios"
                    className="inline-block mt-2 font-semibold text-emerald-700 underline hover:text-emerald-800"
                  >
                    Ver servicios
                  </Link>
                </div>
              )
            }

            return <p key={index}>{block.text}</p>
          })}
        </div>
      </article>
    </div>
  )
}
