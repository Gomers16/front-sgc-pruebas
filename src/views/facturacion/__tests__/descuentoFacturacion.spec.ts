import { describe, expect, it } from 'vitest'
import {
  esMontoFijo,
  montoMaximo,
  parseMontoCOP,
  pideConfirmarMontoCero,
  resolverDescuentoPremarcado,
  type DescuentoDetalle,
} from '../descuentoFacturacion'

const AVANCE: DescuentoDetalle = {
  id: 2,
  codigo: 'AVANCE',
  nombre: 'Avance',
  valorCarro: 75000,
  valorMoto: 45000,
}
const EMPLEADO: DescuentoDetalle = {
  id: 3,
  codigo: 'INFORMATIVO_EMPLEADO',
  nombre: 'Informativo Empleado',
  valorCarro: 60000,
  valorMoto: 35000,
}
const ACTIVOS = [AVANCE, EMPLEADO]

describe('pre-marcado del dateo cuando la cajera no puede leer GET /descuentos/:id (f3)', () => {
  it('sin detalle de la API toma nombre y máximo de los descuentos activos', () => {
    const r = resolverDescuentoPremarcado(2, null, ACTIVOS)
    expect(r.noCargado).toBe(false)
    expect(r.nombre).toBe('Avance')
    expect(montoMaximo(r.detalle, false)).toBe(75000)
    expect(montoMaximo(r.detalle, true)).toBe(45000)
  })

  it('si la API respondió, se usa ese detalle', () => {
    const api = { ...AVANCE, nombre: 'Avance (API)' }
    expect(resolverDescuentoPremarcado(2, api, ACTIVOS).nombre).toBe('Avance (API)')
  })

  it('si tampoco está en activos queda marcado como no cargado (bloquea Confirmar), no con máximo $0 en silencio', () => {
    const r = resolverDescuentoPremarcado(9, null, ACTIVOS)
    expect(r).toEqual({ detalle: null, nombre: 'Descuento #9', noCargado: true })
  })

  it('sin pre-marcado no hay nada que cargar', () => {
    expect(resolverDescuentoPremarcado(null, null, ACTIVOS).noCargado).toBe(false)
  })
})

describe('monto fijo pre-marcado (g2)', () => {
  it('empleado pre-marcado sin permiso en la ruta: monto fijo según vehículo', () => {
    const { detalle } = resolverDescuentoPremarcado(3, null, ACTIVOS)
    expect(esMontoFijo(detalle?.codigo)).toBe(true)
    expect(montoMaximo(detalle, false)).toBe(60000)
    expect(montoMaximo(detalle, true)).toBe(35000)
  })

  it('policía, empleado y avance propietario son de monto fijo; avance e informativo no', () => {
    expect(
      ['INFORMATIVO_POLICIA', 'INFORMATIVO_EMPLEADO', 'AVANCE_PROPIETARIO'].every(esMontoFijo),
    ).toBe(true)
    expect(['AVANCE', 'INFORMATIVO', 'INFORMATIVO_OBSEQUIO', null].some(esMontoFijo)).toBe(false)
  })
})

describe('parseMontoCOP: separadores de miles y decimales', () => {
  it.each([
    ['8000', 8000],
    ['8.000', 8000],
    ['8,000', 8000],
    ['1.250.000', 1250000],
    ['1,250,000', 1250000],
    ['$ 8.000', 8000],
    [' 75000 ', 75000],
    ['0', 0],
  ])('miles: %s → %s', (txt, n) => {
    expect(parseMontoCOP(txt)).toBe(n)
  })

  it.each([
    ['8000,5', 8000.5],
    ['8000.50', 8000.5],
    ['8.000,50', 8000.5],
    ['8,000.50', 8000.5],
    ['8,5', 8.5],
    ['8.00', 8],
  ])('decimales: %s → %s', (txt, n) => {
    expect(parseMontoCOP(txt)).toBe(n)
  })

  it.each(['', 'abc', '8.000.50', '8,000,5', '-500', '8..000'])('no es monto: %j → null', (txt) => {
    expect(parseMontoCOP(txt)).toBeNull()
  })

  it('un número se respeta tal cual', () => {
    expect(parseMontoCOP(8000)).toBe(8000)
    expect(parseMontoCOP(Number.NaN)).toBeNull()
  })
})

describe('red de seguridad: descuento en $0', () => {
  it('pide confirmar si el monto es 0 y el descuento no es de $0 intencional', () => {
    expect(pideConfirmarMontoCero('INFORMATIVO', 0, 50000)).toBe(true)
    expect(pideConfirmarMontoCero('INFORMATIVO_EMPLEADO', 0, 60000)).toBe(true)
    expect(pideConfirmarMontoCero(null, 0, 60000)).toBe(true)
  })

  it('Avance en $0 es intencional; con monto o con máximo $0 (obsequio) no pregunta', () => {
    expect(pideConfirmarMontoCero('AVANCE', 0, 75000)).toBe(false)
    expect(pideConfirmarMontoCero('INFORMATIVO', 8000, 50000)).toBe(false)
    expect(pideConfirmarMontoCero('INFORMATIVO_OBSEQUIO', 0, 0)).toBe(false)
  })
})
