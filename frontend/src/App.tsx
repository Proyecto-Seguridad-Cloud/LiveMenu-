import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { NotFoundPage } from './pages/common/NotFoundPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { RestaurantPage } from './pages/admin/RestaurantPage'
import { CategoriesPage } from './pages/admin/CategoriesPage'
import { DishesPage } from './pages/admin/DishesPage'
import { DishFormPage } from './pages/admin/DishFormPage'
import { UploadsPage } from './pages/admin/UploadsPage'
import { QrPage } from './pages/admin/QrPage'
import { PublicMenuPage } from './pages/public/PublicMenuPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={
          <RedirectIfAuth>
            <LoginPage />
          </RedirectIfAuth>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuth>
            <RegisterPage />
          </RedirectIfAuth>
        }
      />

      <Route path="/m/:slug" element={<PublicMenuPage />} />

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="restaurant" element={<RestaurantPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="dishes" element={<DishesPage />} />
        <Route path="dishes/new" element={<DishFormPage mode="new" />} />
        <Route path="dishes/:id/edit" element={<DishFormPage mode="edit" />} />
        <Route path="uploads" element={<UploadsPage />} />
        <Route path="qr" element={<QrPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
