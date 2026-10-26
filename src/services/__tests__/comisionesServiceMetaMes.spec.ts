// ComisionesConfig → Metas mensuales lee GET /comisiones/metas vía
// listMetasMensuales(), cuyo mapper arma la fila campo por campo: si no pasa
// meta_mes_pesos/meta_mes_label, la columna "Meta del mes (Meta Comercial)"
// diría siempre "Sin meta definida".
import { afterEach, describe, expect, it, vi } from 'vitest'
import { listMetasMensuales } from '../comisionesService'

function responder(cuerpo: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => cuerpo })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('listMetasMensuales (config): meta del mes en curso', () => {
  it('pasa la meta en pesos y el mes', async () => {
    responder({
      data: [
        { id: 5, asesor_id: 734, meta_mensual: 0, meta_mes_pesos: '45000000.00', meta_mes_label: '2026-10' },
      ],
    })
    const [fila] = await listMetasMensuales()
    expect(fila.meta_mes_pesos).toBe(45_000_000)
    expect(fila.meta_mes_label).toBe('2026-10')
  })

  it('sin meta del mes → null, no 0', async () => {
    responder({ data: [{ id: 6, asesor_id: 735, meta_mensual: 0, meta_mes_pesos: null, meta_mes_label: '2026-10' }] })
    const [fila] = await listMetasMensuales()
    expect(fila.meta_mes_pesos).toBeNull()
  })
})
