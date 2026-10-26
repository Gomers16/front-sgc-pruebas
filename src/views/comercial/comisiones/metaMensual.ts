import type { MetaMensualRow } from '@/services/comisionesService'

// Meta del mes (Ficha Comercial y Comisiones → Metas): viene en pesos de
// "Meta Comercial por Asesor" (meta_comercial_asesor, asesor + mes + año). Sin
// fila el backend manda null y no hay meta — ni 0 ni un valor inventado.

export const SIN_META_DEFINIDA = 'Sin meta definida'

export function metaDelMes(item: MetaMensualRow): number | null {
  if (item.meta_global_rtm === null || item.meta_global_rtm === undefined) return null
  const meta = Number(item.meta_global_rtm)
  return Number.isFinite(meta) ? meta : null
}

export function avanceMeta(meta: number | null, totalFacturacion: number): number {
  if (meta === null || meta <= 0) return 0
  return (totalFacturacion / meta) * 100
}

export function faltanteMeta(meta: number | null, totalFacturacion: number): number {
  if (meta === null || meta <= 0) return 0
  return Math.max(0, meta - totalFacturacion)
}

/** Bono por meta: solo con meta definida (> 0), % configurado y meta alcanzada. */
export function bonoMeta(meta: number | null, totalFacturacion: number, porcentaje: number): number {
  if (meta === null || meta <= 0 || !porcentaje) return 0
  if (totalFacturacion < meta) return 0
  return (totalFacturacion * porcentaje) / 100
}
