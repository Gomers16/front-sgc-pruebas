// src/services/sedeActiva.ts
// Multi-sede (Fase 6): sede activa del usuario en el front.
//
// - Solo SUPER_ADMIN y GERENCIA pueden cambiar de sede (lo dice el backend en
//   /api/auth/me: puedeCambiarSede + sedesPermitidas). Para ellos se manda la
//   cabecera X-Sede-Id con la sede elegida o "todas".
// - El resto de roles no manda nada: el backend usa la sede de su usuario.
// - "Todas" es SOLO LECTURA: cualquier escritura (POST/PUT/PATCH/DELETE) se
//   frena en el front con un aviso en pantalla (el backend también la
//   rechaza con 400).
import { reactive, readonly } from 'vue'

export interface SedeLigera {
  id: number
  nombre: string
}

export type SeleccionSede = number | 'todas'

interface EstadoSede {
  puedeCambiarSede: boolean
  sedePropia: SedeLigera | null
  sedesPermitidas: SedeLigera[]
  seleccion: SeleccionSede | null
  aviso: string | null
}

const CLAVE_SELECCION = 'sedeActiva'
const CLAVE_META = 'sedeMeta'
export const CABECERA_SEDE = 'X-Sede-Id'
export const AVISO_SOLO_LECTURA =
  'Estás viendo "Todas las sedes" (solo lectura). Elige una sede en el encabezado para guardar cambios.'

function leerSeleccionGuardada(): SeleccionSede | null {
  const v = localStorage.getItem(CLAVE_SELECCION)
  if (!v) return null
  if (v === 'todas') return 'todas'
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : null
}

function leerMetaGuardada(): Pick<EstadoSede, 'puedeCambiarSede' | 'sedePropia' | 'sedesPermitidas'> {
  try {
    const m = JSON.parse(localStorage.getItem(CLAVE_META) || 'null')
    if (m && typeof m === 'object') {
      return {
        puedeCambiarSede: m.puedeCambiarSede === true,
        sedePropia: m.sedePropia ?? null,
        sedesPermitidas: Array.isArray(m.sedesPermitidas) ? m.sedesPermitidas : [],
      }
    }
  } catch {
    /* ignore */
  }
  return { puedeCambiarSede: false, sedePropia: null, sedesPermitidas: [] }
}

const estado = reactive<EstadoSede>({
  ...leerMetaGuardada(),
  seleccion: leerSeleccionGuardada(),
  aviso: null,
})

/** Estado de solo lectura para componentes (encabezado, selector, avisos). */
export const sedeActiva = readonly(estado)

/** Respuesta de /api/auth/me (campos de multi-sede). */
export interface MeSede {
  sede?: SedeLigera | null
  sedesPermitidas?: SedeLigera[]
  puedeCambiarSede?: boolean
}

/**
 * Carga lo que dijo /me. Si la selección guardada ya no es válida (sede
 * desactivada, cambio de rol), vuelve a la sede propia.
 */
export function cargarSedeDesdeMe(me: MeSede): void {
  estado.puedeCambiarSede = me.puedeCambiarSede === true
  estado.sedePropia = me.sede ?? null
  estado.sedesPermitidas = me.sedesPermitidas ?? []
  localStorage.setItem(
    CLAVE_META,
    JSON.stringify({
      puedeCambiarSede: estado.puedeCambiarSede,
      sedePropia: estado.sedePropia,
      sedesPermitidas: estado.sedesPermitidas,
    })
  )
  if (!estado.puedeCambiarSede) {
    elegirSede(null)
    return
  }
  const s = estado.seleccion
  const valida =
    s === 'todas'
      ? estado.sedesPermitidas.length > 1
      : s !== null && estado.sedesPermitidas.some((x) => x.id === s)
  if (!valida) elegirSede(estado.sedePropia?.id ?? estado.sedesPermitidas[0]?.id ?? null)
}

/** Cambia la sede elegida (null = la del usuario). */
export function elegirSede(seleccion: SeleccionSede | null): void {
  estado.seleccion = seleccion
  if (seleccion === null) localStorage.removeItem(CLAVE_SELECCION)
  else localStorage.setItem(CLAVE_SELECCION, String(seleccion))
}

/** Al cerrar sesión: no se arrastra la sede a otro usuario. */
export function limpiarSede(): void {
  estado.puedeCambiarSede = false
  estado.sedePropia = null
  estado.sedesPermitidas = []
  estado.aviso = null
  elegirSede(null)
  localStorage.removeItem(CLAVE_META)
}

export function esModoTodas(): boolean {
  return estado.puedeCambiarSede && estado.seleccion === 'todas'
}

/** Nombre de la sede activa para mostrar ("Todas las sedes" en modo todas). */
export function nombreSedeActiva(): string | null {
  if (esModoTodas()) return 'Todas las sedes'
  const id = estado.puedeCambiarSede ? estado.seleccion : null
  if (id !== null && id !== 'todas') {
    const s = estado.sedesPermitidas.find((x) => x.id === id)
    if (s) return s.nombre
  }
  return estado.sedePropia?.nombre ?? null
}

/** Cabecera X-Sede-Id (solo roles que pueden cambiar de sede). */
export function cabecerasSede(): Record<string, string> {
  if (!estado.puedeCambiarSede || estado.seleccion === null) return {}
  // La sede propia no se manda: el backend la usa por defecto, y si está
  // inactiva (PRUEBAS QA) la rechazaría en la cabecera.
  if (estado.seleccion === estado.sedePropia?.id) return {}
  return { [CABECERA_SEDE]: String(estado.seleccion) }
}

/** Mismo dato, aplicado sobre un objeto Headers (servicios con fetch propio). */
export function ponerCabeceraSede(headers: Headers): void {
  for (const [k, v] of Object.entries(cabecerasSede())) {
    if (!headers.has(k)) headers.set(k, v)
  }
}

const LECTURA = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * En "Todas" no se escribe: muestra el aviso y devuelve true si hay que
 * frenar el request.
 */
export function frenarEscrituraEnTodas(method: string | undefined): boolean {
  if (!esModoTodas() || LECTURA.has((method || 'GET').toUpperCase())) return false
  mostrarAvisoSede(AVISO_SOLO_LECTURA)
  return true
}

export function mostrarAvisoSede(texto: string): void {
  estado.aviso = texto
}

export function cerrarAvisoSede(): void {
  estado.aviso = null
}
