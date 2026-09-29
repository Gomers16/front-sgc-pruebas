<template>
  <div class="fila-turno" role="row" :style="{ '--color-estado': estadoInfo.color }">
    <div class="fila-turno__celda fila-turno__celda--turno" role="cell">
      <span class="fila-turno__turno">{{ textoTurno }}</span>
    </div>
    <div class="fila-turno__celda fila-turno__celda--placa" role="cell">
      {{ turno.placa }}
    </div>
    <div class="fila-turno__celda fila-turno__celda--estado" role="cell">
      <span class="fila-turno__estado">{{ estadoInfo.etiqueta }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { obtenerEstado } from '../config/estados'
import { textoTurnoCorto } from '../config/canales'
import type { TurnoEnCola } from '../composables/useTurnos'
import './TarjetaTurno.css'

const props = defineProps<{
  turno: TurnoEnCola
}>()

// Reusa el mismo catálogo etiqueta/color que antes distinguía las 3
// columnas agrupadas: la etiqueta va como texto plano en la celda Estado y
// el color solo en el acento izquierdo de la fila (--color-estado), que es
// la señal visual que queda para saber a qué grupo pertenece cada fila
// (ver ColaSeguimiento.vue, que ya no agrupa).
const estadoInfo = computed(() => obtenerEstado(props.turno.estado))

// Texto plano con código corto, no <EtiquetaCanal> — mismo formato que la
// tabla histórico de TarjetaEntrega.vue (ver codigoCorto en canales.ts). Con
// el código corto el caso más largo es "SOAT 123" (ver el tope en cqw de
// .fila-turno__turno).
const textoTurno = computed(() => textoTurnoCorto(props.turno.canal, props.turno.turno))
</script>
