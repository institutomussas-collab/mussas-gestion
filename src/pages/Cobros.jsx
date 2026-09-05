import React, { useState } from 'react';
import { DollarSign, Upload, Send } from 'lucide-react';
import { enviarReciboWsp } from '../utils/whatsapp';

export default function Cobros() {
  const [monto, setMonto] = useState(60000);
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [alumno, setAlumno] = useState('Sofía Martínez');

  const montoFinal = metodo === 'TRANSFERENCIA' ? monto * 1.04 : monto;

  const registrarPago = (e) => {
    e.preventDefault();
    enviarReciboWsp(alumno, '1122334455', 'Cuota Mensual Danza', montoFinal);
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h2>Módulo 3: Registro de Cobros y Pases</h2>

      <form onSubmit={registrarPago} style={{ maxWidth: '500px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Alumno:</label>
          <input type="text" value={alumno} onChange={e => setAlumno(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Monto Base ($):</label>
          <input type="number" value={monto} onChange={e => setMonto(Number(e.target.value))} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Método de Pago:</label>
          <select value={metodo} onChange={e => setMetodo(e.target.value)} style={inputStyle}>
            <option value="EFECTIVO">Efectivo (Sin recargo)</option>
            <option value="TRANSFERENCIA">Transferencia (+4% Recargo)</option>
          </select>
        </div>

        {metodo === 'TRANSFERENCIA' && (
          <div style={{ padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px', marginBottom: '15px', color: '#0d47a1' }}>
            Recargo del 4% aplicado. <strong>Total a pagar: ${montoFinal.toLocaleString()}</strong>
          </div>
        )}

        <button type="submit" style={{ backgroundColor: '#e91e63', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <Send size={18} /> Registrar Pago y Enviar Recibo Wsp
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box'
};
