import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function getEmployeeName(review) {
  return [review?.first_name, review?.last_name].filter(Boolean).join(' ') || 'Unnamed employee'
}

function EditPerformanceReviewModal({ isOpen, onClose, onSuccess, review }) {
  const [formData, setFormData] = useState({
    reviewDate: '',
    rating: '5',
    comments: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !review) return

    setFormData({
      reviewDate: review.review_date?.slice?.(0, 10) ?? review.review_date ?? '',
      rating: String(review.rating ?? 5),
      comments: review.comments ?? '',
    })
    setSubmitting(false)
    setError('')
  }, [isOpen, review])

  if (!isOpen || !review) return null

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await apiClient.patch(`/hr/performance/${review.id}`, {
        review_date: formData.reviewDate,
        rating: parseInt(formData.rating, 10),
        comments: formData.comments.trim(),
      })
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.response?.data?.error ??
          'Unable to update appraisal. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Performance
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Edit Appraisal
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Update the review record for {getEmployeeName(review)}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="reviewDate" className="mb-2 block text-sm font-medium text-slate-700">
                Review Date
              </label>
              <input
                id="reviewDate"
                name="reviewDate"
                type="date"
                value={formData.reviewDate}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="rating" className="mb-2 block text-sm font-medium text-slate-700">
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
              <label htmlFor="comments" className="mb-2 block text-sm font-medium text-slate-700">
                Comments
              </label>
              <textarea
                id="comments"
                name="comments"
                rows="5"
                value={formData.comments}
                onChange={handleChange}
                className={`${fieldClassName} resize-none`}
              />
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPerformanceReviewModal
