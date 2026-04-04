import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Toaster } from 'sonner'
import ScrollToTop from './components/ScrollToTop'
import { useGoogleAnalytics } from './hooks/useGoogleAnalytics'
import Login from './pages/admin/Login'
import ProtectedRoute from './components/ProtectedRoute'
import { PlanProvider } from './context/PlanContext'
import { TemplateProvider } from './context/TemplateContext'
import PublicShell from './components/PublicShell'

const Dashboard     = lazy(() => import('./pages/admin/Dashboard'))
const Onboarding    = lazy(() => import('./pages/admin/Onboarding'))
const OnboardingLive = lazy(() => import('./pages/admin/OnboardingLive'))
import Index from './pages/Index'
import QuotePage from './pages/QuotePage'
import ContactPage from './pages/ContactPage'
import About from './pages/About'
import FAQPage from './pages/FAQPage'
import ReviewsPage from './pages/ReviewsPage'
import ServiceArea from './pages/ServiceArea'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import SpiderControl from './pages/SpiderControl'
import MosquitoControl from './pages/MosquitoControl'
import AntControl from './pages/AntControl'
import WaspHornetControl from './pages/WaspHornetControl'
import RoachControl from './pages/RoachControl'
import FleaTickControl from './pages/FleaTickControl'
import RodentControl from './pages/RodentControl'
import ScorpionControl from './pages/ScorpionControl'
import BedBugControl from './pages/BedBugControl'
import PestControlPage from './pages/PestControlPage'
import TermiteControl from './pages/TermiteControl'
import TermiteInspections from './pages/TermiteInspections'
import NotFound from './pages/NotFound'
import Sitemap from './pages/Sitemap'
import Pricing from './pages/Pricing'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import SlugRouter from './pages/SlugRouter'

export default function App() {
  useGoogleAnalytics()

  return (
    <BrowserRouter>
      <PlanProvider>
      <TemplateProvider>
      <ScrollToTop />
      <Toaster richColors position="top-right" />
      <Routes>
        {/* ─── Public marketing pages ─── */}
        <Route path="/" element={<PublicShell><Index /></PublicShell>} />
        <Route path="/about" element={<PublicShell><About /></PublicShell>} />
        <Route path="/contact" element={<PublicShell><ContactPage /></PublicShell>} />
        <Route path="/quote" element={<PublicShell><QuotePage /></PublicShell>} />
        <Route path="/faq" element={<PublicShell><FAQPage /></PublicShell>} />
        <Route path="/reviews" element={<PublicShell><ReviewsPage /></PublicShell>} />
        <Route path="/service-area" element={<PublicShell><ServiceArea /></PublicShell>} />
        <Route path="/blog" element={<PublicShell><BlogPage /></PublicShell>} />
        <Route path="/blog/:slug" element={<PublicShell><BlogPostPage /></PublicShell>} />
        <Route path="/pricing" element={<PublicShell><Pricing /></PublicShell>} />
        <Route path="/terms" element={<PublicShell><TermsPage /></PublicShell>} />
        <Route path="/privacy" element={<PublicShell><PrivacyPage /></PublicShell>} />
        <Route path="/sitemap.xml" element={<Sitemap />} />

        {/* ─── Pest service pages ─── */}
        <Route path="/spider-control" element={<PublicShell><SpiderControl /></PublicShell>} />
        <Route path="/mosquito-control" element={<PublicShell><MosquitoControl /></PublicShell>} />
        <Route path="/ant-control" element={<PublicShell><AntControl /></PublicShell>} />
        <Route path="/wasp-hornet-control" element={<PublicShell><WaspHornetControl /></PublicShell>} />
        <Route path="/roach-control" element={<PublicShell><RoachControl /></PublicShell>} />
        <Route path="/flea-tick-control" element={<PublicShell><FleaTickControl /></PublicShell>} />
        <Route path="/rodent-control" element={<PublicShell><RodentControl /></PublicShell>} />
        <Route path="/scorpion-control" element={<PublicShell><ScorpionControl /></PublicShell>} />
        <Route path="/bed-bug-control" element={<PublicShell><BedBugControl /></PublicShell>} />
        <Route path="/pest-control" element={<PublicShell><PestControlPage /></PublicShell>} />
        <Route path="/termite-control" element={<PublicShell><TermiteControl /></PublicShell>} />
        <Route path="/termite-inspections" element={<PublicShell><TermiteInspections /></PublicShell>} />

        {/* ─── Admin routes ─── */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/onboarding" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-gray-400 text-sm">Loading...</div></div>}>
            <ProtectedRoute><Onboarding /></ProtectedRoute>
          </Suspense>
        } />
        <Route path="/admin/onboarding-live" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-gray-400 text-sm">Loading...</div></div>}>
            <ProtectedRoute><OnboardingLive /></ProtectedRoute>
          </Suspense>
        } />
        <Route path="/admin" element={
          <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="text-gray-400 text-sm">Loading...</div></div>}>
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          </Suspense>
        } />

        {/* ─── Dynamic slug — MUST BE LAST ─── */}
        <Route path="/:slug" element={<PublicShell><SlugRouter /></PublicShell>} />
        <Route path="*" element={<PublicShell><NotFound /></PublicShell>} />
      </Routes>
      </TemplateProvider>
      </PlanProvider>
    </BrowserRouter>
  )
}
