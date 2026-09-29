<template>
  <!-- Si no hay mensajes activos, no deja un hueco — simplemente no se
       renderiza (la fila del grid queda vacía, ver layout.css). -->
  <div v-if="textoTicker" class="cinta-mensajes">
    <div class="cinta-mensajes__pista" :style="{ animationDuration: `${duracionS}s` }">
      <span ref="copiaRef" class="cinta-mensajes__copia">
        <span ref="textoRef" class="cinta-mensajes__texto">{{ textoTicker }}</span>
      </span>
      <span class="cinta-mensajes__copia" aria-hidden="true">
        <span class="cinta-mensajes__texto">{{ textoTicker }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useMensajesTicker } from '../composables/useMensajesTicker'
import {
  TICKER_CARACTERES_POR_SEGUNDO,
  TICKER_DURACION_MAX_S,
  TICKER_DURACION_MIN_S,
} from '../config/constantes'
import './CintaMensajes.css'

const { textoTicker, duracionTickerS } = useMensajesTicker()

const copiaRef = ref<HTMLElement | null>(null)
const textoRef = ref<HTMLElement | null>(null)
const anchoCopiaPx = ref(0)
const anchoTextoPx = ref(0)

// Cada copia mide como mínimo el ancho de la pantalla (ver
// .cinta-mensajes__copia), así que la distancia de una vuelta ya no depende
// solo del largo del texto. duracionTickerS (por caracteres) aceleraba la
// cinta con textos cortos a pantalla completa — acá la duración sale de los
// píxeles reales a recorrer, manteniendo la misma velocidad de lectura
// (TICKER_CARACTERES_POR_SEGUNDO, convertida a px/s con el ancho medio real
// de un carácter a esta resolución). Hasta tener la medición usa
// duracionTickerS como respaldo.
const duracionS = computed(() => {
  const caracteres = textoTicker.value.length
  if (!anchoCopiaPx.value || !anchoTextoPx.value || !caracteres) return duracionTickerS.value
  const pxPorSegundo = (anchoTextoPx.value / caracteres) * TICKER_CARACTERES_POR_SEGUNDO
  const segundos = anchoCopiaPx.value / pxPorSegundo
  return Math.min(TICKER_DURACION_MAX_S, Math.max(TICKER_DURACION_MIN_S, segundos))
})

// Re-mide si cambia el texto (poll del ticker) o el tamaño de pantalla /
// fuente — ResizeObserver cubre los dos casos.
const observador = new ResizeObserver(() => {
  anchoCopiaPx.value = copiaRef.value?.offsetWidth ?? 0
  anchoTextoPx.value = textoRef.value?.offsetWidth ?? 0
})

watch(
  [copiaRef, textoRef],
  ([copia, texto]) => {
    observador.disconnect()
    if (copia) observador.observe(copia)
    if (texto) observador.observe(texto)
  },
  { flush: 'post' }
)

onUnmounted(() => observador.disconnect())
</script>
