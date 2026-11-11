// Textos de meta por asesor en el Súper Informe (mismo criterio que el PDF
// del backend: textoMetaPesos / textoMetaVehiculos).
import type { SuperInformeMetaComercialAsesor } from '@/services/reportesAdminService'

type AsesorMeta = Pick<SuperInformeMetaComercialAsesor, 'meta_pesos' | 'meta_vehiculos' | 'tiene_meta'>

/** "Sin meta" si no hay fila; "Incompleta" si falta la fila de algún mes del periodo. */
export function textoMetaPesos(a: AsesorMeta, formato: (n: number) => string): string {
  if (a.meta_pesos !== null) return formato(a.meta_pesos)
  return a.tiene_meta ? 'Incompleta' : 'Sin meta'
}

/** "Sin meta" solo si no hay fila; "—" si hay fila sin meta en unidades. */
export function textoMetaVehiculos(a: AsesorMeta, formato: (n: number) => string): string {
  if (a.meta_vehiculos !== null) return formato(a.meta_vehiculos)
  return a.tiene_meta ? '—' : 'Sin meta'
}
