import { describe, expect, it } from 'vitest'
import { textoMetaPesos, textoMetaVehiculos } from '../superInformeMetaComercial'

const fmt = (n: number) => `#${n}`

describe('superInformeMetaComercial · textos de meta por asesor', () => {
  it('sin fila en meta_comercial_asesor → "Sin meta" en $ y en unidades', () => {
    const a = { meta_pesos: null, meta_vehiculos: null, tiene_meta: false }
    expect(textoMetaPesos(a, fmt)).toBe('Sin meta')
    expect(textoMetaVehiculos(a, fmt)).toBe('Sin meta')
  })

  it('fila con $ y sin meta_vehiculos → valor en $ y "—" en unidades', () => {
    const a = { meta_pesos: 50000000, meta_vehiculos: null, tiene_meta: true }
    expect(textoMetaPesos(a, fmt)).toBe('#50000000')
    expect(textoMetaVehiculos(a, fmt)).toBe('—')
  })

  it('fila con $ y unidades → ambos valores', () => {
    const a = { meta_pesos: 30000000, meta_vehiculos: 12, tiene_meta: true }
    expect(textoMetaPesos(a, fmt)).toBe('#30000000')
    expect(textoMetaVehiculos(a, fmt)).toBe('#12')
  })

  it('periodo incompleto (fila solo en algunos meses) → "Incompleta", nunca suma parcial', () => {
    const a = { meta_pesos: null, meta_vehiculos: null, tiene_meta: true }
    expect(textoMetaPesos(a, fmt)).toBe('Incompleta')
    expect(textoMetaVehiculos(a, fmt)).toBe('—')
  })

  it('meta 0 configurada se muestra como valor, no como "Sin meta"', () => {
    const a = { meta_pesos: 0, meta_vehiculos: 0, tiene_meta: true }
    expect(textoMetaPesos(a, fmt)).toBe('#0')
    expect(textoMetaVehiculos(a, fmt)).toBe('#0')
  })
})
