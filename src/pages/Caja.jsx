import React from 'react';
import { Wallet } from 'lucide-react';

export default function Caja() {
  return (
    <div>
      <h2 style={{ color: '#00bfa5', marginBottom: '20px' }}>Caja Diaria & Servicios Fijos</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div style={{ padding: '15px', backgroundColor: '#00332c', borderRadius: '8px', borderLeft: '4px solid #00e676' }}>
          <small>Ingresos Efvo Hoy</small>
          <h3 style={{ margin: '5px 0 0 0', color: '#00e676' }}>$120.000</h3>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#3e2723', borderRadius: '8px', borderLeft: '4px solid #ff5252' }}>
          <small>Egresos Hoy</small>
          <h3 style={{ margin: '5px 0 0 0', color: '#ff5252' }}>$15.000</h3>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#002171', borderRadius: '8px', borderLeft: '4px solid #448aff' }}>
          <small>Ingresos Transf. Hoy</small>
          <h3 style={{ margin: '5px 0 0 0', color: '#448aff' }}>$240.000</h3>
        </div>
      </div>
    </div>
  );
}
