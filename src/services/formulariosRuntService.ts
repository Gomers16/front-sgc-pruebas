import { get, put, download } from './http'

// ─── Union types ────────────────────────────────────────────────────────────

export type ClaseVehiculo =
  | 'automovil' | 'bus' | 'buseta' | 'camion' | 'camioneta'
  | 'campero' | 'microbus' | 'tractocamion' | 'motocicleta'
  | 'motocarro' | 'mototriciclo' | 'cuatrimoto' | 'volqueta' | 'otro'

export type TipoCombustible =
  | 'gasolina' | 'diesel' | 'gas' | 'electrico' | 'hibrido' | 'etanol' | 'biodiesel'

export type TipoServicio =
  | 'particular' | 'publico' | 'diplomatico' | 'oficial' | 'especial' | 'otros'

export type TipoDocumento =
  | 'cc' | 'nit' | 'nn' | 'pasaporte' | 'c_extranjeria' | 't_identidad' | 'nuip' | 'c_diplomatico'

export type TipoImportacion =
  | 'manif_o_acta' | 'dec_importacion' | 'acta' | 'entidad' | 'lugar' | 'codigo'

// ─── Interfaz principal ──────────────────────────────────────────────────────

export interface FormularioRunt {
  id?: number
  tramiteId: number

  // Sección 1 — Datos del Vehículo
  placa: string | null
  marca: string | null
  linea: string | null
  modelo: string | null
  color: string | null
  claseVehiculo: ClaseVehiculo | null
  combustible: TipoCombustible | null
  noMotor: string | null
  noChasis: string | null
  noSerie: string | null
  noVin: string | null
  tipoServicio: TipoServicio | null
  capacidadKg: string | null
  blindaje: boolean
  potenciaHp: string | null
  cilindrada: string | null
  puertas: string | null

  // Sección 2 — Datos del Propietario
  propPrimerApellido: string | null
  propSegundoApellido: string | null
  propNombres: string | null
  propTipoDocumento: TipoDocumento | null
  propNoDocumento: string | null
  propDireccion: string | null
  propCiudad: string | null
  propTelefono: string | null
  propCorreo: string | null

  // Sección 3 — Datos del Comprador
  compPrimerApellido: string | null
  compSegundoApellido: string | null
  compNombres: string | null
  compTipoDocumento: TipoDocumento | null
  compNoDocumento: string | null
  compDireccion: string | null
  compCiudad: string | null
  compTelefono: string | null
  compCorreo: string | null

  // Sección 4 — Datos del Mandatario
  mandatarioNombre: string | null
  mandatarioDocumento: string | null

  // Sección 5 — Alertas e Importación
  alertaHurto: boolean
  alertaLimitacionPropiedad: boolean
  alertaEmbargo: boolean
  alertaOtro: string | null
  tipoImportacion: TipoImportacion | null
  noDocumentoImportacion: string | null
  fechaImportacion: string | null

  // Sección 6 — Observaciones
  observacionesRunt: string | null
}

// ─── Constantes para los v-select ───────────────────────────────────────────

export const CLASE_VEHICULO_ITEMS: { title: string; value: ClaseVehiculo }[] = [
  { title: 'Automóvil',    value: 'automovil'    },
  { title: 'Bus',          value: 'bus'          },
  { title: 'Buseta',       value: 'buseta'       },
  { title: 'Camión',       value: 'camion'       },
  { title: 'Camioneta',    value: 'camioneta'    },
  { title: 'Campero',      value: 'campero'      },
  { title: 'Microbús',     value: 'microbus'     },
  { title: 'Tractocamión', value: 'tractocamion' },
  { title: 'Motocicleta',  value: 'motocicleta'  },
  { title: 'Motocarro',    value: 'motocarro'    },
  { title: 'Mototriciclo', value: 'mototriciclo' },
  { title: 'Cuatrimoto',   value: 'cuatrimoto'   },
  { title: 'Volqueta',     value: 'volqueta'     },
  { title: 'Otro',         value: 'otro'         },
]

export const COMBUSTIBLE_ITEMS: { title: string; value: TipoCombustible }[] = [
  { title: 'Gasolina',  value: 'gasolina'  },
  { title: 'Diésel',    value: 'diesel'    },
  { title: 'Gas',       value: 'gas'       },
  { title: 'Eléctrico', value: 'electrico' },
  { title: 'Híbrido',   value: 'hibrido'   },
  { title: 'Etanol',    value: 'etanol'    },
  { title: 'Biodiesel', value: 'biodiesel' },
]

export const TIPO_SERVICIO_ITEMS: { title: string; value: TipoServicio }[] = [
  { title: 'Particular',  value: 'particular'  },
  { title: 'Público',     value: 'publico'     },
  { title: 'Diplomático', value: 'diplomatico' },
  { title: 'Oficial',     value: 'oficial'     },
  { title: 'Especial',    value: 'especial'    },
  { title: 'Otros',       value: 'otros'       },
]

export const TIPO_DOCUMENTO_ITEMS: { title: string; value: TipoDocumento }[] = [
  { title: 'Cédula de Ciudadanía', value: 'cc'           },
  { title: 'NIT',                  value: 'nit'          },
  { title: 'Número de Nacimiento', value: 'nn'           },
  { title: 'Pasaporte',            value: 'pasaporte'    },
  { title: 'Cédula de Extranjería',value: 'c_extranjeria'},
  { title: 'Tarjeta de Identidad', value: 't_identidad'  },
  { title: 'NUIP',                 value: 'nuip'         },
  { title: 'Carné Diplomático',    value: 'c_diplomatico'},
]

export const TIPO_IMPORTACION_ITEMS: { title: string; value: TipoImportacion }[] = [
  { title: 'Manifiesto o Acta',         value: 'manif_o_acta'   },
  { title: 'Declaración de Importación',value: 'dec_importacion'},
  { title: 'Acta',                      value: 'acta'           },
  { title: 'Entidad',                   value: 'entidad'        },
  { title: 'Lugar',                     value: 'lugar'          },
  { title: 'Código',                    value: 'codigo'         },
]

// ─── Servicio ────────────────────────────────────────────────────────────────

const BASE = '/api/tramites'

export const FormulariosRuntService = {
  getByTramite(tramiteId: number) {
    return get<FormularioRunt>(`${BASE}/${tramiteId}/formulario-runt`)
  },

  upsert(tramiteId: number, datos: Partial<FormularioRunt>) {
    return put<FormularioRunt, Partial<FormularioRunt>>(
      `${BASE}/${tramiteId}/formulario-runt`,
      datos,
    )
  },

  exportExcel(tramiteId: number): Promise<Blob> {
    return download(`${BASE}/${tramiteId}/formulario-runt/export-excel`)
  },

  exportMandatoExcel(tramiteId: number): Promise<Blob> {
    return download(`${BASE}/${tramiteId}/mandato/export-excel`)
  },

  exportPaqueteCompleto(tramiteId: number): Promise<Blob> {
    return download(`${BASE}/${tramiteId}/paquete/export-excel`)
  },
}
