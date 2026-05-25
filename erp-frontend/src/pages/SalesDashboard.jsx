import { useCallback, useEffect, useState } from 'react'
import apiClient from '../api/client'
import CreateOrderModal from '../components/CreateOrderModal'
import SalesOrderDetailsModal from '../components/SalesOrderDetailsModal'
import UpdateSalesOrderStatusModal from '../components/UpdateSalesOrderStatusModal'
import { useAuth } from '../context/AuthContext'
import { canWrite } from '../utils/permissions'

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

function getStatusBadgeClassName(status) {
  const normalizedStatus = String(status ?? '').toLowerCase()

  switch (normalizedStatus) {
    case 'confirmed':
      return 'bg-blue-50 text-blue-700'
    case 'shipped':
      return 'bg-emerald-50 text-emerald-700'
    case 'cancelled':
      return 'bg-rose-50 text-rose-700'
    case 'draft':
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

async function fetchOrders() {
  const response = await apiClient.get('/sales')
  const salesOrders = response.data?.data ?? response.data ?? []

  return Array.isArray(salesOrders) ? salesOrders : []
}

function SalesDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const canManageSales = canWrite(user, 'Sales Orders')

  const loadOrders = useCallback(async () => {
    setLoading(true)

    try {
      const salesOrders = await fetchOrders()

      setOrders(salesOrders)
    } catch (error) {
      console.error('Failed to load sales orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Sales
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Sales Orders
            </h2>
          </div>
          <div className="h-10 w-36 animate-pulse rounded-full bg-slate-200" />
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <p className="mt-6 text-sm text-slate-500">Loading sales data...</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
            Sales
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            Sales Orders
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Track order activity, fulfillment progress, and account coverage in
            one place.
          </p>
        </div>

        {canManageSales ? (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            Create Order
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Order ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {orders.map((order, index) => (
                <tr
                  key={
                    order.id ??
                    order.orderId ??
                    order.order_id ??
                    `${order.customerId ?? order.customer_id}-${index}`
                  }
                  className="transition hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {order.id ?? order.orderId ?? order.order_id ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {order.customer_company_name ?? order.customer_id ?? 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {formatOrderDate(
                      order.date ??
                        order.order_date ??
                        order.createdAt ??
                        order.created_at,
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 font-medium ${getStatusBadgeClassName(
                        order.status,
                      )}`}
                    >
                      {order.status ?? 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(order)
                          setIsDetailsModalOpen(true)
                        }}
                        className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200"
                      >
                        View Details
                      </button>
                      {canManageSales ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order)
                            setIsStatusModalOpen(true)
                          }}
                          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                        >
                          Update Status
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto max-w-md">
              <h3 className="text-lg font-semibold text-slate-900">
                No sales orders found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Once your sales records are available, they will appear here for
                the team to review.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadOrders}
      />
      <SalesOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedOrder(null)
        }}
        orderId={selectedOrder?.id}
      />
      <UpdateSalesOrderStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false)
          setSelectedOrder(null)
        }}
        onSuccess={loadOrders}
        order={selectedOrder}
      />
    </section>
  )
}

export default SalesDashboard
