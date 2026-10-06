import { describe, expect, it } from 'vitest'
import {
  canalToMedio,
  medioEnteroItems,
  medioToCanal,
  resolverCaptacion,
  type CanalAtrib,
  type MedioEntero,
} from '../canalCaptacion'

describe('canalCaptacion', () => {
  it('el desplegable conserva las 4 opciones de antes y agrega Google ADS', () => {
    expect(medioEnteroItems.map((i) => i.title)).toEqual([
      'Redes Sociales',
      'Call Center',
      'Fachada',
      'Asesor',
      'Google ADS',
    ])
  })

  it('opción ↔ canal ida y vuelta para todos los canales', () => {
    const pares: Array<[MedioEntero, CanalAtrib]> = [
      ['redes_sociales', 'REDES'],
      ['call_center', 'TELE'],
      ['fachada', 'FACHADA'],
      ['asesor', 'ASESOR'],
      ['google_ads', 'GOOGLE_ADS'],
    ]
    for (const [medio, canal] of pares) {
      expect(medioToCanal(medio)).toBe(canal)
      expect(canalToMedio(canal)).toBe(medio)
    }
  })

  it('EditarTurno: un turno GOOGLE_ADS se carga como Google ADS y se guarda como GOOGLE_ADS (no Fachada)', () => {
    const medio = canalToMedio('GOOGLE_ADS')
    expect(medio).toBe('google_ads')
    expect(medioToCanal(medio)).toBe('GOOGLE_ADS')
  })

  it('crear sin buscar: Google ADS se envía como GOOGLE_ADS sin asesor', () => {
    expect(resolverCaptacion('google_ads')).toEqual({ canal: 'GOOGLE_ADS', agenteCaptacionId: null })
  })

  it('buscar la placa (sugiere FACHADA) y cambiar a Google ADS: gana lo elegido', () => {
    expect(resolverCaptacion('google_ads', { canal: 'FACHADA', agenteId: null })).toEqual({
      canal: 'GOOGLE_ADS',
      agenteCaptacionId: null,
    })
  })

  it('sugerencia ASESOR con asesor y el operador cambia a Google ADS: no viaja el asesor', () => {
    expect(resolverCaptacion('google_ads', { canal: 'ASESOR', agenteId: 7 })).toEqual({
      canal: 'GOOGLE_ADS',
      agenteCaptacionId: null,
    })
  })

  it('mismo trato para todos los canales: lo elegido gana sobre la sugerencia', () => {
    expect(resolverCaptacion('redes_sociales', { canal: 'ASESOR', agenteId: 7 }).canal).toBe('REDES')
    expect(resolverCaptacion('call_center', { canal: 'FACHADA' }).canal).toBe('TELE')
    expect(resolverCaptacion('fachada', { canal: 'REDES' }).canal).toBe('FACHADA')
  })

  it('si el operador mantiene la sugerencia, se envía igual que antes (canal y asesor)', () => {
    expect(resolverCaptacion('asesor', { canal: 'ASESOR', agenteId: 7 })).toEqual({
      canal: 'ASESOR',
      agenteCaptacionId: 7,
    })
    expect(resolverCaptacion('call_center', { canal: 'TELE', agenteId: 9 })).toEqual({
      canal: 'TELE',
      agenteCaptacionId: 9,
    })
    expect(resolverCaptacion('fachada', { canal: 'FACHADA', agenteId: null })).toEqual({
      canal: 'FACHADA',
      agenteCaptacionId: null,
    })
  })
})
