import { describe, expect, it } from 'vitest'
import {
  chipsFiltros,
  filtrosAParams,
  filtrosAQuery,
  filtrosDesdeQuery,
  filtrosVacios,
  nombreExcel,
  quitarFiltro,
  type FiltrosHistorial,
} from '../filtrosHistorico'

const lleno: FiltrosHistorial = {
  fecha_desde: '2026-10-01',
  fecha_hasta: '2026-10-19',
  placa: ' qat 01 ',
  vendedor: ' maria ',
  descuento: 2,
  consecutivo: 'd-12',
  consecutivo_exacto: true,
  estado: 'CONFIRMADA',
  servicio_id: 1,
}

describe('filtros del historial ↔ params del API', () => {
  it('sin filtros no manda nada', () => {
    expect(filtrosAParams(filtrosVacios())).toEqual({})
    expect(filtrosAQuery(filtrosVacios())).toEqual({})
  })

  it('todos los filtros: fecha de pago, placa y consecutivo normalizados', () => {
    expect(filtrosAParams(lleno)).toEqual({
      fecha_pago_desde: '2026-10-01',
      fecha_pago_hasta: '2026-10-19',
      placa_contiene: 'QAT01',
      vendedor: 'maria',
      descuento_id: 2,
      consecutivo_descuento: 'D-12',
      consecutivo_descuento_exacto: 1,
      estado: 'CONFIRMADA',
      servicio_id: 1,
    })
  })

  it('"Sin descuento" viaja como descuento_id=ninguno; consecutivo parcial por defecto', () => {
    const p = filtrosAParams({ ...filtrosVacios(), descuento: 'ninguno', consecutivo: 'd1' })
    expect(p).toEqual({ descuento_id: 'ninguno', consecutivo_descuento: 'D1' })
  })

  it('vendedor con menos de 2 letras no se manda (el backend lo ignora)', () => {
    expect(filtrosAParams({ ...filtrosVacios(), vendedor: 'm' })).toEqual({})
  })
})

describe('URL (volver o recargar conserva filtros y página)', () => {
  it('ida y vuelta', () => {
    const q = filtrosAQuery(lleno, 3, 50)
    expect(q).toMatchObject({ page: '3', per_page: '50', descuento: '2', consecutivo_exacto: '1' })
    const { filtros, page, perPage } = filtrosDesdeQuery(q)
    expect(filtros).toEqual({ ...lleno, placa: 'QAT01', vendedor: 'maria', consecutivo: 'D-12' })
    expect([page, perPage]).toEqual([3, 50])
  })

  it('"ninguno" sobrevive a la URL', () => {
    expect(filtrosDesdeQuery({ descuento: 'ninguno' }).filtros.descuento).toBe('ninguno')
  })

  it('valores inválidos se ignoran', () => {
    const { filtros, page, perPage } = filtrosDesdeQuery({
      fecha_desde: '19/10/2026',
      estado: 'NADA',
      descuento: 'abc',
      servicio_id: '-1',
      page: '0',
      per_page: '7',
    })
    expect(filtros).toEqual(filtrosVacios())
    expect([page, perPage]).toEqual([1, 20])
  })
})

describe('chips', () => {
  it('uno por filtro activo, con nombres resueltos', () => {
    const chips = chipsFiltros(lleno, {
      descuento: () => 'Avance',
      servicio: () => 'RTM',
    })
    expect(chips.map((c) => c.texto)).toEqual([
      'Fecha pago desde 2026-10-01',
      'Fecha pago hasta 2026-10-19',
      'Placa: QAT01',
      'Vendedor: maria',
      'Descuento: Avance',
      'Consec. descuento = D-12',
      'Estado: Confirmada',
      'Servicio: RTM',
    ])
    expect(chipsFiltros({ ...filtrosVacios(), descuento: 'ninguno' })[0].texto).toBe(
      'Sin descuento',
    )
  })

  it('cerrar el chip del consecutivo quita también "exacto"; los demás quedan', () => {
    const f = quitarFiltro(lleno, 'consecutivo')
    expect([f.consecutivo, f.consecutivo_exacto]).toEqual(['', false])
    expect(f.descuento).toBe(2)
  })
})

it('nombre del Excel con el rango de fechas', () => {
  expect(nombreExcel(lleno)).toBe('Facturacion_2026-10-01_2026-10-19.xlsx')
  expect(nombreExcel(filtrosVacios())).toBe('Facturacion_todos.xlsx')
})
