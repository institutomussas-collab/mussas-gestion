import React from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function Caja() {
  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <h2>Módulo 4: Caja Diaria y Servicios Fijos</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div style={{ padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px', borderLeft: '4px solid #2e7d32' }}>
          <small>Ingresos Hoy (Efectivo)</small>
          <h3 style={{ margin: '5px 0 0 0', color: '#2e7d32' }}>$120.000</h3>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#ffebee', borderRadius: '8px', borderLeft: '4px solid #c62828' }}>
          <small>Egresos Hoy</small>
          <h3 style={{ margin: '5px 0 0 0', color: '#c62828' }}>$15.000</h3>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', borderLeft: '4px solid #1565c0' }}>
          <small>Ingresos Hoy (Transferencia)</small>
          <h3 style={{ margin: '5px 0 0 0', color: '#1565c0' }}>$240.000</h3>
        </div>
      </div>

      <h3>Cargar Nuevo Movimiento</h3>
      <div style={{ display: 'flex', gap: '10px', maxWidth: '600px' }}>
        <input type="text" placeholder="Concepto (Ej. Insumos limpieza, Vestuario)" style={{ flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        <input type="number" placeholder="Monto" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        <button style={{ backgroundColor: '#2e7d32', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Ingreso</button>
        <button style={{ backgroundColor: '#c62828', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Egreso</button>
      </div>
    </div>
  );
}
