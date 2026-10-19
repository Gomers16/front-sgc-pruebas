import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/services/comisionesService'
import {
  conConfirmacionSinComision,
  conflictoSinComision,
  textoCampos,
  textoDecisionTicket,
  textoDejadoDePagar,
} from '../ticketOrigen'

const err409 = (puede: boolean) =>
  new ApiError('Este valor viene de un ticket que decidió sin comisión (ticket #841)', 409, {
    code: 'MONTO_CONTRADICE_TICKET_SIN_COMISION',
    message: 'Este valor viene de un ticket que decidió sin comisión (ticket #841)',
    ticket_id: 841,
    decision: { sin_comision_asesor: false, sin_comision_convenio: true },
    campos: ['monto_convenio'],
    puede_confirmar: puede,
  })

describe('conflictoSinComision', () => {
  it('lee el 409 del backend', () => {
    expect(conflictoSinComision(err409(true))).toEqual({
      ticketId: 841,
      sinAsesor: false,
      sinConvenio: true,
      campos: ['monto_convenio'],
      puedeConfirmar: true,
      noPermitido: false,
      mensaje: 'Este valor viene de un ticket que decidió sin comisión (ticket #841)',
    })
  })

  it('el 403 de confirmación no permitida también, marcado como tal', () => {
    const e = new ApiError('x', 403, {
      code: 'CONFIRMACION_SIN_COMISION_NO_PERMITIDA',
      ticket_id: 9,
      decision: { sin_comision_asesor: true, sin_comision_convenio: false },
      campos: ['monto_asesor'],
      puede_confirmar: false,
    })
    expect(conflictoSinComision(e)).toMatchObject({ ticketId: 9, noPermitido: true })
  })

  it('cualquier otro error no es un conflicto', () => {
    expect(conflictoSinComision(new Error('HTTP 500'))).toBeNull()
    expect(conflictoSinComision(new ApiError('x', 409, { code: 'OTRO' }))).toBeNull()
    expect(conflictoSinComision(new ApiError('x', 400, null))).toBeNull()
  })
})

describe('textos', () => {
  it('qué decidió el ticket y qué montos se tocan', () => {
    expect(textoDecisionTicket({ ticketId: 1, sinAsesor: true, sinConvenio: true })).toBe(
      'El ticket #1 decidió sin comisión para el asesor y el convenio.',
    )
    expect(textoDecisionTicket({ ticketId: 1, sinAsesor: false, sinConvenio: true })).toContain(
      'para el convenio',
    )
    expect(textoCampos(['monto_asesor'])).toBe('el monto del asesor')
    expect(textoCampos(['monto_asesor', 'monto_convenio'])).toBe(
      'los montos del asesor y del convenio',
    )
  })

  it('dejado de pagar: exacto o estimado', () => {
    const cop = (v: number) => `$${v}`
    expect(textoDejadoDePagar({ asesor: 0, convenio: 20000, exacto: true }, cop)).toBe(
      '$20000 (convenio $20000) — exacto',
    )
    expect(textoDejadoDePagar({ asesor: 8640, convenio: 20000, exacto: false }, cop)).toBe(
      '$28640 (asesor $8640 · convenio $20000) — estimado',
    )
  })
})

describe('conConfirmacionSinComision', () => {
  it('sin conflicto: una sola llamada, sin confirmar', async () => {
    const llamar = vi.fn(async () => 'ok')
    const pedir = vi.fn()
    expect(await conConfirmacionSinComision(llamar, pedir)).toBe('ok')
    expect(llamar).toHaveBeenCalledExactlyOnceWith(false)
    expect(pedir).not.toHaveBeenCalled()
  })

  it('gerencia confirma: se repite con confirmar_excepcion', async () => {
    const llamar = vi.fn(async (confirmar: boolean) => {
      if (!confirmar) throw err409(true)
      return 'guardado'
    })
    const pedir = vi.fn(async () => true)
    expect(await conConfirmacionSinComision(llamar, pedir)).toBe('guardado')
    expect(llamar.mock.calls).toEqual([[false], [true]])
    expect(pedir).toHaveBeenCalledWith(expect.objectContaining({ ticketId: 841 }))
  })

  it('cancela, o no tiene permiso: null y no se repite', async () => {
    for (const [puede, respuesta] of [
      [true, false],
      [false, true],
    ] as const) {
      const llamar = vi.fn(async () => {
        throw err409(puede)
      })
      expect(await conConfirmacionSinComision(llamar, async () => respuesta)).toBeNull()
      expect(llamar).toHaveBeenCalledTimes(1)
    }
  })

  it('otros errores se propagan como antes', async () => {
    await expect(
      conConfirmacionSinComision(async () => {
        throw new Error('HTTP 500')
      }, vi.fn()),
    ).rejects.toThrow('HTTP 500')
  })
})
