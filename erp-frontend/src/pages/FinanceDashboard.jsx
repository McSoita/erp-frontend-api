import { useCallback, useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import apiClient from '../api/client'
import CreateAccountModal from '../components/CreateAccountModal'
import CreateAssetModal from '../components/CreateAssetModal'
import CreateBillModal from '../components/CreateBillModal'
import CreateBudgetModal from '../components/CreateBudgetModal'
import CreateInvoiceModal from '../components/CreateInvoiceModal'
import CreateJournalEntryModal from '../components/CreateJournalEntryModal'
import EditAccountModal from '../components/EditAccountModal'
import EditAssetModal from '../components/EditAssetModal'
import EditBudgetModal from '../components/EditBudgetModal'
import JournalEntryDetailsModal from '../components/JournalEntryDetailsModal'
import RecordPaymentModal from '../components/RecordPaymentModal'
import RecordBillPaymentModal from '../components/RecordBillPaymentModal'
import RecordTaxPaymentModal from '../components/RecordTaxPaymentModal'
import { useAuth } from '../context/AuthContext'
import { canWrite } from '../utils/permissions'
import ReverseJournalEntryModal from '../components/ReverseJournalEntryModal'
import UpdateAccountStatusModal from '../components/UpdateAccountStatusModal'
import UpdateAssetStatusModal from '../components/UpdateAssetStatusModal'

const financeTabs = [
  { id: 'chart_of_accounts', label: 'Chart of Accounts' },
  { id: 'fixed_assets', label: 'Fixed Assets' },
  { id: 'journal_entries', label: 'Journal Entries' },
  { id: 'reports', label: 'Reports & Budgets' },
  { id: 'ap', label: 'Accounts Payable' },
  { id: 'ar', label: 'Accounts Receivable' },
  { id: 'taxes', label: 'Tax & Compliance' },
]

const defaultTaxData = {
  taxCollected: 0,
  taxPaid: 0,
  totalRemitted: 0,
  netLiability: 0,
  tax_payments: [],
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

function formatFinanceDate(value) {
  if (!value) {
    return 'N/A'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleDateString()
}

function getAccountTypeBadgeClassName(type) {
  const normalizedType = String(type ?? '').toLowerCase()

  switch (normalizedType) {
    case 'asset':
    case 'assets':
      return 'bg-emerald-50 text-emerald-700'
    case 'liability':
    case 'liabilities':
      return 'bg-rose-50 text-rose-700'
    case 'revenue':
      return 'bg-blue-50 text-blue-700'
    case 'expense':
    case 'expenses':
      return 'bg-amber-50 text-amber-700'
    case 'equity':
      return 'bg-slate-100 text-slate-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function getFinanceStatusBadgeClassName(status) {
  const normalizedStatus = String(status ?? '').toLowerCase()

  switch (normalizedStatus) {
    case 'overdue':
      return 'bg-rose-50 text-rose-700'
    case 'sent':
      return 'bg-blue-50 text-blue-700'
    case 'partial':
      return 'bg-amber-50 text-amber-700'
    case 'paid':
    case 'cleared':
      return 'bg-emerald-50 text-emerald-700'
    case 'received':
    case 'unpaid':
      return 'bg-slate-100 text-slate-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function getAssetCategoryBadgeClassName(category) {
  const normalizedCategory = String(category ?? '').toLowerCase()

  switch (normalizedCategory) {
    case 'it equipment':
      return 'bg-blue-50 text-blue-700'
    case 'vehicle':
      return 'bg-amber-50 text-amber-700'
    case 'machinery':
      return 'bg-emerald-50 text-emerald-700'
    case 'furniture':
      return 'bg-violet-50 text-violet-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

function getAssetStatusBadgeClassName(status) {
  const normalizedStatus = String(status ?? '').toLowerCase()

  switch (normalizedStatus) {
    case 'operational':
      return 'bg-emerald-50 text-emerald-700'
    case 'degraded':
      return 'bg-amber-50 text-amber-700'
    case 'under repair':
      return 'bg-blue-50 text-blue-700'
    case 'decommissioned':
      return 'bg-slate-100 text-slate-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function FinanceDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('chart_of_accounts')
  const [accounts, setAccounts] = useState([])
  const [bills, setBills] = useState([])
  const [budgets, setBudgets] = useState([])
  const [fixedAssets, setFixedAssets] = useState([])
  const [invoices, setInvoices] = useState([])
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isAccountStatusModalOpen, setIsAccountStatusModalOpen] = useState(false)
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false)
  const [isAssetEditModalOpen, setIsAssetEditModalOpen] = useState(false)
  const [isAssetStatusModalOpen, setIsAssetStatusModalOpen] = useState(false)
  const [isBillModalOpen, setIsBillModalOpen] = useState(false)
  const [isBillPaymentModalOpen, setIsBillPaymentModalOpen] = useState(false)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [isBudgetEditModalOpen, setIsBudgetEditModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false)
  const [isJournalDetailsModalOpen, setIsJournalDetailsModalOpen] = useState(false)
  const [isReverseJournalModalOpen, setIsReverseJournalModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false)
  const [isAccountEditModalOpen, setIsAccountEditModalOpen] = useState(false)
  const [journalEntries, setJournalEntries] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [selectedBill, setSelectedBill] = useState(null)
  const [selectedBudget, setSelectedBudget] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [selectedJournalEntry, setSelectedJournalEntry] = useState(null)
  const [taxData, setTaxData] = useState(defaultTaxData)
  const [accountsLoaded, setAccountsLoaded] = useState(false)
  const [billsLoaded, setBillsLoaded] = useState(false)
  const [budgetsLoaded, setBudgetsLoaded] = useState(false)
  const [fixedAssetsLoaded, setFixedAssetsLoaded] = useState(false)
  const [invoicesLoaded, setInvoicesLoaded] = useState(false)
  const [journalEntriesLoaded, setJournalEntriesLoaded] = useState(false)
  const [taxDataLoaded, setTaxDataLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const canManageFinance = canWrite(user, 'Finance')

  const fetchAccounts = useCallback(async () => {
    const response = await apiClient.get('/finance/accounts')
    const accountsData = response.data?.data ?? response.data ?? []

    return Array.isArray(accountsData) ? accountsData : []
  }, [])

  const fetchJournalEntries = useCallback(async () => {
    const response = await apiClient.get('/finance/journal-entries')
    const journalEntriesData = response.data?.data ?? response.data ?? []

    return Array.isArray(journalEntriesData) ? journalEntriesData : []
  }, [])

  const fetchTaxSummary = useCallback(async () => {
    const response = await apiClient.get('/finance/taxes/summary')
    const taxesSummary = response.data?.data ?? response.data ?? null

    return taxesSummary ?? defaultTaxData
  }, [])

  const fetchARInvoices = useCallback(async () => {
    const response = await apiClient.get('/finance/ar/invoices')
    const invoicesData = response.data?.data ?? response.data ?? []

    return Array.isArray(invoicesData) ? invoicesData : []
  }, [])

  const fetchBudgets = useCallback(async () => {
    const response = await apiClient.get('/finance/reports/budgets')
    const budgetsData = response.data?.data ?? response.data ?? []

    return Array.isArray(budgetsData) ? budgetsData : []
  }, [])

  const fetchAssets = useCallback(async () => {
    const response = await apiClient.get('/finance/assets')
    const fixedAssetsData = response.data?.data ?? response.data ?? []

    return Array.isArray(fixedAssetsData) ? fixedAssetsData : []
  }, [])

  const fetchAPBills = useCallback(async () => {
    const response = await apiClient.get('/finance/ap/bills')
    const billsData = response.data?.data ?? response.data ?? []

    return Array.isArray(billsData) ? billsData : []
  }, [])

  const refreshJournalEntries = useCallback(async () => {
    const journalEntriesData = await fetchJournalEntries()

    setJournalEntries(journalEntriesData)
    setJournalEntriesLoaded(true)
  }, [fetchJournalEntries])

  const refreshTaxSummary = useCallback(async () => {
    const taxesSummary = await fetchTaxSummary()

    setTaxData(taxesSummary)
    setTaxDataLoaded(true)
  }, [fetchTaxSummary])

  const refreshARInvoices = useCallback(async () => {
    const invoicesData = await fetchARInvoices()

    setInvoices(invoicesData)
    setInvoicesLoaded(true)
  }, [fetchARInvoices])

  const refreshAccounts = useCallback(async () => {
    const accountsData = await fetchAccounts()

    setAccounts(accountsData)
    setAccountsLoaded(true)
  }, [fetchAccounts])

  const refreshBudgets = useCallback(async () => {
    const budgetsData = await fetchBudgets()

    setBudgets(budgetsData)
    setBudgetsLoaded(true)
  }, [fetchBudgets])

  const refreshAssets = useCallback(async () => {
    const fixedAssetsData = await fetchAssets()

    setFixedAssets(fixedAssetsData)
    setFixedAssetsLoaded(true)
  }, [fetchAssets])

  const refreshBills = useCallback(async () => {
    const billsData = await fetchAPBills()

    setBills(billsData)
    setBillsLoaded(true)
  }, [fetchAPBills])

  useEffect(() => {
    let isActive = true

    const loadTabData = async () => {
      if (activeTab === 'chart_of_accounts') {
        if (accountsLoaded) {
          setLoading(false)
          setError('')
          return
        }

        setLoading(true)
        setError('')

        try {
          const accountsData = await fetchAccounts()

          if (!isActive) {
            return
          }

          setAccounts(Array.isArray(accountsData) ? accountsData : [])
          setAccountsLoaded(true)
        } catch (requestError) {
          console.error('Failed to load chart of accounts:', requestError)

          if (!isActive) {
            return
          }

          setAccounts([])
          setError('Unable to load the chart of accounts right now.')
        } finally {
          if (isActive) {
            setLoading(false)
          }
        }

        return
      }

      if (activeTab === 'journal_entries') {
        if (journalEntriesLoaded) {
          setLoading(false)
          setError('')
          return
        }

        setLoading(true)
        setError('')

        try {
          const journalEntriesData = await fetchJournalEntries()

          if (!isActive) {
            return
          }

          setJournalEntries(
            Array.isArray(journalEntriesData) ? journalEntriesData : [],
          )
          setJournalEntriesLoaded(true)
        } catch (requestError) {
          console.error('Failed to load journal entries:', requestError)

          if (!isActive) {
            return
          }

          setJournalEntries([])
          setError('Unable to load journal entries right now.')
        } finally {
          if (isActive) {
            setLoading(false)
          }
        }

        return
      }

      if (activeTab === 'fixed_assets') {
        if (fixedAssetsLoaded) {
          setLoading(false)
          setError('')
          return
        }

        setLoading(true)
        setError('')

        try {
          const fixedAssetsData = await fetchAssets()

          if (!isActive) {
            return
          }

          setFixedAssets(Array.isArray(fixedAssetsData) ? fixedAssetsData : [])
          setFixedAssetsLoaded(true)
        } catch (requestError) {
          console.error('Failed to load fixed assets:', requestError)

          if (!isActive) {
            return
          }

          setFixedAssets([])
          setError('Unable to load fixed assets right now.')
        } finally {
          if (isActive) {
            setLoading(false)
          }
        }

        return
      }

      if (activeTab === 'reports') {
        if (budgetsLoaded) {
          setLoading(false)
          setError('')
          return
        }

        setLoading(true)
        setError('')

        try {
          const budgetsData = await fetchBudgets()

          if (!isActive) {
            return
          }

          setBudgets(Array.isArray(budgetsData) ? budgetsData : [])
          setBudgetsLoaded(true)
        } catch (requestError) {
          console.error('Failed to load budgets and reports:', requestError)

          if (!isActive) {
            return
          }

          setBudgets([])
          setError('Unable to load budgets and reporting data right now.')
        } finally {
          if (isActive) {
            setLoading(false)
          }
        }

        return
      }

      if (activeTab === 'taxes') {
        if (taxDataLoaded) {
          setLoading(false)
          setError('')
          return
        }

        setLoading(true)
        setError('')

        try {
          const taxesSummary = await fetchTaxSummary()

          if (!isActive) {
            return
          }

          setTaxData(taxesSummary)
          setTaxDataLoaded(true)
        } catch (requestError) {
          console.error('Failed to load tax summary:', requestError)

          if (!isActive) {
            return
          }

          setTaxData(defaultTaxData)
          setError('Unable to load tax and compliance data right now.')
        } finally {
          if (isActive) {
            setLoading(false)
          }
        }

        return
      }

      if (activeTab === 'ar') {
        if (invoicesLoaded) {
          setLoading(false)
          setError('')
          return
        }

        setLoading(true)
        setError('')

        try {
          const invoicesData = await fetchARInvoices()

          if (!isActive) {
            return
          }

          setInvoices(Array.isArray(invoicesData) ? invoicesData : [])
          setInvoicesLoaded(true)
        } catch (requestError) {
          console.error('Failed to load accounts receivable invoices:', requestError)

          if (!isActive) {
            return
          }

          setInvoices([])
          setError('Unable to load accounts receivable invoices right now.')
        } finally {
          if (isActive) {
            setLoading(false)
          }
        }

        return
      }

      if (activeTab === 'ap') {
        if (billsLoaded) {
          setLoading(false)
          setError('')
          return
        }

        setLoading(true)
        setError('')

        try {
          const billsData = await fetchAPBills()

          if (!isActive) {
            return
          }

          setBills(Array.isArray(billsData) ? billsData : [])
          setBillsLoaded(true)
        } catch (requestError) {
          console.error('Failed to load accounts payable bills:', requestError)

          if (!isActive) {
            return
          }

          setBills([])
          setError('Unable to load accounts payable bills right now.')
        } finally {
          if (isActive) {
            setLoading(false)
          }
        }

        return
      }

      setLoading(false)
      setError('')
    }

    loadTabData()

    return () => {
      isActive = false
    }
  }, [
    activeTab,
    accountsLoaded,
    journalEntriesLoaded,
    budgetsLoaded,
    fixedAssetsLoaded,
    invoicesLoaded,
    billsLoaded,
    taxDataLoaded,
    fetchAccounts,
    fetchAPBills,
    fetchARInvoices,
    fetchAssets,
    fetchBudgets,
    fetchJournalEntries,
    fetchTaxSummary,
  ])

  useEffect(() => {
    let isActive = true

    const loadAccountsForJournalModal = async () => {
      if (!isJournalModalOpen || accountsLoaded) {
        return
      }

      try {
        const accountsData = await fetchAccounts()

        if (!isActive) {
          return
        }

        setAccounts(accountsData)
        setAccountsLoaded(true)
      } catch (requestError) {
        console.error('Failed to load accounts for journal modal:', requestError)

        if (!isActive) {
          return
        }

        setAccounts([])
      }
    }

    loadAccountsForJournalModal()

    return () => {
      isActive = false
    }
  }, [isJournalModalOpen, accountsLoaded, fetchAccounts])

  function renderLoadingCard(message) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <p className="mt-6 text-sm text-slate-500">{message}</p>
      </div>
    )
  }

  function renderErrorCard(message) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Finance data unavailable
        </h3>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
      </div>
    )
  }

  function renderChartOfAccountsTab() {
    if (loading) {
      return renderLoadingCard('Loading chart of accounts...')
    }

    if (error) {
      return renderErrorCard(error)
    }

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
                General Ledger
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Chart of Accounts
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Review the structure of the ledger with a quick view of account
                codes, names, and classifications.
              </p>
            </div>

            {canManageFinance ? (
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
              >
                New Account
              </button>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Account Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Type
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
                {accounts.map((account) => (
                  <tr key={account.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {account.account_code ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {account.name ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-medium ${getAccountTypeBadgeClassName(
                          account.type,
                        )}`}
                      >
                        {account.type ?? 'Unclassified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-medium ${
                          account.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {account.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {canManageFinance ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAccount(account)
                              setIsAccountEditModalOpen(true)
                            }}
                            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAccount(account)
                              setIsAccountStatusModalOpen(true)
                            }}
                            className="cursor-pointer rounded-full border border-white/60 bg-slate-100/70 px-5 py-2 text-sm font-semibold text-slate-700 backdrop-blur-md shadow-[inset_1px_1px_0_rgba(255,255,255,0.92),0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-blue-100/80 hover:text-slate-900 hover:shadow-md"
                          >
                            {account.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {accounts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No accounts found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Once your general ledger accounts are available, they will
                  appear here for finance review.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderJournalEntriesTab() {
    if (loading) {
      return renderLoadingCard('Loading journal entries...')
    }

    if (error) {
      return renderErrorCard(error)
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
              General Ledger
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Journal Entries
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Review posted journal headers and their summarized debit totals in
              one streamlined view.
            </p>
          </div>

          {canManageFinance ? (
            <button
              type="button"
              onClick={() => setIsJournalModalOpen(true)}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
            >
              New Journal Entry
            </button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Entry ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Debit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journalEntries.map((entry) => (
                  <tr key={entry.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatFinanceDate(entry.entry_date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {entry.id ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {entry.description ?? 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-blue-600">
                      {formatCurrency(entry.total)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedJournalEntry(entry)
                            setIsJournalDetailsModalOpen(true)
                          }}
                          className="cursor-pointer rounded-full border border-white/60 bg-slate-100/70 px-4 py-2 text-sm font-semibold text-slate-700 backdrop-blur-md shadow-[inset_1px_1px_0_rgba(255,255,255,0.92),0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-blue-100/80 hover:text-slate-900 hover:shadow-md"
                        >
                          View Entry
                        </button>
                        {String(entry.reference_type ?? '').toLowerCase() !== 'journalreversal' ? (
                          canManageFinance ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedJournalEntry(entry)
                                setIsReverseJournalModalOpen(true)
                              }}
                              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                            >
                              Reverse Entry
                            </button>
                          ) : null
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-500">
                            Reversal
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {journalEntries.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No journal entries found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Once double-entry transactions are posted into the general
                  ledger, they will appear here.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderReports() {
    if (loading) {
      return renderLoadingCard('Loading budgets and reports...')
    }

    if (error) {
      return renderErrorCard(error)
    }

    const totalCorporateBudget = budgets.reduce((sum, budget) => {
      return sum + Number(budget.allocated_amount ?? 0)
    }, 0)
    const totalSpent = budgets.reduce((sum, budget) => {
      return sum + Number(budget.spent_amount ?? 0)
    }, 0)
    const remainingCapital = totalCorporateBudget - totalSpent

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
                Reporting
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Reports & Budgets
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Track departmental budget allocation against actual spend with a
                clean finance reporting view.
              </p>
            </div>

            {canManageFinance ? (
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
              >
                Add Budget
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total Corporate Budget
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-slate-950">
              {formatCurrency(totalCorporateBudget)}
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total Spent
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-slate-950">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Remaining Capital
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-slate-950">
              {formatCurrency(remainingCapital)}
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Budget Variance
              </p>
              <h3 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-950">
                Departmental Budget Variance
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              Allocated budget versus realized spend by department.
            </p>
          </div>

          <div className="mt-8 h-[420px]">
            {budgets.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={budgets} barGap={10}>
                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="department"
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
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: '20px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="allocated_amount"
                    name="Allocated"
                    fill="#cbd5e1"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="spent_amount"
                    name="Spent"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl bg-slate-50 text-sm text-slate-500">
                No budget records available for visualization.
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-slate-100 px-8 py-6">
            <h3 className="text-xl font-semibold text-slate-900">Budget Register</h3>
            <p className="mt-2 text-sm text-slate-500">
              Adjust individual budget records without leaving the reporting workspace.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Fiscal Year
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Allocated
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Spent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {budgets.map((budget) => (
                  <tr key={budget.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {budget.department ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {budget.fiscal_year ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatCurrency(budget.allocated_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatCurrency(budget.spent_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {canManageFinance ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBudget(budget)
                            setIsBudgetEditModalOpen(true)
                          }}
                          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                        >
                          Edit Budget
                        </button>
                      ) : null}
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

  function renderTaxes() {
    if (loading) {
      return renderLoadingCard('Loading tax and compliance summary...')
    }

    if (error) {
      return renderErrorCard(error)
    }

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Tax & Compliance
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            Tax Management
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Review collected and paid tax, remittance activity, and the current
            liability position from one finance compliance workspace.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Tax Collected (Sales)
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-blue-600">
              {formatCurrency(taxData.taxCollected)}
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Tax Paid (Expenses)
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-emerald-600">
              {formatCurrency(taxData.taxPaid)}
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total Remitted
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-slate-600">
              {formatCurrency(taxData.totalRemitted)}
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Current Net Liability
            </p>
            <p
              className={`mt-6 text-4xl font-bold tracking-tight ${
                Number(taxData.netLiability) > 0
                  ? 'text-rose-600'
                  : 'text-slate-950'
              }`}
            >
              {formatCurrency(taxData.netLiability)}
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Compliance
              </p>
              <h3 className="mt-2 font-sans text-2xl font-bold tracking-tight text-slate-950">
                Tax Remittance History
              </h3>
            </div>

            {canManageFinance ? (
              <button
                type="button"
                onClick={() => setIsTaxModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
              >
                Record Tax Payment
              </button>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Payment ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tax Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Reference Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxData.tax_payments.map((payment) => (
                  <tr key={payment.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {payment.id ?? 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {payment.tax_period ?? 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatFinanceDate(payment.payment_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {payment.reference_number ?? 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-950">
                      {formatCurrency(payment.amount_paid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {taxData.tax_payments.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No tax remittances found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Once tax payments are recorded, they will appear here for
                  compliance tracking.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderFixedAssets() {
    if (loading) {
      return renderLoadingCard('Loading fixed assets...')
    }

    if (error) {
      return renderErrorCard(error)
    }

    const totalAssetValue = fixedAssets.reduce((sum, asset) => {
      return sum + Number(asset.initial_cost ?? 0)
    }, 0)

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
                Fixed Assets
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Asset Register
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Review asset cost, useful life, annual straight-line depreciation,
                and operational status from one clean register.
              </p>
            </div>

            {canManageFinance ? (
              <button
                type="button"
                onClick={() => setIsAssetModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
              >
                Add Asset
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total Asset Value
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-slate-950">
              {formatCurrency(totalAssetValue)}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Asset Tag
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Purchase Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Initial Cost
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Useful Life
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Annual Depreciation
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
                {fixedAssets.map((asset) => (
                  <tr key={asset.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {asset.asset_tag ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {asset.name ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-medium ${getAssetCategoryBadgeClassName(
                          asset.category,
                        )}`}
                      >
                        {asset.category ?? 'Uncategorized'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatFinanceDate(asset.purchase_date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatCurrency(asset.initial_cost)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {asset.useful_life_years
                        ? `${asset.useful_life_years} years`
                        : 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-blue-600">
                      {formatCurrency(asset.annual_depreciation)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-medium ${getAssetStatusBadgeClassName(
                          asset.status,
                        )}`}
                      >
                        {asset.status ?? 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {canManageFinance ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAsset(asset)
                              setIsAssetEditModalOpen(true)
                            }}
                            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAsset(asset)
                              setIsAssetStatusModalOpen(true)
                            }}
                            className="cursor-pointer rounded-full border border-white/60 bg-slate-100/70 px-5 py-2 text-sm font-semibold text-slate-700 backdrop-blur-md shadow-[inset_1px_1px_0_rgba(255,255,255,0.92),0_10px_24px_rgba(15,23,42,0.06)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-blue-100/80 hover:text-slate-900 hover:shadow-md"
                          >
                            Update Status
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {fixedAssets.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No fixed assets found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Once assets are recorded, they will appear here for finance
                  review and depreciation tracking.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderAP() {
    if (loading) {
      return renderLoadingCard('Loading accounts payable bills...')
    }

    if (error) {
      return renderErrorCard(error)
    }

    const totalOwed = bills.reduce((sum, bill) => {
      const totalAmount = Number(bill.total_amount ?? 0)
      const amountPaid = Number(bill.amount_paid ?? 0)
      return sum + Math.max(totalAmount - amountPaid, 0)
    }, 0)

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
                Accounts Payable
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Vendor Bills
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Monitor supplier obligations, open balances, and upcoming due dates
                from one clean payable workspace.
              </p>
            </div>

            {canManageFinance ? (
              <button
                type="button"
                onClick={() => setIsBillModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
              >
                New Bill
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total Owed
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-slate-950">
              {formatCurrency(totalOwed)}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Bill ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vendor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Due Date
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
                {bills.map((bill) => (
                  <tr key={bill.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {bill.id ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {bill.vendor_name ?? 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatCurrency(bill.total_amount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatFinanceDate(bill.due_date)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-medium ${getFinanceStatusBadgeClassName(
                          bill.status,
                        )}`}
                      >
                        {bill.status ?? 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {String(bill.status ?? '').toLowerCase() !== 'paid' ? (
                        canManageFinance ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBill(bill)
                              setIsBillPaymentModalOpen(true)
                            }}
                            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700"
                          >
                            Record Payment
                          </button>
                        ) : null
                      ) : (
                        <span className="text-sm text-slate-400">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bills.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No bills found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Once supplier bills are recorded, they will appear here for
                  payable review.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderAR() {
    if (loading) {
      return renderLoadingCard('Loading accounts receivable invoices...')
    }

    if (error) {
      return renderErrorCard(error)
    }

    const totalOutstanding = invoices.reduce((sum, invoice) => {
      const totalAmount = Number(invoice.total_amount ?? 0)
      const amountPaid = Number(invoice.amount_paid ?? 0)
      return sum + Math.max(totalAmount - amountPaid, 0)
    }, 0)

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
                Accounts Receivable
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Customer Invoices
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Track open customer balances, invoice due dates, and collection
                status from a focused receivables view.
              </p>
            </div>

            {canManageFinance ? (
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
              >
                Create Invoice
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total Outstanding
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-slate-950">
              {formatCurrency(totalOutstanding)}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Invoice Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Due Date
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
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {invoice.invoice_number ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {invoice.customer_name ?? 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatFinanceDate(invoice.due_date)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-medium ${getFinanceStatusBadgeClassName(
                          invoice.status,
                        )}`}
                      >
                        {invoice.status ?? 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {String(invoice.status ?? '').toLowerCase() !== 'paid' ? (
                        canManageFinance ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setIsPaymentModalOpen(true)
                            }}
                            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700"
                          >
                            Record Payment
                          </button>
                        ) : null
                      ) : (
                        <span className="text-sm text-slate-400">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invoices.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No invoices found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Once customer invoices are posted, they will appear here for
                  receivables tracking.
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
      case 'taxes':
        return renderTaxes()
      case 'reports':
        return renderReports()
      case 'fixed_assets':
        return renderFixedAssets()
      case 'journal_entries':
        return renderJournalEntriesTab()
      case 'ap':
        return renderAP()
      case 'ar':
        return renderAR()
      case 'chart_of_accounts':
      default:
        return renderChartOfAccountsTab()
    }
  }

  return (
    <section className="space-y-6 rounded-[2rem] bg-slate-50 p-1 sm:p-2">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
          Finance
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          General Ledger
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Navigate the core finance workspaces for account structure, journal
          activity, and the receivables and payables modules as they evolve.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {financeTabs.map((tab) => {
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

      <CreateJournalEntryModal
        isOpen={isJournalModalOpen}
        onClose={() => setIsJournalModalOpen(false)}
        onSuccess={refreshJournalEntries}
        accounts={accounts}
      />
      <JournalEntryDetailsModal
        isOpen={isJournalDetailsModalOpen}
        onClose={() => {
          setIsJournalDetailsModalOpen(false)
          setSelectedJournalEntry(null)
        }}
        journalEntryId={selectedJournalEntry?.id}
      />
      <ReverseJournalEntryModal
        isOpen={isReverseJournalModalOpen}
        onClose={() => {
          setIsReverseJournalModalOpen(false)
          setSelectedJournalEntry(null)
        }}
        onSuccess={refreshJournalEntries}
        entry={selectedJournalEntry}
      />
      <CreateAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSuccess={refreshAccounts}
      />
      <EditAccountModal
        isOpen={isAccountEditModalOpen}
        onClose={() => {
          setIsAccountEditModalOpen(false)
          setSelectedAccount(null)
        }}
        onSuccess={refreshAccounts}
        account={selectedAccount}
      />
      <UpdateAccountStatusModal
        isOpen={isAccountStatusModalOpen}
        onClose={() => {
          setIsAccountStatusModalOpen(false)
          setSelectedAccount(null)
        }}
        onSuccess={refreshAccounts}
        account={selectedAccount}
      />
      <CreateBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSuccess={refreshBudgets}
      />
      <EditBudgetModal
        isOpen={isBudgetEditModalOpen}
        onClose={() => {
          setIsBudgetEditModalOpen(false)
          setSelectedBudget(null)
        }}
        onSuccess={refreshBudgets}
        budget={selectedBudget}
      />
      <CreateAssetModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSuccess={refreshAssets}
      />
      <EditAssetModal
        isOpen={isAssetEditModalOpen}
        onClose={() => {
          setIsAssetEditModalOpen(false)
          setSelectedAsset(null)
        }}
        onSuccess={refreshAssets}
        asset={selectedAsset}
      />
      <UpdateAssetStatusModal
        isOpen={isAssetStatusModalOpen}
        onClose={() => {
          setIsAssetStatusModalOpen(false)
          setSelectedAsset(null)
        }}
        onSuccess={refreshAssets}
        asset={selectedAsset}
      />
      <CreateBillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        onSuccess={refreshBills}
      />
      <RecordBillPaymentModal
        isOpen={isBillPaymentModalOpen}
        onClose={() => {
          setIsBillPaymentModalOpen(false)
          setSelectedBill(null)
        }}
        onSuccess={refreshBills}
        bill={selectedBill}
      />
      <CreateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSuccess={refreshARInvoices}
      />
      <RecordTaxPaymentModal
        isOpen={isTaxModalOpen}
        onClose={() => setIsTaxModalOpen(false)}
        onSuccess={refreshTaxSummary}
      />
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setSelectedInvoice(null)
        }}
        onSuccess={refreshARInvoices}
        invoice={selectedInvoice}
      />
    </section>
  )
}

export default FinanceDashboard
