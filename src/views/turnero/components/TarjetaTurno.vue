<template>
  <div class="fila-turno" role="row" :style="{ '--color-estado': estadoInfo.color }">
    <div class="fila-turno__celda fila-turno__celda--turno" role="cell">
      <EtiquetaCanal :canal="turno.canal" :turno="turno.turno" />
    </div>
    <div class="fila-turno__celda fila-turno__celda--placa" role="cell">
      {{ turno.placa }}
    </div>
    <div class="fila-turno__celda fila-turno__celda--estado" role="cell">
      <span class="fila-turno__chip-estado">{{ estadoInfo.etiqueta }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import EtiquetaCanal from './EtiquetaCanal.vue'
import { obtenerEstado } from '../config/estados'
import type { TurnoEnCola } from '../composables/useTurnos'
import './TarjetaTurno.css'

const props = defineProps<{
  turno: TurnoEnCola
}>()

// El chip de Estado reusa el mismo catálogo etiqueta/color que antes
// distinguía las 3 columnas agrupadas — al pasar a tabla de una sola lista,
// esta es la única señal visual que queda para saber a qué grupo pertenece
// cada fila (ver ColaSeguimiento.vue, que ya no agrupa).
const estadoInfo = computed(() => obtenerEstado(props.turno.estado))
</script>
