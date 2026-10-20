<template>
  <v-divider class="my-3" />
  <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center" style="gap: 6px">
    <v-icon size="18" color="blue-darken-3">mdi-shield-account</v-icon>
    Documentos requeridos — Policía / Militar
  </div>
  <div class="text-caption text-medium-emphasis mb-3">
    Sube los 3 documentos para habilitar el descuento. Se guardan directamente en el ticket.
  </div>

  <v-row dense>
    <v-col v-for="tipo in TIPOS" :key="tipo" cols="12" md="4">
      <v-card
        variant="outlined"
        :color="
          estado[tipo] === 'done'
            ? 'success'
            : estado[tipo] === 'error'
              ? 'error'
              : estado[tipo] === 'uploading'
                ? 'info'
                : undefined
        "
        class="pa-3 text-center rounded-lg"
        style="cursor: pointer; min-height: 120px"
        @click="inputEls[tipo]?.click()"
      >
        <input
          :ref="(el) => setInputRef(tipo, el)"
          type="file"
          accept="image/jpeg,image/png,.jfif"
          class="d-none"
          @change="onFile(tipo, $event)"
        />

        <!-- Preview si existe -->
        <div v-if="preview[tipo]" class="mb-1">
          <v-img :src="preview[tipo]!" height="60" contain class="rounded" />
        </div>

        <!-- Ícono de estado -->
        <v-progress-circular
          v-if="estado[tipo] === 'uploading'"
          indeterminate
          size="24"
          color="info"
          class="mb-1"
        />
        <v-icon v-else-if="estado[tipo] === 'done'" color="success" size="28" class="mb-1"
          >mdi-check-circle</v-icon
        >
        <v-icon v-else-if="estado[tipo] === 'error'" color="error" size="28" class="mb-1"
          >mdi-alert-circle</v-icon
        >
        <v-icon v-else size="28" class="mb-1" color="grey">mdi-upload</v-icon>

        <div class="text-caption font-weight-medium">
          {{ DOC_POLICIA_LABELS[tipo] }}
        </div>
        <div class="text-caption text-medium-emphasis">
          {{
            estado[tipo] === 'done'
              ? '✓ Cargado'
              : estado[tipo] === 'uploading'
                ? 'Subiendo...'
                : estado[tipo] === 'error'
                  ? 'Reintentar'
                  : 'Toca para subir'
          }}
        </div>
      </v-card>
    </v-col>
  </v-row>

  <!-- p. ej. impacto en comisión (lo arma el padre) -->
  <slot />

  <v-alert v-if="!completos" type="warning" variant="tonal" density="compact" class="mt-2">
    Debes subir los 3 documentos para poder confirmar el descuento INFORMATIVO_POLICIA.
  </v-alert>
</template>

<script setup lang="ts">
// Los 3 documentos del descuento INFORMATIVO_POLICIA: se suben directo al
// ticket (POST /facturacion/tickets/:id/documentos-policia). `cargados` son
// los que el ticket ya tiene (edición en el Historial): arrancan en "Cargado".
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import { FacturacionService } from '@/services/facturacion_service'

export type DocPoliciaKey = 'carnet' | 'tarjeta_propiedad' | 'cedula'
type EstadoDoc = 'idle' | 'uploading' | 'done' | 'error'

const props = withDefaults(
  defineProps<{
    ticketId: number | null
    cargados?: DocPoliciaKey[]
  }>(),
  { cargados: () => [] },
)
const emit = defineEmits<{
  'update:completos': [completos: boolean]
  /** Mensaje para el snackbar del padre. */
  aviso: [texto: string]
}>()

const TIPOS: readonly DocPoliciaKey[] = ['carnet', 'tarjeta_propiedad', 'cedula']
const DOC_POLICIA_LABELS: Record<DocPoliciaKey, string> = {
  carnet: 'Carnet policial / militar',
  tarjeta_propiedad: 'Tarjeta de propiedad',
  cedula: 'Cédula del propietario',
}

const estadoInicial = (k: DocPoliciaKey): EstadoDoc =>
  props.cargados.includes(k) ? 'done' : 'idle'
const estado = reactive<Record<DocPoliciaKey, EstadoDoc>>({
  carnet: estadoInicial('carnet'),
  tarjeta_propiedad: estadoInicial('tarjeta_propiedad'),
  cedula: estadoInicial('cedula'),
})
const preview = reactive<Record<DocPoliciaKey, string | null>>({
  carnet: null,
  tarjeta_propiedad: null,
  cedula: null,
})
const inputEls = reactive<Record<DocPoliciaKey, HTMLInputElement | null>>({
  carnet: null,
  tarjeta_propiedad: null,
  cedula: null,
})
function setInputRef(tipo: DocPoliciaKey, el: unknown) {
  inputEls[tipo] = el as HTMLInputElement | null
}

const completos = computed(() => TIPOS.every((k) => estado[k] === 'done'))
watch(completos, (v) => emit('update:completos', v), { immediate: true })

function reset() {
  for (const k of TIPOS) {
    estado[k] = estadoInicial(k)
    if (preview[k]) {
      URL.revokeObjectURL(preview[k]!)
      preview[k] = null
    }
  }
}
onBeforeUnmount(() => {
  for (const k of TIPOS) if (preview[k]) URL.revokeObjectURL(preview[k]!)
})

async function onFile(tipo: DocPoliciaKey, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = ''

  const id = props.ticketId
  if (!id) {
    emit('aviso', '❌ Primero sube la imagen del ticket antes de cargar los documentos')
    return
  }

  // Preview inmediato
  if (preview[tipo]) URL.revokeObjectURL(preview[tipo]!)
  preview[tipo] = URL.createObjectURL(file)
  estado[tipo] = 'uploading'

  try {
    await FacturacionService.subirDocumentoPolicia(id, tipo, file)
    estado[tipo] = 'done'
  } catch (err) {
    console.error(`Error subiendo documento ${tipo}:`, err)
    estado[tipo] = 'error'
    emit('aviso', `❌ Error al subir ${DOC_POLICIA_LABELS[tipo]}`)
  }
}

defineExpose({ reset })
</script>
