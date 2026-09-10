// Paleta y estilos compartidos — Dark Mode Mussas Estudio
export const COLORS = {
  bg: '#121212',
  bgPanel: '#1a1a1a',
  bgCard: '#1e1e1e',
  bgInput: '#252525',
  border: '#2c2c2c',
  text: '#f1f1f1',
  textMuted: '#9a9a9a',
  accent: '#ff0055',
  accentSoft: 'rgba(255, 0, 85, 0.12)',
  green: '#2ecc71',
  greenSoft: 'rgba(46, 204, 113, 0.12)',
  red: '#ff4d4d',
  redSoft: 'rgba(255, 77, 77, 0.12)',
  yellow: '#ffb020',
  yellowSoft: 'rgba(255, 176, 32, 0.12)',
  blue: '#4d9fff',
  blueSoft: 'rgba(77, 159, 255, 0.12)',
}

export const S = {
  page: {
    padding: '28px 32px',
    maxWidth: 1400,
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    margin: '0 0 4px 0',
    color: COLORS.text,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    margin: '0 0 24px 0',
  },
  card: {
    background: COLORS.bgCard,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: 20,
  },
  kpiCard: {
    background: COLORS.bgCard,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  kpiLabel: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 600,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 700,
  },
  input: {
    background: COLORS.bgInput,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: '10px 12px',
    color: COLORS.text,
    fontSize: 14,
    outline: 'none',
    width: '100%',
  },
  label: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginBottom: 6,
    display: 'block',
    fontWeight: 600,
  },
  select: {
    background: COLORS.bgInput,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: '10px 12px',
    color: COLORS.text,
    fontSize: 14,
    outline: 'none',
    width: '100%',
  },
  btnPrimary: {
    background: COLORS.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  btnSecondary: {
    background: 'transparent',
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  btnGhost: {
    background: 'transparent',
    color: COLORS.textMuted,
    border: 'none',
    borderRadius: 8,
    padding: '6px 8px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
  },
  btnDanger: {
    background: COLORS.redSoft,
    color: COLORS.red,
    border: `1px solid ${COLORS.red}`,
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13.5,
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    color: COLORS.textMuted,
    fontWeight: 600,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    borderBottom: `1px solid ${COLORS.border}`,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 12px',
    borderBottom: `1px solid ${COLORS.border}`,
    verticalAlign: 'middle',
  },
  badge: (color, soft) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11.5,
    fontWeight: 700,
    color,
    background: soft,
  }),
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    background: COLORS.bgPanel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  toolbar: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 18,
    justifyContent: 'space-between',
  },
}

export function fmtMoney(n) {
  const v = Number(n) || 0
  return v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return `${meses[parseInt(m, 10) - 1]} ${y}`
}
