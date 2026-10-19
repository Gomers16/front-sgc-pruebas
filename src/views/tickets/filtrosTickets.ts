// src/views/tickets/filtrosTickets.ts
//
// Filtros de la bandeja de tickets (y de estadísticas/exportar). Viven en la
// query de la URL para que se conserven al volver desde el detalle; acá se
// convierten entre la query, el estado del formulario y los params del API.

import type { DecisionComision, ListTicketsParams, TicketEstado } from '@/services/ticketsService'

export interface FiltrosBandeja {
  fecha_desde: string | null
  fecha_hasta: string | null
  comercial_id: number | null
  estado: TicketEstado | null
  ventana: 'dentro' | 'fuera' | null
  placa: string
  /** Número visible del turno (el del día), no el id interno. */
  turno_numero: number | null
  decision: DecisionComision | null
}

export const filtrosVacios = (): FiltrosBandeja => ({
  fecha_desde: null,
  fecha_hasta: null,
  comercial_id: null,
  estado: null,
  ventana: null,
  placa: '',
  turno_numero: null,
  decision: null,
})

export const ETIQUETAS_ESTADO: Record<TicketEstado, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
}

export const ETIQUETAS_DECISION: Record<DecisionComision, string> = {
  con: 'Con comisión',
  sin_asesor: 'Sin comisión asesor',
  sin_convenio: 'Sin comisión convenio',
  sin_ninguno: 'Sin comisión (ninguno)',
  regimen_anterior: 'Régimen anterior',
}

const ESTADOS = Object.keys(ETIQUETAS_ESTADO) as TicketEstado[]
const DECISIONES = Object.keys(ETIQUETAS_DECISION) as DecisionComision[]
const FECHA = /^\d{4}-\d{2}-\d{2}$/

type Query = Record<string, unknown>

const uno = (v: unknown): string | null => {
  const x = Array.isArray(v) ? v[0] : v
  return x === undefined || x === null || String(x).trim() === '' ? null : String(x).trim()
}
const entero = (v: unknown): number | null => {
  const s = uno(v)
  const n = s === null ? NaN : Number(s)
  return Number.isInteger(n) && n > 0 ? n : null
}

/** Lee filtros y paginación de la query de la URL (valores inválidos se ignoran). */
export function filtrosDesdeQuery(q: Query): {
  filtros: FiltrosBandeja
  page: number
  perPage: number
} {
  const fecha = (k: string) => {
    const v = uno(q[k])
    return v && FECHA.test(v) ? v : null
  }
  const estado = uno(q.estado)?.toUpperCase() as TicketEstado | undefined
  const ventana = uno(q.ventana)
  const decision = uno(q.decision) as DecisionComision | null
  return {
    filtros: {
      fecha_desde: fecha('fecha_desde'),
      fecha_hasta: fecha('fecha_hasta'),
      comercial_id: entero(q.comercial_id),
      estado: estado && ESTADOS.includes(estado) ? estado : null,
      ventana: ventana === 'dentro' || ventana === 'fuera' ? ventana : null,
      placa: uno(q.placa)?.toUpperCase() ?? '',
      turno_numero: entero(q.turno_numero),
      decision: decision && DECISIONES.includes(decision) ? decision : null,
    },
    page: entero(q.page) ?? 1,
    perPage: entero(q.per_page) ?? 25,
  }
}

/** Params del API (sin vacíos). */
export function filtrosAParams(f: FiltrosBandeja): ListTicketsParams {
  const p: ListTicketsParams = {}
  if (f.fecha_desde) p.fecha_desde = f.fecha_desde
  if (f.fecha_hasta) p.fecha_hasta = f.fecha_hasta
  if (f.comercial_id) p.comercial_id = f.comercial_id
  if (f.estado) p.estado = f.estado
  if (f.ventana) p.ventana = f.ventana
  if (f.placa.trim()) p.placa = f.placa.trim().toUpperCase()
  if (f.turno_numero) p.turno_numero = f.turno_numero
  if (f.decision) p.decision = f.decision
  return p
}

/** Query de la URL: filtros + paginación (todo string, sin vacíos). */
export function filtrosAQuery(f: FiltrosBandeja, page = 1, perPage = 25): Record<string, string> {
  const q: Record<string, string> = {}
  for (const [k, v] of Object.entries(filtrosAParams(f))) q[k] = String(v)
  if (page > 1) q.page = String(page)
  if (perPage !== 25) q.per_page = String(perPage)
  return q
}

export interface ChipFiltro {
  clave: keyof FiltrosBandeja
  texto: string
}

/** Chips de los filtros activos; `nombres` resuelve el asesor por id. */
export function chipsFiltros(
  f: FiltrosBandeja,
  nombres: { comercial?: (id: number) => string | undefined } = {},
): ChipFiltro[] {
  const chips: ChipFiltro[] = []
  if (f.fecha_desde) chips.push({ clave: 'fecha_desde', texto: `Desde ${f.fecha_desde}` })
  if (f.fecha_hasta) chips.push({ clave: 'fecha_hasta', texto: `Hasta ${f.fecha_hasta}` })
  if (f.comercial_id) {
    chips.push({
      clave: 'comercial_id',
      texto: `Asesor: ${nombres.comercial?.(f.comercial_id) ?? `#${f.comercial_id}`}`,
    })
  }
  if (f.estado) chips.push({ clave: 'estado', texto: `Estado: ${ETIQUETAS_ESTADO[f.estado]}` })
  if (f.ventana) {
    chips.push({
      clave: 'ventana',
      texto: f.ventana === 'dentro' ? 'Dentro de ventana' : 'Fuera de ventana',
    })
  }
  if (f.placa.trim())
    chips.push({ clave: 'placa', texto: `Placa: ${f.placa.trim().toUpperCase()}` })
  if (f.turno_numero) chips.push({ clave: 'turno_numero', texto: `Turno N° ${f.turno_numero}` })
  if (f.decision) chips.push({ clave: 'decision', texto: ETIQUETAS_DECISION[f.decision] })
  return chips
}

/** Filtros que también aplican a la pestaña de estadísticas (el resto es solo de la bandeja). */
export const FILTROS_ESTADISTICAS: (keyof FiltrosBandeja)[] = [
  'fecha_desde',
  'fecha_hasta',
  'comercial_id',
  'ventana',
  'estado',
]

/** Params de GET /tickets/estadisticas: solo los filtros que aplican a estadísticas. */
export function filtrosEstadisticasAParams(f: FiltrosBandeja): ListTicketsParams {
  const todos = filtrosAParams(f)
  return Object.fromEntries(
    Object.entries(todos).filter(([k]) => (FILTROS_ESTADISTICAS as string[]).includes(k)),
  ) as ListTicketsParams
}

/** Quita un filtro (el que cierra su chip). */
export function quitarFiltro(f: FiltrosBandeja, clave: keyof FiltrosBandeja): FiltrosBandeja {
  return { ...f, [clave]: filtrosVacios()[clave] }
}
