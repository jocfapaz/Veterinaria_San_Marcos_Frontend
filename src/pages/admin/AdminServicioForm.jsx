import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  getAdminServiceById,
  createService,
  updateService,
  listCategories,
} from '../../services/servicesApi.js'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import FormInput from '../../components/admin/FormInput'
import FormSelect from '../../components/admin/FormSelect'
import FormTextarea from '../../components/admin/FormTextarea'
import LoadingScreen from '../../components/LoadingScreen'

const SPECIES_OPTIONS = [
  { value: 'Perro', label: 'Perro' },
  { value: 'Gato', label: 'Gato' },
  { value: 'Perro / Gato', label: 'Perro / Gato' },
  { value: 'Ave', label: 'Ave' },
  { value: 'Conejo', label: 'Conejo' },
  { value: 'Todas', label: 'Todas' },
]

const INITIAL_FORM = {
  name: '',
  description: '',
  categoryId: '',
  species: 'Perro',
  duration: '',
  price: '',
  note: '',
  image: '',
}

export default function AdminServicioForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState(INITIAL_FORM)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const cats = await listCategories('SERVICIO')
        if (active && cats.length) setCategories(cats)
      } catch {
        /* fallback a vacío */
      }
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isEdit) return
    let active = true
    ;(async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const service = await getAdminServiceById(id)
        if (!active) return
        if (!service) {
          setLoadError('Servicio no encontrado.')
          return
        }
        setFormData({
          name: service.name || '',
          description: service.description || '',
          categoryId: service.categoryId || '',
          species: service.species || 'Perro',
          duration: service.duration || '',
          price: service.price ?? '',
          note: service.note || '',
          image: service.image || '',
        })
      } catch (err) {
        if (active) setLoadError(err.message || 'Error al cargar el servicio.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id, isEdit])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setSubmitError(null)
  }

  function validate() {
    const newErrors = {}
    if (!String(formData.name).trim()) newErrors.name = 'El nombre es obligatorio.'
    if (!String(formData.categoryId).trim())
      newErrors.categoryId = 'La categoría es obligatoria.'
    if (!String(formData.duration).trim())
      newErrors.duration = 'La duración es obligatoria.'
    if (formData.price === '' || Number(formData.price) < 0)
      newErrors.price = 'Ingresa un precio válido.'
    if (!String(formData.image).trim())
      newErrors.image = 'La ruta de la imagen es obligatoria.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setSubmitError(null)

    const data = {
      ...formData,
      categoryId: Number(formData.categoryId),
      price: Number(formData.price),
    }

    try {
      if (isEdit) {
        await updateService(id, data)
      } else {
        await createService(data)
      }
      navigate('/admin/servicios')
    } catch (err) {
      setSubmitError(err.message || 'Error al guardar el servicio.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <AdminPageHeader title={isEdit ? 'Editar servicio' : 'Nuevo servicio'} />
        <LoadingScreen message="Cargando servicio..." />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <AdminPageHeader title="Editar servicio" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <p className="text-rose-700 font-medium">{loadError}</p>
          <Link
            to="/admin/servicios"
            className="inline-flex items-center justify-center py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors"
          >
            Volver a servicios
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <AdminPageHeader
        title={isEdit ? 'Editar servicio' : 'Nuevo servicio'}
      />

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5"
      >
        {submitError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {submitError}
          </div>
        )}

        {isEdit && (
          <FormInput
            id="id"
            name="id"
            label="ID"
            value={id}
            readOnly
            className="bg-slate-100"
          />
        )}

        <FormInput
          id="name"
          name="name"
          label="Nombre del servicio"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

        <FormTextarea
          id="description"
          name="description"
          label="Descripción"
          value={formData.description}
          onChange={handleChange}
          rows={3}
        />

        <FormSelect
          id="categoryId"
          name="categoryId"
          label="Categoría"
          value={formData.categoryId}
          onChange={handleChange}
          options={[
            { value: '', label: '-- Seleccione una categoría --' },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
          error={errors.categoryId}
        />

        <FormSelect
          id="species"
          name="species"
          label="Especie"
          value={formData.species}
          onChange={handleChange}
          options={SPECIES_OPTIONS}
        />

        <FormInput
          id="duration"
          name="duration"
          label="Duración"
          value={formData.duration}
          onChange={handleChange}
          error={errors.duration}
          required
        />

        <FormInput
          id="price"
          name="price"
          type="number"
          label="Precio (CLP)"
          value={formData.price}
          onChange={handleChange}
          error={errors.price}
          min={0}
          step={500}
          required
        />

        <FormInput
          id="image"
          name="image"
          label="Imagen"
          value={formData.image}
          onChange={handleChange}
          error={errors.image}
          placeholder="images/ejemplo.png"
          required
        />

        <FormTextarea
          id="note"
          name="note"
          label="Observaciones"
          value={formData.note}
          onChange={handleChange}
          rows={3}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar'}
          </button>
          <Link
            to="/admin/servicios"
            className="flex-1 text-center py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
