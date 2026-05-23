import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function EditVendorModal({ isOpen, onClose, onSuccess, vendor }) {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    paymentTerms: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !vendor) return

    setFormData({
      companyName: vendor.name ?? vendor.company_name ?? '',
      contactName: vendor.contact_name ?? '',
      email: vendor.email ?? '',
      phone: vendor.phone ?? '',
      paymentTerms: vendor.payment_terms ?? '',
    })
    setSubmitting(false)
    setError('')
  }, [isOpen, vendor])

  if (!isOpen || !vendor) return null

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await apiClient.patch(`/scm/vendors/${vendor.id}`, {
        company_name: formData.companyName.trim(),
        contact_name: formData.contactName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        payment_terms: formData.paymentTerms.trim(),
      })
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.response?.data?.error ??
          'Unable to update vendor. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
            SCM
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Edit Vendor</h2>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="companyName" className="mb-2 block text-sm font-medium text-slate-700">
                Vendor Name
              </label>
              <input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="contactName" className="mb-2 block text-sm font-medium text-slate-700">
                Contact Name
              </label>
              <input
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="paymentTerms" className="mb-2 block text-sm font-medium text-slate-700">
                Payment Terms
              </label>
              <input
                id="paymentTerms"
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditVendorModal
