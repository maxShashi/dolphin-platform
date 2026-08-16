import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Purchase from './pages/Purchase'
import AccountManagement from './pages/AccountManagement'
import RentalOrders from './pages/RentalOrders'
import DelegationOrders from './pages/DelegationOrders'
import AccountData from './pages/AccountData'
import BIAnalysis from './pages/BIAnalysis'
import AssetManagement from './pages/AssetManagement'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#070B1A' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-text-muted text-sm">加载中...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="purchase" element={<Purchase />} />
        <Route path="accounts" element={<AccountManagement />} />
        <Route path="orders/rental" element={<RentalOrders />} />
        <Route path="orders/delegation" element={<DelegationOrders />} />
        <Route path="account-data" element={<AccountData />} />
        <Route path="bi-analysis" element={<BIAnalysis />} />
        <Route path="assets" element={<AssetManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}