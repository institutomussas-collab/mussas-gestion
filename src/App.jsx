import React, { useState } from 'react'
import Alumnos from './pages/Alumnos'
import Clases from './pages/Clases'
import Cobros from './pages/Cobros'
import Caja from './pages/Caja'
import Profesores from './pages/Profesores'
import Muestra from './pages/Muestra'
import Reportes from './pages/Reportes'
import Stock from './pages/Stock'
import { Users, Calendar, DollarSign, Wallet, GraduationCap, Sparkles, BarChart3, Package } from 'lucide-react'

export default function App() {
  const [tab, setTab] = useState('alumnos')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#121212', color: '#e0e0e0' }}>
      {/* Sidebar Verde Petróleo */}
      <div style={{ width: '250px', backgroundColor: '#004d40', color: '#fff', padding: '20px 12px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #00251a' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#e91e63', fontSize: '26px', margin: 0, tracking: '2px', fontWeight: '900', textTransform: 'uppercase' }}>MUSSAS</h1>
          <p style={{ color: '#00bfa5', fontSize: '11px', margin: '4px 0 0 0', fontStyle: 'italic' }}>Baila como si nadie te estuviera mirando</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setTab('alumnos')} style={navBtnStyle(tab === 'alumnos')}><Users size={18}/> Alumnos & Fichas</button>
          <button onClick={() => setTab('clases')} style={navBtnStyle(tab === 'clases')}><Calendar size={18}/> Clases & Asistencias</button>
          <button onClick={() => setTab('cobros')} style={navBtnStyle(tab === 'cobros')}><DollarSign size={18}/> Cuentas & Pagos</button>
          <button onClick={() => setTab('muestra')} style={navBtnStyle(tab === 'muestra')}><Sparkles size={18} color="#e91e63"/> Muestra Fin de Año</button>
          <button onClick={() => setTab('caja')} style={navBtnStyle(tab === 'caja')}><Wallet size={18}/> Caja & Gastos Fijos</button>
          <button onClick={() => setTab('profesores')} style={navBtnStyle(tab === 'profesores')}><GraduationCap size={18}/> Profesores & Honorarios</button>
          <button onClick={() => setTab('stock')} style={navBtnStyle(tab === 'stock')}><Package size={18}/> Stock & Indumentaria</button>
          <button onClick={() => setTab('reportes')} style={navBtnStyle(tab === 'reportes')}><BarChart3 size={18}/> Reportes & Métricas</button>
        </nav>

        <div style={{ marginTop: 'auto', padding: '10px', backgroundColor: '#00332c', borderRadius: '6px', fontSize: '11px', textAlign: 'center', color: '#b2dfdb' }}>
          Gestión Mussas v2.0 • 2026
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, backgroundColor: '#181818', padding: '25px', overflowY: 'auto' }}>
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
  padding: '12px 14px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: active ? '#e91e63' : 'transparent',
  color: active ? '#fff' : '#b2dfdb',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  fontWeight: active ? 'bold' : '500',
  fontSize: '14px',
  transition: 'all 0.2s'
})
