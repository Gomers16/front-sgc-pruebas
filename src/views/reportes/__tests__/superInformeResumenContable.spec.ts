import { describe, expect, it } from 'vitest'
import { filasTablaResumenContable, textoRechazoApi } from '../superInformeResumenContable'
import type { ResumenContableResponse } from '@/services/reportesAdminService'

const respuesta: ResumenContableResponse = {
  fecha_inicio: '2032-05-10',
  fecha_fin: '2032-05-12',
  filas: [
    { clave: 'RTM_PRIMERA', etiqueta: 'RTM · Primera vez', motos: 2, livianos: 2, otros: 0, total: 4, tipo: 'detalle' },
    { clave: 'RTM_SEGUNDA', etiqueta: 'RTM · Segunda vez', motos: 0, livianos: 1, otros: 0, total: 1, tipo: 'detalle' },
    { clave: 'RTM_TOTAL', etiqueta: 'RTM · Total', motos: 2, livianos: 3, otros: 0, total: 5, tipo: 'subtotal' },
    { clave: 'SOAT', etiqueta: 'SOAT', motos: 1, livianos: 0, otros: 0, total: 1, tipo: 'detalle' },
    { clave: 'TOTAL', etiqueta: 'TOTAL GENERAL', motos: 3, livianos: 3, otros: 0, total: 6, tipo: 'total' },
  ],
  rechazo: {
    primera_vez: { aprobadas: 1, rechazadas: 2, sin_resultado: 1, porcentaje: 200 / 3 },
    segunda_vez: { aprobadas: 0, rechazadas: 0, sin_resultado: 1, porcentaje: null },
  },
  sin_finalizar: 1,
}

describe('superInformeResumenContable', () => {
  it('filas en el mismo orden; subtotal RTM y total general resaltados', () => {
    const filas = filasTablaResumenContable(respuesta)
    expect(filas.map((f) => f.servicio)).toEqual([
      'RTM · Primera vez',
      'RTM · Segunda vez',
      'RTM · Total',
      'SOAT',
      'TOTAL GENERAL',
    ])
    expect(filas.map((f) => f.resaltada)).toEqual([false, false, true, false, true])
    expect(filas[2]).toMatchObject({ motos: 2, livianos: 3, otros: 0, total: 5 })
  })

  it('% rechazo con el formato de Turnos del Día; "—" con denominador 0', () => {
    expect(textoRechazoApi(respuesta.rechazo.primera_vez)).toBe('66,7% (2 de 3)')
    expect(textoRechazoApi(respuesta.rechazo.segunda_vez)).toBe('—')
    expect(textoRechazoApi({ aprobadas: 17, rechazadas: 3, sin_resultado: 0, porcentaje: 15 })).toBe('15,0% (3 de 20)')
  })
})
