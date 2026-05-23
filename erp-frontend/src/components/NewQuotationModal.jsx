import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const quotationStatuses = ['Draft', 'Sent', 'Accepted', 'Expired', 'Rejected']

const initialFormData = {
  quoteNumber: '',
  customerId: '',
  validUntil: '',
  totalAmount: '',
  status: 'Draft',
}

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function getCustomerName(customer) {
  return (
    customer?.company_name ||
    [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') ||
    customer?.name ||
    'Unnamed Customer'
  )
}

function createInitialState(customers) {
  return {
    ...initialFormData,
    quoteNumber: `QT-${Date.now()}`,
    customerId: String(customers?.[0]?.id ?? ''),
  }
}

function NewQuotationModal({ isOpen, onClose, onSuccess, customers }) {
  const [formData, setFormData] = useState(() => createInitialState(customers))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setFormData(createInitialState(customers))
    setSubmitting(false)
    setError('')
  }, [customers, isOpen])

  if (!isOpen) {
    return null
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await apiClient.post('/crm/quotations', {
        customer_id: parseInt(formData.customerId, 10),
        quote_number: formData.quoteNumber.trim(),
        valid_until: formData.validUntil,
        total_amount: parseFloat(formData.totalAmount),
        status: formData.status,
      })

      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to create this quotation right now.'

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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
              CRM
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              New Quotation
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Create a new customer proposal and set its initial commercial status.
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
            <div>
              <label htmlFor="quoteNumber" className="mb-2 block text-sm font-medium text-slate-700">
                Quote Number
              </label>
              <input
                id="quoteNumber"
                name="quoteNumber"
                type="text"
                value={formData.quoteNumber}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="status" className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={fieldClassName}
              >
                {quotationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="customerId" className="mb-2 block text-sm font-medium text-slate-700">
                Customer
              </label>
              <select
                id="customerId"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                required
                className={fieldClassName}
              >
                {customers.length === 0 ? <option value="">No customers available</option> : null}
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {getCustomerName(customer)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="validUntil" className="mb-2 block text-sm font-medium text-slate-700">
                Valid Until
              </label>
              <input
                id="validUntil"
                name="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="totalAmount" className="mb-2 block text-sm font-medium text-slate-700">
                Total Amount
              </label>
              <input
                id="totalAmount"
                name="totalAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.totalAmount}
                onChange={handleChange}
                required
                className={fieldClassName}
                placeholder="125000"
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
            <button
              type="submit"
              disabled={submitting || customers.length === 0}
              className={primaryButtonClassName}
            >
              {submitting ? 'Saving...' : 'Create Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewQuotationModal
