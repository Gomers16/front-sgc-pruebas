// Texto de la locución por tipo de llamado: siempre con el módulo real, solo
// cambia la instrucción ("diríjase al" / "por favor acérquese al").
import { describe, expect, it } from 'vitest'
import { textoAnuncio } from '../useVozTurno'

describe('textoAnuncio', () => {
  it('llamado a módulo: "diríjase al {módulo}"', () => {
    expect(
      textoAnuncio({ placa: 'ABC123', modulo: 'Módulo 5 - Caja RTM', tipoLlamado: 'modulo' })
    ).toBe('Turno con placa ABC123, diríjase al Módulo 5 - Caja RTM.')
  })

  it('pregunta: "por favor acérquese al {módulo}", con el módulo real', () => {
    expect(
      textoAnuncio({ placa: 'ABC123', modulo: 'Módulo 5 - Caja RTM', tipoLlamado: 'pregunta' })
    ).toBe('Turno con placa ABC123, por favor acérquese al Módulo 5 - Caja RTM.')
  })
})
