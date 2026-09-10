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
import { Plus, Pencil, Trash2, X, Clock } from 'lucide-react'
import { db } from '../config/firebase'
import { COLORS, S, fmtMoney } from '../theme'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const EMPTY = {
  nombre: '',
  disciplina: '',
  dias: [],
  horario: '',
  duracionMin: 60,
  precioCuota: '',
  profesorId: '',
}

export default function Clases() {
  const [clases, setClases] = useState([])
  const [profesores, setProfesores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const q1 = query(collection(db, 'clases'), orderBy('nombre'))
    const unsub1 = onSnapshot(q1, (snap) => {
      setClases(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    const unsub2 = onSnapshot(collection(db, 'profesores'), (snap) => {
      setProfesores(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => { unsub1(); unsub2() }
  }, [])

  const profesorMap = useMemo(() => {
    const m = {}
    profesores.forEach((p) => { m[p.id] = `${p.nombre} ${p.apellido}` })
    return m
  }, [profesores])

  function openNew() {
    setEditId(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  function openEdit(c) {
    setEditId(c.id)
    setForm({ ...EMPTY, ...c, dias: c.dias || [] })
    setModalOpen(true)
  }

  function toggleDia(dia) {
    setForm((f) => ({
      ...f,
      dias: f.dias.includes(dia) ? f.dias.filter((d) => d !== dia) : [...f.dias, dia],
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      const payload = { ...form, precioCuota: Number(form.precioCuota) || 0, duracionMin: Number(form.duracionMin) || 0 }
      if (editId) {
        const { id, ...rest } = payload
        await updateDoc(doc(db, 'clases', editId), rest)
      } else {
        await addDoc(collection(db, 'clases'), { ...payload, createdAt: serverTimestamp() })
      }
      setModalOpen(false)
    } catch (err) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta clase/comisión?')) return
    await deleteDoc(doc(db, 'clases', id))
  }

  return (
    <div style={S.page}>
      <h1 style={S.pageTitle}>Clases y Comisiones</h1>
      <p style={S.pageSubtitle}>Días de dictado, horarios, duración, cuota y profesor a cargo.</p>

      <div style={S.toolbar}>
        <div />
        <button style={S.btnPrimary} onClick={openNew}>
          <Plus size={16} /> Nueva clase
        </button>
      </div>

      <div style={{ ...S.card, padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24, color: COLORS.textMuted }}>Cargando...</div>
        ) : clases.length === 0 ? (
          <div style={{ padding: 24, color: COLORS.textMuted }}>Todavía no cargaste ninguna clase.</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Comisión</th>
                <th style={S.th}>Días</th>
                <th style={S.th}>Horario</th>
                <th style={S.th}>Duración</th>
                <th style={S.th}>Cuota</th>
                <th style={S.th}>Profesor/a</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {clases.map((c) => (
                <tr key={c.id}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                    {c.disciplina && <div style={{ fontSize: 12, color: COLORS.textMuted }}>{c.disciplina}</div>}
                  </td>
                  <td style={S.td}>{(c.dias || []).map((d) => d.slice(0, 3)).join(' / ') || '—'}</td>
                  <td style={S.td}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={13} color={COLORS.textMuted} /> {c.horario || '—'}
                    </span>
                  </td>
                  <td style={S.td}>{c.duracionMin ? `${c.duracionMin} min` : '—'}</td>
                  <td style={S.td}>{fmtMoney(c.precioCuota)}</td>
                  <td style={S.td}>{profesorMap[c.profesorId] || <span style={{ color: COLORS.textMuted }}>Sin asignar</span>}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={S.btnGhost} onClick={() => openEdit(c)}><Pencil size={16} /></button>
                      <button style={S.btnGhost} onClick={() => handleDelete(c.id)}><Trash2 size={16} color={COLORS.red} /></button>
                    </div>
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
              <h2 style={{ margin: 0, fontSize: 18 }}>{editId ? 'Editar clase' : 'Nueva clase'}</h2>
              <button style={S.btnGhost} onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={S.label}>Nombre de la comisión *</label>
                <input style={S.input} required placeholder="Ej: Jazz Infantil A" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Disciplina</label>
                <input style={S.input} placeholder="Jazz, Clásico, Contemporáneo..." value={form.disciplina} onChange={(e) => setForm({ ...form, disciplina: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Días de dictado</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {DIAS.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => toggleDia(d)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: `1px solid ${form.dias.includes(d) ? COLORS.accent : COLORS.border}`,
                        background: form.dias.includes(d) ? COLORS.accentSoft : 'transparent',
                        color: form.dias.includes(d) ? COLORS.accent : COLORS.textMuted,
                      }}
                    >
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Horario</label>
                  <input style={S.input} placeholder="18:00 - 19:00" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Duración (min)</label>
                  <input type="number" style={S.input} value={form.duracionMin} onChange={(e) => setForm({ ...form, duracionMin: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Precio de cuota mensual</label>
                  <input type="number" style={S.input} value={form.precioCuota} onChange={(e) => setForm({ ...form, precioCuota: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Profesor/a a cargo</label>
                  <select style={S.select} value={form.profesorId} onChange={(e) => setForm({ ...form, profesorId: e.target.value })}>
                    <option value="">Sin asignar</option>
                    {profesores.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                    ))}
                  </select>
                </div>
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
