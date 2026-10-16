import { describe, expect, it } from 'vitest'
import { resolucionComision, TEXTO_RESOLUCION_COMISION } from '../resolucionTicket'

describe('resolucionComision', () => {
  it('lee los TINYINT 0/1 del backend', () => {
    expect(resolucionComision({ conComision: 0, dentroVentana: 0 })).toBe('SIN_COMISION')
    expect(resolucionComision({ conComision: 1, dentroVentana: 0 })).toBe('CON_COMISION')
  })

  it('también acepta boolean (respuesta de aprobar)', () => {
    expect(resolucionComision({ conComision: false, dentroVentana: false })).toBe('SIN_COMISION')
    expect(resolucionComision({ conComision: true, dentroVentana: false })).toBe('CON_COMISION')
  })

  it('null dentro de ventana → comisión completa', () => {
    expect(resolucionComision({ conComision: null, dentroVentana: 1 })).toBe('DENTRO_VENTANA')
    expect(resolucionComision({ conComision: null, dentroVentana: true })).toBe('DENTRO_VENTANA')
  })

  it('null fuera de ventana → régimen anterior, nunca "comisión completa"', () => {
    const r = resolucionComision({ conComision: null, dentroVentana: 0 })
    expect(r).toBe('REGIMEN_ANTERIOR')
    expect(TEXTO_RESOLUCION_COMISION[r]).toBe('Aprobado (régimen anterior)')
  })
})
