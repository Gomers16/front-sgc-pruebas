<template>
  <Transition name="modal-llamado">
    <!-- OJO: nunca pongas `color="transparent"` acá (a diferencia del v-sheet
         de reposo en PanelPublicidad.vue, donde sí se quiere transparencia).
         Ese prop de Vuetify inyecta `background-color` como ESTILO INLINE,
         que gana por especificidad sobre el `background: var(--azul-noche)`
         de ModalLlamado.css — dejaba el modal invisible/transparente sobre
         el video de publicidad. El fondo sólido lo pone el CSS, no un prop. -->
    <v-sheet v-if="turno" class="modal-llamado" role="alert">
      <div class="modal-llamado__contenido">
        <p class="modal-llamado__placa">{{ turno.placa }}</p>
        <p class="modal-llamado__canal">
          <EtiquetaCanal :canal="turno.canal" :turno="turno.turno" />
        </p>
        <p class="modal-llamado__modulo">{{ turno.modulo }}</p>
      </div>
    </v-sheet>
  </Transition>
</template>

<script setup lang="ts">
import EtiquetaCanal from './EtiquetaCanal.vue'
import type { TurnoLlamado } from '../composables/useTurnos'
import './ModalLlamado.css'

defineProps<{
  turno?: TurnoLlamado | null
}>()
</script>
