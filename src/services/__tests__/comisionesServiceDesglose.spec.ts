// Los mappers de comisionesService arman el objeto campo por campo: si no
// pasan el caso, la regla y el desglose del motor, la lista y el detalle de
// Comisiones dicen "Sin regla guardada" aunque el backend sí los mande.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getComision, listComisiones } from '../comisionesService'

const DESGLOSE = {
  estimado: false,
  recalculado: true,
  caso: 'CONVENIO_COMERCIAL',
  regla: 'Caso 3 · Comercial+convenio · Nuevo + Avance → comercial dateo_nuevo | convenio $0',
  beneficiarios: [],
  configuracion: [],
  alertas: [],
}

const API = {
  id: 1973,
  estado: 'PENDIENTE',
  caso: 'CONVENIO_COMERCIAL',
  caso_texto: 'Asesor comercial con convenio',
  regla_aplicada:
    'Caso 3 · Comercial+convenio · Nuevo + Avance → comercial dateo_nuevo | convenio $0',
  desglose_motor: DESGLOSE,
  desglose_factura_id: '4199',
  desglose_motivo: null,
}

function responder(cuerpo: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => cuerpo })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('comisionesService: caso, regla y desglose del motor', () => {
  it('la lista recibe caso, caso_texto y regla_aplicada', async () => {
    responder({ data: [API], total: 1, page: 1, perPage: 10 })
    const { data } = await listComisiones({ page: 1, perPage: 10 })
    expect(data[0]).toMatchObject({
      caso: API.caso,
      caso_texto: API.caso_texto,
      regla_aplicada: API.regla_aplicada,
    })
  })

  it('el detalle recibe además el desglose, la factura y el motivo', async () => {
    responder(API)
    const d = await getComision(1973)
    expect(d.caso).toBe(API.caso)
    expect(d.caso_texto).toBe(API.caso_texto)
    expect(d.regla_aplicada).toBe(API.regla_aplicada)
    expect(d.desglose_motor).toEqual(DESGLOSE)
    expect(d.desglose_factura_id).toBe(4199)
    expect(d.desglose_motivo).toBeNull()
  })

  it('sin desglose: llega el motivo y lo demás queda vacío', async () => {
    responder({
      id: 1,
      estado: 'PENDIENTE',
      desglose_motor: null,
      desglose_motivo: 'El turno no tiene factura confirmada.',
    })
    const d = await getComision(1)
    expect(d.desglose_motor).toBeNull()
    expect(d.desglose_factura_id).toBeNull()
    expect(d.desglose_motivo).toBe('El turno no tiene factura confirmada.')
    expect(d.regla_aplicada).toBeNull()
    expect(d.caso).toBeUndefined()
  })
})
