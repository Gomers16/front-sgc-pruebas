<!--
Evidencia privada de una gestión: se pide como Blob con Bearer
(GET /api/telemercadeo/gestiones/:id/evidencia) y se muestra con un object
URL que se revoca al cerrar o desmontar. Nunca window.open al endpoint.
-->
<template>
  <v-dialog :model-value="gestionId !== null" max-width="720" @update:model-value="(v) => !v && cerrar()">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-image-search</v-icon>
        Evidencia de la gestión #{{ gestionId }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="cerrar" />
      </v-card-title>
      <v-card-text class="text-center">
        <v-progress-circular v-if="cargando" indeterminate class="my-8" />
        <v-alert v-else-if="error" type="error" variant="tonal">{{ error }}</v-alert>
        <v-img v-else-if="url" :src="url" max-height="70vh" contain />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { HttpError } from '@/services/http'
import { getEvidenciaBlob } from '@/services/telemercadeoService'

const props = defineProps<{ gestionId: number | null }>()
const emit = defineEmits<{ cerrar: [] }>()

const url = ref<string | null>(null)
const cargando = ref(false)
const error = ref('')
let pedido = 0

function revocar() {
  if (url.value) URL.revokeObjectURL(url.value)
  url.value = null
}

watch(
  () => props.gestionId,
  async (id) => {
    revocar()
    error.value = ''
    if (id === null) return
    const mio = ++pedido
    cargando.value = true
    try {
      const blob = await getEvidenciaBlob(id)
      if (mio !== pedido) return
      url.value = URL.createObjectURL(blob)
    } catch (e) {
      if (mio !== pedido) return
      error.value =
        e instanceof HttpError && e.status === 403
          ? 'No tienes permiso para ver esta evidencia.'
          : e instanceof HttpError && e.status === 404
            ? 'La evidencia no está disponible.'
            : 'No se pudo cargar la evidencia.'
    } finally {
      if (mio === pedido) cargando.value = false
    }
  },
  { immediate: true },
)

function cerrar() {
  pedido++
  revocar()
  emit('cerrar')
}

onBeforeUnmount(() => {
  pedido++
  revocar()
})
</script>
