import { describe, expect, it } from 'vitest'
import { normalizarServicios, servicioRtm } from '../Servicios_service'

// Respuesta real de GET /api/servicios.
const api = [
  { id: 3, codigo: 'PERI', nombre: 'Peritaje' },
  { id: 1, codigo: 'RTM', nombre: 'RTM (Revisión Técnico Mecánica)' },
]

describe('servicios activos', () => {
  it('lee el código de `codigo` y encuentra RTM para preseleccionarlo', () => {
    const s = normalizarServicios(api)
    expect(s.map((x) => x.codigoServicio)).toEqual(['PERI', 'RTM'])
    expect(servicioRtm(s)?.id).toBe(1)
  })

  it('respeta codigoServicio si viniera y tolera respuestas vacías', () => {
    expect(servicioRtm(normalizarServicios([{ id: 9, codigoServicio: 'rtm', nombre: 'x' }]))?.id).toBe(9)
    expect(normalizarServicios(null)).toEqual([])
    expect(servicioRtm([])).toBeUndefined()
  })
})
