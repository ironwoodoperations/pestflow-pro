import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'

// Marketing homepage — lazy (keeps bundle under 450 kB)
const MarketingLanding = lazy(() => import('./pages/marketing/MarketingHome'))
import { Toaster } from 'sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import ScrollToTop from './components/ScrollToTop'
import { useGoogleAnalytics } from './hooks/useGoogleAnalytics'
import Login from './pages/admin/Login'
import ProtectedRoute from './components/ProtectedRoute'
import { PlanProvider } from './context/PlanContext'
import { TemplateProvider } from './context/TemplateContext'
import { TenantBootProvider } from './context/TenantBootProvider'

// Critical path — eager
import NotFound from './pages/NotFound'

// Payment success — public, no theme needed
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))

// Intake form — public, no theme needed
const IntakePage = lazy(() => import('./pages/IntakePage'))

// Post-intake branded preview — public, no theme needed
const IntakeSuccess = lazy(() => import('./pages/IntakeSuccess'))

// Admin — lazy
const Dashboard      = lazy(() => import('./pages/admin/Dashboard'))
const Onboarding     = lazy(() => import('./pages/admin/Onboarding'))
const OnboardingLive = lazy(() => import('./pages/admin/OnboardingLive'))

// Ironwood Ops — lazy, platform-level
const IronwoodOps    = lazy(() => import('./pages/IronwoodOps'))
const IronwoodLogin  = lazy(() => import('./pages/admin/IronwoodLogin'))

const LOADING = <div className="flex items-center justify-center h-screen"><div className="text-gray-400 text-sm">Loading...</div></div>
const DARK_BLANK = <div style={{ background: '#0a0f1e', minHeight: '100vh' }} />

function RootRoute() {
  // Apex marketing only — tenant subdomains route to Next.js or 404 via
  // middleware, they never reach this Vite SPA at "/".
  return (
    <Suspense fallback={DARK_BLANK}>
      <MarketingLanding />
    </Suspense>
  )
}

function GoogleAnalyticsInit() {
  useGoogleAnalytics()
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <TenantBootProvider>
      <PlanProvider>
      <TemplateProvider>
      <GoogleAnalyticsInit />
      <ScrollToTop />
      <Toaster richColors position="top-right" />
      <ErrorBoundary>
      <Routes>
        {/* ─── Apex marketing ─── */}
        <Route path="/" element={<RootRoute />} />

        {/* ─── Admin routes ─── */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/onboarding" element={
          <Suspense fallback={LOADING}><ProtectedRoute><Onboarding /></ProtectedRoute></Suspense>
        } />
        <Route path="/admin/onboarding-live" element={
          <Suspense fallback={LOADING}><ProtectedRoute><OnboardingLive /></ProtectedRoute></Suspense>
        } />
        <Route path="/admin" element={
          <Suspense fallback={LOADING}><ProtectedRoute><Dashboard /></ProtectedRoute></Suspense>
        } />

        {/* ─── Ironwood Ops ─── */}
        <Route path="/ironwood/login" element={
          <Suspense fallback={LOADING}><IronwoodLogin /></Suspense>
        } />
        <Route path="/ironwood/*" element={
          <Suspense fallback={LOADING}><IronwoodOps /></Suspense>
        } />

        {/* ─── Post-payment landing ─── */}
        <Route path="/payment-success" element={<Suspense fallback={LOADING}><PaymentSuccess /></Suspense>} />

        {/* ─── Public intake form ─── */}
        <Route path="/intake/:token" element={<Suspense fallback={LOADING}><IntakePage /></Suspense>} />

        {/* ─── Post-intake branded preview ─── */}
        <Route path="/intake-success" element={<Suspense fallback={LOADING}><IntakeSuccess /></Suspense>} />

        {/* ─── Catch-all ─── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </ErrorBoundary>
      </TemplateProvider>
      </PlanProvider>
      </TenantBootProvider>
    </BrowserRouter>
  )
}
