import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'

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

function getCustomerName(customer) {
  return (
    customer?.company_name ||
    [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') ||
    customer?.name ||
    'Unnamed Customer'
  )
}

function getStageBadgeClassName(stage) {
  const normalizedStage = String(stage ?? '').trim().toLowerCase()

  if (normalizedStage === 'closed won' || normalizedStage === 'won') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (normalizedStage === 'negotiation') {
    return 'bg-blue-50 text-blue-700'
  }

  if (normalizedStage === 'proposal') {
    return 'bg-amber-50 text-amber-700'
  }

  return 'bg-slate-100 text-slate-600'
}

function getQuoteStatusBadgeClassName(status) {
  const normalizedStatus = String(status ?? '').trim().toLowerCase()

  if (normalizedStatus === 'accepted' || normalizedStatus === 'approved') {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (normalizedStatus === 'expired') {
    return 'bg-rose-50 text-rose-700'
  }

  if (normalizedStatus === 'draft') {
    return 'bg-slate-100 text-slate-600'
  }

  return 'bg-blue-50 text-blue-700'
}

function CustomerRecordModal({ isOpen, onClose, customerId }) {
  const [customerData, setCustomerData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !customerId) {
      return
    }

    let isActive = true

    const fetchCustomerDetails = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await apiClient.get(`/crm/customers/${customerId}/details`)
        const data = response.data?.data ?? response.data ?? null

        if (!isActive) {
          return
        }

        setCustomerData(data)
      } catch (requestError) {
        if (!isActive) {
          return
        }

        const message =
          requestError.response?.data?.message ??
          requestError.response?.data?.error ??
          'Unable to load customer record. Please try again.'

        setCustomerData(null)
        setError(message)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    fetchCustomerDetails()

    return () => {
      isActive = false
    }
  }, [customerId, isOpen])

  if (!isOpen || !customerId) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        {loading ? (
          <div className="flex min-h-[24rem] items-center justify-center">
            <div className="flex items-center gap-3 text-slate-500">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
              <span className="text-sm font-medium">Loading customer record...</span>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-rose-100 bg-rose-50/70 p-6">
              <p className="text-lg font-semibold text-slate-900">Customer record unavailable</p>
              <p className="mt-2 text-sm text-rose-700">{error}</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className={subtleButtonClassName}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 rounded-3xl bg-slate-50 p-6 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
                  Customer Record
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                  {getCustomerName(customerData?.customer)}
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Email
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {customerData?.customer?.primary_email ?? 'N/A'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Phone
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {customerData?.customer?.primary_phone ?? 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl bg-slate-50 p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-slate-900">
                    Active Opportunities
                  </h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                    {customerData?.opportunities?.length ?? 0}
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {(customerData?.opportunities ?? []).map((opportunity) => (
                    <article
                      key={opportunity.id}
                      className="rounded-[1.75rem] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
                    >
                      <h4 className="text-base font-semibold text-slate-900">
                        {opportunity.title ?? 'Untitled Opportunity'}
                      </h4>
                      <div className="mt-3 flex items-center gap-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStageBadgeClassName(
                            opportunity.stage,
                          )}`}
                        >
                          {opportunity.stage ?? 'Lead'}
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                          {formatCurrency(opportunity.estimated_value)}
                        </span>
                      </div>
                    </article>
                  ))}

                  {(customerData?.opportunities?.length ?? 0) === 0 ? (
                    <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white/70 px-4 py-8 text-center text-sm text-slate-400">
                      No active opportunities for this customer.
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-3xl bg-slate-50 p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-slate-900">Recent Quotes</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                    {customerData?.quotations?.length ?? 0}
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {(customerData?.quotations ?? []).map((quotation) => (
                    <article
                      key={quotation.id}
                      className="rounded-[1.75rem] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-base font-semibold text-slate-900">
                          {quotation.quote_number ?? `Quote #${quotation.id}`}
                        </h4>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getQuoteStatusBadgeClassName(
                            quotation.status,
                          )}`}
                        >
                          {quotation.status ?? 'Pending'}
                        </span>
                      </div>
                      <p className="mt-4 text-lg font-semibold text-slate-900">
                        {formatCurrency(quotation.total_amount)}
                      </p>
                    </article>
                  ))}

                  {(customerData?.quotations?.length ?? 0) === 0 ? (
                    <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white/70 px-4 py-8 text-center text-sm text-slate-400">
                      No recent quotations for this customer.
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className={subtleButtonClassName}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerRecordModal
