import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Clases() {
  const [clases, setClases] = useState([]);
  const [profesores, setProfesores] = useState([]);

  useEffect(() => {
    fetchClases();
    fetchProfesores();
  }, []);

  const fetchClases = async () => {
    try {
      const snap = await getDocs(collection(db, 'clases'));
      setClases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const fetchProfesores = async () => {
    try {
      const snap = await getDocs(collection(db, 'profesores'));
      setProfesores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, marginBottom: '24px' }}>
        🩰 Clases & <span style={{ color: '#ff0055' }}>Comisiones</span>
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {clases.map(c => {
          const profe = profesores.find(p => p.id === c.profesorId);
          return (
            <div key={c.id} style={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #222', padding: '16px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#fff' }}>{c.nombre}</h3>
              <div style={{ fontSize: '13px', color: '#00e5ff', marginBottom: '6px' }}>
                Profesor/a: {profe ? `${profe.nombre} ${profe.apellido}` : 'Sin Asignar'}
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>
                📅 {c.dias?.join(', ') || 'Sin Días'} - 🕒 {c.horario || 'Sin Horario'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00ff88', marginTop: '12px' }}>
                ${c.precioCuota?.toLocaleString('es-AR')} / mes
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
