import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  cumpleAgenteTipoRuta,
  esAsesorTelemercadeo,
  puedeControlTelemercadeo,
} from '../permisosTelemercadeo'

// AuthStore importa el router (y con él todas las vistas): se reemplaza.
vi.mock('@/router', () => ({
  default: { push: vi.fn(), currentRoute: { value: { path: '/' } } },
}))

const u = (rol: string, agenteTipo: string | null = null) => ({ rol: { nombre: rol }, agenteTipo })

const TELE = u('COMERCIAL', 'ASESOR_TELEMERCADEO')
const COMERCIAL_SIN_AGENTE = u('COMERCIAL', null)
const COMERCIAL_ASESOR = u('COMERCIAL', 'ASESOR_COMERCIAL')
const ADMIN = u('SUPER_ADMIN')
const GERENCIA = u('GERENCIA')
const CONTABILIDAD = u('CONTABILIDAD')

describe('esAsesorTelemercadeo', () => {
  it('solo COMERCIAL con agente ASESOR_TELEMERCADEO', () => {
    expect(esAsesorTelemercadeo(TELE)).toBe(true)
    expect(esAsesorTelemercadeo(COMERCIAL_SIN_AGENTE)).toBe(false)
    expect(esAsesorTelemercadeo(COMERCIAL_ASESOR)).toBe(false)
    expect(esAsesorTelemercadeo(ADMIN)).toBe(false)
    expect(esAsesorTelemercadeo(GERENCIA)).toBe(false)
    // Otro rol con agente de telemercadeo tampoco.
    expect(esAsesorTelemercadeo(u('GERENCIA', 'ASESOR_TELEMERCADEO'))).toBe(false)
    expect(esAsesorTelemercadeo(null)).toBe(false)
    expect(esAsesorTelemercadeo({ rol: { nombre: 'COMERCIAL' } })).toBe(false)
  })
})

describe('puedeControlTelemercadeo', () => {
  it('SUPER_ADMIN y GERENCIA; nadie más', () => {
    expect(puedeControlTelemercadeo(ADMIN)).toBe(true)
    expect(puedeControlTelemercadeo(GERENCIA)).toBe(true)
    expect(puedeControlTelemercadeo(TELE)).toBe(false)
    expect(puedeControlTelemercadeo(CONTABILIDAD)).toBe(false)
    expect(puedeControlTelemercadeo(undefined)).toBe(false)
  })
})

describe('cumpleAgenteTipoRuta (guard de rutas)', () => {
  it('sin meta.agenteTipo no restringe', () => {
    expect(cumpleAgenteTipoRuta(undefined, COMERCIAL_SIN_AGENTE)).toBe(true)
    expect(cumpleAgenteTipoRuta(null, null)).toBe(true)
  })
  it('con meta.agenteTipo exige ese tipo (el resto se redirige)', () => {
    expect(cumpleAgenteTipoRuta('ASESOR_TELEMERCADEO', TELE)).toBe(true)
    expect(cumpleAgenteTipoRuta('ASESOR_TELEMERCADEO', COMERCIAL_SIN_AGENTE)).toBe(false)
    expect(cumpleAgenteTipoRuta('ASESOR_TELEMERCADEO', COMERCIAL_ASESOR)).toBe(false)
    expect(cumpleAgenteTipoRuta('ASESOR_TELEMERCADEO', ADMIN)).toBe(false)
    expect(cumpleAgenteTipoRuta('ASESOR_TELEMERCADEO', null)).toBe(false)
  })
})

describe('usePermissions con el AuthStore real', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  async function permisosDe(user: ReturnType<typeof u>) {
    const { useAuthStore } = await import('@/stores/AuthStore')
    const { usePermissions } = await import('@/composables/usePermissions')
    const auth = useAuthStore()
    auth.user = { id: 1, ...user } as unknown as typeof auth.user
    auth.token = 't'
    return { can: usePermissions().can, auth }
  }

  it('asesor de Telemercadeo: gestiona (menú "Mi gestión" y botón de la cola), sin control', async () => {
    const { can, auth } = await permisosDe(TELE)
    expect(can.gestionarTelemercadeo()).toBe(true)
    expect(can.controlTelemercadeo()).toBe(false)
    expect(can.configurarSeguimientosTele()).toBe(false)
    expect(auth.esAsesorTelemercadeo).toBe(true)
  })

  it('COMERCIAL sin agente de Telemercadeo: ni menú ni botón ni control', async () => {
    for (const user of [COMERCIAL_SIN_AGENTE, COMERCIAL_ASESOR]) {
      const { can, auth } = await permisosDe(user)
      expect(can.gestionarTelemercadeo()).toBe(false)
      expect(can.controlTelemercadeo()).toBe(false)
      expect(auth.esAsesorTelemercadeo).toBe(false)
      // Sigue viendo la cola (solo lectura) como antes.
      expect(can.verTelemercadeo()).toBe(true)
    }
  })

  it('SUPER_ADMIN y GERENCIA: control y configuración, no registran gestiones', async () => {
    for (const user of [ADMIN, GERENCIA]) {
      const { can } = await permisosDe(user)
      expect(can.controlTelemercadeo()).toBe(true)
      expect(can.configurarSeguimientosTele()).toBe(true)
      expect(can.gestionarTelemercadeo()).toBe(false)
    }
  })
})
