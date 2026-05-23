import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const initialFormData = {
  jobPostingId: '',
  firstName: '',
  lastName: '',
  email: '',
  pipelineStage: 'Applied',
}

const pipelineOptions = ['Applied', 'Screening', 'Interviewing', 'Offered', 'Hired', 'Rejected']

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function NewApplicantModal({ isOpen, onClose, onSuccess, jobs }) {
  const [formData, setFormData] = useState(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setFormData({
      ...initialFormData,
      jobPostingId: String(jobs?.[0]?.id ?? ''),
    })
    setSubmitting(false)
    setError('')
  }, [isOpen, jobs])

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
      await apiClient.post('/hr/recruitment/applicants', {
        job_posting_id: parseInt(formData.jobPostingId, 10),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim(),
        pipeline_stage: formData.pipelineStage,
      })
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to add this applicant right now.'

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
              Add Applicant
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Add a candidate directly into the active hiring pipeline.
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
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="jobPostingId">
                Requisition
              </label>
              <select
                id="jobPostingId"
                name="jobPostingId"
                value={formData.jobPostingId}
                onChange={handleChange}
                required
                className={fieldClassName}
              >
                {jobs.length === 0 ? <option value="">No requisitions available</option> : null}
                {jobs.map((job) => (
                  <option key={job.id} value={String(job.id)}>
                    {job.title} - {job.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="firstName">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                className={fieldClassName}
                placeholder="Alex"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="lastName">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                className={fieldClassName}
                placeholder="Johnson"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
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
                placeholder="alex@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="pipelineStage">
                Pipeline Stage
              </label>
              <select
                id="pipelineStage"
                name="pipelineStage"
                value={formData.pipelineStage}
                onChange={handleChange}
                className={fieldClassName}
              >
                {pipelineOptions.map((option) => (
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
            <button
              type="submit"
              disabled={submitting || jobs.length === 0}
              className={primaryButtonClassName}
            >
              {submitting ? 'Saving...' : 'Create Applicant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewApplicantModal
