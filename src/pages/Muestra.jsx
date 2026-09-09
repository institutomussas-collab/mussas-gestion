import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Sparkles, Plus, Eye, EyeOff } from 'lucide-react';

export default function Muestra() {
  const [clases, setClases] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [gastosMuestra, setGastosMuestra] = useState([]);
  
  const [mostrarCostosPrivados, setMostrarCostosPrivados] = useState(false);
  const [modalGasto, setModalGasto] = useState(false);
  const [formGasto, setFormGasto] = useState({ concepto: '', tipo: 'MODISTA', monto: 0 });

  useEffect(() => {
    cargarDatosMuestra();
  }, []);

  const cargarDatosMuestra = async () => {
    try {
      const qC = await getDocs(collection(db, 'clases'));
      setClases(qC.docs.map(d => ({ id: d.id, ...d.data() })));

      const qA = await getDocs(collection(db, 'alumnos'));
      setAlumnos(qA.docs.map(d => ({ id: d.id, ...d.data() })));

      const qP = await getDocs(collection(db, 'pagos'));
      setPagos(qP.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.concepto.includes('Vestuario') || p.concepto.includes('Muestra')));

      const qG = await getDocs(collection(db, 'gastos_muestra'));
      setGastosMuestra(qG.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error al cargar datos de muestra:", error);
    }
  };

  const guardarGastoMuestra = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'gastos_muestra'), formGasto);
      setModalGasto(false);
      setFormGasto({ concepto: '', tipo: 'MODISTA', monto: 0 });
      cargarDatosMuestra();
    } catch (error) {
      console.error("Error al guardar gasto de muestra:", error);
    }
  };

  const totalGastosProduccion = gastosMuestra.reduce((acc, g) => acc + Number(g.monto || 0), 0);
  const totalRecaudadoVestuarios = pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles color="#ff0055" /> Muestra de Fin de Año & Vestuarios
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#aaa', fontSize: '13px' }}>Control de señas, cuotas por grupo y balance real de confección.</p>
        </div>
        <button onClick={() => setMostrarCostosPrivados(!mostrarCostosPrivados)} style={btnPrimary}>
          {mostrarCostosPrivados ? <EyeOff size={18}/> : <Eye size={18}/>} 
          {mostrarCostosPrivados ? 'Ocultar Panel Privado' : 'Panel Costos Modista'}
        </button>
      </div>

      {mostrarCostosPrivados && (
        <div style={{ backgroundColor: '#181818', padding: '20px', borderRadius: '8px', border: '1px solid #ff0055', marginBottom: '25px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ color: '#ff0055', margin: 0 }}>Panel Privado de Costos de Producción</h3>
            <button onClick={() => setModalGasto(true)} style={btnPrimary}><Plus size={16}/> Cargar Gasto (Modista/Telas)</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div style={{ padding: '12px', backgroundColor: '#222', borderRadius: '6px' }}>
              <small style={{ color: '#aaa' }}>Total Recaudado Vestuarios:</small>
              <h3 style={{ color: '#00e5ff', margin: '4px 0 0 0' }}>${totalRecaudadoVestuarios.toLocaleString()}</h3>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#222', borderRadius: '6px' }}>
              <small style={{ color: '#aaa' }}>Total Pagado (Modistas + Telas):</small>
              <h3 style={{ color: '#ff3366', margin: '4px 0 0 0' }}>${totalGastosProduccion.toLocaleString()}</h3>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#222', borderRadius: '6px' }}>
              <small style={{ color: '#aaa' }}>Resultado Neto Muestra:</small>
              <h3 style={{ color: '#00e5ff', margin: '4px 0 0 0' }}>${(totalRecaudadoVestuarios - totalGastosProduccion).toLocaleString()}</h3>
            </div>
          </div>
        </div>
      )}

      <h3 style={{ color: '#ff0055', marginBottom: '15px' }}>Avance por Grupo y Comisión</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {clases.map(c => {
          const alumnasGrupo = alumnos.filter(a => a.clases && a.clases.includes(c.nombre));
          const pagosGrupo = pagos.filter(p => alumnasGrupo.some(a => a.dni === p.alumnoDni));
          const recaudadoGrupo = pagosGrupo.reduce((acc, p) => acc + Number(p.monto || 0), 0);

          return (
            <div key={c.id} style={{ backgroundColor: '#181818', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #ff0055' }}>
              <h3 style={{ color: '#00e5ff', margin: '0 0 5px 0' }}>{c.nombre}</h3>
              <div style={{ fontSize: '12px', color: '#aaa' }}>Profesor/a: {c.profesor || 'Sin asignar'}</div>
              <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '10px' }}>Inscriptas: <strong>{alumnasGrupo.length} alumnas</strong></div>

              <div style={{ padding: '10px', backgroundColor: '#222', borderRadius: '5px', marginBottom: '10px' }}>
                <small style={{ color: '#aaa' }}>Total Recaudado en este Grupo:</small>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00e5ff' }}>${recaudadoGrupo.toLocaleString()}</div>
              </div>

              <h4 style={{ fontSize: '12px', color: '#ff0055', marginBottom: '6px' }}>Estado por Alumna:</h4>
              <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '12px' }}>
                {alumnasGrupo.map(a => {
                  const pagosAlumna = pagosGrupo.filter(p => p.alumnoDni === a.dni);
                  const pagadoTotal = pagosAlumna.reduce((acc, p) => acc + Number(p.monto || 0), 0);

                  return (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #333' }}>
                      <span>{a.nombre} {a.apellido}</span>
                      <strong style={{ color: pagadoTotal > 0 ? '#00e5ff' : '#ff3366' }}>
                        {pagadoTotal > 0 ? `$${pagadoTotal.toLocaleString()}` : 'Pendiente'}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {modalGasto && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ color: '#ff0055', marginTop: 0 }}>Cargar Gasto de Producción</h3>
            <form onSubmit={guardarGastoMuestra}>
              <label style={labelStyle}>Tipo de Gasto:</label>
              <select style={inputStyle} value={formGasto.tipo} onChange={e => setFormGasto({...formGasto, tipo: e.target.value})}>
                <option value="MODISTA">Confección / Modista</option>
                <option value="TELAS">Compra de Telas e Insumos</option>
                <option value="FLETE">Flete / Traslados / Uber</option>
                <option value="TEATRO">Canon Teatro / Sonido</option>
                <option value="VARIOS">Otros Gastos Muestra</option>
              </select>

              <label style={labelStyle}>Concepto / Detalle:</label>
              <input type="text" required style={inputStyle} value={formGasto.concepto} onChange={e => setFormGasto({...formGasto, concepto: e.target.value})} placeholder="Ej. Seña 50% confección trajes Urban Kids" />

              <label style={labelStyle}>Monto ($):</label>
              <input type="number" required style={inputStyle} value={formGasto.monto} onChange={e => setFormGasto({...formGasto, monto: Number(e.target.value)})} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setModalGasto(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>Guardar Gasto</button>
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