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
import { Plus, Trash2, X, Sparkles, CheckSquare, Square } from 'lucide-react'
import { db } from '../config/firebase'
import { COLORS, S } from '../theme'

const ESTADOS = ['Pendiente', 'En curso', 'Confirmado']

const EMPTY = {
  titulo: '',
  responsable: '',
  claseId: '',
  fechaLimite: '',
  estado: 'Pendiente',
  notas: '',
}

export default function Muestra() {
  const [items, setItems] = useState([])
  const [clases, setClases] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const q1 = query(collection(db, 'muestra_items'), orderBy('fechaLimite'))
    const unsub1 = onSnapshot(q1, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    const unsub2 = onSnapshot(collection(db, 'clases'), (snap) => setClases(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => { unsub1(); unsub2() }
  }, [])

  const claseMap = useMemo(() => Object.fromEntries(clases.map((c) => [c.id, c.nombre])), [clases])

  const resumen = useMemo(() => {
    const total = items.length
    const confirmados = items.filter((i) => i.estado === 'Confirmado').length
    return { total, confirmados, pct: total ? Math.round((confirmados / total) * 100) : 0 }
  }, [items])

  function openNew() {
    setEditId(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  function openEdit(i) {
    setEditId(i.id)
    setForm({ ...EMPTY, ...i })
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.titulo.trim()) return
    setSaving(true)
    try {
      if (editId) {
        const { id, ...rest } = form
        await updateDoc(doc(db, 'muestra_items', editId), rest)
      } else {
        await addDoc(collection(db, 'muestra_items'), { ...form, createdAt: serverTimestamp() })
      }
      setModalOpen(false)
    } catch (err) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este ítem de la planificación?')) return
    await deleteDoc(doc(db, 'muestra_items', id))
  }

  async function toggleEstado(item) {
    const idx = ESTADOS.indexOf(item.estado)
    const nuevo = ESTADOS[(idx + 1) % ESTADOS.length]
    await updateDoc(doc(db, 'muestra_items', item.id), { estado: nuevo })
  }

  const estadoColor = (estado) => {
    if (estado === 'Confirmado') return [COLORS.green, COLORS.greenSoft]
    if (estado === 'En curso') return [COLORS.yellow, COLORS.yellowSoft]
    return [COLORS.textMuted, 'rgba(255,255,255,0.06)']
  }

  return (
    <div style={S.page}>
      <h1 style={{ ...S.pageTitle, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Sparkles size={24} color={COLORS.accent} /> Muestra Anual
      </h1>
      <p style={S.pageSubtitle}>Planificación general de la Muestra Anual de Diciembre.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div style={S.kpiCard}>
          <span style={S.kpiLabel}>Ítems planificados</span>
          <span style={S.kpiValue}>{resumen.total}</span>
        </div>
        <div style={S.kpiCard}>
          <span style={S.kpiLabel}>Confirmados</span>
          <span style={{ ...S.kpiValue, color: COLORS.green }}>{resumen.confirmados}</span>
        </div>
        <div style={S.kpiCard}>
          <span style={S.kpiLabel}>Avance</span>
          <span style={{ ...S.kpiValue, color: COLORS.accent }}>{resumen.pct}%</span>
        </div>
      </div>

      <div style={S.toolbar}>
        <div />
        <button style={S.btnPrimary} onClick={openNew}><Plus size={16} /> Nuevo ítem</button>
      </div>

      <div style={{ ...S.card, padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24, color: COLORS.textMuted }}>Cargando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, color: COLORS.textMuted }}>Todavía no armaste la planificación de la muestra.</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}></th>
                <th style={S.th}>Ítem</th>
                <th style={S.th}>Comisión / Clase</th>
                <th style={S.th}>Responsable</th>
                <th style={S.th}>Fecha límite</th>
                <th style={S.th}>Estado</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const [color, soft] = estadoColor(i.estado)
                return (
                  <tr key={i.id}>
                    <td style={S.td}>
                      <button style={S.btnGhost} onClick={() => toggleEstado(i)} title="Cambiar estado">
                        {i.estado === 'Confirmado' ? <CheckSquare size={18} color={COLORS.green} /> : <Square size={18} color={COLORS.textMuted} />}
                      </button>
                    </td>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600 }}>{i.titulo}</div>
                      {i.notas && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{i.notas}</div>}
                    </td>
                    <td style={S.td}>{claseMap[i.claseId] || '—'}</td>
                    <td style={S.td}>{i.responsable || '—'}</td>
                    <td style={S.td}>{i.fechaLimite || '—'}</td>
                    <td style={S.td}>
                      <span onClick={() => toggleEstado(i)} style={{ ...S.badge(color, soft), cursor: 'pointer' }}>{i.estado}</span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={S.btnGhost} onClick={() => openEdit(i)}>✎</button>
                        <button style={S.btnGhost} onClick={() => handleDelete(i.id)}><Trash2 size={16} color={COLORS.red} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div style={S.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{editId ? 'Editar ítem' : 'Nuevo ítem de planificación'}</h2>
              <button style={S.btnGhost} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={S.label}>Título *</label>
                <input style={S.input} required placeholder="Ej: Definir vestuario Jazz Infantil" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Comisión / Clase relacionada</label>
                <select style={S.select} value={form.claseId} onChange={(e) => setForm({ ...form, claseId: e.target.value })}>
                  <option value="">Sin especificar</option>
                  {clases.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Responsable</label>
                  <input style={S.input} value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Fecha límite</label>
                  <input type="date" style={S.input} value={form.fechaLimite} onChange={(e) => setForm({ ...form, fechaLimite: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={S.label}>Estado</label>
                <select style={S.select} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                  {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Notas</label>
                <textarea style={{ ...S.input, minHeight: 70, resize: 'vertical' }} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </div>
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
