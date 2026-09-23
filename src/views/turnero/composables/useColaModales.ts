// Responsabilidad: encolar y temporizar el modal de llamado a partir de
// `ultimosLlamados`. Devuelve `{ turnoEnModal, hablando }` — el turno que
// debe mostrarse ahora mismo (o `null` si no hay ninguno), y si en este
// momento useVozTurno.ts está pronunciando su locución (ver más abajo).
//
// `ultimosLlamados` puede recibir varios turnos nuevos casi al mismo tiempo
// (por ejemplo, si el back agrupa actualizaciones); este composable
// garantiza que el modal los muestre uno tras otro, nunca superpuestos ni
// simultáneos.
//
// Detección de "nuevo": se compara por (`id`, `llamadoEn`) contra el último
// `llamadoEn` anunciado para ese id — NO basta con el id solo. Un turno cuyo
// id ya se anunció, pero que vuelve a aparecer con un `llamadoEn` MÁS NUEVO
// que el que se anunció la vez anterior, también cuenta como "nuevo" — es el
// caso de "Volver a llamar" (TurnosParaLlamar.vue), que reutiliza el mismo
// turno_llamados.id y solo actualiza llamado_at. Si no se comparara por
// valor, ese turno quedaría marcado como "ya visto" para siempre y jamás
// volvería a disparar el modal, aunque colaTurnero() lo suba al primer
// puesto de ultimosLlamados. Entre varios nuevos a la vez, `llamadoEn`
// desempata el orden. No importa que `ultimosLlamados` venga con el más
// reciente primero: esta detección no depende de la posición en el arreglo.
//
// Al mostrar cada turno: pitido corto (useAlarma.ts) seguido inmediatamente
// por la locución de voz (useVozTurno.ts) — ver mostrarSiguiente().
//
// Base de "ya existía al cargar la pantalla": se captura de `ultimosLlamados`
// recién cuando `listo` (ver useTurnos.ts) se vuelve true, es decir, cuando
// el PRIMER fetch real ya resolvió. `useTurnos()` dispara ese primer fetch
// sin esperarlo (fire-and-forget) y devuelve `ultimosLlamados` todavía
// vacío — si esta base se capturara antes de que `listo` sea true, se
// capturaría un arreglo vacío en vez de los llamados reales del día, y esos
// llamados reales llegarían un instante después disparando el modal/sonido
// para TODOS ellos en cascada, como si fueran nuevos. Por eso `encolarNuevos`
// se ignora por completo hasta que la base quede capturada una sola vez.

import { ref, watch, type Ref } from 'vue'
import { DURACION_MODAL_MS, PAUSA_ENTRE_MODALES_MS } from '../config/constantes'
import { useAlarma } from './useAlarma'
import { useVozTurno } from './useVozTurno'
import type { TurnoLlamado } from './useTurnos'

export function useColaModales(ultimosLlamados: Ref<TurnoLlamado[]>, listo: Ref<boolean>) {
  const turnoEnModal = ref<TurnoLlamado | null>(null)

  const ultimoLlamadoEnAnunciado = new Map<string, string>()
  const pendientes: TurnoLlamado[] = []
  let mostrandoModal = false
  let baseCapturada = false

  const { reproducir } = useAlarma()
  // `hablando` se re-expone tal cual hacia TurneroDisplayView.vue → panel
  // derecho: useVozTurno() se instancia UNA sola vez acá (fire de la
  // locución también sale de acá, en mostrarSiguiente), así que este es el
  // único lugar donde existe ese estado — no se crea una segunda instancia
  // del composable en otro componente, que quedaría desincronizada.
  const { anunciar, hablando } = useVozTurno()

  function capturarBase(listaActual: TurnoLlamado[]) {
    listaActual.forEach((turno) => ultimoLlamadoEnAnunciado.set(turno.id, turno.llamadoEn))
    baseCapturada = true
  }

  function encolarNuevos(listaActual: TurnoLlamado[]) {
    if (!baseCapturada) return // todavía no sabemos qué había "antes" de esta pestaña

    // Este .sort() no reordena turnos para pintarlos: `nuevos` es una cola
    // interna de anuncios pendientes, nunca lo que se muestra en las columnas
    // ni en `ultimosLlamados`. Solo decide en qué orden aparecen en el MODAL
    // cuando dos o más llamados llegan casi al tiempo (el back podría
    // agruparlos en una sola actualización sin garantizar su orden interno).
    const nuevos = listaActual
      .filter((turno) => ultimoLlamadoEnAnunciado.get(turno.id) !== turno.llamadoEn)
      .sort((a, b) => new Date(a.llamadoEn).getTime() - new Date(b.llamadoEn).getTime())

    for (const turno of nuevos) {
      ultimoLlamadoEnAnunciado.set(turno.id, turno.llamadoEn)
      pendientes.push(turno)
    }

    mostrarSiguiente()
  }

  function mostrarSiguiente() {
    if (mostrandoModal) return

    const siguiente = pendientes.shift()
    if (!siguiente) return

    mostrandoModal = true
    turnoEnModal.value = siguiente
    // Pitido corto de atención, y apenas termina (evento 'ended' dentro de
    // useAlarma.ts, o de inmediato si el navegador lo bloqueó) sigue la
    // locución de voz — mismo patrón que una cartelera digital real.
    reproducir(() => anunciar(siguiente.placa, siguiente.modulo))

    setTimeout(() => {
      turnoEnModal.value = null
      mostrandoModal = false
      setTimeout(mostrarSiguiente, PAUSA_ENTRE_MODALES_MS)
    }, DURACION_MODAL_MS)
  }

  // Apenas `listo` pasa a true, `ultimosLlamados.value` ya tiene la
  // respuesta real del primer fetch exitoso (useTurnos.ts la asigna antes de
  // marcar `listo`) — ese es el momento correcto para fijar la base.
  watch(
    listo,
    (yaListo) => {
      if (yaListo && !baseCapturada) capturarBase(ultimosLlamados.value)
    },
    { immediate: true }
  )

  // Cambios posteriores a la base ya capturada sí pasan por la detección de
  // "nuevo". Si `ultimosLlamados` cambia antes de que la base exista (no
  // debería, pero por robustez), `encolarNuevos` los ignora hasta que
  // `baseCapturada` sea true.
  watch(ultimosLlamados, (lista) => encolarNuevos(lista), { deep: true })

  return { turnoEnModal, hablando }
}
