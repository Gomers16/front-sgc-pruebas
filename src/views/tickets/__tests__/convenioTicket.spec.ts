import { describe, expect, it } from 'vitest'
import {
  idsConvenioPorNombrar,
  nombreConvenio,
  textoConvenioCorregido,
  textoEventoConvenioCorregido,
} from '../convenioTicket'
import { etiquetaDecision } from '../filtrosTickets'

const nombres = new Map([
  [1449, 'QAT ELENA CONVENIO TALLER'],
  [1450, 'QAT FABIO CONVENIO · PARQUEADERO'],
])

describe('convenio del ticket por nombre', () => {
  it('nombre del convenio, "sin convenio" si no hay y el id solo como último recurso', () => {
    expect(nombreConvenio(1449, nombres)).toBe('QAT ELENA CONVENIO TALLER')
    expect(nombreConvenio('1450', nombres)).toBe('QAT FABIO CONVENIO · PARQUEADERO')
    expect(nombreConvenio(null, nombres)).toBe('sin convenio')
    expect(nombreConvenio(undefined, nombres)).toBe('sin convenio')
    expect(nombreConvenio(77, nombres)).toBe('convenio #77')
  })

  it('aviso de convenio corregido: pedido sin convenio o con uno', () => {
    expect(textoConvenioCorregido(null, nombres)).toBe(
      'Corregido por gerencia al aprobar (se pidió sin convenio).',
    )
    expect(textoConvenioCorregido(1450, nombres)).toBe(
      'Corregido por gerencia al aprobar (se pidió con QAT FABIO CONVENIO · PARQUEADERO).',
    )
  })

  it('evento CONVENIO_CORREGIDO de la línea de tiempo', () => {
    expect(textoEventoConvenioCorregido(null, 1449, nombres)).toBe(
      'De sin convenio a QAT ELENA CONVENIO TALLER',
    )
    expect(textoEventoConvenioCorregido(1449, null, nombres)).toBe(
      'De QAT ELENA CONVENIO TALLER a sin convenio',
    )
  })

  it('ids por nombrar: el original y los de los eventos de corrección, sin repetir', () => {
    const eventos = [
      { tipo: 'CREADO', datos: { convenio_id: 9 } },
      {
        tipo: 'CONVENIO_CORREGIDO',
        datos: { convenio_anterior_id: null, convenio_nuevo_id: 1449 },
      },
      {
        tipo: 'CONVENIO_CORREGIDO',
        datos: { convenio_anterior_id: 1449, convenio_nuevo_id: 1450 },
      },
    ]
    expect(idsConvenioPorNombrar(null, eventos)).toEqual([1449, 1450])
    expect(idsConvenioPorNombrar(1450, [])).toEqual([1450])
  })
})

describe('etiquetaDecision (bandeja)', () => {
  it('Caso 2: cualquier "sin comisión" es "Sin comisión"', () => {
    expect(etiquetaDecision('sin_ninguno', true)).toBe('Sin comisión')
    // Aprobado por producción local (solo con_comision=0): llega como sin_asesor.
    expect(etiquetaDecision('sin_asesor', true)).toBe('Sin comisión')
    expect(etiquetaDecision('con', true)).toBe('Con comisión')
  })

  it('comerciales: se desglosa como siempre', () => {
    expect(etiquetaDecision('sin_ninguno', false)).toBe('Sin comisión (ninguno)')
    expect(etiquetaDecision('sin_convenio', false)).toBe('Sin comisión convenio')
    expect(etiquetaDecision('regimen_anterior', false)).toBe('Régimen anterior')
  })
})
