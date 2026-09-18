<template>
  <section class="cola-seguimiento">
    <h2 class="cola-seguimiento__titulo">Siguientes por llamar</h2>

    <template v-if="hayAlgunTurno">
      <div
        v-for="grupo in gruposVisibles"
        :key="grupo.estado"
        class="cola-seguimiento__grupo"
        :style="{ '--color-grupo': grupo.info.color, flexGrow: grupo.filas }"
      >
        <h3 class="cola-seguimiento__grupo-titulo">{{ grupo.info.etiqueta }}</h3>

        <ul class="cola-seguimiento__grupo-cuadricula">
          <TarjetaTurno v-for="turno in grupo.turnos" :key="turno.id" :turno="turno" />
        </ul>
      </div>
    </template>

    <div v-else class="cola-seguimiento__reposo">
      <!-- espacio reservado para el logo del CDA -->
      <div class="cola-seguimiento__marca">CDA</div>
      <p>Por ahora no hay turnos en espera.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TarjetaTurno from './TarjetaTurno.vue'
import { obtenerEstado, type EstadoInfo } from '../config/estados'
import type { TurnoEnCola } from '../composables/useTurnos'
import './ColaSeguimiento.css'

const props = defineProps<{
  // Ya viene ordenado del backend (por_llamar > certificacion > en_proceso,
  // y dentro de cada uno por turno_numero) — ver colaTurnero(). Este
  // componente NO ordena ni decide cuál es "el siguiente": solo separa por
  // estado en 3 grupos fijos y los muestra TODOS a la vez en una cuadrícula
  // de 2 columnas (ver TarjetaTurno.css para el achicamiento progresivo por
  // container queries cuando un grupo tiene muchos turnos).
  turnos: TurnoEnCola[]
}>()

const hayAlgunTurno = computed(() => props.turnos.length > 0)

// Orden de aparición fijo de los grupos — independiente del orden del
// arreglo plano que manda el backend (que existe para priorizar el modal /
// otros consumidores, no para decidir el layout de columnas de esta vista).
const ORDEN_ESTADOS = ['por_llamar', 'certificacion', 'en_proceso'] as const

interface GrupoRender {
  estado: (typeof ORDEN_ESTADOS)[number]
  info: EstadoInfo
  turnos: TurnoEnCola[]
  // Filas de la cuadrícula (2 columnas), no cantidad de tarjetas — es la
  // base real del reparto de alto entre grupos (ver flex-grow arriba): un
  // grupo de 8 turnos ocupa 4 filas, no 8, así que le corresponde el mismo
  // espacio que otro grupo de 4 turnos (también 4 filas), no el doble.
  filas: number
}

const gruposVisibles = computed<GrupoRender[]>(() => {
  const mapa = new Map<string, TurnoEnCola[]>()
  for (const estado of ORDEN_ESTADOS) mapa.set(estado, [])
  for (const turno of props.turnos) {
    mapa.get(turno.estado)?.push(turno)
  }

  return ORDEN_ESTADOS.map((estado) => {
    const turnosDelGrupo = mapa.get(estado) ?? []
    return {
      estado,
      info: obtenerEstado(estado),
      turnos: turnosDelGrupo,
      filas: Math.ceil(turnosDelGrupo.length / 2),
    }
  }).filter((grupo) => grupo.turnos.length > 0)
})
</script>
