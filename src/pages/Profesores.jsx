import React from 'react';
import { GraduationCap, Calculator } from 'lucide-react';

export default function Profesores() {
  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h2>Módulo 4: Liquidación a Profesores</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '15px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc', backgroundColor: '#fafafa' }}>
            <th style={{ padding: '10px' }}>Profesor/a</th>
            <th style={{ padding: '10px' }}>Modalidad</th>
            <th style={{ padding: '10px' }}>Alumnos / Horas</th>
            <th style={{ padding: '10px' }}>Total a Liquidar</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '10px', fontWeight: 'bold' }}>María Pérez</td>
            <td style={{ padding: '10px' }}>% por Alumno Asistido</td>
            <td style={{ padding: '10px' }}>15 Alumnos</td>
            <td style={{ padding: '10px', color: '#2e7d32', fontWeight: 'bold' }}>$180.000</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '10px', fontWeight: 'bold' }}>Ana Gómez</td>
            <td style={{ padding: '10px' }}>Monto Fijo por Hora</td>
            <td style={{ padding: '10px' }}>20 Horas</td>
            <td style={{ padding: '10px', color: '#2e7d32', fontWeight: 'bold' }}>$200.000</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
