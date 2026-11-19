import { describe, expect, it } from 'vitest'
import {
  COLUMNAS_COMISION_DATEOS,
  columnasDateos,
  redirigirFichaAMiGestion,
  seccionesFicha,
} from '../fichaSecciones'

// Expresiones que tenía FichaComercialAsesor.vue antes de fichaSecciones.ts.
const esAsesorComercialAntes = (t: string | null) => (t ?? '').toUpperCase().trim().includes('COMERCIAL')
const esAsesorConvenioAntes = (t: string | null) => (t ?? '').toUpperCase().trim().includes('CONVENIO')

const HEADERS = [
  { title: 'ID', key: 'id' },
  { title: 'Estado', key: 'resultado' },
  { title: 'Comisión asesor', key: 'comisionAsesor' },
  { title: '💰 Estado Pago', key: 'estadoComision' },
  { title: 'Creado', key: 'created_at' },
]

describe('seccionesFicha · modo normal idéntico a hoy', () => {
  it.each([['ASESOR_COMERCIAL'], ['ASESOR_CONVENIO'], ['asesor_comercial'], [null], [''], ['OTRO']])(
    'tipo %s',
    (tipo) => {
      const s = seccionesFicha(tipo)
      expect(s.modoTelemercadeo).toBe(false)
      expect(s.metaComercial).toBe(esAsesorComercialAntes(tipo))
      expect(s.tabConvenios).toBe(!esAsesorConvenioAntes(tipo))
      expect(s.kpisComisiones).toBe(true)
      expect(s.tabNewDateos).toBe(true)
      expect(s.comisionesEnDateos).toBe(true)
      expect(s.crearYRedatearDateos).toBe(true)
      expect(s.kpiDateosExitosos).toEqual({ titulo: 'Dateos exitosos', sub: 'en el rango' })
      // Columnas: las mismas, en el mismo orden.
      expect(columnasDateos(HEADERS, s)).toEqual(HEADERS)
    },
  )
})

describe('seccionesFicha · ASESOR_TELEMERCADEO', () => {
  const s = seccionesFicha('ASESOR_TELEMERCADEO')

  it('nunca muestra nada de comisiones ni meta en pesos', () => {
    expect(s.modoTelemercadeo).toBe(true)
    expect(s.kpisComisiones).toBe(false)
    expect(s.comisionesEnDateos).toBe(false)
    expect(s.metaComercial).toBe(false)
    const cols = columnasDateos(HEADERS, s).map((h) => h.key)
    for (const k of COLUMNAS_COMISION_DATEOS) expect(cols).not.toContain(k)
    expect(cols).toEqual(['id', 'resultado', 'created_at'])
    // Toda bandera relacionada con comisiones queda en false, y ningún rótulo las nombra.
    const banderasComision = Object.entries(s).filter(([k]) => /comision/i.test(k))
    expect(banderasComision.length).toBeGreaterThan(0)
    for (const [, v] of banderasComision) expect(v).toBe(false)
    expect(JSON.stringify(s.kpiDateosExitosos).toLowerCase()).not.toMatch(/comisi[oó]n|pago/)
  })

  it('sin Convenios, sin New-dateos y sin crear/re-datear desde la ficha', () => {
    expect(s.tabConvenios).toBe(false)
    expect(s.tabNewDateos).toBe(false)
    expect(s.crearYRedatearDateos).toBe(false)
  })

  it('rotula qué cuenta el KPI de dateos exitosos', () => {
    expect(s.kpiDateosExitosos.sub).toBe('todos sus dateos · por fecha del dateo')
  })

  it('el tipo se reconoce sin importar mayúsculas ni espacios', () => {
    expect(seccionesFicha(' asesor_telemercadeo ').modoTelemercadeo).toBe(true)
  })
})

describe('redirigirFichaAMiGestion', () => {
  const tele = { rol: { nombre: 'COMERCIAL' }, agenteTipo: 'ASESOR_TELEMERCADEO', agenteId: 50 }

  it('asesor de telemercadeo abriendo SU ficha (sin id o con su agente) → redirige', () => {
    expect(redirigirFichaAMiGestion(tele, undefined)).toBe(true)
    expect(redirigirFichaAMiGestion(tele, '')).toBe(true)
    expect(redirigirFichaAMiGestion(tele, '50')).toBe(true)
    expect(redirigirFichaAMiGestion(tele, ['50'])).toBe(true)
  })

  it('asesor de telemercadeo abriendo la ficha de otro agente → no redirige', () => {
    expect(redirigirFichaAMiGestion(tele, '51')).toBe(false)
  })

  it('gerencia, admin y comerciales nunca se redirigen', () => {
    for (const user of [
      { rol: { nombre: 'GERENCIA' }, agenteTipo: null, agenteId: null },
      { rol: { nombre: 'SUPER_ADMIN' }, agenteTipo: null, agenteId: null },
      { rol: { nombre: 'COMERCIAL' }, agenteTipo: 'ASESOR_COMERCIAL', agenteId: 50 },
      { rol: { nombre: 'COMERCIAL' }, agenteTipo: null, agenteId: null },
    ]) {
      expect(redirigirFichaAMiGestion(user, '50')).toBe(false)
      expect(redirigirFichaAMiGestion(user, undefined)).toBe(false)
    }
    expect(redirigirFichaAMiGestion(null, undefined)).toBe(false)
  })
})
