import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const initialOrderLine = { product_id: '', quantity: 1, unit_price: '' }
const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function CreateOrderModal({ isOpen, onClose, onSuccess }) {
  const [customerId, setCustomerId] = useState('')
  const [customers, setCustomers] = useState([])
  const [orderLines, setOrderLines] = useState([{ ...initialOrderLine }])
  const [products, setProducts] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setCustomerId('')
    setCustomers([])
    setOrderLines([{ ...initialOrderLine }])
    setProducts([])
    setSubmitting(false)
    setError('')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let isActive = true

    const loadOrderOptions = async () => {
      try {
        const [customersResponse, productsResponse] = await Promise.all([
          apiClient.get('/sales/customers'),
          apiClient.get('/inventory/products'),
        ])

        if (!isActive) {
          return
        }

        setCustomers(customersResponse.data?.data ?? customersResponse.data ?? [])
        setProducts(productsResponse.data?.data ?? productsResponse.data ?? [])
      } catch (requestError) {
        if (!isActive) {
          return
        }

        setCustomers([])
        setProducts([])

        const message =
          requestError.response?.data?.message ??
          requestError.response?.data?.error ??
          'Unable to load customers and products. Please try again.'

        setError(message)
      }
    }

    loadOrderOptions()

    return () => {
      isActive = false
    }
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

  const handleProductChange = (index, productId) => {
    const selectedProduct = products.find(
      (product) => String(product.id) === productId,
    )
    const selectedPrice =
      selectedProduct?.price ?? selectedProduct?.unit_price ?? ''

    setOrderLines((currentOrderLines) =>
      currentOrderLines.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              product_id: productId,
              unit_price: selectedPrice === '' ? '' : String(selectedPrice),
            }
          : line,
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
      onClose()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
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
            className={subtleButtonClassName}
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
              Customer
            </label>
            <select
              id="customerId"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              required
              className={fieldClassName}
            >
              <option value="" disabled>
                Select a Customer
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Order Lines
              </h3>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200"
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
                      Product
                    </label>
                    <select
                      id={`product-id-${index}`}
                      value={line.product_id}
                      onChange={(event) =>
                        handleProductChange(index, event.target.value)
                      }
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
                      className={fieldClassName}
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
                      className={fieldClassName}
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

export default CreateOrderModal
