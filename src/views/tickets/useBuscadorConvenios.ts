// src/views/tickets/useBuscadorConvenios.ts
//
// Autocomplete de convenio con búsqueda en el servidor (hay asesores con
// cientos de convenios): GET /convenios/asignados?q&limit. El seleccionado se
// mantiene en la lista aunque la búsqueda actual no lo traiga.

import { computed, ref, watch, type Ref } from 'vue'
import { buscarConveniosParaTicket, type ConvenioTicketOpcion } from '@/services/conveniosService'

export function useBuscadorConvenios(
  asesorId: Ref<number | null>,
  incluirNoAsignados: Ref<boolean>,
) {
  const seleccionado = ref<ConvenioTicketOpcion | null>(null)
  const busqueda = ref('')
  const resultados = ref<ConvenioTicketOpcion[]>([])
  const cargando = ref(false)
  let temporizador: ReturnType<typeof setTimeout> | null = null
  let pedido = 0

  async function buscar(texto: string) {
    const id = asesorId.value
    if (!id) {
      resultados.value = []
      return
    }
    const mio = ++pedido
    cargando.value = true
    try {
      const filas = await buscarConveniosParaTicket(id, texto, {
        incluirNoAsignados: incluirNoAsignados.value,
      })
      if (mio === pedido) resultados.value = filas
    } catch (err) {
      console.error('Error buscando convenios:', err)
      if (mio === pedido) resultados.value = []
    } finally {
      if (mio === pedido) cargando.value = false
    }
  }

  watch(busqueda, (texto) => {
    if (temporizador) clearTimeout(temporizador)
    temporizador = setTimeout(() => buscar(texto ?? ''), 300)
  })

  watch([asesorId, incluirNoAsignados], () => buscar(''), { immediate: true })

  const items = computed(() => {
    const sel = seleccionado.value
    if (!sel || resultados.value.some((c) => c.id === sel.id)) return resultados.value
    return [sel, ...resultados.value]
  })

  return { seleccionado, busqueda, items, cargando }
}
