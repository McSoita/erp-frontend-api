import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function formatCurrency(value) {
  const amount = Number(value)
  if (Number.isNaN(amount)) return 'N/A'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount)
}

function RecordBillPaymentModal({ isOpen, onClose, onSuccess, bill }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !bill) return
    setSubmitting(false)
    setError('')
  }, [bill, isOpen])

  if (!isOpen || !bill) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await apiClient.patch(`/finance/bills/${bill.id}/pay`)
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.response?.data?.error ??
          'Unable to record vendor payment. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Finance
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Record Vendor Payment</h2>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-3xl bg-slate-50 p-6 text-base leading-7 text-slate-700">
            Record full payment of{' '}
            <span className="font-semibold text-blue-600">{formatCurrency(bill.total_amount)}</span>{' '}
            for bill <span className="font-semibold text-slate-900">#{bill.id}</span>?
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
            <button type="submit" disabled={submitting} className={primaryButtonClassName}>
              {submitting ? 'Confirming...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RecordBillPaymentModal
