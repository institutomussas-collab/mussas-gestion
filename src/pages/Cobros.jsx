import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { Download, PieChart, Landmark } from 'lucide-react';

export default function Cobros() {
  const [alumnos, setAlumnos] = useState([]);
  const [clases, setClases] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [historialCobros, setHistorialCobros] = useState([]);
  
  const [busqueda, setBusqueda] = useState('');
  const [alumnaSeleccionada, setAlumnaSeleccionada] = useState(null);

  const [concepto, setConcepto] = useState('Cuota Mensual');
  const [mesCuota, setMesCuota] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [montoBase, setMontoBase] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  const diasSemanaNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  useEffect(() => {
    fetchAlumnos();
    fetchClases();
    fetchProfesores();
    fetchHistorialCobros();
  }, []);

  const fetchAlumnos = async () => {
    try {
      const snap = await getDocs(collection(db, 'alumnos'));
      setAlumnos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const fetchClases = async () => {
    try {
      const snap = await getDocs(collection(db, 'clases'));
      setClases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const fetchProfesores = async () => {
    try {
      const snap = await getDocs(collection(db, 'profesores'));
      setProfesores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const fetchHistorialCobros = async () => {
    try {
      const snap = await getDocs(collection(db, 'cobros'));
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));
      setHistorialCobros(docs);
    } catch (e) { console.error(e); }
  };

  const handleConceptoChange = (nuevoConcepto) => {
    setConcepto(nuevoConcepto);
    if (nuevoConcepto === 'Profesorado de Danza Jazz') {
      setMontoBase('70000');
    } else if (nuevoConcepto === 'Adicional con Cande (Media Hora)') {
      setMontoBase('19000');
    }
  };

  const calcularProrrateoPorProfe = (alumna, montoBaseEfectivo, mesAno) => {
    if (!alumna || !alumna.clases || alumna.clases.length === 0 || montoBaseEfectivo <= 0) return [];

    const [year, month] = mesAno.split('-').map(Number);
    const totalDiasEnMes = new Date(year, month, 0).getDate();

    const clasesAlumna = clases.filter(c => alumna.clases.includes(c.id));
    if (clasesAlumna.length === 0) return [];

    let detalleClasesHoras = [];
    let horasTotalesAlumnaMes = 0;

    clasesAlumna.forEach(c => {
      let clasesEnElMesCount = 0;
      const duracionHoras = c.duracionMinutos ? parseFloat(c.duracionMinutos) / 60 : 1;

      for (let dia = 1; dia <= totalDiasEnMes; dia++) {
        const fechaObj = new Date(year, month - 1, dia);
        const nombreDiaSemana = diasSemanaNombres[fechaObj.getDay()];
        if (c.dias && c.dias.includes(nombreDiaSemana)) {
          clasesEnElMesCount++;
        }
      }

      const horasMesClase = clasesEnElMesCount * duracionHoras;
      horasTotalesAlumnaMes += horasMesClase;

      const profe = profesores.find(p => p.id === c.profesorId);

      detalleClasesHoras.push({
        claseId: c.id,
        nombreClase: c.nombre,
        profesorId: c.profesorId || 'sin_asignar',
        nombreProfesor: profe ? `${profe.nombre} ${profe.apellido}` : 'Sin Profe',
        horasMesClase,
        clasesCount: clasesEnElMesCount
      });
    });

    if (horasTotalesAlumnaMes === 0) return [];

    const valorPorHora = montoBaseEfectivo / horasTotalesAlumnaMes;

    return detalleClasesHoras.map(item => {
      const montoImputado = item.horasMesClase * valorPorHora;
      return {
        ...item,
        montoImputado: Math.round(montoImputado * 100) / 100,
        porcentajeDelTotal: Math.round((item.horasMesClase / horasTotalesAlumnaMes) * 100)
      };
    });
  };

  const subtotalEfectivo = parseFloat(montoBase) || 0;
  const recargoFinanciero = metodoPago === 'Transferencia' ? subtotalEfectivo * 0.04 : 0;
  const montoTotalCobrado = subtotalEfectivo + recargoFinanciero;

  const desloseProrrateo = concepto === 'Cuota Mensual' && alumnaSeleccionada 
    ? calcularProrrateoPorProfe(alumnaSeleccionada, subtotalEfectivo, mesCuota) 
    : [];

  const handleSeleccionarAlumna = (alumna) => {
    setAlumnaSeleccionada(alumna);
    setBusqueda('');
  };

  const handleRegistrarCobro = async (e) => {
    e.preventDefault();
    if (!alumnaSeleccionada) return alert("Por favor selecciona una alumna.");
    if (subtotalEfectivo <= 0) return alert("Ingresa un monto válido.");

    setGuardando(true);
    try {
      const nuevoCobro = {
        alumnoId: alumnaSeleccionada.id,
        nombreAlumna: `${alumnaSeleccionada.nombre} ${alumnaSeleccionada.apellido}`,
        dniAlumna: alumnaSeleccionada.dni || '',
        esMenor: alumnaSeleccionada.esMenor || false,
        nombreTutor: alumnaSeleccionada.nombreTutor || '',
        telefonoContacto: alumnaSeleccionada.esMenor && alumnaSeleccionada.telefonoTutor ? alumnaSeleccionada.telefonoTutor : alumnaSeleccionada.telefonoAlumno || '',
        concepto: concepto === 'Cuota Mensual' ? `Cuota Mensual (${mesCuota})` : concepto,
        mesCuota: concepto === 'Cuota Mensual' ? mesCuota : null,
        subtotalEfectivo,
        recargoFinanciero,
        montoTotalCobrado,
        metodoPago,
        observaciones,
        imputacionProfesores: desloseProrrateo,
        fechaHora: new Date().toISOString(),
        fechaFormateada: new Date().toLocaleDateString('es-AR'),
        horaFormateada: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      };

      await addDoc(collection(db, 'cobros'), nuevoCobro);

      alert("¡Cobro registrado! El recargo del 4% quedó aislado y la base de efectivo se prorrateó.");
      
      if (window.confirm("¿Deseas enviar el recibo digital por WhatsApp?")) {
        enviarReciboWhatsApp(nuevoCobro);
      }

      setAlumnaSeleccionada(null);
      setMontoBase('');
      setObservaciones('');
      fetchHistorialCobros();
    } catch (error) {
      console.error("Error guardando cobro:", error);
      alert("Error al registrar el cobro.");
    } finally {
      setGuardando(false);
    }
  };

  const enviarReciboWhatsApp = (cobro) => {
    if (!cobro.telefonoContacto) return alert("No hay teléfono de contacto.");
    const numLimpio = cobro.telefonoContacto.replace(/\D/g, '');

    const mensaje = 
`🧾 *MUSSAS ESTUDIO DE DANZA*
*Comprobante de Pago Digital*
----------------------------------
📅 *Fecha:* ${cobro.fechaFormateada} - ${cobro.horaFormateada}
👤 *Alumna:* ${cobro.nombreAlumna}
📌 *Concepto:* ${cobro.concepto}
💳 *Medio de Pago:* ${cobro.metodoPago}${cobro.recargoFinanciero > 0 ? ' (+4% Recargo)' : ''}
----------------------------------
💰 *TOTAL PAGADO:* $${cobro.montoTotalCobrado.toLocaleString('es-AR')}
----------------------------------
¡Muchas gracias por abonar a tiempo! 🩰✨`;

    window.open(`https://api.whatsapp.com/send?phone=549${numLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const exportarHistorialExcel = () => {
    if (historialCobros.length === 0) return alert("No hay cobros registrados.");

    const data = historialCobros.map(c => ({
      Fecha: c.fechaFormateada,
      Hora: c.horaFormateada,
      Alumna: c.nombreAlumna,
      Concepto: c.concepto,
      'Medio Pago': c.metodoPago,
      'Base Efectivo': c.subtotalEfectivo,
      'Recargo 4%': c.recargoFinanciero,
      'Total Cobrado': c.montoTotalCobrado
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial_Cobros");
    XLSX.writeFile(wb, `Cobros_Mussas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const alumnasFiltradas = busqueda.trim() === '' ? [] : alumnos.filter(a => 
    `${a.nombre} ${a.apellido} ${a.dni}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            💵 Cuentas & <span style={{ color: '#ff0055' }}>Cobros con Prorrateo</span>
          </h1>
          <p style={{ color: '#aaaaaa', margin: '4px 0 0 0', fontSize: '14px' }}>
            Imputación automática de cuotas hacia la liquidación de profesores por horas de clase.
          </p>
        </div>

        <button 
          onClick={exportarHistorialExcel}
          style={{ backgroundColor: '#181818', color: '#00ff88', border: '1px solid #00ff88', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={16} /> Exportar Cobros Excel
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        <div style={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #222222', padding: '24px' }}>
          
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>
              Buscar Alumna por Nombre, Apellido o DNI *
            </label>
            <input 
              type="text"
              placeholder="Escribe para buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
            />

            {alumnasFiltradas.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', maxHeight: '180px', overflowY: 'auto', zIndex: 10, marginTop: '4px' }}>
                {alumnasFiltradas.map(al => (
                  <div key={al.id} onClick={() => handleSeleccionarAlumna(al)} style={{ padding: '10px 14px', borderBottom: '1px solid #222', cursor: 'pointer' }}>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{al.apellido}, {al.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>DNI: {al.dni || '-'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {alumnaSeleccionada ? (
            <div style={{ backgroundColor: '#ff005510', border: '1px solid #ff005544', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#ff0055', fontWeight: 'bold' }}>ALUMNA SELECCIONADA</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>{alumnaSeleccionada.apellido}, {alumnaSeleccionada.nombre}</div>
              </div>
              <button onClick={() => setAlumnaSeleccionada(null)} style={{ backgroundColor: '#222', color: '#aaa', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Cambiar</button>
            </div>
          ) : (
            <div style={{ backgroundColor: '#181818', border: '1px dashed #333', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#666', marginBottom: '20px', fontSize: '13px' }}>
              Selecciona una alumna para calcular la imputación.
            </div>
          )}

          <form onSubmit={handleRegistrarCobro}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Concepto *</label>
                <select value={concepto} onChange={(e) => handleConceptoChange(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}>
                  <option value="Cuota Mensual">Cuota Mensual General</option>
                  <option value="Profesorado de Danza Jazz">Profesorado de Danza Jazz ($70.000 Efvo)</option>
                  <option value="Adicional con Cande (Media Hora)">Adicional con Cande ($19.000 Efvo)</option>
                  <option value="Matrícula Anual">Matrícula Anual</option>
                  <option value="Vestuario / Muestra">Vestuario / Muestra</option>
                  <option value="Indumentaria / Uniforme">Indumentaria / Uniforme</option>
                </select>
              </div>

              {concepto === 'Cuota Mensual' && (
                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Mes Cuota</label>
                  <input type="month" value={mesCuota} onChange={(e) => setMesCuota(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Monto Cuota Base ($) *</label>
                <input type="number" placeholder="0.00" value={montoBase} onChange={(e) => setMontoBase(e.target.value)} required style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '16px', fontWeight: 'bold' }} />
              </div>

              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Método de Pago *</label>
                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontWeight: 'bold' }}>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia (+4% Recargo)</option>
                </select>
              </div>
            </div>

            {desloseProrrateo.length > 0 && (
              <div style={{ backgroundColor: '#181818', border: '1px solid #00e5ff44', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#00e5ff', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PieChart size={16} /> Prorrateo Profesores (sobre Base Efectivo de ${subtotalEfectivo.toLocaleString('es-AR')}):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {desloseProrrateo.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#121212', padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}>
                      <div>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{item.nombreProfesor}</span>
                        <div style={{ fontSize: '11px', color: '#aaa' }}>{item.nombreClase} ({item.horasMesClase} hs/mes)</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#00ff88', fontWeight: 'bold' }}>${item.montoImputado.toLocaleString('es-AR')}</div>
                        <div style={{ fontSize: '10px', color: '#888' }}>{item.porcentajeDelTotal}% de la base</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ backgroundColor: '#181818', padding: '14px', borderRadius: '8px', border: '1px solid #222', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#aaa' }}>
                <span>Subtotal Base Efectivo (a Profesores):</span>
                <span>${subtotalEfectivo.toLocaleString('es-AR')}</span>
              </div>
              {metodoPago === 'Transferencia' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#00e5ff' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Landmark size={14} /> Recargo Financiero (Estudio Mussas):
                  </span>
                  <span>+${recargoFinanciero.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #333', fontSize: '18px', fontWeight: 'bold', color: '#00ff88' }}>
                <span>Total Abonado por Alumna:</span>
                <span>${montoTotalCobrado.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={guardando || !alumnaSeleccionada}
              style={{ width: '100%', backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', opacity: !alumnaSeleccionada ? 0.5 : 1 }}
            >
              {guardando ? 'Guardando...' : '💾 Registrar Cobro'}
            </button>

          </form>
        </div>

        <div>
          <h3 style={{ fontSize: '16px', color: '#aaa', margin: '0 0 16px 0', textTransform: 'uppercase' }}>
            Últimos Cobros e Imputaciones ({historialCobros.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '650px', overflowY: 'auto' }}>
            {historialCobros.map(c => (
              <div key={c.id} style={{ backgroundColor: '#121212', borderRadius: '10px', padding: '16px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>{c.nombreAlumna}</div>
                    <div style={{ fontSize: '12px', color: '#ff0055' }}>{c.concepto}</div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{c.fechaFormateada} - {c.metodoPago}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00ff88' }}>
                      ${c.montoTotalCobrado?.toLocaleString('es-AR')}
                    </div>
                    {c.recargoFinanciero > 0 && (
                      <div style={{ fontSize: '10px', color: '#00e5ff' }}>
                        Base: ${c.subtotalEfectivo} (+${c.recargoFinanciero} recargo)
                      </div>
                    )}
                  </div>
                </div>

                {c.imputacionProfesores && c.imputacionProfesores.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #222', fontSize: '11px' }}>
                    <div style={{ color: '#00e5ff', fontWeight: 'bold', marginBottom: '4px' }}>Prorrateo a Profesores:</div>
                    {c.imputacionProfesores.map((imp, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa' }}>
                        <span>• {imp.nombreProfesor} ({imp.nombreClase})</span>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>${imp.montoImputado?.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
