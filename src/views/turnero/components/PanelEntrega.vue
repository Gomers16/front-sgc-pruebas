<template>
  <section class="panel-entrega">
    <h2 class="panel-entrega__titulo">Llamando ahora</h2>

    <TransitionGroup v-if="visibles.length" tag="ul" name="tarjeta-entrega-transicion" class="panel-entrega__lista">
      <TarjetaEntrega
        v-for="(turno, indice) in visibles"
        :key="turno.id"
        :turno="turno"
        :dominante="indice === 0"
      />
    </TransitionGroup>

    <div v-else class="panel-entrega__reposo">
      <!-- espacio reservado para el logo del CDA -->
      <div class="panel-entrega__marca">CDA</div>
      <p>Todavía no se ha llamado a ningún turno.</p>
    </div>

    <!-- Cinta de mensajes: siempre visible en esta columna (estado vacío o
         con turnos llamándose), independiente de lo de arriba. Si no hay
         mensajes activos, no deja un hueco — simplemente no se renderiza. -->
    <div v-if="textoTicker" class="panel-entrega__ticker">
      <div class="panel-entrega__ticker-pista" :style="{ animationDuration: `${duracionTickerS}s` }">
        <span class="panel-entrega__ticker-texto">{{ textoTicker }}</span>
        <span class="panel-entrega__ticker-texto" aria-hidden="true">{{ textoTicker }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import TarjetaEntrega from './TarjetaEntrega.vue'
import { get } from '@/services/http'
import {
  CANTIDAD_ULTIMOS_LLAMADOS,
  INTERVALO_POLL_TICKER_MS,
  TICKER_CARACTERES_POR_SEGUNDO,
  TICKER_DURACION_MAX_S,
  TICKER_DURACION_MIN_S,
} from '../config/constantes'
import type { TurnoLlamado } from '../composables/useTurnos'
import './PanelEntrega.css'

const props = defineProps<{
  // Ya viene del más reciente al más antiguo (ver contrato en useTurnos.ts).
  turnos: TurnoLlamado[]
}>()

// Se muestran los primeros N tal como vienen: ni se ordena ni se decide cuál
// es "el más reciente" acá, solo se recorta la cantidad visible.
const visibles = computed(() => props.turnos.slice(0, CANTIDAD_ULTIMOS_LLAMADOS))

/* ==================== cinta de mensajes (ticker) ==================== */

interface MensajeTicker {
  id: number
  texto: string
  orden: number
  activo: boolean
}

interface TickerResponse {
  success?: boolean
  data?: MensajeTicker[]
}

const mensajesActivos = ref<MensajeTicker[]>([])

// Separador con espacio de sobra a ambos lados: al repetir el texto dos
// veces seguidas para el loop sin costura, este mismo separador es lo que
// queda visible en el punto donde una copia termina y la otra empieza —
// tiene que verse igual que entre dos mensajes cualquiera.
const SEPARADOR = '   •   '

const textoTicker = computed(() => {
  const activos = mensajesActivos.value.filter((m) => m.activo).sort((a, b) => a.orden - b.orden)
  if (!activos.length) return ''
  return activos.map((m) => m.texto).join(SEPARADOR) + SEPARADOR
})

// Duración proporcional al largo del texto: la velocidad de lectura se
// siente constante sin importar cuántos mensajes estén activos.
const duracionTickerS = computed(() => {
  const largo = textoTicker.value.length
  const segundos = largo / TICKER_CARACTERES_POR_SEGUNDO
  return Math.min(TICKER_DURACION_MAX_S, Math.max(TICKER_DURACION_MIN_S, segundos))
})

async function cargarTicker() {
  try {
    const resp = await get<TickerResponse>('/api/turnero/ticker')
    mensajesActivos.value = resp.data ?? []
  } catch (error) {
    console.error('[PanelEntrega] Error al consultar /turnero/ticker:', error)
  }
}

let intervaloPoll: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  cargarTicker()
  intervaloPoll = setInterval(cargarTicker, INTERVALO_POLL_TICKER_MS)
})

onBeforeUnmount(() => {
  if (intervaloPoll !== null) clearInterval(intervaloPoll)
})
</script>
