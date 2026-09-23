<template>
  <section class="cola-seguimiento">
    <h2 class="cola-seguimiento__titulo">Siguientes por llamar</h2>

    <div v-if="hayAlgunTurno" class="cola-seguimiento__tabla" role="table">
      <div class="cola-seguimiento__encabezado" role="row">
        <span role="columnheader">Turno</span>
        <span role="columnheader">Placa</span>
        <span role="columnheader">Estado</span>
      </div>

      <div class="cola-seguimiento__filas" role="rowgroup">
        <TarjetaTurno v-for="turno in turnos" :key="turno.id" :turno="turno" />
      </div>
    </div>

    <div v-else class="cola-seguimiento__reposo">
      <!-- espacio reservado para el logo del CDA -->
      <div class="cola-seguimiento__marca">CDA</div>
      <p>Por ahora no hay turnos en espera.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TarjetaTurno from './TarjetaTurno.vue'
import type { TurnoEnCola } from '../composables/useTurnos'
import './ColaSeguimiento.css'

const props = defineProps<{
  // Ya viene ordenado del backend (por_llamar > certificacion > en_proceso,
  // y dentro de cada uno por turno_numero) — ver colaTurnero(). Este
  // componente pinta la lista TAL COMO viene, en una sola tabla: ya no
  // agrupa por estado en columnas, el estado ahora es una celda más (con su
  // chip de color, ver TarjetaTurno.vue) para no perder esa señal visual.
  turnos: TurnoEnCola[]
}>()

const hayAlgunTurno = computed(() => props.turnos.length > 0)
</script>
