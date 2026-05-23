import { useEffect, useState } from 'react'
import apiClient from '../api/client'

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

const inputClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 p-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'

const cancelButtonClassName =
  'rounded-full px-6 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700'

const submitButtonClassName =
  'rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function RecordTaxPaymentModal({ isOpen, onClose, onSuccess }) {
  const [taxPeriod, setTaxPeriod] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [paymentDate, setPaymentDate] = useState(getTodayDate())
  const [referenceNumber, setReferenceNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setTaxPeriod('')
    setAmountPaid('')
    setPaymentDate(getTodayDate())
    setReferenceNumber('')
    setSubmitting(false)
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        tax_period: taxPeriod,
        amount_paid: Number.parseFloat(amountPaid),
        payment_date: paymentDate,
        reference_number: referenceNumber,
      }

      await apiClient.post('/finance/taxes/payments', payload)
      await onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to record tax payment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Tax & Compliance
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Record Tax Payment
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Add a remittance entry to keep your tax position and compliance
            history current.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="tax-period"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Tax Period
            </label>
            <input
              id="tax-period"
              type="text"
              value={taxPeriod}
              onChange={(event) => setTaxPeriod(event.target.value)}
              placeholder="2026-Q2"
              className={inputClassName}
              required
            />
          </div>

          <div>
            <label
              htmlFor="tax-amount"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Amount
            </label>
            <input
              id="tax-amount"
              type="number"
              min="0"
              step="0.01"
              value={amountPaid}
              onChange={(event) => setAmountPaid(event.target.value)}
              placeholder="0.00"
              className={inputClassName}
              required
            />
          </div>

          <div>
            <label
              htmlFor="payment-date"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Date
            </label>
            <input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
              className={inputClassName}
              required
            />
          </div>

          <div>
            <label
              htmlFor="reference-number"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Reference / Receipt Number
            </label>
            <input
              id="reference-number"
              type="text"
              value={referenceNumber}
              onChange={(event) => setReferenceNumber(event.target.value)}
              placeholder="TRX-2026-0051"
              className={inputClassName}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={cancelButtonClassName}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={submitButtonClassName}
            >
              {submitting ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RecordTaxPaymentModal
