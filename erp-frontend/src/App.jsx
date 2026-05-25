import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './context/AuthContext'
import BIDashboard from './pages/BIDashboard'
import Dashboard from './pages/Dashboard'
import FinanceDashboard from './pages/FinanceDashboard'
import HRDashboard from './pages/HRDashboard'
import CRMDashboard from './pages/CRMDashboard'
import InventoryDashboard from './pages/InventoryDashboard'
import Login from './pages/Login'
import SCMDashboard from './pages/SCMDashboard'
import SalesDashboard from './pages/SalesDashboard'
import { hasModuleAccess } from './utils/permissions'

function AppRoutes() {
  const { user } = useAuth()
  const canAccessFinance = hasModuleAccess(user, 'Finance')
  const canAccessBi = hasModuleAccess(user, 'BI')
  const canAccessCrm = hasModuleAccess(user, 'CRM')
  const canAccessInventory = hasModuleAccess(user, 'Inventory')
  const canAccessScm = hasModuleAccess(user, 'SCM')
  const canAccessSales = hasModuleAccess(user, 'Sales Orders')
  const canAccessHr = hasModuleAccess(user, 'HR')

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route
            path="/finance"
            element={
              canAccessFinance ? <FinanceDashboard /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/bi"
            element={canAccessBi ? <BIDashboard /> : <Navigate to="/" replace />}
          />
          <Route
            path="/crm"
            element={canAccessCrm ? <CRMDashboard /> : <Navigate to="/" replace />}
          />
          <Route
            path="/inventory"
            element={
              canAccessInventory ? <InventoryDashboard /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/hr"
            element={canAccessHr ? <HRDashboard /> : <Navigate to="/" replace />}
          />
          <Route
            path="/scm"
            element={canAccessScm ? <SCMDashboard /> : <Navigate to="/" replace />}
          />
          <Route
            path="/sales"
            element={canAccessSales ? <SalesDashboard /> : <Navigate to="/" replace />}
          />
        </Route>
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
