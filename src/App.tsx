import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Toaster } from 'sonner'
import ScrollToTop from './components/ScrollToTop'
import { useGoogleAnalytics } from './hooks/useGoogleAnalytics'
import Login from './pages/admin/Login'
import ProtectedRoute from './components/ProtectedRoute'
import { PlanProvider } from './context/PlanContext'

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
import SlugRouter from './pages/SlugRouter'

export default function App() {
  useGoogleAnalytics()

  return (
    <BrowserRouter>
      <PlanProvider>
      <ScrollToTop />
      <Toaster richColors position="top-right" />
      <Routes>
        {/* ─── Public marketing pages ─── */}
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/quote" element={<QuotePage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/service-area" element={<ServiceArea />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/sitemap.xml" element={<Sitemap />} />

        {/* ─── Pest service pages ─── */}
        <Route path="/spider-control" element={<SpiderControl />} />
        <Route path="/mosquito-control" element={<MosquitoControl />} />
        <Route path="/ant-control" element={<AntControl />} />
        <Route path="/wasp-hornet-control" element={<WaspHornetControl />} />
        <Route path="/roach-control" element={<RoachControl />} />
        <Route path="/flea-tick-control" element={<FleaTickControl />} />
        <Route path="/rodent-control" element={<RodentControl />} />
        <Route path="/scorpion-control" element={<ScorpionControl />} />
        <Route path="/bed-bug-control" element={<BedBugControl />} />
        <Route path="/pest-control" element={<PestControlPage />} />
        <Route path="/termite-control" element={<TermiteControl />} />
        <Route path="/termite-inspections" element={<TermiteInspections />} />

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
        <Route path="/:slug" element={<SlugRouter />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </PlanProvider>
    </BrowserRouter>
  )
}
