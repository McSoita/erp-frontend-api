import { useCallback, useEffect, useState } from 'react'
import apiClient from '../api/client'
import CustomerRecordModal from '../components/CustomerRecordModal'
import EditCustomerModal from '../components/EditCustomerModal'
import EditPricingRuleModal from '../components/EditPricingRuleModal'
import NewCustomerModal from '../components/NewCustomerModal'
import NewOpportunityModal from '../components/NewOpportunityModal'
import NewPricingRuleModal from '../components/NewPricingRuleModal'
import NewQuotationModal from '../components/NewQuotationModal'
import UpdateOpportunityStageModal from '../components/UpdateOpportunityStageModal'
import UpdateQuotationStatusModal from '../components/UpdateQuotationStatusModal'
import { useAuth } from '../context/AuthContext'
import { canWrite } from '../utils/permissions'

const crmTabs = [
  { id: 'pipeline', label: 'Sales Pipeline' },
  { id: 'customers', label: 'Customers' },
  { id: 'quotes', label: 'Quotes & Orders' },
  { id: 'pricing', label: 'Pricing Rules' },
]

const pipelineStages = [
  'Lead',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
]

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

function formatDate(value) {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getCustomerName(customer) {
  return (
    customer?.company_name ||
    [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') ||
    customer?.name ||
    'Unnamed Customer'
  )
}

function getCustomerStatusBadgeClassName(status) {
  const normalizedStatus = String(status ?? '').trim().toLowerCase()

  if (normalizedStatus === 'active') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (normalizedStatus === 'lead') {
    return 'bg-blue-50 text-blue-700'
  }

  if (normalizedStatus === 'churned') {
    return 'bg-rose-50 text-rose-700'
  }

  return 'bg-slate-100 text-slate-600'
}

function getOpportunityStageBadgeClassName(stage) {
  const normalizedStage = String(stage ?? '').trim().toLowerCase()

  if (normalizedStage === 'closed won') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (normalizedStage === 'negotiation') {
    return 'bg-blue-50 text-blue-700'
  }

  if (normalizedStage === 'proposal') {
    return 'bg-amber-50 text-amber-700'
  }

  if (normalizedStage === 'qualified') {
    return 'bg-indigo-50 text-indigo-700'
  }

  if (normalizedStage === 'closed lost') {
    return 'bg-rose-50 text-rose-700'
  }

  return 'bg-slate-100 text-slate-600'
}

function getQuoteStatusBadgeClassName(status) {
  const normalizedStatus = String(status ?? '').trim().toLowerCase()

  if (normalizedStatus === 'accepted' || normalizedStatus === 'approved') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (normalizedStatus === 'draft') {
    return 'bg-slate-100 text-slate-600'
  }

  if (normalizedStatus === 'expired' || normalizedStatus === 'rejected') {
    return 'bg-rose-50 text-rose-700'
  }

  return 'bg-amber-50 text-amber-700'
}

function getPricingRuleBadgeClassName(isActive) {
  return isActive === false
    ? 'bg-slate-100 text-slate-600'
    : 'bg-emerald-50 text-emerald-700'
}

function CRMDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('pipeline')
  const [opportunities, setOpportunities] = useState([])
  const [customers, setCustomers] = useState([])
  const [quotations, setQuotations] = useState([])
  const [pricingRules, setPricingRules] = useState([])
  const [products, setProducts] = useState([])
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false)
  const [isOpportunityStageModalOpen, setIsOpportunityStageModalOpen] = useState(false)
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
  const [isEditPricingModalOpen, setIsEditPricingModalOpen] = useState(false)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false)
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false)
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false)
  const [isQuotationStatusModalOpen, setIsQuotationStatusModalOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedOpportunity, setSelectedOpportunity] = useState(null)
  const [selectedQuotation, setSelectedQuotation] = useState(null)
  const [selectedPricingRule, setSelectedPricingRule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const canManageCrm = canWrite(user, 'CRM')

  const fetchOpportunities = useCallback(async () => {
    const response = await apiClient.get('/crm/opportunities')
    const records = response.data?.data ?? response.data ?? []

    return Array.isArray(records) ? records : []
  }, [])

  const fetchCustomers = useCallback(async () => {
    const response = await apiClient.get('/crm/customers')
    const records = response.data?.data ?? response.data ?? []

    return Array.isArray(records) ? records : []
  }, [])

  const fetchQuotations = useCallback(async () => {
    const response = await apiClient.get('/crm/quotations')
    const records = response.data?.data ?? response.data ?? []

    return Array.isArray(records) ? records : []
  }, [])

  const fetchPricingRules = useCallback(async () => {
    const response = await apiClient.get('/crm/pricing-rules')
    const records = response.data?.data ?? response.data ?? []

    return Array.isArray(records) ? records : []
  }, [])

  const fetchProducts = useCallback(async () => {
    const response = await apiClient.get('/inventory/products')
    const records = response.data?.data ?? response.data ?? []

    return Array.isArray(records) ? records : []
  }, [])

  const refreshCustomers = useCallback(async () => {
    try {
      const records = await fetchCustomers()
      setCustomers(records)
    } catch (requestError) {
      console.error('Failed to refresh customers:', requestError)
      setCustomers([])
    }
  }, [fetchCustomers])

  const refreshQuotations = useCallback(async () => {
    try {
      const quotationRecords = await fetchQuotations()
      setQuotations(quotationRecords)
    } catch (requestError) {
      console.error('Failed to refresh quotations:', requestError)
      setQuotations([])
    }
  }, [fetchQuotations])

  const refreshPricingRules = useCallback(async () => {
    try {
      const [pricingRuleRecords, productRecords] = await Promise.all([
        fetchPricingRules(),
        fetchProducts(),
      ])

      setPricingRules(pricingRuleRecords)
      setProducts(productRecords)
    } catch (requestError) {
      console.error('Failed to refresh pricing rules:', requestError)
      setPricingRules([])
      setProducts([])
    }
  }, [fetchPricingRules, fetchProducts])

  const refreshPipelineData = useCallback(async () => {
    try {
      const [opportunityRecords, customerRecords] = await Promise.all([
        fetchOpportunities(),
        fetchCustomers(),
      ])

      setOpportunities(opportunityRecords)
      setCustomers(customerRecords)
    } catch (requestError) {
      console.error('Failed to refresh pipeline data:', requestError)
      setOpportunities([])
      setCustomers([])
    }
  }, [fetchCustomers, fetchOpportunities])

  useEffect(() => {
    let isActive = true

    const loadTabData = async () => {
      setLoading(true)
      setError('')

      try {
        if (activeTab === 'pipeline') {
          const [opportunityRecords, customerRecords] = await Promise.all([
            fetchOpportunities(),
            fetchCustomers(),
          ])

          if (!isActive) {
            return
          }

          setOpportunities(opportunityRecords)
          setCustomers(customerRecords)
          return
        }

        if (activeTab === 'customers') {
          const records = await fetchCustomers()

          if (!isActive) {
            return
          }

          setCustomers(records)
          return
        }

        if (activeTab === 'quotes') {
          const [quotationRecords, customerRecords] = await Promise.all([
            fetchQuotations(),
            fetchCustomers(),
          ])

          if (!isActive) {
            return
          }

          setQuotations(quotationRecords)
          setCustomers(customerRecords)
          return
        }

        const [pricingRuleRecords, productRecords] = await Promise.all([
          fetchPricingRules(),
          fetchProducts(),
        ])

        if (!isActive) {
          return
        }

        setPricingRules(pricingRuleRecords)
        setProducts(productRecords)
      } catch (requestError) {
        console.error(`Failed to load ${activeTab} CRM data:`, requestError)

        if (!isActive) {
          return
        }

        if (activeTab === 'pipeline') {
          setOpportunities([])
          setCustomers([])
        } else if (activeTab === 'customers') {
          setCustomers([])
        } else if (activeTab === 'quotes') {
          setQuotations([])
          setCustomers([])
        } else {
          setPricingRules([])
          setProducts([])
        }

        setError('Unable to load CRM data right now.')
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
  }, [
    activeTab,
    fetchCustomers,
    fetchOpportunities,
    fetchProducts,
    fetchPricingRules,
    fetchQuotations,
  ])

  useEffect(() => {
    if (!isPricingModalOpen && !isEditPricingModalOpen) {
      return
    }

    if (products.length > 0) {
      return
    }

    refreshPricingRules()
  }, [isEditPricingModalOpen, isPricingModalOpen, products.length, refreshPricingRules])

  useEffect(() => {
    if (!isOpportunityModalOpen && !isNewCustomerModalOpen && !isQuotationModalOpen) {
      return
    }

    if (customers.length > 0) {
      return
    }

    refreshCustomers()
  }, [
    customers.length,
    isNewCustomerModalOpen,
    isOpportunityModalOpen,
    isQuotationModalOpen,
    refreshCustomers,
  ])

  function renderLoadingCard(message) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
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

  function renderPipelineTab() {
    if (loading) {
      return renderLoadingCard('Loading opportunity pipeline...')
    }

    if (error) {
      return renderErrorCard('Pipeline unavailable')
    }

    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
              CRM
            </p>
            <h2 className="text-3xl font-semibold text-slate-900">Sales Pipeline</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-500">
              Track the commercial journey from first contact to close with a clean
              stage-by-stage view of the current book of business.
            </p>
          </div>

          {canManageCrm ? (
            <button
              type="button"
              onClick={() => setIsOpportunityModalOpen(true)}
              className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700"
            >
              New Opportunity
            </button>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 2xl:grid-cols-6 xl:grid-cols-3">
          {pipelineStages.map((stage) => {
            const stageRecords = opportunities.filter(
              (opportunity) =>
                String(opportunity.stage ?? '').trim().toLowerCase() ===
                stage.toLowerCase(),
            )

            return (
              <div
                key={stage}
                className="rounded-[2rem] border border-white/50 bg-slate-100/70 p-5 backdrop-blur-md shadow-[inset_1px_1px_0_rgba(255,255,255,0.82),0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-blue-50/80 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">{stage}</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                    {stageRecords.length}
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {stageRecords.map((opportunity) => (
                    <article
                      key={opportunity.id}
                      className="rounded-[1.75rem] border border-white/50 bg-blue-50/60 p-5 backdrop-blur-md shadow-[inset_1px_1px_0_rgba(255,255,255,0.82),0_12px_28px_rgba(59,130,246,0.08)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-blue-100/75 hover:shadow-md"
                    >
                      <h4 className="text-base font-semibold text-slate-900">
                        {opportunity.title ?? 'Untitled Opportunity'}
                      </h4>
                      <p className="mt-2 text-sm text-slate-500">
                        {opportunity.customer_name ?? 'Unassigned Customer'}
                      </p>
                      <p className="mt-4 text-lg font-semibold text-blue-600">
                        {formatCurrency(opportunity.estimated_value)}
                      </p>
                      {canManageCrm ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOpportunity(opportunity)
                            setIsOpportunityStageModalOpen(true)
                          }}
                          className="mt-4 cursor-pointer rounded-full border border-white/60 bg-slate-100/70 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur-md shadow-[inset_1px_1px_0_rgba(255,255,255,0.92),0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-blue-100/80 hover:text-slate-900 hover:shadow-md"
                        >
                          Update Stage
                        </button>
                      ) : null}
                    </article>
                  ))}

                  {stageRecords.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center text-sm text-slate-400">
                      No opportunities in this stage.
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function renderCustomersTab() {
    if (loading) {
      return renderLoadingCard('Loading customer records...')
    }

    if (error) {
      return renderErrorCard('Customer records unavailable')
    }

    return (
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-8 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
              CRM
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Customers</h2>
            <p className="mt-2 text-sm text-slate-500">
              Keep account details, contact channels, and customer touchpoints easy
              to reference for the sales team.
            </p>
          </div>

          {canManageCrm ? (
            <button
              type="button"
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700"
            >
              New Customer
            </button>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/60">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Phone
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
              {customers.map((customer) => (
                <tr key={customer.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {getCustomerName(customer)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {customer.primary_email ?? customer.email ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {customer.primary_phone ?? customer.phone ?? 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getCustomerStatusBadgeClassName(
                        customer.status,
                      )}`}
                    >
                      {customer.status ?? 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(customer.id)
                          setIsCustomerModalOpen(true)
                        }}
                        className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700"
                      >
                        View Record
                      </button>
                      {canManageCrm ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setIsEditCustomerModalOpen(true)
                          }}
                          className="cursor-pointer rounded-full border border-white/60 bg-slate-100/70 px-5 py-2 text-sm font-semibold text-slate-700 backdrop-blur-md shadow-[inset_1px_1px_0_rgba(255,255,255,0.92),0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-blue-100/80 hover:text-slate-900 hover:shadow-md"
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {customers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No customers found</h3>
            <p className="mt-2 text-sm text-slate-500">
              Customer accounts will appear here when they are added to the CRM.
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  function renderQuotesTab() {
    if (loading) {
      return renderLoadingCard('Loading quotation activity...')
    }

    if (error) {
      return renderErrorCard('Quotations unavailable')
    }

    return (
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-8 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
              CRM
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Quotes & Orders
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Stay on top of customer proposals, expiry windows, and the current
              commercial status of each quotation.
            </p>
          </div>

          {canManageCrm ? (
            <button
              type="button"
              onClick={() => setIsQuotationModalOpen(true)}
              className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700"
            >
              New Quotation
            </button>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/60">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Quote Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Valid Until
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Amount
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
              {quotations.map((quotation) => (
                <tr key={quotation.id} className="transition hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {quotation.quote_number ?? `Quote #${quotation.id}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {quotation.customer_name ?? 'Unassigned Customer'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {formatDate(quotation.valid_until)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                    {formatCurrency(quotation.total_amount)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getQuoteStatusBadgeClassName(
                        quotation.status,
                      )}`}
                    >
                      {quotation.status ?? 'Pending'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {canManageCrm ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQuotation(quotation)
                          setIsQuotationStatusModalOpen(true)
                        }}
                        className="cursor-pointer rounded-full border border-white/60 bg-slate-100/70 px-5 py-2 text-sm font-semibold text-slate-700 backdrop-blur-md shadow-[inset_1px_1px_0_rgba(255,255,255,0.92),0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-blue-100/80 hover:text-slate-900 hover:shadow-md"
                      >
                        Update Status
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {quotations.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No quotations found</h3>
            <p className="mt-2 text-sm text-slate-500">
              Quote activity will appear here as proposals are created for
              customers.
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  function renderPricingTab() {
    if (loading) {
      return renderLoadingCard('Loading pricing rules...')
    }

    if (error) {
      return renderErrorCard('Pricing rules unavailable')
    }

    return (
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-8 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
              CRM
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Pricing Rules
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Review volume-based discounts and product-specific pricing levers
              used by the sales team.
            </p>
          </div>

          {canManageCrm ? (
            <button
              type="button"
              onClick={() => setIsPricingModalOpen(true)}
              className="rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700"
            >
              New Pricing Rule
            </button>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/60">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Rule Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Target Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Minimum Quantity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Discount Percentage
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
              {pricingRules.map((rule) => (
                <tr key={rule.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {rule.rule_name ?? 'Untitled Rule'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {rule.product_name ?? 'Any Product'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {rule.min_quantity ?? 0}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    {Number(rule.discount_percentage ?? 0)}%
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPricingRuleBadgeClassName(
                        rule.is_active,
                      )}`}
                    >
                      {rule.is_active === false ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {canManageCrm ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPricingRule(rule)
                          setIsEditPricingModalOpen(true)
                        }}
                        className="cursor-pointer rounded-full border border-white/60 bg-slate-100/70 px-5 py-2 text-sm font-semibold text-slate-700 backdrop-blur-md shadow-[inset_1px_1px_0_rgba(255,255,255,0.92),0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-blue-100/80 hover:text-slate-900 hover:shadow-md"
                      >
                        Edit Rule
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pricingRules.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <h3 className="text-lg font-semibold text-slate-900">
              No pricing rules found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Discount and quantity break rules will appear here when configured.
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  function renderActiveTab() {
    switch (activeTab) {
      case 'customers':
        return renderCustomersTab()
      case 'quotes':
        return renderQuotesTab()
      case 'pricing':
        return renderPricingTab()
      case 'pipeline':
      default:
        return renderPipelineTab()
    }
  }

  return (
    <section className="space-y-6 rounded-[2rem] bg-slate-50 p-1 sm:p-2">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
          CRM
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          CRM & Sales Workspace
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Manage opportunity flow, customer accounts, quotations, and commercial
          pricing controls from one focused sales command center.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {crmTabs.map((tab) => {
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

      <NewOpportunityModal
        isOpen={isOpportunityModalOpen}
        onClose={() => setIsOpportunityModalOpen(false)}
        onSuccess={refreshPipelineData}
        customers={customers}
      />
      <UpdateOpportunityStageModal
        isOpen={isOpportunityStageModalOpen}
        onClose={() => {
          setIsOpportunityStageModalOpen(false)
          setSelectedOpportunity(null)
        }}
        onSuccess={refreshPipelineData}
        opportunity={selectedOpportunity}
      />
      <NewCustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onSuccess={refreshCustomers}
      />
      <EditCustomerModal
        isOpen={isEditCustomerModalOpen}
        onClose={() => {
          setIsEditCustomerModalOpen(false)
          setSelectedCustomer(null)
        }}
        onSuccess={refreshCustomers}
        customer={selectedCustomer}
      />
      <NewQuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        onSuccess={refreshQuotations}
        customers={customers}
      />
      <UpdateQuotationStatusModal
        isOpen={isQuotationStatusModalOpen}
        onClose={() => {
          setIsQuotationStatusModalOpen(false)
          setSelectedQuotation(null)
        }}
        onSuccess={refreshQuotations}
        quotation={selectedQuotation}
      />
      <NewPricingRuleModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onSuccess={refreshPricingRules}
        products={products}
      />
      <EditPricingRuleModal
        isOpen={isEditPricingModalOpen}
        onClose={() => {
          setIsEditPricingModalOpen(false)
          setSelectedPricingRule(null)
        }}
        onSuccess={refreshPricingRules}
        products={products}
        rule={selectedPricingRule}
      />
      <CustomerRecordModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false)
          setSelectedCustomerId(null)
        }}
        customerId={selectedCustomerId}
      />
    </section>
  )
}

export default CRMDashboard
