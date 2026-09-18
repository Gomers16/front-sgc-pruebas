<template>
  <v-card class="tarjeta-turno" flat tile :style="{ '--color-estado': estadoInfo.color }" tag="li">
    <div class="tarjeta-turno__identidad">
      <p class="tarjeta-turno__placa">{{ turno.placa }}</p>
      <p class="tarjeta-turno__detalle">
        <EtiquetaCanal :canal="turno.canal" :turno="turno.turno" />
      </p>
    </div>
  </v-card>
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

// El texto del estado ya no se repite por tarjeta: ColaSeguimiento.vue ahora
// agrupa las tarjetas bajo un encabezado por estado, así que el texto sería
// redundante. El color del borde (--color-estado) se mantiene como acento
// rápido de a cuál grupo pertenece cada tarjeta.
const estadoInfo = computed(() => obtenerEstado(props.turno.estado))
</script>
