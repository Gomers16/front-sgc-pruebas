// Locución por clips: armado de la lista (placas de carro y moto, módulos,
// caracteres ignorados, casos inválidos) y reproducción encadenada con un
// solo Audio (avance por 'ended', vigilante, fallos, cancelación).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MODULOS_TURNERO } from '../../config/constantes'
import { URL_CLIPS, clipsAnuncio, urlsDeClips, useClipsAnuncio } from '../useClipsAnuncio'
import { AudioFalso } from './audioFalso'

const turno = (placa: string, modulo: string = MODULOS_TURNERO[4], tipoLlamado: 'modulo' | 'pregunta' = 'modulo') => ({
  placa,
  modulo,
  tipoLlamado,
})

describe('clipsAnuncio', () => {
  it('placa de carro (3 letras + 3 números)', () => {
    expect(clipsAnuncio(turno('ABC123'))).toEqual([
      'turno-con-placa',
      'letra-a',
      'letra-b',
      'letra-c',
      'digito-1',
      'digito-2',
      'digito-3',
      'dirijase-al',
      'modulo-5',
    ])
  })

  it('placa de moto (3 letras + 2 números + 1 letra)', () => {
    expect(clipsAnuncio(turno('ABC12D'))).toEqual([
      'turno-con-placa',
      'letra-a',
      'letra-b',
      'letra-c',
      'digito-1',
      'digito-2',
      'letra-d',
      'dirijase-al',
      'modulo-5',
    ])
  })

  it('los 6 módulos fijos, cada uno con su clip', () => {
    MODULOS_TURNERO.forEach((modulo, i) => {
      expect(clipsAnuncio(turno('ABC123', modulo))?.slice(-1)).toEqual([`modulo-${i + 1}`])
    })
  })

  it('pregunta: "por favor acérquese al" en vez de "diríjase al"', () => {
    const clips = clipsAnuncio(turno('ABC123', MODULOS_TURNERO[0], 'pregunta'))
    expect(clips?.slice(-2)).toEqual(['por-favor-acerquese-al', 'modulo-1'])
  })

  it('ignora espacios, guiones y minúsculas', () => {
    expect(clipsAnuncio(turno(' ab-c 1-2 3 '))).toEqual(clipsAnuncio(turno('ABC123')))
  })

  it('placa vacía o sin letras ni dígitos → null (respaldo), sin romper', () => {
    expect(clipsAnuncio(turno(''))).toBeNull()
    expect(clipsAnuncio(turno(' - ñ '))).toBeNull()
    expect(clipsAnuncio(turno(null as unknown as string))).toBeNull()
  })

  it('módulo que no es uno de los 6 fijos → null (respaldo)', () => {
    expect(clipsAnuncio(turno('ABC123', 'Caja 2'))).toBeNull()
    expect(clipsAnuncio(turno('ABC123', 'constructor'))).toBeNull()
  })
})

describe('urlsDeClips', () => {
  it('los 45 clips existen en assets/sonidos/voz/', () => {
    expect(Object.keys(URL_CLIPS)).toHaveLength(45)
    expect(urlsDeClips(clipsAnuncio(turno('WXYZ0456')))).not.toBeNull()
  })

  it('si falta un clip → null y aviso en consola', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(urlsDeClips(['letra-a', 'letra-b'], { 'letra-a': '/a.wav' })).toBeNull()
    expect(aviso).toHaveBeenCalled()
    aviso.mockRestore()
  })
})

describe('useClipsAnuncio().reproducir', () => {
  let audio: AudioFalso
  let reproductor: ReturnType<typeof useClipsAnuncio>
  const urls = ['/1.wav', '/2.wav', '/3.wav']

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    audio = new AudioFalso()
    reproductor = useClipsAnuncio(() => audio as unknown as HTMLAudioElement)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('encadena los clips en orden con un solo Audio, avanzando en "ended"', async () => {
    const alTerminar = vi.fn()
    reproductor.reproducir(urls, { alTerminar, alFallar: vi.fn() })
    for (let i = 0; i < urls.length; i++) {
      await Promise.resolve()
      audio.emitir('ended')
    }
    expect(audio.reproducidos).toEqual(urls)
    expect(alTerminar).toHaveBeenCalledOnce()
    expect(audio.cantidadOyentes()).toBe(0)
  })

  it('vigilante: si un clip no dispara "ended" ni "error" en 4 s, salta al siguiente', () => {
    const alTerminar = vi.fn()
    reproductor.reproducir(urls, { alTerminar, alFallar: vi.fn() })
    vi.advanceTimersByTime(3999)
    expect(audio.reproducidos).toEqual(['/1.wav'])
    vi.advanceTimersByTime(1)
    expect(audio.reproducidos).toEqual(['/1.wav', '/2.wav'])
    vi.advanceTimersByTime(8000)
    expect(alTerminar).toHaveBeenCalledOnce()
  })

  it('si el primer clip falla, no sigue y avisa con alFallar', async () => {
    audio.rechazar = (src) => src === '/1.wav'
    const alFallar = vi.fn()
    reproductor.reproducir(urls, { alTerminar: vi.fn(), alFallar })
    await vi.runAllTimersAsync()
    expect(alFallar).toHaveBeenCalledOnce()
    expect(audio.reproducidos).toEqual(['/1.wav'])
  })

  it('un clip intermedio que falla se salta y la secuencia termina', async () => {
    audio.rechazar = (src) => src === '/2.wav'
    const alTerminar = vi.fn()
    const alFallar = vi.fn()
    reproductor.reproducir(urls, { alTerminar, alFallar })
    await Promise.resolve()
    audio.emitir('ended') // termina /1, arranca /2 que rechaza
    await Promise.resolve()
    await Promise.resolve()
    expect(audio.reproducidos).toEqual(urls)
    audio.emitir('ended') // termina /3
    expect(alTerminar).toHaveBeenCalledOnce()
    expect(alFallar).not.toHaveBeenCalled()
  })

  it('si falla la mayoría, avisa con alFallar al final', async () => {
    audio.rechazar = (src) => src !== '/1.wav'
    const alTerminar = vi.fn()
    const alFallar = vi.fn()
    reproductor.reproducir(urls, { alTerminar, alFallar })
    await Promise.resolve()
    audio.emitir('ended')
    await vi.runAllTimersAsync()
    expect(alFallar).toHaveBeenCalledOnce()
    expect(alTerminar).not.toHaveBeenCalled()
  })

  it('un llamado nuevo corta el actual: pausa, sin listeners colgados ni desenlace del viejo', async () => {
    const viejo = { alTerminar: vi.fn(), alFallar: vi.fn() }
    const nuevo = { alTerminar: vi.fn(), alFallar: vi.fn() }
    reproductor.reproducir(urls, viejo)
    await Promise.resolve()
    reproductor.reproducir(['/a.wav'], nuevo)
    expect(audio.pause).toHaveBeenCalled()
    expect(audio.cantidadOyentes()).toBe(2) // solo 'ended' + 'error' del nuevo
    await Promise.resolve()
    audio.emitir('ended')
    vi.advanceTimersByTime(20000)
    expect(nuevo.alTerminar).toHaveBeenCalledOnce()
    expect(viejo.alTerminar).not.toHaveBeenCalled()
    expect(viejo.alFallar).not.toHaveBeenCalled()
    expect(audio.reproducidos).toEqual(['/1.wav', '/a.wav'])
  })
})
