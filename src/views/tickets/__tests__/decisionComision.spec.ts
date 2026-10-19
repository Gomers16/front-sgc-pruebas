import { describe, expect, it } from 'vitest'
import {
  casoConConvenioCorregido,
  COLOR_NIVEL,
  decisionAprobacion,
  mensajeErrorResolucion,
} from '../decisionComision'

const combos = [
  [true, true],
  [false, true],
  [true, false],
  [false, false],
] as const

describe('decisionAprobacion (interruptores Cobra / No cobra)', () => {
  it('Caso 3: las 4 combinaciones, mismo body que antes, resumen y riesgo', () => {
    const r = combos.map(([a, c]) => decisionAprobacion('CONVENIO_COMERCIAL', a, c))
    expect(r.map((x) => x.body)).toEqual([
      { con_comision_asesor: true, con_comision_convenio: true },
      { con_comision_asesor: false, con_comision_convenio: true },
      { con_comision_asesor: true, con_comision_convenio: false },
      { con_comision_asesor: false, con_comision_convenio: false },
    ])
    expect(r.map((x) => x.resumen)).toEqual([
      'El asesor y el convenio cobran normal',
      'El asesor pierde su comisión; el convenio cobra normal',
      'El convenio pierde su comisión; el asesor cobra normal',
      'Ni el asesor ni el convenio cobran',
    ])
    expect(r.map((x) => x.nivel)).toEqual(['todos', 'parcial', 'parcial', 'ninguno'])
    expect(r.map((x) => COLOR_NIVEL[x.nivel])).toEqual(['blue-grey', 'warning', 'warning', 'error'])
  })

  it('Caso 2: un solo interruptor manda los dos flags iguales (el de convenio se ignora)', () => {
    for (const [a, c] of combos) {
      const d = decisionAprobacion('CONVENIO_SELF', a, c)
      expect(d.body).toEqual({ con_comision_asesor: a, con_comision_convenio: a })
      expect(d.nivel).toBe(a ? 'todos' : 'ninguno')
    }
    expect(decisionAprobacion('CONVENIO_SELF', false, true).resumen).toContain(
      'como asesor y como convenio',
    )
  })

  it('Caso 1 (o desconocido): solo el flag del asesor, nunca el de convenio', () => {
    for (const caso of ['SIN_CONVENIO', null] as const) {
      for (const [a, c] of combos) {
        const d = decisionAprobacion(caso, a, c)
        expect(d.body).toEqual({ con_comision_asesor: a })
        expect(d.nivel).toBe(a ? 'todos' : 'ninguno')
      }
    }
  })

  it('el diálogo repite el resumen; con pérdida cambia el título', () => {
    const con = decisionAprobacion('CONVENIO_COMERCIAL', true, true)
    const sin = decisionAprobacion('CONVENIO_COMERCIAL', true, false)
    expect(con.titulo).toBe('Aprobar con comisión')
    expect(sin.titulo).toBe('Aprobar con pérdida de comisión')
    expect(sin.mensaje.startsWith(sin.resumen)).toBe(true)
    expect(sin.mensaje).toContain('No se puede deshacer')
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
