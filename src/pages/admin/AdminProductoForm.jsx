import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  getAdminProductById,
  createProduct,
  updateProduct,
  listCategories,
} from '../../services/productsApi.js'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import FormInput from '../../components/admin/FormInput'
import FormSelect from '../../components/admin/FormSelect'
import FormTextarea from '../../components/admin/FormTextarea'
import LoadingScreen from '../../components/LoadingScreen'

const INITIAL_FORM = {
  name: '',
  description: '',
  categoryId: '',
  presentation: '',
  price: '',
  stock: 0,
  stockCritical: 0,
  image: '',
  discount: 0,
}

export default function AdminProductoForm() {
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
        const cats = await listCategories('PRODUCTO')
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
        const product = await getAdminProductById(id)
        if (!active) return
        if (!product) {
          setLoadError('Producto no encontrado.')
          return
        }
        setFormData({
          name: product.name || '',
          description: product.description || '',
          categoryId: product.categoryId || '',
          presentation: product.presentation || '',
          price: product.price ?? '',
          stock: product.stock ?? 0,
          stockCritical: product.stockCritical ?? 0,
          image: product.image || '',
          discount: product.discount ?? 0,
        })
      } catch (err) {
        if (active) setLoadError(err.message || 'Error al cargar el producto.')
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
    if (!String(formData.presentation).trim())
      newErrors.presentation = 'La presentación es obligatoria.'
    if (formData.price === '' || Number(formData.price) < 0)
      newErrors.price = 'Ingresa un precio válido.'
    if (formData.stock === '' || Number(formData.stock) < 0 || !Number.isInteger(Number(formData.stock)))
      newErrors.stock = 'El stock debe ser un entero mayor o igual a 0.'
    if (formData.stockCritical === '' || Number(formData.stockCritical) < 0 || !Number.isInteger(Number(formData.stockCritical)))
      newErrors.stockCritical = 'El stock crítico debe ser un entero mayor o igual a 0.'
    if (!String(formData.image).trim())
      newErrors.image = 'La ruta de la imagen es obligatoria.'
    const discount = Number(formData.discount)
    if (Number.isNaN(discount) || discount < 0 || discount > 100)
      newErrors.discount = 'El descuento debe estar entre 0 y 100.'
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
      stock: Number(formData.stock),
      stockCritical: Number(formData.stockCritical),
      discount: Number(formData.discount),
    }

    try {
      if (isEdit) {
        await updateProduct(id, data)
      } else {
        await createProduct(data)
      }
      navigate('/admin/productos')
    } catch (err) {
      setSubmitError(err.message || 'Error al guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <AdminPageHeader title={isEdit ? 'Editar producto' : 'Nuevo producto'} />
        <LoadingScreen message="Cargando producto..." />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <AdminPageHeader title="Editar producto" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <p className="text-rose-700 font-medium">{loadError}</p>
          <Link
            to="/admin/productos"
            className="inline-flex items-center justify-center py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg transition-colors"
          >
            Volver a productos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <AdminPageHeader
        title={isEdit ? 'Editar producto' : 'Nuevo producto'}
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
          label="Nombre del producto"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
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

        <FormInput
          id="presentation"
          name="presentation"
          label="Presentación"
          value={formData.presentation}
          onChange={handleChange}
          error={errors.presentation}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormInput
            id="price"
            name="price"
            type="number"
            label="Precio (CLP)"
            value={formData.price}
            onChange={handleChange}
            error={errors.price}
            min={0}
            step={1}
            required
          />

          <FormInput
            id="discount"
            name="discount"
            type="number"
            label="Descuento (%)"
            value={formData.discount}
            onChange={handleChange}
            error={errors.discount}
            min={0}
            max={100}
            step={1}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormInput
            id="stock"
            name="stock"
            type="number"
            label="Stock"
            value={formData.stock}
            onChange={handleChange}
            error={errors.stock}
            min={0}
            step={1}
            required
          />

          <FormInput
            id="stockCritical"
            name="stockCritical"
            type="number"
            label="Stock crítico"
            value={formData.stockCritical}
            onChange={handleChange}
            error={errors.stockCritical}
            min={0}
            step={1}
          />
        </div>

        <FormInput
          id="image"
          name="image"
          label="Imagen"
          value={formData.image}
          onChange={handleChange}
          error={errors.image}
          placeholder="/images/ejemplo.png"
          required
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
            to="/admin/productos"
            className="flex-1 text-center py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
