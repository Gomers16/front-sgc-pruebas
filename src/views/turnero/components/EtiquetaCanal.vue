<template>
  <v-chip
    class="etiqueta-canal"
    :style="{ '--color-etiqueta': canalInfo.color }"
    variant="flat"
    :ripple="false"
    label
  >
    <span class="etiqueta-canal__nombre">{{ canalInfo.etiqueta }}</span>
    <template v-if="turno">
      <span class="etiqueta-canal__separador" aria-hidden="true"></span>
      <span class="etiqueta-canal__turno">{{ turno }}</span>
    </template>
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { obtenerCanal } from '../config/canales'
import './EtiquetaCanal.css'

const props = defineProps<{
  canal: string
  // Número de turno opcional. Cuando se pasa, se pinta junto al canal
  // separados por una marca propia (ver .etiqueta-canal__separador), en vez
  // del carácter "·" — así el espaciado es simétrico en ambos lados siempre.
  turno?: string | null
}>()

const canalInfo = computed(() => obtenerCanal(props.canal))
</script>
