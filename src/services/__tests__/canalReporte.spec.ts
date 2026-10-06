import { describe, expect, it } from 'vitest'
import { nombreCanalReporte, tituloCanalReporte } from '../reportesAdminService'

describe('nombres de canal de los reportes', () => {
  it('usa el nombre que manda el backend y, si falta, los del desplegable', () => {
    expect(nombreCanalReporte({ canal: 'TELE', nombre: 'Call Center' })).toBe('Call Center')
    expect(nombreCanalReporte('FACHADA')).toBe('Fachada')
    expect(nombreCanalReporte('REDES')).toBe('Redes Sociales')
    expect(nombreCanalReporte('TELE')).toBe('Call Center')
    expect(nombreCanalReporte('TELEMERCADEO')).toBe('Call Center')
    expect(nombreCanalReporte('ASESOR')).toBe('Asesor')
    expect(nombreCanalReporte('GOOGLE_ADS')).toBe('Google ADS')
    expect(nombreCanalReporte('OTRO')).toBe('OTRO')
  })

  it('el título de un subcanal de Asesor lleva "Asesor — "', () => {
    expect(tituloCanalReporte({ canal: 'ASESOR_COMERCIAL', nombre: 'Comercial', es_subcanal: true })).toBe(
      'Asesor — Comercial'
    )
    expect(tituloCanalReporte({ canal: 'ASESOR_CONVENIO', es_subcanal: true })).toBe('Asesor — Convenio')
    expect(tituloCanalReporte({ canal: 'ASESOR_SIN_DETALLE', es_subcanal: true })).toBe(
      'Asesor (sin detalle)'
    )
    expect(tituloCanalReporte({ canal: 'GOOGLE_ADS' })).toBe('Google ADS')
  })
})
