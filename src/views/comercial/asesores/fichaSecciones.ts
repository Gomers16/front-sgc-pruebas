// Qué muestra FichaComercialAsesor.vue según el tipo del agente visto (puro,
// con tests en __tests__/fichaSecciones.spec.ts).
//
// - Comercial, convenio u otro: exactamente lo de siempre.
// - ASESOR_TELEMERCADEO (la vea él, embebida en "Mi gestión", o gerencia):
//   sin nada de comisiones (KPIs, historial de pagos, columnas, montos), sin
//   meta en pesos, sin pestañas Convenios ni New-dateos y sin crear/re-datear
//   desde la ficha (eso no pasa por la gestión: sin telemercadeo_gestion_id,
//   sin límite de seguimientos ni canal TELE forzado). Las comisiones de
//   telemercadeo están sin definir.
import {
  esAsesorTelemercadeo,
  TIPO_AGENTE_TELE,
  type UsuarioPermisos,
} from '@/utils/permisosTelemercadeo'

export interface SeccionesFicha {
  modoTelemercadeo: boolean
  /** KPIs Total generado, Pendientes, Aprobadas, Pagadas, Saldo e Historial de pagos. */
  kpisComisiones: boolean
  /** Bloque "🎯 Metas mensuales" (meta en pesos de meta_comercial_asesor). */
  metaComercial: boolean
  tabConvenios: boolean
  tabNewDateos: boolean
  /** Columnas Comisión / Incentivo y Estado pago, y el monto total de la pestaña Dateos. */
  comisionesEnDateos: boolean
  /** Botón "Crear dateo" y re-datear desde la pestaña Dateos. */
  crearYRedatearDateos: boolean
  /** Rótulo del KPI de dateos exitosos. */
  kpiDateosExitosos: { titulo: string; sub: string }
}

const norm = (t?: string | null) => (t ?? '').toString().toUpperCase().trim()

export const esTipoTelemercadeo = (tipo?: string | null) => norm(tipo) === TIPO_AGENTE_TELE

/** Tipo asumido mientras carga la ficha embebida en "Mi gestión" (siempre de Telemercadeo). */
export const TIPO_TELE_EMBEBIDA = TIPO_AGENTE_TELE

/** Secciones visibles para el tipo del agente cuya ficha se ve. */
export function seccionesFicha(tipoAgente?: string | null): SeccionesFicha {
  const t = norm(tipoAgente)
  if (t === TIPO_AGENTE_TELE) {
    return {
      modoTelemercadeo: true,
      kpisComisiones: false,
      metaComercial: false,
      tabConvenios: false,
      tabNewDateos: false,
      comisionesEnDateos: false,
      crearYRedatearDateos: false,
      kpiDateosExitosos: {
        titulo: 'Dateos exitosos',
        sub: 'todos sus dateos · por fecha del dateo',
      },
    }
  }
  // Modo normal: mismas condiciones que tenía la ficha antes
  // (esAsesorComercial = tipo contiene COMERCIAL; Convenios oculto al convenio).
  return {
    modoTelemercadeo: false,
    kpisComisiones: true,
    metaComercial: t.includes('COMERCIAL'),
    tabConvenios: !t.includes('CONVENIO'),
    tabNewDateos: true,
    comisionesEnDateos: true,
    crearYRedatearDateos: true,
    kpiDateosExitosos: { titulo: 'Dateos exitosos', sub: 'en el rango' },
  }
}

/** Claves de columnas de comisión en la tabla de dateos de la ficha. */
export const COLUMNAS_COMISION_DATEOS = ['comisionAsesor', 'estadoComision'] as const

/** Quita las columnas de comisión cuando la sección no aplica. */
export function columnasDateos<T extends { key?: string }>(
  headers: readonly T[],
  s: SeccionesFicha,
): T[] {
  if (s.comisionesEnDateos) return [...headers]
  return headers.filter((h) => !(COLUMNAS_COMISION_DATEOS as readonly string[]).includes(h.key ?? ''))
}

/**
 * ¿Redirigir la ruta de la ficha a "Mi gestión"? Solo si quien está
 * conectado es asesor de Telemercadeo y abre SU propia ficha (sin id o con
 * su propio agente). Gerencia y los demás roles nunca se redirigen.
 */
export function redirigirFichaAMiGestion(
  user: (UsuarioPermisos & { agenteId?: number | null }) | null | undefined,
  idRuta: unknown,
): boolean {
  if (!esAsesorTelemercadeo(user)) return false
  const raw = Array.isArray(idRuta) ? idRuta[0] : idRuta
  if (raw === undefined || raw === null || raw === '') return true
  return Number(raw) === Number(user?.agenteId)
}
