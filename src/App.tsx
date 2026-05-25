import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { AppShell } from '@/components/layout/app-shell'
import { Toaster } from '@/components/ui/toaster'
import { LoginPage } from '@/pages/login-page'
import { OnboardingPage } from '@/pages/onboarding-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { ReportsPage } from '@/pages/reports-page'
import { NewReportPage } from '@/pages/new-report-page'
import { ReportEditPage } from '@/pages/report-edit-page'
import { FixedDonationsPage } from '@/pages/fixed-donations-page'
import { AuditPage } from '@/pages/audit-page'
import { SettingsPage } from '@/pages/settings-page'
import { MembersPage } from '@/pages/members-page'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { isFirebaseConfigured } from '@/lib/firebase'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
})

function ProtectedRoutes() {
  const { profile, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <LoadingSkeleton rows={3} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile?.activeHouseholdId) {
    return <OnboardingPage />
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/new" element={<NewReportPage />} />
        <Route path="reports/:year/:month" element={<ReportEditPage />} />
        <Route path="fixed-donations" element={<FixedDonationsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="members" element={<MembersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (!isFirebaseConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <LoginPage />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <LoadingSkeleton rows={3} />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
