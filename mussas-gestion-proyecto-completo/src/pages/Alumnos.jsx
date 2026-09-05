import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { enviarWspFichaSalud, enviarWspAvisoDeuda } from '../utils/whatsapp';
import { UserPlus, MessageCircle, AlertCircle, Search } from 'lucide-react';

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoAlumno, setNuevoAlumno] = useState({
    nombre: '', apellido: '', dni: '', telefono: '', email: '',
    fechaNacimiento: '', contactoEmergenciaNombre: '', contactoEmergenciaTel: '',
    observacionesMedicas: '', estado: 'ACTIVO'
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
      const docRef = await addDoc(collection(db, 'alumnos'), {
        ...nuevoAlumno,
        fechaAlta: new Date().toISOString()
      });
      setModalAbierto(false);
      enviarWspFichaSalud(nuevoAlumno.nombre, nuevoAlumno.telefono, docRef.id);
      cargarAlumnos();
      setNuevoAlumno({
        nombre: '', apellido: '', dni: '', telefono: '', email: '',
        fechaNacimiento: '', contactoEmergenciaNombre: '', contactoEmergenciaTel: '',
        observacionesMedicas: '', estado: 'ACTIVO'
      });
    } catch (error) {
      console.error("Error al guardar alumno:", error);
    }
  };

  const alumnosFiltrados = alumnos.filter(a => 
    `${a.nombre} ${a.apellido} ${a.dni}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Módulo 1: Gestión de Alumnos</h2>
        <button 
          onClick={() => setModalAbierto(true)}
          style={{ backgroundColor: '#e91e63', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={18} /> Nuevo Alumno
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', backgroundColor: '#f1f1f1', padding: '8px 12px', borderRadius: '5px' }}>
        <Search size={18} style={{ marginRight: '8px', color: '#666' }} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, apellido o DNI..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
        />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc', backgroundColor: '#fafafa' }}>
            <th style={{ padding: '10px' }}>Alumno</th>
            <th style={{ padding: '10px' }}>DNI</th>
            <th style={{ padding: '10px' }}>Teléfono</th>
            <th style={{ padding: '10px' }}>Estado</th>
            <th style={{ padding: '10px' }}>Observaciones Médicas</th>
            <th style={{ padding: '10px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {alumnosFiltrados.length === 0 ? (
            <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No hay alumnos registrados.</td></tr>
          ) : (
            alumnosFiltrados.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{a.nombre} {a.apellido}</td>
                <td style={{ padding: '10px' }}>{a.dni}</td>
                <td style={{ padding: '10px' }}>{a.telefono}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    backgroundColor: a.estado === 'ACTIVO' ? '#d4edda' : a.estado === 'EN_DEUDA' ? '#fff3cd' : '#f8d7da',
                    color: a.estado === 'ACTIVO' ? '#155724' : a.estado === 'EN_DEUDA' ? '#856404' : '#721c24'
                  }}>
                    {a.estado}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>{a.observacionesMedicas || 'Sin novedades'}</td>
                <td style={{ padding: '10px', display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => enviarWspFichaSalud(a.nombre, a.telefono, a.id)}
                    title="Reenviar Ficha de Salud"
                    style={{ backgroundColor: '#25D366', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <MessageCircle size={16} />
                  </button>
                  {a.estado === 'EN_DEUDA' && (
                    <button 
                      onClick={() => enviarWspAvisoDeuda(a.nombre, a.telefono, '0.00')}
                      title="Aviso de Deuda"
                      style={{ backgroundColor: '#ff9800', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <AlertCircle size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', width: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Registrar Nuevo Alumno</h3>
            <form onSubmit={guardarAlumno}>
              <input type="text" placeholder="Nombre" required style={inputStyle} value={nuevoAlumno.nombre} onChange={e => setNuevoAlumno({...nuevoAlumno, nombre: e.target.value})} />
              <input type="text" placeholder="Apellido" required style={inputStyle} value={nuevoAlumno.apellido} onChange={e => setNuevoAlumno({...nuevoAlumno, apellido: e.target.value})} />
              <input type="text" placeholder="DNI" required style={inputStyle} value={nuevoAlumno.dni} onChange={e => setNuevoAlumno({...nuevoAlumno, dni: e.target.value})} />
              <input type="text" placeholder="Teléfono / WhatsApp" required style={inputStyle} value={nuevoAlumno.telefono} onChange={e => setNuevoAlumno({...nuevoAlumno, telefono: e.target.value})} />
              <input type="email" placeholder="Correo Electrónico" style={inputStyle} value={nuevoAlumno.email} onChange={e => setNuevoAlumno({...nuevoAlumno, email: e.target.value})} />
              <input type="date" placeholder="Fecha de Nacimiento" style={inputStyle} value={nuevoAlumno.fechaNacimiento} onChange={e => setNuevoAlumno({...nuevoAlumno, fechaNacimiento: e.target.value})} />
              
              <h4>Contacto de Emergencia</h4>
              <input type="text" placeholder="Nombre de Contacto" style={inputStyle} value={nuevoAlumno.contactoEmergenciaNombre} onChange={e => setNuevoAlumno({...nuevoAlumno, contactoEmergenciaNombre: e.target.value})} />
              <input type="text" placeholder="Teléfono de Contacto" style={inputStyle} value={nuevoAlumno.contactoEmergenciaTel} onChange={e => setNuevoAlumno({...nuevoAlumno, contactoEmergenciaTel: e.target.value})} />

              <h4>Observaciones Médicas Iniciales</h4>
              <textarea placeholder="Alergias, lesiones, patologías..." style={{...inputStyle, height: '60px'}} value={nuevoAlumno.observacionesMedicas} onChange={e => setNuevoAlumno({...nuevoAlumno, observacionesMedicas: e.target.value})}></textarea>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setModalAbierto(false)} style={{ padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#e91e63', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Guardar y Enviar Ficha</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '8px',
  marginBottom: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  boxSizing: 'border-box'
};
