import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import Dashboard from './DashboardReal'
import RegisterModel from './pages/RegisterModel'
import RegisterEmployee from './pages/RegisterEmployee'
import Login from './pages/Login'
import OpenShoots from './pages/OpenShoots'
import ManageShoots from './pages/ManageShoots'

// Beveiligde route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check huidige sessie
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Luister naar veranderingen
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Laden...</div>
  }

  if (!session) {
    // Als niet ingelogd, stuur naar login pagina
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Publieke routes */}
        <Route path="/" element={<RegisterModel />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-employee" element={<RegisterEmployee />} />
        <Route path="/open-shoots" element={<OpenShoots />} />
        
        {/* Beveiligde routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/manage-shoots" 
          element={
            <ProtectedRoute>
              <ManageShoots />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}
