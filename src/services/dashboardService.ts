// src/services/dashboardService.ts
import { DateTime } from 'luxon'
import TurnosDelDiaService from './turnosdeldiaService'
import type { Turno } from './turnosdeldiaService'

export interface DashboardData {
  turnosEnProceso: number
  turnosFinalizados: number
  /** De los anteriores, cuántos son segunda vez gratuita (se incluyen, con marca "2ª vez"). */
  turnosEnProcesoSegundaVez: number
  turnosFinalizadosSegundaVez: number
  siguienteTurno: number
  /** En proceso del día, por servicio */
  turnosEnProcesoPorServicio: {
    soat: number
    rtm: number
    preventiva: number
    peritaje: number
  }
  /** 👇 Totales del día (en proceso + finalizados), por servicio */
  turnosTotalesPorServicio: {
    soat: number
    rtm: number
    preventiva: number
    peritaje: number
  }
}

interface TurnoWithNumber {
  turnoNumero?: number | string
  numero?: number | string
}

async function fetchTurnosDelDia(fechaISO: string): Promise<Turno[]> {
  try {
    return await TurnosDelDiaService.fetchTurnos({ fecha: fechaISO })
  } catch {
    return []
  }
}

async function fetchNextTurnNumberSafe(usuarioId: number): Promise<number> {
  try {
    const r = await TurnosDelDiaService.fetchNextTurnNumber(usuarioId)
    return typeof r?.siguiente === 'number' ? r.siguiente : 0
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message.toLowerCase() : ''
    if (msg.includes('no tiene una sede asignada') || msg.includes('sede')) {
      return 0
    }
    throw e
  }
}

function computeMinExpectedNext(turnos: Turno[]): number {
  const numeros = turnos
    .map((t) => {
      const turnoWithNum = t as unknown as TurnoWithNumber
      return Number(turnoWithNum.turnoNumero ?? turnoWithNum.numero)
    })
    .filter((n) => Number.isFinite(n))
  const minByMaxNumero = numeros.length ? Math.max(...numeros) + 1 : null
  const minByCount = turnos.length + 1
  return minByMaxNumero ?? minByCount
}

/** helper: está "en proceso" = activo y sin horaSalida */
const isEnProceso = (t: Turno) => t.estado === 'activo' && !t.horaSalida

/**
 * helper: normaliza el código del servicio de un turno.
 * Acepta: RTM, PREV, PREVENTIVA, PERI, PERITAJE, SOAT.
 * Devuelve: 'RTM' | 'PREV' | 'PERI' | 'SOAT' | ''.
 */
function getServicioCode(t: Turno): string {
  const turnoAny = t as unknown as Record<string, unknown>
  const servicio = turnoAny.servicio as Record<string, unknown> | undefined

  const codeRaw =
    servicio?.codigoServicio ??
    servicio?.codigo ??
    turnoAny.servicioCodigo ??
    turnoAny.codigoServicio ??
    ''

  const code = typeof codeRaw === 'string' ? codeRaw.toUpperCase().trim() : ''
  if (code === 'RTM') return 'RTM'
  if (code === 'SOAT') return 'SOAT'
  if (code === 'PREV' || code === 'PREVENTIVA') return 'PREV'
  if (code === 'PERI' || code === 'PERITAJE') return 'PERI'
  return ''
}

export async function fetchDashboard(usuarioId: number): Promise<DashboardData> {
  const todayISO = DateTime.local().setZone('America/Bogota').toISODate() || ''
  const turnos = await fetchTurnosDelDia(todayISO)

  const turnosEnProceso = turnos.filter(isEnProceso).length
  const esFinalizado = (t: Turno) =>
    t.estado === 'finalizado' || (t.estado === 'activo' && !!t.horaSalida)
  const turnosFinalizados = turnos.filter(esFinalizado).length
  // Operativo: las segundas veces se incluyen en los conteos del día; solo se
  // informa cuántas son (es_segunda_vez llega 0/1 → Boolean()).
  const turnosEnProcesoSegundaVez = turnos.filter((t) => isEnProceso(t) && Boolean(t.esSegundaVez)).length
  const turnosFinalizadosSegundaVez = turnos.filter((t) => esFinalizado(t) && Boolean(t.esSegundaVez)).length

  const nextFromBackend = await fetchNextTurnNumberSafe(usuarioId)
  const minExpected = computeMinExpectedNext(turnos)
  const siguienteTurno = Math.max(nextFromBackend || 0, minExpected)

  // En proceso por servicio
  let rtmProc = 0, prevProc = 0, periProc = 0, soatProc = 0
  // Totales por servicio (en proceso + finalizados del día)
  let rtmTot = 0,  prevTot = 0,  periTot = 0,  soatTot = 0

  for (const t of turnos) {
    const code = getServicioCode(t)

    // Totales (todos los turnos del día)
    if (code === 'RTM') rtmTot++
    else if (code === 'PREV') prevTot++
    else if (code === 'PERI') periTot++
    else if (code === 'SOAT') soatTot++

    // En proceso
    if (!isEnProceso(t)) continue
    if (code === 'RTM') rtmProc++
    else if (code === 'PREV') prevProc++
    else if (code === 'PERI') periProc++
    else if (code === 'SOAT') soatProc++
  }

  return {
    turnosEnProceso,
    turnosFinalizados,
    turnosEnProcesoSegundaVez,
    turnosFinalizadosSegundaVez,
    siguienteTurno,
    turnosEnProcesoPorServicio: {
      rtm: rtmProc,
      preventiva: prevProc,
      peritaje: periProc,
      soat: soatProc,
    },
    turnosTotalesPorServicio: {
      rtm: rtmTot,
      preventiva: prevTot,
      peritaje: periTot,
      soat: soatTot,
    },
  }
}

export default { fetchDashboard }
