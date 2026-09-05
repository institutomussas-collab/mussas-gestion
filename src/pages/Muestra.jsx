import React, { useState } from 'react';
import { Sparkles, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Muestra() {
  const [grupos] = useState([
    { id: '1', nombre: 'Mini Artistas - Traje Hadas', valorVestuario: 45000, totalAlumnos: 12, abonaron: 8 },
    { id: '2', nombre: 'Urban Kids - Vestuario Street', valorVestuario: 50000, totalAlumnos: 15, abonaron: 10 },
    { id: '3', nombre: 'Jazz Teens - Traje Gala', valorVestuario: 55000, totalAlumnos: 10, abonaron: 10 }
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#e91e63', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles /> Muestra de Fin de Año & Vestuarios
        </h2>
        <button style={btnPrimary}>+ Asignar Vestuario a Grupo</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {grupos.map(g => {
          const faltan = g.totalAlumnos - g.abonaron;
          const recaudado = g.abonaron * g.valorVestuario;
          const totalEsperado = g.totalAlumnos * g.valorVestuario;

          return (
            <div key={g.id} style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #e91e63' }}>
              <h3 style={{ color: '#00bfa5', margin: '0 0 10px 0' }}>{g.nombre}</h3>
              <p style={{ fontSize: '13px', margin: '4px 0' }}>Monto por Alumno: <strong>${g.valorVestuario.toLocaleString()}</strong></p>
              <p style={{ fontSize: '13px', margin: '4px 0' }}>Alumnas que Abonaron: <strong style={{ color: '#00e676' }}>{g.abonaron} de {g.totalAlumnos}</strong></p>
              
              <div style={{ margin: '15px 0', padding: '10px', backgroundColor: '#282828', borderRadius: '5px' }}>
                <div style={{ fontSize: '12px', color: '#aaa' }}>Progreso de Recaudación:</div>
                <strong style={{ color: '#00bfa5', fontSize: '18px' }}>${recaudado.toLocaleString()} / ${totalEsperado.toLocaleString()}</strong>
              </div>

              {faltan > 0 ? (
                <div style={{ color: '#ff6f00', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertTriangle size={14}/> Faltan abonar {faltan} alumnas en este grupo.
                </div>
              ) : (
                <div style={{ color: '#00e676', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle size={14}/> ¡Grupo 100% Saldado!
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const btnPrimary = { backgroundColor: '#e91e63', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
