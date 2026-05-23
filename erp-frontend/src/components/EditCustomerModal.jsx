import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const customerStatuses = ['Lead', 'Active', 'Inactive', 'Churned']

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function createFormData(customer) {
  return {
    companyName: customer?.company_name ?? '',
    industry: customer?.industry ?? '',
    primaryContactName: customer?.primary_contact_name ?? '',
    primaryEmail: customer?.primary_email ?? '',
    primaryPhone: customer?.primary_phone ?? '',
    billingAddress: customer?.billing_address ?? '',
    shippingAddress: customer?.shipping_address ?? '',
    status: customer?.status ?? 'Lead',
  }
}

function EditCustomerModal({ isOpen, onClose, onSuccess, customer }) {
  const [formData, setFormData] = useState(createFormData(customer))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !customer) {
      return
    }

    setFormData(createFormData(customer))
    setSubmitting(false)
    setError('')
  }, [customer, isOpen])

  if (!isOpen || !customer) {
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
      await apiClient.patch(`/crm/customers/${customer.id}`, {
        company_name: formData.companyName.trim(),
        industry: formData.industry.trim(),
        primary_contact_name: formData.primaryContactName.trim(),
        primary_email: formData.primaryEmail.trim(),
        primary_phone: formData.primaryPhone.trim(),
        billing_address: formData.billingAddress.trim(),
        shipping_address: formData.shippingAddress.trim(),
        status: formData.status,
      })

      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to update this customer right now.'

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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
              CRM
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Edit Customer
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Update the account profile and lifecycle status for this customer.
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
              <label htmlFor="edit-companyName" className="mb-2 block text-sm font-medium text-slate-700">
                Company Name
              </label>
              <input
                id="edit-companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="edit-industry" className="mb-2 block text-sm font-medium text-slate-700">
                Industry
              </label>
              <input
                id="edit-industry"
                name="industry"
                type="text"
                value={formData.industry}
                onChange={handleChange}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="edit-status" className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="edit-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={fieldClassName}
              >
                {customerStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-primaryContactName" className="mb-2 block text-sm font-medium text-slate-700">
                Primary Contact
              </label>
              <input
                id="edit-primaryContactName"
                name="primaryContactName"
                type="text"
                value={formData.primaryContactName}
                onChange={handleChange}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="edit-primaryEmail" className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="edit-primaryEmail"
                name="primaryEmail"
                type="email"
                value={formData.primaryEmail}
                onChange={handleChange}
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="edit-primaryPhone" className="mb-2 block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                id="edit-primaryPhone"
                name="primaryPhone"
                type="text"
                value={formData.primaryPhone}
                onChange={handleChange}
                className={fieldClassName}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="edit-billingAddress" className="mb-2 block text-sm font-medium text-slate-700">
                Billing Address
              </label>
              <textarea
                id="edit-billingAddress"
                name="billingAddress"
                rows="3"
                value={formData.billingAddress}
                onChange={handleChange}
                className={`${fieldClassName} resize-none`}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="edit-shippingAddress" className="mb-2 block text-sm font-medium text-slate-700">
                Shipping Address
              </label>
              <textarea
                id="edit-shippingAddress"
                name="shippingAddress"
                rows="3"
                value={formData.shippingAddress}
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

export default EditCustomerModal
