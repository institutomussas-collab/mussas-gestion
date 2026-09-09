import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { 
  Plus, Search, Edit, Calculator, MessageCircle, Download, Calendar
} from 'lucide-react';

export default function Profesores() {
  const [profesores, setProfesores] = useState([]);
  const [clases, setClases] = useState([]);
  const [cobros, setCobros] = useState([]);
  
  const [busqueda, setBusqueda] = useState('');
  const [profesorSeleccionado, setProfesorSeleccionado] = useState(null);
  
  const [mesAnoLiquidacion, setMesAnoLiquidacion] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [modalAbierto, setModalAbierto] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', dni: '', telefono: '', disciplina: '',
    modalidad: 'Porcentaje', porcentaje: 50, valorHora: 0, observaciones: ''
  });

  useEffect(() => {
    fetchProfesores();
    fetchClases();
    fetchCobros();
  }, []);

  const fetchProfesores = async () => {
    try {
      const snap = await getDocs(collection(db, 'profesores'));
      setProfesores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const fetchClases = async () => {
    try {
      const snap = await getDocs(collection(db, 'clases'));
      setClases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const fetchCobros = async () => {
    try {
      const snap = await getDocs(collection(db, 'cobros'));
      setCobros(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitProfesor = async (e) => {
    e.preventDefault();
    try {
      if (profesorSeleccionado && modalAbierto) {
        await updateDoc(doc(db, 'profesores', profesorSeleccionado.id), formData);
      } else {
        await addDoc(collection(db, 'profesores'), formData);
      }
      cerrarModal();
      fetchProfesores();
    } catch (e) { console.error(e); }
  };

  const abrirModalEditar = (profesor) => {
    setProfesorSeleccionado(profesor);
    setFormData({
      nombre: profesor.nombre || '',
      apellido: profesor.apellido || '',
      dni: profesor.dni || '',
      telefono: profesor.telefono || '',
      disciplina: profesor.disciplina || '',
      modalidad: profesor.modalidad || 'Porcentaje',
      porcentaje: profesor.porcentaje || 50,
      valorHora: profesor.valorHora || 0,
      observaciones: profesor.observaciones || ''
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setProfesorSeleccionado(null);
    setFormData({
      nombre: '', apellido: '', dni: '', telefono: '', disciplina: '',
      modalidad: 'Porcentaje', porcentaje: 50, valorHora: 0, observaciones: ''
    });
  };

  const calcularLiquidacionProfesor = (profesor, mesAno) => {
    if (!profesor) return null;

    let recaudacionBrutaProrrateada = 0;
    let detalleImputaciones = [];

    cobros.forEach(c => {
      const esMismoMes = c.mesCuota === mesAno || c.fechaHora?.startsWith(mesAno);
      
      if (esMismoMes && c.imputacionProfesores && Array.isArray(c.imputacionProfesores)) {
        c.imputacionProfesores.forEach(imp => {
          if (imp.profesorId === profesor.id) {
            recaudacionBrutaProrrateada += imp.montoImputado || 0;
            detalleImputaciones.push({
              alumna: c.nombreAlumna,
              clase: imp.nombreClase,
              fecha: c.fechaFormateada,
              montoImputado: imp.montoImputado,
              horas: imp.horasMesClase
            });
          }
        });
      }
    });

    const clasesDelProfe = clases.filter(cl => cl.profesorId === profesor.id);
    let totalHorasDictadasMes = 0;

    const [year, month] = mesAno.split('-').map(Number);
    const totalDiasEnMes = new Date(year, month, 0).getDate();
    const diasSemanaNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    clasesDelProfe.forEach(c => {
      let numClases = 0;
      const duracion = c.duracionMinutos ? parseFloat(c.duracionMinutos) / 60 : 1;

      for (let dia = 1; dia <= totalDiasEnMes; dia++) {
        const fechaObj = new Date(year, month - 1, dia);
        if (c.dias && c.dias.includes(diasSemanaNombres[fechaObj.getDay()])) {
          numClases++;
        }
      }
      totalHorasDictadasMes += numClases * duracion;
    });

    let honorarioAbonar = 0;
    if (profesor.modalidad === 'ValorHora') {
      honorarioAbonar = totalHorasDictadasMes * (parseFloat(profesor.valorHora) || 0);
    } else {
      const pct = (parseFloat(profesor.porcentaje) || 50) / 100;
      honorarioAbonar = recaudacionBrutaProrrateada * pct;
    }

    return {
      recaudacionBrutaProrrateada,
      totalHorasDictadasMes,
      honorarioAbonar: Math.round(honorarioAbonar * 100) / 100,
      detalleImputaciones,
      comisionesAsignadas: clasesDelProfe
    };
  };

  const enviarLiquidacionWhatsApp = (profesor, liq) => {
    if (!profesor.telefono) return alert("El profesor no tiene teléfono cargado.");
    if (!liq) return;

    const numLimpio = profesor.telefono.replace(/\D/g, '');
    const mensaje = 
`🧾 *MUSSAS ESTUDIO DE DANZA*
*Resumen de Liquidación de Honorarios*
----------------------------------
👤 *Profesor/a:* ${profesor.nombre} ${profesor.apellido}
📅 *Periodo:* ${mesAnoLiquidacion}
📌 *Modalidad:* ${profesor.modalidad === 'Porcentaje' ? `${profesor.porcentaje}% s/ Recaudación` : `$${profesor.valorHora}/hora`}
----------------------------------
💰 *Recaudación Bruta Generada:* $${liq.recaudacionBrutaProrrateada.toLocaleString('es-AR')}
⏱️ *Horas Dictadas en Mes:* ${liq.totalHorasDictadasMes} hs
----------------------------------
💵 *HONORARIO A COBRAR:* $${liq.honorarioAbonar.toLocaleString('es-AR')}
----------------------------------
¡Cualquier duda consultanos en recepción! 🩰✨`;

    window.open(`https://api.whatsapp.com/send?phone=549${numLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const exportarLiquidacionExcel = (profesor, liq) => {
    if (!liq || liq.detalleImputaciones.length === 0) return alert("No hay datos de recaudación en el mes seleccionado.");

    const data = liq.detalleImputaciones.map(imp => ({
      Fecha: imp.fecha,
      Alumna: imp.alumna,
      Comisión: imp.clase,
      'Horas Mes': imp.horas,
      'Monto Imputado Base': imp.montoImputado
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detalle_Recaudacion");
    XLSX.writeFile(wb, `Liquidacion_${profesor.nombre}_${profesor.apellido}_${mesAnoLiquidacion}.xlsx`);
  };

  const profesoresFiltrados = profesores.filter(p => 
    `${p.nombre} ${p.apellido} ${p.disciplina}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const liquidacionActual = profesorSeleccionado 
    ? calcularLiquidacionProfesor(profesorSeleccionado, mesAnoLiquidacion) 
    : null;

  return (
    <div style={{ padding: '24px', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            🎓 Profesores & <span style={{ color: '#ff0055' }}>Honorarios</span>
          </h1>
          <p style={{ color: '#aaaaaa', margin: '4px 0 0 0', fontSize: '14px' }}>
            Cálculo de liquidaciones por porcentaje de recaudación o valor hora.
          </p>
        </div>

        <button 
          onClick={() => { setProfesorSeleccionado(null); setModalAbierto(true); }}
          style={{ backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(255, 0, 85, 0.3)' }}
        >
          <Plus size={18} /> Registrar Profesor
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input 
              type="text" 
              placeholder="Buscar profesor..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 40px', backgroundColor: '#181818', border: '1px solid #222', borderRadius: '8px', color: '#fff', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profesoresFiltrados.length === 0 ? (
              <div style={{ backgroundColor: '#121212', padding: '24px', borderRadius: '12px', border: '1px solid #222', textAlign: 'center', color: '#666' }}>
                No hay profesores registrados.
              </div>
            ) : (
              profesoresFiltrados.map(p => {
                const esSeleccionado = profesorSeleccionado?.id === p.id;
                return (
                  <div 
                    key={p.id} 
                    onClick={() => setProfesorSeleccionado(p)}
                    style={{ 
                      backgroundColor: '#121212', borderRadius: '12px', padding: '16px', 
                      border: esSeleccionado ? '2px solid #ff0055' : '1px solid #222222', 
                      cursor: 'pointer' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{p.nombre} {p.apellido}</h4>
                      <button onClick={(e) => { e.stopPropagation(); abrirModalEditar(p); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '2px' }}>
                        <Edit size={16} />
                      </button>
                    </div>

                    <div style={{ fontSize: '12px', color: '#00e5ff', marginTop: '4px' }}>{p.disciplina || 'Sin Disciplina'}</div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '6px' }}>
                      Modalidad: <strong style={{ color: '#fff' }}>{p.modalidad === 'Porcentaje' ? `${p.porcentaje}% Recaudación` : `$${p.valorHora}/hora`}</strong>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          {profesorSeleccionado && liquidacionActual ? (
            <div style={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #222222', padding: '24px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#ff0055', fontWeight: 'bold', textTransform: 'uppercase' }}>Panel de Liquidación</span>
                  <h2 style={{ margin: '2px 0 0 0', color: '#fff', fontSize: '24px' }}>
                    {profesorSeleccionado.nombre} {profesorSeleccionado.apellido}
                  </h2>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#181818', padding: '8px 12px', borderRadius: '8px', border: '1px solid #222' }}>
                    <Calendar size={16} color="#00e5ff" />
                    <input 
                      type="month" 
                      value={mesAnoLiquidacion} 
                      onChange={(e) => setMesAnoLiquidacion(e.target.value)}
                      style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', outline: 'none', fontWeight: 'bold' }}
                    />
                  </div>

                  <button 
                    onClick={() => enviarLiquidacionWhatsApp(profesorSeleccionado, liquidacionActual)}
                    title="Enviar resumen de liquidación por WhatsApp"
                    style={{ backgroundColor: '#25D36622', border: '1px solid #25D366', color: '#25D366', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </button>

                  <button 
                    onClick={() => exportarLiquidacionExcel(profesorSeleccionado, liquidacionActual)}
                    title="Exportar detalle a Excel"
                    style={{ backgroundColor: '#181818', color: '#00ff88', border: '1px solid #00ff88', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <Download size={16} /> Excel
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#181818', padding: '16px', borderRadius: '10px', border: '1px solid #222' }}>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Recaudación Bruta (Clases)</div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#00e5ff' }}>
                    ${liquidacionActual.recaudacionBrutaProrrateada.toLocaleString('es-AR')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Prorrateo neto de cuotas</div>
                </div>

                <div style={{ backgroundColor: '#181818', padding: '16px', borderRadius: '10px', border: '1px solid #222' }}>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Modalidad Acordada</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                    {profesorSeleccionado.modalidad === 'Porcentaje' ? `${profesorSeleccionado.porcentaje}% del Total` : `$${profesorSeleccionado.valorHora}/hora`}
                  </div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>{liquidacionActual.totalHorasDictadasMes} hs estimadas en mes</div>
                </div>

                <div style={{ backgroundColor: '#00ff8810', padding: '16px', borderRadius: '10px', border: '1px solid #00ff8844' }}>
                  <div style={{ fontSize: '12px', color: '#00ff88', marginBottom: '4px', fontWeight: 'bold' }}>Honorario a Liquidar</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff88' }}>
                    ${liquidacionActual.honorarioAbonar.toLocaleString('es-AR')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#00ff88aa', marginTop: '4px' }}>Monto final a pagar en mes</div>
                </div>
              </div>

              <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '12px' }}>
                Detalle de Cuotas Imputadas a este Profesor/a ({liquidacionActual.detalleImputaciones.length})
              </h4>

              <div style={{ backgroundColor: '#181818', borderRadius: '8px', border: '1px solid #222', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#121212', color: '#aaa', borderBottom: '1px solid #222' }}>
                      <th style={{ padding: '12px' }}>Fecha</th>
                      <th style={{ padding: '12px' }}>Alumna</th>
                      <th style={{ padding: '12px' }}>Comisión / Clase</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Monto Imputado Base</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liquidacionActual.detalleImputaciones.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                          No hay cobros registrados para las clases de este profesor en el mes seleccionado.
                        </td>
                      </tr>
                    ) : (
                      liquidacionActual.detalleImputaciones.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                          <td style={{ padding: '12px', color: '#aaa' }}>{item.fecha}</td>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#fff' }}>{item.alumna}</td>
                          <td style={{ padding: '12px', color: '#00e5ff' }}>{item.clase}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#00ff88' }}>
                            ${item.montoImputado?.toLocaleString('es-AR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            <div style={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #222222', padding: '48px', textAlign: 'center', color: '#666' }}>
              <Calculator size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <h3>Selecciona un profesor/a a la izquierda</h3>
              <p style={{ fontSize: '14px' }}>Para ver su panel de recaudación, horas y liquidación mensual de honorarios.</p>
            </div>
          )}
        </div>

      </div>

      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '20px' }}>
              {profesorSeleccionado ? 'Editar Profesor/a' : 'Registrar Nuevo Profesor/a'}
            </h2>

            <form onSubmit={handleSubmitProfesor}>
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
                  <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>WhatsApp / Teléfono</label>
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder="Ej: 1112345678" style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Disciplina Principal</label>
                  <input type="text" name="disciplina" value={formData.disciplina} onChange={handleInputChange} placeholder="Ej: Jazz, Danza Clásica" style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px', backgroundColor: '#181818', padding: '12px', borderRadius: '8px', border: '1px solid #222' }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '8px' }}>Modalidad de Liquidación</label>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                  <label style={{ color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="radio" name="modalidad" value="Porcentaje" checked={formData.modalidad === 'Porcentaje'} onChange={handleInputChange} /> Porcentaje sobre Recaudación
                  </label>
                  <label style={{ color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="radio" name="modalidad" value="ValorHora" checked={formData.modalidad === 'ValorHora'} onChange={handleInputChange} /> Valor Hora Fijo
                  </label>
                </div>

                {formData.modalidad === 'Porcentaje' ? (
                  <div>
                    <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Porcentaje del Profe (%)</label>
                    <input type="number" name="porcentaje" value={formData.porcentaje} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#121212', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Valor por Hora ($)</label>
                    <input type="number" name="valorHora" value={formData.valorHora} onChange={handleInputChange} style={{ width: '100%', padding: '10px', backgroundColor: '#121212', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" onClick={cerrarModal} style={{ backgroundColor: '#222', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Profesor</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
