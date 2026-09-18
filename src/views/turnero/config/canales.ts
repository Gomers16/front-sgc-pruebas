// Catálogo de canales. Cada uno lleva una etiqueta visible en español y un
// color propio (variable definida en styles/tokens.css) para que el ojo los
// distinga sin tener que leer el texto.
//
// tieneTurnoImpreso indica si ese canal normalmente trae un número de turno
// (RTM sí, SOAT y PREVENTIVA no). Es solo informativo: el dato real de si hay
// turno o no lo decide el back en cada registro (turno: string | null).

export interface CanalInfo {
  etiqueta: string
  color: string
  tieneTurnoImpreso: boolean
}

export const CANALES: Record<string, CanalInfo> = {
  RTM: {
    etiqueta: 'RTM',
    color: 'var(--canal-rtm)',
    tieneTurnoImpreso: true,
  },
  SOAT: {
    etiqueta: 'SOAT',
    color: 'var(--canal-soat)',
    tieneTurnoImpreso: false,
  },
  PREVENTIVA: {
    etiqueta: 'Preventiva',
    color: 'var(--canal-preventiva)',
    tieneTurnoImpreso: false,
  },
  PERI: {
    etiqueta: 'Peritaje',
    color: 'var(--canal-peri)',
    tieneTurnoImpreso: false,
  },
}

export function obtenerCanal(codigo: string): CanalInfo {
  return CANALES[codigo] ?? { etiqueta: codigo, color: 'var(--gris-azulado)', tieneTurnoImpreso: false }
}
