import React, { useState } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCog,
  CalendarDays,
  Wallet,
  Landmark,
  Sparkles,
  Menu,
  X,
} from 'lucide-react'
import { COLORS } from './theme'

import Dashboard from './pages/Dashboard.jsx'
import Alumnas from './pages/Alumnas.jsx'
import Profesores from './pages/Profesores.jsx'
import Clases from './pages/Clases.jsx'
import Cobros from './pages/Cobros.jsx'
import Caja from './pages/Caja.jsx'
import Muestra from './pages/Muestra.jsx'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alumnas', label: 'Alumnas', icon: Users },
  { to: '/profesores', label: 'Profesores', icon: UserCog },
  { to: '/clases', label: 'Clases', icon: CalendarDays },
  { to: '/cobros', label: 'Cobros', icon: Wallet },
  { to: '/caja', label: 'Caja', icon: Landmark },
  { to: '/muestra', label: 'Muestra Anual', icon: Sparkles },
]

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.bg }}>
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      <aside
        style={{
          width: 240,
          background: '#121212',
          borderRight: `1px solid ${COLORS.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '26px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: COLORS.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 16,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16.5, letterSpacing: 0.5, color: '#fff' }}>
              MUSSAS
            </div>
            <div style={{ fontSize: 10.5, color: COLORS.textMuted, letterSpacing: 1 }}>
              ESTUDIO · GESTIÓN
            </div>
          </div>
        </div>

        <nav style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
                color: isActive ? '#fff' : COLORS.textMuted,
                background: isActive ? COLORS.accent : 'transparent',
                transition: 'background 0.15s, color 0.15s',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div
          style={{
            padding: '16px 22px',
            borderTop: `1px solid ${COLORS.border}`,
            fontSize: 11.5,
            color: COLORS.textMuted,
          }}
        >
          Mussas Instituto de Danza
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alumnas" element={<Alumnas />} />
          <Route path="/profesores" element={<Profesores />} />
          <Route path="/clases" element={<Clases />} />
          <Route path="/cobros" element={<Cobros />} />
          <Route path="/caja" element={<Caja />} />
          <Route path="/muestra" element={<Muestra />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  )
}
