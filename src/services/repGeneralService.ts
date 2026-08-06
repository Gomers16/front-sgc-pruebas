// src/services/repGeneralService.ts
import { post } from './http'

export interface RepGeneralImportResumen {
  mesesMinimos: number
  clientesCreados: number
  clientesActualizados: number
  vehiculosCreados: number
  vehiculosActualizados: number
  conductoresCreados: number
  conductoresActualizados: number
  turnosCreados: number
  turnosActualizados: number
  turnosNuevos: number
  turnosRecurrentes: number
  turnosRecuperacion: number
  errores: number
  erroresDetalle?: string[]
  primerError: string | null
}

export interface InformeDiscrepanciasResumen {
  totalTecnoValido: number
  totalSgcFinalizados: number
  totalCoinciden: number
  totalTipo1PlacaMalDigitada: number
  totalTipo2ActivoDebeFinalizar: number
  totalTipo3TurnoFantasma: number
  totalTipo4ServicioMalAsignado: number
  totalTipo5FaltaEnSgc: number
  totalTipo6AlertaCobroNoRegistrado: number
  totalTipo7FinalizadoSinRastroTecno: number
  totalDuplicadosFinalizado: number
  totalAmbiguosRevisarManual: number
}

export interface InformeDiscrepancias {
  id: number
  fechaInicio: string
  fechaFin: string
  resumen: InformeDiscrepanciasResumen
}

export interface RepGeneralImportResponse {
  ok: boolean
  message: string
  resumen: RepGeneralImportResumen
  informeDiscrepancias: InformeDiscrepancias | null
}

/**
 * Importa el archivo RepGeneral (CSV o XLSX) y devuelve el resumen
 * de creación/actualización de clientes, vehículos, conductores y
 * clasificación de recurrencia (nuevo / recurrente / recuperación).
 */
export async function importarRepGeneral(
  file: File
): Promise<RepGeneralImportResponse> {
  const formData = new FormData()
  formData.append('file', file)

  // ✅ NO incluyas headers cuando uses FormData
  // El navegador agregará automáticamente:
  // Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
  const data = await post<RepGeneralImportResponse>(
    '/api/rtm/rep-general/import',
    formData
  )

  return data
}

const repGeneralService = {
  importarRepGeneral,
}

export default repGeneralService
