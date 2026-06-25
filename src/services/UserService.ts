// src/services/UserService.ts
import { get, post, put, del, upload } from './http'

/* =========================
   Tipos / Interfaces
========================= */
export interface Rol { id: number; nombre: string }
export interface RazonSocial { id: number; nombre: string }
export interface Sede { id: number; nombre: string }
export interface Cargo { id: number; nombre: string }

export interface EntidadSalud {
  id: number
  nombre: string
  tipo: 'eps' | 'arl' | 'afp' | 'afc' | 'ccf'
}

export interface DeleteResponse { message: string }

export interface ContratoPaso {
  id: number
  contratoId: number
  fase: 'inicio' | 'desarrollo' | 'fin'
  nombrePaso: string
  fecha?: string
  archivoUrl?: string
  observacion?: string
  orden: number
  completado: boolean
  createdAt: string
  updatedAt: string
}

export interface ContratoEvento {
  id: number
  contratoId: number
  tipo:
    | 'Incapacidad'
    | 'Suspension'
    | 'Licencia'
    | 'Permiso'
    | 'Vacaciones'
    | 'Cesantias'
    | 'Disciplinario'
    | 'Terminacion'
  subtipo?: string
  fechaInicio: string
  fechaFin?: string
  descripcion?: string
  documentoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Contrato {
  id: number
  usuarioId: number
  sedeId: number
  tipoContrato: 'prestacion' | 'temporal' | 'laboral' | 'aprendizaje'
  estado: 'activo' | 'inactivo'
  fechaInicio: string
  fechaFin?: string
  motivoFinalizacion?: string
  nombreArchivoContratoFisico?: string
  rutaArchivoContratoFisico?: string
  terminoContrato?: 'fijo' | 'obra_o_labor_determinada' | 'indefinido' | string
  rutaArchivoRecomendacionMedica?: string | null
  eventos?: ContratoEvento[]
  pasos?: ContratoPaso[]
}

export interface AfiliacionFileMeta {
  url: string
  nombreOriginal: string
  mime: string
  size: number
}

export interface AfiliacionFileResponse {
  userId: number
  tipo: 'eps' | 'arl' | 'afp' | 'afc' | 'ccf'
  tieneArchivo: boolean
  data: AfiliacionFileMeta | null
}

export type EstadoUsuario = 'activo' | 'inactivo'

export interface User {
  id: number
  nombres: string
  apellidos: string
  correo: string
  correoPersonal?: string
  celularPersonal?: string
  celularCorporativo?: string
  direccion?: string
  centroCosto?: string
  recomendaciones?: boolean
  fotoPerfil?: string
  estado: EstadoUsuario

  // ✅ NUEVOS CAMPOS
  tipoSangre?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null
  contactoEmergenciaNombre?: string
  contactoEmergenciaTelefono?: string
  numeroDocumento?: string | null

  rolId: number
  rol?: Rol
  razonSocialId: number
  razonSocial?: RazonSocial
  sedeId: number
  sede?: Sede
  cargoId: number
  cargo?: Cargo
  epsId?: number
  eps?: EntidadSalud
  arlId?: number
  arl?: EntidadSalud
  afpId?: number
  afp?: EntidadSalud
  afcId?: number
  afc?: EntidadSalud
  ccfId?: number
  ccf?: EntidadSalud

  epsDocPath?: string | null; epsDocNombre?: string | null; epsDocMime?: string | null; epsDocSize?: number | null
  arlDocPath?: string | null; arlDocNombre?: string | null; arlDocMime?: string | null; arlDocSize?: number | null
  afpDocPath?: string | null; afpDocNombre?: string | null; afpDocMime?: string | null; afpDocSize?: number | null
  afcDocPath?: string | null; afcDocNombre?: string | null; afcDocMime?: string | null; afcDocSize?: number | null
  ccfDocPath?: string | null; ccfDocNombre?: string | null; ccfDocMime?: string | null; ccfDocSize?: number | null

  recomendacionMedica?: string | null
  recoMedDocPath?: string | null
  recoMedDocNombre?: string | null
  recoMedDocMime?: string | null
  recoMedDocSize?: number | null

  password?: string
  contratos?: Contrato[]
}

/* ================================
   Helpers anti-cola / idempotencia
================================ */
const pendingCreates = new Map<string, AbortController>()
const pendingUpdates = new Map<number, AbortController>()
const makeIdempotencyKey = (suffix?: string) =>
  crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}${suffix ? ':' + suffix : ''}`

/* ================================
   Usuarios
================================ */
export function obtenerUsuarios(razonSocialId?: number): Promise<User[]> {
  return get<User[]>(
    '/api/usuarios',
    {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      params: razonSocialId ? { razon_social_id: razonSocialId } : undefined,
    }
  )
}

export async function obtenerUsuarioPorId(id: number): Promise<User | null> {
  try {
    return await get<User>(`/api/usuarios/${id}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message.toLowerCase() : String(e ?? '').toLowerCase()
    if (msg.includes('no encontrado') || msg.includes('not found')) {
      console.warn(`Usuario con ID ${id} no encontrado.`)
      return null
    }
    throw e
  }
}

export function crearUsuario(userData: Partial<User>) {
  const email = String(userData.correo ?? '').trim().toLowerCase()
  const key = `create:${email || 'unknown'}`

  const prev = pendingCreates.get(key)
  if (prev) prev.abort()

  const ac = new AbortController()
  pendingCreates.set(key, ac)

  const idemKey = makeIdempotencyKey(email)

  return post<User, Partial<User>>('/api/usuarios', userData, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Idempotency-Key': idemKey,
    },
    signal: ac.signal,
  }).finally(() => {
    const cur = pendingCreates.get(key)
    if (cur === ac) pendingCreates.delete(key)
  })
}

export function actualizarUsuario(id: number, userData: Partial<User>) {
  const prev = pendingUpdates.get(id)
  if (prev) prev.abort()
  const ac = new AbortController()
  pendingUpdates.set(id, ac)

  return put<User, Partial<User>>(`/api/usuarios/${id}`, userData, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    signal: ac.signal,
  }).finally(() => {
    const cur = pendingUpdates.get(id)
    if (cur === ac) pendingUpdates.delete(id)
  })
}

export async function eliminarUsuario(id: number): Promise<string> {
  const resp = await del<DeleteResponse>(`/api/usuarios/${id}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  return resp?.message || 'Usuario eliminado correctamente.'
}

export function uploadProfilePicture(userId: number, file: File) {
  const formData = new FormData()
  formData.append('foto', file)
  return upload<User>(`/api/usuarios/${userId}/upload-photo`, formData, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
}

/* ================================
   Contratos (resumen)
================================ */
export function actualizarContrato(contratoId: number, data: Partial<Contrato>) {
  return put<Contrato, Partial<Contrato>>(`/api/contratos/${contratoId}`, data, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  })
}

export function crearEventoDeContrato(
  contratoId: number,
  data: FormData | Partial<ContratoEvento>
) {
  if (data instanceof FormData) {
    return upload<ContratoEvento>(`/api/contratos/${contratoId}/eventos`, data, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  }
  return post<ContratoEvento, Partial<ContratoEvento>>(
    `/api/contratos/${contratoId}/eventos`,
    data,
    { credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
  )
}

/* ================================
   Listas auxiliares
================================ */
export function obtenerRoles() {
  return get<Rol[]>('/api/roles', {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
}

export function obtenerRazonesSociales() {
  return get<RazonSocial[]>('/api/razones-sociales', {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
}

export function obtenerSedes() {
  return get<Sede[]>('/api/sedes', {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
}

export function obtenerCargos() {
  return get<Cargo[]>('/api/cargos', {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
}

export function obtenerEntidadesSalud() {
  return get<EntidadSalud[]>('/api/entidades-saluds', {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
}

/* ==========================================================
   Archivos por afiliación (EPS/ARL/AFP/AFC/CCF)
========================================================== */
export type TipoAfiliacion = 'eps' | 'arl' | 'afp' | 'afc' | 'ccf'

export async function subirArchivoAfiliacion(
  userId: number,
  tipo: TipoAfiliacion,
  file: File,
  extraFields?: Record<string, unknown>
): Promise<AfiliacionFileResponse> {
  const form = new FormData()
  form.append('archivo', file, file.name)
  if (extraFields && typeof extraFields === 'object') {
    for (const [k, v] of Object.entries(extraFields)) {
      if (v !== undefined && v !== null) form.append(k, String(v))
    }
  }

  const raw = await upload<unknown>(
    `/api/usuarios/${userId}/afiliacion/${tipo}/archivo`,
    form,
    { credentials: 'include', headers: { Accept: 'application/json' } }
  )

  const srcData = (raw as Record<string, unknown>)?.['data'] ?? raw ?? {}

  const pathLike =
    (srcData as Record<string, unknown>)['url'] ??
    (srcData as Record<string, unknown>)['path'] ??
    (srcData as Record<string, unknown>)['ruta'] ??
    (srcData as Record<string, unknown>)['archivoUrl'] ??
    (srcData as Record<string, unknown>)['epsDocPath'] ??
    (srcData as Record<string, unknown>)['arlDocPath'] ??
    (srcData as Record<string, unknown>)['afpDocPath'] ??
    (srcData as Record<string, unknown>)['afcDocPath'] ??
    (srcData as Record<string, unknown>)['ccfDocPath']

  const nombreLike =
    (srcData as Record<string, unknown>)['nombreOriginal'] ??
    (srcData as Record<string, unknown>)['filename'] ??
    (srcData as Record<string, unknown>)['name'] ??
    (srcData as Record<string, unknown>)['epsDocNombre'] ??
    (srcData as Record<string, unknown>)['arlDocNombre'] ??
    (srcData as Record<string, unknown>)['afpDocNombre'] ??
    (srcData as Record<string, unknown>)['afcDocNombre'] ??
    (srcData as Record<string, unknown>)['ccfDocNombre']

  const mime = (srcData as Record<string, unknown>)['mime']
  const size = (srcData as Record<string, unknown>)['size']

  return {
    userId: ((raw as Record<string, unknown>)['userId'] as number) ?? userId,
    tipo: ((raw as Record<string, unknown>)['tipo'] as AfiliacionFileResponse['tipo']) ?? tipo,
    tieneArchivo: Boolean(
      (raw as Record<string, unknown>)['tieneArchivo'] ?? pathLike ?? nombreLike
    ),
    data:
      pathLike || nombreLike
        ? {
            url: String(pathLike || ''),
            nombreOriginal: String(nombreLike || ''),
            mime: typeof mime === 'string' ? mime : '',
            size: Number(size ?? 0),
          }
        : null,
  }
}

export async function obtenerArchivoAfiliacionMeta(
  userId: number,
  tipo: TipoAfiliacion
): Promise<AfiliacionFileResponse> {
  const resp = await get<unknown>(
    `/api/usuarios/${userId}/afiliacion/${tipo}/archivo`,
    {
      credentials: 'include',
      headers: { 'Cache-Control': 'no-store', Accept: 'application/json' },
      params: { ts: Date.now() },
    }
  )

  const src = (resp as Record<string, unknown>)?.['data'] ?? resp ?? {}

  const pathLike =
    (src as Record<string, unknown>)['url'] ??
    (src as Record<string, unknown>)['path'] ??
    (src as Record<string, unknown>)['ruta'] ??
    (src as Record<string, unknown>)['archivoUrl'] ??
    (src as Record<string, unknown>)['epsDocPath'] ??
    (src as Record<string, unknown>)['arlDocPath'] ??
    (src as Record<string, unknown>)['afpDocPath'] ??
    (src as Record<string, unknown>)['afcDocPath'] ??
    (src as Record<string, unknown>)['ccfDocPath']

  const nombreLike =
    (src as Record<string, unknown>)['nombreOriginal'] ??
    (src as Record<string, unknown>)['filename'] ??
    (src as Record<string, unknown>)['name'] ??
    (src as Record<string, unknown>)['epsDocNombre'] ??
    (src as Record<string, unknown>)['arlDocNombre'] ??
    (src as Record<string, unknown>)['afpDocNombre'] ??
    (src as Record<string, unknown>)['afcDocNombre'] ??
    (src as Record<string, unknown>)['ccfDocNombre']

  const mime = (src as Record<string, unknown>)['mime']
  const size = (src as Record<string, unknown>)['size']

  return {
    userId: ((resp as Record<string, unknown>)['userId'] as number) ?? userId,
    tipo: ((resp as Record<string, unknown>)['tipo'] as AfiliacionFileResponse['tipo']) ?? tipo,
    tieneArchivo: Boolean(
      (resp as Record<string, unknown>)['tieneArchivo'] ?? pathLike ?? nombreLike
    ),
    data:
      pathLike || nombreLike
        ? {
            url: String(pathLike || ''),
            nombreOriginal: String(nombreLike || ''),
            mime: typeof mime === 'string' ? mime : '',
            size: Number(size ?? 0),
          }
        : null,
  }
}

export async function eliminarArchivoAfiliacion(
  userId: number,
  tipo: TipoAfiliacion
): Promise<string> {
  const resp = await del<DeleteResponse>(
    `/api/usuarios/${userId}/afiliacion/${tipo}/archivo`,
    { credentials: 'include', headers: { Accept: 'application/json' } }
  )
  return resp?.message || 'Archivo eliminado.'
}

export function tieneArchivoAfiliacion(resp: AfiliacionFileResponse | null | undefined): boolean {
  const d = resp?.data
  return Boolean(resp?.tieneArchivo || d?.url || d?.nombreOriginal)
}

/* ==========================================================
   Recomendación médica (texto + archivo)
========================================================== */
export function upsertRecomendacionMedica(
  userId: number,
  recomendacionMedica: string | null
) {
  return put<{ message: string; recomendacionMedica: string | null },
              { recomendacionMedica: string | null }>(
    `/api/usuarios/${userId}/recomendacion-medica`,
    { recomendacionMedica },
    { credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
  )
}

export function subirArchivoRecomendacionMedica(userId: number, file: File) {
  const form = new FormData()
  form.append('archivo', file, file.name)
  return upload<{ message: string; url: string }>(
    `/api/usuarios/${userId}/recomendacion-medica/archivo`,
    form,
    { credentials: 'include', headers: { Accept: 'application/json' } }
  )
}

export async function eliminarArchivoRecomendacionMedica(userId: number): Promise<string> {
  const resp = await del<DeleteResponse>(
    `/api/usuarios/${userId}/recomendacion-medica/archivo`,
    { credentials: 'include', headers: { Accept: 'application/json' } }
  )
  return resp?.message || 'Archivo de recomendación médica eliminado.'
}

/* ==========================================================
   Historial de estados/cambios de contrato
========================================================== */
export interface ContratoHistorialEstado {
  id: number
  contratoId: number
  oldEstado: 'activo' | 'inactivo' | string
  newEstado: 'activo' | 'inactivo' | string
  fechaCambio: string
  motivo?: string | null
  usuarioId?: number | null
  realizadoPor?: string | null
}

export function obtenerHistorialEstadosContrato(contratoId: number) {
  return get<ContratoHistorialEstado[]>(
    `/api/contratos/${contratoId}/historial-estados`,
    { credentials: 'include', headers: { Accept: 'application/json' } }
  )
}

export function crearHistorialEstadoContrato(
  contratoId: number,
  payload: {
    oldEstado: string
    newEstado: string
    fechaCambio?: string
    motivo?: string | null
    usuarioId?: number | null
  }
) {
  return post<ContratoHistorialEstado, typeof payload>(
    `/api/contratos/${contratoId}/historial-estados`,
    payload,
    { credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
  )
}

export interface ContratoCambio {
  id: number
  contratoId: number
  usuarioId?: number | null
  campo: string
  valorAnterior?: string | number | null
  valorNuevo?: string | number | null
  fechaCambio: string
  ip?: string | null
  userAgent?: string | null
  usuario?: { id: number; nombres: string; apellidos: string } | null
}

export function obtenerHistorialCambiosContrato(contratoId: number) {
  return get<ContratoCambio[]>(
    `/api/contratos/${contratoId}/historial-cambios`,
    { credentials: 'include', headers: { Accept: 'application/json' } }
  )
}

export function crearCambioContrato(
  contratoId: number,
  payload: {
    campo: string
    valorAnterior?: string | number | null
    valorNuevo?: string | number | null
    fechaCambio?: string
    usuarioId?: number | null
  }
) {
  return post<ContratoCambio, typeof payload>(
    `/api/contratos/${contratoId}/historial-cambios`,
    payload,
    { credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' } }
  )
}
