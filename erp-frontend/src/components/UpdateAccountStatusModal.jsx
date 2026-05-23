import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function UpdateAccountStatusModal({ isOpen, onClose, onSuccess, account }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !account) return
    setSubmitting(false)
    setError('')
  }, [account, isOpen])

  if (!isOpen || !account) return null

  const nextActive = !account.is_active

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await apiClient.patch(`/finance/accounts/${account.id}/status`, {
        is_active: nextActive,
      })
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.response?.data?.error ??
          'Unable to update account status. Please try again.',
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
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Update Account Status</h2>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-3xl bg-slate-50 p-6 text-base leading-7 text-slate-700">
            Set account <span className="font-semibold text-slate-900">{account.name}</span>{' '}
            ({account.account_code}) to{' '}
            <span className="font-semibold text-blue-600">
              {nextActive ? 'Active' : 'Inactive'}
            </span>
            ?
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
              {submitting ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UpdateAccountStatusModal
