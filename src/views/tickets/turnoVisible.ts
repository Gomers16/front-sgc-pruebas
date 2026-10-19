// src/views/tickets/turnoVisible.ts
//
// Cómo se muestra el turno de un ticket: el número visible (el del día, el que
// sale en el TV) con su servicio, y la fecha aparte porque el número se repite
// cada día. El id interno (turnos_rtms.id) solo como respaldo.

export interface TurnoVisibleEntrada {
  turnoId: number | null
  turnoNumero: number | null
  servicioCodigo: string | null
  /** YYYY-MM-DD */
  fecha: string | null
}

export interface TurnoVisible {
  /** "N° 12 · RTM"; sin número válido, "Turno id #4866". */
  principal: string
  /** Fecha del turno DD/MM/AAAA, o null. */
  secundario: string | null
}

const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/

export function turnoVisible(t: TurnoVisibleEntrada): TurnoVisible {
  const m = t.fecha ? FECHA.exec(t.fecha) : null
  const secundario = m ? `${m[3]}/${m[2]}/${m[1]}` : null
  // Sin número (o ≤ 0, como los turnos de prueba) no hay nada visible que mostrar.
  if (t.turnoNumero === null || t.turnoNumero <= 0) {
    return { principal: t.turnoId ? `Turno id #${t.turnoId}` : '—', secundario }
  }
  const servicio = t.servicioCodigo?.trim()
  return {
    principal: servicio ? `N° ${t.turnoNumero} · ${servicio}` : `N° ${t.turnoNumero}`,
    secundario,
  }
}
