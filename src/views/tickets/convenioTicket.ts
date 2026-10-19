// src/views/tickets/convenioTicket.ts
//
// Textos del convenio de un ticket: el nombre (etiquetaConvenio) en vez del id,
// y "sin convenio" cuando el ticket no tenía. Los nombres se resuelven aparte
// (convenio del detalle, GET /convenios/:id o la lista de activos).

/** id → etiqueta ("NOMBRE · NEGOCIO") de los convenios ya resueltos. */
export type NombresConvenio = ReadonlyMap<number, string>

export function nombreConvenio(id: unknown, nombres: NombresConvenio): string {
  if (id === null || id === undefined || id === '') return 'sin convenio'
  const n = Number(id)
  return nombres.get(n) ?? `convenio #${n}`
}

/** Aviso debajo del convenio cuando gerencia lo corrigió al aprobar. */
export function textoConvenioCorregido(original: number | null, nombres: NombresConvenio): string {
  const pedido = original === null ? 'sin convenio' : `con ${nombreConvenio(original, nombres)}`
  return `Corregido por gerencia al aprobar (se pidió ${pedido}).`
}

/** Detalle del evento CONVENIO_CORREGIDO de la línea de tiempo. */
export function textoEventoConvenioCorregido(
  anterior: unknown,
  nuevo: unknown,
  nombres: NombresConvenio,
): string {
  return `De ${nombreConvenio(anterior, nombres)} a ${nombreConvenio(nuevo, nombres)}`
}

/** Ids de convenio que hace falta nombrar: el original y los de los eventos de corrección. */
export function idsConvenioPorNombrar(
  original: number | null,
  eventos: { tipo: string; datos: Record<string, unknown> | null }[],
): number[] {
  const ids = new Set<number>()
  if (original !== null) ids.add(original)
  for (const e of eventos) {
    if (e.tipo !== 'CONVENIO_CORREGIDO') continue
    for (const k of ['convenio_anterior_id', 'convenio_nuevo_id']) {
      const v = e.datos?.[k]
      if (v !== null && v !== undefined && v !== '') ids.add(Number(v))
    }
  }
  return [...ids]
}
