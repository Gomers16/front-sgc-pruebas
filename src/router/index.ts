// src/router/index.ts
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type RouteLocationAsPathGeneric,
  type RouteLocationAsRelativeGeneric,
  type RouteLocationNormalizedLoadedGeneric,
  type RouteLocationRaw,
  type RouteParamsRaw,
  type RouteParamValueRaw,
} from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    layout?: string
    title?: string
    requiresAuth?: boolean
    roles?: string[]
  }
}

import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import RTMView from '@/views/RtmView.vue'
import CrearTurnoView from '@/views/rtm/CrearTurno.vue'
import TurnosDelDia from '@/views/rtm/TurnosDelDia.vue'
import TurnoRtmEdit from '@/views/rtm/EditarTurno.vue'
import EstadoDeTurnos from '@/views/rtm/EstadoDeTurnos.vue'
import ContadorConvenios from '@/views/rtm/ContadorConvenios.vue'
import UsuariosView from '@/views/usuarios/UsuariosView.vue'
import ContratosView from '@/views/gestion-documental/ContratosView.vue'
import UserProfileView from '@/views/usuarios/UserProfileView.vue'

import DateosList from '@/views/comercial/dateos/DateosList.vue'
import DateoCreate from '@/views/comercial/dateos/DateoCreate.vue'
import DateoDetail from '@/views/comercial/dateos/DateoDetail.vue'
import ComisionesList from '@/views/comercial/comisiones/ComisionesList.vue'
import ComisionDetail from '@/views/comercial/comisiones/ComisionesDetail.vue'
import ComisionesConfig from '@/views/comercial/comisiones/ComisionesConfig.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },

  { path: '/login', name: 'Login', component: LoginView, meta: { layout: 'AuthLayout' } },
  { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: { layout: 'MainLayout' } },

  // RTM
  { path: '/rtm', name: 'RTM', component: RTMView, meta: { layout: 'MainLayout' } },
  {
    path: '/rtm/crear-turno',
    name: 'CrearTurno',
    component: CrearTurnoView,
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/rtm/turnos-dia',
    name: 'TurnosDelDia',
    component: TurnosDelDia,
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/rtm/editar-turno/:id',
    name: 'TurnoRtmEdit',
    component: TurnoRtmEdit,
    props: true,
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/rtm/estado-turnos',
    name: 'EstadoDeTurnos',
    component: EstadoDeTurnos,
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/rtm/contador-captacion',
    name: 'ContadorCaptacion',
    component: ContadorConvenios,
    meta: { layout: 'MainLayout' },
  },

  // ✅ Certificación RTM (pantallazo FLUR)
  {
    path: '/rtm/certificacion/:id',
    name: 'RtmCertificacion',
    component: () => import('@/views/rtm/CertificacionTurnoView.vue'),
    props: true,
    meta: { layout: 'MainLayout', title: 'Certificación / Evidencia' },
  },

  // TRÁMITES
  {
    path: '/tramites',
    redirect: '/tramites/turnos-tramites',
  },
  {
    path: '/tramites/turnos-tramites',
    name: 'TurnosTramites',
    component: () => import('@/views/tramites/TramitesView.vue'),
    meta: { layout: 'MainLayout', title: 'Turnos Trámites', requiresAuth: true, roles: ['SUPER_ADMIN', 'GERENCIA', 'OPERATIVO_TURNOS', 'TRAMITADOR'] },
  },
  {
    path: '/tramites/reporte-caja',
    name: 'ReporteCaja',
    component: () => import('@/views/tramites/ReporteCajaView.vue'),
    meta: { layout: 'MainLayout', title: 'Reporte de Caja', requiresAuth: true, roles: ['SUPER_ADMIN', 'GERENCIA', 'OPERATIVO_TURNOS', 'TRAMITADOR'] },
  },

  // 🧾 FACTURACIÓN
  {
    path: '/facturacion/subir-ticket',
    name: 'FacturacionSubirTicket',
    component: () => import('@/views/facturacion/FacturacionSubirTicket.vue'),
    meta: { layout: 'MainLayout', title: 'Facturación / Subir ticket' },
  },
  {
    path: '/facturacion/historico',
    name: 'FacturacionHistorico',
    component: () => import('@/views/facturacion/FacturacionHistorico.vue'),
    meta: { layout: 'MainLayout', title: 'Facturación / Histórico' },
  },

  // Gestión Documental / Usuarios
  {
    path: '/gestion-documental/usuarios',
    name: 'Usuarios',
    component: UsuariosView,
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/usuarios/:id',
    name: 'UserProfile',
    component: UserProfileView,
    props: true,
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/gestion-documental/razon-social/:id',
    name: 'RazonSocialDetalle',
    component: () => import('@/views/gestion-documental/RazonSocialView.vue'),
    props: true,
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/gestion-documental/contratos',
    name: 'Contratos',
    component: ContratosView,
    meta: { layout: 'MainLayout' },
  },

  // COMERCIAL

  // Asesores + convenios
  {
    path: '/comercial/asesores',
    name: 'ComercialAsesores',
    component: () => import('@/views/comercial/asesores/AsesoresConveniosView.vue'),
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/comercial/asesores/:id/ficha',
    name: 'FichaComercialAsesor',
    component: () => import('@/views/comercial/asesores/FichaComercialAsesor.vue'),
    props: true,
    meta: { layout: 'MainLayout', title: 'Ficha comercial del asesor' },
  },

  // Dateos
  {
    path: '/comercial/dateos',
    name: 'ComercialDateos',
    component: DateosList,
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/comercial/dateos/nuevo',
    name: 'ComercialDateosNuevo',
    component: DateoCreate,
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/comercial/dateos/:id',
    name: 'ComercialDateoDetalle',
    component: DateoDetail,
    props: true,
    meta: { layout: 'MainLayout' },
  },

  // Convenios
  {
    path: '/comercial/convenios',
    name: 'ComercialConvenios',
    component: () => import('@/views/comercial/convenios/ConveniosList.vue'),
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/comercial/convenios/:id',
    name: 'ComercialConvenioDetalle',
    component: () => import('@/views/comercial/convenios/ConvenioDetail.vue'),
    props: true,
    meta: { layout: 'MainLayout' },
  },

  // Prospectos
  {
    path: '/comercial/prospectos',
    name: 'ComercialProspectos',
    component: () => import('@/views/comercial/prospectos/ProspectosList.vue'),
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/comercial/prospectos/nuevo',
    name: 'ComercialProspectoNuevo',
    component: () => import('@/views/comercial/prospectos/ProspectoCreate.vue'),
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/comercial/prospectos/:id/editar',
    name: 'ComercialProspectoEditar',
    component: () => import('@/views/comercial/prospectos/ProspectoEdit.vue'),
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/comercial/prospectos/:id(\\d+)',
    name: 'ComercialProspectoDetalle',
    component: () => import('@/views/comercial/prospectos/ProspectoDetail.vue'),
    props: true,
    meta: { layout: 'MainLayout' },
  },

  // Comisiones
  {
    path: '/comercial/comisiones',
    name: 'ComercialComisiones',
    component: ComisionesList,
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/comercial/comisiones/config',
    name: 'ComercialComisionesConfig',
    component: ComisionesConfig,
    meta: { layout: 'MainLayout', title: 'Configuración de comisiones' },
  },
  {
    path: '/comercial/comisiones/:id',
    name: 'ComercialComisionDetalle',
    component: ComisionDetail,
    props: true,
    meta: { layout: 'MainLayout' },
  },
// Comprobantes de pago
{
  path: '/comercial/comprobantes',
  name: 'ComercialComprobantes',
  component: () => import('@/views/comercial/comprobantes/ComprobantesPago.vue'),
  meta: { layout: 'MainLayout', title: 'Comprobantes de pago' },
},
{
  path: '/comercial/comprobantes/:id',
  name: 'ComercialComprobanteDetalle',
  component: () => import('@/views/comercial/comprobantes/ComprobanteDetalle.vue'),
  props: true,
  meta: { layout: 'MainLayout', title: 'Detalle del comprobante' },
},
  // Descuentos
  {
    path: '/comercial/descuentos',
    name: 'ComercialDescuentos',
    component: () => import('@/views/comercial/descuentos/Descuentos.vue'),
    meta: { layout: 'MainLayout', title: 'Gestión de Descuentos' },
  },
  // 🆕 Historial de descuentos
  {
    path: '/comercial/descuentos/historial',
    name: 'ComercialDescuentosHistorial',
    component: () => import('@/views/comercial/descuentos/Descuentoshistorial.vue'),
    meta: { layout: 'MainLayout', title: 'Historial de Descuentos' },
  },

  // CLIENTES
  {
    path: '/clientes',
    name: 'ClientesList',
    component: () => import('@/views/comercial/clientes/ClientesList.vue'),
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/clientes/:id(\\d+)',
    name: 'ClienteDetalle',
    component: () => import('@/views/comercial/clientes/ClienteDetail.vue'),
    props: true,
    meta: { layout: 'MainLayout' },
  },
  {
    path: '/clientes/:id(\\d+)/editar',
    name: 'ClienteEditar',
    component: () => import('@/views/comercial/clientes/ClienteEdit.vue'),
    props: true,
    meta: { layout: 'MainLayout', title: 'Editar cliente' },
  },

  // REPORTES ADMINISTRATIVOS
  {
    path: '/reportes-admin',
    redirect: '/reportes-admin/ingresos-canal',
  },
  {
    path: '/reportes-admin/ingresos-canal',
    name: 'ReporteIngresosCanal',
    component: () => import('@/views/reportes/ReporteIngresosCanal.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'Ingresos por Canal',
      requiresAuth: true,
      roles: ['SUPER_ADMIN', 'GERENCIA', 'CONTABILIDAD'],
    },
  },
  {
    path: '/reportes-admin/produccion-lider',
    name: 'ReporteProduccionLider',
    component: () => import('@/views/reportes/ReporteProduccionLider.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'Producción por Líder',
      requiresAuth: true,
      roles: ['SUPER_ADMIN', 'GERENCIA', 'CONTABILIDAD'],
    },
  },
  {
    path: '/reportes-admin/asesores',
    name: 'ReporteAsesores',
    component: () => import('@/views/reportes/ReporteAsesores.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'Asesores',
      requiresAuth: true,
      roles: ['SUPER_ADMIN', 'GERENCIA', 'CONTABILIDAD'],
    },
  },
  {
    path: '/reportes-admin/descuentos',
    name: 'ReporteDescuentos',
    component: () => import('@/views/reportes/ReporteDescuentos.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'Descuentos',
      requiresAuth: true,
      roles: ['SUPER_ADMIN', 'GERENCIA', 'CONTABILIDAD'],
    },
  },
  {
    path: '/reportes-admin/retencion',
    name: 'ReporteRetencion',
    component: () => import('@/views/reportes/ReporteRetencion.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'Retención de Clientes',
      requiresAuth: true,
      roles: ['SUPER_ADMIN', 'GERENCIA', 'CONTABILIDAD'],
    },
  },
  {
    path: '/reportes-admin/comisiones',
    name: 'ReporteComisiones',
    component: () => import('@/views/reportes/ReporteComisiones.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'Comisiones y Pagos',
      requiresAuth: true,
      roles: ['SUPER_ADMIN', 'GERENCIA', 'CONTABILIDAD'],
    },
  },
  {
    path: '/configuracion/tarifas-servicios',
    name: 'TarifasServicios',
    component: () => import('@/views/configuracion/TarifasServiciosView.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'Tarifas por Servicio',
      requiresAuth: true,
      roles: ['SUPER_ADMIN', 'GERENCIA'],
    },
  },
  {
    path: '/reportes-admin/servicios',
    name: 'ReporteServicios',
    component: () => import('@/views/reportes/ReporteServicios.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'Reporte de Servicios',
      requiresAuth: true,
      roles: ['SUPER_ADMIN', 'GERENCIA', 'CONTABILIDAD'],
    },
  },
  {
    path: '/reportes-admin/meta-mensual',
    name: 'ReporteMetaMensual',
    component: () => import('@/views/reportes/ReporteMetaMensual.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'Meta Mensual',
      requiresAuth: true,
      roles: ['SUPER_ADMIN', 'GERENCIA', 'CONTABILIDAD'],
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/** Limpieza de params extra en navegaciones por name (opcional pero inofensivo) */
type NamedLocation = { name: string | symbol }
type ParamLocation = { params?: RouteParamsRaw }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function hasName(v: unknown): v is NamedLocation {
  return isObject(v) && 'name' in v
}

function hasParams(v: unknown): v is ParamLocation {
  return isObject(v) && 'params' in v
}

function toRouteParam(v: unknown): RouteParamValueRaw | (string | number)[] {
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' || typeof x === 'number' ? x : String(x)))
  if (typeof v === 'string' || typeof v === 'number') return v
  return String(v ?? '')
}

function cleanParamsForRoute(to: RouteLocationRaw): RouteLocationRaw {
  if (typeof to === 'string') return to
  if (!isObject(to) || !hasName(to)) return to
  const record = router.getRoutes().find((r) => r.name === to.name)
  if (!record) return to
  const declared = new Set((record.path.match(/:(\w+)/g) || []).map((s) => s.slice(1)))
  const rawParams: RouteParamsRaw = hasParams(to) && to.params ? to.params : {}
  const keys = Object.keys(rawParams)
  if (!keys.length) return to
  const cleanParams: RouteParamsRaw = {}
  let changed = false
  for (const k of keys) {
    if (declared.has(k)) cleanParams[k] = toRouteParam(rawParams[k])
    else changed = true
  }
  return changed ? { ...to, params: cleanParams } : to
}

const originalResolve = router.resolve.bind(router)
;(router as { resolve: typeof router.resolve }).resolve = (
  rawTo: string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric,
  current: RouteLocationNormalizedLoadedGeneric | undefined,
) => originalResolve(cleanParamsForRoute(rawTo), current)

export default router