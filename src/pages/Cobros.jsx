import React, { useState } from 'react';
import { DollarSign, Send, FileText, History } from 'lucide-react';
import { enviarReciboWsp } from '../utils/whatsapp';

export default function Cobros() {
  const [alumno, setAlumno] = useState('Sofía Martínez');
  const [monto, setMonto] = useState(60000);
  const [concepto, setConcepto] = useState('Cuota Mensual');
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [notas, setNotas] = useState('');

  const montoFinal = metodo === 'TRANSFERENCIA' ? monto * 1.04 : monto;

  const registrarPago = (e) => {
    e.preventDefault();
    enviarReciboWsp(alumno, '1122334455', concepto, montoFinal);
  };

  return (
    <div>
      <h2 style={{ color: '#00bfa5', marginBottom: '20px' }}>Cuentas Corrientes & Registro de Cobros</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Formulario de Carga */}
        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
          <h3 style={{ color: '#e91e63', marginTop: 0 }}>Cargar Nuevo Pago</h3>
          <form onSubmit={registrarPago}>
            <label style={labelStyle}>Alumno / Alumna:</label>
            <input type="text" value={alumno} onChange={e => setAlumno(e.target.value)} style={inputStyle} />

            <label style={labelStyle}>Concepto de Pago:</label>
            <select value={concepto} onChange={e => setConcepto(e.target.value)} style={inputStyle}>
              <option value="Cuota Mensual">Cuota Mensual</option>
              <option value="Vestuario / Función">Vestuario / Muestra Fin de Año</option>
              <option value="Indumentaria / Uniforme">Indumentaria / Uniforme Mussas</option>
              <option value="Inscripción Competencia">Inscripción a Competencia</option>
              <option value="Matrícula">Matrícula</option>
              <option value="Otros">Otros</option>
            </select>

            <label style={labelStyle}>Monto Base ($):</label>
            <input type="number" value={monto} onChange={e => setMonto(Number(e.target.value))} style={inputStyle} />

            <label style={labelStyle}>Método de Pago:</label>
            <select value={metodo} onChange={e => setMetodo(e.target.value)} style={inputStyle}>
              <option value="EFECTIVO">Efectivo (Sin recargo)</option>
              <option value="TRANSFERENCIA">Transferencia (+4% Recargo)</option>
            </select>

            {metodo === 'TRANSFERENCIA' && (
              <div style={{ padding: '10px', backgroundColor: '#00332c', color: '#00bfa5', borderRadius: '5px', marginBottom: '15px' }}>
                Recargo del 4% aplicado. <strong>Total: ${montoFinal.toLocaleString()}</strong>
              </div>
            )}

            <label style={labelStyle}>Aclaraciones / Detalle:</label>
            <textarea placeholder="Ej. Señas $30.000, resta abonar la mitad..." value={notas} onChange={e => setNotas(e.target.value)} style={{...inputStyle, height: '50px'}}></textarea>

            <button type="submit" style={btnPrimary}><Send size={18}/> Registrar y Enviar Recibo Wsp</button>
          </form>
        </div>

        {/* Cuenta Corriente Histórica */}
        <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
          <h3 style={{ color: '#00bfa5', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18}/> Estado de Cuenta Corriente
          </h3>
          <div style={{ padding: '12px', backgroundColor: '#282828', borderRadius: '6px', marginBottom: '15px' }}>
            <strong>Sofía Martínez</strong> - Estado: <span style={{ color: '#00e676' }}>Al Día</span>
          </div>

          <h4>Historial de Pagos</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #004d40', color: '#00bfa5' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Fecha</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Concepto</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                <td style={{ padding: '8px' }}>05/09/2026</td>
                <td style={{ padding: '8px' }}>Cuota Septiembre</td>
                <td style={{ padding: '8px', color: '#00e676' }}>$60.000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '9px', marginBottom: '12px', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#282828', color: '#fff', boxSizing: 'border-box' };
const labelStyle = { fontSize: '12px', color: '#00bfa5', display: 'block', marginBottom: '4px' };
const btnPrimary = { backgroundColor: '#e91e63', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' };
