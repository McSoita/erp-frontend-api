import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

const initialFormData = {
  vendorId: '',
  totalAmount: '',
  taxAmount: '0',
  issueDate: '',
  dueDate: '',
}

function CreateBillModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState(initialFormData)
  const [vendors, setVendors] = useState([])
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return

    let isActive = true
    const loadVendors = async () => {
      setLoadingVendors(true)
      try {
        const response = await apiClient.get('/scm/vendors')
        const records = response.data?.data ?? response.data ?? []
        if (!isActive) return
        const vendorRecords = Array.isArray(records) ? records : []
        setVendors(vendorRecords)
        setFormData({
          ...initialFormData,
          vendorId: String(vendorRecords[0]?.id ?? ''),
        })
      } catch (requestError) {
        if (!isActive) return
        setVendors([])
        setError('Unable to load vendors right now.')
      } finally {
        if (isActive) setLoadingVendors(false)
      }
    }

    setSubmitting(false)
    setError('')
    loadVendors()

    return () => {
      isActive = false
    }
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
      await apiClient.post('/finance/ap/bills', {
        vendor_id: parseInt(formData.vendorId, 10),
        total_amount: parseFloat(formData.totalAmount),
        amount_paid: 0,
        tax_amount: parseFloat(formData.taxAmount),
        issue_date: formData.issueDate,
        due_date: formData.dueDate,
        status: 'Draft',
      })
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.response?.data?.error ??
          'Unable to create bill. Please try again.',
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
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">New Vendor Bill</h2>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="vendorId" className="mb-2 block text-sm font-medium text-slate-700">
                Vendor
              </label>
              <select
                id="vendorId"
                name="vendorId"
                value={formData.vendorId}
                onChange={handleChange}
                required
                className={fieldClassName}
              >
                {vendors.length === 0 ? <option value="">No vendors available</option> : null}
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name ?? vendor.company_name ?? `Vendor #${vendor.id}`}
                  </option>
                ))}
              </select>
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
              />
            </div>
            <div>
              <label htmlFor="taxAmount" className="mb-2 block text-sm font-medium text-slate-700">
                Tax Amount
              </label>
              <input
                id="taxAmount"
                name="taxAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.taxAmount}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="issueDate" className="mb-2 block text-sm font-medium text-slate-700">
                Issue Date
              </label>
              <input
                id="issueDate"
                name="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="dueDate" className="mb-2 block text-sm font-medium text-slate-700">
                Due Date
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
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
            <button
              type="submit"
              disabled={submitting || loadingVendors || vendors.length === 0}
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

export default CreateBillModal
