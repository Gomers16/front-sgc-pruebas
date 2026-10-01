<template>
  <div class="fila-entrega" role="row">
    <div class="fila-entrega__celda fila-entrega__celda--turno" role="cell">
      {{ textoTurnoCorto(turno.canal, turno.turno) }}
    </div>
    <div class="fila-entrega__celda fila-entrega__celda--placa" role="cell">
      {{ turno.placa }}
    </div>
    <div class="fila-entrega__celda fila-entrega__celda--modulo" role="cell">
      <!-- Pregunta: "Pregunta · {módulo}" para distinguirla a simple vista
           de un llamado a módulo (ver PREFIJO_HISTORICO_PREGUNTA). -->
      {{ turno.tipoLlamado === 'pregunta' ? `${PREFIJO_HISTORICO_PREGUNTA} · ${turno.modulo}` : turno.modulo }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { textoTurnoCorto } from '../config/canales'
import { PREFIJO_HISTORICO_PREGUNTA } from '../config/constantes'
import type { TurnoLlamado } from '../composables/useTurnos'
import './TarjetaEntrega.css'

// El llamado más reciente ya no pasa por acá — vive como hero propio en
// PanelEntrega.vue, junto al indicador de "hablando ahora". Este componente
// es ahora solo una fila del histórico (Turno | Placa | Módulo). La celda
// Turno va en texto plano con código corto ("RTM 7", "PREV 9"), igual que la
// cola de la izquierda — el chip de color (EtiquetaCanal) solo lo usa
// ModalLlamado.vue. Un turno "No se presentó" ya no llega acá (vuelve a
// la cola, ver useTurnos.ts).
defineProps<{
  turno: TurnoLlamado
}>()
</script>
