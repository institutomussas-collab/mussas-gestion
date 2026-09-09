import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function Reportes() {
  return (
    <div>
      <h2 style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BarChart3 color="#ff0055" /> Reportes & Métricas
      </h2>
      <p style={{ color: '#888888' }}>Módulo de estadísticas en consolidación.</p>
    </div>
  );
}