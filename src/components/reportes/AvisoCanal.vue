<!-- src/components/reportes/AvisoCanal.vue -->
<!-- Aviso de los reportes "por canal": antes de CANAL_CONFIABLE_DESDE el
     canal del turno era la sugerencia del sistema, no lo que eligió el
     operador en "¿Cómo se enteró de nosotros?". -->
<template>
  <v-alert
    v-if="aviso?.aplica && aviso.mensaje"
    type="warning"
    variant="tonal"
    density="compact"
    icon="mdi-calendar-alert"
    class="mb-3"
  >
    {{ aviso.mensaje }}
  </v-alert>
</template>

<script setup lang="ts">
import type { AvisoCanal } from '@/services/reportesAdminService'

defineProps<{ aviso?: AvisoCanal | null }>()
</script>
