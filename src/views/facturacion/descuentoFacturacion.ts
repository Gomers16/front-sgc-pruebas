// Reglas del descuento en el modal "Confirmar facturación" (FacturacionSubirTicket.vue).
// Funciones puras para poder probarlas sin montar la pantalla.

export interface DescuentoDetalle {
  id: number
  codigo: string
  nombre: string
  valorCarro: number
  valorMoto: number
}

// Descuentos con monto fijo según configuración: no se editan en caja.
export const CODIGOS_MONTO_FIJO = new Set([
  'INFORMATIVO_POLICIA',
  'INFORMATIVO_EMPLEADO',
  'AVANCE_PROPIETARIO',
])

// Avance en $0 es intencional: registra el avance sin reducir el precio.
export const CODIGOS_CERO_INTENCIONAL = new Set(['AVANCE'])

export function esMontoFijo(codigo: string | null | undefined): boolean {
  return !!codigo && CODIGOS_MONTO_FIJO.has(codigo)
}

/**
 * Detalle del descuento pre-marcado en el dateo. La cajera (OPERATIVO_TURNOS)
 * no puede leer GET /descuentos/:id, así que si esa lectura falla se toma de
 * la lista de activos. Si tampoco está ahí, `noCargado` bloquea la confirmación.
 */
export function resolverDescuentoPremarcado(
  descuentoId: number | null,
  detalleApi: DescuentoDetalle | null,
  activos: DescuentoDetalle[],
): { detalle: DescuentoDetalle | null; nombre: string; noCargado: boolean } {
  if (!descuentoId) return { detalle: null, nombre: '', noCargado: false }
  const detalle = detalleApi ?? activos.find((d) => d.id === descuentoId) ?? null
  return {
    detalle,
    nombre: detalle?.nombre ?? `Descuento #${descuentoId}`,
    noCargado: !detalle,
  }
}

export function montoMaximo(detalle: DescuentoDetalle | null, esMoto: boolean): number {
  if (!detalle) return 0
  return esMoto ? (detalle.valorMoto ?? 0) : (detalle.valorCarro ?? 0)
}

/**
 * Monto escrito por la cajera → número. Acepta separadores de miles con punto
 * o coma ("8.000", "8,000", "1.250.000") y decimales ("8000,5", "8.000,50",
 * "8,000.50"). Con un solo separador seguido de exactamente 3 dígitos se lee
 * como miles (son pesos). Devuelve null si el texto no es un monto.
 */
export function parseMontoCOP(raw: string | number | null | undefined): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  const s = String(raw ?? '')
    .replace(/[\s$]/g, '')
    .trim()
  if (!s) return null
  if (/^\d+$/.test(s)) return Number(s)
  // Miles con un solo tipo de separador: 8.000 · 8,000 · 1.250.000
  if (/^\d{1,3}(\.\d{3})+$/.test(s) || /^\d{1,3}(,\d{3})+$/.test(s)) {
    return Number(s.replace(/[.,]/g, ''))
  }
  // Miles y decimales: el último separador es el decimal.
  const m = /^(\d{1,3}(?:([.,])\d{3})*)([.,])(\d{1,2})$/.exec(s)
  if (m && (!m[2] || m[2] !== m[3])) {
    return Number(`${m[1].replace(/[.,]/g, '')}.${m[4]}`)
  }
  // Decimal sin miles: 8000.5 · 8000,50
  const d = /^(\d+)[.,](\d{1,2})$/.exec(s)
  if (d) return Number(`${d[1]}.${d[2]}`)
  return null
}

/**
 * Red de seguridad: un descuento en $0 solo pasa sin preguntar si es de los
 * que se registran sin reducción a propósito (Avance) o si su máximo ya es $0
 * (Obsequio, SOAT+RTM).
 */
export function pideConfirmarMontoCero(
  codigo: string | null | undefined,
  monto: number,
  maximo: number,
): boolean {
  if (monto > 0 || maximo <= 0) return false
  return !(codigo && CODIGOS_CERO_INTENCIONAL.has(codigo))
}
