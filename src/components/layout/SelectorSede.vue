<!-- src/components/layout/SelectorSede.vue -->
<!--
  Multi-sede (Fase 6): sede activa en el encabezado.
  - SUPER_ADMIN y GERENCIA: selector de sede + "Todas las sedes" (solo lectura).
  - Los demás roles no ven nada (el backend usa la sede de su usuario).
  - El aviso (escritura en "Todas", sede inválida, usuario sin sede) se
    muestra para cualquiera que lo dispare.
-->
<script setup lang="ts">
import { computed } from 'vue'
import {
  cerrarAvisoSede,
  elegirSede,
  esModoTodas,
  nombreSedeActiva,
  sedeActiva,
  type SeleccionSede,
} from '@/services/sedeActiva'

const props = defineProps<{ compacto?: boolean }>()

const opciones = computed(() => {
  const sedes = sedeActiva.sedesPermitidas.map((s) => ({ title: s.nombre, value: s.id as SeleccionSede }))
  // La sede propia vale aunque esté inactiva (p. ej. PRUEBAS QA): el backend
  // no la incluye en sedesPermitidas, pero el usuario debe poder volver a ella.
  const propia = sedeActiva.sedePropia
  if (propia && !sedes.some((s) => s.value === propia.id)) {
    sedes.unshift({ title: propia.nombre, value: propia.id })
  }
  if (sedeActiva.sedesPermitidas.length > 1) sedes.push({ title: 'Todas las sedes (solo lectura)', value: 'todas' })
  return sedes
})

const seleccion = computed<SeleccionSede | null>({
  get: () => sedeActiva.seleccion,
  set: (v) => {
    if (v === sedeActiva.seleccion) return
    elegirSede(v)
    // Todo lo cargado en pantalla es de la sede anterior: se recarga.
    window.location.reload()
  },
})

const modoTodas = computed(() => esModoTodas())
const nombre = computed(() => nombreSedeActiva())
const avisoVisible = computed({
  get: () => !!sedeActiva.aviso,
  set: (v: boolean) => {
    if (!v) cerrarAvisoSede()
  },
})
</script>

<template>
  <div v-if="sedeActiva.puedeCambiarSede" class="selector-sede" data-test="selector-sede">
    <v-select
      v-model="seleccion"
      :items="opciones"
      :label="props.compacto ? undefined : 'Sede'"
      density="compact"
      variant="outlined"
      hide-details
      prepend-inner-icon="mdi-map-marker"
      class="selector-sede__select"
      :aria-label="`Sede activa: ${nombre ?? ''}`"
    />
    <v-chip
      v-if="modoTodas"
      color="warning"
      size="small"
      variant="flat"
      prepend-icon="mdi-eye"
      class="ml-2"
      data-test="chip-solo-lectura"
    >
      Solo lectura
    </v-chip>
  </div>

  <v-snackbar
    v-model="avisoVisible"
    color="warning"
    location="top"
    timeout="7000"
    multi-line
    data-test="aviso-sede"
  >
    {{ sedeActiva.aviso }}
    <template #actions>
      <v-btn variant="text" @click="cerrarAvisoSede">Cerrar</v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>
.selector-sede {
  display: flex;
  align-items: center;
  margin-right: 8px;
}
.selector-sede__select {
  min-width: 190px;
  max-width: 260px;
}
</style>
