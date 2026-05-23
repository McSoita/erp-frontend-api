import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function createFormData(rule) {
  return {
    ruleName: rule?.rule_name ?? '',
    productId: String(rule?.product_id ?? ''),
    minQuantity: String(rule?.min_quantity ?? 1),
    discountPercentage: String(rule?.discount_percentage ?? 0),
    isActive: rule?.is_active !== false,
  }
}

function EditPricingRuleModal({ isOpen, onClose, onSuccess, products, rule }) {
  const [formData, setFormData] = useState(createFormData(rule))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !rule) {
      return
    }

    setFormData(createFormData(rule))
    setSubmitting(false)
    setError('')
  }, [isOpen, rule])

  if (!isOpen || !rule) {
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
      await apiClient.patch(`/crm/pricing-rules/${rule.id}`, {
        rule_name: formData.ruleName.trim(),
        product_id: parseInt(formData.productId, 10),
        min_quantity: parseInt(formData.minQuantity, 10),
        discount_percentage: parseFloat(formData.discountPercentage),
        is_active: formData.isActive,
      })

      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to update this pricing rule right now.'

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
              Edit Pricing Rule
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Update discount thresholds and activation state for this pricing rule.
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
              <label htmlFor="edit-ruleName" className="mb-2 block text-sm font-medium text-slate-700">
                Rule Name
              </label>
              <input
                id="edit-ruleName"
                name="ruleName"
                type="text"
                value={formData.ruleName}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="edit-productId" className="mb-2 block text-sm font-medium text-slate-700">
                Target Product
              </label>
              <select
                id="edit-productId"
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                required
                className={fieldClassName}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name ?? product.sku ?? `Product #${product.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-minQuantity" className="mb-2 block text-sm font-medium text-slate-700">
                Minimum Quantity
              </label>
              <input
                id="edit-minQuantity"
                name="minQuantity"
                type="number"
                min="1"
                step="1"
                value={formData.minQuantity}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>

            <div>
              <label htmlFor="edit-discountPercentage" className="mb-2 block text-sm font-medium text-slate-700">
                Discount Percentage
              </label>
              <input
                id="edit-discountPercentage"
                name="discountPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discountPercentage}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>

            <label className="inline-flex items-center gap-3 rounded-3xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 md:col-span-2">
              <input
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Rule is active and available for pricing decisions
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

export default EditPricingRuleModal
