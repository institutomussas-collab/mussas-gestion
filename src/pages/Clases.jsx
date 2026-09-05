import React, { useState } from 'react';
import { Calendar, CheckCircle2, XCircle, Plus, MessageSquare } from 'lucide-react';
import { enviarWspGrupoClase } from '../utils/whatsapp';

export default function Clases() {
  const [clases] = useState([
    { id: '1', nombre: 'Mini artistas (3 años)', profesor: 'Vicky', horario: 'Mar/Jue 17:30 a 18:30' },
    { id: '2', nombre: 'Coreo Babys (4-6 años)', profesor: 'Martina', horario: 'Mie 18:30 y Vie 18:00' },
    { id: '3', nombre: 'Urban Kids (4-6 años)', profesor: 'Cande Rivas', horario: 'Lun/Mie 17:30 a 18:30' },
    { id: '4', nombre: 'Gim. Rítmica (4-6 años)', profesor: 'Sol', horario: 'Mie 17:30 a 18:30' },
    { id: '5', nombre: 'Danza Clásica Infantil (6-10)', profesor: 'Sofia', horario: 'Lun 17:30 y Vie 18:00' },
    { id: '6', nombre: 'Coreo Infantil (6-10)', profesor: 'Martina', horario: 'Mar/Jue 18:00 a 19:00' },
    { id: '7', nombre: 'Jazz Inf. Avanzado (6-10)', profesor: 'Cande Rivas', horario: 'Lun/Mie 18:30 a 19:30' },
    { id: '8', nombre: 'Urban Infantil (6-10)', profesor: 'Cande Rondo', horario: 'Mar 18:30 a 19:30' },
    { id: '9', nombre: 'Urban "CREW" (6-10)', profesor: 'Cande Rondo', horario: 'Mar/Jue 19:30 a 20:30' },
    { id: '10', nombre: 'Comedia Musical (6-10)', profesor: 'Vicky', horario: 'Mar 19:00 a 20:30' },
    { id: '11', nombre: 'Prof. Danza Jazz Inf (6-10)', profesor: 'Mica', horario: 'Lun 18:30 a 19:30' },
    { id: '12', nombre: 'Jazz Teens (11-14)', profesor: 'Mica', horario: 'Jue 18:30 a 19:30' },
    { id: '13', nombre: 'Jazz Teens Av (11-14)', profesor: 'Cande Rivas', horario: 'Lun/Mie 19:30 a 20:30' },
    { id: '14', nombre: 'Contempo (11-14 y +15)', profesor: 'Sofi', horario: 'Vie 19:00 a 20:30' },
    { id: '15', nombre: 'Jazz Principiantes (+15)', profesor: 'Mica', horario: 'Jue 20:00 a 21:00' },
    { id: '16', nombre: 'Jazz Juv Int/Av (+15)', profesor: 'Mica', horario: 'Lun/Mie 19:00 a 20:30' },
    { id: '17', nombre: 'Danza Clásica (+15)', profesor: 'Lili', horario: 'Mar 20:30 y Vie 20:00' },
    { id: '18', nombre: 'Baile +30 (Adultos)', profesor: 'Ani', horario: 'Vie 19:00 a 20:00' },
    { id: '19', nombre: 'Jazz Principiante (Adultos)', profesor: 'Mica', horario: 'Jue 19:30 a 20:30' }
  ]);

  const [claseSel, setClaseSel] = useState('1');
  const [comunicado, setComunicado] = useState('');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#00bfa5', margin: 0 }}>Clases, Profesores & Asistencias</h2>
        <button style={btnPrimary}><Plus size={18}/> Crear / Modificar Clase</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <div style={cardStyle}>
          <h3 style={{ color: '#e91e63', marginTop: 0 }}>Seleccionar Clase</h3>
          <select value={claseSel} onChange={e => setClaseSel(e.target.value)} style={selectStyle}>
            {clases.map(c => <option key={c.id} value={c.id}>{c.nombre} - Profe: {c.profesor}</option>)}
          </select>

          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#00332c', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 5px 0', color: '#00bfa5' }}>Enviar Comunicado al Grupo</h4>
            <textarea placeholder="Ej. Traer ropa negra para el ensayo..." value={comunicado} onChange={e => setComunicado(e.target.value)} style={inputStyle}></textarea>
            <button onClick={() => enviarWspGrupoClase('1122334455', 'Clase', comunicado)} style={btnPrimary}><MessageSquare size={16}/> Enviar por Wsp</button>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ color: '#00bfa5', marginTop: 0 }}>Grilla de Asistencia Mensual</h3>
          <p style={{ fontSize: '12px', color: '#aaa' }}>Marcar Presente (P) o Ausente (A) para los alumnos inscriptos en esta comisión.</p>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '15px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #004d40', color: '#00bfa5' }}>
                <th style={{ padding: '8px' }}>Alumna</th>
                <th style={{ padding: '8px' }}>Clase 1</th>
                <th style={{ padding: '8px' }}>Clase 2</th>
                <th style={{ padding: '8px' }}>Clase 3</th>
                <th style={{ padding: '8px' }}>Clase 4</th>
                <th style={{ padding: '8px' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                <td style={{ padding: '10px' }}>Sofia Martínez</td>
                <td style={{ padding: '10px', color: '#00e676' }}>P</td>
                <td style={{ padding: '10px', color: '#00e676' }}>P</td>
                <td style={{ padding: '10px', color: '#ff5252' }}>A</td>
                <td style={{ padding: '10px', color: '#00e676' }}>P</td>
                <td style={{ padding: '10px' }}>
                  <button style={{ backgroundColor: '#004d40', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Marcar Hoy</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const cardStyle = { backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #2a2a2a' };
const selectStyle = { width: '100%', padding: '10px', backgroundColor: '#282828', color: '#fff', border: '1px solid #333', borderRadius: '5px' };
const inputStyle = { width: '100%', padding: '8px', backgroundColor: '#282828', color: '#fff', border: '1px solid #333', borderRadius: '5px', height: '60px', marginBottom: '10px' };
const btnPrimary = { backgroundColor: '#e91e63', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
