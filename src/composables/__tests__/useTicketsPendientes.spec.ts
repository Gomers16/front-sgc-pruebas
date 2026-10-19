import { beforeEach, describe, expect, it, vi } from 'vitest'

const getContador = vi.fn()
vi.mock('@/services/ticketsService', () => ({
  getContadorPendientesTickets: () => getContador(),
}))

describe('useTicketsPendientes', () => {
  beforeEach(() => {
    vi.resetModules()
    getContador.mockReset()
  })

  it('el número es compartido y dos refrescos simultáneos hacen una sola llamada', async () => {
    getContador.mockResolvedValue({ pendientes: 4, por_tipo: { EXCEPCION_DATEO: 4 } })
    const { useTicketsPendientes } = await import('../useTicketsPendientes')
    const menu = useTicketsPendientes()
    const bandeja = useTicketsPendientes()

    await Promise.all([menu.refrescarPendientes(), bandeja.refrescarPendientes()])
    expect(getContador).toHaveBeenCalledTimes(1)
    expect(menu.pendientes.value).toBe(4)
    expect(bandeja.pendientes.value).toBe(4)

    // Terminada la anterior, otro refresco sí vuelve a consultar.
    getContador.mockResolvedValue({ pendientes: 3, por_tipo: {} })
    await bandeja.refrescarPendientes()
    expect(getContador).toHaveBeenCalledTimes(2)
    expect(menu.pendientes.value).toBe(3)
  })

  it('sin permiso (403) o sin red: null, para no mostrar la insignia', async () => {
    getContador.mockResolvedValueOnce({ pendientes: 2, por_tipo: {} })
    const { useTicketsPendientes } = await import('../useTicketsPendientes')
    const { pendientes, refrescarPendientes } = useTicketsPendientes()
    await refrescarPendientes()
    expect(pendientes.value).toBe(2)

    getContador.mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { status: 403 }))
    await expect(refrescarPendientes()).resolves.toBeUndefined()
    expect(pendientes.value).toBeNull()
  })
})
