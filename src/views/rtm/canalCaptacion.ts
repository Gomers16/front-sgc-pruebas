// src/views/rtm/canalCaptacion.ts
// Desplegable "¿Cómo se enteró de nosotros?" de Crear/Editar turno: opciones,
// mapeo opción ↔ canal del backend y qué canal/asesor se envía al crear.

export type MedioEntero = 'redes_sociales' | 'google_ads' | 'call_center' | 'fachada' | 'asesor'
export type CanalAtrib = 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES' | 'GOOGLE_ADS'

export const medioEnteroItems: ReadonlyArray<{ title: string; value: MedioEntero }> = [
  { title: 'Redes Sociales', value: 'redes_sociales' },
  { title: 'Call Center', value: 'call_center' },
  { title: 'Fachada', value: 'fachada' },
  { title: 'Asesor', value: 'asesor' },
  { title: 'Google ADS', value: 'google_ads' },
] as const

/** Canal del backend → opción del desplegable (desconocido → Fachada). */
export function canalToMedio(canal: string | null | undefined): MedioEntero {
  const c = (canal || '').toUpperCase()
  if (c === 'REDES') return 'redes_sociales'
  if (c === 'GOOGLE_ADS') return 'google_ads'
  if (c === 'TELE') return 'call_center'
  if (c === 'ASESOR') return 'asesor'
  return 'fachada'
}

/** Opción del desplegable → canal del backend (vacío → FACHADA). */
export function medioToCanal(medio: MedioEntero | null | undefined): CanalAtrib {
  switch (medio) {
    case 'redes_sociales': return 'REDES'
    case 'google_ads':     return 'GOOGLE_ADS'
    case 'call_center':    return 'TELE'
    case 'asesor':         return 'ASESOR'
    case 'fachada':
    default:               return 'FACHADA'
  }
}

/**
 * Lo que el operador deja elegido en el desplegable es lo que se guarda,
 * aunque la búsqueda haya sugerido otro canal. El asesor sugerido solo viaja
 * si el operador mantuvo el canal sugerido (si lo cambió, ese asesor ya no
 * corresponde).
 */
export function resolverCaptacion(
  medio: MedioEntero | null | undefined,
  sugerido: { canal?: CanalAtrib | null; agenteId?: number | null } = {}
): { canal: CanalAtrib; agenteCaptacionId: number | null } {
  const canal = medioToCanal(medio)
  const mantuvoSugerencia = !!sugerido.canal && sugerido.canal === canal
  return { canal, agenteCaptacionId: mantuvoSugerencia ? (sugerido.agenteId ?? null) : null }
}
