import React, { useState } from 'react';
import { Calendar, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function Clases() {
  const [clases] = useState([
    { id: '1', nombre: 'Danza Jazz Infantil', profesor: 'María Pérez', horario: 'Mar y Jue 18:00 hs' },
    { id: '2', nombre: 'Profesorado Danza Jazz', profesor: 'Ana Gómez', horario: 'Lun y Mie 19:00 hs' }
  ]);

  const [alumnosClase] = useState([
    { id: 'a1', nombre: 'Sofía Martínez', ausenciasSeguidas: 2 },
    { id: 'a2', nombre: 'Lucía Fernández', ausenciasSeguidas: 0 },
    { id: 'a3', nombre: 'Camila Rodríguez', ausenciasSeguidas: 1 }
  ]);

  const [asistencias, setAsistencias] = useState({});

  const marcarAsistencia = (alumnoId, presente) => {
    setAsistencias(prev => ({ ...prev, [alumnoId]: presente }));
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h2>Módulo 2: Clases y Toma de Lista Rápida</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Seleccionar Clase:</label>
        <select style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
          {clases.map(c => <option key={c.id} value={c.id}>{c.nombre} - Profe: {c.profesor} ({c.horario})</option>)}
        </select>
      </div>

      <h3>Lista de Asistencia del Día</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {alumnosClase.map(a => (
          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #eee', borderRadius: '6px', backgroundColor: a.ausenciasSeguidas >= 2 ? '#fff5f5' : '#fff' }}>
            <div>
              <strong style={{ fontSize: '16px' }}>{a.nombre}</strong>
              {a.ausenciasSeguidas >= 2 && (
                <div style={{ color: '#d32f2f', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <AlertTriangle size={14} /> ¡Atención! 2 ausencias consecutivas
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => marcarAsistencia(a.id, true)}
                style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: asistencias[a.id] === true ? '#2e7d32' : '#e8f5e9', color: asistencias[a.id] === true ? '#fff' : '#2e7d32', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <CheckCircle2 size={16}/> Presente
              </button>
              <button 
                onClick={() => marcarAsistencia(a.id, false)}
                style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: asistencias[a.id] === false ? '#c62828' : '#ffebee', color: asistencias[a.id] === false ? '#fff' : '#c62828', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <XCircle size={16}/> Ausente
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
