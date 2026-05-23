import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const initialFormData = {
  title: '',
  department: '',
  employmentType: 'Full-Time',
}

const employmentTypes = ['Full-Time', 'Part-Time', 'Contract', 'Internship']

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function NewJobPostingModal({ isOpen, onClose, onSuccess }) {
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

    try {
      await apiClient.post('/hr/recruitment/jobs', {
        title: formData.title.trim(),
        department: formData.department.trim(),
        employment_type: formData.employmentType,
      })
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to create the requisition right now.'

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
              Recruitment
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              New Requisition
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Open a new hiring request for the recruitment pipeline.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="job-title">
                Role Title
              </label>
              <input
                id="job-title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                required
                className={fieldClassName}
                placeholder="Senior Operations Analyst"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="job-department">
                Department
              </label>
              <input
                id="job-department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                required
                className={fieldClassName}
                placeholder="Operations"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="employmentType">
                Employment Type
              </label>
              <select
                id="employmentType"
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                className={fieldClassName}
              >
                {employmentTypes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={subtleButtonClassName}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={primaryButtonClassName}>
              {submitting ? 'Saving...' : 'Create Requisition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewJobPostingModal
