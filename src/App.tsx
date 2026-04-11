import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'

// Marketing landing — lazy (keeps bundle under 450 kB)
const MarketingLanding = lazy(() => import('./pages/MarketingLanding'))
import DangPageRouter from './shells/dang/DangPageRouter'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import ScrollToTop from './components/ScrollToTop'
import { useGoogleAnalytics } from './hooks/useGoogleAnalytics'
import Login from './pages/admin/Login'
import ProtectedRoute from './components/ProtectedRoute'
import { PlanProvider } from './context/PlanContext'
import { TemplateProvider } from './context/TemplateContext'
import PublicShell from './components/PublicShell'

// Critical path — eager
import Index from './pages/Index'
import QuotePage from './pages/QuotePage'
import ContactPage from './pages/ContactPage'
import NotFound from './pages/NotFound'
import Sitemap from './pages/Sitemap'
import SlugRouter from './pages/SlugRouter'

// Payment success — public, no shell needed
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))

// Intake form — public, no shell needed
const IntakePage = lazy(() => import('./pages/IntakePage'))

// Secondary marketing pages — lazy
const About           = lazy(() => import('./pages/About'))
const FAQPage         = lazy(() => import('./pages/FAQPage'))
const ReviewsPage     = lazy(() => import('./pages/ReviewsPage'))
const ServiceArea     = lazy(() => import('./pages/ServiceArea'))
const BlogPage        = lazy(() => import('./pages/BlogPage'))
const BlogPostPage    = lazy(() => import('./pages/BlogPostPage'))
const Pricing         = lazy(() => import('./pages/Pricing'))
const TermsPage       = lazy(() => import('./pages/TermsPage'))
const PrivacyPage     = lazy(() => import('./pages/PrivacyPage'))

// Pest service pages — lazy (share PestPageTemplate chunk)
const SpiderControl       = lazy(() => import('./pages/SpiderControl'))
const MosquitoControl     = lazy(() => import('./pages/MosquitoControl'))
const AntControl          = lazy(() => import('./pages/AntControl'))
const WaspHornetControl   = lazy(() => import('./pages/WaspHornetControl'))
const RoachControl        = lazy(() => import('./pages/RoachControl'))
const FleaTickControl     = lazy(() => import('./pages/FleaTickControl'))
const RodentControl       = lazy(() => import('./pages/RodentControl'))
const ScorpionControl     = lazy(() => import('./pages/ScorpionControl'))
const BedBugControl       = lazy(() => import('./pages/BedBugControl'))
const PestControlPage     = lazy(() => import('./pages/PestControlPage'))
const TermiteControl      = lazy(() => import('./pages/TermiteControl'))
const TermiteInspections  = lazy(() => import('./pages/TermiteInspections'))

// Admin — lazy
const Dashboard      = lazy(() => import('./pages/admin/Dashboard'))
const Onboarding     = lazy(() => import('./pages/admin/Onboarding'))
const OnboardingLive = lazy(() => import('./pages/admin/OnboardingLive'))

// Ironwood Ops — lazy, platform-level
const IronwoodOps    = lazy(() => import('./pages/IronwoodOps'))
const IronwoodLogin  = lazy(() => import('./pages/admin/IronwoodLogin'))

const LOADING = <div className="flex items-center justify-center h-screen"><div className="text-gray-400 text-sm">Loading...</div></div>
const BLANK = <div />
const DARK_BLANK = <div style={{ background: '#0a0f1e', minHeight: '100vh' }} />

function RootRoute() {
  const h = window.location.hostname
  const isRoot = h === 'pestflowpro.com' || h === 'www.pestflowpro.com'
  if (isRoot) {
    return (
      <Suspense fallback={DARK_BLANK}>
        <MarketingLanding />
      </Suspense>
    )
  }
  return <PublicShell><Index /></PublicShell>
}

export default function App() {
  useGoogleAnalytics()

  return (
    <BrowserRouter>
      <PlanProvider>
      <TemplateProvider>
      <ScrollToTop />
      <Toaster richColors position="top-right" />
      <ErrorBoundary>
      <Routes>
        {/* ─── Root: MarketingLanding on pestflowpro.com, pest shell on subdomains ─── */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/contact" element={<DangPageRouter slug="contact" fallback={<PublicShell><ContactPage /></PublicShell>} />} />
        <Route path="/quote" element={<DangPageRouter slug="quote" fallback={<PublicShell><QuotePage /></PublicShell>} />} />
        <Route path="/about" element={<Suspense fallback={BLANK}><DangPageRouter slug="about" fallback={<PublicShell><About /></PublicShell>} /></Suspense>} />
        <Route path="/faq" element={<Suspense fallback={BLANK}><DangPageRouter slug="faq" fallback={<PublicShell><FAQPage /></PublicShell>} /></Suspense>} />
        <Route path="/reviews" element={<Suspense fallback={BLANK}><DangPageRouter slug="reviews" fallback={<PublicShell><ReviewsPage /></PublicShell>} /></Suspense>} />
        <Route path="/service-area" element={<Suspense fallback={BLANK}><PublicShell><ServiceArea /></PublicShell></Suspense>} />
        <Route path="/blog" element={<Suspense fallback={BLANK}><PublicShell><BlogPage /></PublicShell></Suspense>} />
        <Route path="/blog/:slug" element={<Suspense fallback={BLANK}><PublicShell><BlogPostPage /></PublicShell></Suspense>} />
        <Route path="/pricing" element={<Suspense fallback={BLANK}><PublicShell><Pricing /></PublicShell></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={BLANK}><PublicShell><TermsPage /></PublicShell></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={BLANK}><PublicShell><PrivacyPage /></PublicShell></Suspense>} />
        <Route path="/sitemap.xml" element={<Sitemap />} />

        {/* ─── Pest service pages ─── */}
        <Route path="/spider-control" element={<Suspense fallback={BLANK}><DangPageRouter slug="spider-control" fallback={<PublicShell><SpiderControl /></PublicShell>} /></Suspense>} />
        <Route path="/mosquito-control" element={<Suspense fallback={BLANK}><DangPageRouter slug="mosquito-control" fallback={<PublicShell><MosquitoControl /></PublicShell>} /></Suspense>} />
        <Route path="/ant-control" element={<Suspense fallback={BLANK}><DangPageRouter slug="ant-control" fallback={<PublicShell><AntControl /></PublicShell>} /></Suspense>} />
        <Route path="/wasp-hornet-control" element={<Suspense fallback={BLANK}><DangPageRouter slug="wasp-hornet-control" fallback={<PublicShell><WaspHornetControl /></PublicShell>} /></Suspense>} />
        <Route path="/roach-control" element={<Suspense fallback={BLANK}><DangPageRouter slug="roach-control" fallback={<PublicShell><RoachControl /></PublicShell>} /></Suspense>} />
        <Route path="/flea-tick-control" element={<Suspense fallback={BLANK}><DangPageRouter slug="flea-tick-control" fallback={<PublicShell><FleaTickControl /></PublicShell>} /></Suspense>} />
        <Route path="/rodent-control" element={<Suspense fallback={BLANK}><DangPageRouter slug="rodent-control" fallback={<PublicShell><RodentControl /></PublicShell>} /></Suspense>} />
        <Route path="/scorpion-control" element={<Suspense fallback={BLANK}><DangPageRouter slug="scorpion-control" fallback={<PublicShell><ScorpionControl /></PublicShell>} /></Suspense>} />
        <Route path="/bed-bug-control" element={<Suspense fallback={BLANK}><DangPageRouter slug="bed-bug-control" fallback={<PublicShell><BedBugControl /></PublicShell>} /></Suspense>} />
        <Route path="/pest-control" element={<Suspense fallback={BLANK}><DangPageRouter slug="pest-control" fallback={<PublicShell><PestControlPage /></PublicShell>} /></Suspense>} />
        <Route path="/termite-control" element={<Suspense fallback={BLANK}><DangPageRouter slug="termite-control" fallback={<PublicShell><TermiteControl /></PublicShell>} /></Suspense>} />
        <Route path="/termite-inspections" element={<Suspense fallback={BLANK}><DangPageRouter slug="termite-inspections" fallback={<PublicShell><TermiteInspections /></PublicShell>} /></Suspense>} />

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

        {/* ─── Ironwood Ops — must be before /:slug ─── */}
        <Route path="/ironwood/login" element={
          <Suspense fallback={LOADING}><IronwoodLogin /></Suspense>
        } />
        <Route path="/ironwood/*" element={
          <Suspense fallback={LOADING}><IronwoodOps /></Suspense>
        } />

        {/* ─── Post-payment landing — must be before /:slug ─── */}
        <Route path="/payment-success" element={<Suspense fallback={LOADING}><PaymentSuccess /></Suspense>} />

        {/* ─── Public intake form — must be before /:slug ─── */}
        <Route path="/intake/:token" element={<Suspense fallback={LOADING}><IntakePage /></Suspense>} />

        {/* ─── Dynamic slug — MUST BE LAST ─── */}
        <Route path="/:slug" element={<PublicShell><SlugRouter /></PublicShell>} />
        <Route path="*" element={<PublicShell><NotFound /></PublicShell>} />
      </Routes>
      </ErrorBoundary>
      </TemplateProvider>
      </PlanProvider>
    </BrowserRouter>
  )
}
