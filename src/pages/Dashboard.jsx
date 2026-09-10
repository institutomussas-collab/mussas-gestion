import React, { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { Users, UserCog, CalendarDays, Wallet, Banknote, CreditCard, TrendingUp } from 'lucide-react'
import { db } from '../config/firebase'
import { COLORS, S, fmtMoney, monthKey, monthLabel } from '../theme'

export default function Dashboard() {
  const [alumnas, setAlumnas] = useState([])
  const [profesores, setProfesores] = useState([])
  const [clases, setClases] = useState([])
  const [cobros, setCobros] = useState([])

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'alumnas'), (s) => setAlumnas(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(collection(db, 'profesores'), (s) => setProfesores(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
    const u3 = onSnapshot(collection(db, 'clases'), (s) => setClases(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
    const u4 = onSnapshot(collection(db, 'cobros'), (s) => setCobros(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return () => { u1(); u2(); u3(); u4() }
  }, [])

  const mesActual = monthKey()
  const alumnasActivas = alumnas.filter((a) => a.estado === 'Activa').length
  const cobrosMes = useMemo(() => cobros.filter((c) => c.mes === mesActual), [cobros, mesActual])
  const totalMes = cobrosMes.reduce((s, c) => s + Number(c.monto || 0), 0)
  const efectivoMes = cobrosMes.filter((c) => c.metodoPago === 'Efectivo').reduce((s, c) => s + Number(c.monto || 0), 0)
  const transferenciaMes = cobrosMes.filter((c) => c.metodoPago === 'Transferencia').reduce((s, c) => s + Number(c.monto || 0), 0)

  const proximosCumples = useMemo(() => {
    const hoy = new Date()
    return alumnas
      .filter((a) => a.fechaNacimiento)
      .map((a) => {
        const [, m, d] = a.fechaNacimiento.split('-').map(Number)
        let prox = new Date(hoy.getFullYear(), m - 1, d)
        if (prox < hoy) prox = new Date(hoy.getFullYear() + 1, m - 1, d)
        return { ...a, prox }
      })
      .sort((a, b) => a.prox - b.prox)
      .slice(0, 5)
  }, [alumnas])

  const kpis = [
    { label: 'Alumnas activas', value: alumnasActivas, icon: Users, color: COLORS.accent },
    { label: 'Profesores', value: profesores.length, icon: UserCog, color: COLORS.blue },
    { label: 'Clases activas', value: clases.length, icon: CalendarDays, color: COLORS.yellow },
    { label: `Cobrado en ${monthLabel(mesActual)}`, value: fmtMoney(totalMes), icon: Wallet, color: COLORS.green },
  ]

  return (
    <div style={S.page}>
      <h1 style={S.pageTitle}>Dashboard</h1>
      <p style={S.pageSubtitle}>Resumen general de Mussas Instituto de Danza.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={S.kpiCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={S.kpiLabel}>{label}</span>
              <Icon size={18} color={color} />
            </div>
            <span style={{ ...S.kpiValue, color }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={S.card}>
          <h3 style={{ marginTop: 0, fontSize: 15.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={17} color={COLORS.accent} /> Recaudación de {monthLabel(mesActual)}
          </h3>
          <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: COLORS.textMuted, fontSize: 12.5 }}>
                <Banknote size={14} /> Efectivo
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{fmtMoney(efectivoMes)}</div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: COLORS.textMuted, fontSize: 12.5 }}>
                <CreditCard size={14} /> Transferencia
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{fmtMoney(transferenciaMes)}</div>
            </div>
          </div>
          {/* Barra simple de proporción */}
          <div style={{ marginTop: 18, height: 10, borderRadius: 6, overflow: 'hidden', display: 'flex', background: COLORS.bgInput }}>
            <div style={{ width: `${totalMes ? (efectivoMes / totalMes) * 100 : 0}%`, background: COLORS.green }} />
            <div style={{ width: `${totalMes ? (transferenciaMes / totalMes) * 100 : 0}%`, background: COLORS.blue }} />
          </div>
        </div>

        <div style={S.card}>
          <h3 style={{ marginTop: 0, fontSize: 15.5 }}>Próximos cumpleaños</h3>
          {proximosCumples.length === 0 ? (
            <div style={{ color: COLORS.textMuted, fontSize: 13 }}>No hay fechas de nacimiento cargadas.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {proximosCumples.map((a) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                  <span>{a.nombre} {a.apellido}</span>
                  <span style={{ color: COLORS.textMuted }}>{a.prox.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
