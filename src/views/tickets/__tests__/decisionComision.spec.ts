import { describe, expect, it } from 'vitest'
import {
  casoConConvenioCorregido,
  mensajeErrorResolucion,
  opcionesAprobacion,
} from '../decisionComision'

const claves = (o: { clave: string }[]) => o.map((x) => x.clave)

describe('opcionesAprobacion', () => {
  it('dentro de ventana: un solo "Aprobar" con body vacío, sea cual sea el caso', () => {
    for (const caso of ['SIN_CONVENIO', 'CONVENIO_SELF', 'CONVENIO_COMERCIAL'] as const) {
      const o = opcionesAprobacion(caso, true)
      expect(claves(o)).toEqual(['aprobar'])
      expect(o[0].body).toEqual({})
    }
  })

  it('Caso 1: con / sin, solo con el flag del asesor', () => {
    const o = opcionesAprobacion('SIN_CONVENIO', false)
    expect(claves(o)).toEqual(['con', 'sin'])
    expect(o.map((x) => x.body)).toEqual([
      { con_comision_asesor: true },
      { con_comision_asesor: false },
    ])
    expect(o[1].mensaje).toContain('ASESOR pierde')
  })

  it('Caso 2: con / sin, con los dos flags iguales', () => {
    const o = opcionesAprobacion('CONVENIO_SELF', false)
    expect(claves(o)).toEqual(['con', 'sin'])
    for (const x of o) expect(x.body.con_comision_asesor).toBe(x.body.con_comision_convenio)
    expect(o[1].mensaje).toContain('misma persona')
  })

  it('Caso 3: las 4 combinaciones y cada diálogo dice quién pierde', () => {
    const o = opcionesAprobacion('CONVENIO_COMERCIAL', false)
    expect(claves(o)).toEqual(['con', 'sin_asesor', 'sin_convenio', 'sin_ninguno'])
    expect(o.map((x) => [x.body.con_comision_asesor, x.body.con_comision_convenio])).toEqual([
      [true, true],
      [false, true],
      [true, false],
      [false, false],
    ])
    expect(o[1].mensaje).toContain('ASESOR pierde')
    expect(o[2].mensaje).toContain('CONVENIO pierde')
    expect(o[3].mensaje).toContain('ASESOR y el CONVENIO pierden')
  })

  it('caso desconocido se trata como Caso 1 (nunca manda flag de convenio)', () => {
    expect(opcionesAprobacion(null, false).every((x) => !('con_comision_convenio' in x.body))).toBe(
      true,
    )
  })
})

describe('casoConConvenioCorregido', () => {
  it('sin corrección queda el caso del backend', () => {
    expect(casoConConvenioCorregido('CONVENIO_COMERCIAL', undefined)).toBe('CONVENIO_COMERCIAL')
  })
  it('quitar el convenio → Caso 1; ponerle uno a un comercial → Caso 3', () => {
    expect(casoConConvenioCorregido('CONVENIO_COMERCIAL', null)).toBe('SIN_CONVENIO')
    expect(casoConConvenioCorregido('SIN_CONVENIO', 40)).toBe('CONVENIO_COMERCIAL')
  })
  it('el asesor convenio no cambia de caso', () => {
    expect(casoConConvenioCorregido('CONVENIO_SELF', null)).toBe('CONVENIO_SELF')
  })
})

describe('mensajeErrorResolucion', () => {
  it('409 TICKET_YA_RESUELTO', () => {
    expect(mensajeErrorResolucion(409, { code: 'TICKET_YA_RESUELTO' }, 'x')).toContain(
      'ya fue resuelto',
    )
  })
  it('400 COMBINACION_COMISION_INVALIDA incluye el motivo del backend', () => {
    const m = mensajeErrorResolucion(
      400,
      { code: 'COMBINACION_COMISION_INVALIDA', message: 'no aplica' },
      'x',
    )
    expect(m).toContain('no aplica')
  })
  it('otro error: mensaje del backend o el por defecto', () => {
    expect(mensajeErrorResolucion(500, { message: 'boom' }, 'x')).toBe('boom')
    expect(mensajeErrorResolucion(undefined, undefined, 'por defecto')).toBe('por defecto')
  })
})
