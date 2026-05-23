import { useCallback, useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import apiClient from '../api/client'

const biTabs = [
  { id: 'executive', label: 'Executive Overview' },
  { id: 'reports', label: 'Custom Reports & Exports' },
  { id: 'audit', label: 'Audit Trail' },
]

const reportModules = ['Finance', 'HR', 'SCM', 'CRM']

function formatCurrency(value) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return 'N/A'
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateTime(value) {
  if (!value) {
    return 'N/A'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsedDate)
}

function getUserName(log) {
  return [log?.first_name, log?.last_name].filter(Boolean).join(' ') || 'Unknown User'
}

function BIDashboard() {
  const [activeTab, setActiveTab] = useState('executive')
  const [kpis, setKpis] = useState({
    totalRevenue: 0,
    totalPipeline: 0,
    inventoryValue: 0,
  })
  const [revenueTrend, setRevenueTrend] = useState([])
  const [logs, setLogs] = useState([])
  const [exportingModule, setExportingModule] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchKPIs = useCallback(async () => {
    const response = await apiClient.get('/bi/kpis')
    return response.data?.data ?? response.data ?? {}
  }, [])

  const fetchRevenueTrend = useCallback(async () => {
    const response = await apiClient.get('/bi/revenue-trend')
    const records = response.data?.data ?? response.data ?? []

    return Array.isArray(records) ? records : []
  }, [])

  const fetchLogs = useCallback(async () => {
    const response = await apiClient.get('/bi/audit-logs')
    const records = response.data?.data ?? response.data ?? []

    return Array.isArray(records) ? records : []
  }, [])

  const handleExportCsv = async (moduleName) => {
    const moduleSlug = moduleName.toLowerCase()
    setExportingModule(moduleSlug)

    try {
      const response = await apiClient.get(`/bi/export/${moduleSlug}`, {
        responseType: 'blob',
      })

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const disposition = response.headers['content-disposition'] ?? ''
      const fileNameMatch = disposition.match(/filename="([^"]+)"/)
      const fileName = fileNameMatch?.[1] ?? `${moduleSlug}-export.csv`

      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (requestError) {
      console.error(`Failed to export ${moduleSlug} CSV:`, requestError)
      setError(`Unable to export the ${moduleName} CSV right now.`)
    } finally {
      setExportingModule('')
    }
  }

  useEffect(() => {
    let isActive = true

    const loadTabData = async () => {
      setLoading(true)
      setError('')

      try {
        if (activeTab === 'executive') {
          const [kpiData, trendData] = await Promise.all([
            fetchKPIs(),
            fetchRevenueTrend(),
          ])

          if (!isActive) {
            return
          }

          setKpis({
            totalRevenue: Number(kpiData.totalRevenue ?? 0),
            totalPipeline: Number(kpiData.totalPipeline ?? 0),
            inventoryValue: Number(kpiData.inventoryValue ?? 0),
          })
          setRevenueTrend(trendData)
          return
        }

        if (activeTab === 'audit') {
          const logRecords = await fetchLogs()

          if (!isActive) {
            return
          }

          setLogs(logRecords)
          return
        }
      } catch (requestError) {
        console.error(`Failed to load ${activeTab} BI data:`, requestError)

        if (!isActive) {
          return
        }

        if (activeTab === 'executive') {
          setKpis({
            totalRevenue: 0,
            totalPipeline: 0,
            inventoryValue: 0,
          })
          setRevenueTrend([])
        } else if (activeTab === 'audit') {
          setLogs([])
        }

        setError('Unable to load business intelligence data right now.')
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadTabData()

    return () => {
      isActive = false
    }
  }, [activeTab, fetchKPIs, fetchLogs, fetchRevenueTrend])

  function renderLoadingCard(message) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="h-5 w-56 animate-pulse rounded bg-slate-200" />
          <div className="h-20 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-3xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-3xl bg-slate-100" />
        </div>
        <p className="mt-6 text-sm text-slate-500">{message}</p>
      </div>
    )
  }

  function renderErrorCard(title) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
      </div>
    )
  }

  function renderExecutiveTab() {
    if (loading) {
      return renderLoadingCard('Loading executive KPIs...')
    }

    if (error) {
      return renderErrorCard('Executive insights unavailable')
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total Revenue
            </p>
            <p className="mt-5 text-4xl font-bold tracking-tight text-blue-600">
              {formatCurrency(kpis.totalRevenue)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Active Pipeline
            </p>
            <p className="mt-5 text-4xl font-bold tracking-tight text-emerald-600">
              {formatCurrency(kpis.totalPipeline)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total Inventory Value
            </p>
            <p className="mt-5 text-4xl font-bold tracking-tight text-slate-700">
              {formatCurrency(kpis.inventoryValue)}
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="border-b border-slate-100 pb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
              BI
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Revenue Trend (YTD)
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Monthly revenue performance from posted invoices across the current year.
            </p>
          </div>

          <div className="mt-8 h-[400px]">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart
                data={revenueTrend}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month_label"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#revenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  function renderReportsTab() {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="border-b border-slate-100 pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            BI
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            Data Export Center
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Launch one-click extracts for the operating teams while we build out
            the full custom reporting workflow.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {reportModules.map((moduleName) => (
            <div
              key={moduleName}
              className="flex flex-col gap-4 rounded-[1.75rem] border border-white/50 bg-blue-50/60 p-5 backdrop-blur-md shadow-[inset_1px_1px_0_rgba(255,255,255,0.82),0_12px_28px_rgba(59,130,246,0.08)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-blue-100/75 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-lg font-semibold text-slate-900">{moduleName}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Export the latest operational data as a CSV snapshot.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleExportCsv(moduleName)}
                disabled={exportingModule === moduleName.toLowerCase()}
                className="inline-flex cursor-pointer items-center justify-center rounded-full border border-blue-200/80 bg-blue-100/85 px-6 py-2.5 text-sm font-semibold text-blue-950 backdrop-blur-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-blue-200/85 hover:shadow-md"
              >
                {exportingModule === moduleName.toLowerCase() ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderAuditTab() {
    if (loading) {
      return renderLoadingCard('Loading audit trail...')
    }

    if (error) {
      return renderErrorCard('Audit trail unavailable')
    }

    return (
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="border-b border-slate-100 px-8 py-7">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            BI
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Audit Trail</h2>
          <p className="mt-2 text-sm text-slate-500">
            Review the most recent cross-functional system activity and user-level
            actions captured across the platform.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/60">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  User Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Module
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Resource
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="transition hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {getUserName(log)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {log.module ?? 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {log.action ?? 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {log.resource ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {log.details ?? 'No details provided'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No audit logs found</h3>
            <p className="mt-2 text-sm text-slate-500">
              Recent activity will appear here once user actions are logged by the system.
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  function renderActiveTab() {
    switch (activeTab) {
      case 'reports':
        return renderReportsTab()
      case 'audit':
        return renderAuditTab()
      case 'executive':
      default:
        return renderExecutiveTab()
    }
  }

  return (
    <section className="space-y-6 rounded-[2rem] bg-slate-50 p-1 sm:p-2">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
          BI
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Executive Intelligence Hub
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Consolidate top-line performance, reporting handoffs, and governance
          visibility from one executive business intelligence workspace.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {biTabs.map((tab) => {
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
    </section>
  )
}

export default BIDashboard
