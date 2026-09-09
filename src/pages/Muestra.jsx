import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

export default function Muestra() {
  return (
    <div style={{ padding: '24px', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            ✨ Muestra Anual <span style={{ color: '#ff0055' }}>Diciembre 2026</span>
          </h1>
          <p style={{ color: '#aaaaaa', margin: '4px 0 0 0', fontSize: '14px' }}>
            Planificación de vestuarios, teatros y venta de entradas.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div style={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#00e5ff', marginBottom: '12px' }}>
            <Calendar size={20} />
            <h3 style={{ margin: 0, color: '#fff' }}>Fecha Proyectada</h3>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#00e5ff', margin: 0 }}>Diciembre 2026</p>
          <span style={{ fontSize: '12px', color: '#aaa' }}>En proceso de coordinación logística</span>
        </div>

        <div style={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff0055', marginBottom: '12px' }}>
            <MapPin size={20} />
            <h3 style={{ margin: 0, color: '#fff' }}>Lugar / Teatro</h3>
          </div>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff0055', margin: 0 }}>Buenos Aires</p>
          <span style={{ fontSize: '12px', color: '#aaa' }}>Búsqueda y cotización de salas activa</span>
        </div>
      </div>
    </div>
  );
}
