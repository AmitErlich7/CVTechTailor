import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import Tailor from './pages/Tailor.jsx'
import Versions from './pages/Versions.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tailor" element={<Tailor />} />
        <Route path="/tailor/:id" element={<Tailor />} />
        <Route path="/versions" element={<Versions />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
