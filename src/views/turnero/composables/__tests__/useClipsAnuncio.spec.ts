// Locución por clips: armado de la lista (placas de carro y moto, módulos,
// caracteres ignorados, casos inválidos), reproducción encadenada con un
// solo Audio (avance por 'ended', vigilante, fallos, cancelación) y WAV
// único armado en memoria (parseo, concatenación, encabezado, precarga y
// orden de respaldo Blob → data: URI → encadenado).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MODULOS_TURNERO,
  PRECARGA_CLIPS_REINTENTO_MS,
  PROGRESO_WAV_SONDEO_MS,
  PROGRESO_WAV_TIMEOUT_MS,
  SILENCIO_ANTES_INSTRUCCION_MS,
  SILENCIO_ENTRE_CLIPS_MS,
  SILENCIO_FINAL_MS,
  SILENCIO_INICIAL_MS,
  WAV_UNICO_MARGEN_MS,
} from '../../config/constantes'
import {
  URL_CLIPS,
  armarWav,
  clipsAnuncio,
  crearPrecarga,
  pcmDeWav,
  urlsDeClips,
  useClipsAnuncio,
  type CargarArchivo,
} from '../useClipsAnuncio'
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

// WAV de prueba: `muestras` muestras de 16 bit (valor = índice + 1, para
// poder ubicarlas), con un chunk LIST de tamaño impar entre 'fmt ' y 'data'
// como el que escribe ffmpeg (más el byte de relleno).
function wavDePrueba(
  muestras: number,
  formato: { canales?: number; muestreo?: number; bits?: number; conList?: boolean } = {}
): ArrayBuffer {
  const { canales = 1, muestreo = 22050, bits = 16, conList = true } = formato
  const list = conList ? 8 + 13 + 1 : 0
  const datos = muestras * 2
  const buffer = new ArrayBuffer(12 + 24 + list + 8 + datos)
  const vista = new DataView(buffer)
  const texto = (pos: number, valor: string) =>
    [...valor].forEach((c, i) => vista.setUint8(pos + i, c.charCodeAt(0)))
  texto(0, 'RIFF')
  vista.setUint32(4, buffer.byteLength - 8, true)
  texto(8, 'WAVE')
  texto(12, 'fmt ')
  vista.setUint32(16, 16, true)
  vista.setUint16(20, 1, true)
  vista.setUint16(22, canales, true)
  vista.setUint32(24, muestreo, true)
  vista.setUint32(28, muestreo * canales * (bits / 8), true)
  vista.setUint16(32, canales * (bits / 8), true)
  vista.setUint16(34, bits, true)
  let pos = 36
  if (conList) {
    texto(pos, 'LIST')
    vista.setUint32(pos + 4, 13, true)
    texto(pos + 8, 'INFOISFT')
    pos += list
  }
  texto(pos, 'data')
  vista.setUint32(pos + 4, datos, true)
  for (let i = 0; i < muestras; i++) vista.setInt16(pos + 8 + i * 2, i + 1, true)
  return buffer
}

const bytesSilencio = (ms: number) => Math.round((ms * 22050) / 1000) * 2

describe('pcmDeWav', () => {
  it('encuentra "data" saltando un chunk LIST (impar, con relleno) antes', () => {
    const pcm = pcmDeWav(wavDePrueba(5))
    expect(pcm).not.toBeNull()
    expect(Array.from(new Int16Array(pcm!.slice().buffer))).toEqual([1, 2, 3, 4, 5])
  })

  it('funciona también sin chunks extra (encabezado de 44 bytes)', () => {
    expect(pcmDeWav(wavDePrueba(3, { conList: false }))?.length).toBe(6)
  })

  it('los 45 clips reales del repo tienen el formato esperado', () => {
    const invalidos = Object.keys(URL_CLIPS).filter((nombre) => {
      const ruta = resolve(process.cwd(), `src/views/turnero/assets/sonidos/voz/${nombre}.wav`)
      const archivo = readFileSync(ruta)
      const buffer = archivo.buffer.slice(archivo.byteOffset, archivo.byteOffset + archivo.byteLength)
      return !pcmDeWav(buffer as ArrayBuffer)
    })
    expect(invalidos).toEqual([])
  })

  it('rechaza estéreo, otro muestreo, 8 bit y lo que no es RIFF/WAVE', () => {
    expect(pcmDeWav(wavDePrueba(4, { canales: 2 }))).toBeNull()
    expect(pcmDeWav(wavDePrueba(4, { muestreo: 44100 }))).toBeNull()
    expect(pcmDeWav(wavDePrueba(4, { bits: 8 }))).toBeNull()
    expect(pcmDeWav(new ArrayBuffer(4))).toBeNull()
    expect(pcmDeWav(new TextEncoder().encode('RIFF....AVI LIST').buffer as ArrayBuffer)).toBeNull()
  })
})

describe('armarWav', () => {
  const nombres = ['turno-con-placa', 'letra-a', 'dirijase-al', 'modulo-5']
  const buffers = {
    'turno-con-placa': wavDePrueba(100),
    'letra-a': wavDePrueba(200),
    'dirijase-al': wavDePrueba(300),
    'modulo-5': wavDePrueba(400),
  }

  it('duración = suma de los clips + silencio inicial, entre clips, antes de la instrucción y final', () => {
    const wav = armarWav(nombres, buffers)!
    const silencios =
      bytesSilencio(SILENCIO_INICIAL_MS) +
      bytesSilencio(SILENCIO_ENTRE_CLIPS_MS) + // antes de letra-a
      bytesSilencio(SILENCIO_ANTES_INSTRUCCION_MS) + // antes de dirijase-al
      bytesSilencio(SILENCIO_ENTRE_CLIPS_MS) + // antes de modulo-5
      bytesSilencio(SILENCIO_FINAL_MS)
    const datos = (100 + 200 + 300 + 400) * 2 + silencios
    expect(wav.bytes.length).toBe(44 + datos)
    expect(wav.duracionMs).toBeCloseTo((datos / 2 / 22050) * 1000, 6)
  })

  it('cada clip queda en su lugar, con ceros (silencio) entre ellos', () => {
    const wav = armarWav(['letra-a', 'dirijase-al'], buffers)!
    const vista = new DataView(wav.bytes.buffer)
    const inicioA = 44 + bytesSilencio(SILENCIO_INICIAL_MS)
    expect(vista.getInt16(inicioA - 2, true)).toBe(0)
    expect(vista.getInt16(inicioA, true)).toBe(1)
    expect(vista.getInt16(inicioA + 199 * 2, true)).toBe(200)
    const inicioInstruccion = inicioA + 400 + bytesSilencio(SILENCIO_ANTES_INSTRUCCION_MS)
    expect(vista.getInt16(inicioInstruccion - 2, true)).toBe(0)
    expect(vista.getInt16(inicioInstruccion, true)).toBe(1)
    // Después del último clip: SILENCIO_FINAL_MS de ceros hasta el final.
    const finInstruccion = inicioInstruccion + 600
    expect(vista.getInt16(finInstruccion - 2, true)).toBe(300)
    expect(wav.bytes.length - finInstruccion).toBe(bytesSilencio(SILENCIO_FINAL_MS))
    expect(wav.bytes.subarray(finInstruccion).every((byte) => byte === 0)).toBe(true)
  })

  it('escribe un encabezado WAV válido (PCM mono 16 bit 22050 Hz)', () => {
    const wav = armarWav(nombres, buffers)!
    const vista = new DataView(wav.bytes.buffer)
    const texto = (pos: number) => String.fromCharCode(...wav.bytes.slice(pos, pos + 4))
    expect(texto(0)).toBe('RIFF')
    expect(vista.getUint32(4, true)).toBe(wav.bytes.length - 8)
    expect(texto(8)).toBe('WAVE')
    expect(texto(12)).toBe('fmt ')
    expect(vista.getUint32(16, true)).toBe(16)
    expect(vista.getUint16(20, true)).toBe(1)
    expect(vista.getUint16(22, true)).toBe(1)
    expect(vista.getUint32(24, true)).toBe(22050)
    expect(vista.getUint32(28, true)).toBe(44100)
    expect(vista.getUint16(32, true)).toBe(2)
    expect(vista.getUint16(34, true)).toBe(16)
    expect(texto(36)).toBe('data')
    expect(vista.getUint32(40, true)).toBe(wav.bytes.length - 44)
    expect(pcmDeWav(wav.bytes.buffer as ArrayBuffer)?.length).toBe(wav.bytes.length - 44)
  })

  it('null si falta un clip o alguno no tiene el formato esperado', () => {
    expect(armarWav(['letra-a', 'letra-b'], buffers)).toBeNull()
    expect(armarWav(['letra-a'], { 'letra-a': wavDePrueba(10, { muestreo: 44100 }) })).toBeNull()
  })
})

describe('crearPrecarga', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('carga todos en segundo plano y reintenta los que fallan', () => {
    vi.useFakeTimers()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const intentos: Record<string, number> = {}
    const cargar: CargarArchivo = (url, alListo, alFallar) => {
      intentos[url] = (intentos[url] ?? 0) + 1
      if (url === '/b.wav' && intentos[url] === 1) alFallar('error de red')
      else alListo(wavDePrueba(1))
    }
    const precarga = crearPrecarga({ a: '/a.wav', b: '/b.wav', c: '/c.wav' }, cargar)
    expect(precarga.listos.value).toBe(false)
    precarga.iniciar()
    expect(precarga.cargados.value).toBe(2)
    expect(precarga.listos.value).toBe(false)
    vi.advanceTimersByTime(PRECARGA_CLIPS_REINTENTO_MS)
    expect(intentos['/b.wav']).toBe(2)
    expect(precarga.listos.value).toBe(true)
    expect(intentos['/a.wav']).toBe(1)
  })
})

describe('useClipsAnuncio().anunciar: WAV único y respaldos', () => {
  const nombres = ['turno-con-placa', 'letra-a', 'dirijase-al', 'modulo-5']
  const urls = nombres.map((nombre) => `/${nombre}.wav`)
  let audio: AudioFalso
  let crearUrl: ReturnType<typeof vi.fn>
  let revocarUrl: ReturnType<typeof vi.fn>
  let originales: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>

  // Precarga ya completa (o con `faltante` sin cargar).
  function precargaCon(faltante?: string) {
    const precarga = crearPrecarga(
      Object.fromEntries(nombres.map((nombre, i) => [nombre, urls[i]])),
      (url, alListo, alFallar) => (url === `/${faltante}.wav` ? alFallar('x') : alListo(wavDePrueba(2205)))
    )
    precarga.iniciar()
    return precarga
  }

  function desenlace() {
    return { alTerminar: vi.fn(), alFallar: vi.fn(), alCambiarCamino: vi.fn() }
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    audio = new AudioFalso()
    crearUrl = vi.fn(() => 'blob:wav-unico')
    revocarUrl = vi.fn()
    originales = { createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL }
    Object.assign(URL, { createObjectURL: crearUrl, revokeObjectURL: revocarUrl })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    Object.assign(URL, originales)
    vi.restoreAllMocks()
  })

  const crear = () => audio as unknown as HTMLAudioElement

  it('todo precargado: suena UN WAV (Blob) y libera la URL al terminar', async () => {
    const { anunciar } = useClipsAnuncio(crear, precargaCon())
    const fin = desenlace()
    anunciar(nombres, urls, fin)
    expect(audio.reproducidos).toEqual(['blob:wav-unico'])
    const blob = crearUrl.mock.calls[0][0] as Blob
    expect(blob.type).toBe('audio/wav')
    expect(fin.alCambiarCamino).toHaveBeenCalledWith('wav-unico', expect.any(Number))
    await Promise.resolve()
    audio.emitir('ended')
    expect(fin.alTerminar).toHaveBeenCalledOnce()
    expect(revocarUrl).toHaveBeenCalledWith('blob:wav-unico')
    expect(audio.cantidadOyentes()).toBe(0)
  })

  it('un clip sin precargar: no espera, usa el encadenado', () => {
    const { anunciar } = useClipsAnuncio(crear, precargaCon('letra-a'))
    const fin = desenlace()
    anunciar(nombres, urls, fin)
    expect(crearUrl).not.toHaveBeenCalled()
    expect(audio.reproducidos).toEqual(['/turno-con-placa.wav'])
    expect(fin.alCambiarCamino).toHaveBeenCalledWith('encadenado', null)
  })

  it('sin Blob: suena como data: URI en base64', () => {
    vi.stubGlobal('Blob', undefined)
    const { anunciar } = useClipsAnuncio(crear, precargaCon())
    anunciar(nombres, urls, desenlace())
    expect(crearUrl).not.toHaveBeenCalled()
    expect(audio.reproducidos).toHaveLength(1)
    expect(audio.reproducidos[0]).toMatch(/^data:audio\/wav;base64,UklGR/) // "RIFF"
  })

  it('Blob rechazado → data: URI; también rechazado → encadenado', async () => {
    audio.rechazar = (src) => src.startsWith('blob:') || src.startsWith('data:')
    const { anunciar } = useClipsAnuncio(crear, precargaCon())
    const fin = desenlace()
    anunciar(nombres, urls, fin)
    await Promise.resolve()
    await Promise.resolve()
    expect(audio.reproducidos.map((src) => src.slice(0, 5))).toEqual(['blob:', 'data:', '/turn'])
    expect(revocarUrl).toHaveBeenCalledWith('blob:wav-unico')
    expect(fin.alCambiarCamino).toHaveBeenLastCalledWith('encadenado', null)
    expect(fin.alFallar).not.toHaveBeenCalled()
  })

  it('error de media en el WAV (sin rechazo de play) también pasa al siguiente respaldo', () => {
    const { anunciar } = useClipsAnuncio(crear, precargaCon())
    anunciar(nombres, urls, desenlace())
    audio.emitir('error')
    expect(audio.reproducidos[1]).toMatch(/^data:/)
  })

  it('vigilante: con progreso y sin "ended", termina a los (duración del WAV + margen)', () => {
    const { anunciar } = useClipsAnuncio(crear, precargaCon())
    const fin = desenlace()
    anunciar(nombres, urls, fin)
    audio.emitir('playing')
    const duracionMs = fin.alCambiarCamino.mock.calls[0][1] as number
    vi.advanceTimersByTime(duracionMs + WAV_UNICO_MARGEN_MS - 1)
    expect(fin.alTerminar).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fin.alTerminar).toHaveBeenCalledOnce()
    expect(revocarUrl).toHaveBeenCalled()
  })

  it('reproducción muda (play() resuelve, sin eventos ni avance): Blob → data: URI → encadenado', async () => {
    const { anunciar } = useClipsAnuncio(crear, precargaCon())
    const fin = desenlace()
    anunciar(nombres, urls, fin)
    await Promise.resolve()
    vi.advanceTimersByTime(PROGRESO_WAV_TIMEOUT_MS - 1)
    expect(audio.reproducidos).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(audio.reproducidos[1]).toMatch(/^data:/)
    expect(revocarUrl).toHaveBeenCalledWith('blob:wav-unico')
    vi.advanceTimersByTime(PROGRESO_WAV_TIMEOUT_MS)
    expect(audio.reproducidos[2]).toBe('/turno-con-placa.wav')
    expect(fin.alCambiarCamino).toHaveBeenLastCalledWith('encadenado', null)
    expect(fin.alTerminar).not.toHaveBeenCalled()
  })

  it('play() normal con avance de currentTime (sin eventos): el sondeo confirma y no cae', async () => {
    const { anunciar } = useClipsAnuncio(crear, precargaCon())
    const fin = desenlace()
    anunciar(nombres, urls, fin)
    await Promise.resolve()
    audio.currentTime = 0.3
    vi.advanceTimersByTime(PROGRESO_WAV_SONDEO_MS)
    vi.advanceTimersByTime(PROGRESO_WAV_TIMEOUT_MS * 2)
    expect(audio.reproducidos).toEqual(['blob:wav-unico'])
    audio.emitir('ended')
    expect(fin.alTerminar).toHaveBeenCalledOnce()
  })

  it('"timeupdate" con currentTime > 0 también confirma el progreso', () => {
    const { anunciar } = useClipsAnuncio(crear, precargaCon())
    anunciar(nombres, urls, desenlace())
    audio.currentTime = 0.1
    audio.emitir('timeupdate')
    vi.advanceTimersByTime(PROGRESO_WAV_TIMEOUT_MS * 2)
    expect(audio.reproducidos).toEqual(['blob:wav-unico'])
  })

  it('"timeupdate" con currentTime en 0 NO confirma: cae al data: URI', () => {
    const { anunciar } = useClipsAnuncio(crear, precargaCon())
    anunciar(nombres, urls, desenlace())
    audio.emitir('timeupdate')
    vi.advanceTimersByTime(PROGRESO_WAV_TIMEOUT_MS)
    expect(audio.reproducidos[1]).toMatch(/^data:/)
  })

  it('cancelar durante la comprobación de progreso limpia sondeo y timers', () => {
    const { anunciar, cancelar } = useClipsAnuncio(crear, precargaCon())
    const fin = desenlace()
    anunciar(nombres, urls, fin)
    expect(vi.getTimerCount()).toBe(2) // sondeo + límite de progreso
    cancelar()
    expect(vi.getTimerCount()).toBe(0)
    expect(audio.cantidadOyentes()).toBe(0)
    audio.currentTime = 1
    vi.advanceTimersByTime(60000)
    expect(audio.reproducidos).toEqual(['blob:wav-unico'])
    expect(fin.alTerminar).not.toHaveBeenCalled()
    expect(fin.alFallar).not.toHaveBeenCalled()
  })

  it('cancelar con el progreso ya confirmado limpia el vigilante de fin', () => {
    const { anunciar, cancelar } = useClipsAnuncio(crear, precargaCon())
    anunciar(nombres, urls, desenlace())
    audio.emitir('playing')
    expect(vi.getTimerCount()).toBe(1) // solo el vigilante de fin
    cancelar()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancelar corta el WAV: pausa, libera la URL y no llama desenlaces', () => {
    const { anunciar, cancelar } = useClipsAnuncio(crear, precargaCon())
    const fin = desenlace()
    anunciar(nombres, urls, fin)
    cancelar()
    expect(audio.pause).toHaveBeenCalled()
    expect(revocarUrl).toHaveBeenCalled()
    expect(audio.cantidadOyentes()).toBe(0)
    vi.advanceTimersByTime(60000)
    expect(fin.alTerminar).not.toHaveBeenCalled()
    expect(fin.alFallar).not.toHaveBeenCalled()
  })

  it('sinWavUnico: fuerza el encadenado aunque estén precargados', () => {
    const { anunciar } = useClipsAnuncio(crear, precargaCon())
    anunciar(nombres, urls, desenlace(), { sinWavUnico: true })
    expect(audio.reproducidos).toEqual(['/turno-con-placa.wav'])
  })
})
