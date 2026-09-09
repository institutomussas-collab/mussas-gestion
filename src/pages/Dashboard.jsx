import React from 'react';
import { Users, DollarSign } from 'lucide-react';

export default function Dashboard() {
  return (
    <div style={{ padding: '24px', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, marginBottom: '24px' }}>
        📊 Dashboard <span style={{ color: '#ff0055' }}>Mussas Studio</span>
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={cardStyle}>
          <Users color="#ff0055" />
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>Alumnas Activas</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>120</div>
        </div>
        <div style={cardStyle}>
          <DollarSign color="#00ff88" />
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>Ingresos del Mes</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff88' }}>$450.000</div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = { backgroundColor: '#121212', padding: '20px', borderRadius: '12px', border: '1px solid #222' };
