import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'

function formatOrderDate(value) {
  if (!value) {
    return 'N/A'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleDateString()
}

function formatCurrency(value) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return 'N/A'
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function SalesOrderDetailsModal({ isOpen, onClose, orderId }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !orderId) {
      return
    }

    let isActive = true

    const fetchOrder = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await apiClient.get(`/sales/orders/${orderId}`)
        const data = response.data?.data ?? response.data ?? null

        if (!isActive) {
          return
        }

        setOrder(data)
      } catch (requestError) {
        if (!isActive) {
          return
        }

        const message =
          requestError.response?.data?.message ??
          requestError.response?.data?.error ??
          'Unable to load this sales order right now.'

        setOrder(null)
        setError(message)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    fetchOrder()

    return () => {
      isActive = false
    }
  }, [isOpen, orderId])

  if (!isOpen || !orderId) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        {loading ? (
          <div className="flex min-h-[20rem] items-center justify-center">
            <div className="flex items-center gap-3 text-slate-500">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              <span className="text-sm font-medium">Loading order details...</span>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-rose-100 bg-rose-50/70 p-6">
              <p className="text-lg font-semibold text-slate-900">Order unavailable</p>
              <p className="mt-2 text-sm text-rose-700">{error}</p>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={onClose} className={subtleButtonClassName}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 rounded-3xl bg-slate-50 p-6 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
                  Sales Order
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                  Order #{order?.id}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {order?.customer_company_name ?? 'Unassigned Customer'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Order Date
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {formatOrderDate(order?.order_date)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Total
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {formatCurrency(order?.total_amount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="text-xl font-semibold text-slate-900">Order Lines</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/60">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        SKU
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Quantity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Unit Price
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(order?.order_lines ?? []).map((line) => (
                      <tr key={line.id} className="transition hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {line.product_name ?? 'Unknown Product'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {line.product_sku ?? 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {line.quantity ?? 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatCurrency(line.unit_price)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          {formatCurrency(line.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={onClose} className={subtleButtonClassName}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesOrderDetailsModal
