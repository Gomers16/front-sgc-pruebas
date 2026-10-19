import { describe, expect, it } from 'vitest'
import { turnoVisible } from '../turnoVisible'

describe('turnoVisible', () => {
  it('número del día con servicio y la fecha aparte (no el id interno)', () => {
    expect(
      turnoVisible({ turnoId: 1425, turnoNumero: 12, servicioCodigo: 'RTM', fecha: '2026-10-16' }),
    ).toEqual({ principal: 'N° 12 · RTM', secundario: '16/10/2026' })
  })

  it('sin servicio: solo el número', () => {
    expect(
      turnoVisible({ turnoId: 1425, turnoNumero: 3, servicioCodigo: null, fecha: null }).principal,
    ).toBe('N° 3')
  })

  it('sin número válido cae al id interno, rotulado como tal', () => {
    for (const turnoNumero of [null, 0, -9701]) {
      expect(
        turnoVisible({ turnoId: 1425, turnoNumero, servicioCodigo: 'RTM', fecha: '2026-10-16' }),
      ).toEqual({ principal: 'Turno id #1425', secundario: '16/10/2026' })
    }
    expect(
      turnoVisible({ turnoId: null, turnoNumero: null, servicioCodigo: null, fecha: 'x' }),
    ).toEqual({ principal: '—', secundario: null })
  })
})
