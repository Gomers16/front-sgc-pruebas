import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import {
  ROLES_FECHA_RETROACTIVA,
  esFechaRetroactiva,
  hoyBogotaISO,
  reglaFechaTurno,
  reglaHoraIngreso,
} from '../fechaRetroactiva'

const HOY = '2026-10-09'
const AYER = '2026-10-08'
const MANANA = '2026-10-10'

describe('fechaRetroactiva', () => {
  it('roles permitidos: SUPER_ADMIN y GERENCIA (igual que el backend)', () => {
    expect([...ROLES_FECHA_RETROACTIVA]).toEqual(['SUPER_ADMIN', 'GERENCIA'])
  })

  it('hoyBogotaISO usa la fecha de Bogotá, no la UTC', () => {
    // 2026-10-10 03:00 UTC = 2026-10-09 22:00 en Bogotá
    expect(hoyBogotaISO(DateTime.fromISO('2026-10-10T03:00:00', { zone: 'utc' }))).toBe(HOY)
  })

  it('esFechaRetroactiva: solo fechas anteriores a hoy', () => {
    expect(esFechaRetroactiva(AYER, HOY)).toBe(true)
    expect(esFechaRetroactiva(HOY, HOY)).toBe(false)
    expect(esFechaRetroactiva(MANANA, HOY)).toBe(false)
    expect(esFechaRetroactiva('', HOY)).toBe(false)
    expect(esFechaRetroactiva(null, HOY)).toBe(false)
    expect(esFechaRetroactiva('08/10/2026', HOY)).toBe(false)
  })

  it('reglaFechaTurno: hoy siempre válida', () => {
    expect(reglaFechaTurno(HOY, HOY, true)).toBe(true)
    expect(reglaFechaTurno(HOY, HOY, false)).toBe(true)
  })

  it('reglaFechaTurno: anterior solo con permiso', () => {
    expect(reglaFechaTurno(AYER, HOY, true)).toBe(true)
    expect(reglaFechaTurno(AYER, HOY, false)).toMatch(/SUPER_ADMIN o GERENCIA/)
  })

  it('reglaFechaTurno: futura nunca, vacía o mal formada → mensaje', () => {
    expect(reglaFechaTurno(MANANA, HOY, true)).toMatch(/futura/)
    expect(reglaFechaTurno('', HOY, true)).toMatch(/requerida/)
    expect(reglaFechaTurno(undefined, HOY, true)).toMatch(/requerida/)
  })

  it('reglaHoraIngreso: HH:mm válido de 00:00 a 23:59', () => {
    expect(reglaHoraIngreso('00:00')).toBe(true)
    expect(reglaHoraIngreso('08:15')).toBe(true)
    expect(reglaHoraIngreso('23:59')).toBe(true)
    expect(reglaHoraIngreso('24:00')).not.toBe(true)
    expect(reglaHoraIngreso('8:15')).not.toBe(true)
    expect(reglaHoraIngreso('')).not.toBe(true)
    expect(reglaHoraIngreso(null)).not.toBe(true)
  })
})
