// Resumen contable del día (Turnos del Día → modal "Estadísticas", y en versión
// compacta en la cabecera, al lado de la leyenda).
//
// Base: los turnos que recibe (en la vista, turnosParaContadores: fecha del
// día + filtro de servicio/placa, sin el filtro de estado), excluyendo los
// cancelados e inactivos — no son servicios prestados.
//
// Tipo de vehículo (turnos_rtms.tipo_vehiculo, enum de 4 valores):
//   'Motocicleta'                                             → Motos
//   'Liviano Particular' | 'Liviano Taxi' | 'Liviano Público' → Livianos
//   cualquier otro valor o vacío (no debería darse hoy)       → Otros
//
// RTM se separa en primera vez / segunda vez (es_segunda_vez, 0/1). Los demás
// servicios van en una fila cada uno, sin separar. El % de rechazo RTM es
// RECHAZADA / (APROBADA + RECHAZADA) sobre resultado_certificacion; los turnos
// sin resultado se cuentan aparte y no entran al denominador.

export type GrupoVehiculo = 'motos' | 'livianos' | 'otros'

export interface TurnoParaResumen {
  servicioCodigo: string | null
  tipoVehiculo: string | null
  estado: string
  esSegundaVez?: boolean | number | null
  resultadoCertificacion?: 'APROBADA' | 'RECHAZADA' | null
}

export interface FilaResumen {
  clave: string
  etiqueta: string
  motos: number
  livianos: number
  otros: number
  total: number
  tipo: 'detalle' | 'subtotal' | 'total'
}

export interface RechazoRtm {
  aprobadas: number
  rechazadas: number
  sinResultado: number
  /** null si no hay ningún turno con resultado (denominador 0). */
  porcentaje: number | null
}

export interface ResumenContable {
  filas: FilaResumen[]
  rechazo: { primeraVez: RechazoRtm; segundaVez: RechazoRtm }
}

/** Servicios que siempre tienen fila (aunque estén en 0), en este orden. */
const SERVICIOS_FIJOS = ['SOAT', 'PREV', 'PERI']
const SIN_SERVICIO = 'SIN SERVICIO'
const LIVIANOS = ['Liviano Particular', 'Liviano Taxi', 'Liviano Público']

export function grupoVehiculo(tipo: string | null | undefined): GrupoVehiculo {
  if (tipo === 'Motocicleta') return 'motos'
  if (tipo && LIVIANOS.includes(tipo)) return 'livianos'
  return 'otros'
}

function filaVacia(clave: string, etiqueta: string, tipo: FilaResumen['tipo']): FilaResumen {
  return { clave, etiqueta, motos: 0, livianos: 0, otros: 0, total: 0, tipo }
}

function sumar(fila: FilaResumen, grupo: GrupoVehiculo) {
  fila[grupo]++
  fila.total++
}

function rechazoVacio(): RechazoRtm {
  return { aprobadas: 0, rechazadas: 0, sinResultado: 0, porcentaje: null }
}

export function calcularResumenContable(turnos: TurnoParaResumen[]): ResumenContable {
  const rtmPrimera = filaVacia('RTM_PRIMERA', 'RTM · Primera vez', 'detalle')
  const rtmSegunda = filaVacia('RTM_SEGUNDA', 'RTM · Segunda vez', 'detalle')
  const rtmTotal = filaVacia('RTM_TOTAL', 'RTM · Total', 'subtotal')
  const otros = new Map<string, FilaResumen>()
  for (const s of SERVICIOS_FIJOS) otros.set(s, filaVacia(s, s, 'detalle'))
  const general = filaVacia('TOTAL', 'TOTAL GENERAL', 'total')
  const rechazo = { primeraVez: rechazoVacio(), segundaVez: rechazoVacio() }

  for (const t of turnos) {
    if (t.estado === 'cancelado' || t.estado === 'inactivo') continue

    const grupo = grupoVehiculo(t.tipoVehiculo)
    const codigo = (t.servicioCodigo ?? '').trim().toUpperCase() || SIN_SERVICIO
    sumar(general, grupo)

    if (codigo === 'RTM') {
      const segunda = Boolean(t.esSegundaVez)
      sumar(segunda ? rtmSegunda : rtmPrimera, grupo)
      sumar(rtmTotal, grupo)

      const r = segunda ? rechazo.segundaVez : rechazo.primeraVez
      if (t.resultadoCertificacion === 'RECHAZADA') r.rechazadas++
      else if (t.resultadoCertificacion === 'APROBADA') r.aprobadas++
      else r.sinResultado++
      continue
    }

    if (!otros.has(codigo)) otros.set(codigo, filaVacia(codigo, codigo, 'detalle'))
    sumar(otros.get(codigo)!, grupo)
  }

  for (const r of [rechazo.primeraVez, rechazo.segundaVez]) {
    const conResultado = r.aprobadas + r.rechazadas
    r.porcentaje = conResultado > 0 ? (r.rechazadas / conResultado) * 100 : null
  }

  // Fijos primero; los no previstos después, en orden alfabético.
  const extras = [...otros.keys()].filter((k) => !SERVICIOS_FIJOS.includes(k)).sort()
  const filasOtros = [...SERVICIOS_FIJOS, ...extras].map((k) => otros.get(k)!)

  return { filas: [rtmPrimera, rtmSegunda, rtmTotal, ...filasOtros, general], rechazo }
}

export interface ResumenCompacto {
  filas: FilaResumen[]
  /** La columna Otros solo se muestra si algún turno cae ahí. */
  mostrarOtros: boolean
  /** Sin turnos (descontados cancelados e inactivos): la vista muestra "Sin turnos". */
  sinTurnos: boolean
}

const FILAS_COMPACTAS_FIJAS = ['RTM_PRIMERA', 'RTM_SEGUNDA', ...SERVICIOS_FIJOS]
const ETIQUETA_CORTA: Record<string, string> = {
  RTM_PRIMERA: 'RTM 1ª vez',
  RTM_SEGUNDA: 'RTM 2ª vez',
  TOTAL: 'Total',
}

/**
 * Versión compacta para la cabecera de Turnos del Día (al lado de la leyenda):
 * sin el subtotal RTM, con etiquetas cortas. RTM 1ª/2ª, SOAT, PREV y PERI
 * siempre; los servicios no previstos solo si tienen turnos, para que el total
 * cuadre con las filas visibles.
 */
export function resumenCompacto(resumen: ResumenContable): ResumenCompacto {
  const general = resumen.filas.find((f) => f.tipo === 'total')!
  const filas = resumen.filas
    .filter(
      (f) => f.tipo === 'total' || FILAS_COMPACTAS_FIJAS.includes(f.clave) || (f.tipo === 'detalle' && f.total > 0)
    )
    .map((f) => ({ ...f, etiqueta: ETIQUETA_CORTA[f.clave] ?? f.etiqueta }))
  return { filas, mostrarOtros: general.otros > 0, sinTurnos: general.total === 0 }
}

/** "15,0% (3 de 20)" o "—" si no hay turnos con resultado. */
export function textoRechazo(r: RechazoRtm): string {
  if (r.porcentaje === null) return '—'
  const pct = r.porcentaje.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `${pct}% (${r.rechazadas} de ${r.aprobadas + r.rechazadas})`
}

/** Tabla completa (encabezado, filas e indicadores) para copiar o exportar a Excel. */
export function resumenComoTabla(
  resumen: ResumenContable,
  fecha: string,
  filtros?: string
): (string | number)[][] {
  const tabla: (string | number)[][] = [['Resumen contable del día'], ['Fecha', fecha]]
  if (filtros) tabla.push(['Filtros', filtros])
  tabla.push([])
  tabla.push(['Servicio', 'Motos', 'Livianos', 'Otros', 'Total'])
  for (const f of resumen.filas) tabla.push([f.etiqueta, f.motos, f.livianos, f.otros, f.total])
  tabla.push([])
  const { primeraVez, segundaVez } = resumen.rechazo
  tabla.push(['% rechazo RTM primera vez', textoRechazo(primeraVez), `${primeraVez.sinResultado} sin resultado`])
  tabla.push(['% rechazo RTM segunda vez', textoRechazo(segundaVez), `${segundaVez.sinResultado} sin resultado`])
  return tabla
}

/** Texto tabulado (pegable en Excel o WhatsApp). */
export function resumenComoTexto(resumen: ResumenContable, fecha: string, filtros?: string): string {
  return resumenComoTabla(resumen, fecha, filtros)
    .map((fila) => fila.join('\t'))
    .join('\n')
}
