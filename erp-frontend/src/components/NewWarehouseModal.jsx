import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const initialFormData = {
  name: '',
  locationAddress: '',
  managerId: '',
  isActive: true,
}

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function getManagerName(manager) {
  return [manager?.first_name, manager?.last_name].filter(Boolean).join(' ') || manager?.email || 'Unnamed Manager'
}

function NewWarehouseModal({ isOpen, onClose, onSuccess, managers }) {
  const [formData, setFormData] = useState(initialFormData)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setFormData({
      ...initialFormData,
      managerId: String(managers?.[0]?.user_id ?? managers?.[0]?.id ?? ''),
    })
    setSubmitting(false)
    setError('')
  }, [isOpen, managers])

  if (!isOpen) {
    return null
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await apiClient.post('/inventory/warehouses', {
        name: formData.name.trim(),
        location_address: formData.locationAddress.trim(),
        manager_id: formData.managerId ? parseInt(formData.managerId, 10) : undefined,
        is_active: formData.isActive,
      })

      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const validationErrors = requestError.response?.data?.errors
      const message =
        validationErrors?.[0]?.message ??
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to create this warehouse right now.'

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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
              Inventory
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              New Warehouse
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Add a new storage site and assign its operational owner.
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
              <label htmlFor="warehouse-name" className="mb-2 block text-sm font-medium text-slate-700">
                Warehouse Name
              </label>
              <input
                id="warehouse-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className={fieldClassName}
                placeholder="West Distribution Center"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="locationAddress" className="mb-2 block text-sm font-medium text-slate-700">
                Location Address
              </label>
              <textarea
                id="locationAddress"
                name="locationAddress"
                rows="3"
                value={formData.locationAddress}
                onChange={handleChange}
                required
                className={`${fieldClassName} resize-none`}
                placeholder="45 Industrial Park Road"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="managerId" className="mb-2 block text-sm font-medium text-slate-700">
                Manager
              </label>
              <select
                id="managerId"
                name="managerId"
                value={formData.managerId}
                onChange={handleChange}
                className={fieldClassName}
              >
                <option value="">No manager assigned</option>
                {managers.map((manager) => {
                  const value = String(manager.user_id ?? manager.id ?? '')

                  return (
                    <option key={value} value={value}>
                      {getManagerName(manager)}
                    </option>
                  )
                })}
              </select>
            </div>

            <label className="inline-flex items-center gap-3 rounded-3xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 md:col-span-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Warehouse is active and available for operations
            </label>
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
              {submitting ? 'Saving...' : 'Create Warehouse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewWarehouseModal
