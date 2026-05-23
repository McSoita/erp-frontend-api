import { useEffect, useMemo, useState } from 'react'
import apiClient from '../api/client'

const defaultLine = { account_id: '', debit: '', credit: '' }
const fieldClassName =
  'w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'
const subtleButtonClassName =
  'rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10)
}

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function CreateJournalEntryModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
}) {
  const [description, setDescription] = useState('')
  const [entryDate, setEntryDate] = useState(getTodayDateString())
  const [lines, setLines] = useState([{ ...defaultLine }, { ...defaultLine }])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setDescription('')
    setEntryDate(getTodayDateString())
    setLines([{ ...defaultLine }, { ...defaultLine }])
    setSubmitting(false)
    setError('')
  }, [isOpen])

  const { totalCredits, totalDebits } = useMemo(() => {
    return lines.reduce(
      (totals, line) => ({
        totalDebits: totals.totalDebits + Number(line.debit || 0),
        totalCredits: totals.totalCredits + Number(line.credit || 0),
      }),
      { totalDebits: 0, totalCredits: 0 },
    )
  }, [lines])

  if (!isOpen) {
    return null
  }

  const isBalanced =
    Number(totalDebits.toFixed(2)) === Number(totalCredits.toFixed(2))
  const hasPositiveTotal = totalDebits > 0
  const isSubmitDisabled = !isBalanced || !hasPositiveTotal || submitting

  const handleLineChange = (index, field, value) => {
    setLines((currentLines) =>
      currentLines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      ),
    )
  }

  const handleAddLine = () => {
    setLines((currentLines) => [...currentLines, { ...defaultLine }])
  }

  const handleRemoveLine = (index) => {
    if (lines.length <= 2) {
      return
    }

    setLines((currentLines) =>
      currentLines.filter((_, lineIndex) => lineIndex !== index),
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const payload = {
      description: description.trim(),
      entry_date: entryDate,
      lines: lines.map((line) => ({
        account_id: parseInt(line.account_id, 10),
        debit: parseFloat(line.debit || 0),
        credit: parseFloat(line.credit || 0),
      })),
    }

    try {
      await apiClient.post('/finance/journal-entries', payload)
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to create journal entry. Please try again.'

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
              Finance
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Create Journal Entry
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Post a balanced journal entry into the general ledger with equal
              debits and credits.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={subtleButtonClassName}
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div>
              <label
                htmlFor="journal-description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Description
              </label>
              <input
                id="journal-description"
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                className={fieldClassName}
                placeholder="Monthly accrual adjustment"
              />
            </div>

            <div>
              <label
                htmlFor="journal-entry-date"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Entry Date
              </label>
              <input
                id="journal-entry-date"
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
                required
                className={fieldClassName}
              />
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">Lines</h3>
              <button
                type="button"
                onClick={handleAddLine}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200"
              >
                + Add Line
              </button>
            </div>

            <div className="space-y-4">
              {lines.map((line, index) => (
                <div
                  key={`journal-line-${index}`}
                  className="grid gap-4 rounded-3xl bg-slate-50 p-4 md:grid-cols-[1.6fr_1fr_1fr_auto]"
                >
                  <div>
                    <label
                      htmlFor={`journal-account-${index}`}
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Account
                    </label>
                    <select
                      id={`journal-account-${index}`}
                      value={line.account_id}
                      onChange={(event) =>
                        handleLineChange(index, 'account_id', event.target.value)
                      }
                      required
                      className={fieldClassName}
                    >
                      <option value="" disabled>
                        Select an account
                      </option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_code} - {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor={`journal-debit-${index}`}
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Debit
                    </label>
                    <input
                      id={`journal-debit-${index}`}
                      type="number"
                      value={line.debit}
                      onChange={(event) =>
                        handleLineChange(index, 'debit', event.target.value)
                      }
                      min="0"
                      step="0.01"
                      className={fieldClassName}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`journal-credit-${index}`}
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Credit
                    </label>
                    <input
                      id={`journal-credit-${index}`}
                      type="number"
                      value={line.credit}
                      onChange={(event) =>
                        handleLineChange(index, 'credit', event.target.value)
                      }
                      min="0"
                      step="0.01"
                      className={fieldClassName}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(index)}
                      disabled={lines.length <= 2}
                      className="rounded-full bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base font-bold text-slate-900">
                Total Debits: {formatCurrency(totalDebits)}
              </p>
              <p className="text-base font-bold text-slate-900">
                Total Credits: {formatCurrency(totalCredits)}
              </p>
            </div>
            {!isBalanced ? (
              <p className="mt-3 text-sm font-semibold text-rose-600">
                Entry is out of balance
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={subtleButtonClassName}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={primaryButtonClassName}
            >
              {submitting ? 'Posting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateJournalEntryModal
