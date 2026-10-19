// src/views/tickets/estadisticasPorAsesor.ts
//
// Tabla "Estadísticas por asesor": una fila por asesor comercial a partir de
// GET /tickets/estadisticas (por_asesor), con los montos aplanados para poder
// ordenar por columna, y la fila de totales. También los conteos por estado
// de la línea resumen de la bandeja.

import type {
  BloqueEstadisticasTickets,
  EstadisticasTickets,
  TicketEstado,
} from '@/services/ticketsService'

export interface FilaAsesor {
  comercial_id: number
  nombre: string
  creados: number
  dentro: number
  fuera: number
  aprobados: number
  rechazados: number
  pendientes: number
  asesor_real: number
  asesor_proceso: number
  convenio_real: number
  convenio_proceso: number
  /** Asesor + convenio (exacto + estimado). */
  dejado: number
  dejado_asesor: number
  dejado_convenio: number
  dejado_exacto: number
  dejado_estimado: number
}

export type TotalesFilas = Omit<FilaAsesor, 'comercial_id' | 'nombre'>

const CAMPOS_NUMERICOS: (keyof TotalesFilas)[] = [
  'creados',
  'dentro',
  'fuera',
  'aprobados',
  'rechazados',
  'pendientes',
  'asesor_real',
  'asesor_proceso',
  'convenio_real',
  'convenio_proceso',
  'dejado',
  'dejado_asesor',
  'dejado_convenio',
  'dejado_exacto',
  'dejado_estimado',
]

function aFila(b: BloqueEstadisticasTickets, id: number, nombre: string): FilaAsesor {
  const d = b.dinero
  const dj = d.dejado_de_pagar
  return {
    comercial_id: id,
    nombre,
    creados: b.creados,
    dentro: b.dentro_ventana,
    fuera: b.fuera_ventana,
    aprobados: b.aprobados.total,
    rechazados: b.rechazados,
    pendientes: b.pendientes,
    asesor_real: d.comision_real.asesor,
    asesor_proceso: d.en_proceso.asesor,
    convenio_real: d.comision_real.convenio,
    convenio_proceso: d.en_proceso.convenio,
    dejado: dj.asesor + dj.convenio,
    dejado_asesor: dj.asesor,
    dejado_convenio: dj.convenio,
    dejado_exacto: dj.exacto.asesor + dj.exacto.convenio,
    dejado_estimado: dj.estimado.asesor + dj.estimado.convenio,
  }
}

/**
 * Filas de los asesores comerciales. Los demás (p. ej. el asesor convenio que
 * se datea a sí mismo, Caso 2) no salen en la tabla; `fuera` dice cuántos
 * tickets quedan por fuera para avisarlo en pantalla.
 */
export function filasPorAsesor(
  datos: Pick<EstadisticasTickets, 'por_asesor' | 'totales'>,
  esComercial: (comercialId: number) => boolean,
): { filas: FilaAsesor[]; ticketsFuera: number } {
  const filas = datos.por_asesor
    .filter((a) => esComercial(a.comercial_id))
    .map((a) => aFila(a, a.comercial_id, a.comercial_nombre ?? `#${a.comercial_id}`))
    .sort((x, y) => y.creados - x.creados || x.nombre.localeCompare(y.nombre))
  const enTabla = filas.reduce((acc, f) => acc + f.creados, 0)
  return { filas, ticketsFuera: datos.totales.creados - enTabla }
}

/** Fila de totales: suma de las filas mostradas (no del total general). */
export function totalesDeFilas(filas: FilaAsesor[]): TotalesFilas {
  const t = Object.fromEntries(CAMPOS_NUMERICOS.map((k) => [k, 0])) as TotalesFilas
  for (const f of filas) for (const k of CAMPOS_NUMERICOS) t[k] += f[k]
  for (const k of CAMPOS_NUMERICOS) t[k] = Math.round(t[k] * 100) / 100
  return t
}

export type ConteosEstado = Record<TicketEstado, number>

/**
 * Conteos por estado con los filtros de la bandeja. `contar(estado)` pide el
 * total de ese estado con los demás filtros. Si el filtro de estado ya está
 * puesto, los otros dos son 0 por definición y no se consultan.
 */
export async function conteosPorEstado(
  estadoFiltrado: TicketEstado | null,
  contar: (estado: TicketEstado) => Promise<number>,
): Promise<ConteosEstado> {
  const estados: TicketEstado[] = ['PENDIENTE', 'APROBADO', 'RECHAZADO']
  const valores = await Promise.all(
    estados.map((e) => (estadoFiltrado && e !== estadoFiltrado ? 0 : contar(e))),
  )
  return Object.fromEntries(estados.map((e, i) => [e, valores[i]])) as ConteosEstado
}
