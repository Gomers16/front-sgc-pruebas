// Payload de POST /api/captacion-dateos que arma DateoCreate.vue (puro, con tests).
//
// Sin gestión de Telemercadeo el payload es exactamente el de siempre. Con
// gestión: canal TELE, servicio de la gestión, sin agente (el backend lo toma
// del token), sin convenio ni descuento/avance, y telemercadeo_gestion_id.
// Asesor de Telemercadeo (con o sin gestión): igual, más el origen que elige
// (telemercadeo_origen_id). El bloqueo real está en el backend.

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
  telemercadeo_origen_id?: number
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
    /** El usuario es asesor de Telemercadeo (aunque no venga de una gestión). */
    asesorTele?: boolean
    /** Origen elegido (solo con Telemercadeo). */
    origenTeleId?: number | null
  },
): CreateDateoPayload {
  const gestion = opts.gestion ?? null
  if (gestion || opts.asesorTele) {
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
      servicio_id: gestion ? gestion.servicio_id : form.servicio_id || null,
    }
    if (gestion) payload.telemercadeo_gestion_id = gestion.id
    if (opts.origenTeleId) payload.telemercadeo_origen_id = opts.origenTeleId
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
export function mostrarConvenioEnDateo(gestionId: number | null, asesorTele = false): boolean {
  return gestionId === null && !asesorTele
}

/** ¿Se muestra el selector "Origen" y el aviso de Telemercadeo? */
export function mostrarOrigenTele(gestionId: number | null, asesorTele: boolean): boolean {
  return gestionId !== null || asesorTele
}

/** Tipo de asesor y agente: siempre para el asesor de Telemercadeo (bloqueados); con gestión, nadie más. */
export function mostrarAsesorEnDateo(
  canal: CanalForm,
  gestionId: number | null,
  asesorTele: boolean,
): boolean {
  if (asesorTele) return true
  if (gestionId !== null) return false
  return canal === 'ASESOR' || canal === 'TELE'
}

export interface OrigenItem {
  id: number
  nombre: string
}

/** Orígenes del selector: los activos, más el de la gestión si ya no está activo. */
export function opcionesOrigen(activos: OrigenItem[], deGestion: OrigenItem | null): OrigenItem[] {
  if (!deGestion || activos.some((o) => o.id === deGestion.id)) return activos
  return [...activos, deGestion]
}

/** gestion_id de la query (?gestion_id=12), o null si no viene o no es válido. */
export function leerGestionIdQuery(v: unknown): number | null {
  const raw = Array.isArray(v) ? v[0] : v
  if (raw === undefined || raw === null || raw === '') return null
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}
