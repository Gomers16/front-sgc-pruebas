import { describe, expect, it } from 'vitest'
import { resolucionComision, textoResolucion, TEXTO_RESOLUCION_COMISION } from '../resolucionTicket'

const fuera = { dentroVentana: 0, convenioId: 40 }

describe('resolucionComision', () => {
  it('lee los flags nuevos como TINYINT 0/1', () => {
    expect(
      resolucionComision({
        ...fuera,
        conComision: 1,
        conComisionAsesor: 1,
        conComisionConvenio: 1,
      }),
    ).toBe('CON_COMISION')
    expect(
      resolucionComision({
        ...fuera,
        conComision: 0,
        conComisionAsesor: 0,
        conComisionConvenio: 1,
      }),
    ).toBe('SIN_COMISION_ASESOR')
    expect(
      resolucionComision({
        ...fuera,
        conComision: 1,
        conComisionAsesor: 1,
        conComisionConvenio: 0,
      }),
    ).toBe('SIN_COMISION_CONVENIO')
    expect(
      resolucionComision({
        ...fuera,
        conComision: 0,
        conComisionAsesor: 0,
        conComisionConvenio: 0,
      }),
    ).toBe('SIN_COMISION_NINGUNO')
  })

  it('también acepta boolean (respuesta de aprobar)', () => {
    expect(
      resolucionComision({
        ...fuera,
        conComision: false,
        conComisionAsesor: false,
        conComisionConvenio: true,
      }),
    ).toBe('SIN_COMISION_ASESOR')
    expect(
      resolucionComision({
        ...fuera,
        conComision: true,
        conComisionAsesor: true,
        conComisionConvenio: false,
      }),
    ).toBe('SIN_COMISION_CONVENIO')
  })

  it('Caso 1: convenio null no cuenta como "sin comisión convenio"', () => {
    expect(
      resolucionComision({
        ...fuera,
        convenioId: null,
        conComision: 0,
        conComisionAsesor: 0,
        conComisionConvenio: null,
      }),
    ).toBe('SIN_COMISION_ASESOR')
    expect(
      resolucionComision({
        ...fuera,
        convenioId: null,
        conComision: 1,
        conComisionAsesor: 1,
        conComisionConvenio: null,
      }),
    ).toBe('CON_COMISION')
  })

  it('aprobado por producción local (solo con_comision): asesor = con_comision y el convenio cobra', () => {
    expect(
      resolucionComision({
        ...fuera,
        conComision: 0,
        conComisionAsesor: null,
        conComisionConvenio: null,
      }),
    ).toBe('SIN_COMISION_ASESOR')
    expect(resolucionComision({ ...fuera, conComision: 1 })).toBe('CON_COMISION')
  })

  it('dentro de ventana → comisión completa', () => {
    expect(resolucionComision({ dentroVentana: 1, conComision: null })).toBe('DENTRO_VENTANA')
    expect(resolucionComision({ dentroVentana: true, conComision: null })).toBe('DENTRO_VENTANA')
  })

  it('fuera de ventana sin ningún flag → régimen anterior, nunca "comisión completa"', () => {
    const r = resolucionComision({
      ...fuera,
      conComision: null,
      conComisionAsesor: null,
      conComisionConvenio: null,
    })
    expect(r).toBe('REGIMEN_ANTERIOR')
    expect(TEXTO_RESOLUCION_COMISION[r]).toBe('Aprobado (régimen anterior)')
  })
})

describe('textoResolucion', () => {
  it('Caso 3 desglosa quién pierde la comisión', () => {
    expect(textoResolucion('SIN_COMISION_CONVENIO', 'CONVENIO_COMERCIAL')).toBe(
      'Aprobado sin comisión para el convenio',
    )
  })

  it('Caso 1 y Caso 2 solo dicen "sin comisión"', () => {
    expect(textoResolucion('SIN_COMISION_ASESOR', 'SIN_CONVENIO')).toBe('Aprobado sin comisión')
    expect(textoResolucion('SIN_COMISION_NINGUNO', 'CONVENIO_SELF')).toBe('Aprobado sin comisión')
    expect(textoResolucion('CON_COMISION', 'CONVENIO_SELF')).toBe('Aprobado con comisión')
  })
})
