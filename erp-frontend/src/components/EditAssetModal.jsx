import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const assetStatuses = ['Operational', 'Degraded', 'Under Repair', 'Decommissioned']
const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function EditAssetModal({ isOpen, onClose, onSuccess, asset }) {
  const [formData, setFormData] = useState({
    assetTag: '',
    name: '',
    category: '',
    purchaseDate: '',
    initialCost: '',
    usefulLifeYears: '',
    status: 'Operational',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !asset) return

    setFormData({
      assetTag: asset.asset_tag ?? '',
      name: asset.name ?? '',
      category: asset.category ?? '',
      purchaseDate: asset.purchase_date?.slice?.(0, 10) ?? asset.purchase_date ?? '',
      initialCost: String(asset.initial_cost ?? ''),
      usefulLifeYears: String(asset.useful_life_years ?? ''),
      status: asset.status ?? 'Operational',
    })
    setSubmitting(false)
    setError('')
  }, [asset, isOpen])

  if (!isOpen || !asset) return null

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await apiClient.patch(`/finance/assets/${asset.id}`, {
        asset_tag: formData.assetTag.trim(),
        name: formData.name.trim(),
        category: formData.category.trim(),
        purchase_date: formData.purchaseDate,
        initial_cost: parseFloat(formData.initialCost),
        useful_life_years: parseInt(formData.usefulLifeYears, 10),
        status: formData.status,
      })
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.response?.data?.error ??
          'Unable to update asset. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Finance
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Edit Asset</h2>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="assetTag" className="mb-2 block text-sm font-medium text-slate-700">
                Asset Tag
              </label>
              <input
                id="assetTag"
                name="assetTag"
                value={formData.assetTag}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>
              <input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="purchaseDate" className="mb-2 block text-sm font-medium text-slate-700">
                Purchase Date
              </label>
              <input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="initialCost" className="mb-2 block text-sm font-medium text-slate-700">
                Initial Cost
              </label>
              <input
                id="initialCost"
                name="initialCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.initialCost}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="usefulLifeYears" className="mb-2 block text-sm font-medium text-slate-700">
                Useful Life (Years)
              </label>
              <input
                id="usefulLifeYears"
                name="usefulLifeYears"
                type="number"
                min="1"
                step="1"
                value={formData.usefulLifeYears}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div className="md:col-span-2">
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
                {assetStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
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
            <button type="submit" disabled={submitting} className={primaryButtonClassName}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditAssetModal
