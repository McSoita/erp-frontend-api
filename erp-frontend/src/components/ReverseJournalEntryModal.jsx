import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function ReverseJournalEntryModal({ isOpen, onClose, onSuccess, entry }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !entry) {
      return
    }

    setSubmitting(false)
    setError('')
  }, [isOpen, entry])

  if (!isOpen || !entry) {
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await apiClient.post(`/finance/journal-entries/${entry.id}/reverse`)
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to reverse this journal entry right now.'

      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
              Finance
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Reverse Journal Entry
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Create a reversing entry for journal #{entry.id}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-3xl bg-blue-50 px-5 py-4 text-sm text-blue-700">
            <span className="font-semibold">{entry.description ?? `Entry #${entry.id}`}</span>
            {' will be reversed by posting an equal and opposite journal entry.'}
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
              {submitting ? 'Posting...' : 'Post Reversal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReverseJournalEntryModal
