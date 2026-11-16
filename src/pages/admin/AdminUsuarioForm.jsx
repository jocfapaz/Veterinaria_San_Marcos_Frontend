import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  getUserById,
  createUser,
  updateUser,
} from '../../services/usersApi.js'
import { validateRun, formatRun } from '../../utils/run.js'
import { REGIONS, COMMUNES_BY_REGION } from '../../constants/regions.js'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import FormInput from '../../components/admin/FormInput'
import FormSelect from '../../components/admin/FormSelect'
import LoadingScreen from '../../components/LoadingScreen'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'veterinario', label: 'Veterinario' },
  { value: 'client', label: 'Cliente' },
]

const INITIAL_FORM = {
  run: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'client',
  birthDate: '',
  phone: '',
  address: '',
  region: REGIONS[0],
  commune: COMMUNES_BY_REGION[REGIONS[0]]?.[0] || '',
}

export default function AdminUsuarioForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState(INITIAL_FORM)
  const [originalEmail, setOriginalEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEdit) return

    let active = true
    ;(async () => {
      setLoading(true)
      setSubmitError('')
      try {
        const user = await getUserById(id)
        if (!active) return
        if (!user) {
          setSubmitError('Usuario no encontrado.')
          setLoading(false)
          return
        }
        setOriginalEmail(user.email)
        setFormData({
          run: user.run || '',
          email: user.email || '',
          password: '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role || 'client',
          birthDate: user.birthDate || '',
          phone: user.phone || '',
          address: user.address || '',
          region: user.region || REGIONS[0],
          commune: user.commune || '',
        })
      } catch (err) {
        if (active) setSubmitError(err.message || 'Error al cargar el usuario.')
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [id, isEdit])

  const communeOptions = (COMMUNES_BY_REGION[formData.region] || []).map((c) => ({
    value: c,
    label: c,
  }))

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'region') {
        next.commune = (COMMUNES_BY_REGION[value] || [])[0] || ''
      }
      return next
    })
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setSubmitError('')
  }

  function validate() {
    const newErrors = {}
    if (!formData.run.trim()) {
      newErrors.run = 'El RUN es obligatorio.'
    } else if (!validateRun(formData.run)) {
      newErrors.run = 'Ingresa un RUN válido.'
    }
    if (!formData.email.trim()) newErrors.email = 'El correo es obligatorio.'
    if (!isEdit && !formData.password.trim())
      newErrors.password = 'La contraseña es obligatoria.'
    if (!formData.firstName.trim())
      newErrors.firstName = 'El nombre es obligatorio.'
    if (!formData.lastName.trim())
      newErrors.lastName = 'El apellido es obligatorio.'
    if (!formData.phone.trim())
      newErrors.phone = 'El teléfono es obligatorio.'
    if (!formData.address.trim())
      newErrors.address = 'La dirección es obligatoria.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setSubmitError('')

    const payload = {
      run: formatRun(formData.run),
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      birthDate: formData.birthDate,
      phone: formData.phone,
      address: formData.address,
      region: formData.region,
      commune: formData.commune,
      password: formData.password,
    }

    if (isEdit) {
      if (formData.email !== originalEmail) {
        payload.email = formData.email
      }
    } else {
      payload.email = formData.email
    }

    try {
      if (isEdit) {
        await updateUser(id, payload)
      } else {
        await createUser(payload)
      }
      navigate('/admin/usuarios')
    } catch (err) {
      setSubmitError(err.message || 'Error al guardar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingScreen message="Cargando usuario..." />
  }

  return (
    <div className="max-w-2xl mx-auto">
      <AdminPageHeader
        title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
      />

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5"
      >
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
          id="run"
          name="run"
          label="RUN"
          value={formData.run}
          onChange={handleChange}
          error={errors.run}
          placeholder="12.345.678-5"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormInput
            id="firstName"
            name="firstName"
            label="Nombre"
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
            required
          />
          <FormInput
            id="lastName"
            name="lastName"
            label="Apellido"
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
            required
          />
        </div>

        <FormInput
          id="email"
          name="email"
          type="email"
          label="Correo electrónico"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />

        <FormInput
          id="password"
          name="password"
          type="password"
          label={isEdit ? 'Contraseña (dejar en blanco para mantener)' : 'Contraseña'}
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required={!isEdit}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormSelect
            id="role"
            name="role"
            label="Rol"
            value={formData.role}
            onChange={handleChange}
            options={ROLE_OPTIONS}
          />
          <FormInput
            id="birthDate"
            name="birthDate"
            type="date"
            label="Fecha de nacimiento"
            value={formData.birthDate}
            onChange={handleChange}
          />
        </div>

        <FormInput
          id="phone"
          name="phone"
          label="Teléfono"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          required
        />

        <FormInput
          id="address"
          name="address"
          label="Dirección"
          value={formData.address}
          onChange={handleChange}
          error={errors.address}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormSelect
            id="region"
            name="region"
            label="Región"
            value={formData.region}
            onChange={handleChange}
            options={REGIONS.map((r) => ({ value: r, label: r }))}
          />
          <FormSelect
            id="commune"
            name="commune"
            label="Comuna"
            value={formData.commune}
            onChange={handleChange}
            options={communeOptions}
          />
        </div>

        {submitError && (
          <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
            {submitError}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-lg shadow-sm transition-colors"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar'}
          </button>
          <Link
            to="/admin/usuarios"
            className="flex-1 text-center py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
