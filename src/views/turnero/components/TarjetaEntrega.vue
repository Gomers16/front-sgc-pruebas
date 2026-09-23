<template>
  <div class="fila-entrega" role="row" :class="{ 'es-no-presentado': turno.noPresentado }">
    <div class="fila-entrega__celda fila-entrega__celda--turno" role="cell">
      <EtiquetaCanal :canal="turno.canal" :turno="turno.turno" />
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
import EtiquetaCanal from './EtiquetaCanal.vue'
import type { TurnoLlamado } from '../composables/useTurnos'
import './TarjetaEntrega.css'

// El llamado más reciente ya no pasa por acá — vive como hero propio en
// PanelEntrega.vue, junto al indicador de "hablando ahora". Este componente
// es ahora solo una fila del histórico (Turno | Placa | Módulo).
defineProps<{
  turno: TurnoLlamado
}>()
</script>
