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

function createDefaultLine(products) {
  const defaultProduct = products[0]

  return {
    product_id: defaultProduct?.id ? String(defaultProduct.id) : '',
    quantity_ordered: 1,
    unit_cost: getProductUnitCost(defaultProduct),
  }
}

function createInitialFormData(products, suppliers) {
  return {
    poNumber: `PO-${Date.now()}`,
    supplierId: suppliers[0]?.id ? String(suppliers[0].id) : '',
    expectedDeliveryDate: '',
    lines: [createDefaultLine(products)],
  }
}

function formatCurrency(value) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return '$0.00'
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function NewPOModal({ isOpen, onClose, onSuccess, suppliers, products }) {
  const [formData, setFormData] = useState(() =>
    createInitialFormData(products, suppliers),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setFormData(createInitialFormData(products, suppliers))
    setSubmitting(false)
    setError('')
  }, [isOpen, products, suppliers])

  if (!isOpen) {
    return null
  }

  const orderTotal = formData.lines.reduce((sum, line) => {
    return sum + calculatePurchaseOrderLineTotal(line.quantity_ordered, line.unit_cost)
  }, 0)

  const handleFieldChange = (event) => {
    const { name, value } = event.target

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  const handleLineChange = (index, field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      lines: currentFormData.lines.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              ...(field === 'product_id'
                ? {
                    product_id: value,
                    unit_cost: getProductUnitCost(
                      products.find((product) => String(product.id) === String(value)),
                    ),
                  }
                : {
                    [field]: value,
                  }),
            }
          : line,
      ),
    }))
  }

  const handleAddLine = () => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      lines: [...currentFormData.lines, createDefaultLine(products)],
    }))
  }

  const handleRemoveLine = (index) => {
    setFormData((currentFormData) => {
      if (currentFormData.lines.length === 1) {
        return {
          ...currentFormData,
          lines: [createDefaultLine(products)],
        }
      }

      return {
        ...currentFormData,
        lines: currentFormData.lines.filter((_, lineIndex) => lineIndex !== index),
      }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const normalizedLines = formData.lines.map((line) => ({
      product_id: parseInt(line.product_id, 10),
      quantity_ordered: parseInt(line.quantity_ordered, 10),
      unit_cost: parseFloat(line.unit_cost),
    }))

    const hasInvalidLine = normalizedLines.some(
      (line) =>
        !Number.isInteger(line.product_id) ||
        line.product_id <= 0 ||
        !Number.isInteger(line.quantity_ordered) ||
        line.quantity_ordered <= 0 ||
        !Number.isFinite(line.unit_cost) ||
        line.unit_cost < 0,
    )

    if (
      !formData.poNumber.trim() ||
      !Number.isInteger(parseInt(formData.supplierId, 10)) ||
      !formData.expectedDeliveryDate ||
      hasInvalidLine
    ) {
      setSubmitting(false)
      setError('Please complete the PO header and every line item before submitting.')
      return
    }

    try {
      await apiClient.post('/scm/purchase-orders', {
        po_number: formData.poNumber.trim(),
        supplier_id: parseInt(formData.supplierId, 10),
        expected_delivery_date: formData.expectedDeliveryDate,
        lines: normalizedLines,
      })

      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to create the purchase order. Please try again.'

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              SCM
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              New Purchase Order
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Build a multi-line PO and send it through the procurement workflow.
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
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="poNumber"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                PO Number
              </label>
              <input
                id="poNumber"
                name="poNumber"
                type="text"
                value={formData.poNumber}
                onChange={handleFieldChange}
                required
                className={fieldClassName}
              />
            </div>

            <div>
              <label
                htmlFor="supplierId"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Supplier
              </label>
              <select
                id="supplierId"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleFieldChange}
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
                htmlFor="expectedDeliveryDate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Expected Delivery
              </label>
              <input
                id="expectedDeliveryDate"
                name="expectedDeliveryDate"
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={handleFieldChange}
                required
                className={fieldClassName}
              />
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-5">
            <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Product
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Quantity
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Unit Cost
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Line Total
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Action
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {formData.lines.map((line, index) => (
                <div
                  key={`po-line-${index}`}
                  className="grid gap-3 rounded-3xl bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)] md:grid-cols-[2fr_1fr_1fr_1fr_auto]"
                >
                  <select
                    value={line.product_id}
                    onChange={(event) =>
                      handleLineChange(index, 'product_id', event.target.value)
                    }
                    required
                    className={fieldClassName}
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name ?? product.sku ?? `Product ${product.id}`}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={line.quantity_ordered}
                    onChange={(event) =>
                      handleLineChange(
                        index,
                        'quantity_ordered',
                        event.target.value,
                      )
                    }
                    required
                    className={fieldClassName}
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unit_cost}
                    onChange={(event) =>
                      handleLineChange(index, 'unit_cost', event.target.value)
                    }
                    required
                    className={fieldClassName}
                  />

                  <div className="flex items-center rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    {formatCurrency(
                      calculatePurchaseOrderLineTotal(
                        line.quantity_ordered,
                        line.unit_cost,
                      ),
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLine(index)}
                    className="rounded-full bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition-all hover:bg-rose-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddLine}
              className="mt-5 rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700 transition-all hover:border-blue-300 hover:bg-blue-100"
            >
              + Add Line Item
            </button>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Order Total
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {formatCurrency(orderTotal)}
              </p>
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
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewPOModal
