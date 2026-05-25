import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../api/client'
import { useAuth } from '../context/AuthContext'
import { resolveUserRole } from '../utils/permissions'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function formatCurrency(value) {
  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return 'N/A'
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatShortDate(value) {
  if (!value) {
    return 'N/A'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleDateString()
}

const initialMetrics = {
  totalRevenue: 0,
  employeeCount: 0,
  lowStockCount: 0,
  recentSales: [],
}

const adminPills = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'employees', label: 'Employees' },
  { id: 'projects', label: 'Projects' },
  { id: 'payroll', label: 'Payroll' },
]
const employeeStatusData = [
  { name: 'Permanent', value: 50, color: '#2563eb' },
  { name: 'Contract', value: 30, color: '#93c5fd' },
  { name: 'Part-time', value: 20, color: '#cbd5e1' },
]
const projectInitiatives = [
  {
    title: 'CareKenya Telehealth Deployment',
    description:
      'Final device rollout and clinician onboarding across the regional telehealth network.',
    progressClassName: 'w-3/4',
    progressLabel: '75%',
    stage: 'Rollout',
  },
  {
    title: 'Alliance Complex Networking',
    description:
      'Core switch refresh, wireless coverage tuning, and endpoint validation for the campus floor plan.',
    progressClassName: 'w-1/2',
    progressLabel: '52%',
    stage: 'Implementation',
  },
  {
    title: 'Parklands Site Setup',
    description:
      'Pre-opening infrastructure prep covering racks, workstations, and inventory positioning.',
    progressClassName: 'w-2/3',
    progressLabel: '68%',
    stage: 'Setup',
  },
]
const recentPayrollRuns = [
  {
    name: 'May 2026 Standard Run',
    processedOn: 'May 22, 2026',
    headcount: '124 staff',
    status: 'Cleared',
  },
  {
    name: 'April 2026 Standard Run',
    processedOn: 'April 24, 2026',
    headcount: '121 staff',
    status: 'Cleared',
  },
  {
    name: 'March 2026 Adjustment Run',
    processedOn: 'March 30, 2026',
    headcount: '18 staff',
    status: 'Cleared',
  },
]

const cardClassName =
  'rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'

function Dashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [metrics, setMetrics] = useState(initialMetrics)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    const loadMetrics = async () => {
      try {
        const response = await apiClient.get('/dashboard/metrics')
        const payload = response.data?.data ?? response.data ?? initialMetrics

        if (!isActive) {
          return
        }

        setMetrics({
          totalRevenue: Number(payload.totalRevenue ?? 0),
          employeeCount: Number(payload.employeeCount ?? 0),
          lowStockCount: Number(payload.lowStockCount ?? 0),
          recentSales: Array.isArray(payload.recentSales)
            ? payload.recentSales
            : [],
        })
      } catch (error) {
        console.error('Failed to load dashboard metrics:', error)

        if (!isActive) {
          return
        }

        setMetrics(initialMetrics)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadMetrics()

    return () => {
      isActive = false
    }
  }, [])

  function renderOverviewTab() {
    const kpiCards = [
      {
        label: 'Total Revenue',
        value: formatCurrency(metrics.totalRevenue),
        change: '+12.8%',
        valueClassName: 'text-slate-950',
      },
      {
        label: 'Employees',
        value: metrics.employeeCount,
        change: '+4.3%',
        valueClassName: 'text-slate-950',
      },
      {
        label: 'Low Stock',
        value: metrics.lowStockCount,
        change: '+1.6%',
        valueClassName:
          metrics.lowStockCount > 0 ? 'text-rose-600' : 'text-slate-950',
      },
    ]

    return (
      <div className="space-y-6">
        <div className={`${cardClassName} p-6 sm:p-8`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
                Executive Overview
              </p>
              <h2 className="mt-3 font-sans text-4xl font-bold tracking-tight text-slate-950">
                Business Performance Dashboard
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              A soft, high-clarity view into revenue, staffing, and inventory
              pressure for fast executive decision-making.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {kpiCards.map((card) => (
            <div key={card.label} className={`${cardClassName} p-6 sm:p-7`}>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {card.label}
                </p>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  {card.change}
                </span>
              </div>
              <p className={`mt-8 text-5xl font-bold tracking-tight ${card.valueClassName}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className={`${cardClassName} p-6 sm:p-8`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Revenue Trend
              </p>
              <h3 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-950">
                Recent Sales
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              Showing the 5 most recent closed sales orders.
            </p>
          </div>

          <div className="mt-8 h-[320px]">
            {metrics.recentSales.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.recentSales} barGap={12}>
                  <CartesianGrid vertical={false} horizontal={false} />
                  <XAxis
                    dataKey="customer_name"
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    cursor={{ fill: '#eff6ff' }}
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label, payload) => {
                      const saleDate = payload?.[0]?.payload?.created_at
                      return `${label} - ${formatShortDate(saleDate)}`
                    }}
                    contentStyle={{
                      borderRadius: '20px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                    }}
                  />
                  <Bar
                    dataKey="total_amount"
                    fill="#3b82f6"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl bg-slate-50 text-sm text-slate-500">
                No recent sales available for visualization.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className={`${cardClassName} p-6 sm:p-8`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Team Mix
                </p>
                <h3 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-950">
                  Employee Status
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">
                3 Groups
              </span>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr] lg:items-center">
              <div className="mx-auto h-[220px] w-full max-w-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={employeeStatusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {employeeStatusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {employeeStatusData.map((entry) => (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm font-medium text-slate-600">
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-950">
                      {entry.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`${cardClassName} p-6 sm:p-8`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Snapshot
                </p>
                <h3 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-950">
                  Leadership Notes
                </h3>
              </div>
              <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">
                Updated Today
              </span>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-950">
                  Revenue momentum remains positive
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Recent sales continue to contribute a healthy top-line trend,
                  with the strongest movement concentrated in the latest orders.
                </p>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-950">
                  Inventory exceptions need attention
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Low-stock items should be reviewed alongside warehouse intake
                  to reduce risk of delayed fulfillment.
                </p>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-950">
                  Workforce mix is stable
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Headcount distribution remains balanced across permanent,
                  contract, and part-time staffing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderEmployeesTab() {
    const totalEmployees = Math.max(metrics.employeeCount, 24)
    const departmentHeadcount = [
      {
        name: 'Clinical Operations',
        count: Math.max(8, Math.round(totalEmployees * 0.3)),
        support: 'Field coordination and patient support',
        progressClassName: 'w-4/5',
      },
      {
        name: 'Sales Enablement',
        count: Math.max(6, Math.round(totalEmployees * 0.24)),
        support: 'Pipeline coverage and account follow-up',
        progressClassName: 'w-2/3',
      },
      {
        name: 'Warehouse & Logistics',
        count: Math.max(5, Math.round(totalEmployees * 0.22)),
        support: 'Receiving, dispatch, and stock handling',
        progressClassName: 'w-3/5',
      },
      {
        name: 'Shared Services',
        count: Math.max(4, Math.round(totalEmployees * 0.18)),
        support: 'HR, finance, and operational support',
        progressClassName: 'w-1/2',
      },
    ]
    const topActiveStaff = [
      {
        name: 'Amina Njeri',
        role: 'Regional Operations Lead',
        status: 'On duty',
      },
      {
        name: 'Brian Otieno',
        role: 'Senior Inventory Coordinator',
        status: 'In field review',
      },
      {
        name: 'Clare Wambui',
        role: 'Enterprise Account Manager',
        status: 'Client follow-up',
      },
    ]

    return (
      <div className="space-y-6">
        <div className={`${cardClassName} p-6 sm:p-8`}>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Workforce Snapshot
          </p>
          <h2 className="mt-3 font-sans text-4xl font-bold tracking-tight text-slate-950">
            Department Headcount
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            A quick operational view of where staffing is concentrated across
            the business today.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {departmentHeadcount.map((department) => (
            <div key={department.name} className={`${cardClassName} p-6`}>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                {department.name}
              </p>
              <p className="mt-6 text-4xl font-bold tracking-tight text-slate-950">
                {department.count}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {department.support}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className={`${cardClassName} p-6 sm:p-8`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Allocation
                </p>
                <h3 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-950">
                  Team Distribution
                </h3>
              </div>
              <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">
                {totalEmployees} Total Staff
              </span>
            </div>

            <div className="mt-8 space-y-5">
              {departmentHeadcount.map((department) => (
                <div key={department.name}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-700">
                      {department.name}
                    </p>
                    <span className="text-sm text-slate-500">
                      {department.count} staff
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full bg-blue-500 ${department.progressClassName}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${cardClassName} p-6 sm:p-8`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Activity
                </p>
                <h3 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-950">
                  Top Active Staff
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500">
                Live Snapshot
              </span>
            </div>

            <div className="mt-8 space-y-4">
              {topActiveStaff.map((staffMember) => (
                <div
                  key={staffMember.name}
                  className="rounded-3xl bg-slate-50 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {staffMember.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {staffMember.role}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                      {staffMember.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderProjectsTab() {
    return (
      <div className="space-y-6">
        <div className={`${cardClassName} p-6 sm:p-8`}>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Initiatives
          </p>
          <h2 className="mt-3 font-sans text-4xl font-bold tracking-tight text-slate-950">
            Active Projects
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Track strategic rollouts and site readiness with a lighter executive
            summary of progress.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {projectInitiatives.map((project) => (
            <div key={project.title} className={`${cardClassName} p-6 sm:p-7`}>
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600">
                  {project.stage}
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  {project.progressLabel}
                </span>
              </div>

              <h3 className="mt-8 font-sans text-2xl font-bold tracking-tight text-slate-950">
                {project.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                {project.description}
              </p>

              <div className="mt-8">
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full bg-blue-500 ${project.progressClassName}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderPayrollTab() {
    return (
      <div className="space-y-6">
        <div className={`${cardClassName} p-6 sm:p-8`}>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Payroll
          </p>
          <h2 className="mt-3 font-sans text-4xl font-bold tracking-tight text-slate-950">
            Recent Payroll Runs
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            A focused summary of the latest payroll processing cycles and their
            settlement status.
          </p>
        </div>

        <div className={`${cardClassName} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Run
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Processed
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Headcount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayrollRuns.map((run) => (
                  <tr key={run.name} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {run.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {run.processedOn}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {run.headcount}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                        {run.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  function renderAdminTabContent() {
    switch (activeTab) {
      case 'employees':
        return renderEmployeesTab()
      case 'projects':
        return renderProjectsTab()
      case 'payroll':
        return renderPayrollTab()
      case 'dashboard':
      default:
        return renderOverviewTab()
    }
  }

  function renderAdminDashboard() {
    return (
      <section className="space-y-6 rounded-[2rem] bg-slate-50 p-1 sm:p-2">
        <div className={`${cardClassName} p-6 sm:p-8`}>
          <div className="flex flex-wrap gap-3">
            {adminPills.map((pill) => {
              const isActive = activeTab === pill.id

              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActiveTab(pill.id)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {pill.label}
                </button>
              )
            })}
          </div>
        </div>

        {renderAdminTabContent()}
      </section>
    )
  }

  function renderStandardDashboard() {
    const displayName = user?.name ?? user?.username ?? 'ERP User'
    const quickActions = [
      {
        title: 'View Sales Pipeline',
        description:
          'Track incoming orders, follow customer demand, and stay close to what needs attention next.',
        to: '/sales',
        icon: (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19h16" />
            <path d="M7 16V9" />
            <path d="M12 16V5" />
            <path d="M17 16v-3" />
          </svg>
        ),
      },
      {
        title: 'Check Inventory',
        description:
          'Review available stock before confirming new orders and keep fulfillment moving smoothly.',
        to: '/inventory',
        icon: (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 3 7 4v10l-7 4-7-4V7l7-4Z" />
            <path d="m12 12 7-4" />
            <path d="M12 12 5 8" />
            <path d="M12 12v9" />
          </svg>
        ),
      },
    ]

    return (
      <section className="rounded-[2rem] bg-slate-50 p-1 sm:p-2">
        <div className="mb-6 rounded-3xl bg-white p-10 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Workspace
          </p>
          <h2 className="mt-4 font-sans text-4xl font-bold tracking-tight text-slate-950">
            Welcome back, {displayName}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
            Step into your daily workspace with the tools that help you move
            orders faster, stay ahead of stock issues, and keep customer
            activity flowing.
          </p>
        </div>

        <div>
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Quick Actions
            </p>
            <h3 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-950">
              Jump into your daily workflow
            </h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.to}
                className="group cursor-pointer rounded-3xl bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
                  {action.icon}
                </div>

                <div className="mt-6">
                  <h4 className="font-sans text-xl font-bold tracking-tight text-slate-950">
                    {action.title}
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {action.description}
                  </p>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors group-hover:text-blue-700">
                  Open workspace
                  <span aria-hidden="true">-&gt;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="space-y-6 rounded-[2rem] bg-slate-50 p-1 sm:p-2">
        <div className={`${cardClassName} p-8`}>
          <div className="flex flex-wrap gap-3">
            <div className="h-10 w-28 animate-pulse rounded-full bg-slate-200" />
            <div className="h-10 w-28 animate-pulse rounded-full bg-slate-100" />
            <div className="h-10 w-28 animate-pulse rounded-full bg-slate-100" />
            <div className="h-10 w-28 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="mt-8 h-4 w-36 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-12 w-80 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-slate-100" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className={`${cardClassName} p-6`}>
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-8 h-12 w-40 animate-pulse rounded bg-slate-100" />
          </div>
          <div className={`${cardClassName} p-6`}>
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-8 h-12 w-32 animate-pulse rounded bg-slate-100" />
          </div>
          <div className={`${cardClassName} p-6`}>
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-8 h-12 w-28 animate-pulse rounded bg-slate-100" />
          </div>
        </div>

        <div className={`${cardClassName} p-6`}>
          <div className="h-5 w-56 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 h-[300px] animate-pulse rounded-3xl bg-slate-100" />
        </div>
      </section>
    )
  }

  if (resolveUserRole(user) === 'Admin') {
    return renderAdminDashboard()
  }

  return renderStandardDashboard()
}

export default Dashboard
