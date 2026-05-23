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

function AppRoutes() {
  const { user } = useAuth()
  const isSuperAdmin = Number(user?.role_id) === 1

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route
            path="/finance"
            element={
              isSuperAdmin ? <FinanceDashboard /> : <Navigate to="/" replace />
            }
          />
          <Route
            path="/bi"
            element={isSuperAdmin ? <BIDashboard /> : <Navigate to="/" replace />}
          />
          <Route path="/crm" element={<CRMDashboard />} />
          <Route path="/inventory" element={<InventoryDashboard />} />
          <Route
            path="/hr"
            element={isSuperAdmin ? <HRDashboard /> : <Navigate to="/" replace />}
          />
          <Route path="/scm" element={<SCMDashboard />} />
          <Route path="/sales" element={<SalesDashboard />} />
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
