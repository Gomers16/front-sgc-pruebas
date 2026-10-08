// Doble de HTMLAudioElement para los tests de la locución: registra qué src
// se reprodujo, permite disparar 'ended'/'error' a mano y decidir qué clips
// rechaza play() (como el bloqueo de autoplay).
import { vi } from 'vitest'

export class AudioFalso {
  src = ''
  preload = ''
  currentTime = 0
  error: unknown = null
  reproducidos: string[] = []
  rechazar: (src: string) => boolean = () => false
  pause = vi.fn()
  private oyentes = new Map<string, Set<() => void>>()

  addEventListener(tipo: string, oyente: () => void) {
    if (!this.oyentes.has(tipo)) this.oyentes.set(tipo, new Set())
    this.oyentes.get(tipo)!.add(oyente)
  }

  removeEventListener(tipo: string, oyente: () => void) {
    this.oyentes.get(tipo)?.delete(oyente)
  }

  emitir(tipo: string) {
    for (const oyente of [...(this.oyentes.get(tipo) ?? [])]) oyente()
  }

  cantidadOyentes() {
    let total = 0
    this.oyentes.forEach((conjunto) => (total += conjunto.size))
    return total
  }

  play() {
    this.reproducidos.push(this.src)
    return this.rechazar(this.src)
      ? Promise.reject(new Error('NotAllowedError'))
      : Promise.resolve()
  }
}
