import React, { useEffect, useMemo, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { Plus, Pencil, Trash2, X, Download, MessageCircle, Percent, Clock3 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { db } from '../config/firebase'
import { COLORS, S, fmtMoney, monthKey, monthLabel } from '../theme'

const EMPTY = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  email: '',
  modalidad: 'porcentaje',
  porcentaje: 30,
  valorHora: '',
}

const DIA_NUM = { Domingo: 0, Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6 }

function occurrencesInMonth(mes, diaNombre) {
  const [y, m] = mes.split('-').map(Number)
  const targetDow = DIA_NUM[diaNombre]
  if (targetDow === undefined) return 0
  const daysInMonth = new Date(y, m, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(y, m - 1, d).getDay() === targetDow) count++
  }
  return count
}

export default function Profesores() {
  const [profesores, setProfesores] = useState([])
  const [clases, setClases] = useState([])
  const [cobros, setCobros] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [mesLiquidacion, setMesLiquidacion] = useState(monthKey())

  useEffect(() => {
    const q1 = query(collection(db, 'profesores'), orderBy('apellido'))
    const unsub1 = onSnapshot(q1, (snap) => {
      setProfesores(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    const unsub2 = onSnapshot(collection(db, 'clases'), (snap) => setClases(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    const unsub3 = onSnapshot(collection(db, 'cobros'), (snap) => setCobros(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => { unsub1(); unsub2(); unsub3() }
  }, [])

  function openNew() {
    setEditId(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  function openEdit(p) {
    setEditId(p.id)
    setForm({ ...EMPTY, ...p })
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.apellido.trim()) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        porcentaje: Number(form.porcentaje) || 0,
        valorHora: Number(form.valorHora) || 0,
      }
      if (editId) {
        const { id, ...rest } = payload
        await updateDoc(doc(db, 'profesores', editId), rest)
      } else {
        await addDoc(collection(db, 'profesores'), { ...payload, createdAt: serverTimestamp() })
      }
      setModalOpen(false)
    } catch (err) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este profesor/a?')) return
    await deleteDoc(doc(db, 'profesores', id))
  }

  // --- Cálculo de liquidación mensual ---
  const liquidaciones = useMemo(() => {
    return profesores.map((prof) => {
      const clasesDelProfe = clases.filter((c) => c.profesorId === prof.id)

      if (prof.modalidad === 'valorHora') {
        let horasTotales = 0
        const detalle = clasesDelProfe.map((c) => {
          const ocurrencias = (c.dias || []).reduce((s, dia) => s + occurrencesInMonth(mesLiquidacion, dia), 0)
          const horasClase = ocurrencias * ((Number(c.duracionMin) || 0) / 60)
          horasTotales += horasClase
          return { clase: c.nombre, ocurrencias, horasClase }
        })
        const total = horasTotales * (Number(prof.valorHora) || 0)
        return { profesor: prof, modalidad: 'valorHora', horasTotales, detalle, total }
      }

      // Modalidad porcentaje sobre recaudación
      const claseIds = new Set(clasesDelProfe.map((c) => c.id))
      const cobrosImputados = cobros.filter((c) => c.mes === mesLiquidacion && claseIds.has(c.claseId))
      const recaudado = cobrosImputados.reduce((s, c) => s + Number(c.monto || 0), 0)
      const total = recaudado * ((Number(prof.porcentaje) || 0) / 100)
      const detalle = clasesDelProfe.map((c) => {
        const rec = cobrosImputados.filter((co) => co.claseId === c.id).reduce((s, co) => s + Number(co.monto || 0), 0)
        return { clase: c.nombre, recaudado: rec }
      })
      return { profesor: prof, modalidad: 'porcentaje', recaudado, detalle, total }
    })
  }, [profesores, clases, cobros, mesLiquidacion])

  function exportarLiquidacionExcel() {
    const rows = liquidaciones.map((l) => ({
      Profesor: `${l.profesor.nombre} ${l.profesor.apellido}`,
      Modalidad: l.modalidad === 'valorHora' ? 'Valor hora fijo' : 'Porcentaje sobre recaudación',
      'Base de cálculo': l.modalidad === 'valorHora' ? `${l.horasTotales.toFixed(1)} hs` : fmtMoney(l.recaudado),
      'Total a liquidar': l.total,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Liquidacion')
    XLSX.writeFile(wb, `Liquidacion_Profesores_${mesLiquidacion}.xlsx`)
  }

  function enviarWhatsapp(l) {
    const tel = (l.profesor.telefono || '').replace(/\D/g, '')
    const base = l.modalidad === 'valorHora'
      ? `Horas dictadas: ${l.horasTotales.toFixed(1)} hs x ${fmtMoney(l.profesor.valorHora)}`
      : `Recaudación imputada: ${fmtMoney(l.recaudado)} x ${l.profesor.porcentaje}%`
    const texto = `Hola ${l.profesor.nombre}! Te paso el resumen de liquidación de ${monthLabel(mesLiquidacion)} en Mussas Estudio:\n\n${base}\n\nTotal a liquidar: ${fmtMoney(l.total)}\n\nCualquier consulta me avisás. Gracias!`
    const url = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }

  return (
    <div style={S.page}>
      <h1 style={S.pageTitle}>Profesores</h1>
      <p style={S.pageSubtitle}>Plantilla docente y liquidación mensual de honorarios.</p>

      <div style={S.toolbar}>
        <div />
        <button style={S.btnPrimary} onClick={openNew}><Plus size={16} /> Nuevo profesor/a</button>
      </div>

      <div style={{ ...S.card, padding: 0, overflowX: 'auto', marginBottom: 28 }}>
        {loading ? (
          <div style={{ padding: 24, color: COLORS.textMuted }}>Cargando...</div>
        ) : profesores.length === 0 ? (
          <div style={{ padding: 24, color: COLORS.textMuted }}>Todavía no cargaste profesores.</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Apellido y Nombre</th>
                <th style={S.th}>Contacto</th>
                <th style={S.th}>Modalidad</th>
                <th style={S.th}>Valor</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {profesores.map((p) => (
                <tr key={p.id}>
                  <td style={S.td}><div style={{ fontWeight: 600 }}>{p.apellido}, {p.nombre}</div></td>
                  <td style={S.td}>{p.telefono || p.email || '—'}</td>
                  <td style={S.td}>
                    <span style={S.badge(p.modalidad === 'valorHora' ? COLORS.blue : COLORS.accent, p.modalidad === 'valorHora' ? COLORS.blueSoft : COLORS.accentSoft)}>
                      {p.modalidad === 'valorHora' ? 'Valor hora' : 'Porcentaje'}
                    </span>
                  </td>
                  <td style={S.td}>{p.modalidad === 'valorHora' ? fmtMoney(p.valorHora) + '/hs' : `${p.porcentaje}%`}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={S.btnGhost} onClick={() => openEdit(p)}><Pencil size={16} /></button>
                      <button style={S.btnGhost} onClick={() => handleDelete(p.id)}><Trash2 size={16} color={COLORS.red} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>Liquidación mensual de honorarios</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="month" style={{ ...S.input, width: 170 }} value={mesLiquidacion} onChange={(e) => setMesLiquidacion(e.target.value)} />
          <button style={S.btnSecondary} onClick={exportarLiquidacionExcel}><Download size={16} /> Excel</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {liquidaciones.length === 0 && (
          <div style={{ ...S.card, color: COLORS.textMuted }}>Cargá profesores para ver su liquidación.</div>
        )}
        {liquidaciones.map((l) => (
          <div key={l.profesor.id} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15.5 }}>{l.profesor.nombre} {l.profesor.apellido}</div>
                <div style={{ fontSize: 12.5, color: COLORS.textMuted, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  {l.modalidad === 'valorHora' ? <Clock3 size={13} /> : <Percent size={13} />}
                  {l.modalidad === 'valorHora'
                    ? `${l.horasTotales.toFixed(1)} hs dictadas x ${fmtMoney(l.profesor.valorHora)}`
                    : `${fmtMoney(l.recaudado)} recaudados x ${l.profesor.porcentaje}%`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Total a liquidar</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.accent }}>{fmtMoney(l.total)}</div>
              </div>
            </div>
            {l.detalle.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {l.detalle.map((d, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: COLORS.textMuted, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{d.clase}</span>
                    <span>{l.modalidad === 'valorHora' ? `${d.ocurrencias} clases · ${d.horasClase.toFixed(1)} hs` : fmtMoney(d.recaudado)}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <button style={S.btnSecondary} onClick={() => enviarWhatsapp(l)}>
                <MessageCircle size={16} color={COLORS.green} /> Enviar resumen por WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div style={S.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{editId ? 'Editar profesor/a' : 'Nuevo profesor/a'}</h2>
              <button style={S.btnGhost} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Nombre *</label>
                  <input style={S.input} required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Apellido *</label>
                  <input style={S.input} required value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>DNI</label>
                  <input style={S.input} value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>WhatsApp</label>
                  <input style={S.input} placeholder="549..." value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={S.label}>Email</label>
                <input type="email" style={S.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Modalidad de liquidación</label>
                <select style={S.select} value={form.modalidad} onChange={(e) => setForm({ ...form, modalidad: e.target.value })}>
                  <option value="porcentaje">Porcentaje sobre recaudación</option>
                  <option value="valorHora">Valor hora fijo</option>
                </select>
              </div>
              {form.modalidad === 'porcentaje' ? (
                <div>
                  <label style={S.label}>Porcentaje (%)</label>
                  <input type="number" style={S.input} value={form.porcentaje} onChange={(e) => setForm({ ...form, porcentaje: e.target.value })} />
                </div>
              ) : (
                <div>
                  <label style={S.label}>Valor por hora ($)</label>
                  <input type="number" style={S.input} value={form.valorHora} onChange={(e) => setForm({ ...form, valorHora: e.target.value })} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" style={S.btnSecondary} onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" style={S.btnPrimary} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
