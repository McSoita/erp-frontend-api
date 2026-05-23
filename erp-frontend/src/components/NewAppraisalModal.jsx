import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const initialFormData = {
  employeeId: '',
  rating: '5',
  comments: '',
}

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function getEmployeeName(employee) {
  return [employee?.first_name, employee?.last_name].filter(Boolean).join(' ') || 'Unnamed employee'
}

function NewAppraisalModal({ isOpen, onClose, onSuccess, employees }) {
  const [formData, setFormData] = useState(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const defaultEmployeeId =
      String(employees?.[0]?.user_id ?? employees?.[0]?.id ?? '')

    setFormData({
      ...initialFormData,
      employeeId: defaultEmployeeId,
    })
    setSubmitting(false)
    setError('')
  }, [employees, isOpen])

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
      await apiClient.post('/hr/performance', {
        employee_id: parseInt(formData.employeeId, 10),
        rating: parseInt(formData.rating, 10),
        comments: formData.comments.trim(),
      })

      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to create appraisal. Please try again.'

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
              Performance
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              New Appraisal
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Capture a performance review for a member of the team.
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
          <div className="space-y-4">
            <div>
              <label
                htmlFor="employeeId"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Employee
              </label>
              <select
                id="employeeId"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                className={fieldClassName}
              >
                {employees.length === 0 ? (
                  <option value="">No employees available</option>
                ) : null}
                {employees.map((employee) => {
                  const value = String(employee.user_id ?? employee.id ?? '')

                  return (
                    <option key={value} value={value}>
                      {getEmployeeName(employee)}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label
                htmlFor="rating"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Rating
              </label>
              <input
                id="rating"
                name="rating"
                type="number"
                min="1"
                max="5"
                value={formData.rating}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>

            <div>
              <label
                htmlFor="comments"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Comments
              </label>
              <textarea
                id="comments"
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                rows="5"
                className={`${fieldClassName} resize-none`}
                placeholder="Summarize achievements, coaching notes, and growth areas."
              />
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
              disabled={submitting || employees.length === 0}
              className={primaryButtonClassName}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewAppraisalModal
