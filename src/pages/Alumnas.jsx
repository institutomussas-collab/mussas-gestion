import React, { useEffect, useMemo, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore'
import { Plus, Search, Pencil, Trash2, X, Phone } from 'lucide-react'
import { db } from '../config/firebase'
import { COLORS, S } from '../theme'

const EMPTY = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  email: '',
  fechaNacimiento: '',
  estado: 'Activa',
  observaciones: '',
}

export default function Alumnas() {
  const [alumnas, setAlumnas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todas')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'alumnas'), orderBy('apellido'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAlumnas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [])

  const filtradas = useMemo(() => {
    const s = search.trim().toLowerCase()
    return alumnas.filter((a) => {
      const matchEstado = filtroEstado === 'Todas' || a.estado === filtroEstado
      if (!matchEstado) return false
      if (!s) return true
      return (
        (a.nombre || '').toLowerCase().includes(s) ||
        (a.apellido || '').toLowerCase().includes(s) ||
        (a.dni || '').toLowerCase().includes(s)
      )
    })
  }, [alumnas, search, filtroEstado])

  function openNew() {
    setEditId(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  function openEdit(a) {
    setEditId(a.id)
    setForm({ ...EMPTY, ...a })
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.apellido.trim()) return
    setSaving(true)
    try {
      if (editId) {
        const { id, ...rest } = form
        await updateDoc(doc(db, 'alumnas', editId), rest)
      } else {
        await addDoc(collection(db, 'alumnas'), { ...form, createdAt: serverTimestamp() })
      }
      setModalOpen(false)
    } catch (err) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta alumna? Esta acción no se puede deshacer.')) return
    await deleteDoc(doc(db, 'alumnas', id))
  }

  return (
    <div style={S.page}>
      <h1 style={S.pageTitle}>Alumnas</h1>
      <p style={S.pageSubtitle}>Alta, baja y modificación del padrón de alumnas.</p>

      <div style={S.toolbar}>
        <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: 240, flex: 1, maxWidth: 360 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }}
            />
            <input
              style={{ ...S.input, paddingLeft: 36 }}
              placeholder="Buscar por nombre, apellido o DNI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select style={{ ...S.select, width: 160 }} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="Todas">Todas</option>
            <option value="Activa">Activas</option>
            <option value="Inactiva">Inactivas</option>
          </select>
        </div>
        <button style={S.btnPrimary} onClick={openNew}>
          <Plus size={16} /> Nueva alumna
        </button>
      </div>

      <div style={{ ...S.card, padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24, color: COLORS.textMuted }}>Cargando...</div>
        ) : filtradas.length === 0 ? (
          <div style={{ padding: 24, color: COLORS.textMuted }}>No hay alumnas que coincidan con la búsqueda.</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Apellido y Nombre</th>
                <th style={S.th}>DNI</th>
                <th style={S.th}>WhatsApp</th>
                <th style={S.th}>Email</th>
                <th style={S.th}>Nacimiento</th>
                <th style={S.th}>Estado</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((a) => (
                <tr key={a.id}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>{a.apellido}, {a.nombre}</div>
                    {a.observaciones && (
                      <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{a.observaciones}</div>
                    )}
                  </td>
                  <td style={S.td}>{a.dni || '—'}</td>
                  <td style={S.td}>
                    {a.telefono ? (
                      <a
                        href={`https://wa.me/${a.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: COLORS.green, display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                      >
                        <Phone size={13} /> {a.telefono}
                      </a>
                    ) : '—'}
                  </td>
                  <td style={S.td}>{a.email || '—'}</td>
                  <td style={S.td}>{a.fechaNacimiento || '—'}</td>
                  <td style={S.td}>
                    <span style={S.badge(a.estado === 'Activa' ? COLORS.green : COLORS.textMuted, a.estado === 'Activa' ? COLORS.greenSoft : 'rgba(255,255,255,0.06)')}>
                      {a.estado}
                    </span>
                  </td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={S.btnGhost} onClick={() => openEdit(a)} title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button style={S.btnGhost} onClick={() => handleDelete(a.id)} title="Eliminar">
                        <Trash2 size={16} color={COLORS.red} />
                      </button>
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
              <h2 style={{ margin: 0, fontSize: 18 }}>{editId ? 'Editar alumna' : 'Nueva alumna'}</h2>
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
                  <label style={S.label}>Fecha de nacimiento</label>
                  <input type="date" style={S.input} value={form.fechaNacimiento} onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>WhatsApp</label>
                  <input style={S.input} placeholder="549..." value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Email</label>
                  <input type="email" style={S.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={S.label}>Estado</label>
                <select style={S.select} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                  <option value="Activa">Activa</option>
                  <option value="Inactiva">Inactiva</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Observaciones</label>
                <textarea
                  style={{ ...S.input, minHeight: 70, resize: 'vertical' }}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" style={S.btnSecondary} onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" style={S.btnPrimary} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
