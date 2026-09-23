<template>
  <v-chip
    class="etiqueta-canal"
    :style="{ '--color-etiqueta': canalInfo.color }"
    variant="flat"
    :ripple="false"
    label
  >
    <span class="etiqueta-canal__nombre">{{ canalInfo.etiqueta }}</span>
    <span v-if="turno" class="etiqueta-canal__turno">{{ turno }}</span>
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { obtenerCanal } from '../config/canales'
import './EtiquetaCanal.css'

const props = defineProps<{
  canal: string
  // Número de turno opcional. Cuando se pasa, se pinta junto al canal
  // separado solo por el gap del chip (ver .etiqueta-canal.v-chip) — sin
  // separador visual entre nombre y número.
  turno?: string | null
}>()

const canalInfo = computed(() => obtenerCanal(props.canal))
</script>
