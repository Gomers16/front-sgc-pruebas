<template>
  <div class="fila-entrega" role="row" :class="{ 'es-no-presentado': turno.noPresentado }">
    <div class="fila-entrega__celda fila-entrega__celda--turno" role="cell">
      {{ textoTurnoCorto(turno.canal, turno.turno) }}
    </div>
    <div class="fila-entrega__celda fila-entrega__celda--placa" role="cell">
      {{ turno.placa }}
    </div>
    <div class="fila-entrega__celda fila-entrega__celda--modulo" role="cell">
      <v-icon v-if="turno.noPresentado" class="fila-entrega__icono-no-presentado" size="small">
        mdi-account-clock-outline
      </v-icon>
      {{ turno.modulo }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { textoTurnoCorto } from '../config/canales'
import type { TurnoLlamado } from '../composables/useTurnos'
import './TarjetaEntrega.css'

// El llamado más reciente ya no pasa por acá — vive como hero propio en
// PanelEntrega.vue, junto al indicador de "hablando ahora". Este componente
// es ahora solo una fila del histórico (Turno | Placa | Módulo). La celda
// Turno va en texto plano con código corto ("RTM 7", "PREV 9"), igual que la
// cola de la izquierda — el chip de color (EtiquetaCanal) queda solo en el
// hero.
defineProps<{
  turno: TurnoLlamado
}>()
</script>
