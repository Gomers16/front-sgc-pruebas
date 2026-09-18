<template>
  <v-card
    class="tarjeta-entrega"
    :class="{ 'es-dominante': dominante, 'es-no-presentado': turno.noPresentado }"
    flat
    tag="li"
  >
    <template v-if="dominante">
      <p class="tarjeta-entrega__placa">{{ turno.placa }}</p>
      <p class="tarjeta-entrega__canal">
        <EtiquetaCanal :canal="turno.canal" :turno="turno.turno" />
      </p>
      <div class="tarjeta-entrega__aviso">
        <p class="tarjeta-entrega__instruccion">Diríjase a</p>
        <p class="tarjeta-entrega__modulo">{{ turno.modulo }}</p>
      </div>
      <p v-if="turno.noPresentado" class="tarjeta-entrega__aviso-no-presentado">
        <v-icon size="small">mdi-account-clock-outline</v-icon>
        En espera de regreso
      </p>
    </template>

    <template v-else>
      <p class="tarjeta-entrega__placa-historial">{{ turno.placa }}</p>
      <EtiquetaCanal class="tarjeta-entrega__canal-historial" :canal="turno.canal" :turno="turno.turno" />
      <v-icon v-if="turno.noPresentado" class="tarjeta-entrega__icono-no-presentado" size="small">
        mdi-account-clock-outline
      </v-icon>
      <p class="tarjeta-entrega__modulo-historial">{{ turno.modulo }}</p>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import EtiquetaCanal from './EtiquetaCanal.vue'
import type { TurnoLlamado } from '../composables/useTurnos'
import './TarjetaEntrega.css'

defineProps<{
  turno: TurnoLlamado
  // El más reciente de "Llamando ahora": ocupa la mayor parte de la columna
  // y es el elemento de mayor peso visual de toda la pantalla. El resto es
  // historial compacto (ver PanelEntrega.vue, que decide cuál es cuál).
  dominante?: boolean
}>()
</script>
