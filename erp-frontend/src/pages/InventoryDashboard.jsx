import { useCallback, useEffect, useState } from 'react'
import apiClient from '../api/client'
import EditWarehouseModal from '../components/EditWarehouseModal'
import GeneratePOModal from '../components/GeneratePOModal'
import NewWarehouseModal from '../components/NewWarehouseModal'

const inventoryTabs = [
  { id: 'alerts', label: 'Reorder Alerts' },
  { id: 'warehouses', label: 'Warehouses' },
  { id: 'valuation', label: 'Stock Valuation' },
]

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

function getWarehouseStatusBadgeClassName(isActive) {
  return isActive
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-slate-100 text-slate-600'
}

function getManagerName(warehouse) {
  return [warehouse?.first_name, warehouse?.last_name].filter(Boolean).join(' ') || 'Unassigned'
}

function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState('alerts')
  const [alerts, setAlerts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [valuations, setValuations] = useState([])
  const [managers, setManagers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [isGeneratePOModalOpen, setIsGeneratePOModalOpen] = useState(false)
  const [isNewWarehouseModalOpen, setIsNewWarehouseModalOpen] = useState(false)
  const [isEditWarehouseModalOpen, setIsEditWarehouseModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAlerts = useCallback(async () => {
    const response = await apiClient.get('/inventory/alerts')
    const alertRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(alertRecords) ? alertRecords : []
  }, [])

  const fetchWarehouses = useCallback(async () => {
    const response = await apiClient.get('/inventory/warehouses')
    const warehouseRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(warehouseRecords) ? warehouseRecords : []
  }, [])

  const fetchValuations = useCallback(async () => {
    const response = await apiClient.get('/inventory/valuation')
    const valuationRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(valuationRecords) ? valuationRecords : []
  }, [])

  const fetchManagers = useCallback(async () => {
    const response = await apiClient.get('/hr/employees')
    const managerRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(managerRecords) ? managerRecords : []
  }, [])

  const fetchSuppliers = useCallback(async () => {
    const response = await apiClient.get('/scm/vendors')
    const supplierRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(supplierRecords) ? supplierRecords : []
  }, [])

  const refreshAlerts = useCallback(async () => {
    try {
      const [alertRecords, supplierRecords] = await Promise.all([
        fetchAlerts(),
        fetchSuppliers(),
      ])
      setAlerts(alertRecords)
      setSuppliers(supplierRecords)
    } catch (requestError) {
      console.error('Failed to refresh inventory alerts:', requestError)
      setAlerts([])
      setSuppliers([])
    }
  }, [fetchAlerts, fetchSuppliers])

  const refreshWarehouses = useCallback(async () => {
    try {
      const [warehouseRecords, managerRecords] = await Promise.all([
        fetchWarehouses(),
        fetchManagers(),
      ])
      setWarehouses(warehouseRecords)
      setManagers(managerRecords)
    } catch (requestError) {
      console.error('Failed to refresh warehouses:', requestError)
      setWarehouses([])
      setManagers([])
    }
  }, [fetchManagers, fetchWarehouses])

  useEffect(() => {
    let isActive = true

    const loadActiveTabData = async () => {
      setLoading(true)
      setError('')

      try {
        if (activeTab === 'alerts') {
          const [alertRecords, supplierRecords] = await Promise.all([
            fetchAlerts(),
            fetchSuppliers(),
          ])

          if (!isActive) {
            return
          }

          setAlerts(alertRecords)
          setSuppliers(supplierRecords)
          return
        }

        if (activeTab === 'warehouses') {
          const [warehouseRecords, managerRecords] = await Promise.all([
            fetchWarehouses(),
            fetchManagers(),
          ])

          if (!isActive) {
            return
          }

          setWarehouses(warehouseRecords)
          setManagers(managerRecords)
          return
        }

        const valuationRecords = await fetchValuations()

        if (!isActive) {
          return
        }

        setValuations(valuationRecords)
      } catch (requestError) {
        console.error(`Failed to load ${activeTab} inventory data:`, requestError)

        if (!isActive) {
          return
        }

        if (activeTab === 'alerts') {
          setAlerts([])
          setSuppliers([])
          setError('Unable to load reorder alerts right now.')
        } else if (activeTab === 'warehouses') {
          setWarehouses([])
          setManagers([])
          setError('Unable to load warehouse data right now.')
        } else {
          setValuations([])
          setError('Unable to load stock valuation right now.')
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
  }, [activeTab, fetchAlerts, fetchManagers, fetchSuppliers, fetchValuations, fetchWarehouses])

  useEffect(() => {
    if (!isNewWarehouseModalOpen && !isEditWarehouseModalOpen) {
      return
    }

    if (managers.length > 0) {
      return
    }

    fetchManagers()
      .then((managerRecords) => {
        setManagers(managerRecords)
      })
      .catch((requestError) => {
        console.error('Failed to preload warehouse managers:', requestError)
        setManagers([])
      })
  }, [fetchManagers, isEditWarehouseModalOpen, isNewWarehouseModalOpen, managers.length])

  function renderLoadingCard(message) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="h-5 w-52 animate-pulse rounded bg-slate-200" />
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

  function renderAlertsTab() {
    if (loading) {
      return renderLoadingCard('Loading critical stock alerts...')
    }

    if (error) {
      return renderErrorCard('Inventory alerts unavailable', error)
    }

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            Inventory
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            Critical Stock Alerts
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Prioritize products that have dipped below their reorder thresholds
            and trigger replenishment decisions quickly.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Product Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Current Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Reorder Threshold
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Suggested Qty
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {alert.sku ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {alert.name ?? 'Unnamed Product'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-rose-600">
                      {alert.stock_quantity ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {alert.reorder_point ?? 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {alert.optimal_reorder_quantity ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAlert(alert)
                          setIsGeneratePOModalOpen(true)
                        }}
                        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                      >
                        Generate PO
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {alerts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No critical alerts found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Products below their reorder threshold will appear here for the
                  inventory team to action.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderWarehousesTab() {
    if (loading) {
      return renderLoadingCard('Loading warehouse network...')
    }

    if (error) {
      return renderErrorCard('Warehouse data unavailable', error)
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
              Inventory
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Warehouse Network
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Review site coverage, physical locations, and warehouse ownership
              across your distribution footprint.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewWarehouseModalOpen(true)}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            New Warehouse
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {warehouses.map((warehouse) => (
            <div key={warehouse.id} className="rounded-3xl bg-white p-8 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold text-slate-900">
                    {warehouse.name ?? 'Unnamed Warehouse'}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {warehouse.location_address ?? 'Location not available'}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getWarehouseStatusBadgeClassName(
                    warehouse.is_active,
                  )}`}
                >
                  {warehouse.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-8 rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Manager
                </p>
                <p className="mt-3 text-lg font-semibold text-slate-900">
                  {getManagerName(warehouse)}
                </p>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWarehouse(warehouse)
                    setIsEditWarehouseModalOpen(true)
                  }}
                  className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/60 bg-slate-100/70 px-5 py-2 text-sm font-semibold text-slate-700 backdrop-blur-md shadow-[inset_1px_1px_0_rgba(255,255,255,0.92),0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-blue-100/80 hover:text-slate-900 hover:shadow-md"
                >
                  Edit Warehouse
                </button>
              </div>
            </div>
          ))}
        </div>

        {warehouses.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              No warehouses found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Warehouse records will appear here when the network is configured.
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  function renderValuationTab() {
    if (loading) {
      return renderLoadingCard('Loading stock valuation...')
    }

    if (error) {
      return renderErrorCard('Valuation data unavailable', error)
    }

    const totalPortfolioValue = valuations.reduce((sum, valuation) => {
      return sum + Number(valuation.total_valuation ?? 0)
    }, 0)

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
            Inventory
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            Stock Valuation
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Monitor your inventory asset base with a FIFO-style valuation view
            across remaining batch balances.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total Portfolio Value
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-slate-950">
              {formatCurrency(totalPortfolioValue)}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Product Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Units
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total FIFO Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {valuations.map((valuation) => (
                  <tr key={valuation.id ?? valuation.sku} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {valuation.sku ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {valuation.name ?? 'Unnamed Product'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {valuation.total_remaining_quantity ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-950">
                      {formatCurrency(valuation.total_valuation)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {valuations.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No valuation data found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Inventory batches with available balance will appear here once
                  valuation data is available.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderActiveTab() {
    switch (activeTab) {
      case 'warehouses':
        return renderWarehousesTab()
      case 'valuation':
        return renderValuationTab()
      case 'alerts':
      default:
        return renderAlertsTab()
    }
  }

  return (
    <section className="space-y-6 rounded-[2rem] bg-slate-50 p-1 sm:p-2">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">
          Inventory
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Inventory Control Center
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Navigate stock risk, warehouse coverage, and valuation visibility from
          one multi-tab inventory workspace.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {inventoryTabs.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold backdrop-blur-md transition-all duration-300 ease-in-out ${
                  isActive
                    ? 'cursor-pointer border-blue-200/80 bg-blue-100/85 text-blue-950 shadow-[inset_1px_1px_0_rgba(255,255,255,0.88),0_12px_28px_rgba(59,130,246,0.18)] hover:-translate-y-1 hover:bg-blue-200/85 hover:shadow-md'
                    : 'cursor-pointer border-white/60 bg-slate-100/70 text-slate-600 shadow-[inset_1px_1px_0_rgba(255,255,255,0.92),0_12px_28px_rgba(15,23,42,0.08)] hover:-translate-y-1 hover:bg-blue-100/80 hover:text-slate-800 hover:shadow-md'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {renderActiveTab()}

      <GeneratePOModal
        isOpen={isGeneratePOModalOpen}
        onClose={() => {
          setIsGeneratePOModalOpen(false)
          setSelectedAlert(null)
        }}
        onSuccess={refreshAlerts}
        product={selectedAlert}
        suppliers={suppliers}
      />
      <NewWarehouseModal
        isOpen={isNewWarehouseModalOpen}
        onClose={() => setIsNewWarehouseModalOpen(false)}
        onSuccess={refreshWarehouses}
        managers={managers}
      />
      <EditWarehouseModal
        isOpen={isEditWarehouseModalOpen}
        onClose={() => {
          setIsEditWarehouseModalOpen(false)
          setSelectedWarehouse(null)
        }}
        onSuccess={refreshWarehouses}
        warehouse={selectedWarehouse}
        managers={managers}
      />
    </section>
  )
}

export default InventoryDashboard
