<!--
Tarjeta de una meta del mes. Con meta: "avance" (vs la meta completa) y
"ritmo" (vs lo que toca a hoy, decide el semáforo), faltante y semáforo.
Sin meta: "Sin meta definida", sin % ni semáforo (nunca 0%).
-->
<template>
  <v-card variant="outlined" class="h-100">
    <v-card-text>
      <div class="d-flex align-center mb-1">
        <v-icon class="mr-2" :color="p.color ?? undefined">{{ icono }}</v-icon>
        <div>
          <div class="text-subtitle-2 font-weight-bold">{{ titulo }}</div>
          <div v-if="nota" class="text-caption text-medium-emphasis">{{ nota }}</div>
        </div>
        <v-spacer />
        <v-chip v-if="!p.sinMeta" size="x-small" :color="p.color ?? undefined" variant="flat">
          {{ p.etiqueta }}
        </v-chip>
      </div>
      <div class="text-h5 font-weight-bold">{{ p.cifra }}</div>
      <template v-if="p.sinMeta">
        <div class="text-body-2 text-medium-emphasis mt-1">Sin meta definida</div>
      </template>
      <template v-else>
        <v-progress-linear :model-value="p.barra ?? 0" :color="p.color ?? 'primary'" height="6" rounded class="my-2" />
        <div class="d-flex flex-wrap ga-3 text-body-2">
          <span :title="'Lo logrado frente a la meta completa del periodo'">
            <strong>{{ p.avance }}</strong> <span class="text-medium-emphasis">de la meta</span>
          </span>
          <span :title="'Lo logrado frente a lo que debería llevar a hoy (decide el semáforo)'">
            <strong>{{ p.ritmo }}</strong> <span class="text-medium-emphasis">de lo que toca a hoy</span>
          </span>
        </div>
        <div class="text-caption text-medium-emphasis mt-1">{{ p.faltante }}</div>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AvanceMeta } from '@/services/telemercadeoService'
import { presentarMeta } from '../telemercadeoHelpers'

const props = defineProps<{
  titulo: string
  icono: string
  meta: AvanceMeta | null | undefined
  /** Aclaración de qué se cuenta (p. ej. "de tus gestiones · por fecha de la gestión"). */
  nota?: string
}>()
const p = computed(() => presentarMeta(props.meta))
</script>
