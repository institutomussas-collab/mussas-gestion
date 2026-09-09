import React, { useState } from 'react'
import Alumnas from './pages/Alumnas'
import Clases from './pages/Clases'
import Cobros from './pages/Cobros'
import Caja from './pages/Caja'
import Profesores from './pages/Profesores'
import Muestra from './pages/Muestra'
import Reportes from './pages/Reportes'
import Stock from './pages/Stock'
import { Users, Calendar, DollarSign, Wallet, GraduationCap, Sparkles, BarChart3, Package } from 'lucide-react'

export default function App() {
  const [tab, setTab] = useState('alumnas')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#0d0d0d', color: '#ffffff' }}>
      <div style={{ width: '260px', backgroundColor: '#000000', color: '#fff', padding: '25px 15px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #222' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{ width: '85px', height: '85px', margin: '0 auto 10px auto', borderRadius: '50%', border: '2px solid #ff0055', padding: '5px', backgroundColor: '#111' }}>
            <svg viewBox="0 0 500 500" width="100%" height="100%">
              <circle cx="250" cy="250" r="230" fill="none" stroke="#ff0055" strokeWidth="8" />
              <path d="M 120 280 C 180 120 320 120 380 280" fill="none" stroke="#00e5ff" strokeWidth="14" strokeLinecap="round" />
              <circle cx="250" cy="160" r="28" fill="#00e5ff" />
            </svg>
          </div>
          <h1 style={{ color: '#ff0055', fontSize: '28px', margin: 0, letterSpacing: '3px', fontWeight: '900', textTransform: 'uppercase' }}>MUSSAS</h1>
          <p style={{ color: '#ffffff', fontSize: '11px', margin: '6px 0 0 0', fontStyle: 'italic', letterSpacing: '0.5px' }}>Baila como si nadie te estuviera mirando</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setTab('alumnos')} style={navBtnStyle(tab === 'alumnos')}><Users size={18}/> Alumnos & Fichas</button>
          <button onClick={() => setTab('clases')} style={navBtnStyle(tab === 'clases')}><Calendar size={18}/> Clases & Asistencias</button>
          <button onClick={() => setTab('cobros')} style={navBtnStyle(tab === 'cobros')}><DollarSign size={18}/> Cuentas & Pagos</button>
          <button onClick={() => setTab('muestra')} style={navBtnStyle(tab === 'muestra')}><Sparkles size={18} color="#ff0055"/> Muestra Fin de Año</button>
          <button onClick={() => setTab('caja')} style={navBtnStyle(tab === 'caja')}><Wallet size={18}/> Caja & Gastos Fijos</button>
          <button onClick={() => setTab('profesores')} style={navBtnStyle(tab === 'profesores')}><GraduationCap size={18}/> Profesores & Honorarios</button>
          <button onClick={() => setTab('stock')} style={navBtnStyle(tab === 'stock')}><Package size={18}/> Stock & Indumentaria</button>
          <button onClick={() => setTab('reportes')} style={navBtnStyle(tab === 'reportes')}><BarChart3 size={18}/> Reportes & Métricas</button>
        </nav>

        <div style={{ marginTop: 'auto', padding: '12px', backgroundColor: '#111111', borderRadius: '8px', fontSize: '11px', textAlign: 'center', color: '#888888', border: '1px solid #222' }}>
          Mussas Gestión v6.0 • 2026
        </div>
      </div>

      <div style={{ flex: 1, backgroundColor: '#121212', padding: '30px', overflowY: 'auto' }}>
        {tab === 'alumnos' && <Alumnos />}
        {tab === 'clases' && <Clases />}
        {tab === 'cobros' && <Cobros />}
        {tab === 'muestra' && <Muestra />}
        {tab === 'caja' && <Caja />}
        {tab === 'profesores' && <Profesores />}
        {tab === 'stock' && <Stock />}
        {tab === 'reportes' && <Reportes />}
      </div>
    </div>
  )
}

const navBtnStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '13px 16px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: active ? '#ff0055' : 'transparent',
  color: '#ffffff',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  fontWeight: active ? 'bold' : '500',
  fontSize: '14px',
  transition: 'all 0.2s ease',
  boxShadow: active ? '0 4px 12px rgba(255, 0, 85, 0.3)' : 'none'
})
