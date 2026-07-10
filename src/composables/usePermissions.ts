// src/composables/usePermissions.ts
import { useAuthStore } from '@/stores/AuthStore'

/**
 * Composable de permisos basado en roles
 */
export function usePermissions() {
  const auth = useAuthStore()

  return {
    can: {
      // ==================== DASHBOARD ====================
      verDashboard: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS',
        'TRAMITADOR'
      ]),

      // ==================== TURNOS ====================
      verTurnos: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      crearTurno: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'OPERATIVO_TURNOS',
        'GERENCIA',
        'TRAMITADOR'
      ]),

      editarTurno: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      cerrarTurno: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      // ==================== TRÁMITES ====================
      verTramites: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TRAMITADOR'
      ]),

      // ==================== FACTURACIÓN ====================
      verHistoricoFacturacion: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD',
        'OPERATIVO_TURNOS'
      ]),

      crearFacturacion: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      confirmarFacturacion: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      // ==================== CERTIFICACIONES ====================
      crearCertificacion: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      verCertificaciones: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      // ==================== REP GENERAL ====================
      importarRepGeneral: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'OPERATIVO_TURNOS'
      ]),

      // ==================== COMERCIAL ====================
      verComercial: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      // Mi Ficha Comercial - Solo comerciales ven SU propia ficha (/me)
      verMiFichaComercial: () => auth.hasRole('COMERCIAL'),

      // Ver listado de agentes (tabla general)
      verListadoAgentes: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      // Ver ficha individual de agente (detalle) - ✅ CONTABILIDAD SÍ PUEDE
      verFichaAsesor: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD',
        'COMERCIAL'
      ]),

      // Gestionar agentes (crear/editar/eliminar)
      gestionarAgentes: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA'
      ]),

      // ==================== PROSPECTOS ====================
      verProspectos: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD',
        'COMERCIAL'
      ]),

      // ❌ CONTABILIDAD NO puede crear prospectos
      crearProspecto: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'COMERCIAL'
      ]),

      gestionarProspectos: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD',
        'COMERCIAL'
      ]),

      // ==================== DATEOS ====================
      verDateos: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD',
        'COMERCIAL'
      ]),

      // ❌ CONTABILIDAD NO puede crear dateos
      crearDateo: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'COMERCIAL'
      ]),

      // ❌ CONTABILIDAD NO puede editar/eliminar dateos
      gestionarDateos: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA'
      ]),

      // ==================== COMISIONES ====================
      verComisiones: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD',
        'COMERCIAL'
      ]),

      gestionarComisiones: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      aprobarComisiones: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      pagarComisiones: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      // ❌ Config de comisiones - CONTABILIDAD NO puede
      configurarComisiones: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA'
      ]),

      // ==================== CONVENIOS ====================
      verConvenios: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      crearConvenio: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      editarConvenio: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),

      // ==================== GESTIÓN DOCUMENTAL ====================
      verGestionDocumental: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      verContratos: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      crearContrato: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      editarContrato: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      eliminarContrato: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      // ==================== USUARIOS ====================
      verUsuarios: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      crearUsuario: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      editarUsuario: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'TALENTO_HUMANO'
      ]),

      eliminarUsuario: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA'
      ]),

      // ==================== REPORTES ADMINISTRATIVOS ====================
      verReportesAdmin: () => auth.hasAnyRole([
        'SUPER_ADMIN',
        'GERENCIA',
        'CONTABILIDAD'
      ]),
    }
  }
}
