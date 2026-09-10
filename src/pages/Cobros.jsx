import React, { useEffect, useMemo, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { Plus, Trash2, X, Download, Banknote, CreditCard } from 'lucide-react'
import * as XLSX from 'xlsx'
import { db } from '../config/firebase'
import { COLORS, S, fmtMoney, todayISO, monthKey, monthLabel } from '../theme'

const EMPTY = {
  alumnaId: '',
  claseId: '',
  monto: '',
  metodoPago: 'Efectivo',
  mes: monthKey(),
  fecha: todayISO(),
}

export default function Cobros() {
  const [cobros, setCobros] = useState([])
  const [alumnas, setAlumnas] = useState([])
  const [clases, setClases] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filtroMes, setFiltroMes] = useState(monthKey())

  useEffect(() => {
    const q1 = query(collection(db, 'cobros'), orderBy('fecha', 'desc'))
    const unsub1 = onSnapshot(q1, (snap) => {
      setCobros(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    const unsub2 = onSnapshot(collection(db, 'alumnas'), (snap) => setAlumnas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    const unsub3 = onSnapshot(collection(db, 'clases'), (snap) => setClases(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => { unsub1(); unsub2(); unsub3() }
  }, [])

  const alumnaMap = useMemo(() => Object.fromEntries(alumnas.map((a) => [a.id, `${a.apellido}, ${a.nombre}`])), [alumnas])
  const claseMap = useMemo(() => Object.fromEntries(clases.map((c) => [c.id, c])), [clases])

  const cobrosDelMes = useMemo(() => cobros.filter((c) => c.mes === filtroMes), [cobros, filtroMes])

  const totales = useMemo(() => {
    const efectivo = cobrosDelMes.filter((c) => c.metodoPago === 'Efectivo').reduce((s, c) => s + Number(c.monto || 0), 0)
    const transferencia = cobrosDelMes.filter((c) => c.metodoPago === 'Transferencia').reduce((s, c) => s + Number(c.monto || 0), 0)
    return { efectivo, transferencia, total: efectivo + transferencia }
  }, [cobrosDelMes])

  function openNew() {
    setForm({ ...EMPTY, mes: filtroMes })
    setModalOpen(true)
  }

  function handleClaseChange(claseId) {
    const clase = claseMap[claseId]
    setForm((f) => ({ ...f, claseId, monto: clase ? clase.precioCuota : f.monto }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.alumnaId || !form.monto) return
    setSaving(true)
    try {
      const clase = claseMap[form.claseId]
      await addDoc(collection(db, 'cobros'), {
        ...form,
        monto: Number(form.monto) || 0,
        alumnaNombre: alumnaMap[form.alumnaId] || '',
        claseNombre: clase ? clase.nombre : '',
        createdAt: serverTimestamp(),
      })
      setModalOpen(false)
    } catch (err) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este cobro?')) return
    await deleteDoc(doc(db, 'cobros', id))
  }

  function exportarExcel() {
    const rows = cobrosDelMes.map((c) => ({
      Fecha: c.fecha,
      Alumna: alumnaMap[c.alumnaId] || c.alumnaNombre || '',
      Clase: c.claseNombre || '',
      'Método de pago': c.metodoPago,
      Monto: Number(c.monto || 0),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Cobros')
    XLSX.writeFile(wb, `Cobros_${filtroMes}.xlsx`)
  }

  return (
    <div style={S.page}>
      <h1 style={S.pageTitle}>Cobros</h1>
      <p style={S.pageSubtitle}>Registro de ingresos y cobro de cuotas mensuales.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div style={S.kpiCard}>
          <span style={S.kpiLabel}>Total del mes</span>
          <span style={{ ...S.kpiValue, color: COLORS.accent }}>{fmtMoney(totales.total)}</span>
        </div>
        <div style={S.kpiCard}>
          <span style={S.kpiLabel}><Banknote size={12} style={{ verticalAlign: -1 }} /> Efectivo</span>
          <span style={S.kpiValue}>{fmtMoney(totales.efectivo)}</span>
        </div>
        <div style={S.kpiCard}>
          <span style={S.kpiLabel}><CreditCard size={12} style={{ verticalAlign: -1 }} /> Transferencia</span>
          <span style={S.kpiValue}>{fmtMoney(totales.transferencia)}</span>
        </div>
      </div>

      <div style={S.toolbar}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="month" style={{ ...S.input, width: 170 }} value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} />
          <span style={{ color: COLORS.textMuted, fontSize: 13 }}>{monthLabel(filtroMes)}</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={S.btnSecondary} onClick={exportarExcel}><Download size={16} /> Excel</button>
          <button style={S.btnPrimary} onClick={openNew}><Plus size={16} /> Nuevo cobro</button>
        </div>
      </div>

      <div style={{ ...S.card, padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24, color: COLORS.textMuted }}>Cargando...</div>
        ) : cobrosDelMes.length === 0 ? (
          <div style={{ padding: 24, color: COLORS.textMuted }}>No hay cobros cargados para {monthLabel(filtroMes)}.</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Fecha</th>
                <th style={S.th}>Alumna</th>
                <th style={S.th}>Clase</th>
                <th style={S.th}>Método</th>
                <th style={S.th}>Monto</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {cobrosDelMes.map((c) => (
                <tr key={c.id}>
                  <td style={S.td}>{c.fecha}</td>
                  <td style={S.td}>{alumnaMap[c.alumnaId] || c.alumnaNombre || '—'}</td>
                  <td style={S.td}>{c.claseNombre || '—'}</td>
                  <td style={S.td}>
                    <span style={S.badge(c.metodoPago === 'Efectivo' ? COLORS.green : COLORS.blue, c.metodoPago === 'Efectivo' ? COLORS.greenSoft : COLORS.blueSoft)}>
                      {c.metodoPago}
                    </span>
                  </td>
                  <td style={S.td}>{fmtMoney(c.monto)}</td>
                  <td style={S.td}>
                    <button style={S.btnGhost} onClick={() => handleDelete(c.id)}><Trash2 size={16} color={COLORS.red} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div style={S.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Nuevo cobro</h2>
              <button style={S.btnGhost} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={S.label}>Alumna *</label>
                <select style={S.select} required value={form.alumnaId} onChange={(e) => setForm({ ...form, alumnaId: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {alumnas.map((a) => <option key={a.id} value={a.id}>{a.apellido}, {a.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Clase</label>
                <select style={S.select} value={form.claseId} onChange={(e) => handleClaseChange(e.target.value)}>
                  <option value="">Sin especificar</option>
                  {clases.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Mes correspondiente</label>
                  <input type="month" style={S.input} value={form.mes} onChange={(e) => setForm({ ...form, mes: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Fecha de pago</label>
                  <input type="date" style={S.input} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Monto *</label>
                  <input type="number" style={S.input} required value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Método de pago</label>
                  <select style={S.select} value={form.metodoPago} onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" style={S.btnSecondary} onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" style={S.btnPrimary} disabled={saving}>{saving ? 'Guardando...' : 'Registrar cobro'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
