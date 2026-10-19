import { describe, expect, it, vi } from 'vitest'
import type { BloqueEstadisticasTickets, EstadisticasTickets } from '@/services/ticketsService'
import { conteosPorEstado, filasPorAsesor, totalesDeFilas } from '../estadisticasPorAsesor'

const m = (asesor = 0, convenio = 0, tickets = 0) => ({ asesor, convenio, tickets })

function bloque(
  p: Partial<{
    creados: number
    dentro: number
    fuera: number
    aprobados: number
    rechazados: number
    pendientes: number
    real: [number, number]
    proceso: [number, number]
    exacto: [number, number]
    estimado: [number, number]
  }>,
): BloqueEstadisticasTickets {
  const [ea, ec] = p.exacto ?? [0, 0]
  const [sa, sc] = p.estimado ?? [0, 0]
  return {
    creados: p.creados ?? 0,
    dentro_ventana: p.dentro ?? 0,
    fuera_ventana: p.fuera ?? 0,
    aprobados: {
      total: p.aprobados ?? 0,
      con: 0,
      sin_asesor: 0,
      sin_convenio: 0,
      sin_ninguno: 0,
      regimen_anterior: 0,
    },
    rechazados: p.rechazados ?? 0,
    pendientes: p.pendientes ?? 0,
    tasa_aprobacion: null,
    tiempo_promedio_resolucion_min: null,
    dinero: {
      comision_real: { ...m(...(p.real ?? [0, 0])), por_estado: {} },
      en_proceso: m(...(p.proceso ?? [0, 0])),
      dejado_de_pagar: { ...m(ea + sa, ec + sc), exacto: m(ea, ec), estimado: m(sa, sc) },
    },
  }
}

const datos: Pick<EstadisticasTickets, 'por_asesor' | 'totales'> = {
  por_asesor: [
    {
      comercial_id: 1,
      comercial_nombre: 'ANA',
      ...bloque({ creados: 2, dentro: 1, fuera: 1, aprobados: 2, real: [8640, 20000] }),
    },
    {
      comercial_id: 2,
      comercial_nombre: 'BETO',
      ...bloque({
        creados: 3,
        fuera: 3,
        aprobados: 1,
        rechazados: 1,
        pendientes: 1,
        proceso: [8640, 0],
        exacto: [0, 20000],
      }),
    },
    // Asesor convenio (Caso 2): no es comercial, no va en la tabla.
    {
      comercial_id: 9,
      comercial_nombre: 'CONVENIO',
      ...bloque({ creados: 4, aprobados: 4, real: [15000, 0] }),
    },
  ],
  totales: bloque({ creados: 9 }),
}

describe('filasPorAsesor', () => {
  const comerciales = new Set([1, 2])
  const { filas, ticketsFuera } = filasPorAsesor(datos, (id) => comerciales.has(id))

  it('una fila por asesor comercial, montos aplanados para ordenar', () => {
    expect(filas.map((f) => f.nombre)).toEqual(['BETO', 'ANA'])
    expect(filas[1]).toMatchObject({
      creados: 2,
      dentro: 1,
      fuera: 1,
      aprobados: 2,
      asesor_real: 8640,
      convenio_real: 20000,
      asesor_proceso: 0,
      generada: 28640,
      por_generar: 0,
      dejado: 0,
    })
    expect(filas[0]).toMatchObject({
      rechazados: 1,
      pendientes: 1,
      asesor_proceso: 8640,
      por_generar: 8640,
      dejado: 20000,
      dejado_convenio: 20000,
      dejado_exacto: 20000,
      dejado_estimado: 0,
    })
  })

  it('cuenta los tickets que quedan fuera (asesores convenio) para avisarlo', () => {
    expect(ticketsFuera).toBe(4)
  })

  it('totales = suma de las filas mostradas', () => {
    expect(totalesDeFilas(filas)).toMatchObject({
      creados: 5,
      aprobados: 3,
      rechazados: 1,
      pendientes: 1,
      asesor_real: 8640,
      asesor_proceso: 8640,
      convenio_real: 20000,
      generada: 28640,
      por_generar: 8640,
      dejado: 20000,
    })
    expect(totalesDeFilas([]).creados).toBe(0)
  })
})

describe('conteosPorEstado', () => {
  it('sin filtro de estado consulta los tres', async () => {
    const contar = vi.fn(async (e: string) => ({ PENDIENTE: 3, APROBADO: 5, RECHAZADO: 1 })[e]!)
    expect(await conteosPorEstado(null, contar)).toEqual({
      PENDIENTE: 3,
      APROBADO: 5,
      RECHAZADO: 1,
    })
    expect(contar).toHaveBeenCalledTimes(3)
  })

  it('con filtro de estado solo cuenta ese; los otros son 0 sin consultar', async () => {
    const contar = vi.fn(async () => 7)
    expect(await conteosPorEstado('RECHAZADO', contar)).toEqual({
      PENDIENTE: 0,
      APROBADO: 0,
      RECHAZADO: 7,
    })
    expect(contar).toHaveBeenCalledExactlyOnceWith('RECHAZADO')
  })
})
