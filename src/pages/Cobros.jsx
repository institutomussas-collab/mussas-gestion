import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { enviarReciboWsp } from '../utils/whatsapp';
import { Send, History } from 'lucide-react';

export default function Cobros() {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState('');
  const [monto, setMonto] = useState(60000);
  const [concepto, setConcepto] = useState('Cuota Mensual');
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'alumnos'));
      const lista = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAlumnos(lista);
      if (lista.length > 0) setAlumnoSeleccionado(lista[0].id);
    } catch (error) {
      console.error("Error al cargar alumnos:", error);
    }
  };

  const montoFinal = metodo === 'TRANSFERENCIA' ? monto * 1.04 : monto;
  const objAlumno = alumnos.find(a => a.id === alumnoSeleccionado);

  const registrarPago = async (e) => {
    e.preventDefault();
    if (!objAlumno) return;

    try {
      await addDoc(collection(db, 'pagos'), {
        alumnoId: objAlumno.id,
        alumnoDni: objAlumno.dni,
        alumnoNombre: `${objAlumno.nombre} ${objAlumno.apellido}`,
        monto: montoFinal,
        concepto,
        metodo,
        notas,
        fecha: new Date().toISOString()
      });

      enviarReciboWsp(`${objAlumno.nombre} ${objAlumno.apellido}`, objAlumno.telefono, concepto, montoFinal);
    } catch (error) {
      console.error("Error al registrar pago:", error);
    }
  };

  return (
    <div>
      <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>Cuentas Corrientes & Registro de Cobros</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ backgroundColor: '#181818', padding: '20px', borderRadius: '10px', border: '1px solid #222' }}>
          <h3 style={{ color: '#ff0055', marginTop: 0 }}>Cargar Nuevo Pago</h3>
          <form onSubmit={registrarPago}>
            <label style={labelStyle}>Seleccionar Alumno (Por DNI / Nombre):</label>
            <select value={alumnoSeleccionado} onChange={e => setAlumnoSeleccionado(e.target.value)} style={inputStyle}>
              {alumnos.map(a => (
                <option key={a.id} value={a.id}>
                  DNI: {a.dni} - {a.nombre} {a.apellido}
                </option>
              ))}
            </select>

            <label style={labelStyle}>Concepto de Pago:</label>
            <select value={concepto} onChange={e => setConcepto(e.target.value)} style={inputStyle}>
              <option value="Cuota Mensual">Cuota Mensual</option>
              <option value="Vestuario / Muestra">Vestuario / Muestra Fin de Año</option>
              <option value="Indumentaria Mussas">Indumentaria / Uniforme Mussas</option>
              <option value="Inscripción Competencia">Inscripción a Competencia</option>
              <option value="Matrícula">Matrícula</option>
              <option value="Otros">Otros</option>
            </select>

            <label style={labelStyle}>Monto Base ($):</label>
            <input type="number" value={monto} onChange={e => setMonto(Number(e.target.value))} style={inputStyle} />

            <label style={labelStyle}>Método de Pago:</label>
            <select value={metodo} onChange={e => setMetodo(e.target.value)} style={inputStyle}>
              <option value="EFECTIVO">Efectivo (Sin recargo)</option>
              <option value="TRANSFERENCIA">Transferencia (+4% Recargo)</option>
            </select>

            {metodo === 'TRANSFERENCIA' && (
              <div style={{ padding: '10px', backgroundColor: '#112233', color: '#00e5ff', borderRadius: '5px', marginBottom: '15px' }}>
                Recargo del 4% aplicado. <strong>Total: ${montoFinal.toLocaleString()}</strong>
              </div>
            )}

            <label style={labelStyle}>Aclaraciones / Detalle:</label>
            <textarea placeholder="Ej. Señas $30.000, resta abonar la mitad..." value={notas} onChange={e => setNotas(e.target.value)} style={{...inputStyle, height: '50px'}}></textarea>

            <button type="submit" style={btnPrimary}><Send size={18}/> Registrar Pago y Enviar Recibo Wsp</button>
          </form>
        </div>

        <div style={{ backgroundColor: '#181818', padding: '20px', borderRadius: '10px', border: '1px solid #222' }}>
          <h3 style={{ color: '#00e5ff', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18}/> Estado de Cuenta Corriente
          </h3>
          {objAlumno ? (
            <div style={{ padding: '12px', backgroundColor: '#222222', borderRadius: '6px', marginBottom: '15px' }}>
              <strong>{objAlumno.nombre} {objAlumno.apellido}</strong> (DNI: {objAlumno.dni})
              <div style={{ fontSize: '12px', color: '#00e5ff', marginTop: '4px' }}>
                Clases Inscriptas: {objAlumno.clases ? objAlumno.clases.join(', ') : 'Ninguna'}
              </div>
            </div>
          ) : (
            <p style={{ color: '#aaa' }}>Cargando datos del alumno...</p>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '9px', marginBottom: '12px', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#222', color: '#fff', boxSizing: 'border-box' };
const labelStyle = { fontSize: '12px', color: '#ff0055', display: 'block', marginBottom: '4px' };
const btnPrimary = { backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' };