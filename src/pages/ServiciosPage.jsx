import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { listServices } from '../services/servicesApi.js'
import ServiceCard from '../components/ServiceCard'
import Button from '../components/Button'
import PageHeader from '../components/PageHeader'
import LoadingScreen from '../components/LoadingScreen'

export default function ServiciosPage() {
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState(['Todas'])
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await listServices()
        if (!active) return
        setServices(data)
        const cats = [...new Set(data.map((s) => s.category).filter(Boolean))]
        setCategories(['Todas', ...cats])
      } catch (err) {
        if (active) setError(err.message || 'Error al cargar los servicios.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const displayedServices =
    selectedCategory === 'Todas'
      ? services
      : services.filter((s) => s.category === selectedCategory)

  function handleAddToRequests(serviceId) {
    navigate(`/servicios/${serviceId}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <PageHeader
        title="Nuestros servicios"
        subtitle="Atención médica veterinaria profesional para todas las especies."
      />

      {loading && <LoadingScreen message="Cargando servicios..." />}

      {!loading && error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <p className="text-rose-700 font-medium">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'secondary'}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedServices.map((service) => (
              <ServiceCard
                key={service.id}
                {...service}
                onAddToRequests={handleAddToRequests}
              />
            ))}
          </section>

          {displayedServices.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No hay servicios disponibles.
            </div>
          )}
        </>
      )}
    </div>
  )
}
