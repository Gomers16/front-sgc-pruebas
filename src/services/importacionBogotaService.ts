// src/services/importacionBogotaService.ts
// Importación Bogotá: base histórica de una sede distinta de Ibagué
// (archivo de Tecnoingeniería en formato de Bogotá, .xls o .xlsx).
// Paso 1: vista previa (no guarda). Paso 2: lotes, uno por llamada.
import { post, upload } from './http'

export interface DescarteImportacion {
  fila: number
  motivo: string
  placa: string | null
  detalle: string | null
}

export interface ResumenDescartes {
  motivo: string
  texto: string
  filas: number
  ejemplos: DescarteImportacion[]
}

export interface VistaPreviaBogota {
  token: string
  sede: { id: number; nombre: string }
  responsable: { id: number; nombre: string }
  archivo: string
  conTitulos: boolean
  filasLeidas: number
  rango: { desde: string; hasta: string }
  turnos: {
    visitas: number
    aCrear: number
    yaExisten: number
    aprobadas: number
    rechazadas: number
    preventivas: number
  }
  vehiculos: { distintos: number; aCrear: number; existentes: number; conHistorialEnOtraSede: number }
  clientes: { conDocumento: number; aCrear: number; existentes: number; existentesSinHistorial: number }
  conductores: { conDocumento: number; aCrear: number; existentes: number }
  telefonosDescartados: number
  descartes: ResumenDescartes[]
  lotes: { tamano: number; total: number }
}

export interface AvisoImportacion {
  fila: number
  placa: string
  aviso: string
}

export interface ResultadoLote {
  lote: number
  totalLotes: number
  procesados: number
  totalVisitas: number
  terminado: boolean
  turnosCreados: number
  turnosYaExistian: number
  clientesCreados: number
  clientesReutilizados: number
  vehiculosCreados: number
  vehiculosReutilizados: number
  conductoresCreados: number
  conductoresReutilizados: number
  avisos: AvisoImportacion[]
  avisosTotal: number
}

export function vistaPreviaBogota(archivo: File): Promise<VistaPreviaBogota> {
  const form = new FormData()
  form.append('archivo', archivo)
  return upload<VistaPreviaBogota>('/api/rtm/importar-bogota/preview', form)
}

export function importarLoteBogota(token: string, lote: number): Promise<ResultadoLote> {
  return post<ResultadoLote, { token: string; lote: number }>('/api/rtm/importar-bogota/lote', {
    token,
    lote,
  })
}
