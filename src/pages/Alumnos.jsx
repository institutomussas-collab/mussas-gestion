import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { enviarWspFichaSalud, enviarWspAvisoDeuda, enviarWspCumple } from '../utils/whatsapp';
import { UserPlus, MessageCircle, AlertCircle, Search, Gift, MapPin } from 'lucide-react';

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoAlumno, setNuevoAlumno] = useState({
    nombre: '', apellido: '', dni: '', telefono: '', email: '', direccion: '',
    fechaNacimiento: '', fechaAlta: new Date().toISOString().split('T')[0], fechaBaja: '',
    contactoEmergenciaNombre: '', contactoEmergenciaTel: '', observacionesMedicas: '', estado: 'ACTIVO'
  });

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'alumnos'));
      const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumnos(lista);
    } catch (error) {
      console.error("Error al cargar alumnos:", error);
    }
  };

  const guardarAlumno = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'alumnos'), nuevoAlumno);
      setModalAbierto(false);
      enviarWspFichaSalud(nuevoAlumno.nombre, nuevoAlumno.telefono, nuevoAlumno.dni);
      cargarAlumnos();
    } catch (error) {
      console.error("Error al guardar alumno:", error);
    }
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    const parts = fechaStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return fechaStr;
  };

  const esCumpleaniosHoy = (fechaNac) => {
    if (!fechaNac) return false;
    const hoy = new Date();
    const [year, month, day] = fechaNac.split('-');
    return hoy.getDate() === parseInt(day) && (hoy.getMonth() + 1) === parseInt(month);
  };

  const alumnosFiltrados = alumnos.filter(a => 
    `${a.nombre} ${a.apellido} ${a.dni}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      {/* Alerta de Cumpleaños */}
      <div style={{ backgroundColor: '#26a69a', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#00251a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Gift size={22} color="#e91e63" />
          <strong>Cumpleaños de Hoy:</strong> {alumnos.filter(a => esCumpleaniosHoy(a.fechaNacimiento)).length > 0 ? alumnos.filter(a => esCumpleaniosHoy(a.fechaNacimiento)).map(a => `${a.nombre} ${a.apellido}`).join(', ') : 'No hay cumpleaños hoy.'}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#00bfa5' }}>Gestión de Alumnos & Fichas</h2>
        <button onClick={() => setModalAbierto(true)} style={btnPrimary}>
          <UserPlus size={18} /> Nuevo Alumno
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', backgroundColor: '#242424', padding: '10px 15px', borderRadius: '6px', border: '1px solid #333' }}>
        <Search size={18} style={{ marginRight: '10px', color: '#888' }} />
        <input type="text" placeholder="Buscar por nombre, apellido o DNI..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', color: '#fff', width: '100%' }} />
      </div>

      <table style={tableStyle}>
        <thead>
          <tr style={{ borderBottom: '2px solid #004d40', backgroundColor: '#1e1e1e', color: '#00bfa5' }}>
            <th style={thStyle}>Alumno</th>
            <th style={thStyle}>DNI</th>
            <th style={thStyle}>F. Nacimiento</th>
            <th style={thStyle}>F. Alta</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Observaciones Médicas</th>
            <th style={thStyle}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {alumnosFiltrados.map((a) => (
            <tr key={a.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
              <td style={tdStyle}>
                <strong>{a.nombre} {a.apellido}</strong>
                <div style={{ fontSize: '11px', color: '#888' }}><MapPin size={10}/> {a.direccion || 'Alsina'}</div>
              </td>
              <td style={tdStyle}>{a.dni}</td>
              <td style={tdStyle}>{formatearFecha(a.fechaNacimiento)}</td>
              <td style={tdStyle}>{formatearFecha(a.fechaAlta)}</td>
              <td style={tdStyle}>
                <span style={badgeStyle(a.estado)}>{a.estado}</span>
              </td>
              <td style={tdStyle}>{a.observacionesMedicas || 'Sin novedades'}</td>
              <td style={{ ...tdStyle, display: 'flex', gap: '6px' }}>
                <button onClick={() => enviarWspFichaSalud(a.nombre, a.telefono, a.dni)} title="Enviar Ficha Google Form" style={btnWsp}><MessageCircle size={15}/></button>
                <button onClick={() => enviarWspCumple(a.nombre, a.telefono)} title="Saludar Cumpleaños" style={btnCumple}><Gift size={15}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalAbierto && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ color: '#00bfa5', marginTop: 0 }}>Registrar Nuevo Alumno</h3>
            <form onSubmit={guardarAlumno}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="text" placeholder="Nombre" required style={inputStyle} value={nuevoAlumno.nombre} onChange={e => setNuevoAlumno({...nuevoAlumno, nombre: e.target.value})} />
                <input type="text" placeholder="Apellido" required style={inputStyle} value={nuevoAlumno.apellido} onChange={e => setNuevoAlumno({...nuevoAlumno, apellido: e.target.value})} />
                <input type="text" placeholder="DNI" required style={inputStyle} value={nuevoAlumno.dni} onChange={e => setNuevoAlumno({...nuevoAlumno, dni: e.target.value})} />
                <input type="text" placeholder="Teléfono / WhatsApp" required style={inputStyle} value={nuevoAlumno.telefono} onChange={e => setNuevoAlumno({...nuevoAlumno, telefono: e.target.value})} />
                <input type="text" placeholder="Dirección (Alsina)" style={inputStyle} value={nuevoAlumno.direccion} onChange={e => setNuevoAlumno({...nuevoAlumno, direccion: e.target.value})} />
                <input type="email" placeholder="Correo Electrónico" style={inputStyle} value={nuevoAlumno.email} onChange={e => setNuevoAlumno({...nuevoAlumno, email: e.target.value})} />
                <div>
                  <label style={labelStyle}>Fecha de Nacimiento:</label>
                  <input type="date" style={inputStyle} value={nuevoAlumno.fechaNacimiento} onChange={e => setNuevoAlumno({...nuevoAlumno, fechaNacimiento: e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Fecha de Alta:</label>
                  <input type="date" style={inputStyle} value={nuevoAlumno.fechaAlta} onChange={e => setNuevoAlumno({...nuevoAlumno, fechaAlta: e.target.value})} />
                </div>
              </div>
              <h4>Contacto de Emergencia</h4>
              <input type="text" placeholder="Nombre" style={inputStyle} value={nuevoAlumno.contactoEmergenciaNombre} onChange={e => setNuevoAlumno({...nuevoAlumno, contactoEmergenciaNombre: e.target.value})} />
              <input type="text" placeholder="Teléfono" style={inputStyle} value={nuevoAlumno.contactoEmergenciaTel} onChange={e => setNuevoAlumno({...nuevoAlumno, contactoEmergenciaTel: e.target.value})} />
              <textarea placeholder="Observaciones Médicas Iniciales" style={{...inputStyle, height: '50px'}} value={nuevoAlumno.observacionesMedicas} onChange={e => setNuevoAlumno({...nuevoAlumno, observacionesMedicas: e.target.value})}></textarea>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>Guardar y Enviar Ficha</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const btnPrimary = { backgroundColor: '#e91e63', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' };
const btnWsp = { backgroundColor: '#25D366', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' };
const btnCumple = { backgroundColor: '#e91e63', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#1e1e1e', borderRadius: '8px', overflow: 'hidden' };
const thStyle = { padding: '12px 10px', fontSize: '13px' };
const tdStyle = { padding: '12px 10px', fontSize: '13px' };
const inputStyle = { width: '100%', padding: '9px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#282828', color: '#fff', boxSizing: 'border-box' };
const labelStyle = { fontSize: '11px', color: '#00bfa5', display: 'block', marginBottom: '2px' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '10px', width: '500px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #004d40' };
const btnCancel = { backgroundColor: '#444', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' };
const badgeStyle = (st) => ({ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: st === 'ACTIVO' ? '#004d40' : st === 'EN_DEUDA' ? '#ff6f00' : '#b71c1c', color: '#fff' });
