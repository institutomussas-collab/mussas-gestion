import React, { useState, useEffect, useRef } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { 
  UserPlus, Search, MessageCircle, Edit, 
  CheckCircle, XCircle, HeartPulse, CreditCard,
  Download, Upload, Database
} from 'lucide-react';
import { cargarDatosInicialesMussas } from '../utils/seedData';

const LINK_GOOGLE_FORM_SALUD = "https://forms.google.com/tu-formulario-de-salud";

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [clasesDisponibles, setClasesDisponibles] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('activas');
  const [cargandoImport, setCargandoImport] = useState(false);
  const [cargandoSeed, setCargandoSeed] = useState(false);
  
  const fileInputRef = useRef(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalBajaAbierto, setModalBajaAbierto] = useState(false);
  const [modalEstadoCuenta, setModalEstadoCuenta] = useState(false);
  
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState('');

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', dni: '', fechaNacimiento: '',
    telefonoAlumno: '', esMenor: false, nombreTutor: '', telefonoTutor: '',
    clases: [], estado: 'activa', observaciones: ''
  });

  useEffect(() => {
    fetchAlumnos();
    fetchClases();
  }, []);

  const fetchAlumnos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'alumnos'));
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumnos(docs);
    } catch (error) {
      console.error("Error cargando alumnas:", error);
    }
  };

  const fetchClases = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'clases'));
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasesDisponibles(docs);
    } catch (error) {
      console.error("Error cargando clases:", error);
    }
  };

  const handleEjecutarSeed = async () => {
    if (window.confirm("¿Deseas poblar la base de datos con las 22 comisiones y los 10 profesores de Mussas?")) {
      setCargandoSeed(true);
      await cargarDatosInicialesMussas();
      await fetchClases();
      setCargandoSeed(false);
    }
  };

  const handleImportarExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCargandoImport(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert("El archivo está vacío.");
          setCargandoImport(false);
          return;
        }

        const batch = writeBatch(db);
        const alumnosRef = collection(db, 'alumnos');

        data.forEach((row) => {
          const docRef = doc(alumnosRef);
          const nuevaAlumna = {
            nombre: row.Nombre || row.nombre || '',
            apellido: row.Apellido || row.apellido || '',
            dni: String(row.DNI || row.dni || row.Dni || ''),
            telefonoAlumno: String(row.Telefono || row.telefono || row.Celular || ''),
            esMenor: Boolean(row.EsMenor || row.esMenor || row.Tutor || row.tutor),
            nombreTutor: row.Tutor || row.tutor || row.NombreTutor || '',
            telefonoTutor: String(row.TelefonoTutor || row.telefonoTutor || ''),
            fechaNacimiento: row.FechaNacimiento || row.fechaNacimiento || '',
            estado: (row.Estado || row.estado || 'activa').toLowerCase(),
            clases: [],
            fechaAlta: new Date().toISOString()
          };
          batch.set(docRef, nuevaAlumna);
        });

        await batch.commit();
        alert(`¡Éxito! Se importaron ${data.length} alumnas correctamente.`);
        fetchAlumnos();
      } catch (error) {
        console.error("Error importando Excel:", error);
        alert("Ocurrió un error al procesar el archivo Excel.");
      } finally {
        setCargandoImport(false);
        e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleExportarExcel = () => {
    if (alumnos.length === 0) return alert("No hay alumnas registradas.");

    const dataExportar = alumnos.map(a => ({
      Apellido: a.apellido || '',
      Nombre: a.nombre || '',
      DNI: a.dni || '',
      'Es Menor': a.esMenor ? 'Sí' : 'No',
      'Nombre Tutor': a.nombreTutor || '',
      'Teléfono Tutor': a.telefonoTutor || '',
      'Teléfono Alumna': a.telefonoAlumno || '',
      Estado: a.estado || 'activa',
      'Fecha Nacimiento': a.fechaNacimiento || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExportar);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Alumnas Mussas");
    XLSX.writeFile(workbook, `Alumnas_Mussas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleClaseToggle = (claseId) => {
    setFormData(prev => {
      const existe = prev.clases.includes(claseId);
      return {
        ...prev,
        clases: existe ? prev.clases.filter(id => id !== claseId) : [...prev.clases, claseId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (alumnoSeleccionado) {
        const ref = doc(db, 'alumnos', alumnoSeleccionado.id);
        await updateDoc(ref, formData);
      } else {
        await addDoc(collection(db, 'alumnos'), {
          ...formData,
          fechaAlta: new Date().toISOString()
        });
      }
      cerrarModal();
      fetchAlumnos();
    } catch (error) {
      console.error("Error guardando alumna:", error);
    }
  };

  const abrirModalEditar = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setFormData({
      nombre: alumno.nombre || '',
      apellido: alumno.apellido || '',
      dni: alumno.dni || '',
      fechaNacimiento: alumno.fechaNacimiento || '',
      telefonoAlumno: alumno.telefonoAlumno || '',
      esMenor: alumno.esMenor || false,
      nombreTutor: alumno.nombreTutor || '',
      telefonoTutor: alumno.telefonoTutor || '',
      clases: alumno.clases || [],
      estado: alumno.estado || 'activa',
      observaciones: alumno.observaciones || ''
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setAlumnoSeleccionado(null);
    setFormData({
      nombre: '', apellido: '', dni: '', fechaNacimiento: '',
      telefonoAlumno: '', esMenor: false, nombreTutor: '', telefonoTutor: '',
      clases: [], estado: 'activa', observaciones: ''
    });
  };

  const procesarBajaOReactivacion = async () => {
    if (!alumnoSeleccionado) return;
    try {
      const ref = doc(db, 'alumnos', alumnoSeleccionado.id);
      const nuevoEstado = alumnoSeleccionado.estado === 'activa' ? 'inactiva' : 'activa';
      
      await updateDoc(ref, {
        estado: nuevoEstado,
        motivoBaja: nuevoEstado === 'inactiva' ? motivoBaja : '',
        fechaCambioEstado: new Date().toISOString()
      });

      setModalBajaAbierto(false);
      setMotivoBaja('');
      setAlumnoSeleccionado(null);
      fetchAlumnos();
    } catch (error) {
      console.error("Error cambiando estado:", error);
    }
  };

  const enviarWhatsApp = (numero, mensaje) => {
    if (!numero) return alert("No hay número registrado.");
    const numLimpio = numero.replace(/\D/g, '');
    window.open(`https://api.whatsapp.com/send?phone=549${numLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const enviarAvisoDeuda = (alumno) => {
    const destino = alumno.esMenor && alumno.telefonoTutor ? alumno.telefonoTutor : alumno.telefonoAlumno;
    const nombreContacto = alumno.esMenor ? alumno.nombreTutor : alumno.nombre;
    const mensaje = `Hola ${nombreContacto}! Te escribimos de Mussas Estudio de Danza 🩰. Te recordamos que se encuentra pendiente el pago de la cuota de ${alumno.nombre}. Podés abonar en recepción o por transferencia bancaria. ¡Muchas gracias!`;
    enviarWhatsApp(destino, mensaje);
  };

  const enviarFichaSalud = (alumno) => {
    const destino = alumno.esMenor && alumno.telefonoTutor ? alumno.telefonoTutor : alumno.telefonoAlumno;
    const mensaje = `Hola! Les recordamos desde Mussas que es requisito fundamental completar la Ficha Médica de Salud de ${alumno.nombre} para participar de las clases. Podés completarla en 2 minutos desde este enlace: ${LINK_GOOGLE_FORM_SALUD}`;
    enviarWhatsApp(destino, mensaje);
  };

  const alumnosFiltrados = alumnos.filter(a => {
    const coincideTexto = `${a.nombre} ${a.apellido} ${a.dni}`.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = 
      filtroEstado === 'todas' ? true :
      filtroEstado === 'activas' ? (a.estado === 'activa' || !a.estado) :
      a.estado === 'inactiva';
    return coincideTexto && coincideEstado;
  });

  return (
    <div style={{ padding: '24px', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            👥 Gestión de <span style={{ color: '#ff0055' }}>Alumnas</span>
          </h1>
          <p style={{ color: '#aaaaaa', margin: '4px 0 0 0', fontSize: '14px' }}>
            Listado general, fichas de salud e importación/exportación masiva.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          
          <input type="file" ref={fileInputRef} onChange={handleImportarExcel} accept=".xlsx, .xls, .csv" style={{ display: 'none' }} />

          <button 
            onClick={handleEjecutarSeed}
            disabled={cargandoSeed}
            style={{ backgroundColor: '#181818', color: '#ff0055', border: '1px solid #ff0055', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Database size={16} /> {cargandoSeed ? 'Cargando...' : 'Poblar Profes y Clases'}
          </button>

          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={cargandoImport}
            style={{ backgroundColor: '#181818', color: '#00e5ff', border: '1px solid #00e5ff', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Upload size={16} /> {cargandoImport ? 'Importando...' : 'Importar Excel'}
          </button>

          <button 
            onClick={handleExportarExcel}
            style={{ backgroundColor: '#181818', color: '#00ff88', border: '1px solid #00ff88', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={16} /> Exportar Excel
          </button>

          <button 
            onClick={() => { setAlumnoSeleccionado(null); setModalAbierto(true); }}
            style={{ backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(255, 0, 85, 0.3)' }}
          >
            <UserPlus size={16} /> Nueva Alumna
          </button>

        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input 
            type="text"
            placeholder="Buscar por Nombre, Apellido o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 40px', backgroundColor: '#181818', border: '1px solid #222222', borderRadius: '8px', color: '#fff', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', backgroundColor: '#181818', padding: '4px', borderRadius: '8px', border: '1px solid #222' }}>
          {[
            { id: 'activas', label: 'Activas' },
            { id: 'inactivas', label: 'Inactivas / Pausadas' },
            { id: 'todas', label: 'Todas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              style={{
                padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s',
                backgroundColor: filtroEstado === tab.id ? '#ff0055' : 'transparent',
                color: filtroEstado === tab.id ? '#ffffff' : '#aaaaaa'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #222222', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#181818', borderBottom: '1px solid #222222', color: '#aaaaaa' }}>
              <th style={{ padding: '16px' }}>Alumna</th>
              <th style={{ padding: '16px' }}>DNI</th>
              <th style={{ padding: '16px' }}>Contacto / Tutor</th>
              <th style={{ padding: '16px' }}>Clases</th>
              <th style={{ padding: '16px' }}>Estado</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Acciones & WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {alumnosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
                  No se encontraron alumnas.
                </td>
              </tr>
            ) : (
              alumnosFiltrados.map((a) => {
                const esActiva = a.estado !== 'inactiva';
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #1a1a1a', opacity: esActiva ? 1 : 0.6 }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#fff' }}>{a.apellido}, {a.nombre}</div>
                      {a.esMenor && (
                        <span style={{ fontSize: '11px', backgroundColor: '#00e5ff22', color: '#00e5ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #00e5ff44' }}>
                          Menor
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '16px', color: '#aaa' }}>{a.dni || '-'}</td>

                    <td style={{ padding: '16px' }}>
                      {a.esMenor ? (
                        <div>
                          <div style={{ fontSize: '12px', color: '#aaa' }}>Tutor: <strong style={{ color: '#fff' }}>{a.nombreTutor || 'Sin Nombre'}</strong></div>
                          <div style={{ fontSize: '13px', color: '#00e5ff' }}>{a.telefonoTutor || '-'}</div>
                        </div>
                      ) : (
                        <div style={{ color: '#00e5ff' }}>{a.telefonoAlumno || '-'}</div>
                      )}
                    </td>

                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {a.clases && a.clases.length > 0 ? (
                          a.clases.map(cId => {
                            const c = clasesDisponibles.find(cl => cl.id === cId);
                            return (
                              <span key={cId} style={{ backgroundColor: '#222', color: '#fff', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', border: '1px solid #333' }}>
                                {c ? c.nombre : 'Clase'}
                              </span>
                            );
                          })
                        ) : (
                          <span style={{ color: '#666', fontSize: '12px' }}>Sin asignación</span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '16px' }}>
                      {esActiva ? (
                        <span style={{ color: '#00ff88', backgroundColor: '#00ff8815', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                          Activa
                        </span>
                      ) : (
                        <div>
                          <span style={{ color: '#ff4444', backgroundColor: '#ff444415', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                            Inactiva
                          </span>
                          {a.motivoBaja && <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Motivo: {a.motivoBaja}</div>}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => enviarAvisoDeuda(a)} title="Enviar Recordatorio por WhatsApp" style={{ backgroundColor: '#25D36622', border: '1px solid #25D366', color: '#25D366', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                          <MessageCircle size={16} />
                        </button>

                        <button onClick={() => enviarFichaSalud(a)} title="Enviar Link de Ficha de Salud" style={{ backgroundColor: '#00e5ff22', border: '1px solid #00e5ff', color: '#00e5ff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                          <HeartPulse size={16} />
                        </button>

                        <button onClick={() => { setAlumnoSeleccionado(a); setModalEstadoCuenta(true); }} title="Ver Estado de Cuenta" style={{ backgroundColor: '#222', border: '1px solid #444', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                          <CreditCard size={16} />
                        </button>

                        <button onClick={() => abrirModalEditar(a)} title="Editar" style={{ backgroundColor: '#222', border: '1px solid #444', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                          <Edit size={16} />
                        </button>

                        <button onClick={() => { setAlumnoSeleccionado(a); setModalBajaAbierto(true); }} title={esActiva ? "Pausar / Dar de baja" : "Reactivar"} style={{ backgroundColor: esActiva ? '#ff444422' : '#00ff8822', border: `1px solid ${esActiva ? '#ff4444' : '#00ff88'}`, color: esActiva ? '#ff4444' : '#00ff88', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                          {esActiva ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '20px' }}>
              {alumnoSeleccionado ? 'Editar Ficha de Alumna' : 'Registrar Nueva Alumna'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Nombre *</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Apellido *</label>
                  <input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>DNI</label>
                  <input type="text" name="dni" value={formData.dni} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Fecha de Nacimiento</label>
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px', backgroundColor: '#181818', padding: '12px', borderRadius: '8px', border: '1px solid #222' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00e5ff', cursor: 'pointer', fontWeight: 'bold' }}>
                  <input type="checkbox" name="esMenor" checked={formData.esMenor} onChange={handleInputChange} />
                  ¿Es menor de edad? (Requiere datos de Tutor)
                </label>
              </div>

              {formData.esMenor ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', backgroundColor: '#181818', padding: '12px', borderRadius: '8px' }}>
                  <div>
                    <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Nombre Tutor/a</label>
                    <input type="text" name="nombreTutor" value={formData.nombreTutor} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#121212', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>WhatsApp Tutor/a</label>
                    <input type="text" name="telefonoTutor" value={formData.telefonoTutor} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#121212', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>WhatsApp Alumna</label>
                  <input type="text" name="telefonoAlumno" value={formData.telefonoAlumno} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '8px' }}>Asignar Clases</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '150px', overflowY: 'auto', backgroundColor: '#181818', padding: '12px', borderRadius: '8px', border: '1px solid #222' }}>
                  {clasesDisponibles.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#fff', cursor: 'pointer' }}>
                      <input type="checkbox" checked={formData.clases.includes(c.id)} onChange={() => handleClaseToggle(c.id)} />
                      {c.nombre}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={cerrarModal} style={{ backgroundColor: '#222', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalBajaAbierto && alumnoSeleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '450px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#fff' }}>
              {alumnoSeleccionado.estado === 'activa' ? 'Pausar / Dar de baja' : 'Reactivar Alumna'}
            </h3>
            {alumnoSeleccionado.estado === 'activa' ? (
              <>
                <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '16px' }}>
                  Indica el motivo de baja de <strong style={{ color: '#fff' }}>{alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido}</strong>:
                </p>
                <select value={motivoBaja} onChange={(e) => setMotivoBaja(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff', marginBottom: '20px' }}>
                  <option value="">Selecciona un motivo...</option>
                  <option value="Vacaciones">Vacaciones</option>
                  <option value="Horarios">Incompatibilidad de Horarios</option>
                  <option value="Económico">Razones Económicas</option>
                  <option value="Salud/Lesión">Salud / Lesión</option>
                  <option value="Cambio de Actividad">Cambio de Actividad</option>
                  <option value="Otro">Otro Motivo</option>
                </select>
              </>
            ) : (
              <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>
                ¿Deseas reactivar a <strong style={{ color: '#fff' }}>{alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido}</strong>?
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setModalBajaAbierto(false)} style={{ backgroundColor: '#222', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={procesarBajaOReactivacion} style={{ backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {modalEstadoCuenta && alumnoSeleccionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#fff' }}>💳 Estado de Cuenta Rápidito</h3>
            <p style={{ color: '#ff0055', fontWeight: 'bold', margin: '0 0 20px 0' }}>
              {alumnoSeleccionado.apellido}, {alumnoSeleccionado.nombre}
            </p>
            <div style={{ backgroundColor: '#181818', padding: '16px', borderRadius: '8px', border: '1px solid #222', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
                <span style={{ color: '#fff' }}>Cuota Mes En Curso:</span>
                <span style={{ color: '#00ff88', fontWeight: 'bold' }}>Consultar en Cobros</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: '#fff' }}>Matrícula Anual:</span>
                <span style={{ color: '#00e5ff', fontWeight: 'bold' }}>Registrada</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalEstadoCuenta(false)} style={{ backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
