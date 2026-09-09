import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';

export default function Clases() {
  const [clases, setClases] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [claseSelId, setClaseSelId] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const formInicial = { nombre: '', diasHorarios: '', profesor: 'A definir' };
  const [formClase, setFormClase] = useState(formInicial);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const qClases = await getDocs(collection(db, 'clases'));
      const listaC = qClases.docs.map(d => ({ id: d.id, ...d.data() }));
      setClases(listaC);
      if (listaC.length > 0) setClaseSelId(listaC[0].id);

      const qAlum = await getDocs(collection(db, 'alumnos'));
      setAlumnos(qAlum.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error al cargar clases:", error);
    }
  };

  const abrirModalNuevo = () => {
    setFormClase(formInicial);
    setEditandoId(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (c) => {
    setEditandoId(c.id);
    setFormClase({ ...c });
    setModalAbierto(true);
  };

  const guardarClase = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await updateDoc(doc(db, 'clases', editandoId), formClase);
      } else {
        await addDoc(collection(db, 'clases'), formClase);
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (error) {
      console.error("Error al guardar clase:", error);
    }
  };

  const eliminarClase = async (id, nombre) => {
    if (window.confirm(`¿Seguro que querés borrar la clase ${nombre}?`)) {
      try {
        await deleteDoc(doc(db, 'clases', id));
        cargarDatos();
      } catch (error) {
        console.error("Error al eliminar clase:", error);
      }
    }
  };

  const objClaseSel = clases.find(c => c.id === claseSelId);
  const alumnosDeEstaClase = alumnos.filter(a => a.clases && objClaseSel && a.clases.includes(objClaseSel.nombre));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#ffffff' }}>Gestión de Clases & Horarios</h2>
          <p style={{ margin: '4px 0 0 0', color: '#888888', fontSize: '13px' }}>Creá, modificá comisiones y asigná profesores.</p>
        </div>
        <button onClick={abrirModalNuevo} style={btnPrimary}><Plus size={18}/> Crear Nueva Clase</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <div style={cardStyle}>
          <h3 style={{ color: '#ff0055', marginTop: 0 }}>Comisiones Activas ({clases.length})</h3>
          <div style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {clases.map(c => (
              <div 
                key={c.id} 
                onClick={() => setClaseSelId(c.id)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: c.id === claseSelId ? '#ff0055' : '#222222',
                  border: '1px solid #333',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ color: '#fff', fontSize: '14px' }}>{c.nombre}</strong>
                  <div style={{ fontSize: '11px', color: '#eee', marginTop: '2px' }}>
                    <Clock size={11}/> {c.diasHorarios}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={(e) => { e.stopPropagation(); abrirModalEditar(c); }} style={btnIcon}><Edit size={14}/></button>
                  <button onClick={(e) => { e.stopPropagation(); eliminarClase(c.id, c.nombre); }} style={btnIconDelete}><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          {objClaseSel ? (
            <div>
              <h3 style={{ color: '#00e5ff', margin: 0 }}>{objClaseSel.nombre}</h3>
              <p style={{ color: '#aaa', fontSize: '13px' }}>Profe: {objClaseSel.profesor || 'A definir'} • Horario: {objClaseSel.diasHorarios}</p>
              
              <h4 style={{ color: '#fff', marginTop: '20px' }}>Alumnas Inscriptas ({alumnosDeEstaClase.length})</h4>
              <ul style={{ paddingLeft: '20px', color: '#ccc' }}>
                {alumnosDeEstaClase.map(a => (
                  <li key={a.id}>{a.nombre} {a.apellido} (DNI: {a.dni})</li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ color: '#888' }}>Seleccioná una clase para ver el detalle.</p>
          )}
        </div>
      </div>

      {modalAbierto && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ color: '#ff0055', marginTop: 0 }}>{editandoId ? 'Modificar Clase' : 'Crear Nueva Clase'}</h3>
            <form onSubmit={guardarClase}>
              <input type="text" required style={inputStyle} value={formClase.nombre} onChange={e => setFormClase({...formClase, nombre: e.target.value})} placeholder="Nombre de Clase" />
              <input type="text" required style={inputStyle} value={formClase.diasHorarios} onChange={e => setFormClase({...formClase, diasHorarios: e.target.value})} placeholder="Días y Horarios" />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>Guardar Clase</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = { backgroundColor: '#181818', padding: '20px', borderRadius: '10px', border: '1px solid #222' };
const btnPrimary = { backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const btnIcon = { backgroundColor: '#333', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' };
const btnIconDelete = { backgroundColor: '#cc0033', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#222', color: '#fff', boxSizing: 'border-box' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { backgroundColor: '#181818', padding: '25px', borderRadius: '12px', width: '450px', border: '1px solid #ff0055' };
const btnCancel = { backgroundColor: '#333', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' };