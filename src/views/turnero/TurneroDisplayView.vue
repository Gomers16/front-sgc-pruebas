<template>
  <div class="turnero-pantalla">
    <div class="turnero-pantalla__masthead">
      <MastheadInfo />
    </div>

    <ColaSeguimiento :turnos="colaSeguimiento" />
    <PanelPublicidad />
    <PanelEntrega :turnos="ultimosLlamados" />

    <ModalLlamado :turno="turnoEnModal" />
  </div>
</template>

<script setup lang="ts">
import MastheadInfo from './components/MastheadInfo.vue'
import ColaSeguimiento from './components/ColaSeguimiento.vue'
import PanelPublicidad from './components/PanelPublicidad.vue'
import PanelEntrega from './components/PanelEntrega.vue'
import ModalLlamado from './components/ModalLlamado.vue'
import { useTurnos } from './composables/useTurnos'
import { useColaModales } from './composables/useColaModales'
import './styles/tokens.css'
import './styles/layout.css'

const { colaSeguimiento, ultimosLlamados, listo } = useTurnos()
const { turnoEnModal } = useColaModales(ultimosLlamados, listo)
</script>
