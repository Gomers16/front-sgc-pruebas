<template>
  <section class="panel-entrega">
    <h2 class="panel-entrega__titulo">Llamando ahora</h2>

    <div class="panel-entrega__hero">
      <Transition name="hero-transicion" mode="out-in">
        <div v-if="heroTurno" :key="`${heroTurno.id}-${heroTurno.llamadoEn}`" class="panel-entrega__hero-contenido">
          <p class="panel-entrega__hero-placa">{{ heroTurno.placa }}</p>
          <div class="panel-entrega__hero-aviso">
            <p class="panel-entrega__hero-instruccion">Diríjase a</p>
            <p class="panel-entrega__hero-modulo">{{ heroTurno.modulo }}</p>
          </div>
          <!-- Se reserva el espacio siempre; solo se anima/hace visible
               mientras useVozTurno.ts está pronunciando esta locución (ver
               `hablando`, que sube desde useColaModales.ts) — así no hay
               salto de layout entre "hablando" y "en silencio". -->
          <div class="panel-entrega__hero-pulso" :class="{ 'esta-hablando': hablando }" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
        </div>

        <div v-else key="reposo" class="panel-entrega__reposo">
          <!-- espacio reservado para el logo del CDA -->
          <div class="panel-entrega__marca">CDA</div>
          <p>Todavía no se ha llamado a ningún turno.</p>
        </div>
      </Transition>
    </div>

    <div v-if="historial.length" class="panel-entrega__tabla" role="table">
      <div class="panel-entrega__encabezado" role="row">
        <span role="columnheader">En</span>
        <span role="columnheader">Atención</span>
        <span role="columnheader">Módulo</span>
      </div>

      <TransitionGroup
        tag="div"
        name="tarjeta-entrega-transicion"
        class="panel-entrega__filas"
        role="rowgroup"
      >
        <TarjetaEntrega v-for="turno in historial" :key="turno.id" :turno="turno" />
      </TransitionGroup>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TarjetaEntrega from './TarjetaEntrega.vue'
import { CANTIDAD_ULTIMOS_LLAMADOS } from '../config/constantes'
import type { TurnoLlamado } from '../composables/useTurnos'
import './PanelEntrega.css'

const props = defineProps<{
  // Ya viene del más reciente al más antiguo (ver contrato en useTurnos.ts).
  turnos: TurnoLlamado[]
  // true mientras useVozTurno.ts está pronunciando la locución del llamado
  // activo (ver useColaModales.ts) — mueve el indicador de pulso del hero.
  hablando: boolean
}>()

// Mismo recorte de siempre: los primeros N tal como vienen, ni se ordena ni
// se decide cuál es "el más reciente" acá.
const visibles = computed(() => props.turnos.slice(0, CANTIDAD_ULTIMOS_LLAMADOS))

// El más reciente ya no es una tarjeta más de la lista: es el hero fijo de
// arriba, con la placa en grande y el indicador de voz. El histórico de
// abajo arranca en el segundo para no duplicarlo (ver PanelEntrega.css).
const heroTurno = computed(() => visibles.value[0] ?? null)
const historial = computed(() => visibles.value.slice(1))
</script>
