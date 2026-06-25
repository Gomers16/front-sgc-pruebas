import { get } from './http'

export interface PagoEnPeriodo {
  id:             number
  fecha:          string | null
  monto:          number
  formaPago:      string | null
  referenciaPago: string | null
  evidenciaUrl:   string | null
}

export interface LiquidacionReporte {
  tramiteLiquidacionId: number
  tramiteId:            number
  turnoNumero:          number
  placa:                string | null
  tipoTramite:          string | null
  nombreCliente:        string | null
  abonadoEnPeriodo:     number
  totalLiquidacion:     number
  saldoPendienteActual: number
  estado:               'pendiente' | 'parcial' | 'pagado'
  pagosEnPeriodo:       PagoEnPeriodo[]
}

export interface ReporteCaja {
  fechaInicio:    string
  fechaFin:       string
  totalIngresado: number
  porFormaPago:   Record<string, number>
  liquidaciones:  LiquidacionReporte[]
}

export const ReporteCajaService = {
  getReporteCaja(fechaInicio: string, fechaFin: string) {
    const params = new URLSearchParams({ fechaInicio, fechaFin })
    return get<ReporteCaja>(`/api/tramites/reporte-caja?${params}`)
  },
}
