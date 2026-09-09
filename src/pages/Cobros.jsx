import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Cobros() {
  const [cobros, setCobros] = useState([]);

  useEffect(() => { fetchCobros(); }, []);

  const fetchCobros = async () => {
    try {
      const snap = await getDocs(collection(db, 'cobros'));
      setCobros(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, marginBottom: '24px' }}>
        💳 Cobros & <span style={{ color: '#ff0055' }}>Facturación</span>
      </h1>
      <div style={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #222', padding: '20px' }}>
        <h3>Historial de Cobros Registrados ({cobros.length})</h3>
        {cobros.map(c => (
          <div key={c.id} style={{ backgroundColor: '#181818', padding: '12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid #222' }}>
            <div style={{ fontWeight: 'bold' }}>{c.nombreAlumna}</div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>{c.metodoPago} - ${c.montoTotal}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
