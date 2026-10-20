import { describe, expect, it } from 'vitest'
import { etiquetaAjusteFactura } from '../comisionesService'

const formatCOP = (n: number) => `$${n.toLocaleString('es-CO')}`

describe('chip "Ajustada por edición de factura"', () => {
  it('muestra la diferencia con su signo', () => {
    expect(etiquetaAjusteFactura({ diferencia: -12980 }, formatCOP)).toBe(
      'Ajustada por edición de factura · −$12.980',
    )
    expect(etiquetaAjusteFactura({ diferencia: 4300 }, formatCOP)).toBe(
      'Ajustada por edición de factura · +$4.300',
    )
    expect(etiquetaAjusteFactura({ diferencia: 0 }, formatCOP)).toBe(
      'Ajustada por edición de factura · $0',
    )
  })
})
