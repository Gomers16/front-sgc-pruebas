// Catálogo de canales. Cada uno lleva una etiqueta visible en español y un
// color propio (variable definida en styles/tokens.css) para que el ojo los
// distinga sin tener que leer el texto.
//
// tieneTurnoImpreso indica si ese canal normalmente trae un número de turno
// (RTM sí, SOAT y PREVENTIVA no). Es solo informativo: el dato real de si hay
// turno o no lo decide el back en cada registro (turno: string | null).
//
// codigoCorto es la versión en texto plano que usan las dos tablas (cola de
// la izquierda e histórico de "Llamando ahora"): "Preventiva" completo
// obligaba a achicar la columna entera por un solo canal. Vive acá, y no en
// cada componente, para que las dos tablas no diverjan.

export interface CanalInfo {
  etiqueta: string
  codigoCorto: string
  color: string
  tieneTurnoImpreso: boolean
}

export const CANALES: Record<string, CanalInfo> = {
  RTM: {
    etiqueta: 'RTM',
    codigoCorto: 'RTM',
    color: 'var(--canal-rtm)',
    tieneTurnoImpreso: true,
  },
  SOAT: {
    etiqueta: 'SOAT',
    codigoCorto: 'SOAT',
    color: 'var(--canal-soat)',
    tieneTurnoImpreso: false,
  },
  PREVENTIVA: {
    etiqueta: 'Preventiva',
    codigoCorto: 'PREV',
    color: 'var(--canal-preventiva)',
    tieneTurnoImpreso: false,
  },
  PERI: {
    etiqueta: 'Peritaje',
    codigoCorto: 'PERI',
    color: 'var(--canal-peri)',
    tieneTurnoImpreso: false,
  },
}

export function obtenerCanal(codigo: string): CanalInfo {
  return (
    CANALES[codigo] ?? {
      etiqueta: codigo,
      codigoCorto: codigo,
      color: 'var(--gris-azulado)',
      tieneTurnoImpreso: false,
    }
  )
}

// "RTM 7", "PREV 9", o solo el código si el registro no trae turno.
export function textoTurnoCorto(canal: string, turno: string | null | undefined): string {
  const codigo = obtenerCanal(canal).codigoCorto
  return turno ? `${codigo} ${turno}` : codigo
}
