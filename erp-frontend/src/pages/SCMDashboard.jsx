import { useCallback, useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import apiClient from '../api/client'
import EditVendorModal from '../components/EditVendorModal'
import NewPOModal from '../components/NewPOModal'
import NewVendorModal from '../components/NewVendorModal'
import UpdatePOStatusModal from '../components/UpdatePOStatusModal'
import UpdateShipmentModal from '../components/UpdateShipmentModal'
import UpdateVendorStatusModal from '../components/UpdateVendorStatusModal'

const scmTabs = [
  { id: 'pos', label: 'Purchase Orders' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'logistics', label: 'Logistics' },
  { id: 'forecast', label: 'Demand Forecasting' },
]

function formatDate(value) {
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

function formatDaysUntilStockout(value) {
  const days = Number(value)

  if (!Number.isFinite(days)) {
    return 'Stable'
  }

  return `${days} days`
}

function getStatusBadgeClassName(status) {
  const normalizedStatus = String(status ?? '').toLowerCase()

  switch (normalizedStatus) {
    case 'submitted':
    case 'in transit':
      return 'bg-blue-50 text-blue-700'
    case 'pending':
      return 'bg-amber-50 text-amber-700'
    case 'received':
    case 'delivered':
    case 'active':
      return 'bg-emerald-50 text-emerald-700'
    case 'partially received':
    case 'on hold':
      return 'bg-indigo-50 text-indigo-700'
    case 'cancelled':
    case 'terminated':
      return 'bg-rose-50 text-rose-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function SCMDashboard() {
  const [activeTab, setActiveTab] = useState('pos')
  const [pos, setPOs] = useState([])
  const [vendors, setVendors] = useState([])
  const [products, setProducts] = useState([])
  const [shipments, setShipments] = useState([])
  const [forecast, setForecast] = useState([])
  const [isPOModalOpen, setIsPOModalOpen] = useState(false)
  const [isPOStatusModalOpen, setIsPOStatusModalOpen] = useState(false)
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false)
  const [isVendorEditModalOpen, setIsVendorEditModalOpen] = useState(false)
  const [isVendorStatusModalOpen, setIsVendorStatusModalOpen] = useState(false)
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPOs = useCallback(async () => {
    const response = await apiClient.get('/scm/purchase-orders')
    const poRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(poRecords) ? poRecords : []
  }, [])

  const fetchVendors = useCallback(async () => {
    const response = await apiClient.get('/scm/vendors')
    const vendorRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(vendorRecords) ? vendorRecords : []
  }, [])

  const fetchShipments = useCallback(async () => {
    const response = await apiClient.get('/scm/shipments')
    const shipmentRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(shipmentRecords) ? shipmentRecords : []
  }, [])

  const fetchForecast = useCallback(async () => {
    const response = await apiClient.get('/scm/forecast')
    const forecastRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(forecastRecords) ? forecastRecords : []
  }, [])

  const fetchProducts = useCallback(async () => {
    const response = await apiClient.get('/inventory/products')
    const productRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(productRecords) ? productRecords : []
  }, [])

  const refreshPOData = useCallback(async () => {
    const [poRecords, vendorRecords, productRecords] = await Promise.all([
      fetchPOs(),
      fetchVendors(),
      fetchProducts(),
    ])

    setPOs(poRecords)
    setVendors(vendorRecords)
    setProducts(productRecords)
  }, [fetchPOs, fetchProducts, fetchVendors])

  const refreshVendorData = useCallback(async () => {
    try {
      const vendorRecords = await fetchVendors()
      setVendors(vendorRecords)
    } catch (requestError) {
      console.error('Failed to refresh vendor data:', requestError)
      setVendors([])
    }
  }, [fetchVendors])

  const refreshShipmentData = useCallback(async () => {
    try {
      const shipmentRecords = await fetchShipments()
      setShipments(shipmentRecords)
    } catch (requestError) {
      console.error('Failed to refresh shipment data:', requestError)
      setShipments([])
    }
  }, [fetchShipments])

  useEffect(() => {
    let isActive = true

    const loadActiveTabData = async () => {
      setLoading(true)
      setError('')

      try {
        if (activeTab === 'pos') {
          const [poRecords, vendorRecords, productRecords] = await Promise.all([
            fetchPOs(),
            fetchVendors(),
            fetchProducts(),
          ])

          if (!isActive) {
            return
          }

          setPOs(poRecords)
          setVendors(vendorRecords)
          setProducts(productRecords)
          return
        }

        if (activeTab === 'vendors') {
          const vendorRecords = await fetchVendors()

          if (!isActive) {
            return
          }

          setVendors(vendorRecords)
          return
        }

        if (activeTab === 'logistics') {
          const shipmentRecords = await fetchShipments()

          if (!isActive) {
            return
          }

          setShipments(shipmentRecords)
          return
        }

        const forecastRecords = await fetchForecast()

        if (!isActive) {
          return
        }

        setForecast(forecastRecords)
      } catch (requestError) {
        console.error(`Failed to load ${activeTab} SCM data:`, requestError)

        if (!isActive) {
          return
        }

        if (activeTab === 'pos') {
          setPOs([])
          setVendors([])
          setProducts([])
          setError('Unable to load purchase orders right now.')
        } else if (activeTab === 'vendors') {
          setVendors([])
          setError('Unable to load vendors right now.')
        } else if (activeTab === 'logistics') {
          setShipments([])
          setError('Unable to load logistics data right now.')
        } else {
          setForecast([])
          setError('Unable to load demand forecasting data right now.')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadActiveTabData()

    return () => {
      isActive = false
    }
  }, [
    activeTab,
    fetchForecast,
    fetchPOs,
    fetchProducts,
    fetchShipments,
    fetchVendors,
  ])

  useEffect(() => {
    if (!isPOModalOpen || (vendors.length > 0 && products.length > 0)) {
      return
    }

    refreshPOData().catch((requestError) => {
      console.error('Failed to preload PO modal data:', requestError)
    })
  }, [isPOModalOpen, products.length, refreshPOData, vendors.length])

  function renderLoadingCard(message) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="h-5 w-56 animate-pulse rounded bg-slate-200" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <p className="mt-6 text-sm text-slate-500">{message}</p>
      </div>
    )
  }

  function renderErrorCard(title, message) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
      </div>
    )
  }

  function renderPOTab() {
    if (loading) {
      return renderLoadingCard('Loading purchase orders...')
    }

    if (error) {
      return renderErrorCard('Purchase order data unavailable', error)
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              SCM
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Purchase Orders
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Review supplier commitments, expected deliveries, and purchasing
              status from one procurement workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPOModalOpen(true)}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            New PO
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    PO Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Supplier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Order Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Expected Delivery
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
                {pos.map((po) => (
                  <tr key={po.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {po.po_number ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {po.supplier_name ?? 'Unknown supplier'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(po.order_date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(po.expected_delivery_date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatCurrency(po.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-medium ${getStatusBadgeClassName(
                          po.status,
                        )}`}
                      >
                        {po.status ?? 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPO(po)
                          setIsPOStatusModalOpen(true)
                        }}
                        className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700 transition-all hover:bg-slate-200"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pos.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No purchase orders found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Once procurement orders are issued, they will appear here for
                  the supply team to track.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderVendorsTab() {
    if (loading) {
      return renderLoadingCard('Loading vendors...')
    }

    if (error) {
      return renderErrorCard('Vendor data unavailable', error)
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
              SCM
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Vendor Directory
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Keep supplier contacts, payment arrangements, and procurement
              relationships in one searchable workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsVendorModalOpen(true)}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            New Vendor
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vendor Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Payment Terms
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
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {vendor.name ?? vendor.company_name ?? 'Unnamed vendor'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {vendor.email ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {vendor.payment_terms ?? 'Not set'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-medium ${getStatusBadgeClassName(
                          vendor.status,
                        )}`}
                      >
                        {vendor.status ?? 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVendor(vendor)
                            setIsVendorEditModalOpen(true)
                          }}
                          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 font-semibold text-white transition-all hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVendor(vendor)
                            setIsVendorStatusModalOpen(true)
                          }}
                          className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700 transition-all hover:bg-slate-200"
                        >
                          Update Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {vendors.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No vendors found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Vendor records will appear here once supplier onboarding is in
                  place.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderLogisticsTab() {
    if (loading) {
      return renderLoadingCard('Loading shipment schedules...')
    }

    if (error) {
      return renderErrorCard('Logistics data unavailable', error)
    }

    const incomingShipments = shipments.filter(
      (shipment) => shipment.reference_type === 'PurchaseOrder',
    )
    const outgoingShipments = shipments.filter(
      (shipment) => shipment.reference_type === 'SalesOrder',
    )

    const renderShipmentList = (items, emptyLabel) => {
      if (items.length === 0) {
        return (
          <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">
            {emptyLabel}
          </div>
        )
      }

      return (
        <div className="space-y-4">
          {items.map((shipment) => (
            <div
              key={shipment.id}
              className="flex flex-col gap-3 rounded-3xl bg-slate-50 p-5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.85),0_10px_24px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {shipment.tracking_number ?? 'Unassigned tracking'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  ETA {formatDate(shipment.estimated_arrival)}
                </p>
              </div>
              <span
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedShipment(shipment)
                  setIsShipmentModalOpen(true)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedShipment(shipment)
                    setIsShipmentModalOpen(true)
                  }
                }}
                className={`inline-flex cursor-pointer self-start rounded-full px-3 py-1 text-sm font-medium transition-all hover:opacity-80 ${getStatusBadgeClassName(
                  shipment.status,
                )}`}
              >
                {shipment.status ?? 'Unknown'}
              </span>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
            SCM
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            Logistics Control Tower
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Watch inbound replenishment and outbound customer deliveries from
            one shipment timeline.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Logistics
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              Incoming Shipments
            </h3>
            <div className="mt-6">
              {renderShipmentList(
                incomingShipments,
                'No incoming purchase order shipments are scheduled.',
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Logistics
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900">
              Outgoing Shipments
            </h3>
            <div className="mt-6">
              {renderShipmentList(
                outgoingShipments,
                'No outgoing sales order shipments are in motion right now.',
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderForecastingTab() {
    if (loading) {
      return renderLoadingCard('Loading demand forecast...')
    }

    if (error) {
      return renderErrorCard('Forecast data unavailable', error)
    }

    const atRiskProducts = [...forecast]
      .filter((product) => Number(product.days_until_stockout) > 0)
      .sort(
        (left, right) =>
          Number(left.days_until_stockout) - Number(right.days_until_stockout),
      )
      .slice(0, 3)

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
            SCM
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            Demand Forecasting
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Compare current stock against recent sales velocity to spotlight the
            next inventory pressure points.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {atRiskProducts.map((product) => (
            <div key={product.id} className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Stockout Risk
              </p>
              <p className="mt-4 text-lg font-semibold text-slate-900">
                {product.product_name ?? 'Unnamed product'}
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {formatDaysUntilStockout(product.days_until_stockout)}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Velocity {Number(product.velocity ?? 0)} vs stock{' '}
                {Number(product.stock_quantity ?? 0)}
              </p>
            </div>
          ))}

          {atRiskProducts.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-3">
              <p className="text-sm text-slate-500">
                No immediate stockout risks were identified from the current
                velocity snapshot.
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={forecast}
                margin={{ top: 10, right: 20, left: 0, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="product_name"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                  height={90}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="stock_quantity" fill="#cbd5e1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="velocity" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  function renderActiveTab() {
    switch (activeTab) {
      case 'vendors':
        return renderVendorsTab()
      case 'logistics':
        return renderLogisticsTab()
      case 'forecast':
        return renderForecastingTab()
      case 'pos':
      default:
        return renderPOTab()
    }
  }

  return (
    <section className="space-y-6 rounded-[2rem] bg-slate-50 p-1 sm:p-2">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">
          SCM
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Supply Chain Command Center
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Navigate supplier coordination, logistics execution, and demand
          signals from one multi-tab supply chain workspace.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {scmTabs.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-100 text-slate-500 shadow-[inset_1px_1px_0_rgba(255,255,255,0.9),0_10px_24px_rgba(15,23,42,0.05)] hover:bg-white hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {renderActiveTab()}

      <NewPOModal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        onSuccess={refreshPOData}
        suppliers={vendors}
        products={products}
      />
      <UpdatePOStatusModal
        isOpen={isPOStatusModalOpen}
        onClose={() => {
          setIsPOStatusModalOpen(false)
          setSelectedPO(null)
        }}
        onSuccess={refreshPOData}
        purchaseOrder={selectedPO}
      />
      <NewVendorModal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        onSuccess={refreshVendorData}
      />
      <EditVendorModal
        isOpen={isVendorEditModalOpen}
        onClose={() => {
          setIsVendorEditModalOpen(false)
          setSelectedVendor(null)
        }}
        onSuccess={refreshVendorData}
        vendor={selectedVendor}
      />
      <UpdateVendorStatusModal
        isOpen={isVendorStatusModalOpen}
        onClose={() => {
          setIsVendorStatusModalOpen(false)
          setSelectedVendor(null)
        }}
        onSuccess={refreshVendorData}
        vendor={selectedVendor}
      />
      <UpdateShipmentModal
        isOpen={isShipmentModalOpen}
        onClose={() => {
          setIsShipmentModalOpen(false)
          setSelectedShipment(null)
        }}
        onSuccess={refreshShipmentData}
        shipment={selectedShipment}
      />
    </section>
  )
}

export default SCMDashboard
