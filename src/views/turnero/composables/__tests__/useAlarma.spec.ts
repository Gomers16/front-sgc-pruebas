// Pitido: alTerminar se llama exactamente una vez — al 'ended', al bloqueo de
// autoplay o pasado PITIDO_TIMEOUT_MS si 'ended' nunca llega — y no quedan
// listeners acumulados entre llamados (antes con `{ once: true }`, que los
// motores viejos ignoran).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PITIDO_TIMEOUT_MS } from '../../config/constantes'
import { useAlarma } from '../useAlarma'
import { AudioFalso } from './audioFalso'

describe('useAlarma().reproducir', () => {
  let audio: AudioFalso

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    audio = new AudioFalso()
    vi.stubGlobal(
      'Audio',
      vi.fn(() => audio)
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('al "ended" llama una sola vez y no deja listeners', () => {
    const { reproducir } = useAlarma()
    const alTerminar = vi.fn()
    reproducir(alTerminar)
    audio.emitir('ended')
    vi.advanceTimersByTime(PITIDO_TIMEOUT_MS)
    expect(alTerminar).toHaveBeenCalledOnce()
    expect(audio.cantidadOyentes()).toBe(0)
  })

  it('vigilante: si "ended" no llega, sigue a los 3 s', () => {
    const { reproducir } = useAlarma()
    const alTerminar = vi.fn()
    reproducir(alTerminar)
    vi.advanceTimersByTime(PITIDO_TIMEOUT_MS - 1)
    expect(alTerminar).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(alTerminar).toHaveBeenCalledOnce()
  })

  it('autoplay bloqueado: marca audioBloqueado y sigue de inmediato', async () => {
    audio.rechazar = () => true
    const { reproducir, audioBloqueado } = useAlarma()
    const alTerminar = vi.fn()
    reproducir(alTerminar)
    await Promise.resolve()
    await Promise.resolve()
    expect(audioBloqueado.value).toBe(true)
    expect(alTerminar).toHaveBeenCalledOnce()
  })

  it('dos pitidos seguidos: el segundo "ended" no vuelve a llamar al primero', () => {
    const { reproducir } = useAlarma()
    const primero = vi.fn()
    const segundo = vi.fn()
    reproducir(primero)
    audio.emitir('ended')
    reproducir(segundo)
    audio.emitir('ended')
    expect(primero).toHaveBeenCalledOnce()
    expect(segundo).toHaveBeenCalledOnce()
  })
})
