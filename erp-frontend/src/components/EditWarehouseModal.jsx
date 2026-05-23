import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function getManagerName(manager) {
  return [manager?.first_name, manager?.last_name].filter(Boolean).join(' ') || manager?.email || 'Unnamed Manager'
}

function createFormData(warehouse) {
  return {
    name: warehouse?.name ?? '',
    locationAddress: warehouse?.location_address ?? '',
    managerId: String(warehouse?.manager_id ?? ''),
    isActive: warehouse?.is_active !== false,
  }
}

function EditWarehouseModal({ isOpen, onClose, onSuccess, warehouse, managers }) {
  const [formData, setFormData] = useState(createFormData(warehouse))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !warehouse) {
      return
    }

    setFormData(createFormData(warehouse))
    setSubmitting(false)
    setError('')
  }, [isOpen, warehouse])

  if (!isOpen || !warehouse) {
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
      await apiClient.patch(`/inventory/warehouses/${warehouse.id}`, {
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
        'Unable to update this warehouse right now.'

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
              Edit Warehouse
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Update the operational profile and status for this warehouse.
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
              <label htmlFor="edit-warehouse-name" className="mb-2 block text-sm font-medium text-slate-700">
                Warehouse Name
              </label>
              <input
                id="edit-warehouse-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="edit-locationAddress" className="mb-2 block text-sm font-medium text-slate-700">
                Location Address
              </label>
              <textarea
                id="edit-locationAddress"
                name="locationAddress"
                rows="3"
                value={formData.locationAddress}
                onChange={handleChange}
                required
                className={`${fieldClassName} resize-none`}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="edit-managerId" className="mb-2 block text-sm font-medium text-slate-700">
                Manager
              </label>
              <select
                id="edit-managerId"
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditWarehouseModal
