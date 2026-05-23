import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function CreateProductModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stockQuantity, setStockQuantity] = useState('0')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setName('')
    setPrice('')
    setStockQuantity('0')
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
      name: name.trim(),
      price: parseFloat(price),
      stock_quantity: parseInt(stockQuantity, 10),
    }

    try {
      await apiClient.post('/inventory/products', payload)
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to create product. Please try again.'

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
              Inventory
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Create New Product
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Add a new catalog item with its starting price and inventory.
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
              htmlFor="product-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Product Name
            </label>
            <input
              id="product-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className={fieldClassName}
              placeholder="Wireless Keyboard"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="product-price"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Unit Price
              </label>
              <input
                id="product-price"
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
                min="0"
                step="0.01"
                className={fieldClassName}
                placeholder="0.00"
              />
            </div>

            <div>
              <label
                htmlFor="product-stock"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Initial Stock
              </label>
              <input
                id="product-stock"
                type="number"
                value={stockQuantity}
                onChange={(event) => setStockQuantity(event.target.value)}
                required
                min="0"
                className={fieldClassName}
                placeholder="0"
              />
            </div>
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
              {submitting ? 'Creating...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProductModal
