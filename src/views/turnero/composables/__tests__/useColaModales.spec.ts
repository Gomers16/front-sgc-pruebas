// Regresión: useTurnos() dispara su primer fetch sin esperarlo (fire-and-
// forget) y devuelve `ultimosLlamados` todavía vacío. Si useColaModales()
// captura "qué llamados ya existían" antes de que ese primer fetch resuelva,
// termina capturando un arreglo vacío — y cuando los datos reales llegan un
// instante después, TODOS se tratan como "nuevos" y disparan el modal +
// sonido en cascada. Este test reproduce exactamente esa secuencia async y
// confirma que la señal `listo` (ver useTurnos.ts) evita el problema.
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useTurnos, type TurnoLlamado } from '../useTurnos'
import { useColaModales } from '../useColaModales'
import { INTERVALO_POLL_MS } from '../../config/constantes'

vi.mock('@/services/http', () => ({ get: vi.fn() }))
vi.mock('../useAlarma', () => ({
  useAlarma: () => ({ reproducir: vi.fn(), audioBloqueado: { value: false } }),
}))

function deferido<T>() {
  let resolve!: (valor: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

async function esperarMicrotareasYReactividad() {
  await new Promise((r) => setTimeout(r, 0))
  await nextTick()
  await nextTick()
}

function llamado(id: string, llamadoEn: string): TurnoLlamado {
  return { id, placa: `PLC${id}`, turno: null, canal: 'RTM', modulo: `Módulo ${id}`, llamadoEn }
}

function montarPantalla() {
  const Componente = defineComponent({
    setup() {
      const { ultimosLlamados, listo } = useTurnos()
      const { turnoEnModal } = useColaModales(ultimosLlamados, listo)
      return { ultimosLlamados, listo, turnoEnModal }
    },
    template: '<div />',
  })
  return mount(Componente)
}

describe('useColaModales + useTurnos — carga inicial', () => {
  it('NO dispara el modal para llamados que ya existían en el primer fetch exitoso', async () => {
    const { get } = await import('@/services/http')
    const primerFetch = deferido<{ colaSeguimiento: []; ultimosLlamados: TurnoLlamado[] }>()
    vi.mocked(get).mockReturnValueOnce(primerFetch.promise as Promise<unknown>)

    const wrapper = montarPantalla()

    // Antes de que resuelva el fetch: sin datos, sin modal. Punto de partida.
    expect(wrapper.vm.turnoEnModal).toBeNull()

    // El primer fetch resuelve con 3 llamados YA existentes (historial del día).
    primerFetch.resolve({
      colaSeguimiento: [],
      ultimosLlamados: [
        llamado('1', '2026-01-01T10:00:00.000-05:00'),
        llamado('2', '2026-01-01T09:00:00.000-05:00'),
        llamado('3', '2026-01-01T08:00:00.000-05:00'),
      ],
    })
    await esperarMicrotareasYReactividad()

    expect(wrapper.vm.listo).toBe(true)
    expect(wrapper.vm.ultimosLlamados).toHaveLength(3)
    // La aserción clave: nada de este historial inicial debe disparar el modal.
    expect(wrapper.vm.turnoEnModal).toBeNull()
  })

  it('SÍ dispara el modal para un llamado genuinamente nuevo llegado después de la carga inicial', async () => {
    vi.useFakeTimers()
    try {
      const { get } = await import('@/services/http')
      const primerFetch = deferido<{ colaSeguimiento: []; ultimosLlamados: TurnoLlamado[] }>()
      const segundoFetch = deferido<{ colaSeguimiento: []; ultimosLlamados: TurnoLlamado[] }>()
      vi.mocked(get)
        .mockReturnValueOnce(primerFetch.promise as Promise<unknown>)
        .mockReturnValueOnce(segundoFetch.promise as Promise<unknown>)

      const wrapper = montarPantalla()

      primerFetch.resolve({
        colaSeguimiento: [],
        ultimosLlamados: [llamado('1', '2026-01-01T10:00:00.000-05:00')],
      })
      // Deja correr el `await get(...)` de la primera llamada (microtareas
      // reales; las fake timers no afectan promesas nativas, solo setInterval).
      await vi.advanceTimersByTimeAsync(0)
      await nextTick()
      expect(wrapper.vm.turnoEnModal).toBeNull()

      // Poll siguiente: llega un llamado nuevo (id '2'), más reciente que el
      // existente. Se resuelve antes de que el setInterval dispare la
      // segunda llamada a get() — es válido, el await simplemente la
      // recogerá ya resuelta.
      segundoFetch.resolve({
        colaSeguimiento: [],
        ultimosLlamados: [
          llamado('2', '2026-01-01T11:00:00.000-05:00'),
          llamado('1', '2026-01-01T10:00:00.000-05:00'),
        ],
      })
      // Avanza el reloj falso más allá del intervalo de polling real para
      // que el setInterval de useTurnos.ts dispare su segunda llamada.
      await vi.advanceTimersByTimeAsync(INTERVALO_POLL_MS + 100)
      await nextTick()

      expect(wrapper.vm.turnoEnModal).not.toBeNull()
      expect((wrapper.vm.turnoEnModal as unknown as TurnoLlamado).id).toBe('2')
    } finally {
      vi.useRealTimers()
    }
  })

  it('SÍ dispara el modal de nuevo para "Volver a llamar" — mismo id, llamadoEn más nuevo', async () => {
    vi.useFakeTimers()
    try {
      const { get } = await import('@/services/http')
      const primerFetch = deferido<{ colaSeguimiento: []; ultimosLlamados: TurnoLlamado[] }>()
      const segundoFetch = deferido<{ colaSeguimiento: []; ultimosLlamados: TurnoLlamado[] }>()
      vi.mocked(get)
        .mockReturnValueOnce(primerFetch.promise as Promise<unknown>)
        .mockReturnValueOnce(segundoFetch.promise as Promise<unknown>)

      const wrapper = montarPantalla()

      // Carga inicial: el turno '1' ya existía (llamadoEn viejo) — no debe
      // anunciarse.
      primerFetch.resolve({
        colaSeguimiento: [],
        ultimosLlamados: [llamado('1', '2026-01-01T10:00:00.000-05:00')],
      })
      await vi.advanceTimersByTimeAsync(0)
      await nextTick()
      expect(wrapper.vm.turnoEnModal).toBeNull()

      // "Volver a llamar": MISMO id '1', pero llamadoEn más nuevo — el
      // backend lo sube al primer puesto de ultimosLlamados sin crear un id
      // nuevo. Debe tratarse como un anuncio nuevo, no quedar silenciado
      // para siempre por haber sido visto antes.
      segundoFetch.resolve({
        colaSeguimiento: [],
        ultimosLlamados: [llamado('1', '2026-01-01T12:00:00.000-05:00')],
      })
      await vi.advanceTimersByTimeAsync(INTERVALO_POLL_MS + 100)
      await nextTick()

      expect(wrapper.vm.turnoEnModal).not.toBeNull()
      expect((wrapper.vm.turnoEnModal as unknown as TurnoLlamado).llamadoEn).toBe(
        '2026-01-01T12:00:00.000-05:00'
      )
    } finally {
      vi.useRealTimers()
    }
  })
})
