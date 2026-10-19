<!-- src/views/comercial/comisiones/MarcaTicketComision.vue -->
<!-- Chip "Sin comisión … · ticket #N" de una comisión que viene de un ticket
     de Excepción de Dateo con decisión "sin comisión": enlace al ticket y
     quién decidió y cuándo. No muestra nada si no hay marca. -->
<template>
  <v-tooltip v-if="origen?.marca" location="top" max-width="320">
    <template #activator="{ props: tip }">
      <v-chip
        v-bind="tip"
        :to="{ name: 'TicketDetalle', params: { id: origen.ticket_id } }"
        size="x-small"
        color="deep-orange"
        variant="tonal"
        prepend-icon="mdi-ticket-confirmation-outline"
        class="font-weight-medium"
        data-test="marca-ticket"
        @click.stop
      >
        {{ origen.etiqueta }}
      </v-chip>
    </template>
    <div>
      Decidió {{ origen.decidido_por_nombre ?? 'gerencia' }}
      <template v-if="origen.decidido_at"> el {{ formatDateTime(origen.decidido_at) }}</template>
      al aprobar el ticket #{{ origen.ticket_id }}.
    </div>
    <div class="text-caption">Clic para abrir el ticket.</div>
  </v-tooltip>
</template>

<script setup lang="ts">
import type { TicketOrigenComision } from '@/services/comisionesService'
import { formatDateTime } from '@/services/dateosService'

defineProps<{ origen?: TicketOrigenComision | null }>()
</script>
