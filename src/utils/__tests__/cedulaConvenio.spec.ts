import { describe, expect, it } from 'vitest'
import { CEDULA_PENDIENTE, formatearCedulaConvenio } from '../cedulaConvenio'

describe('formatearCedulaConvenio', () => {
  it('cédula real: tal cual, como texto (conserva ceros a la izquierda)', () => {
    expect(formatearCedulaConvenio('93366588')).toBe('93366588')
    expect(formatearCedulaConvenio('0012345678')).toBe('0012345678')
    expect(formatearCedulaConvenio('  1110514509 ')).toBe('1110514509')
  })

  it('cédula inventada por el seeder (9999 + 6 dígitos) → Pendiente', () => {
    expect(formatearCedulaConvenio('9999000001')).toBe(CEDULA_PENDIENTE)
    expect(formatearCedulaConvenio('9999999901')).toBe(CEDULA_PENDIENTE)
  })

  it('9999 que no es exactamente 9999 + 6 dígitos se muestra tal cual', () => {
    expect(formatearCedulaConvenio('99990000011')).toBe('99990000011')
    expect(formatearCedulaConvenio('999900001')).toBe('999900001')
  })

  it('vacía o nula con convenio → Pendiente', () => {
    expect(formatearCedulaConvenio(null)).toBe(CEDULA_PENDIENTE)
    expect(formatearCedulaConvenio(undefined)).toBe(CEDULA_PENDIENTE)
    expect(formatearCedulaConvenio('   ')).toBe(CEDULA_PENDIENTE)
  })

  it('sin convenio → "—", aunque venga algún valor', () => {
    expect(formatearCedulaConvenio(null, false)).toBe('—')
    expect(formatearCedulaConvenio('93366588', false)).toBe('—')
  })
})
