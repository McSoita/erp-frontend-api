import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function ReceiveInventoryModal({ isOpen, onClose, onSuccess, products }) {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setProductId('')
    setQuantity('')
    setSubmitting(false)
    setError('')
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const payload = {
      product_id: parseInt(productId, 10),
      quantity: parseInt(quantity, 10),
    }

    try {
      await apiClient.post('/inventory/receive', payload)
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const validationErrors = requestError.response?.data?.errors
      const message =
        validationErrors?.[0]?.message ??
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to receive inventory. Please try again.'

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
              Inventory
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Receive Inventory
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Add received stock into the warehouse inventory count.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={subtleButtonClassName}
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="receive-product-id"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Product
            </label>
            <select
              id="receive-product-id"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              required
              className={fieldClassName}
            >
              <option value="" disabled>
                Select a Product
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="receive-quantity"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Quantity
            </label>
            <input
              id="receive-quantity"
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
              min="1"
              className={fieldClassName}
              placeholder="Enter quantity received"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={subtleButtonClassName}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={primaryButtonClassName}
            >
              {submitting ? 'Receiving...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReceiveInventoryModal
