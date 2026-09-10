import React, { useEffect, useMemo, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore'
import {
  Plus,
  Trash2,
  Download,
  MessageCircle,
  Lock,
  Banknote,
  CreditCard,
  Receipt,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { db } from '../config/firebase'
import { COLORS, S, fmtMoney, todayISO } from '../theme'

const CATEGORIAS_EGRESO = ['Insumos de Limpieza', 'Mantenimiento', 'Viáticos', 'Papelería', 'Cadetería', 'Otros']

export default function Caja() {
  const [fecha, setFecha] = useState(todayISO())
  const [cobrosDia, setCobrosDia] = useState([])
  const [egresosDia, setEgresosDia] = useState([])
  const [saldoInicial, setSaldoInicial] = useState('')
  const [efectivoContado, setEfectivoContado] = useState('')
  const [egresoForm, setEgresoForm] = useState({ categoria: CATEGORIAS_EGRESO[0], monto: '', descripcion: '' })
  const [cerrando, setCerrando] = useState(false)
  const [cierreGuardado, setCierreGuardado] = useState(false)

  useEffect(() => {
    setCierreGuardado(false)
    const q1 = query(collection(db, 'cobros'), where('fecha', '==', fecha))
    const unsub1 = onSnapshot(q1, (snap) => setCobrosDia(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    const q2 = query(collection(db, 'egresos'), where('fecha', '==', fecha))
    const unsub2 = onSnapshot(q2, (snap) => setEgresosDia(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => { unsub1(); unsub2() }
  }, [fecha])

  const ingresosEfectivo = useMemo(() => cobrosDia.filter((c) => c.metodoPago === 'Efectivo').reduce((s, c) => s + Number(c.monto || 0), 0), [cobrosDia])
  const ingresosTransferencia = useMemo(() => cobrosDia.filter((c) => c.metodoPago === 'Transferencia').reduce((s, c) => s + Number(c.monto || 0), 0), [cobrosDia])
  const egresosTotal = useMemo(() => egresosDia.reduce((s, e) => s + Number(e.monto || 0), 0), [egresosDia])

  const saldoEsperadoEfectivo = (Number(saldoInicial) || 0) + ingresosEfectivo - egresosTotal
  const diferencia = (Number(efectivoContado) || 0) - saldoEsperadoEfectivo
  const contoTouched = efectivoContado !== ''

  async function handleAddEgreso(e) {
    e.preventDefault()
    if (!egresoForm.monto) return
    await addDoc(collection(db, 'egresos'), {
      ...egresoForm,
      monto: Number(egresoForm.monto) || 0,
      fecha,
      createdAt: serverTimestamp(),
    })
    setEgresoForm({ categoria: CATEGORIAS_EGRESO[0], monto: '', descripcion: '' })
  }

  async function handleDeleteEgreso(id) {
    if (!confirm('¿Eliminar este egreso?')) return
    await deleteDoc(doc(db, 'egresos', id))
  }

  async function handleCerrarCaja() {
    if (efectivoContado === '') {
      alert('Cargá el efectivo contado antes de cerrar la caja.')
      return
    }
    if (!confirm('¿Confirmás el cierre de caja del día? Esta acción registra el arqueo en Firestore.')) return
    setCerrando(true)
    try {
      await addDoc(collection(db, 'cajas_diarias'), {
        fecha,
        saldoInicial: Number(saldoInicial) || 0,
        ingresosEfectivo,
        ingresosTransferencia,
        egresosTotal,
        saldoEsperadoEfectivo,
        efectivoContado: Number(efectivoContado) || 0,
        diferencia,
        createdAt: serverTimestamp(),
      })
      setCierreGuardado(true)
    } catch (err) {
      alert('Error al cerrar caja: ' + err.message)
    } finally {
      setCerrando(false)
    }
  }

  function exportarExcel() {
    const wb = XLSX.utils.book_new()
    const resumen = [{
      Fecha: fecha,
      'Saldo inicial': Number(saldoInicial) || 0,
      'Ingresos efectivo': ingresosEfectivo,
      'Ingresos transferencia': ingresosTransferencia,
      'Egresos totales': egresosTotal,
      'Saldo esperado efectivo': saldoEsperadoEfectivo,
      'Efectivo contado': Number(efectivoContado) || 0,
      Diferencia: diferencia,
    }]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(egresosDia.map((e) => ({ Categoría: e.categoria, Descripción: e.descripcion, Monto: e.monto }))), 'Egresos')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cobrosDia.map((c) => ({ Alumna: c.alumnaNombre, Método: c.metodoPago, Monto: c.monto }))), 'Cobros')
    XLSX.writeFile(wb, `Caja_${fecha}.xlsx`)
  }

  function reporteWhatsapp() {
    const estadoArqueo = diferencia === 0 ? 'Caja exacta ✅' : diferencia > 0 ? `Sobrante de ${fmtMoney(diferencia)} 🔺` : `Faltante de ${fmtMoney(Math.abs(diferencia))} 🔻`
    const texto = `*Arqueo de Caja — Mussas Estudio*\n📅 ${fecha}\n\n` +
      `Saldo inicial: ${fmtMoney(saldoInicial)}\n` +
      `Ingresos efectivo: ${fmtMoney(ingresosEfectivo)}\n` +
      `Ingresos transferencia: ${fmtMoney(ingresosTransferencia)}\n` +
      `Egresos: ${fmtMoney(egresosTotal)}\n` +
      `Saldo esperado en efectivo: ${fmtMoney(saldoEsperadoEfectivo)}\n` +
      `Efectivo contado: ${fmtMoney(efectivoContado)}\n\n` +
      `${estadoArqueo}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  return (
    <div style={S.page}>
      <h1 style={S.pageTitle}>Caja</h1>
      <p style={S.pageSubtitle}>Arqueo y conciliación diaria de mostrador.</p>

      <div style={S.toolbar}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ ...S.label, marginBottom: 0 }}>Fecha:</label>
          <input type="date" style={{ ...S.input, width: 170 }} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={S.btnSecondary} onClick={exportarExcel}><Download size={16} /> Excel</button>
          <button style={S.btnSecondary} onClick={reporteWhatsapp}><MessageCircle size={16} color={COLORS.green} /> Reporte WhatsApp</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 22 }}>
        <div style={S.kpiCard}>
          <span style={S.kpiLabel}><Banknote size={12} style={{ verticalAlign: -1 }} /> Ingresos efectivo</span>
          <span style={S.kpiValue}>{fmtMoney(ingresosEfectivo)}</span>
        </div>
        <div style={S.kpiCard}>
          <span style={S.kpiLabel}><CreditCard size={12} style={{ verticalAlign: -1 }} /> Ingresos transferencia</span>
          <span style={S.kpiValue}>{fmtMoney(ingresosTransferencia)}</span>
        </div>
        <div style={S.kpiCard}>
          <span style={S.kpiLabel}><Receipt size={12} style={{ verticalAlign: -1 }} /> Egresos del día</span>
          <span style={{ ...S.kpiValue, color: COLORS.red }}>{fmtMoney(egresosTotal)}</span>
        </div>
        <div style={S.kpiCard}>
          <span style={S.kpiLabel}>Saldo esperado efectivo</span>
          <span style={{ ...S.kpiValue, color: COLORS.accent }}>{fmtMoney(saldoEsperadoEfectivo)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Arqueo */}
        <div style={S.card}>
          <h3 style={{ marginTop: 0, fontSize: 15.5 }}>Arqueo de efectivo</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={S.label}>Saldo inicial (fondo de caja)</label>
              <input type="number" style={S.input} value={saldoInicial} onChange={(e) => setSaldoInicial(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label style={S.label}>Efectivo contado físicamente</label>
              <input type="number" style={S.input} value={efectivoContado} onChange={(e) => setEfectivoContado(e.target.value)} placeholder="0" />
            </div>

            {contoTouched && (
              <div
                style={{
                  ...S.card,
                  padding: 14,
                  background: diferencia === 0 ? COLORS.greenSoft : diferencia > 0 ? COLORS.yellowSoft : COLORS.redSoft,
                  border: `1px solid ${diferencia === 0 ? COLORS.green : diferencia > 0 ? COLORS.yellow : COLORS.red}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {diferencia === 0 ? <CheckCircle2 size={20} color={COLORS.green} /> : <AlertTriangle size={20} color={diferencia > 0 ? COLORS.yellow : COLORS.red} />}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {diferencia === 0 ? 'Caja exacta' : diferencia > 0 ? 'Sobrante en caja' : 'Faltante en caja'}
                  </div>
                  {diferencia !== 0 && (
                    <div style={{ fontSize: 13, color: COLORS.textMuted }}>{fmtMoney(Math.abs(diferencia))}</div>
                  )}
                </div>
              </div>
            )}

            <button style={{ ...S.btnPrimary, justifyContent: 'center', opacity: cierreGuardado ? 0.6 : 1 }} onClick={handleCerrarCaja} disabled={cerrando || cierreGuardado}>
              <Lock size={16} /> {cierreGuardado ? 'Caja cerrada ✓' : cerrando ? 'Cerrando...' : 'Cerrar caja del día'}
            </button>
          </div>
        </div>

        {/* Egresos */}
        <div style={S.card}>
          <h3 style={{ marginTop: 0, fontSize: 15.5 }}>Egresos / Gastos de mostrador</h3>
          <form onSubmit={handleAddEgreso} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8 }}>
              <select style={S.select} value={egresoForm.categoria} onChange={(e) => setEgresoForm({ ...egresoForm, categoria: e.target.value })}>
                {CATEGORIAS_EGRESO.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" style={S.input} placeholder="Monto" value={egresoForm.monto} onChange={(e) => setEgresoForm({ ...egresoForm, monto: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={S.input} placeholder="Descripción (opcional)" value={egresoForm.descripcion} onChange={(e) => setEgresoForm({ ...egresoForm, descripcion: e.target.value })} />
              <button type="submit" style={{ ...S.btnPrimary, flexShrink: 0 }}><Plus size={16} /></button>
            </div>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            {egresosDia.length === 0 && <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Sin egresos cargados hoy.</div>}
            {egresosDia.map((e) => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: COLORS.bgInput, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{e.categoria}</div>
                  {e.descripcion && <div style={{ fontSize: 11.5, color: COLORS.textMuted }}>{e.descripcion}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.red }}>{fmtMoney(e.monto)}</span>
                  <button style={S.btnGhost} onClick={() => handleDeleteEgreso(e.id)}><Trash2 size={14} color={COLORS.red} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
