import { describe, expect, it } from 'vitest'
import {
  claseFilaCanal,
  nombreCanalReporte,
  nombreFilaCanalExcel,
  notaFilaCanal,
  tituloCanalReporte,
} from '../reportesAdminService'

describe('nombres de canal de los reportes', () => {
  it('usa el nombre que manda el backend y, si falta, los del desplegable', () => {
    expect(nombreCanalReporte({ canal: 'TELE', nombre: 'Call Center' })).toBe('Call Center')
    expect(nombreCanalReporte('FACHADA')).toBe('Fachada')
    expect(nombreCanalReporte('REDES')).toBe('Redes Sociales')
    expect(nombreCanalReporte('TELE')).toBe('Call Center')
    expect(nombreCanalReporte('TELEMERCADEO')).toBe('Call Center')
    expect(nombreCanalReporte('ASESOR')).toBe('Asesor')
    expect(nombreCanalReporte('ASESOR_COMERCIAL')).toBe('Asesor comercial')
    expect(nombreCanalReporte('ASESOR_CONVENIO')).toBe('Asesor convenio')
    expect(nombreCanalReporte('ASESOR_COMERCIAL_CONVENIO')).toBe('de los cuales, por convenio')
    expect(nombreCanalReporte('GOOGLE_ADS')).toBe('Google ADS')
    expect(nombreCanalReporte('OTRO')).toBe('OTRO')
  })

  it('títulos de detalle', () => {
    expect(tituloCanalReporte({ canal: 'ASESOR_COMERCIAL', es_subcanal: true })).toBe('Asesor comercial')
    expect(tituloCanalReporte('ASESOR_CONVENIO')).toBe('Asesor convenio')
    expect(tituloCanalReporte('ASESOR_COMERCIAL_CONVENIO')).toBe('Asesor comercial — por convenio')
    expect(tituloCanalReporte({ canal: 'ASESOR_SIN_DETALLE', es_subcanal: true })).toBe('Asesor (sin detalle)')
    expect(tituloCanalReporte({ canal: 'GOOGLE_ADS' })).toBe('Google ADS')
  })

  it('la línea informativa se marca como tal (cursiva, nota, Excel "no suma", sin % del total)', () => {
    const inf = {
      canal: 'ASESOR_COMERCIAL_CONVENIO',
      nombre: 'de los cuales, por convenio',
      es_subcanal: true,
      es_informativa: true,
      porcentaje: null,
      porcentaje_sobre_asesor_comercial: 77.78,
    }
    expect(claseFilaCanal(inf)).toContain('font-italic')
    expect(notaFilaCanal(inf)).toBe('(77,78 % de Asesor comercial)')
    expect(nombreFilaCanalExcel(inf)).toContain('(informativa, no suma)')

    const sub = { canal: 'ASESOR_COMERCIAL', nombre: 'Asesor comercial', es_subcanal: true, porcentaje: 20 }
    expect(claseFilaCanal(sub)).toBe('pl-6 text-medium-emphasis')
    expect(notaFilaCanal(sub)).toBe('')
    expect(nombreFilaCanalExcel(sub)).toBe('    · Asesor comercial')
    expect(claseFilaCanal({ canal: 'FACHADA' })).toBe('')
  })
})
