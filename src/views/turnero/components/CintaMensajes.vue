<template>
  <!-- Si no hay mensajes activos, no deja un hueco — simplemente no se
       renderiza (la fila del grid queda vacía, ver layout.css). -->
  <div v-if="textoTicker" class="cinta-mensajes">
    <div class="cinta-mensajes__pista" :style="{ animationDuration: `${duracionTickerS}s` }">
      <span class="cinta-mensajes__texto">{{ textoTicker }}</span>
      <span class="cinta-mensajes__texto" aria-hidden="true">{{ textoTicker }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMensajesTicker } from '../composables/useMensajesTicker'
import './CintaMensajes.css'

const { textoTicker, duracionTickerS } = useMensajesTicker()
</script>
