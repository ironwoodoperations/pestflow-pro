import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Onboarding from './pages/admin/Onboarding'
import ProtectedRoute from './components/ProtectedRoute'
import Index from './pages/Index'
import QuotePage from './pages/QuotePage'
import ContactPage from './pages/ContactPage'
import SlugRouter from './pages/SlugRouter'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        {/* Public routes — MUST be before /:slug */}
        <Route path="/" element={<Index />} />
        <Route path="/quote" element={<QuotePage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Dynamic slug catch-all — MUST be last */}
        <Route path="/:slug" element={<SlugRouter />} />

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center text-2xl">
            404 — Page Not Found
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}
