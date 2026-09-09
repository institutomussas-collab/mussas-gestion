import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Plus, Search, Edit, Trash2, Phone } from 'lucide-react';

export default function Alumnas() {
  const [alumnas, setAlumnas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [alumnaEditando, setAlumnaEditando] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', dni: '', telefono: '', email: '',
    fechaNacimiento: '', estado: 'Activa', observaciones: ''
  });

  useEffect(() => { fetchAlumnas(); }, []);

  const fetchAlumnas = async () => {
    try {
      const snap = await getDocs(collection(db, 'alumnas'));
      setAlumnas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (alumnaEditando) {
        await updateDoc(doc(db, 'alumnas', alumnaEditando.id), formData);
      } else {
        await addDoc(collection(db, 'alumnas'), { ...formData, fechaAlta: new Date().toISOString() });
      }
      cerrarModal();
      fetchAlumnas();
    } catch (e) { console.error(e); }
  };

  const abrirModalEditar = (alumna) => {
    setAlumnaEditando(alumna);
    setFormData({
      nombre: alumna.nombre || '', apellido: alumna.apellido || '', dni: alumna.dni || '',
      telefono: alumna.telefono || '', email: alumna.email || '', fechaNacimiento: alumna.fechaNacimiento || '',
      estado: alumna.estado || 'Activa', observaciones: alumna.observaciones || ''
    });
    setModalAbierto(true);
  };

  const eliminarAlumna = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta alumna?")) {
      try {
        await deleteDoc(doc(db, 'alumnas', id));
        fetchAlumnas();
      } catch (e) { console.error(e); }
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setAlumnaEditando(null);
    setFormData({ nombre: '', apellido: '', dni: '', telefono: '', email: '', fechaNacimiento: '', estado: 'Activa', observaciones: '' });
  };

  const alumnasFiltradas = alumnas.filter(a => 
    `${a.nombre} ${a.apellido} ${a.dni}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            🩰 Alumnas & <span style={{ color: '#ff0055' }}>Matrícula</span>
          </h1>
          <p style={{ color: '#aaa', margin: '4px 0 0 0', fontSize: '14px' }}>Gestión de datos personales y fichas de alumnas.</p>
        </div>
        <button onClick={() => { setAlumnaEditando(null); setModalAbierto(true); }} style={btnPrimary}>
          <Plus size={18} /> Nueva Alumna
        </button>
      </div>

      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, apellido o DNI..." 
          value={busqueda} 
          onChange={e => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '12px 12px 12px 40px', backgroundColor: '#121212', border: '1px solid #222', borderRadius: '8px', color: '#fff', outline: 'none' }}
        />
      </div>

      <div style={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #222', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#181818', color: '#aaa', borderBottom: '1px solid #222' }}>
              <th style={{ padding: '14px' }}>Alumna</th>
              <th style={{ padding: '14px' }}>DNI</th>
              <th style={{ padding: '14px' }}>Contacto</th>
              <th style={{ padding: '14px' }}>Estado</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {alumnasFiltradas.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#666' }}>No se encontraron alumnas.</td></tr>
            ) : (
              alumnasFiltradas.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '14px', fontWeight: 'bold', color: '#fff' }}>{a.nombre} {a.apellido}</td>
                  <td style={{ padding: '14px', color: '#aaa' }}>{a.dni || '-'}</td>
                  <td style={{ padding: '14px', color: '#aaa' }}>
                    {a.telefono && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} color="#00e5ff" /> {a.telefono}</span>}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span style={{ backgroundColor: a.estado === 'Activa' ? '#00ff8820' : '#ff444420', color: a.estado === 'Activa' ? '#00ff88' : '#ff4444', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                      {a.estado}
                    </span>
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <button onClick={() => abrirModalEditar(a)} style={{ background: 'none', border: 'none', color: '#00e5ff', cursor: 'pointer', marginRight: '12px' }}><Edit size={16} /></button>
                    <button onClick={() => eliminarAlumna(a.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{ margin: '0 0 20px 0', color: '#fff' }}>{alumnaEditando ? 'Editar Alumna' : 'Nueva Alumna'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleInputChange} required style={inputStyle} />
                <input type="text" name="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleInputChange} required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <input type="text" name="dni" placeholder="DNI" value={formData.dni} onChange={handleInputChange} style={inputStyle} />
                <input type="text" name="telefono" placeholder="WhatsApp / Teléfono" value={formData.telefono} onChange={handleInputChange} style={inputStyle} />
              </div>
              <input type="email" name="email" placeholder="Correo Electrónico" value={formData.email} onChange={handleInputChange} style={inputStyle} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={cerrarModal} style={btnCancel}>Cancelar</button>
                <button type="submit" style={btnPrimary}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const btnPrimary = { backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' };
const btnCancel = { backgroundColor: '#222', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer' };
const inputStyle = { width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContent = { backgroundColor: '#121212', padding: '24px', borderRadius: '12px', border: '1px solid #222', width: '100%', maxWidth: '500px' };
