// Texto de la locución por tipo de llamado: siempre con el módulo real, solo
// cambia la instrucción ("diríjase al" / "por favor acérquese al"). Y orden
// de los caminos: clips primero, speechSynthesis de respaldo, "Sin sonido"
// solo si ninguno de los dos puede sonar.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { textoAnuncio, useVozTurno } from '../useVozTurno'
import { AudioFalso } from './audioFalso'

describe('textoAnuncio', () => {
  it('llamado a módulo: "diríjase al {módulo}"', () => {
    expect(
      textoAnuncio({ placa: 'ABC123', modulo: 'Módulo 5 - Caja RTM', tipoLlamado: 'modulo' })
    ).toBe('Turno con placa ABC123, diríjase al Módulo 5 - Caja RTM.')
  })

  it('pregunta: "por favor acérquese al {módulo}", con el módulo real', () => {
    expect(
      textoAnuncio({ placa: 'ABC123', modulo: 'Módulo 5 - Caja RTM', tipoLlamado: 'pregunta' })
    ).toBe('Turno con placa ABC123, por favor acérquese al Módulo 5 - Caja RTM.')
  })
})

describe('useVozTurno().anunciar: clips primero, speechSynthesis de respaldo', () => {
  const llamado = { placa: 'ABC12D', modulo: 'Módulo 5 - Caja RTM', tipoLlamado: 'modulo' as const }
  let audio: AudioFalso
  let speak: ReturnType<typeof vi.fn>

  // Instala un speechSynthesis falso (el de jsdom no existe).
  function instalarSintesis() {
    speak = vi.fn()
    vi.stubGlobal('speechSynthesis', {
      speak,
      cancel: vi.fn(),
      speaking: false,
      getVoices: () => [],
      onvoiceschanged: null,
    })
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        lang = ''
        constructor(public text: string) {}
      }
    )
  }

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    audio = new AudioFalso()
    vi.stubGlobal(
      'Audio',
      vi.fn(() => audio)
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('sin speechSynthesis (como el TV): suena con los clips', async () => {
    expect('speechSynthesis' in window).toBe(false)
    const { anunciar, vozBloqueada, hablando } = useVozTurno()
    anunciar(llamado)
    expect(hablando.value).toBe(true)
    expect(audio.reproducidos[0]).toMatch(/turno-con-placa\.wav/)
    for (let i = 0; i < 9; i++) {
      await Promise.resolve()
      audio.emitir('ended')
    }
    expect(audio.reproducidos).toHaveLength(9)
    expect(audio.reproducidos[8]).toMatch(/modulo-5\.wav/)
    expect(hablando.value).toBe(false)
    expect(vozBloqueada.value).toBe(false)
  })

  it('clips ausentes: cae a speechSynthesis con el texto completo', () => {
    instalarSintesis()
    const { anunciar } = useVozTurno({ simularSinClips: () => true })
    anunciar(llamado)
    expect(audio.reproducidos).toHaveLength(0)
    expect(speak).toHaveBeenCalledOnce()
    expect(speak.mock.calls[0][0].text).toBe(textoAnuncio(llamado))
  })

  it('módulo fuera de los 6 fijos: cae a speechSynthesis', () => {
    instalarSintesis()
    const { anunciar } = useVozTurno()
    anunciar({ ...llamado, modulo: 'Caja 2' })
    expect(audio.reproducidos).toHaveLength(0)
    expect(speak).toHaveBeenCalledOnce()
  })

  it('el primer clip es rechazado: cae a speechSynthesis', async () => {
    instalarSintesis()
    audio.rechazar = () => true
    const { anunciar } = useVozTurno()
    anunciar(llamado)
    await Promise.resolve()
    await Promise.resolve()
    expect(speak).toHaveBeenCalledOnce()
  })

  it('ni clips ni speechSynthesis: queda "Sin sonido" (vozBloqueada)', async () => {
    audio.rechazar = () => true
    const { anunciar, vozBloqueada } = useVozTurno()
    anunciar(llamado)
    await Promise.resolve()
    await Promise.resolve()
    expect(vozBloqueada.value).toBe(true)
  })

  it('simularSinSintesis + clips ausentes: "Sin sonido" aunque el navegador la tenga', () => {
    instalarSintesis()
    const { anunciar, vozBloqueada } = useVozTurno({
      simularSinSintesis: () => true,
      simularSinClips: () => true,
    })
    anunciar(llamado)
    expect(speak).not.toHaveBeenCalled()
    expect(vozBloqueada.value).toBe(true)
  })
})
