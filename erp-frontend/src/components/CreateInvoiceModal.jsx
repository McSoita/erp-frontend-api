import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

const initialFormData = {
  invoiceNumber: '',
  orderId: '',
  dueDate: '',
  subtotal: '',
  taxAmount: '0',
}

function CreateInvoiceModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState(initialFormData)
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    let isActive = true
    const loadOrders = async () => {
      setLoadingOrders(true)
      try {
        const response = await apiClient.get('/sales')
        const records = response.data?.data ?? response.data ?? []
        if (!isActive) return
        const orderRecords = Array.isArray(records) ? records : []
        setOrders(orderRecords)
        setFormData({
          ...initialFormData,
          invoiceNumber: `INV-${Date.now()}`,
          orderId: String(orderRecords[0]?.id ?? ''),
        })
      } catch (requestError) {
        if (!isActive) return
        setOrders([])
        setError('Unable to load sales orders right now.')
      } finally {
        if (isActive) setLoadingOrders(false)
      }
    }

    setSubmitting(false)
    setError('')
    loadOrders()
    return () => {
      isActive = false
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await apiClient.post('/finance/invoices', {
        invoice_number: formData.invoiceNumber.trim(),
        order_id: parseInt(formData.orderId, 10),
        due_date: formData.dueDate,
        subtotal: parseFloat(formData.subtotal),
        tax_amount: parseFloat(formData.taxAmount),
      })
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.response?.data?.error ??
          'Unable to create invoice. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Finance
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Create Invoice</h2>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="invoiceNumber"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Invoice Number
              </label>
              <input
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="orderId" className="mb-2 block text-sm font-medium text-slate-700">
                Sales Order
              </label>
              <select
                id="orderId"
                name="orderId"
                value={formData.orderId}
                onChange={handleChange}
                required
                className={fieldClassName}
              >
                {orders.length === 0 ? <option value="">No sales orders available</option> : null}
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Order #{order.id} - {order.customer_company_name ?? 'Customer'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="subtotal" className="mb-2 block text-sm font-medium text-slate-700">
                Subtotal
              </label>
              <input
                id="subtotal"
                name="subtotal"
                type="number"
                min="0"
                step="0.01"
                value={formData.subtotal}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="taxAmount" className="mb-2 block text-sm font-medium text-slate-700">
                Tax Amount
              </label>
              <input
                id="taxAmount"
                name="taxAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.taxAmount}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="dueDate" className="mb-2 block text-sm font-medium text-slate-700">
                Due Date
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                required
                className={fieldClassName}
              />
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
            <button
              type="submit"
              disabled={submitting || loadingOrders || orders.length === 0}
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

export default CreateInvoiceModal
