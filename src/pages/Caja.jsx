import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Plus, Lock } from 'lucide-react';

export default function Caja() {
  const [movimientos, setMovimientos] = useState([]);
  const [pagosAuto, setPagosAuto] = useState([]);
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [efectivoReal, setEfectivoReal] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  const formInicial = { tipo: 'EGRESO', concepto: '', categoria: 'Insumos Limpieza', monto: 0, metodo: 'EFECTIVO', notas: '' };
  const [formMov, setFormMov] = useState(formInicial);

  useEffect(() => {
    cargarCaja();
  }, []);

  const cargarCaja = async () => {
    try {
      const qPagos = await getDocs(collection(db, 'pagos'));
      setPagosAuto(qPagos.docs.map(d => ({ id: d.id, ...d.data() })));

      const qMovs = await getDocs(collection(db, 'movimientos_caja'));
      setMovimientos(qMovs.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error al cargar caja:", error);
    }
  };

  const guardarMovimiento = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'movimientos_caja'), {
        ...formMov,
        fecha: new Date().toISOString()
      });
      setModalAbierto(false);
      setFormMov(formInicial);
      cargarCaja();
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
    }
  };

  const ingresosEfectivoAuto = pagosAuto.filter(p => p.metodo === 'EFECTIVO').reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const ingresosTransfAuto = pagosAuto.filter(p => p.metodo === 'TRANSFERENCIA').reduce((acc, p) => acc + Number(p.monto || 0), 0);
  
  const egresosEfectivoManual = movimientos.filter(m => m.tipo === 'EGRESO' && m.metodo === 'EFECTIVO').reduce((acc, m) => acc + Number(m.monto || 0), 0);
  const ingresosEfectivoManual = movimientos.filter(m => m.tipo === 'INGRESO' && m.metodo === 'EFECTIVO').reduce((acc, m) => acc + Number(m.monto || 0), 0);

  const totalEfectivoEsperado = (Number(saldoInicial) + ingresosEfectivoAuto + ingresosEfectivoManual) - egresosEfectivoManual;
  const diferenciaCaja = efectivoReal !== '' ? Number(efectivoReal) - totalEfectivoEsperado : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#ffffff' }}>Caja Diaria & Arqueo del Mostrador</h2>
          <p style={{ margin: '4px 0 0 0', color: '#aaa', fontSize: '13px' }}>Control de efectivo diario, transferencias y egresos categorizados.</p>
        </div>
        <button onClick={() => setModalAbierto(true)} style={btnPrimary}><Plus size={18}/> Cargar Movimiento Manual</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }}>
        <div style={{ padding: '15px', backgroundColor: '#181818', borderRadius: '8px', borderLeft: '4px solid #ff0055' }}>
          <small style={{ color: '#aaa' }}>Saldo Inicial del Día ($)</small>
          <input 
            type="number" 
            value={saldoInicial} 
            onChange={e => setSaldoInicial(Number(e.target.value))} 
            style={{ width: '100%', padding: '6px', backgroundColor: '#222', color: '#ff0055', border: '1px solid #333', borderRadius: '4px', marginTop: '5px', fontWeight: 'bold', fontSize: '16px' }}
          />
        </div>

        <div style={{ padding: '15px', backgroundColor: '#181818', borderRadius: '8px', borderLeft: '4px solid #00e5ff' }}>
          <small style={{ color: '#aaa' }}>Ingresos Efectivo Total</small>
          <h3 style={{ margin: '5px 0 0 0', color: '#00e5ff' }}>${(ingresosEfectivoAuto + ingresosEfectivoManual).toLocaleString()}</h3>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#181818', borderRadius: '8px', borderLeft: '4px solid #ff3366' }}>
          <small style={{ color: '#aaa' }}>Egresos Efectivo del Día</small>
          <h3 style={{ margin: '5px 0 0 0', color: '#ff3366' }}>${egresosEfectivoManual.toLocaleString()}</h3>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#181818', borderRadius: '8px', borderLeft: '4px solid #aa00ff' }}>
          <small style={{ color: '#aaa' }}>Ingresos por Transferencia</small>
          <h3 style={{ margin: '5px 0 0 0', color: '#aa00ff' }}>${ingresosTransfAuto.toLocaleString()}</h3>
        </div>
      </div>

      <div style={{ backgroundColor: '#181818', padding: '20px', borderRadius: '8px', border: '1px solid #222', marginBottom: '25px' }}>
        <h3 style={{ color: '#ff0055', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={18}/> Conciliación y Arqueo de Efectivo en Mano
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>Efectivo Teórico en Caja:</div>
            <strong style={{ fontSize: '22px', color: '#00e5ff' }}>${totalEfectivoEsperado.toLocaleString()}</strong>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#aaa', display: 'block' }}>Efectivo Real en Cajón ($):</label>
            <input 
              type="number" 
              placeholder="Contar billetes..." 
              value={efectivoReal} 
              onChange={e => setEfectivoReal(e.target.value)} 
              style={{ width: '100%', padding: '10px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '5px', fontSize: '16px', marginTop: '4px' }}
            />
          </div>
          <div>
            {diferenciaCaja !== null && (
              <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#222', border: '1px solid #444' }}>
                <small style={{ color: '#aaa' }}>Diferencia de Caja:</small>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: diferenciaCaja === 0 ? '#00e5ff' : '#ff3366' }}>
                  {diferenciaCaja === 0 ? 'Sin Diferencia ($0)' : `$${diferenciaCaja.toLocaleString()}`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 style={{ color: '#ff0055', marginBottom: '10px' }}>Egresos e Ingresos Manuales del Día</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#181818', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ff0055', color: '#fff' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Tipo</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Categoría</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Concepto</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Método</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Monto ($)</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.length === 0 ? (
            <tr><td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: '#888' }}>No hay movimientos manuales cargados hoy.</td></tr>
          ) : (
            movimientos.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '10px', fontWeight: 'bold', color: m.tipo === 'INGRESO' ? '#00e5ff' : '#ff3366' }}>{m.tipo}</td>
                <td style={{ padding: '10px' }}>{m.categoria}</td>
                <td style={{ padding: '10px' }}>{m.concepto}</td>
                <td style={{ padding: '10px' }}>{m.metodo}</td>
                <td style={{ padding: '10px', fontWeight: 'bold', color: m.tipo === 'INGRESO' ? '#00e5ff' : '#ff3366' }}>${m.monto.toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ color: '#ff0055', marginTop: 0 }}>Cargar Movimiento Manual</h3>
            <form onSubmit={guardarMovimiento}>
              <label style={labelStyle}>Tipo de Movimiento:</label>
              <select style={inputStyle} value={formMov.tipo} onChange={e => setFormMov({...formMov, tipo: e.target.value})}>
                <option value="EGRESO">EGRESO (Gasto / Salida)</option>
                <option value="INGRESO">INGRESO (Entrada Extra)</option>
              </select>

              <label style={labelStyle}>Categoría:</label>
              <select style={inputStyle} value={formMov.categoria} onChange={e => setFormMov({...formMov, categoria: e.target.value})}>
                <option value="Insumos Limpieza">Insumos de Limpieza</option>
                <option value="Mantenimiento / Arreglos">Mantenimiento / Arreglos</option>
                <option value="Artículos de Oficina">Artículos de Oficina / Papelería</option>
                <option value="Viáticos / Fletes">Viáticos / Fletes</option>
                <option value="Refrigerio / Agua">Refrigerio / Agua</option>
                <option value="Varios">Varios</option>
              </select>

              <label style={labelStyle}>Concepto / Detalle:</label>
              <input type="text" required style={inputStyle} value={formMov.concepto} onChange={e => setFormMov({...formMov, concepto: e.target.value})} placeholder="Ej. Lavandina y bolsas de consorcio" />

              <label style={labelStyle}>Método:</label>
              <select style={inputStyle} value={formMov.metodo} onChange={e => setFormMov({...formMov, metodo: e.target.value})}>
                <option value="EFECTIVO">Efectivo de la Caja</option>
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
              </select>

              <label style={labelStyle}>Monto ($):</label>
              <input type="number" required style={inputStyle} value={formMov.monto} onChange={e => setFormMov({...formMov, monto: Number(e.target.value)})} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>Guardar Movimiento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const btnPrimary = { backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const inputStyle = { width: '100%', padding: '9px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#222', color: '#fff', boxSizing: 'border-box' };
const labelStyle = { fontSize: '11px', color: '#ff0055', display: 'block', marginBottom: '2px' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { backgroundColor: '#181818', padding: '25px', borderRadius: '10px', width: '450px', border: '1px solid #ff0055' };
const btnCancel = { backgroundColor: '#444', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' };