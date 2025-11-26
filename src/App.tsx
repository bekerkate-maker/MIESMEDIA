import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './DashboardReal'
import RegisterModel from './pages/RegisterModel'
import RegisterEmployee from './pages/RegisterEmployee'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RegisterModel />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register-employee" element={<RegisterEmployee />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
