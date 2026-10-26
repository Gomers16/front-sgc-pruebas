import { describe, expect, it } from 'vitest'
import {
  calcularResumenContable,
  grupoVehiculo,
  resumenComoTabla,
  resumenComoTexto,
  textoRechazo,
  type TurnoParaResumen,
} from '../resumenContable'

const turno = (over: Partial<TurnoParaResumen>): TurnoParaResumen => ({
  servicioCodigo: 'RTM',
  tipoVehiculo: 'Liviano Particular',
  estado: 'finalizado',
  esSegundaVez: 0,
  resultadoCertificacion: null,
  ...over,
})

const fila = (r: ReturnType<typeof calcularResumenContable>, clave: string) =>
  r.filas.find((f) => f.clave === clave)!

describe('grupoVehiculo', () => {
  it('clasifica los 4 valores reales y deja lo demás en Otros', () => {
    expect(grupoVehiculo('Motocicleta')).toBe('motos')
    expect(grupoVehiculo('Liviano Particular')).toBe('livianos')
    expect(grupoVehiculo('Liviano Taxi')).toBe('livianos')
    expect(grupoVehiculo('Liviano Público')).toBe('livianos')
    expect(grupoVehiculo(null)).toBe('otros')
    expect(grupoVehiculo('Desconocido')).toBe('otros')
  })
})

describe('calcularResumenContable', () => {
  it('sin segunda vez: la fila existe en 0 y su rechazo es "—"', () => {
    const r = calcularResumenContable([turno({}), turno({ tipoVehiculo: 'Motocicleta' })])
    expect(fila(r, 'RTM_SEGUNDA').total).toBe(0)
    expect(fila(r, 'RTM_PRIMERA')).toMatchObject({ motos: 1, livianos: 1, otros: 0, total: 2 })
    expect(fila(r, 'RTM_TOTAL').total).toBe(2)
    expect(r.rechazo.segundaVez.porcentaje).toBeNull()
    expect(textoRechazo(r.rechazo.segundaVez)).toBe('—')
  })

  it('denominador 0 → "—", nunca 0% ni NaN', () => {
    const r = calcularResumenContable([])
    expect(r.rechazo.primeraVez.porcentaje).toBeNull()
    expect(textoRechazo(r.rechazo.primeraVez)).toBe('—')
    expect(fila(r, 'TOTAL').total).toBe(0)
  })

  it('turnos sin resultado van aparte y no entran al denominador', () => {
    const r = calcularResumenContable([
      turno({ resultadoCertificacion: 'RECHAZADA' }),
      turno({ resultadoCertificacion: 'APROBADA' }),
      turno({ resultadoCertificacion: 'APROBADA' }),
      turno({ resultadoCertificacion: 'APROBADA' }),
      turno({ resultadoCertificacion: null }),
      turno({ resultadoCertificacion: null }),
    ])
    expect(r.rechazo.primeraVez).toMatchObject({ aprobadas: 3, rechazadas: 1, sinResultado: 2, porcentaje: 25 })
    expect(textoRechazo(r.rechazo.primeraVez)).toBe('25,0% (1 de 4)')
  })

  it('separa RTM primera/segunda vez (0/1 o boolean) y cada uno tiene su rechazo', () => {
    const r = calcularResumenContable([
      turno({ esSegundaVez: 1, resultadoCertificacion: 'APROBADA' }),
      turno({ esSegundaVez: true, resultadoCertificacion: 'RECHAZADA', tipoVehiculo: 'Motocicleta' }),
      turno({ esSegundaVez: 0, resultadoCertificacion: 'APROBADA' }),
    ])
    expect(fila(r, 'RTM_SEGUNDA')).toMatchObject({ motos: 1, livianos: 1, total: 2 })
    expect(fila(r, 'RTM_PRIMERA').total).toBe(1)
    expect(r.rechazo.segundaVez.porcentaje).toBe(50)
    expect(r.rechazo.primeraVez.porcentaje).toBe(0)
  })

  it('mezcla de tipos y servicios: filas por servicio y total general', () => {
    const r = calcularResumenContable([
      turno({}),
      turno({ servicioCodigo: 'SOAT', tipoVehiculo: 'Motocicleta' }),
      turno({ servicioCodigo: 'PREV', tipoVehiculo: 'Liviano Taxi', esSegundaVez: 1 }),
      turno({ servicioCodigo: 'peri', tipoVehiculo: null }),
    ])
    expect(fila(r, 'SOAT')).toMatchObject({ motos: 1, total: 1 })
    expect(fila(r, 'PREV')).toMatchObject({ livianos: 1, total: 1 })
    expect(fila(r, 'PERI')).toMatchObject({ otros: 1, total: 1 })
    expect(fila(r, 'TOTAL')).toMatchObject({ motos: 1, livianos: 2, otros: 1, total: 4 })
  })

  it('un servicio no previsto tiene su propia fila después de los fijos', () => {
    const r = calcularResumenContable([
      turno({ servicioCodigo: 'LAVADO' }),
      turno({ servicioCodigo: null }),
    ])
    expect(r.filas.map((f) => f.clave)).toEqual([
      'RTM_PRIMERA',
      'RTM_SEGUNDA',
      'RTM_TOTAL',
      'SOAT',
      'PREV',
      'PERI',
      'LAVADO',
      'SIN SERVICIO',
      'TOTAL',
    ])
    expect(fila(r, 'LAVADO').total).toBe(1)
    expect(fila(r, 'TOTAL').total).toBe(2)
  })

  it('excluye cancelados e inactivos de conteos y de rechazo', () => {
    const r = calcularResumenContable([
      turno({ estado: 'cancelado', resultadoCertificacion: 'RECHAZADA' }),
      turno({ estado: 'inactivo' }),
      turno({ estado: 'activo' }),
    ])
    expect(fila(r, 'TOTAL').total).toBe(1)
    expect(r.rechazo.primeraVez).toMatchObject({ rechazadas: 0, sinResultado: 1 })
  })
})

describe('exportación', () => {
  it('la tabla lleva fecha, filtros, encabezado, filas e indicadores', () => {
    const r = calcularResumenContable([turno({ resultadoCertificacion: 'RECHAZADA' })])
    const tabla = resumenComoTabla(r, '2026-10-23', 'Servicio RTM')
    expect(tabla[1]).toEqual(['Fecha', '2026-10-23'])
    expect(tabla[2]).toEqual(['Filtros', 'Servicio RTM'])
    expect(tabla).toContainEqual(['Servicio', 'Motos', 'Livianos', 'Otros', 'Total'])
    expect(tabla).toContainEqual(['TOTAL GENERAL', 0, 1, 0, 1])
    expect(tabla).toContainEqual(['% rechazo RTM primera vez', '100,0% (1 de 1)', '0 sin resultado'])
  })

  it('el texto va tabulado, una línea por fila', () => {
    const texto = resumenComoTexto(calcularResumenContable([]), '2026-10-23')
    expect(texto).toContain('Servicio\tMotos\tLivianos\tOtros\tTotal')
    expect(texto).toContain('RTM · Primera vez\t0\t0\t0\t0')
    expect(texto).not.toContain('Filtros')
  })
})
