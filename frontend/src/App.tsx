import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { AdminLayout } from './layouts/AdminLayout'

const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const NotFoundPage = lazy(() => import('./pages/common/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const RestaurantPage = lazy(() => import('./pages/admin/RestaurantPage').then(m => ({ default: m.RestaurantPage })))
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage').then(m => ({ default: m.CategoriesPage })))
const DishesPage = lazy(() => import('./pages/admin/DishesPage').then(m => ({ default: m.DishesPage })))
const DishFormPage = lazy(() => import('./pages/admin/DishFormPage').then(m => ({ default: m.DishFormPage })))
const UploadsPage = lazy(() => import('./pages/admin/UploadsPage').then(m => ({ default: m.UploadsPage })))
const QrPage = lazy(() => import('./pages/admin/QrPage').then(m => ({ default: m.QrPage })))
const PublicMenuPage = lazy(() => import('./pages/public/PublicMenuPage').then(m => ({ default: m.PublicMenuPage })))
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))

function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

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
    <Suspense fallback={<AppLoading />}>
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
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App
