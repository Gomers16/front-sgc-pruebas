import { describe, expect, it } from 'vitest'
import {
  normalizarIntentoDateo,
  leerIntentoDeHistorial,
  intentoParaHistorial,
  camposIntentoParaTicket,
  camposFallbackParaTicket,
  etiquetaCanalIntento,
  esConflictoSegundaVez,
  TIPOS_COMERCIAL_TICKET,
  camposGestionParaTicket,
  camposConvenioConGestion,
} from '../intentoDateo'

// Forma del campo `intento` del 409 REQUIERE_TICKET_DATEO.
const intento409 = {
  canal: 'ASESOR_COMERCIAL',
  agente_id: 12,
  agente_nombre: 'JUAN COMERCIAL',
  convenio_id: 40,
  convenio_nombre: 'PEDRO TALLER',
  convenio_establecimiento: 'TALLER EL PISTON',
  servicio_id: 1,
  servicio_nombre: 'RTM',
  descuento_id: 2,
  descuento_nombre: 'Avance',
  es_avance: true,
  comprobante_avance_url: '/api/uploads/dateos/2026/10/abc.png',
  telefono: '3001234567',
}

describe('normalizarIntentoDateo', () => {
  it('conserva el intento del 409', () => {
    expect(normalizarIntentoDateo(intento409)).toEqual(intento409)
  })

  it('sin canal o sin objeto no hay intento usable', () => {
    expect(normalizarIntentoDateo(null)).toBeNull()
    expect(normalizarIntentoDateo('x')).toBeNull()
    expect(normalizarIntentoDateo({ ...intento409, canal: null })).toBeNull()
  })

  it('nuevo directo: convenio null y valores vacíos quedan null', () => {
    const i = normalizarIntentoDateo({ canal: 'ASESOR_COMERCIAL', agente_id: 12, convenio_id: null, telefono: '' })
    expect(i?.convenio_id).toBeNull()
    expect(i?.telefono).toBeNull()
    expect(i?.es_avance).toBe(false)
  })
})

describe('history.state', () => {
  it('ida y vuelta: lo que guarda DateoCreate lo lee la vista del ticket', () => {
    const i = normalizarIntentoDateo(intento409)!
    const state = { back: '/comercial/dateos/nuevo', intento: intentoParaHistorial(i) }
    expect(leerIntentoDeHistorial(state)).toEqual(i)
  })

  it('sin intento en el state (acceso por URL) devuelve null', () => {
    expect(leerIntentoDeHistorial(null)).toBeNull()
    expect(leerIntentoDeHistorial({ back: null })).toBeNull()
  })
})

describe('campos para crear el ticket', () => {
  it('manda convenio, servicio, descuento, avance y teléfono; no la imagen', () => {
    const campos = camposIntentoParaTicket(normalizarIntentoDateo(intento409)!)
    expect(campos).toEqual({
      canal: 'ASESOR_COMERCIAL',
      convenio_id: 40,
      servicio_id: 1,
      descuento_id: 2,
      es_avance: true,
      comprobante_avance_url: '/api/uploads/dateos/2026/10/abc.png',
      telefono: '3001234567',
    })
    expect(Object.keys(campos)).not.toContain('imagen_url')
  })

  it('sin avance no manda comprobante', () => {
    const campos = camposIntentoParaTicket(
      normalizarIntentoDateo({ ...intento409, es_avance: false })!
    )
    expect(campos.comprobante_avance_url).toBeNull()
  })

  it('fallback: solo convenio elegido y teléfono', () => {
    expect(camposFallbackParaTicket(null, '  ')).toEqual({ convenio_id: null, telefono: null })
    expect(camposFallbackParaTicket(40, '300')).toEqual({ convenio_id: 40, telefono: '300' })
  })
})

describe('textos', () => {
  it('etiqueta del canal', () => {
    expect(etiquetaCanalIntento('ASESOR_CONVENIO')).toBe('Asesor convenio')
    expect(etiquetaCanalIntento('ASESOR_COMERCIAL')).toBe('Asesor comercial')
    expect(etiquetaCanalIntento(null)).toBe('—')
  })

  it('reconoce el 409 de segunda vez y no otros', () => {
    expect(esConflictoSegundaVez({ code: 'TURNO_SEGUNDA_VEZ', message: '...' })).toBe(true)
    expect(esConflictoSegundaVez({ code: 'TICKET_TURNO_OTRO_DIA' })).toBe(false)
    expect(esConflictoSegundaVez(undefined)).toBe(false)
  })
})

describe('ticket desde una gestión de Telemercadeo', () => {
  it('manda telemercadeo_gestion_id solo si viene de una gestión', () => {
    expect(camposGestionParaTicket(12)).toEqual({ telemercadeo_gestion_id: 12 })
    expect(camposGestionParaTicket(null)).toEqual({})
  })

  it('con gestión va siempre sin convenio; sin gestión manda la decisión del formulario', () => {
    expect(camposConvenioConGestion(12, null)).toEqual({ convenio_id: null, sin_convenio: true })
    expect(camposConvenioConGestion(12, { convenio_id: 40 })).toEqual({
      convenio_id: null,
      sin_convenio: true,
    })
    expect(camposConvenioConGestion(null, null)).toBeNull()
    expect(camposConvenioConGestion(null, { convenio_id: 40 })).toEqual({ convenio_id: 40 })
  })

  it('gerencia puede elegir asesores de Telemercadeo y el canal TELE se lee bien', () => {
    expect(TIPOS_COMERCIAL_TICKET).toContain('ASESOR_TELEMERCADEO')
    expect(etiquetaCanalIntento('TELE')).toBe('Telemercadeo')
  })
})
