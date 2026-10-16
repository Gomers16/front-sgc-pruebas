import { describe, expect, it } from 'vitest'
import {
  chipsFiltros,
  filtrosAParams,
  filtrosAQuery,
  filtrosDesdeQuery,
  filtrosVacios,
  quitarFiltro,
} from '../filtrosTickets'

const lleno = {
  ...filtrosVacios(),
  fecha_desde: '2026-10-01',
  fecha_hasta: '2026-10-16',
  comercial_id: 7,
  convenio_id: 40,
  estado: 'APROBADO' as const,
  ventana: 'fuera' as const,
  placa: ' abc123 ',
  turno_id: 99,
  decision: 'sin_asesor' as const,
}

describe('filtros ↔ params / query', () => {
  it('sin filtros no manda nada', () => {
    expect(filtrosAParams(filtrosVacios())).toEqual({})
    expect(filtrosAQuery(filtrosVacios())).toEqual({})
  })

  it('params del API: todos los filtros, placa normalizada', () => {
    expect(filtrosAParams(lleno)).toEqual({
      fecha_desde: '2026-10-01',
      fecha_hasta: '2026-10-16',
      comercial_id: 7,
      convenio_id: 40,
      estado: 'APROBADO',
      ventana: 'fuera',
      placa: 'ABC123',
      turno_id: 99,
      decision: 'sin_asesor',
    })
  })

  it('ida y vuelta por la URL conserva filtros y página (volver desde el detalle)', () => {
    const q = filtrosAQuery(lleno, 3, 50)
    expect(q.page).toBe('3')
    expect(q.per_page).toBe('50')
    const { filtros, page, perPage } = filtrosDesdeQuery(q)
    expect(filtros).toEqual({ ...lleno, placa: 'ABC123' })
    expect([page, perPage]).toEqual([3, 50])
  })

  it('valores inválidos en la URL se ignoran', () => {
    const { filtros, page } = filtrosDesdeQuery({
      estado: 'NADA',
      decision: 'x',
      ventana: 'casi',
      fecha_desde: '16/10/2026',
      comercial_id: 'abc',
      page: '-2',
    })
    expect(filtros).toEqual(filtrosVacios())
    expect(page).toBe(1)
  })
})

describe('chips', () => {
  it('un chip por filtro activo, con nombres resueltos', () => {
    const chips = chipsFiltros(lleno, { comercial: () => 'ANA', convenio: () => 'TALLER' })
    expect(chips.map((c) => c.clave)).toEqual([
      'fecha_desde',
      'fecha_hasta',
      'comercial_id',
      'convenio_id',
      'estado',
      'ventana',
      'placa',
      'turno_id',
      'decision',
    ])
    expect(chips.find((c) => c.clave === 'comercial_id')?.texto).toBe('Asesor: ANA')
    expect(chips.find((c) => c.clave === 'decision')?.texto).toBe('Sin comisión asesor')
  })

  it('cerrar un chip quita solo ese filtro', () => {
    const f = quitarFiltro(lleno, 'estado')
    expect(f.estado).toBeNull()
    expect(f.comercial_id).toBe(7)
  })
})
