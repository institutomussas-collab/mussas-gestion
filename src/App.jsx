import React, { useState } from 'react'
import Alumnos from './pages/Alumnos'
import Clases from './pages/Clases'
import Cobros from './pages/Cobros'
import Caja from './pages/Caja'
import Profesores from './pages/Profesores'
import { Users, Calendar, DollarSign, Wallet, GraduationCap } from 'lucide-react'

export default function App() {
  const [tab, setTab] = useState('alumnos')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ width: '220px', backgroundColor: '#1e1e2d', color: '#fff', padding: '20px 10px' }}>
        <h2 style={{ color: '#e91e63', textAlign: 'center', marginBottom: '30px' }}>MUSSAS</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setTab('alumnos')} style={navBtnStyle(tab === 'alumnos')}><Users size={18}/> Alumnos</button>
          <button onClick={() => setTab('clases')} style={navBtnStyle(tab === 'clases')}><Calendar size={18}/> Clases y Lista</button>
          <button onClick={() => setTab('cobros')} style={navBtnStyle(tab === 'cobros')}><DollarSign size={18}/> Cobros y Pases</button>
          <button onClick={() => setTab('caja')} style={navBtnStyle(tab === 'caja')}><Wallet size={18}/> Caja Diaria</button>
          <button onClick={() => setTab('profesores')} style={navBtnStyle(tab === 'profesores')}><GraduationCap size={18}/> Profesores</button>
        </nav>
      </div>
      <div style={{ flex: 1, backgroundColor: '#f5f7fb', padding: '20px' }}>
        {tab === 'alumnos' && <Alumnos />}
        {tab === 'clases' && <Clases />}
        {tab === 'cobros' && <Cobros />}
        {tab === 'caja' && <Caja />}
        {tab === 'profesores' && <Profesores />}
      </div>
    </div>
  )
}

const navBtnStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 15px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: active ? '#e91e63' : 'transparent',
  color: '#fff',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  fontWeight: active ? 'bold' : 'normal'
})
