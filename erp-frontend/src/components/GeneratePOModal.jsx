import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import {
  calculatePurchaseOrderLineTotal,
  getProductUnitCost,
} from '../utils/purchaseOrders'

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function formatCurrency(value) {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return '$0.00'
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function GeneratePOModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  suppliers,
}) {
  const [supplierId, setSupplierId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitCost, setUnitCost] = useState(0)
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !product) {
      return
    }

    setSupplierId(suppliers[0]?.id ? String(suppliers[0].id) : '')
    setQuantity(Number(product.optimal_reorder_quantity ?? 1))
    setUnitCost(getProductUnitCost(product))
    setExpectedDeliveryDate('')
    setSubmitting(false)
    setError('')
  }, [isOpen, product, suppliers])

  if (!isOpen || !product) {
    return null
  }

  const orderTotal = calculatePurchaseOrderLineTotal(quantity, unitCost)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const normalizedSupplierId = parseInt(supplierId, 10)
    const normalizedQuantity = parseInt(quantity, 10)
    const normalizedUnitCost = parseFloat(unitCost)

    if (
      !Number.isInteger(normalizedSupplierId) ||
      normalizedSupplierId <= 0 ||
      !Number.isInteger(normalizedQuantity) ||
      normalizedQuantity <= 0 ||
      !Number.isFinite(normalizedUnitCost) ||
      normalizedUnitCost < 0 ||
      !expectedDeliveryDate
    ) {
      setSubmitting(false)
      setError('Please complete the supplier, quantity, cost, and delivery date.')
      return
    }

    try {
      await apiClient.post('/scm/purchase-orders', {
        po_number: `PO-${Date.now()}`,
        supplier_id: normalizedSupplierId,
        expected_delivery_date: expectedDeliveryDate,
        lines: [
          {
            product_id: product.id,
            quantity_ordered: normalizedQuantity,
            unit_cost: normalizedUnitCost,
          },
        ],
      })

      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to generate the purchase order. Please try again.'

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
              Inventory
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Generate Purchase Order
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mt-6 rounded-3xl bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-700">
            Drafting PO for: {product.name} (SKU: {product.sku})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="supplierId"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Supplier
            </label>
            <select
              id="supplierId"
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              required
              className={fieldClassName}
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name ?? supplier.company_name ?? 'Unnamed supplier'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="quantity"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
              className={fieldClassName}
            />
          </div>

          <div>
            <label
              htmlFor="unitCost"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Unit Cost
            </label>
            <input
              id="unitCost"
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(event) => setUnitCost(event.target.value)}
              required
              className={fieldClassName}
            />
          </div>

          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Order Total
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {formatCurrency(orderTotal)}
            </p>
          </div>

          <div>
            <label
              htmlFor="expectedDeliveryDate"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Expected Delivery
            </label>
            <input
              id="expectedDeliveryDate"
              type="date"
              value={expectedDeliveryDate}
              onChange={(event) => setExpectedDeliveryDate(event.target.value)}
              required
              className={fieldClassName}
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
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
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GeneratePOModal
