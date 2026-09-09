import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { enviarWspFichaSalud, enviarWspCumple } from '../utils/whatsapp';
import { UserPlus, MessageCircle, Search, Gift, MapPin, Edit, Trash2 } from 'lucide-react';

const LISTA_CLASES_DEFAULT = [
  "Mini artistas (3 años)", "Coreo Babys (4-6 años)", "Urban Kids (4-6 años)", "Gim. Rítmica (4-6 años)",
  "Danza Clásica Infantil (6-10)", "Coreo Infantil (6-10)", "Jazz Inf. Avanzado (6-10)", "Urban Infantil (6-10)",
  "Urban 'CREW' (6-10)", "Comedia Musical (6-10)", "Prof. Danza Jazz Inf (6-10)", "Jazz Teens (11-14)",
  "Jazz Teens Av (11-14)", "Contempo (11-14 y +15)", "Jazz Principiantes (+15)", "Jazz Juv Int/Av (+15)",
  "Danza Clásica (+15)", "Baile +30 (Adultos)", "Jazz Principiante (Adultos)"
];

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [clasesSeleccionadas, setClasesSeleccionadas] = useState([]);
  
  const estadoInicialForm = {
    nombre: '', apellido: '', dni: '', telefono: '', email: '', direccion: '',
    fechaNacimiento: '', fechaAlta: new Date().toISOString().split('T')[0], fechaBaja: '',
    contactoEmergenciaNombre: '', contactoEmergenciaTel: '', observacionesMedicas: '', estado: 'ACTIVO'
  };

  const [formAlumno, setFormAlumno] = useState(estadoInicialForm);

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'alumnos'));
      setAlumnos(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error al cargar alumnos:", error);
    }
  };

  const abrirModalNuevo = () => {
    setFormAlumno(estadoInicialForm);
    setClasesSeleccionadas([]);
    setEditandoId(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (alumno) => {
    setEditandoId(alumno.id);
    setFormAlumno({ ...alumno });
    setClasesSeleccionadas(alumno.clases || []);
    setModalAbierto(true);
  };

  const handleCheckboxClase = (clase) => {
    if (clasesSeleccionadas.includes(clase)) {
      setClasesSeleccionadas(clasesSeleccionadas.filter(c => c !== clase));
    } else {
      setClasesSeleccionadas([...clasesSeleccionadas, clase]);
    }
  };

  const guardarAlumno = async (e) => {
    e.preventDefault();
    try {
      const datosAguardar = { ...formAlumno, clases: clasesSeleccionadas };
      if (editandoId) {
        await updateDoc(doc(db, 'alumnos', editandoId), datosAguardar);
      } else {
        await addDoc(collection(db, 'alumnos'), datosAguardar);
        enviarWspFichaSalud(formAlumno.nombre, formAlumno.telefono, formAlumno.dni);
      }
      setModalAbierto(false);
      cargarAlumnos();
    } catch (error) {
      console.error("Error al guardar alumno:", error);
    }
  };

  const eliminarAlumno = async (id, nombre) => {
    if (window.confirm(`¿Seguro que querés borrar a ${nombre}?`)) {
      try {
        await deleteDoc(doc(db, 'alumnos', id));
        cargarAlumnos();
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  const alumnosFiltrados = alumnos.filter(a => 
    `${a.nombre} ${a.apellido} ${a.dni}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#ffffff' }}>Gestión de Alumnos & Fichas</h2>
          <p style={{ margin: '4px 0 0 0', color: '#888888', fontSize: '13px' }}>Modificación de datos, asignación de clases y fichas de salud.</p>
        </div>
        <button onClick={abrirModalNuevo} style={btnPrimary}>
          <UserPlus size={18} /> Registrar Nuevo Alumno
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', backgroundColor: '#1a1a1a', padding: '12px 18px', borderRadius: '8px', border: '1px solid #333' }}>
        <Search size={18} style={{ marginRight: '12px', color: '#ff0055' }} />
        <input 
          type="text" 
          placeholder="Buscar por Nombre, Apellido o DNI..." 
          value={busqueda} 
          onChange={(e) => setBusqueda(e.target.value)} 
          style={{ border: 'none', background: 'transparent', outline: 'none', color: '#fff', width: '100%', fontSize: '14px' }} 
        />
      </div>

      <table style={tableStyle}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ff0055', backgroundColor: '#181818', color: '#ffffff' }}>
            <th style={thStyle}>Alumno / Dirección</th>
            <th style={thStyle}>DNI</th>
            <th style={thStyle}>Clases Asignadas</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {alumnosFiltrados.length === 0 ? (
            <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No se encontraron alumnos.</td></tr>
          ) : (
            alumnosFiltrados.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={tdStyle}>
                  <strong>{a.nombre} {a.apellido}</strong>
                  <div style={{ fontSize: '11px', color: '#888' }}><MapPin size={10}/> {a.direccion || 'Valentín Alsina'}</div>
                </td>
                <td style={{ ...tdStyle, fontWeight: 'bold', color: '#ff0055' }}>{a.dni}</td>
                <td style={tdStyle}>
                  {a.clases && a.clases.length > 0 ? (
                    <span style={{ color: '#00e5ff', fontSize: '12px' }}>{a.clases.join(', ')}</span>
                  ) : (
                    <span style={{ color: '#ff3366', fontSize: '12px' }}>Sin clase asignada</span>
                  )}
                </td>
                <td style={tdStyle}>
                  <span style={badgeStyle(a.estado)}>{a.estado}</span>
                </td>
                <td style={{ ...tdStyle, display: 'flex', gap: '8px' }}>
                  <button onClick={() => abrirModalEditar(a)} style={btnEdit}><Edit size={15}/></button>
                  <button onClick={() => enviarWspFichaSalud(a.nombre, a.telefono, a.dni)} style={btnWsp}><MessageCircle size={15}/></button>
                  <button onClick={() => enviarWspCumple(a.nombre, a.telefono)} style={btnCumple}><Gift size={15}/></button>
                  <button onClick={() => eliminarAlumno(a.id, a.nombre)} style={btnDelete}><Trash2 size={15}/></button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ color: '#ff0055', marginTop: 0 }}>{editandoId ? 'Modificar Alumno' : 'Registrar Nuevo Alumno'}</h3>
            <form onSubmit={guardarAlumno}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="text" placeholder="Nombre" required style={inputStyle} value={formAlumno.nombre} onChange={e => setFormAlumno({...formAlumno, nombre: e.target.value})} />
                <input type="text" placeholder="Apellido" required style={inputStyle} value={formAlumno.apellido} onChange={e => setFormAlumno({...formAlumno, apellido: e.target.value})} />
                <input type="text" placeholder="DNI (Único)" required style={inputStyle} value={formAlumno.dni} onChange={e => setFormAlumno({...formAlumno, dni: e.target.value})} />
                <input type="text" placeholder="WhatsApp" required style={inputStyle} value={formAlumno.telefono} onChange={e => setFormAlumno({...formAlumno, telefono: e.target.value})} />
              </div>

              <h4 style={{ color: '#ffffff', marginBottom: '8px', marginTop: '15px' }}>Asignar Clases</h4>
              <div style={{ maxHeight: '130px', overflowY: 'auto', backgroundColor: '#222', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
                {LISTA_CLASES_DEFAULT.map((c, idx) => (
                  <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', marginBottom: '6px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={clasesSeleccionadas.includes(c)} onChange={() => handleCheckboxClase(c)} />
                    {c}
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>Guardar Alumno</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const btnPrimary = { backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const btnEdit = { backgroundColor: '#333', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' };
const btnDelete = { backgroundColor: '#cc0033', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' };
const btnWsp = { backgroundColor: '#25D366', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' };
const btnCumple = { backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#181818', borderRadius: '10px', overflow: 'hidden' };
const thStyle = { padding: '14px 12px', fontSize: '13px' };
const tdStyle = { padding: '14px 12px', fontSize: '13px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#222', color: '#fff', boxSizing: 'border-box' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { backgroundColor: '#181818', padding: '30px', borderRadius: '12px', width: '500px', border: '1px solid #ff0055' };
const btnCancel = { backgroundColor: '#333', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer' };
const badgeStyle = (st) => ({ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: st === 'ACTIVO' ? '#00e5ff' : '#ff3366', color: '#000' });