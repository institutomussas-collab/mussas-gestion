import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { 
  Lock, ArrowUpCircle, ArrowDownCircle, 
  Landmark, Calendar, Download, MessageCircle, Plus, CheckCircle
} from 'lucide-react';

export default function Caja() {
  const [fechaCaja, setFechaCaja] = useState(() => new Date().toISOString().split('T')[0]);
  const [cobrosDia, setCobrosDia] = useState([]);
  const [egresosDia, setEgresosDia] = useState([]);
  const [cajaCerrada, setCajaCerrada] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [efectivoContado, setEfectivoContado] = useState('');
  const [modalEgresoAbierto, setModalEgresoAbierto] = useState(false);
  const [formEgreso, setFormEgreso] = useState({
    monto: '',
    categoria: 'Insumos de Limpieza',
    concepto: '',
    comprobante: 'Ticket'
  });

  const categoriasEgresos = [
    'Insumos de Limpieza',
    'Mantenimiento / Reparaciones',
    'Artículos de Oficina / Impresiones',
    'Viáticos / Fletes',
    'Refrigerio / Agua',
    'Varios'
  ];

  useEffect(() => {
    fetchCobrosYEgresosDelDia(fechaCaja);
    fetchEstadoCaja(fechaCaja);
  }, [fechaCaja]);

  const fetchCobrosYEgresosDelDia = async (fecha) => {
    try {
      const snapCobros = await getDocs(collection(db, 'cobros'));
      const cobros = snapCobros.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.fechaFormateada === new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR') || c.fechaHora?.startsWith(fecha));
      setCobrosDia(cobros);

      const snapEgresos = await getDocs(collection(db, 'egresos'));
      const egresos = snapEgresos.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.fecha === fecha);
      setEgresosDia(egresos);
    } catch (e) {
      console.error("Error cargando datos del día:", e);
    }
  };

  const fetchEstadoCaja = async (fecha) => {
    try {
      const snap = await getDocs(collection(db, 'cajas_diarias'));
      const docCaja = snap.docs.find(d => d.id === fecha);
      if (docCaja) {
        const data = docCaja.data();
        setSaldoInicial(data.saldoInicial || 0);
        setEfectivoContado(data.efectivoContado || '');
        setCajaCerrada(data.cerrada || false);
      } else {
        setSaldoInicial(0);
        setEfectivoContado('');
        setCajaCerrada(false);
      }
    } catch (e) {
      console.error("Error cargando estado de caja:", e);
    }
  };

  const totalIngresosEfectivo = cobrosDia
    .filter(c => c.metodoPago === 'Efectivo')
    .reduce((acc, c) => acc + (c.subtotalEfectivo || c.subtotal || 0), 0);

  const totalIngresosTransferencia = cobrosDia
    .filter(c => c.metodoPago === 'Transferencia')
    .reduce((acc, c) => acc + (c.montoTotalCobrado || c.montoTotal || 0), 0);

  const totalEgresosEfectivo = egresosDia.reduce((acc, e) => acc + (parseFloat(e.monto) || 0), 0);

  const saldoEsperadoEfectivo = (parseFloat(saldoInicial) || 0) + totalIngresosEfectivo - totalEgresosEfectivo;
  const contadoNum = parseFloat(efectivoContado) || 0;
  const diferenciaArqueo = efectivoContado === '' ? 0 : contadoNum - saldoEsperadoEfectivo;

  const handleGuardarEgreso = async (e) => {
    e.preventDefault();
    if (!formEgreso.monto || parseFloat(formEgreso.monto) <= 0) return alert("Ingresa un monto válido.");

    try {
      const nuevoEgreso = {
        monto: parseFloat(formEgreso.monto),
        categoria: formEgreso.categoria,
        concepto: formEgreso.concepto || formEgreso.categoria,
        comprobante: formEgreso.comprobante,
        fecha: fechaCaja,
        fechaHora: new Date().toISOString(),
        horaFormateada: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      };

      await addDoc(collection(db, 'egresos'), nuevoEgreso);
      setModalEgresoAbierto(false);
      setFormEgreso({ monto: '', categoria: 'Insumos de Limpieza', concepto: '', comprobante: 'Ticket' });
      fetchCobrosYEgresosDelDia(fechaCaja);
    } catch (err) {
      console.error("Error guardando egreso:", err);
    }
  };

  const handleCerrarCaja = async () => {
    try {
      const docRef = doc(db, 'cajas_diarias', fechaCaja);
      await setDoc(docRef, {
        fecha: fechaCaja,
        saldoInicial: parseFloat(saldoInicial) || 0,
        totalIngresosEfectivo,
        totalIngresosTransferencia,
        totalEgresosEfectivo,
        saldoEsperadoEfectivo,
        efectivoContado: contadoNum,
        diferenciaArqueo,
        cerrada: true,
        fechaCierre: new Date().toISOString()
      });

      setCajaCerrada(true);
      alert("¡Caja del día guardada y cerrada correctamente!");
    } catch (e) {
      console.error("Error cerrando caja:", e);
    }
  };

  const enviarResumenWhatsApp = () => {
    const mensaje = 
`🔒 *MUSSAS - RESUMEN DE CAJA DIARIA*
📅 *Fecha:* ${fechaCaja}
----------------------------------
💵 *Saldo Inicial Efectivo:* $${saldoInicial.toLocaleString('es-AR')}
📥 *Ingresos Efectivo (Cobros):* +$${totalIngresosEfectivo.toLocaleString('es-AR')}
🏛️ *Ingresos Transferencias (Banco):* $${totalIngresosTransferencia.toLocaleString('es-AR')}
📤 *Egresos Mostrador (Gastos):* -$${totalEgresosEfectivo.toLocaleString('es-AR')}
----------------------------------
💰 *SALDO ESPERADO EN CAJÓN:* $${saldoEsperadoEfectivo.toLocaleString('es-AR')}
🔎 *EFECTIVO REAL CONTADO:* $${contadoNum.toLocaleString('es-AR')}
⚖️ *DIFERENCIA ARQUEO:* $${diferenciaArqueo.toLocaleString('es-AR')} ${diferenciaArqueo === 0 ? '✅ (Caja Exacta)' : diferenciaArqueo > 0 ? '🟢 (Sobrante)' : '🔴 (Faltante)'}
----------------------------------
¡Caja cerrada en mostrador! 🩰✨`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const exportarExcelCaja = () => {
    const dataResumen = [{
      Fecha: fechaCaja,
      'Saldo Inicial': saldoInicial,
      'Ingresos Efectivo': totalIngresosEfectivo,
      'Ingresos Transferencia': totalIngresosTransferencia,
      'Egresos Mostrador': totalEgresosEfectivo,
      'Saldo Esperado Cajón': saldoEsperadoEfectivo,
      'Efectivo Contado Real': contadoNum,
      'Diferencia Arqueo': diferenciaArqueo
    }];

    const dataEgresos = egresosDia.map(e => ({
      Hora: e.horaFormateada,
      Categoría: e.categoria,
      Concepto: e.concepto,
      Monto: e.monto,
      Comprobante: e.comprobante
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataResumen), "Resumen_Caja");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataEgresos), "Egresos_Detalle");
    XLSX.writeFile(wb, `Caja_Mussas_${fechaCaja}.xlsx`);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            🔒 Caja Diaria & <span style={{ color: '#ff0055' }}>Arqueo de Mostrador</span>
          </h1>
          <p style={{ color: '#aaaaaa', margin: '4px 0 0 0', fontSize: '14px' }}>
            Consolidación de efectivo, gastos de recepción y conciliación de cajón.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#181818', padding: '8px 12px', borderRadius: '8px', border: '1px solid #222' }}>
            <Calendar size={16} color="#00e5ff" />
            <input 
              type="date" 
              value={fechaCaja} 
              onChange={(e) => setFechaCaja(e.target.value)}
              style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', outline: 'none', fontWeight: 'bold' }}
            />
          </div>

          <button 
            onClick={enviarResumenWhatsApp}
            style={{ backgroundColor: '#25D36622', border: '1px solid #25D366', color: '#25D366', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <MessageCircle size={16} /> Enviar Reporte
          </button>

          <button 
            onClick={exportarExcelCaja}
            style={{ backgroundColor: '#181818', color: '#00ff88', border: '1px solid #00ff88', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '12px', border: '1px solid #222' }}>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Saldo Inicial Efectivo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', color: '#fff' }}>$</span>
            <input 
              type="number" 
              value={saldoInicial} 
              onChange={(e) => setSaldoInicial(parseFloat(e.target.value) || 0)}
              disabled={cajaCerrada}
              style={{ width: '100%', backgroundColor: '#181818', border: '1px solid #333', color: '#fff', fontSize: '18px', fontWeight: 'bold', borderRadius: '6px', padding: '4px 8px' }}
            />
          </div>
        </div>

        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '12px', border: '1px solid #00ff8833' }}>
          <div style={{ fontSize: '12px', color: '#00ff88', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpCircle size={14} /> Ingresos Efectivo (Cajón)
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#00ff88', marginTop: '4px' }}>
            +${totalIngresosEfectivo.toLocaleString('es-AR')}
          </div>
          <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{cobrosDia.filter(c => c.metodoPago === 'Efectivo').length} cobros en efectivo</div>
        </div>

        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '12px', border: '1px solid #00e5ff33' }}>
          <div style={{ fontSize: '12px', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Landmark size={14} /> Ingresos Transferencias (Banco)
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#00e5ff', marginTop: '4px' }}>
            ${totalIngresosTransferencia.toLocaleString('es-AR')}
          </div>
          <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{cobrosDia.filter(c => c.metodoPago === 'Transferencia').length} transferencias</div>
        </div>

        <div style={{ backgroundColor: '#121212', padding: '16px', borderRadius: '12px', border: '1px solid #ff444433' }}>
          <div style={{ fontSize: '12px', color: '#ff4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowDownCircle size={14} /> Egresos Mostrador
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ff4444', marginTop: '4px' }}>
            -${totalEgresosEfectivo.toLocaleString('es-AR')}
          </div>
          <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{egresosDia.length} gastos registrados</div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        <div style={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #222222', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock color="#ff0055" size={20} /> Conciliación del Cajón de Efectivo
          </h3>

          <div style={{ backgroundColor: '#181818', padding: '16px', borderRadius: '8px', border: '1px solid #222', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#aaa' }}>
              <span>Saldo Inicial:</span>
              <span>${saldoInicial.toLocaleString('es-AR')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#00ff88' }}>
              <span>(+) Ingresos en Efectivo:</span>
              <span>+${totalIngresosEfectivo.toLocaleString('es-AR')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#ff4444' }}>
              <span>(-) Gastos de Mostrador:</span>
              <span>-${totalEgresosEfectivo.toLocaleString('es-AR')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #333', fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
              <span>Saldo Esperado en Cajón:</span>
              <span style={{ color: '#00e5ff' }}>${saldoEsperadoEfectivo.toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '6px' }}>
              Dinero Físico Contado en el Cajón ($) *
            </label>
            <input 
              type="number" 
              placeholder="Ingresa cuánto contado hay en la caja..."
              value={efectivoContado}
              onChange={(e) => setEfectivoContado(e.target.value)}
              disabled={cajaCerrada}
              style={{ width: '100%', padding: '12px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}
            />
          </div>

          {efectivoContado !== '' && (
            <div style={{ 
              backgroundColor: diferenciaArqueo === 0 ? '#00ff8815' : diferenciaArqueo > 0 ? '#00e5ff15' : '#ff444415',
              border: `1px solid ${diferenciaArqueo === 0 ? '#00ff88' : diferenciaArqueo > 0 ? '#00e5ff' : '#ff4444'}`,
              padding: '16px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Resultado del Arqueo
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: diferenciaArqueo === 0 ? '#00ff88' : diferenciaArqueo > 0 ? '#00e5ff' : '#ff4444', margin: '4px 0' }}>
                ${diferenciaArqueo.toLocaleString('es-AR')}
              </div>
              <div style={{ fontSize: '13px', color: '#fff' }}>
                {diferenciaArqueo === 0 ? '✅ Caja Perfecta (Sin Diferencias)' : diferenciaArqueo > 0 ? '🟢 Sobrante de Caja' : '🔴 Faltante de Caja'}
              </div>
            </div>
          )}

          <button 
            onClick={handleCerrarCaja}
            disabled={cajaCerrada || efectivoContado === ''}
            style={{ 
              width: '100%', backgroundColor: cajaCerrada ? '#222' : '#ff0055', 
              color: cajaCerrada ? '#888' : '#fff', border: 'none', padding: '14px', 
              borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            {cajaCerrada ? <CheckCircle size={18} color="#00ff88" /> : <Lock size={18} />}
            {cajaCerrada ? 'Caja del Día Cerrada' : 'Guardar & Cerrar Caja del Día'}
          </button>

        </div>

        <div style={{ backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #222222', padding: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>
              Egresos / Gastos del Día ({egresosDia.length})
            </h3>

            <button 
              onClick={() => setModalEgresoAbierto(true)}
              disabled={cajaCerrada}
              style={{ backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} /> Cargar Egreso
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
            {egresosDia.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#666', backgroundColor: '#181818', borderRadius: '8px' }}>
                No hay gastos registrados en el mostrador para este día.
              </div>
            ) : (
              egresosDia.map(e => (
                <div key={e.id} style={{ backgroundColor: '#181818', padding: '12px 16px', borderRadius: '8px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>{e.concepto}</div>
                    <div style={{ fontSize: '11px', color: '#00e5ff', marginTop: '2px' }}>{e.categoria} ({e.comprobante})</div>
                    <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>{e.horaFormateada} hs</div>
                  </div>
                  <div style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '16px' }}>
                    -${parseFloat(e.monto)?.toLocaleString('es-AR')}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {modalEgresoAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '450px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Cargar Egreso de Mostrador</h3>

            <form onSubmit={handleGuardarEgreso}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Categoría *</label>
                <select 
                  value={formEgreso.categoria} 
                  onChange={(e) => setFormEgreso(prev => ({ ...prev, categoria: e.target.value }))}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
                >
                  {categoriasEgresos.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Monto ($) *</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={formEgreso.monto} 
                  onChange={(e) => setFormEgreso(prev => ({ ...prev, monto: e.target.value }))}
                  required 
                  style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '16px', fontWeight: 'bold' }} 
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Detalle / Concepto</label>
                <input 
                  type="text" 
                  placeholder="Ej: Compra de lavandina y trapos..." 
                  value={formEgreso.concepto} 
                  onChange={(e) => setFormEgreso(prev => ({ ...prev, concepto: e.target.value }))}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} 
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', marginBottom: '4px' }}>Comprobante</label>
                <select 
                  value={formEgreso.comprobante} 
                  onChange={(e) => setFormEgreso(prev => ({ ...prev, comprobante: e.target.value }))}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#181818', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}
                >
                  <option value="Ticket">Ticket / Factura B-C</option>
                  <option value="Recibo">Recibo Manual</option>
                  <option value="Sin Comprobante">Sin Comprobante</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setModalEgresoAbierto(false)} style={{ backgroundColor: '#222', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ backgroundColor: '#ff0055', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Guardar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
