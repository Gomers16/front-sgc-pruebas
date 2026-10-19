// src/views/facturacion/filtrosHistorico.ts
//
// Filtros de Facturación / Historial. Viven en la query de la URL (se
// conservan al recargar o al volver); acá se convierten entre la query, el
// estado del formulario y los params del API. Mismo esquema que
// src/views/tickets/filtrosTickets.ts.

import type { FactEstado, FiltrosListaParams } from '@/services/facturacion_service'

export interface FiltrosHistorial {
  /** "Fecha pago" (YYYY-MM-DD, hora de Bogotá) */
  fecha_desde: string | null
  fecha_hasta: string | null
  placa: string
  vendedor: string
  /** Id del descuento, o "ninguno" = sin descuento */
  descuento: number | 'ninguno' | null
  consecutivo: string
  consecutivo_exacto: boolean
  estado: FactEstado | null
  servicio_id: number | null
}

export const filtrosVacios = (): FiltrosHistorial => ({
  fecha_desde: null,
  fecha_hasta: null,
  placa: '',
  vendedor: '',
  descuento: null,
  consecutivo: '',
  consecutivo_exacto: false,
  estado: null,
  servicio_id: null,
})

export const ETIQUETAS_ESTADO: Record<FactEstado, string> = {
  CONFIRMADA: 'Confirmada',
  REVERTIDA: 'Revertida',
  LISTA_CONFIRMAR: 'Lista para confirmar',
  OCR_LISTO: 'OCR listo',
  BORRADOR: 'Borrador',
}

export const POR_PAGINA = [10, 20, 50, 100]
const POR_PAGINA_DEFECTO = 20
const ESTADOS = Object.keys(ETIQUETAS_ESTADO) as FactEstado[]
const FECHA = /^\d{4}-\d{2}-\d{2}$/
/** El backend ignora el vendedor con menos de 2 letras. */
export const VENDEDOR_MIN = 2

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
/** Placa / consecutivo: mayúsculas y sin espacios (como los guarda el backend). */
export const normalizarCodigo = (v: string | null | undefined) =>
  (v ?? '').toUpperCase().replace(/\s+/g, '')

/** Lee filtros y paginación de la query de la URL (valores inválidos se ignoran). */
export function filtrosDesdeQuery(q: Query): {
  filtros: FiltrosHistorial
  page: number
  perPage: number
} {
  const fecha = (k: string) => {
    const v = uno(q[k])
    return v && FECHA.test(v) ? v : null
  }
  const estado = uno(q.estado)?.toUpperCase() as FactEstado | undefined
  const descuento = uno(q.descuento)
  const perPage = entero(q.per_page)
  return {
    filtros: {
      fecha_desde: fecha('fecha_desde'),
      fecha_hasta: fecha('fecha_hasta'),
      placa: normalizarCodigo(uno(q.placa)),
      vendedor: uno(q.vendedor) ?? '',
      descuento: descuento === 'ninguno' ? 'ninguno' : entero(descuento),
      consecutivo: normalizarCodigo(uno(q.consecutivo)),
      consecutivo_exacto: uno(q.consecutivo_exacto) === '1',
      estado: estado && ESTADOS.includes(estado) ? estado : null,
      servicio_id: entero(q.servicio_id),
    },
    page: entero(q.page) ?? 1,
    perPage: perPage && POR_PAGINA.includes(perPage) ? perPage : POR_PAGINA_DEFECTO,
  }
}

/** Params del API (sin vacíos). */
export function filtrosAParams(f: FiltrosHistorial): FiltrosListaParams & { estado?: FactEstado } {
  const p: FiltrosListaParams & { estado?: FactEstado } = {}
  if (f.fecha_desde) p.fecha_pago_desde = f.fecha_desde
  if (f.fecha_hasta) p.fecha_pago_hasta = f.fecha_hasta
  const placa = normalizarCodigo(f.placa)
  if (placa) p.placa_contiene = placa
  if (f.vendedor.trim().length >= VENDEDOR_MIN) p.vendedor = f.vendedor.trim()
  if (f.descuento) p.descuento_id = f.descuento
  const consecutivo = normalizarCodigo(f.consecutivo)
  if (consecutivo) {
    p.consecutivo_descuento = consecutivo
    if (f.consecutivo_exacto) p.consecutivo_descuento_exacto = 1
  }
  if (f.estado) p.estado = f.estado
  if (f.servicio_id) p.servicio_id = f.servicio_id
  return p
}

/** Query de la URL: filtros + paginación (todo string, sin vacíos). */
export function filtrosAQuery(
  f: FiltrosHistorial,
  page = 1,
  perPage = POR_PAGINA_DEFECTO,
): Record<string, string> {
  const q: Record<string, string> = {}
  if (f.fecha_desde) q.fecha_desde = f.fecha_desde
  if (f.fecha_hasta) q.fecha_hasta = f.fecha_hasta
  const placa = normalizarCodigo(f.placa)
  if (placa) q.placa = placa
  if (f.vendedor.trim()) q.vendedor = f.vendedor.trim()
  if (f.descuento) q.descuento = String(f.descuento)
  const consecutivo = normalizarCodigo(f.consecutivo)
  if (consecutivo) {
    q.consecutivo = consecutivo
    if (f.consecutivo_exacto) q.consecutivo_exacto = '1'
  }
  if (f.estado) q.estado = f.estado
  if (f.servicio_id) q.servicio_id = String(f.servicio_id)
  if (page > 1) q.page = String(page)
  if (perPage !== POR_PAGINA_DEFECTO) q.per_page = String(perPage)
  return q
}

export type ClaveChip = Exclude<keyof FiltrosHistorial, 'consecutivo_exacto'>

export interface ChipFiltro {
  clave: ClaveChip
  texto: string
}

/** Chips de los filtros activos; `nombres` resuelve descuento y servicio por id. */
export function chipsFiltros(
  f: FiltrosHistorial,
  nombres: {
    descuento?: (id: number) => string | undefined
    servicio?: (id: number) => string | undefined
  } = {},
): ChipFiltro[] {
  const chips: ChipFiltro[] = []
  if (f.fecha_desde)
    chips.push({ clave: 'fecha_desde', texto: `Fecha pago desde ${f.fecha_desde}` })
  if (f.fecha_hasta)
    chips.push({ clave: 'fecha_hasta', texto: `Fecha pago hasta ${f.fecha_hasta}` })
  const placa = normalizarCodigo(f.placa)
  if (placa) chips.push({ clave: 'placa', texto: `Placa: ${placa}` })
  if (f.vendedor.trim().length >= VENDEDOR_MIN)
    chips.push({ clave: 'vendedor', texto: `Vendedor: ${f.vendedor.trim()}` })
  if (f.descuento === 'ninguno') chips.push({ clave: 'descuento', texto: 'Sin descuento' })
  else if (f.descuento) {
    chips.push({
      clave: 'descuento',
      texto: `Descuento: ${nombres.descuento?.(f.descuento) ?? `#${f.descuento}`}`,
    })
  }
  const consecutivo = normalizarCodigo(f.consecutivo)
  if (consecutivo) {
    chips.push({
      clave: 'consecutivo',
      texto: `Consec. descuento ${f.consecutivo_exacto ? '=' : 'contiene'} ${consecutivo}`,
    })
  }
  if (f.estado) chips.push({ clave: 'estado', texto: `Estado: ${ETIQUETAS_ESTADO[f.estado]}` })
  if (f.servicio_id) {
    chips.push({
      clave: 'servicio_id',
      texto: `Servicio: ${nombres.servicio?.(f.servicio_id) ?? `#${f.servicio_id}`}`,
    })
  }
  return chips
}

/** Quita un filtro (cerrar su chip). */
export function quitarFiltro(f: FiltrosHistorial, clave: ClaveChip): FiltrosHistorial {
  const vacio = filtrosVacios()
  const nuevo: FiltrosHistorial = { ...f, [clave]: vacio[clave] }
  if (clave === 'consecutivo') nuevo.consecutivo_exacto = false
  return nuevo
}

/** Nombre del archivo exportado. */
export function nombreExcel(f: FiltrosHistorial): string {
  return `Facturacion_${[f.fecha_desde, f.fecha_hasta].filter(Boolean).join('_') || 'todos'}.xlsx`
}
