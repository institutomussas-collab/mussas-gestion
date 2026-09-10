# Mussas Estudio — Sistema de Gestión

App de gestión para Mussas Instituto de Danza. React + Vite + Firestore.

## Estructura

```
src/
├── config/
│   └── firebase.js
├── pages/
│   ├── Alumnas.jsx
│   ├── Caja.jsx
│   ├── Clases.jsx
│   ├── Cobros.jsx
│   ├── Dashboard.jsx
│   ├── Muestra.jsx
│   └── Profesores.jsx
├── theme.js
├── App.jsx
└── main.jsx
```

Todos los nombres de archivo respetan mayúsculas/minúsculas exactas para evitar errores de resolución de módulos en Vercel (Linux es case-sensitive; tu máquina local en Mac/Windows no lo es, así que un typo puede pasar desapercibido en local y romper el build en Vercel).

## 1. Configurar Firebase

1. Creá un proyecto en [Firebase Console](https://console.firebase.google.com/) (o usá uno existente).
2. Activá **Firestore Database** (modo producción o test, según prefieras empezar).
3. En **Configuración del proyecto > Tus apps**, agregá una Web App y copiá las credenciales.
4. Copiá `.env.example` a `.env` y completá los valores:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

No hace falta crear las colecciones a mano: `alumnas`, `profesores`, `clases`, `cobros`, `egresos`, `cajas_diarias` y `muestra_items` se crean solas la primera vez que guardás un dato desde cada pantalla.

## 2. Instalar y correr en local

```bash
npm install
npm run dev
```

## 3. Desplegar en Vercel

1. Subí este proyecto a un repositorio de GitHub.
2. En Vercel: **New Project** → importá el repo → Framework Preset: **Vite**.
3. En **Environment Variables**, cargá las mismas 6 variables `VITE_FIREBASE_...` del `.env`.
4. Deploy.

Si Vercel tira `Could not resolve ./pages/X from App.jsx`, es casi siempre por:
- Un archivo con mayúscula/minúscula distinta a la importada (ej. `dashboard.jsx` en vez de `Dashboard.jsx`).
- Un archivo que quedó fuera de `src/pages/` o con otra extensión (`.js` en vez de `.jsx`).
- El archivo no fue commiteado a git (revisá `git status` / que no esté en `.gitignore`).

Este proyecto ya viene con la estructura y nomenclatura exacta que pediste, así que si lo subís tal cual no debería volver a pasar.

## Colecciones de Firestore usadas

| Colección | Descripción |
|---|---|
| `alumnas` | Padrón de alumnas |
| `profesores` | Plantilla docente |
| `clases` | Comisiones/clases (días, horario, cuota, profesor a cargo) |
| `cobros` | Cobros de cuotas (efectivo/transferencia) |
| `egresos` | Gastos de mostrador por categoría |
| `cajas_diarias` | Cierres de caja diarios (arqueo) |
| `muestra_items` | Planificación de la Muestra Anual |

## Notas

- Todas las pantallas usan `onSnapshot` de Firestore, así que los datos se actualizan en tiempo real entre dispositivos sin recargar.
- La exportación a Excel usa `xlsx` (SheetJS) 100% en el navegador, no requiere backend.
- Los botones de WhatsApp abren `wa.me` con el texto pre-cargado; si el profesor/a tiene WhatsApp cargado en su ficha, el mensaje se abre directo en su chat.
