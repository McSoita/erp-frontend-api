import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasModuleAccess } from '../utils/permissions'

function getNavLinkClassName({ isActive }) {
  const baseClasses =
    'rounded-full px-4 py-2 text-sm font-medium transition-colors'

  if (isActive) {
    return `${baseClasses} bg-blue-600 text-white shadow-sm`
  }

  return `${baseClasses} bg-transparent text-slate-700 hover:bg-blue-50 hover:text-blue-600`
}

function Layout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const canAccessFinance = hasModuleAccess(user, 'Finance')
  const canAccessBi = hasModuleAccess(user, 'BI')
  const canAccessCrm = hasModuleAccess(user, 'CRM')
  const canAccessInventory = hasModuleAccess(user, 'Inventory')
  const canAccessScm = hasModuleAccess(user, 'SCM')
  const canAccessSales = hasModuleAccess(user, 'Sales Orders')
  const canAccessHr = hasModuleAccess(user, 'HR')

  const displayName = user?.name ?? user?.username ?? 'ERP User'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f4f7fe] text-slate-900">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                ERP Frontend
              </p>
              <h1 className="text-xl font-semibold text-slate-900">
                Welcome, {displayName}
              </h1>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              <NavLink to="/" end className={getNavLinkClassName}>
                Dashboard
              </NavLink>
              {canAccessFinance ? (
                <NavLink to="/finance" className={getNavLinkClassName}>
                  Finance
                </NavLink>
              ) : null}
              {canAccessBi ? (
                <NavLink to="/bi" className={getNavLinkClassName}>
                  BI
                </NavLink>
              ) : null}
              {canAccessCrm ? (
                <NavLink to="/crm" className={getNavLinkClassName}>
                  CRM
                </NavLink>
              ) : null}
              {canAccessInventory ? (
                <NavLink to="/inventory" className={getNavLinkClassName}>
                  Inventory
                </NavLink>
              ) : null}
              {canAccessScm ? (
                <NavLink to="/scm" className={getNavLinkClassName}>
                  SCM
                </NavLink>
              ) : null}
              {canAccessSales ? (
                <NavLink to="/sales" className={getNavLinkClassName}>
                  Sales Orders
                </NavLink>
              ) : null}
              {canAccessHr ? (
                <NavLink to="/hr" className={getNavLinkClassName}>
                  HR
                </NavLink>
              ) : null}
            </nav>
          </div>

          <div className="flex justify-start lg:justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
