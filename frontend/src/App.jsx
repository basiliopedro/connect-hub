import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }         from '@/context/AuthContext'
import { ThemeProvider }        from '@/context/ThemeContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { ToastProvider }        from '@/components/ui/Toast'
import { ProtectedRoute, GuestRoute, AdminRoute } from '@/routes/ProtectedRoute'
import { lazy, Suspense } from 'react'
import { LoadingScreen }  from '@/components/ui/LoadingScreen'

// ── Páginas públicas e auth ──────────────────────────────────
const Landing     = lazy(() => import('@/pages/Landing'))
const Login       = lazy(() => import('@/pages/auth/Login'))
const Register    = lazy(() => import('@/pages/auth/Register'))
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'))
const BlockedPage = lazy(() => import('@/pages/BlockedPage'))

// ── Admin Office ─────────────────────────────────────────────
const AdminLogin    = lazy(() => import('@/pages/admin/AdminLogin'))
const AdminLayout   = lazy(() => import('@/components/layout/AdminLayout'))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminApprovals = lazy(() => import('@/pages/admin/AdminApprovals'))
const AdminUsers    = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminProjects = lazy(() => import('@/pages/admin/AdminProjects'))
const AdminContracts = lazy(() => import('@/pages/admin/AdminContracts'))
const AdminPayments = lazy(() => import('@/pages/admin/AdminPayments'))

// ── Dashboard utilizador ─────────────────────────────────────
const DashboardLayout = lazy(() => import('@/components/layout/DashboardLayout'))
const DashboardPage   = lazy(() => import('@/pages/dashboard/Dashboard'))
const ProjectsPage    = lazy(() => import('@/pages/dashboard/Projects'))
const ProposalsPage   = lazy(() => import('@/pages/dashboard/Proposals'))
const ContractsPage   = lazy(() => import('@/pages/dashboard/Contracts'))
const ChatPage        = lazy(() => import('@/pages/dashboard/Chat'))
const PaymentsPage    = lazy(() => import('@/pages/dashboard/Payments'))
const ProfilePage     = lazy(() => import('@/pages/dashboard/Profile'))
const SettingsPage    = lazy(() => import('@/pages/dashboard/Settings'))

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>

                  {/* ── Público ── */}
                  <Route path="/"                element={<Landing />} />
                  <Route path="/conta-bloqueada" element={<BlockedPage />} />

                  {/* ── Apenas não autenticados ── */}
                  <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
                  <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

                  {/* ── Verificação de email ── */}
                  <Route path="/verificar-email" element={
                    <ProtectedRoute><VerifyEmail /></ProtectedRoute>
                  } />

                  {/* ── Admin Office (layout próprio) ── */}
                  <Route path="/admin" element={<AdminLogin />} />
                  <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
                    <Route path="/admin/painel"       element={<AdminDashboard />} />
                    <Route path="/admin/aprovacoes"   element={<AdminApprovals />} />
                    <Route path="/admin/utilizadores" element={<AdminUsers />} />
                    <Route path="/admin/projectos"    element={<AdminProjects />} />
                    <Route path="/admin/contratos"    element={<AdminContracts />} />
                    <Route path="/admin/pagamentos"   element={<AdminPayments />} />
                  </Route>

                  {/* ── Dashboard utilizador ── */}
                  <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                    <Route path="/dashboard"  element={<DashboardPage />} />
                    <Route path="/projectos"  element={<ProjectsPage />} />
                    <Route path="/propostas"  element={<ProposalsPage />} />
                    <Route path="/contratos"  element={<ContractsPage />} />
                    <Route path="/chat"       element={<ChatPage />} />
                    <Route path="/pagamentos" element={<PaymentsPage />} />
                    <Route path="/perfil"     element={<ProfilePage />} />
                    <Route path="/definicoes" element={<SettingsPage />} />
                  </Route>

                  {/* ── Fallback ── */}
                  <Route path="*" element={<Navigate to="/" replace />} />

                </Routes>
              </Suspense>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
