<template>
  <div class="masthead-info">
    <div class="masthead-info__ciudad">
      <v-icon class="masthead-info__icono">mdi-map-marker</v-icon>
      <span>{{ CIUDAD_TURNERO }}</span>
    </div>

    <div class="masthead-info__fechahora">
      <span class="masthead-info__fecha">{{ fechaFormateada }}</span>
      <span class="masthead-info__separador" aria-hidden="true"></span>
      <span class="masthead-info__hora">{{ horaFormateada }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  CIUDAD_TURNERO,
  INTERVALO_ACTUALIZACION_RELOJ_MS,
  LOCALE_FECHA_HORA_TURNERO,
  ZONA_HORARIA_TURNERO,
} from '../config/constantes'
import './MastheadInfo.css'

const ahora = ref(new Date())

// Formateadores creados una sola vez (no en cada render): Intl.DateTimeFormat
// es una API relativamente costosa de instanciar.
const formateadorFecha = new Intl.DateTimeFormat(LOCALE_FECHA_HORA_TURNERO, {
  timeZone: ZONA_HORARIA_TURNERO,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const formateadorHora = new Intl.DateTimeFormat(LOCALE_FECHA_HORA_TURNERO, {
  timeZone: ZONA_HORARIA_TURNERO,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const fechaFormateada = computed(() => formateadorFecha.format(ahora.value))
const horaFormateada = computed(() => formateadorHora.format(ahora.value))

let intervalo: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  intervalo = setInterval(() => {
    ahora.value = new Date()
  }, INTERVALO_ACTUALIZACION_RELOJ_MS)
})

onBeforeUnmount(() => {
  if (intervalo !== null) clearInterval(intervalo)
})
</script>
