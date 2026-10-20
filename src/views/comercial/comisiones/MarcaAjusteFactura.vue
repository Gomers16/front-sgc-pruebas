<!-- src/views/comercial/comisiones/MarcaAjusteFactura.vue -->
<!-- Chip "Ajustada por edición de factura · ±$D" de una comisión que cambió
     al editar el descuento de su ticket de Facturación ya confirmado: enlace
     al ticket en el Historial. No muestra nada si no hay ajuste. -->
<template>
  <v-tooltip v-if="ajuste" location="top" max-width="320">
    <template #activator="{ props: tip }">
      <v-chip
        v-bind="tip"
        :to="{ name: 'FacturacionHistorico', query: { focus: ajuste.facturacion_ticket_id } }"
        size="x-small"
        :color="ajuste.tras_pago ? 'red-darken-2' : 'indigo'"
        variant="tonal"
        prepend-icon="mdi-receipt-text-edit-outline"
        class="font-weight-medium"
        data-test="marca-ajuste-factura"
        @click.stop
      >
        {{ etiquetaAjusteFactura(ajuste, formatCOP) }}
      </v-chip>
    </template>
    <div>
      Se editó el descuento del ticket de facturación #{{ ajuste.facturacion_ticket_id }}
      <template v-if="ajuste.fecha"> el {{ formatDateTime(ajuste.fecha) }}</template
      >.
    </div>
    <div v-if="ajuste.tras_pago">La comisión ya estaba pagada: el dinero entregado no cambió.</div>
    <div class="text-caption">Clic para abrir el ticket.</div>
  </v-tooltip>
</template>

<script setup lang="ts">
import type { AjusteEdicionFactura } from '@/services/comisionesService'
import { etiquetaAjusteFactura } from '@/services/comisionesService'
import { formatDateTime } from '@/services/dateosService'

defineProps<{ ajuste?: AjusteEdicionFactura | null }>()

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n || 0)
}
</script>
