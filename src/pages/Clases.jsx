import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { Plus, Download } from 'lucide-react';

export default function Clases() {
  const [clases, setClases] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  const [mesAnoSeleccionado, setMesAnoSeleccionado] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [asistenciasMes, setAsistenciasMes] = useState({});
  const [guardando, setGuardando] = useState(false);

  const [modalClaseAbierto, setModalClaseAbierto] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', profesorId: '', dias: [], horario: '', duracionMinutos: 60, cupoMaximo: 20, observaciones: ''
  });

  const diasSemanaNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  useEffect(() => {
    fetchClases();
    fetchAlumnos();
    fetchProfesores();
  }, []);

  useEffect(() => {
    if (claseSeleccionada) {
      fetchAsistenciasDelMes(claseSeleccionada.id, mesAnoSeleccionado);
    }
  }, [claseSeleccionada, mesAnoSeleccionado]);

  const fetchClases = async () => {
    try {
      const snap = await getDocs(collection(db, 'clases'));
      setClases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const fetchAlumnos = async () => {
    try {
      const snap = await getDocs(collection(db, 'alumnos'));
      setAlumnos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const fetchProfesores = async () => {
    try {
      const snap = await getDocs(collection(db, 'profesores'));
      setProfesores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const fetchAsistenciasDelMes = async (claseId, mesAno) => {
    try {
      const docRefId = `${claseId}_${mesAno}`;
      const snap = await getDocs(collection(db, 'asistencias_mensuales'));
      const docEncontrado = snap.docs.find(d => d.id === docRefId);
      
      if (docEncontrado) {
        setAsistenciasMes(docEncontrado.data().registros || {});
      } else {
        setAsistenciasMes({});
      }
    } catch (e) {
      console.error("Error cargando asistencias del mes:", e);
    }
  };

  const obtenerFechasDictado = () => {
    if (!claseSeleccionada || !claseSeleccionada.dias || claseSeleccionada.dias.length === 0) return [];

    const [year, month] = mesAnoSeleccionado.split('-').map(Number);
    const diasDictado = claseSeleccionada.dias;
    const totalDiasMes = new Date(year, month, 0).getDate();
    const fechas = [];

    for (let dia = 1; dia <= totalDiasMes; dia++) {
      const fechaObj = new Date(year, month - 1, dia);
      const nombreDiaSemana = diasSemanaNombres[fechaObj.getDay()];
      
      if (diasDictado.includes(nombreDiaSemana)) {
        const fechaStr = `${year}-${String(month).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        fechas.push({ fechaStr, diaNum: dia, nombreDia: nombreDiaSemana });
      }
    }
    return fechas;
  };

  const toggleAsistencia = (alumnoId, fechaStr) => {
    const key = `${alumnoId}_${fechaStr}`;
    const valorActual = asistenciasMes[key];

    let nuevoValor = 'P';
    if (valorActual === 'P') nuevoValor = 'A';
    else if (valorActual === 'A') nuevoValor = 'J';
    else if (valorActual === 'J') nuevoValor = null;

    setAsistenciasMes(prev => {
      const copia = { ...prev };
      if (nuevoValor === null) delete copia[key];
      else copia[key] = nuevoValor;
      return copia;
    });
  };

  const guardarAsistenciasMes = async () => {
    if (!claseSeleccionada) return;
    setGuardando(true);
    try {
      const docRefId = `${claseSeleccionada.id}_${mesAnoSeleccionado}`;
      await setDoc(doc(db, 'asistencias_mensuales', docRefId), {
        claseId: claseSeleccionada.id,
        mesAno: mesAnoSeleccionado,
        registros: asistenciasMes,
        ultimaActualizacion: new Date().toISOString()
      });
      alert("¡Asistencias del mes guardadas correctamente!");
    } catch (e) {
      console.error(e);
      alert("Error al guardar asistencias.");
    } finally {
      setGuardando(false);
    }
  };

  const exportarMatrizExcel = () => {
    if (!claseSeleccionada) return;
    const fechas = obtenerFechasDictado();
    const alumnasDeLaClase = alumnos.filter(a => a.clases && a.clases.includes(claseSeleccionada.id));

    if (alumnasDeLaClase.length === 0) return alert("No hay alumnas inscriptas.");

    const dataExportar = alumnasDeLaClase.map((a, idx) => {
      const fila = {
        Nro: idx + 1,
        Apellido: a.apellido || '',
        Nombre: a.nombre || '',
        DNI: a.dni || ''
      };

      let presentes = 0;
      let ausentes = 0;

      fechas.forEach(f => {
        const val = asistenciasMes[`${a.id}_${f.fechaStr}`] || '-';
        fila[`${f.diaNum}/${mesAnoSeleccionado.split('-')[1]}`] = val;
        if (val === 'P') presentes++;
        if (val === 'A') ausentes++;
      });

      fila['Total Presentes'] = presentes;
      fila['Total Ausentes'] = ausentes;

      return fila;
    });

    const ws = XLSX.utils.json_to_sheet(dataExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Asistencia_${mesAnoSeleccionado}`);
    XLSX.writeFile(wb, `Asistencia_${claseSeleccionada.nombre.replace(/\s+/g, '_')}_${mesAnoSeleccionado}.xlsx`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDiaToggle = (dia) => {
    setFormData(prev => {
      const existe = prev.dias.includes(dia);
      return {
        ...prev,
        dias: existe ? prev.dias.filter(d => d !== dia) : [...prev.dias, dia]
      };
    });
  };

  const handleSubmitClase = async (e) => {
    e.preventDefault();
    try {
      if (claseSeleccionada?.id && modalClaseAbierto) {
        await updateDoc(doc(db, 'clases', claseSeleccionada.id), formData);
      } else {
        await addDoc(collection(db, 'clases'), formData);
      }
      setModalClaseAbierto(false);
      fetchClases();
    } catch (e) { console.error(e); }
  };

  const fechasClaseMes = obtenerFechasDictado();
  const alumnasDeLaClase = alumnos.filter(a => a.clases && a.clases.includes(claseSeleccionada?.id));

  return (
    <div style={{ padding: '24px', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            📅 Clases & <span style={{ color: '#ff0055' }}>Asistencias Mensuales</span>
          </h1>
          <p style={{ color: '#aaaaaa', margin: '4px 0 0 0', fontSize: '14px' }}>
            Planilla de asistencia continua por calendario de cursada.
          </p>
        </div>

        <button 
          onClick={() => { setClaseSeleccionada(null); setModalClaseAbierto(true); }}
          style={{ backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Nueva Comisión
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', color: '#aaa', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
            Comisiones ({clases.length})
          </h3>

          {clases.map(c => {
            const profe = profesores.find(p => p.id === c.profesorId);
            const totalInscriptas = alumnos.filter(a => a.clases && a.clases.includes(c.id)).length;
            const esSeleccionada = claseSeleccionada?.id === c.id;

            return (
              <div 
                key={c.id} 
                onClick={() => setClaseSeleccionada(c)}
                style={{ 
                  backgroundColor: '#121212', borderRadius: '10px', padding: '14px', 
                  border: esSeleccionada ? '2px solid #ff0055' : '1px solid #222', 
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>{c.nombre}</div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
                  Profe: {profe ? profe.nombre : 'Sin asignar'}
                </div>
                <div style={{ fontSize: '12px', color: '#ff0055', marginTop: '2px' }}>
                  {c.dias?.join(', ')} ({c.horario || 'Sin hora'})
                </div>
                <div style={{ fontSize: '11px', color: '#00ff88', marginTop: '4px' }}>
                  {totalInscriptas} alumnas inscriptas
                </div>
              </div>
            );
          })}
        </div>

        <div>
          {claseSeleccionada ? (
            <div style={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #222', padding: '24px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, color: '#fff' }}>{claseSeleccionada.nombre}</h2>
                  <span style={{ fontSize: '13px', color: '#00e5ff' }}>
                    Días de cursada: {claseSeleccionada.dias?.join(', ')}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="month" 
                    value={mesAnoSeleccionado}
                    onChange={(e) => setMesAnoSeleccionado(e.target.value)}
                    style={{ backgroundColor: '#181818', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold' }}
                  />

                  <button 
                    onClick={exportarMatrizExcel}
                    style={{ backgroundColor: '#181818', color: '#00ff88', border: '1px solid #00ff88', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={15} /> Planilla Excel
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px', backgroundColor: '#181818', padding: '10px 14px', borderRadius: '8px', border: '1px solid #222' }}>
                <span style={{ color: '#aaa' }}>Hacer clic en la celda para rotar:</span>
                <span style={{ color: '#00ff88', fontWeight: 'bold' }}>P = Presente</span>
                <span style={{ color: '#ff4444', fontWeight: 'bold' }}>A = Ausente</span>
                <span style={{ color: '#00e5ff', fontWeight: 'bold' }}>J = Justificado</span>
                <span style={{ color: '#666' }}>S/R = Sin Registrar</span>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid #222', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#181818', color: '#aaa', borderBottom: '1px solid #222' }}>
                      <th style={{ padding: '12px', textAlign: 'left', minWidth: '180px', position: 'sticky', left: 0, backgroundColor: '#181818', zIndex: 2 }}>
                        Alumna
                      </th>
                      {fechasClaseMes.map(f => (
                        <th key={f.fechaStr} style={{ padding: '8px 12px', minWidth: '55px', borderLeft: '1px solid #222' }}>
                          <div style={{ fontSize: '11px', color: '#ff0055' }}>{f.nombreDia.substring(0, 3)}</div>
                          <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>{f.diaNum}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alumnasDeLaClase.length === 0 ? (
                      <tr>
                        <td colSpan={fechasClaseMes.length + 1} style={{ padding: '32px', color: '#666' }}>
                          No hay alumnas asignadas a esta comisión.
                        </td>
                      </tr>
                    ) : (
                      alumnasDeLaClase.map(al => (
                        <tr key={al.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                          <td style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#fff', position: 'sticky', left: 0, backgroundColor: '#121212', zIndex: 1, borderRight: '1px solid #222' }}>
                            {al.apellido}, {al.nombre}
                          </td>

                          {fechasClaseMes.map(f => {
                            const val = asistenciasMes[`${al.id}_${f.fechaStr}`];
                            
                            let colorBg = '#181818';
                            let colorText = '#444';
                            if (val === 'P') { colorBg = '#00ff8822'; colorText = '#00ff88'; }
                            if (val === 'A') { colorBg = '#ff444422'; colorText = '#ff4444'; }
                            if (val === 'J') { colorBg = '#00e5ff22'; colorText = '#00e5ff'; }

                            return (
                              <td 
                                key={f.fechaStr}
                                onClick={() => toggleAsistencia(al.id, f.fechaStr)}
                                style={{ 
                                  padding: '10px 4px', cursor: 'pointer', backgroundColor: colorBg, 
                                  color: colorText, fontWeight: 'bold', fontSize: '14px',
                                  borderLeft: '1px solid #222', userSelect: 'none'
                                }}
                              >
                                {val || '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {alumnasDeLaClase.length > 0 && (
                <button 
                  onClick={guardarAsistenciasMes}
                  disabled={guardando}
                  style={{ width: '100%', marginTop: '20px', backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {guardando ? 'Guardando...' : `💾 Guardar Asistencias de ${mesAnoSeleccionado}`}
                </button>
              )}

            </div>
          ) : (
            <div style={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #222', padding: '48px', textAlign: 'center', color: '#666' }}>
              <h3>Selecciona una comisión a la izquierda</h3>
              <p>Para ver el calendario del mes, tomar lista por fecha y exportar la planilla.</p>
            </div>
          )}
        </div>

      </div>

      {modalClaseAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#fff' }}>Crear / Editar Comisión</h2>
            <form onSubmit={handleSubmitClase}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Nombre *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '8px' }}>Días de Cursada *</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => (
                    <button type="button" key={d} onClick={() => handleDiaToggle(d)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: formData.dias.includes(d) ? '#ff0055' : '#181818', color: formData.dias.includes(d) ? '#fff' : '#aaa' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={() => setModalClaseAbierto(false)} style={{ backgroundColor: '#222', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
