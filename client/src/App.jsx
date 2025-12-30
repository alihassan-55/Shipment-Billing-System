import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { Toaster } from './components/ui/toaster'
import ErrorBoundary from './components/ErrorBoundary'
import ConnectionStatus from './components/ConnectionStatus'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CustomersPage from './pages/CustomersPage'
import NewShipmentsPage from './pages/NewShipmentsPage'
import InvoicesPage from './pages/InvoicesPage'
import PaymentsPage from './pages/PaymentsPage'
import LedgerPage from './pages/LedgerPage'
import ReportsPage from './pages/ReportsPage'
import BulkImportPage from './pages/BulkImportPage'
import Layout from './components/Layout'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthStore()

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  const { token, user } = useAuthStore()

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route
              path="/login"
              element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route
              path="/*"
              element={
                token ? (
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/customers" element={<CustomersPage />} />
                      <Route path="/shipments" element={<NewShipmentsPage />} />
                      <Route path="/invoices" element={<InvoicesPage />} />

                      {/* Protected Routes */}
                      <Route
                        path="/payments"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN']}>
                            <PaymentsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/ledger"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN']}>
                            <LedgerPage />
                          </ProtectedRoute>
                        }
                      />

                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/bulk-import" element={<BulkImportPage />} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
          <Toaster />
          <ConnectionStatus />
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
