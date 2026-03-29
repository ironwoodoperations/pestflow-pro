import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Onboarding from './pages/admin/Onboarding'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center font-bangers text-4xl text-orange-500">
            PestFlow Pro — Site Coming Soon
          </div>
        } />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={
          <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center text-2xl">
            404 — Page Not Found
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}
