import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { GraduationCap, Plus } from 'lucide-react';

export default function Profesores() {
  const [profesores, setProfesores] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', disciplina: '', porcentaje: 50, valorHora: 0 });

  useEffect(() => {
    cargarProfes();
  }, []);

  const cargarProfes = async () => {
    try {
      const q = await getDocs(collection(db, 'profesores'));
      setProfesores(q.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  const guardarProfe = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'profesores'), form);
      setModal(false);
      setForm({ nombre: '', disciplina: '', porcentaje: 50, valorHora: 0 });
      cargarProfes();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GraduationCap color="#ff0055" /> Profesores & Honorarios
        </h2>
        <button onClick={() => setModal(true)} style={btnPrimary}><Plus size={18}/> Cargar Profesor</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
        {profesores.map(p => (
          <div key={p.id} style={{ backgroundColor: '#181818', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ff0055' }}>
            <h3 style={{ margin: 0, color: '#00e5ff' }}>{p.nombre}</h3>
            <p style={{ color: '#aaa', fontSize: '13px', margin: '4px 0' }}>{p.disciplina}</p>
            <div style={{ fontSize: '12px', color: '#fff', marginTop: '10px' }}>
              Modalidad: <strong>{p.porcentaje}% por alumna / ${p.valorHora} por hora</strong>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ color: '#ff0055', marginTop: 0 }}>Cargar Profesor</h3>
            <form onSubmit={guardarProfe}>
              <input type="text" placeholder="Nombre completo" required style={inputStyle} value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
              <input type="text" placeholder="Disciplina / Estilo" required style={inputStyle} value={form.disciplina} onChange={e => setForm({...form, disciplina: e.target.value})} />
              <input type="number" placeholder="Porcentaje (%)" style={inputStyle} value={form.porcentaje} onChange={e => setForm({...form, porcentaje: Number(e.target.value)})} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setModal(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>Guardar</button>
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
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { backgroundColor: '#181818', padding: '25px', borderRadius: '10px', width: '400px', border: '1px solid #ff0055' };
const btnCancel = { backgroundColor: '#444', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' };