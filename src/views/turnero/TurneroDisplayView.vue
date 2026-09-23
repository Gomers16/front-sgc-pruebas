<template>
  <div class="turnero-pantalla">
    <div class="turnero-pantalla__masthead">
      <MastheadInfo />
    </div>

    <!-- Orden de columnas: Cola | Publicidad | Llamando ahora — decisión de
         diseño, ver layout.css (grid-template-columns se asigna por orden
         de aparición acá, no hay grid-column explícito por componente). -->
    <ColaSeguimiento :turnos="colaSeguimiento" />
    <PanelPublicidad />
    <PanelEntrega :turnos="ultimosLlamados" :hablando="hablando" />

    <!-- Franja inferior a todo el ancho, fuera de las 3 columnas — ver
         layout.css (.turnero-pantalla__ticker, grid-row: 3). -->
    <div class="turnero-pantalla__ticker">
      <CintaMensajes />
    </div>

    <ModalLlamado :turno="turnoEnModal" />
  </div>
</template>

<script setup lang="ts">
import MastheadInfo from './components/MastheadInfo.vue'
import ColaSeguimiento from './components/ColaSeguimiento.vue'
import PanelPublicidad from './components/PanelPublicidad.vue'
import PanelEntrega from './components/PanelEntrega.vue'
import CintaMensajes from './components/CintaMensajes.vue'
import ModalLlamado from './components/ModalLlamado.vue'
import { useTurnos } from './composables/useTurnos'
import { useColaModales } from './composables/useColaModales'
import './styles/tokens.css'
import './styles/layout.css'

const { colaSeguimiento, ultimosLlamados, listo } = useTurnos()
const { turnoEnModal, hablando } = useColaModales(ultimosLlamados, listo)
</script>
