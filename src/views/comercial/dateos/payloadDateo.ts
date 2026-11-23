// Payload de POST /api/captacion-dateos que arma DateoCreate.vue (puro, con tests).
//
// Sin gestión de Telemercadeo el payload es exactamente el de siempre. Con
// gestión: canal TELE, servicio de la gestión, sin agente (el backend lo toma
// del token), sin convenio ni descuento/avance, y telemercadeo_gestion_id.

export type CanalForm = 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'

export interface FormDateo {
  canal: CanalForm
  agente_id: number | null
  convenio_id: number | null
  placa: string
  telefono: string
  observacion: string
  descuento_id: number | null
  es_avance: boolean
  comprobante_avance_url: string | null
  imagen_url: string | null
  imagen_mime: string | null
  imagen_tamano_bytes: number | null
  imagen_hash: string | null
  imagen_origen_id: string | number | null
  servicio_id: number | null
}

export interface CreateDateoPayload {
  canal: CanalForm
  origen: 'UI'
  agente_id: number | null
  convenio_id: number | null
  placa: string | null
  telefono: string | null
  observacion: string | null
  descuento_id?: number | null
  es_avance?: boolean
  comprobante_avance_url?: string | null
  imagen_url?: string | null
  imagen_mime?: string | null
  imagen_tamano_bytes?: number | null
  imagen_hash?: string | null
  imagen_origen_id?: string | number | null
  servicio_id?: number | null
  confirmar_excepcion?: boolean
  telemercadeo_gestion_id?: number
}

/** Gestión desde la que se datea (lo que DateoCreate necesita de ella). */
export interface GestionOrigenDateo {
  id: number
  servicio_id: number
}

export function construirPayloadDateo(
  form: FormDateo,
  opts: {
    puedeSeleccionarDescuento: boolean
    confirmarExcepcion?: boolean
    gestion?: GestionOrigenDateo | null
  },
): CreateDateoPayload {
  const gestion = opts.gestion ?? null
  if (gestion) {
    const payload: CreateDateoPayload = {
      canal: 'TELE',
      origen: 'UI',
      agente_id: null,
      convenio_id: null,
      placa: form.placa ? form.placa.toUpperCase().trim() : null,
      telefono: form.telefono || null,
      observacion: form.observacion || null,
      descuento_id: null,
      es_avance: false,
      comprobante_avance_url: null,
      servicio_id: gestion.servicio_id,
      telemercadeo_gestion_id: gestion.id,
    }
    agregarImagen(payload, form)
    if (opts.confirmarExcepcion) payload.confirmar_excepcion = true
    return payload
  }

  const payload: CreateDateoPayload = {
    canal: form.canal,
    origen: 'UI',
    agente_id: form.agente_id,
    convenio_id: form.convenio_id,
    placa: form.placa ? form.placa.toUpperCase().trim() : null,
    telefono: form.telefono || null,
    observacion: form.observacion || null,
    descuento_id: opts.puedeSeleccionarDescuento ? form.descuento_id || null : null,
    es_avance: form.es_avance || false,
    comprobante_avance_url: form.es_avance ? form.comprobante_avance_url || null : null,
    servicio_id: form.servicio_id || null,
  }
  agregarImagen(payload, form)
  if (opts.confirmarExcepcion) payload.confirmar_excepcion = true
  return payload
}

function agregarImagen(payload: CreateDateoPayload, form: FormDateo) {
  if (!form.imagen_url) return
  payload.imagen_url = form.imagen_url
  payload.imagen_mime = form.imagen_mime ?? null
  payload.imagen_tamano_bytes = form.imagen_tamano_bytes ?? null
  payload.imagen_hash = form.imagen_hash ?? null
  payload.imagen_origen_id = form.imagen_origen_id ?? null
}

/**
 * ¿Se muestra el campo "Convenio" en DateoCreate? Con una gestión de
 * Telemercadeo no (decisión 2026-11-23): el payload lo manda en null y el
 * backend rechaza convenio_id con 400 TELE_SIN_CONVENIO_DESCUENTO.
 */
export function mostrarConvenioEnDateo(gestionId: number | null): boolean {
  return gestionId === null
}

/** gestion_id de la query (?gestion_id=12), o null si no viene o no es válido. */
export function leerGestionIdQuery(v: unknown): number | null {
  const raw = Array.isArray(v) ? v[0] : v
  if (raw === undefined || raw === null || raw === '') return null
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}
