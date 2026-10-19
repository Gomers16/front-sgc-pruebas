<!-- src/views/comercial/comisiones/ConfirmarSinComisionDialog.vue -->
<!-- Diálogo del 409 "este valor viene de un ticket que decidió sin comisión".
     Explica qué decidió el ticket; solo SUPER_ADMIN/GERENCIA (puedeConfirmar)
     ven el botón para continuar, que queda registrado en la comisión y en el
     ticket. -->
<template>
  <v-dialog :model-value="modelValue" max-width="500" persistent>
    <v-card v-if="conflicto" data-test="dialogo-sin-comision">
      <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center gap-2">
        <v-icon color="deep-orange">mdi-ticket-confirmation-outline</v-icon>
        Decisión del ticket #{{ conflicto.ticketId }}
      </v-card-title>
      <v-card-text>
        <p class="mb-2">{{ textoDecisionTicket(conflicto) }}</p>
        <p class="mb-2">
          Estás poniendo {{ textoCampos(conflicto.campos) }} por encima de $0, en contra de esa
          decisión.
        </p>
        <v-alert
          v-if="conflicto.puedeConfirmar"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          Si continúas, queda registrado en la comisión y en el ticket quién lo hizo y cuándo.
        </v-alert>
        <v-alert v-else type="info" variant="tonal" density="compact" class="mt-2">
          Solo gerencia puede confirmar un valor contra la decisión del ticket. No se guardó nada.
        </v-alert>
        <div class="mt-2">
          <router-link :to="{ name: 'TicketDetalle', params: { id: conflicto.ticketId } }">
            Ver el ticket #{{ conflicto.ticketId }}
          </router-link>
        </div>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="emit('responder', false)">
          {{ conflicto.puedeConfirmar ? 'Cancelar' : 'Entendido' }}
        </v-btn>
        <v-btn
          v-if="conflicto.puedeConfirmar"
          color="deep-orange"
          variant="flat"
          data-test="confirmar-sin-comision"
          @click="emit('responder', true)"
        >
          Continuar de todas formas
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { textoCampos, textoDecisionTicket, type ConflictoSinComision } from './ticketOrigen'

defineProps<{ modelValue: boolean; conflicto: ConflictoSinComision | null }>()
const emit = defineEmits<{ responder: [confirmar: boolean] }>()
</script>
