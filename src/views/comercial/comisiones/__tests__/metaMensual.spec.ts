import { describe, expect, it } from 'vitest'
import type { MetaMensualRow } from '@/services/comisionesService'
import { avanceMeta, bonoMeta, faltanteMeta, metaDelMes } from '../metaMensual'

const fila = (over: Partial<MetaMensualRow>): MetaMensualRow => ({
  asesor_id: 1,
  meta_mensual: 0,
  porcentaje_comision_meta: 3,
  total_facturacion_global: 60_000_000,
  ...over,
})

describe('metaDelMes', () => {
  it('lee la meta en pesos de meta_comercial_asesor', () => {
    expect(metaDelMes(fila({ meta_global_rtm: 50_000_000 }))).toBe(50_000_000)
  })

  it('sin meta del mes → null, aunque haya meta_mensual o meta_rtm', () => {
    expect(metaDelMes(fila({ meta_global_rtm: null, meta_mensual: 40_000_000, meta_rtm: 7 }))).toBeNull()
    expect(metaDelMes(fila({}))).toBeNull()
  })

  it('una meta configurada en 0 sigue siendo meta definida', () => {
    expect(metaDelMes(fila({ meta_global_rtm: 0 }))).toBe(0)
  })
})

describe('sin meta definida', () => {
  it('no calcula bono, avance ni faltante', () => {
    expect(bonoMeta(null, 60_000_000, 3)).toBe(0)
    expect(avanceMeta(null, 60_000_000)).toBe(0)
    expect(faltanteMeta(null, 60_000_000)).toBe(0)
  })
})

describe('bonoMeta', () => {
  it('meta alcanzada → % sobre la facturación', () => {
    expect(bonoMeta(50_000_000, 60_000_000, 3)).toBe(1_800_000)
  })

  it('meta no alcanzada, meta 0 o sin % → 0', () => {
    expect(bonoMeta(50_000_000, 49_999_999, 3)).toBe(0)
    expect(bonoMeta(0, 60_000_000, 3)).toBe(0)
    expect(bonoMeta(50_000_000, 60_000_000, 0)).toBe(0)
  })
})

describe('avance y faltante', () => {
  it('se miden contra la meta en pesos', () => {
    expect(avanceMeta(50_000_000, 25_000_000)).toBe(50)
    expect(faltanteMeta(50_000_000, 30_000_000)).toBe(20_000_000)
    expect(faltanteMeta(50_000_000, 60_000_000)).toBe(0)
  })
})
