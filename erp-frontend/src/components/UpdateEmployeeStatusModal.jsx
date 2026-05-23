import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const subtleButtonClassName =
  'rounded-full bg-slate-100 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-800'
const primaryButtonClassName =
  'rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

function getEmployeeName(employee) {
  return [employee?.first_name, employee?.last_name].filter(Boolean).join(' ') || 'Employee'
}

function UpdateEmployeeStatusModal({ isOpen, onClose, onSuccess, employee }) {
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !employee) {
      return
    }

    setIsActive(Boolean(employee.is_active))
    setSubmitting(false)
    setError('')
  }, [employee, isOpen])

  if (!isOpen || !employee) {
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await apiClient.patch(`/hr/employees/${employee.id}/status`, {
        is_active: isActive,
      })
      await onSuccess?.()
      onClose()
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ??
        requestError.response?.data?.error ??
        'Unable to update this employee account right now.'

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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
              Employee Directory
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Manage Employee Access
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Activate or deactivate this employee&apos;s system account.
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

        <div className="mt-6 rounded-3xl bg-blue-50 px-5 py-4 text-sm text-blue-700">
          Updating account status for <span className="font-semibold">{getEmployeeName(employee)}</span>.
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsActive(true)}
              className={`rounded-3xl px-5 py-4 text-left transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 shadow-[0_12px_24px_rgba(16,185,129,0.12)]'
                  : 'bg-slate-50 text-slate-500'
              }`}
            >
              <p className="text-sm font-semibold">Active</p>
              <p className="mt-1 text-xs">The employee can log in and access the system.</p>
            </button>
            <button
              type="button"
              onClick={() => setIsActive(false)}
              className={`rounded-3xl px-5 py-4 text-left transition-all ${
                !isActive
                  ? 'bg-slate-200 text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.08)]'
                  : 'bg-slate-50 text-slate-500'
              }`}
            >
              <p className="text-sm font-semibold">Inactive</p>
              <p className="mt-1 text-xs">The employee account is blocked from signing in.</p>
            </button>
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
              disabled={submitting}
              className={primaryButtonClassName}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UpdateEmployeeStatusModal
