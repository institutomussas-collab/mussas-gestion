import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Alumnas from './pages/Alumnas';
import Profesores from './pages/Profesores';
import Clases from './pages/Clases';
import Cobros from './pages/Cobros';
import Caja from './pages/Caja';
import Muestra from './pages/Muestra';
import { LayoutDashboard, Users, GraduationCap, BookOpen, CreditCard, Lock, Sparkles } from 'lucide-react';

export default function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
        
        <aside style={{ width: '240px', backgroundColor: '#121212', borderRight: '1px solid #222', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              🩰 <span style={{ color: '#ff0055' }}>MUSSAS</span>
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Estudio de Danza</p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link to="/dashboard" style={linkStyle}><LayoutDashboard size={18} color="#ff0055"/> Dashboard</Link>
            <Link to="/alumnas" style={linkStyle}><Users size={18} color="#00e5ff"/> Alumnas</Link>
            <Link to="/profesores" style={linkStyle}><GraduationCap size={18} color="#00ff88"/> Profesores</Link>
            <Link to="/clases" style={linkStyle}><BookOpen size={18} color="#ffbb00"/> Clases</Link>
            <Link to="/cobros" style={linkStyle}><CreditCard size={18} color="#aa00ff"/> Cobros</Link>
            <Link to="/caja" style={linkStyle}><Lock size={18} color="#ff0055"/> Caja Diaria</Link>
            <Link to="/muestra" style={linkStyle}><Sparkles size={18} color="#00e5ff"/> Muestra 2026</Link>
          </nav>
        </aside>

        <main style={{ flex: 1, backgroundColor: '#000000', overflowY: 'auto' }}>
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
        </main>

      </div>
    </Router>
  );
}

const linkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 14px',
  borderRadius: '8px',
  color: '#ccc',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '500',
  backgroundColor: '#181818'
};
