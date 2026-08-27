<!-- src/views/tickets/TicketExcepcionDateoCreate.vue -->
<template>
  <v-container class="py-6" style="max-width: 720px">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-4 px-4 px-sm-6">
        <div class="text-h5 font-weight-bold">🎫 Nuevo ticket · Excepción de Dateo</div>
      </v-card-title>

      <v-card-text class="px-4 px-sm-6">
        <v-alert type="info" variant="tonal" density="compact" class="mb-4">
          Turno #{{ turnoId ?? '—' }} · Placa {{ placa || '—' }}
        </v-alert>

        <v-autocomplete
          v-if="puedeElegirComercial"
          v-model="comercialId"
          :items="agentes"
          item-title="nombre"
          item-value="id"
          label="A nombre de qué comercial se registra este ticket"
          variant="outlined"
          density="compact"
          class="mb-4"
          :loading="loadingAgentes"
          required
        />

        <v-textarea
          v-model="observacion"
          label="Observación (qué pasó, por qué no se pudo datear a tiempo)"
          variant="outlined"
          density="compact"
          rows="3"
          auto-grow
          required
          class="mb-2"
        />

        <div
          v-for="slot in SLOTS"
          :key="slot.key"
          class="mb-4"
        >
          <div class="text-caption font-weight-600 mb-1">
            {{ slot.label }}<span v-if="slot.required" class="text-error"> *</span>
          </div>

          <div
            v-if="!evidencias[slot.key].url"
            class="dropzone rounded-lg"
            :class="{ 'dropzone--active': dragSlot === slot.key }"
            @dragover.prevent="dragSlot = slot.key"
            @dragleave.prevent="dragSlot = null"
            @drop.prevent="onDrop($event, slot.key)"
            @click="selectFile(slot.key)"
            @focusin="activeSlot = slot.key"
            tabindex="0"
          >
            <div class="text-center py-4">
              <v-icon size="28" class="mb-1">mdi-image-plus</v-icon>
              <div class="text-caption">
                Suelta la captura aquí, pega con Ctrl+V (mientras esta zona esté activa) o haz clic
              </div>
              <div class="text-caption text-medium-emphasis">JPG/PNG/WEBP (máx 8MB)</div>
            </div>
            <input
              :ref="(el) => setFileInputRef(el, slot.key)"
              type="file"
              accept="image/*"
              class="d-none"
              @change="onFileChange($event, slot.key)"
            />
          </div>

          <div v-else class="evidencia-preview">
            <img :src="evidencias[slot.key].url!" alt="Evidencia" />
            <v-btn
              size="x-small"
              variant="flat"
              color="error"
              icon="mdi-close"
              class="evidencia-remove"
              @click="quitarEvidencia(slot.key)"
            />
          </div>

          <v-progress-linear v-if="evidencias[slot.key].uploading" indeterminate color="primary" class="mt-1" />
        </div>

        <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact" class="mb-3">
          {{ errorMsg }}
        </v-alert>

        <div class="d-flex justify-end gap-2 mt-2">
          <v-btn variant="text" :disabled="enviando" @click="router.back()">Cancelar</v-btn>
          <v-btn
            color="primary"
            :loading="enviando"
            :disabled="!puedeEnviar"
            @click="enviar"
          >
            Crear ticket
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore'
import { crearTicketExcepcionDateo } from '@/services/ticketsService'
import { uploadImage } from '@/services/uploadsService'
import { listAgentesCaptacion } from '@/services/conveniosService'
import { HttpError } from '@/services/http'

interface AgenteLight { id: number; nombre: string; tipo?: string }

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const turnoId = computed(() => {
  const v = route.query.turno_id
  const n = Number(Array.isArray(v) ? v[0] : v)
  return Number.isFinite(n) && n > 0 ? n : null
})
const placa = computed(() => String(route.query.placa ?? ''))

const puedeElegirComercial = computed(() => auth.hasAnyRole(['SUPER_ADMIN', 'GERENCIA']))
const comercialId = ref<number | null>(null)
const agentes = ref<AgenteLight[]>([])
const loadingAgentes = ref(false)

const observacion = ref('')
const enviando = ref(false)
const errorMsg = ref<string | null>(null)
const snackbar = ref<{ show: boolean; text: string; color: 'success' | 'error' }>({
  show: false,
  text: '',
  color: 'success',
})

type SlotKey = 'chat' | 'whatsapp' | 'bloqueo' | 'calamidad'
const SLOTS: { key: SlotKey; label: string; required: boolean }[] = [
  { key: 'chat', label: 'Captura del chat con el cliente', required: true },
  { key: 'whatsapp', label: 'Captura del grupo de WhatsApp reportando el caso', required: true },
  { key: 'bloqueo', label: 'Captura del bloqueo / evidencia de la excepción', required: true },
  { key: 'calamidad', label: 'Evidencia de calamidad (opcional)', required: false },
]

interface EvidenciaSlot {
  url: string | null
  uploading: boolean
}
const evidencias = reactive<Record<SlotKey, EvidenciaSlot>>({
  chat: { url: null, uploading: false },
  whatsapp: { url: null, uploading: false },
  bloqueo: { url: null, uploading: false },
  calamidad: { url: null, uploading: false },
})

const dragSlot = ref<SlotKey | null>(null)
const activeSlot = ref<SlotKey | null>(null)
const fileInputs: Partial<Record<SlotKey, HTMLInputElement>> = {}
function setFileInputRef(el: unknown, key: SlotKey) {
  if (el instanceof HTMLInputElement) fileInputs[key] = el
}

function selectFile(key: SlotKey) {
  activeSlot.value = key
  fileInputs[key]?.click()
}

function onFileChange(e: Event, key: SlotKey) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) subirEvidencia(key, file)
  input.value = ''
}

function onDrop(e: DragEvent, key: SlotKey) {
  dragSlot.value = null
  const file = e.dataTransfer?.files?.[0]
  if (file) subirEvidencia(key, file)
}

function onPaste(e: ClipboardEvent) {
  if (!activeSlot.value) return
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        subirEvidencia(activeSlot.value, file)
        e.preventDefault()
        break
      }
    }
  }
}

async function subirEvidencia(key: SlotKey, file: File) {
  evidencias[key].uploading = true
  errorMsg.value = null
  try {
    const data = await uploadImage(file)
    evidencias[key].url = data.url
  } catch (err) {
    console.error('Error subiendo evidencia:', err)
    snackbar.value = { show: true, color: 'error', text: 'No se pudo subir la imagen. Intenta de nuevo.' }
  } finally {
    evidencias[key].uploading = false
  }
}

function quitarEvidencia(key: SlotKey) {
  evidencias[key].url = null
}

const puedeEnviar = computed(() => {
  if (!turnoId.value) return false
  if (!observacion.value.trim()) return false
  if (!evidencias.chat.url || !evidencias.whatsapp.url || !evidencias.bloqueo.url) return false
  if (puedeElegirComercial.value && !comercialId.value) return false
  if (Object.values(evidencias).some((e) => e.uploading)) return false
  return true
})

async function enviar() {
  if (!puedeEnviar.value || !turnoId.value) return
  enviando.value = true
  errorMsg.value = null
  try {
    const { ticket } = await crearTicketExcepcionDateo({
      turno_id: turnoId.value,
      comercial_id: puedeElegirComercial.value ? (comercialId.value ?? undefined) : undefined,
      observacion: observacion.value.trim(),
      evidencia_chat_url: evidencias.chat.url!,
      evidencia_grupo_whatsapp_url: evidencias.whatsapp.url!,
      evidencia_bloqueo_url: evidencias.bloqueo.url!,
      evidencia_calamidad_url: evidencias.calamidad.url,
    })
    router.push({ name: 'TicketDetalle', params: { id: ticket.id } }).catch(() => {})
  } catch (err) {
    const data = err instanceof HttpError ? (err.data as { message?: string } | undefined) : undefined
    errorMsg.value = data?.message || (err instanceof Error ? err.message : 'Error al crear el ticket')
  } finally {
    enviando.value = false
  }
}

onMounted(async () => {
  window.addEventListener('paste', onPaste)
  if (puedeElegirComercial.value) {
    loadingAgentes.value = true
    try {
      // GET /agentes-captacion/light solo filtra por UN tipo a la vez — se
      // pide COMERCIAL y CONVENIO por separado y se combinan, para excluir
      // ASESOR_TELEMERCADEO (no aplica a este flujo de dateos).
      const [comerciales, convenio] = await Promise.all([
        listAgentesCaptacion('ASESOR_COMERCIAL'),
        listAgentesCaptacion('ASESOR_CONVENIO'),
      ])
      agentes.value = [...comerciales, ...convenio].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    } finally {
      loadingAgentes.value = false
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste)
})
</script>

<style scoped>
.dropzone {
  border: 2px dashed rgba(0, 0, 0, 0.24);
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}
.dropzone:hover,
.dropzone--active {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
}
.evidencia-preview {
  position: relative;
  display: inline-block;
  max-width: 100%;
}
.evidencia-preview img {
  max-width: 100%;
  max-height: 220px;
  border-radius: 8px;
  display: block;
}
.evidencia-remove {
  position: absolute;
  top: 4px;
  right: 4px;
}
</style>
