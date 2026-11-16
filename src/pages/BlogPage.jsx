import { useEffect, useState } from 'react'
import { listPosts } from '../services/postsApi.js'
import BlogCard from '../components/BlogCard'
import LoadingScreen from '../components/LoadingScreen'

export default function BlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listPosts()
      setPosts(data)
    } catch (err) {
      setError(err.message || 'Error al cargar los artículos.')
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
        const data = await listPosts()
        if (active) setPosts(data)
      } catch (err) {
        if (active) setError(err.message || 'Error al cargar los artículos.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50 text-slate-800 antialiased">
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <section className="seccion-blogs space-y-8">
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Consejos de cuidado
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Artículos y recomendaciones de nuestro equipo profesional para la
              salud de tu mascota.
            </p>
          </div>

          {loading && <LoadingScreen message="Cargando artículos..." />}

          {!loading && error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
              <p className="text-rose-700 font-medium">{error}</p>
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No hay artículos disponibles.
            </div>
          )}

          {!loading && !error && posts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {posts.map((post) => (
                <BlogCard
                  key={post.id}
                  slug={post.slug}
                  title={post.title}
                  category={post.category}
                  excerpt={post.excerpt}
                  image={post.image}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
