import { useCallback, useEffect, useState } from 'react'
import apiClient from '../api/client'
import NewAppraisalModal from '../components/NewAppraisalModal'
import NewApplicantModal from '../components/NewApplicantModal'
import NewJobPostingModal from '../components/NewJobPostingModal'
import EditPerformanceReviewModal from '../components/EditPerformanceReviewModal'
import RegisterEmployeeModal from '../components/RegisterEmployeeModal'
import ReviewLeaveRequestModal from '../components/ReviewLeaveRequestModal'
import RunPayrollModal from '../components/RunPayrollModal'
import ScheduleTrainingModal from '../components/ScheduleTrainingModal'
import UpdatePayrollRunStatusModal from '../components/UpdatePayrollRunStatusModal'
import UpdateApplicantStageModal from '../components/UpdateApplicantStageModal'
import UpdateEmployeeStatusModal from '../components/UpdateEmployeeStatusModal'
import UpdateJobStatusModal from '../components/UpdateJobStatusModal'
import UpdateTrainingStatusModal from '../components/UpdateTrainingStatusModal'

const hrTabs = [
  { id: 'directory', label: 'Employee Directory' },
  { id: 'leave', label: 'Leave & Attendance' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'performance', label: 'Performance' },
  { id: 'recruitment', label: 'Recruitment & Training' },
]

function formatDate(value) {
  if (!value) {
    return 'N/A'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleDateString()
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

function getStatusBadgeClassName(status) {
  const normalizedStatus = String(status ?? '').toLowerCase()

  switch (normalizedStatus) {
    case 'approved':
    case 'completed':
    case 'hired':
    case 'active':
      return 'bg-emerald-50 text-emerald-700'
    case 'pending':
    case 'screening':
      return 'bg-amber-50 text-amber-700'
    case 'draft':
    case 'scheduled':
    case 'open':
    case 'applied':
    case 'interviewing':
    case 'in progress':
      return 'bg-blue-50 text-blue-700'
    case 'offered':
      return 'bg-indigo-50 text-indigo-700'
    case 'rejected':
    case 'inactive':
    case 'closed':
    case 'cancelled':
    case 'on hold':
      return 'bg-slate-100 text-slate-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function getEmployeeName(record) {
  return [record?.first_name, record?.last_name].filter(Boolean).join(' ') || 'N/A'
}

function getReviewerName(record) {
  return (
    [record?.reviewer_first_name, record?.reviewer_last_name]
      .filter(Boolean)
      .join(' ') || 'N/A'
  )
}

function getApplicantName(record) {
  return [record?.first_name, record?.last_name].filter(Boolean).join(' ') || 'N/A'
}

function HRDashboard() {
  const [activeTab, setActiveTab] = useState('directory')
  const [employees, setEmployees] = useState([])
  const [leaveRequests, setLeaveRequests] = useState([])
  const [payrollRuns, setPayrollRuns] = useState([])
  const [reviews, setReviews] = useState([])
  const [jobs, setJobs] = useState([])
  const [applicants, setApplicants] = useState([])
  const [trainings, setTrainings] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEmployeeStatusModalOpen, setIsEmployeeStatusModalOpen] = useState(false)
  const [isLeaveReviewModalOpen, setIsLeaveReviewModalOpen] = useState(false)
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false)
  const [isPayrollStatusModalOpen, setIsPayrollStatusModalOpen] = useState(false)
  const [isAppraisalModalOpen, setIsAppraisalModalOpen] = useState(false)
  const [isReviewEditModalOpen, setIsReviewEditModalOpen] = useState(false)
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false)
  const [isJobModalOpen, setIsJobModalOpen] = useState(false)
  const [isJobStatusModalOpen, setIsJobStatusModalOpen] = useState(false)
  const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false)
  const [isApplicantStageModalOpen, setIsApplicantStageModalOpen] = useState(false)
  const [isTrainingStatusModalOpen, setIsTrainingStatusModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState(null)
  const [selectedPayrollRun, setSelectedPayrollRun] = useState(null)
  const [selectedReview, setSelectedReview] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [selectedTraining, setSelectedTraining] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchEmployees = useCallback(async () => {
    const response = await apiClient.get('/hr/employees')
    const employeeRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(employeeRecords) ? employeeRecords : []
  }, [])

  const fetchLeaveRequests = useCallback(async () => {
    const response = await apiClient.get('/hr/leave')
    const leaveRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(leaveRecords) ? leaveRecords : []
  }, [])

  const fetchPayrollRuns = useCallback(async () => {
    const response = await apiClient.get('/hr/payroll/runs')
    const payrollRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(payrollRecords) ? payrollRecords : []
  }, [])

  const fetchReviews = useCallback(async () => {
    const response = await apiClient.get('/hr/performance')
    const reviewRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(reviewRecords) ? reviewRecords : []
  }, [])

  const fetchJobs = useCallback(async () => {
    const response = await apiClient.get('/hr/recruitment/jobs')
    const jobRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(jobRecords) ? jobRecords : []
  }, [])

  const fetchApplicants = useCallback(async () => {
    const response = await apiClient.get('/hr/recruitment/applicants')
    const applicantRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(applicantRecords) ? applicantRecords : []
  }, [])

  const fetchTrainings = useCallback(async () => {
    const response = await apiClient.get('/hr/training')
    const trainingRecords = response.data?.data ?? response.data ?? []

    return Array.isArray(trainingRecords) ? trainingRecords : []
  }, [])

  const refreshEmployees = useCallback(async () => {
    try {
      const employeeRecords = await fetchEmployees()
      setEmployees(employeeRecords)
    } catch (requestError) {
      console.error('Failed to refresh employees:', requestError)
      setEmployees([])
    }
  }, [fetchEmployees])

  const refreshLeaveRequests = useCallback(async () => {
    try {
      const leaveRecords = await fetchLeaveRequests()
      setLeaveRequests(leaveRecords)
    } catch (requestError) {
      console.error('Failed to refresh leave requests:', requestError)
      setLeaveRequests([])
    }
  }, [fetchLeaveRequests])

  const refreshPayrollRuns = useCallback(async () => {
    try {
      const payrollRecords = await fetchPayrollRuns()
      setPayrollRuns(payrollRecords)
    } catch (requestError) {
      console.error('Failed to refresh payroll runs:', requestError)
      setPayrollRuns([])
    }
  }, [fetchPayrollRuns])

  const refreshReviews = useCallback(async () => {
    try {
      const reviewRecords = await fetchReviews()
      setReviews(reviewRecords)
    } catch (requestError) {
      console.error('Failed to refresh performance reviews:', requestError)
      setReviews([])
    }
  }, [fetchReviews])

  const refreshRecruitmentData = useCallback(async () => {
    try {
      const [jobRecords, applicantRecords, trainingRecords] = await Promise.all([
        fetchJobs(),
        fetchApplicants(),
        fetchTrainings(),
      ])

      setJobs(jobRecords)
      setApplicants(applicantRecords)
      setTrainings(trainingRecords)
    } catch (requestError) {
      console.error('Failed to refresh recruitment data:', requestError)
      setJobs([])
      setApplicants([])
      setTrainings([])
    }
  }, [fetchApplicants, fetchJobs, fetchTrainings])

  useEffect(() => {
    let isActive = true

    const loadActiveTabData = async () => {
      setLoading(true)
      setError('')

      try {
        if (activeTab === 'directory') {
          const employeeRecords = await fetchEmployees()

          if (!isActive) {
            return
          }

          setEmployees(employeeRecords)
          return
        }

        if (activeTab === 'leave') {
          const leaveRecords = await fetchLeaveRequests()

          if (!isActive) {
            return
          }

          setLeaveRequests(leaveRecords)
          return
        }

        if (activeTab === 'payroll') {
          const payrollRecords = await fetchPayrollRuns()

          if (!isActive) {
            return
          }

          setPayrollRuns(payrollRecords)
          return
        }

        if (activeTab === 'recruitment') {
          const [jobRecords, applicantRecords, trainingRecords] =
            await Promise.all([
              fetchJobs(),
              fetchApplicants(),
              fetchTrainings(),
            ])

          if (!isActive) {
            return
          }

          setJobs(jobRecords)
          setApplicants(applicantRecords)
          setTrainings(trainingRecords)
          return
        }

        const reviewRecords = await fetchReviews()

        if (!isActive) {
          return
        }

        setReviews(reviewRecords)
      } catch (requestError) {
        console.error(`Failed to load ${activeTab} data:`, requestError)

        if (!isActive) {
          return
        }

        if (activeTab === 'directory') {
          setEmployees([])
          setError('Unable to load the employee directory right now.')
        } else if (activeTab === 'leave') {
          setLeaveRequests([])
          setError('Unable to load leave requests right now.')
        } else if (activeTab === 'payroll') {
          setPayrollRuns([])
          setError('Unable to load payroll runs right now.')
        } else if (activeTab === 'recruitment') {
          setJobs([])
          setApplicants([])
          setTrainings([])
          setError('Unable to load recruitment and training data right now.')
        } else {
          setReviews([])
          setError('Unable to load performance reviews right now.')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadActiveTabData()

    return () => {
      isActive = false
    }
  }, [
    activeTab,
    fetchEmployees,
    fetchLeaveRequests,
    fetchPayrollRuns,
    fetchReviews,
    fetchJobs,
    fetchApplicants,
    fetchTrainings,
  ])

  useEffect(() => {
    if (!isAppraisalModalOpen || employees.length > 0) {
      return
    }

    refreshEmployees()
  }, [employees.length, isAppraisalModalOpen, refreshEmployees])

  function renderLoadingCard(message) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="h-5 w-56 animate-pulse rounded bg-slate-200" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <p className="mt-6 text-sm text-slate-500">{message}</p>
      </div>
    )
  }

  function renderErrorCard(title, message) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-white p-8 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
      </div>
    )
  }

  function renderDirectoryTab() {
    if (loading) {
      return renderLoadingCard('Loading employee records...')
    }

    if (error) {
      return renderErrorCard('Employee directory unavailable', error)
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
              HR
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Employee Directory
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Review staff details, department coverage, and account access from
              one central workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            Register Employee
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Job Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Hire Date
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
                {employees.map((employee, index) => (
                  <tr
                    key={employee.id ?? employee.user_id ?? `${employee.email}-${index}`}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {getEmployeeName(employee)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {employee.email ?? 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {employee.department_name ?? 'Unassigned'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {employee.job_title ?? 'Not set'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(employee.hire_date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-medium ${getStatusBadgeClassName(
                          employee.is_active ? 'Active' : 'Inactive',
                        )}`}
                      >
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setIsEmployeeStatusModalOpen(true)
                        }}
                        className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700 transition-all hover:bg-slate-200"
                      >
                        Manage Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {employees.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No employees found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Once staff records are available, they will appear here for the
                  HR team to manage.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderLeaveTab() {
    if (loading) {
      return renderLoadingCard('Loading leave requests...')
    }

    if (error) {
      return renderErrorCard('Leave data unavailable', error)
    }

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Leave & Attendance
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            Leave Requests
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Review recent requests, approval progress, and upcoming staff time
            away from one clean queue.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Employee Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Dates
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
                {leaveRequests.map((request) => (
                  <tr key={request.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {getEmployeeName(request)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {request.leave_type ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {`${formatDate(request.start_date)} - ${formatDate(request.end_date)}`}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-medium ${getStatusBadgeClassName(
                          request.status,
                        )}`}
                      >
                        {request.status ?? 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLeaveRequest(request)
                          setIsLeaveReviewModalOpen(true)
                        }}
                        className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700 transition-all hover:bg-slate-200"
                      >
                        Review Request
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No leave requests found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  As leave requests are submitted, they will appear here for HR
                  review and follow-up.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderPayrollTab() {
    if (loading) {
      return renderLoadingCard('Loading payroll runs...')
    }

    if (error) {
      return renderErrorCard('Payroll data unavailable', error)
    }

    const mayPayrollRun =
      payrollRuns.find((run) =>
        String(run.pay_period ?? '').toLowerCase().includes('may'),
      ) ??
      payrollRuns[0] ??
      null

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
              Payroll
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              Payroll Operations
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Track payroll cycles, gross-to-net totals, and run statuses from a
              single finance-ready workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPayrollModalOpen(true)}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            Run New Payroll
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total May Payroll
            </p>
            <p className="mt-6 text-4xl font-bold tracking-tight text-slate-950">
              {formatCurrency(mayPayrollRun?.total_gross ?? 0)}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Based on the seeded {mayPayrollRun?.pay_period ?? 'payroll'} run.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Pay Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Run Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Gross
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Taxes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Net
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
                {payrollRuns.map((run) => (
                  <tr key={run.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {run.pay_period ?? 'N/A'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(run.run_date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatCurrency(run.total_gross)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatCurrency(run.total_taxes)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-blue-600">
                      {formatCurrency(run.total_net)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-medium ${getStatusBadgeClassName(
                          run.status,
                        )}`}
                      >
                        {run.status ?? 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPayrollRun(run)
                          setIsPayrollStatusModalOpen(true)
                        }}
                        className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payrollRuns.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No payroll runs found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Once payroll is processed, each run will appear here with its
                  totals and completion status.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderPerformanceTab() {
    if (loading) {
      return renderLoadingCard('Loading performance reviews...')
    }

    if (error) {
      return renderErrorCard('Performance data unavailable', error)
    }

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
                Performance
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Performance Appraisals
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Track completed reviews and create the next appraisal cycle from
                one manager-ready workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAppraisalModalOpen(true)}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
            >
              New Appraisal
            </button>
          </div>
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
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Reviewer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Comments
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((review) => (
                  <tr key={review.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(review.review_date)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {getEmployeeName(review)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {getReviewerName(review)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                        {review.rating ?? 'N/A'} / 5
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {review.comments ?? 'No comments provided'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReview(review)
                          setIsReviewEditModalOpen(true)
                        }}
                        className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200"
                      >
                        Edit Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reviews.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No appraisals found
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Create the first appraisal to start building a performance
                  history for the team.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderRecruitmentTab() {
    if (loading) {
      return renderLoadingCard('Loading recruitment and training data...')
    }

    if (error) {
      return renderErrorCard('Recruitment data unavailable', error)
    }

    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Recruitment & Training
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">
            Talent Pipeline
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Monitor open requisitions, candidate movement, and the company
            learning calendar from one coordinated people-operations view.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Applicant Tracking
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                  Open Requisitions
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsJobModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
              >
                New Requisition
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-3xl bg-slate-50 p-5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.85),0_10px_24px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {job.title ?? 'Untitled role'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {job.department ?? 'Unassigned department'}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                        {job.employment_type ?? 'Full-Time'}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClassName(
                          job.status,
                        )}`}
                      >
                        {job.status ?? 'Unknown'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedJob(job)
                          setIsJobStatusModalOpen(true)
                        }}
                        className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200"
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {jobs.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">
                  No open requisitions found.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Applicant Tracking
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                  Active Pipeline
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsApplicantModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
              >
                Add Applicant
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {applicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className="flex flex-col gap-3 rounded-3xl bg-slate-50 p-5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.85),0_10px_24px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {getApplicantName(applicant)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {applicant.job_title ?? 'Unassigned job'}
                      </p>
                    </div>

                    <span
                      className={`inline-flex self-start rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClassName(
                        applicant.pipeline_stage,
                      )}`}
                    >
                      {applicant.pipeline_stage ?? 'Unknown'}
                    </span>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedApplicant(applicant)
                        setIsApplicantStageModalOpen(true)
                      }}
                      className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200"
                    >
                      Update Stage
                    </button>
                  </div>
                </div>
              ))}

              {applicants.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">
                  No applicants are currently in the active pipeline.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Learning & Development
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                Corporate Training Schedule
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsTrainingModalOpen(true)}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
            >
              Schedule Training
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Trainer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
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
                {trainings.map((training) => (
                  <tr key={training.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {training.title ?? 'Untitled training'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {training.trainer_name ?? 'TBD'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(training.scheduled_date)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 font-medium ${getStatusBadgeClassName(
                          training.status,
                        )}`}
                      >
                        {training.status ?? 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTraining(training)
                          setIsTrainingStatusModalOpen(true)
                        }}
                        className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700 transition-all hover:bg-slate-200"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {trainings.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h3 className="text-lg font-semibold text-slate-900">
                  No trainings scheduled
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Planned learning programs will appear here once the next
                  training cycle is scheduled.
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
      case 'recruitment':
        return renderRecruitmentTab()
      case 'leave':
        return renderLeaveTab()
      case 'payroll':
        return renderPayrollTab()
      case 'performance':
        return renderPerformanceTab()
      case 'directory':
      default:
        return renderDirectoryTab()
    }
  }

  return (
    <section className="space-y-6 rounded-[2rem] bg-slate-50 p-1 sm:p-2">
      <div className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
          HR
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          People Operations Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Navigate employee records, leave approvals, payroll cycles, and
          performance workflows from one multi-tab Soft UI workspace.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {hrTabs.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-slate-100 text-slate-500 shadow-[inset_1px_1px_0_rgba(255,255,255,0.9),0_10px_24px_rgba(15,23,42,0.05)] hover:bg-white hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {renderActiveTab()}

      <RegisterEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshEmployees}
      />
      <UpdateEmployeeStatusModal
        isOpen={isEmployeeStatusModalOpen}
        onClose={() => {
          setIsEmployeeStatusModalOpen(false)
          setSelectedEmployee(null)
        }}
        onSuccess={refreshEmployees}
        employee={selectedEmployee}
      />
      <ReviewLeaveRequestModal
        isOpen={isLeaveReviewModalOpen}
        onClose={() => {
          setIsLeaveReviewModalOpen(false)
          setSelectedLeaveRequest(null)
        }}
        onSuccess={refreshLeaveRequests}
        request={selectedLeaveRequest}
      />
      <RunPayrollModal
        isOpen={isPayrollModalOpen}
        onClose={() => setIsPayrollModalOpen(false)}
        onSuccess={refreshPayrollRuns}
      />
      <UpdatePayrollRunStatusModal
        isOpen={isPayrollStatusModalOpen}
        onClose={() => {
          setIsPayrollStatusModalOpen(false)
          setSelectedPayrollRun(null)
        }}
        onSuccess={refreshPayrollRuns}
        payrollRun={selectedPayrollRun}
      />
      <NewAppraisalModal
        isOpen={isAppraisalModalOpen}
        onClose={() => setIsAppraisalModalOpen(false)}
        onSuccess={refreshReviews}
        employees={employees}
      />
      <EditPerformanceReviewModal
        isOpen={isReviewEditModalOpen}
        onClose={() => {
          setIsReviewEditModalOpen(false)
          setSelectedReview(null)
        }}
        onSuccess={refreshReviews}
        review={selectedReview}
      />
      <NewJobPostingModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onSuccess={refreshRecruitmentData}
      />
      <UpdateJobStatusModal
        isOpen={isJobStatusModalOpen}
        onClose={() => {
          setIsJobStatusModalOpen(false)
          setSelectedJob(null)
        }}
        onSuccess={refreshRecruitmentData}
        job={selectedJob}
      />
      <NewApplicantModal
        isOpen={isApplicantModalOpen}
        onClose={() => setIsApplicantModalOpen(false)}
        onSuccess={refreshRecruitmentData}
        jobs={jobs}
      />
      <UpdateApplicantStageModal
        isOpen={isApplicantStageModalOpen}
        onClose={() => {
          setIsApplicantStageModalOpen(false)
          setSelectedApplicant(null)
        }}
        onSuccess={refreshRecruitmentData}
        applicant={selectedApplicant}
      />
      <ScheduleTrainingModal
        isOpen={isTrainingModalOpen}
        onClose={() => setIsTrainingModalOpen(false)}
        onSuccess={refreshRecruitmentData}
      />
      <UpdateTrainingStatusModal
        isOpen={isTrainingStatusModalOpen}
        onClose={() => {
          setIsTrainingStatusModalOpen(false)
          setSelectedTraining(null)
        }}
        onSuccess={refreshRecruitmentData}
        training={selectedTraining}
      />
    </section>
  )
}

export default HRDashboard
