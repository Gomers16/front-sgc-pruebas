// Reglas de acceso de Telemercadeo (puras, con tests). Las usan
// usePermissions.ts, AuthStore.ts y el guard de rutas de main.ts.
//
// - Registrar gestiones y "Mi gestión": solo COMERCIAL cuyo agente es
//   ASESOR_TELEMERCADEO (agenteTipo de login / me). Mismo criterio que el
//   backend (POST /telemercadeo/gestiones, /mi-resumen).
// - Control (resumen, autorizar extras, metas, configuración):
//   SUPER_ADMIN y GERENCIA. Ellos no registran gestiones.

export const TIPO_AGENTE_TELE = 'ASESOR_TELEMERCADEO'
export const ROLES_CONTROL_TELE = ['SUPER_ADMIN', 'GERENCIA'] as const

export interface UsuarioPermisos {
  rol?: { nombre?: string | null } | null
  agenteTipo?: string | null
}

/** ¿Es un asesor de Telemercadeo (COMERCIAL con agente ASESOR_TELEMERCADEO)? */
export function esAsesorTelemercadeo(user: UsuarioPermisos | null | undefined): boolean {
  return user?.rol?.nombre === 'COMERCIAL' && user?.agenteTipo === TIPO_AGENTE_TELE
}

/** ¿Puede ver el Control de Telemercadeo? */
export function puedeControlTelemercadeo(user: UsuarioPermisos | null | undefined): boolean {
  const rol = user?.rol?.nombre
  return !!rol && (ROLES_CONTROL_TELE as readonly string[]).includes(rol)
}

/**
 * Guard de rutas: una ruta con `meta.agenteTipo` solo se abre si el usuario
 * tiene ese tipo de agente. Sin `meta.agenteTipo`, no restringe nada.
 */
export function cumpleAgenteTipoRuta(
  agenteTipoRequerido: string | null | undefined,
  user: UsuarioPermisos | null | undefined,
): boolean {
  if (!agenteTipoRequerido) return true
  return user?.agenteTipo === agenteTipoRequerido
}
