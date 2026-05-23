import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

const initialFormData = {
  department: '',
  fiscalYear: '',
  allocatedAmount: '',
  spentAmount: '0',
}

function CreateBudgetModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setFormData(initialFormData)
    setSubmitting(false)
    setError('')
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await apiClient.post('/finance/reports/budgets', {
        department: formData.department.trim(),
        fiscal_year: formData.fiscalYear.trim(),
        allocated_amount: parseFloat(formData.allocatedAmount),
        spent_amount: parseFloat(formData.spentAmount),
      })
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.response?.data?.error ??
          'Unable to create budget. Please try again.',
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
            Finance
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Add Budget</h2>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="department" className="mb-2 block text-sm font-medium text-slate-700">
                Department
              </label>
              <input
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className={fieldClassName}
                placeholder="Operations"
              />
            </div>
            <div>
              <label htmlFor="fiscalYear" className="mb-2 block text-sm font-medium text-slate-700">
                Fiscal Year
              </label>
              <input
                id="fiscalYear"
                name="fiscalYear"
                value={formData.fiscalYear}
                onChange={handleChange}
                required
                className={fieldClassName}
                placeholder="2026"
              />
            </div>
            <div>
              <label
                htmlFor="allocatedAmount"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Allocated Amount
              </label>
              <input
                id="allocatedAmount"
                name="allocatedAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.allocatedAmount}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="spentAmount" className="mb-2 block text-sm font-medium text-slate-700">
                Spent Amount
              </label>
              <input
                id="spentAmount"
                name="spentAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.spentAmount}
                onChange={handleChange}
                required
                className={fieldClassName}
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
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateBudgetModal
