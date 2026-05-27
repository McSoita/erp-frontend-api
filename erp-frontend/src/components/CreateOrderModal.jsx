import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const initialOrderLine = { product_id: '', quantity: 1, unit_price: '' }

function CreateOrderModal({ isOpen, onClose, onSuccess }) {
  const [customerId, setCustomerId] = useState('')
  const [orderLines, setOrderLines] = useState([{ ...initialOrderLine }])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setCustomerId('')
    setOrderLines([{ ...initialOrderLine }])
    setSubmitting(false)
    setError('')
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleLineChange = (index, field, value) => {
    setOrderLines((currentOrderLines) =>
      currentOrderLines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      ),
    )
  }

  const handleAddLineItem = () => {
    setOrderLines((currentOrderLines) => [
      ...currentOrderLines,
      { ...initialOrderLine },
    ])
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const payload = {
      customer_id: parseInt(customerId, 10),
      order_lines: orderLines.map((line) => ({
        product_id: parseInt(line.product_id, 10),
        quantity: parseInt(line.quantity, 10),
        unit_price: parseFloat(line.unit_price),
      })),
    }

    try {
      await apiClient.post('/sales', payload)
      await onSuccess?.()
      onClose?.()
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to create the sales order. Please try again.'

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              Sales
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Create Sales Order
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Add the customer and line items to create a new order.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="customerId"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Customer ID
            </label>
            <input
              id="customerId"
              type="number"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              required
              min="1"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              placeholder="Enter customer ID"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Order Lines
              </h3>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-500 hover:text-sky-600"
              >
                Add Line Item
              </button>
            </div>

            <div className="space-y-4">
              {orderLines.map((line, index) => (
                <div
                  key={`order-line-${index}`}
                  className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3"
                >
                  <div>
                    <label
                      htmlFor={`product-id-${index}`}
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Product ID
                    </label>
                    <input
                      id={`product-id-${index}`}
                      type="number"
                      value={line.product_id}
                      onChange={(event) =>
                        handleLineChange(index, 'product_id', event.target.value)
                      }
                      required
                      min="1"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      placeholder="Product ID"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`quantity-${index}`}
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Quantity
                    </label>
                    <input
                      id={`quantity-${index}`}
                      type="number"
                      value={line.quantity}
                      onChange={(event) =>
                        handleLineChange(index, 'quantity', event.target.value)
                      }
                      required
                      min="1"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`unit-price-${index}`}
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Unit Price
                    </label>
                    <input
                      id={`unit-price-${index}`}
                      type="number"
                      value={line.unit_price}
                      onChange={(event) =>
                        handleLineChange(index, 'unit_price', event.target.value)
                      }
                      required
                      min="0"
                      step="0.01"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
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
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateOrderModal
