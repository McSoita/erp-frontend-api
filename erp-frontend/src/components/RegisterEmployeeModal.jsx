import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const initialFormData = {
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  department: '',
  job_title: '',
  hire_date: '',
  role_id: '2',
}
const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function RegisterEmployeeModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setFormData(initialFormData)
    setSubmitting(false)
    setError('')
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const payload = {
      username: formData.username.trim(),
      password: formData.password,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      hire_date: formData.hire_date,
      role_id: parseInt(formData.role_id, 10),
      job_title: formData.job_title.trim() || undefined,
      department_id: formData.department
        ? parseInt(formData.department, 10)
        : undefined,
    }

    try {
      await apiClient.post('/hr/register', payload)
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const validationErrors = requestError.response?.data?.errors
      const message =
        validationErrors?.[0]?.message ??
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to register employee. Please try again.'

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
              HR
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Register Employee
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Create a staff account and capture core employment details.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={subtleButtonClassName}
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                className={fieldClassName}
                placeholder="jdoe"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                className={fieldClassName}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label
                htmlFor="first_name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                required
                className={fieldClassName}
                placeholder="Jane"
              />
            </div>

            <div>
              <label
                htmlFor="last_name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                required
                className={fieldClassName}
                placeholder="Doe"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={fieldClassName}
                placeholder="jane.doe@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="department"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Department
              </label>
              <input
                id="department"
                name="department"
                type="number"
                value={formData.department}
                onChange={handleChange}
                min="1"
                className={fieldClassName}
                placeholder="Department ID"
              />
            </div>

            <div>
              <label
                htmlFor="job_title"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Job Title
              </label>
              <input
                id="job_title"
                name="job_title"
                type="text"
                value={formData.job_title}
                onChange={handleChange}
                className={fieldClassName}
                placeholder="Sales Executive"
              />
            </div>

            <div>
              <label
                htmlFor="hire_date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Hire Date
              </label>
              <input
                id="hire_date"
                name="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="role_id"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Role
              </label>
              <select
                id="role_id"
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                required
                className={fieldClassName}
              >
                <option value="1">Admin</option>
                <option value="2">Standard/Sales</option>
              </select>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={subtleButtonClassName}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={primaryButtonClassName}
            >
              {submitting ? 'Registering...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterEmployeeModal
