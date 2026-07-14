<template>
  <v-container class="py-4 py-sm-6">
    <v-btn
      variant="text"
      class="mb-3 mb-sm-4"
      prepend-icon="mdi-arrow-left"
      :size="$vuetify.display.xs ? 'small' : 'default'"
      @click="volver"
    >
      Volver
    </v-btn>

    <v-skeleton-loader v-if="loading" type="card, card" />

    <v-row v-else class="g-3 g-sm-4">
      <!-- Ficha -->
      <v-col cols="12" md="6">
        <v-card elevation="4" class="rounded-lg rounded-sm-xl">
          <v-card-title class="d-flex align-center justify-space-between pa-3 pa-sm-4">
            <span class="text-subtitle-2 text-sm-subtitle-1 font-weight-bold">
              Dateo #{{ dateo?.id }}
            </span>
            <v-chip :size="$vuetify.display.xs ? 'x-small' : 'small'" variant="flat">
              {{ getCanalLabel(form.canal) }}
            </v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3 pa-sm-4">
            <v-row class="g-2">
              <v-col cols="12">
                <div class="text-caption text-sm-body-2 mb-2">
                  <strong>Creado:</strong>
                  {{ dateo?.created_at_fmt || fmt(dateo?.created_at) }}
                </div>
              </v-col>

              <!-- Canal -->
              <v-col cols="12">
                <v-select
                  v-model="form.canal"
                  :items="canalItems"
                  label="Canal"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  prepend-inner-icon="mdi-source-branch"
                  :disabled="!editando"
                  :readonly="!editando"
                />
              </v-col>

              <!-- Placa -->
              <v-col cols="12">
                <v-text-field
                  v-model="form.placa"
                  label="Placa *"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  prepend-inner-icon="mdi-card-text"
                  :rules="editando ? [rules.required, rules.placaLength] : []"
                  :counter="editando ? 6 : false"
                  :maxlength="editando ? 6 : undefined"
                  :disabled="!editando"
                  :readonly="!editando"
                  @input="editando ? normalizePlaca($event) : null"
                  :hint="editando ? 'Formato válido: 3 letras + 3 dígitos, o 3 letras + 2 dígitos (+ letra opcional)' : ''"
                  :persistent-hint="editando"
                />
              </v-col>

              <!-- Teléfono -->
              <v-col cols="12">
                <v-text-field
                  v-model="form.telefono"
                  label="Teléfono"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  prepend-inner-icon="mdi-phone"
                  type="tel"
                  :disabled="!editando"
                  :readonly="!editando"
                />
              </v-col>

              <v-col cols="12">
                <div class="text-caption text-sm-body-2">
                  <strong>Agente:</strong> {{ dateo?.agente?.nombre || '—' }}
                  <span v-if="dateo?.agente" class="text-medium-emphasis">
                    ({{ mapTipoCorto(dateo?.agente?.tipo) }})
                  </span>
                </div>
              </v-col>

              <v-col cols="12">
                <div class="text-caption text-sm-body-2">
                  <strong>Convenio:</strong> {{ dateo?.convenio?.nombre || '—' }}
                </div>
              </v-col>
            </v-row>

            <!-- Turno (solo visual) -->
            <v-divider class="my-3" />
            <div class="text-caption text-sm-subtitle-2 mb-2 font-weight-600">Turno vinculado</div>

            <div v-if="dateo?.turnoInfo" class="d-flex align-center flex-wrap" style="gap:6px">
              <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-600">
                {{ (dateo?.turnoInfo?.fecha && formatDateOnly(dateo.turnoInfo.fecha)) || '—' }}
              </v-chip>
              <v-chip size="x-small" color="indigo" variant="tonal" class="font-weight-600">
                Nº Global: {{ dateo?.turnoInfo?.numeroGlobal ?? '—' }}
              </v-chip>
              <v-chip size="x-small" color="deep-purple" variant="tonal" class="font-weight-600">
                Nº Servicio: {{ dateo?.turnoInfo?.numeroServicio ?? '—' }}
              </v-chip>

              <v-chip
                v-if="dateo?.turnoInfo?.servicioCodigo"
                size="x-small"
                variant="tonal"
                class="font-weight-600"
              >
                {{ dateo?.turnoInfo?.servicioCodigo }}
              </v-chip>

              <v-chip
                size="x-small"
                :color="chipColorEstadoTurno(dateo?.turnoInfo?.estado || dateo?.resultado)"
                variant="elevated"
                prepend-icon="mdi-progress-clock"
                class="font-weight-600"
              >
                {{ textoEstadoTurno(dateo?.turnoInfo?.estado || dateo?.resultado) }}
              </v-chip>
            </div>
            <div v-else class="text-caption text-sm-body-2 text-medium-emphasis">
              — Sin turno vinculado —
            </div>
          </v-card-text>

          <!-- Acciones de la ficha -->
          <v-card-actions class="px-3 px-sm-4 pb-3 pb-sm-4 pt-0">
            <v-spacer />

            <!-- Modo lectura: botón Editar -->
            <v-btn
              v-if="!editando"
              color="primary"
              variant="tonal"
              :size="$vuetify.display.xs ? 'small' : 'default'"
              @click="activarEdicion"
              prepend-icon="mdi-pencil"
            >
              Editar
            </v-btn>

            <!-- Modo edición: botones Guardar y Cancelar -->
            <template v-else>
              <v-btn
                color="primary"
                @click="guardar"
                :loading="saving"
                :disabled="!isFormValid"
                :size="$vuetify.display.xs ? 'small' : 'default'"
                prepend-icon="mdi-content-save"
              >
                <span v-if="$vuetify.display.xs">Guardar</span>
                <span v-else>Guardar cambios</span>
              </v-btn>
              <v-btn
                variant="text"
                @click="cancelarEdicion"
                :disabled="saving"
                :size="$vuetify.display.xs ? 'small' : 'default'"
              >
                Cancelar
              </v-btn>
            </template>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Resultado -->
      <v-col cols="12" md="6">
        <v-card elevation="4" class="rounded-lg rounded-sm-xl">
          <v-card-title class="text-subtitle-2 text-sm-subtitle-1 font-weight-bold pa-3 pa-sm-4">
            Resultado
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3 pa-sm-4">
            <v-row class="g-2">
              <v-col cols="12">
                <v-select
                  v-model="form.resultado"
                  :items="resultadoItems"
                  label="Resultado"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  :disabled="!editando"
                  :readonly="!editando"
                />
              </v-col>

              <!-- ── DESCUENTO (COMERCIAL o CONVENIO) ── -->
              <v-col v-if="puedeSeleccionarDescuento" cols="12">
                <v-autocomplete
                  v-model="form.descuento_id"
                  :items="descuentosActivos"
                  item-title="nombre"
                  item-value="id"
                  label="Descuento (opcional)"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  prepend-inner-icon="mdi-tag-text"
                  clearable
                  :loading="descuentosLoading"
                  :disabled="!editando"
                  :readonly="!editando"
                  hint="Selecciona el tipo de descuento que aplica a este dateo."
                  :persistent-hint="editando"
                />
              </v-col>

              <!-- ++ AVANCE: Comprobante (solo si descuento AVANCE + COMERCIAL + editando) ++ -->
              <v-col v-if="debeSubirComprobante && editando" cols="12">
                <v-file-input
                  v-model="comprobanteAvanceFile"
                  label="Comprobante WhatsApp *"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  accept="image/*"
                  prepend-icon="mdi-whatsapp"
                  show-size
                  :multiple="false"
                  @change="handleComprobanteAvanceChange"
                  @click:clear="handleClearComprobanteAvance"
                />
                <small class="text-caption text-medium-emphasis">
                  Obligatorio cuando el comercial solicita el avance en nombre del convenio.
                </small>
                <div v-if="comprobanteAvancePreview" class="mt-2">
                  <v-img :src="comprobanteAvancePreview" max-width="220" max-height="140" class="rounded" cover />
                </div>
              </v-col>

              <!-- ++ AVANCE: Mostrar comprobante existente en modo lectura ++ -->
              <v-col v-if="form.comprobante_avance_url && !editando" cols="12">
                <div class="text-caption font-weight-bold mb-1">Comprobante WhatsApp:</div>
                <v-img
                  :src="form.comprobante_avance_url"
                  max-width="220"
                  max-height="140"
                  class="rounded"
                  cover
                />
                <v-btn
                  size="x-small"
                  variant="text"
                  prepend-icon="mdi-open-in-new"
                  :href="form.comprobante_avance_url"
                  target="_blank"
                  class="mt-1"
                >Ver original</v-btn>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="px-3 px-sm-4 pb-3 pb-sm-4 pt-0">
            <v-spacer />

            <template v-if="editando">
              <v-btn
                color="primary"
                @click="guardar"
                :loading="saving"
                :disabled="!isFormValid"
                :size="$vuetify.display.xs ? 'small' : 'default'"
                prepend-icon="mdi-content-save"
              >
                <span v-if="$vuetify.display.xs">Guardar</span>
                <span v-else>Guardar cambios</span>
              </v-btn>
            </template>

            <v-btn
              color="error"
              variant="tonal"
              @click="openEliminar"
              :size="$vuetify.display.xs ? 'small' : 'default'"
              prepend-icon="mdi-delete"
              :disabled="editando"
            >
              Eliminar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Observación / Evidencia -->
      <v-col cols="12">
        <v-card elevation="4" class="rounded-lg rounded-sm-xl">
          <v-card-title class="text-subtitle-2 text-sm-subtitle-1 font-weight-bold pa-3 pa-sm-4">
            Observación y evidencia
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3 pa-sm-4">
            <v-row class="g-2">
              <v-col cols="12" sm="8">
                <v-textarea
                  v-model="form.observacion"
                  label="Observación"
                  variant="outlined"
                  :rows="$vuetify.display.xs ? 2 : 3"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  :disabled="!editando"
                  :readonly="!editando"
                />
              </v-col>

              <v-col cols="12" sm="4">
                <v-file-input
                  v-model="evidenciaModel"
                  label="Cambiar evidencia (foto)"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  accept="image/*"
                  prepend-icon="mdi-image"
                  :clearable="true"
                  :multiple="false"
                  show-size
                  :rules="[maxSizeRule]"
                  :disabled="uploading || !editando"
                />
                <small class="text-caption text-medium-emphasis">
                  Tamaño máx. {{ MAX_IMAGE_MB }}MB. Formatos: JPG/PNG/WEBP/HEIC…
                </small>

                <!-- PREVISUALIZACIÓN -->
                <v-img
                  v-if="previewUrl || form.imagen_url"
                  :src="previewUrl || form.imagen_url!"
                  class="mt-2 rounded"
                  :height="$vuetify.display.xs ? 120 : 160"
                  cover
                />
                <div v-else class="mt-2 text-medium-emphasis text-caption">
                  No hay evidencia asociada.
                </div>

                <div v-if="editando && form.imagen_url" class="d-flex gap-1 mt-2">
                  <v-btn
                    color="secondary"
                    variant="text"
                    :size="$vuetify.display.xs ? 'x-small' : 'small'"
                    :href="form.imagen_url!"
                    target="_blank"
                    prepend-icon="mdi-open-in-new"
                  >
                    <span class="d-none d-sm-inline">Ver original</span>
                    <span class="d-sm-none">Ver</span>
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions v-if="editando" class="px-3 px-sm-4 pb-3 pb-sm-4 pt-0">
            <v-spacer />
            <v-btn
              color="primary"
              @click="guardar"
              :loading="saving"
              :disabled="!isFormValid"
              :size="$vuetify.display.xs ? 'small' : 'default'"
              prepend-icon="mdi-content-save"
            >
              <span v-if="$vuetify.display.xs">Guardar</span>
              <span v-else>Guardar cambios</span>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Diálogo eliminar -->
    <v-dialog
      v-model="dlgEliminar.visible"
      :max-width="$vuetify.display.xs ? '100%' : '420'"
      :fullscreen="$vuetify.display.xs"
    >
      <v-card>
        <v-card-title class="text-subtitle-1 text-sm-h6 pa-3 pa-sm-4">
          Eliminar dateo
        </v-card-title>
        <v-card-text class="pa-3 pa-sm-4 text-caption text-sm-body-2">
          ¿Estás seguro? Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions class="px-3 px-sm-4 pb-3 pb-sm-4">
          <v-spacer />
          <v-btn
            variant="text"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="dlgEliminar.visible = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            :loading="dlgEliminar.loading"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="doEliminar"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Mensaje -->
    <v-snackbar v-model="snackbar.visible" :timeout="3500" :color="snackbar.color" variant="tonal">
      {{ snackbar.msg }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getDateo,
  updateDateo,
  deleteDateo,
  esDescuentoAvance,
  formatDateTime as fmt,
  type Dateo,
  type ResultadoDateo,
} from '@/services/dateosService'
import { uploadImage, type UploadImageResponse } from '@/services/uploadsService'
import descuentosService from '@/services/descuentosService'
import type { Descuento } from '@/services/descuentosService'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const loading = ref<boolean>(true)
const saving = ref<boolean>(false)
const editando = ref<boolean>(false)
const dateo = ref<Dateo | null>(null)

const backupForm = ref<FormShape | null>(null)

const resultadoItems: { title: string; value: ResultadoDateo }[] = [
  { title: 'Pendiente', value: 'PENDIENTE' },
  { title: 'En proceso', value: 'EN_PROCESO' },
  { title: 'Exitoso', value: 'EXITOSO' },
  { title: 'No exitoso', value: 'NO_EXITOSO' },
]

const canalItems = [
  { title: 'Asesor', value: 'ASESOR' },
  { title: 'Telemercadeo', value: 'TELE' },
  { title: 'Fachada', value: 'FACHADA' },
  { title: 'Redes sociales', value: 'REDES' },
]

/* ===== Descuentos ===== */
const descuentosActivos = ref<Descuento[]>([])
const descuentosLoading = ref(false)

// Muestra el select para COMERCIAL y CONVENIO
const puedeSeleccionarDescuento = computed(() => {
  const tipo = String(dateo.value?.agente?.tipo || '').toUpperCase()
  return tipo.includes('COMERCIAL') || tipo.includes('CONVENIO')
})

// Detecta si el descuento seleccionado es de tipo AVANCE
const esAvanceSeleccionado = computed(() => {
  if (!form.value.descuento_id) return false
  const d = descuentosActivos.value.find(x => x.id === form.value.descuento_id)
  return esDescuentoAvance((d as { codigo?: string })?.codigo)
})

// Debe subir comprobante: avance seleccionado Y es COMERCIAL
const debeSubirComprobante = computed(() => {
  const tipo = String(dateo.value?.agente?.tipo || '').toUpperCase()
  return esAvanceSeleccionado.value && tipo.includes('COMERCIAL')
})

async function loadDescuentos() {
  descuentosLoading.value = true
  try {
    const res = await descuentosService.getActivos()
    const raw = res.data
    descuentosActivos.value = Array.isArray(raw) ? raw : raw ? [raw] : []
  } catch (e) {
    console.error('Error cargando descuentos:', e)
    descuentosActivos.value = []
  } finally {
    descuentosLoading.value = false
  }
}

type FormShape = {
  resultado: ResultadoDateo
  observacion: string
  placa: string
  telefono: string
  canal: 'ASESOR' | 'TELE' | 'FACHADA' | 'REDES'
  descuento_id: number | null
  // ++ AVANCE ++
  es_avance: boolean
  comprobante_avance_url: string | null
  imagen_url: string | null
  imagen_mime?: string | null
  imagen_tamano_bytes?: number | null
  imagen_hash?: string | null
  imagen_origen_id?: string | number | null
}

type UpdateDateoPayload = {
  resultado: ResultadoDateo
  observacion: string | null
  placa: string
  telefono: string | null
  canal: 'ASESOR' | 'TELE' | 'FACHADA' | 'REDES'
  descuento_id?: number | null
  // ++ AVANCE ++
  es_avance?: boolean
  comprobante_avance_url?: string | null
  imagen_url?: string
  imagen_mime?: string | null
  imagen_tamano_bytes?: number | null
  imagen_hash?: string | null
  imagen_origen_id?: string | number | null
}

const form = ref<FormShape>({
  resultado: 'PENDIENTE',
  observacion: '',
  placa: '',
  telefono: '',
  canal: 'ASESOR',
  descuento_id: null,
  // ++ AVANCE ++
  es_avance: false,
  comprobante_avance_url: null,
  imagen_url: null,
})

const snackbar = ref<{ visible: boolean; msg: string; color: 'error' | 'success' | 'info' }>(
  { visible: false, msg: '', color: 'error' }
)

/* ===== Validaciones ===== */
const PLACA_REGEX = /^(?:[A-Z]{3}\d{3}|[A-Z]{3}\d{2}[A-Z]?|\d{3}[A-Z]{3})$/

const rules = {
  required: (v: string | number | null | undefined) => !!v || 'Este campo es requerido',
  placaLength: (v: string | number | null | undefined) => {
    if (!v) return 'La placa es requerida'
    const trimmed = v.toString().trim()
    return PLACA_REGEX.test(trimmed) || 'Formato de placa inválido'
  },
}

const isFormValid = computed(() => {
  return !!form.value.placa && PLACA_REGEX.test(form.value.placa.trim())
})

/* ===== Modo Edición ===== */
function activarEdicion() {
  backupForm.value = JSON.parse(JSON.stringify(form.value))
  editando.value = true
}

function cancelarEdicion() {
  if (backupForm.value) {
    form.value = JSON.parse(JSON.stringify(backupForm.value))
  }
  editando.value = false

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  evidenciaModel.value = null
  evidenciaFile.value = null

  handleClearComprobanteAvance()
}

/* ===== Normalización de placa ===== */
function normalizePlaca(event: Event) {
  const input = event.target as HTMLInputElement
  if (input && input.value) {
    const normalized = input.value.toUpperCase().replace(/[\s-]/g, '').slice(0, 6)
    form.value.placa = normalized
    input.value = normalized
  }
}

/* ===== Evidencia ===== */
const evidenciaModel = ref<File | File[] | null>(null)
const evidenciaFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const uploading = ref<boolean>(false)
const MAX_IMAGE_MB = 8

watch(evidenciaModel, (val) => {
  const f = Array.isArray(val) ? val[0] : val
  evidenciaFile.value = f ?? null

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  if (evidenciaFile.value instanceof File) {
    previewUrl.value = URL.createObjectURL(evidenciaFile.value)
  }
})

// Watcher: sincroniza es_avance con el descuento seleccionado
watch(() => form.value.descuento_id, () => {
  form.value.es_avance = esAvanceSeleccionado.value
  if (!esAvanceSeleccionado.value) {
    handleClearComprobanteAvance()
  }
})

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (comprobanteAvancePreview.value) URL.revokeObjectURL(comprobanteAvancePreview.value)
})

function maxSizeRule(v: File | File[] | null) {
  const f = Array.isArray(v) ? v?.[0] : v
  if (!f) return true
  return f.size <= MAX_IMAGE_MB * 1024 * 1024 || `La imagen no debe superar ${MAX_IMAGE_MB}MB`
}

/* ===== Comprobante AVANCE ===== */
const comprobanteAvanceFile = ref<File | null>(null)
const comprobanteAvancePreview = ref<string | null>(null)
const uploadingComprobante = ref(false)

function handleComprobanteAvanceChange() {
  if (comprobanteAvancePreview.value) URL.revokeObjectURL(comprobanteAvancePreview.value)
  comprobanteAvancePreview.value = null
  const f = Array.isArray(comprobanteAvanceFile.value) ? comprobanteAvanceFile.value[0] : comprobanteAvanceFile.value
  if (f instanceof File) comprobanteAvancePreview.value = URL.createObjectURL(f)
}

function handleClearComprobanteAvance() {
  if (comprobanteAvancePreview.value) URL.revokeObjectURL(comprobanteAvancePreview.value)
  comprobanteAvancePreview.value = null
  comprobanteAvanceFile.value = null
}

async function subirComprobanteAvance(): Promise<boolean> {
  const f = Array.isArray(comprobanteAvanceFile.value) ? comprobanteAvanceFile.value[0] : comprobanteAvanceFile.value
  if (!f) return true
  uploadingComprobante.value = true
  try {
    const data: UploadImageResponse = await uploadImage(f)
    form.value.comprobante_avance_url = data.url ?? null
    return true
  } catch {
    snackbar.value = { visible: true, msg: 'Error al subir el comprobante de avance.', color: 'error' }
    return false
  } finally {
    uploadingComprobante.value = false
  }
}

function mapTipoCorto(t?: string) {
  const u = String(t || '').toUpperCase()
  if (u.includes('CONVENIO')) return 'Convenio'
  if (u.includes('COMERCIAL')) return 'Comercial'
  if (u.includes('TELE')) return 'Tele'
  return ''
}

function getCanalLabel(canal: string): string {
  const item = canalItems.find(c => c.value === canal)
  return item ? item.title : canal
}

/* ===== Turno helpers ===== */
function chipColorEstadoTurno(e?: string) {
  const v = String(e || '').toLowerCase()
  if (v.includes('proceso')) return 'info'
  if (v.includes('final')) return 'success'
  if (v.includes('cancel')) return 'error'
  return 'warning'
}

function textoEstadoTurno(e?: string) {
  const v = String(e || '').toUpperCase()
  if (v === 'EN_PROCESO') return 'En proceso'
  if (v === 'FINALIZADO') return 'Finalizado'
  if (v === 'CANCELADO') return 'Cancelado'
  if (v === 'ACTIVO') return 'Activo'
  return 'Pendiente'
}

function formatDateOnly(iso?: string) {
  if (!iso) return ''
  const p = iso.split('T')[0] || iso
  const [y, m, d] = p.split('-')
  return `${d}/${m}/${y}`
}

/* ===== Carga ===== */
async function load() {
  loading.value = true
  try {
    const d = await getDateo(id)
    dateo.value = d
    form.value.resultado = d.resultado ?? 'PENDIENTE'
    form.value.observacion = d.observacion ?? ''
    form.value.placa = (d.placa ?? '').toUpperCase()
    form.value.telefono = d.telefono ?? ''
    form.value.canal = (d.canal ?? 'ASESOR') as 'ASESOR' | 'TELE' | 'FACHADA' | 'REDES'
    form.value.descuento_id = d.descuento_id ?? null
    // ++ AVANCE ++
    form.value.es_avance = d.es_avance ?? false
    form.value.comprobante_avance_url = d.comprobante_avance_url ?? null
    form.value.imagen_url = d.imagen_url ?? null
    form.value.imagen_mime = d.imagen_mime ?? null
    form.value.imagen_tamano_bytes = d.imagen_tamano_bytes ?? null
    form.value.imagen_hash = d.imagen_hash ?? null
    form.value.imagen_origen_id = d.imagen_origen_id ?? null

    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
    evidenciaModel.value = null
    evidenciaFile.value = null
    handleClearComprobanteAvance()

    editando.value = false
  } catch (e) {
    const error = e as { response?: { data?: { message?: string } } }
    const message = error.response?.data?.message || 'No se pudo cargar el dateo'
    snackbar.value = { visible: true, msg: message, color: 'error' }
  } finally {
    loading.value = false
  }
}

/* ===== Subida de imagen ===== */
async function uploadImagen() {
  if (!evidenciaFile.value) return
  uploading.value = true
  try {
    const data: UploadImageResponse = await uploadImage(evidenciaFile.value)
    form.value.imagen_url = data.url ?? null
    form.value.imagen_mime = data.mime ?? evidenciaFile.value.type ?? null
    form.value.imagen_tamano_bytes = typeof data.size === 'number' ? data.size : evidenciaFile.value.size
    form.value.imagen_hash = data.hash ?? null
    form.value.imagen_origen_id = data.id ?? null
  } finally {
    uploading.value = false
  }
}

/* ===== 🔥 GUARDAR ===== */
async function guardar() {
  if (!isFormValid.value) {
    snackbar.value = { visible: true, msg: 'La placa no tiene un formato válido', color: 'error' }
    return
  }

  // Validar comprobante si aplica
  if (debeSubirComprobante.value && !form.value.comprobante_avance_url) {
    const f = Array.isArray(comprobanteAvanceFile.value) ? comprobanteAvanceFile.value[0] : comprobanteAvanceFile.value
    if (!f) {
      snackbar.value = {
        visible: true,
        msg: 'El comprobante de WhatsApp es obligatorio para solicitar un avance como comercial.',
        color: 'error',
      }
      return
    }
  }

  saving.value = true
  try {
    // PASO 1: Subir imagen si hay pendiente
    if (evidenciaFile.value instanceof File) {
      console.log('📤 Subiendo imagen antes de guardar...')
      await uploadImagen()
      if (!form.value.imagen_url) {
        throw new Error('No se recibió la URL de la imagen después de subirla')
      }
      console.log('✅ Imagen subida:', form.value.imagen_url)
    }

    // PASO 2: Subir comprobante de avance si hay pendiente
    if (debeSubirComprobante.value && comprobanteAvanceFile.value instanceof File) {
      const ok = await subirComprobanteAvance()
      if (!ok) {
        saving.value = false
        return
      }
    }

    // PASO 3: Preparar payload
    const payload: UpdateDateoPayload = {
      resultado: form.value.resultado,
      observacion: form.value.observacion || null,
      placa: form.value.placa.trim().toUpperCase(),
      telefono: form.value.telefono || null,
      canal: form.value.canal,
      descuento_id: form.value.descuento_id ?? null,
      // ++ AVANCE ++
      es_avance: form.value.es_avance,
      comprobante_avance_url: form.value.es_avance ? (form.value.comprobante_avance_url ?? null) : null,
    }

    if (form.value.imagen_url) {
      payload.imagen_url = form.value.imagen_url
      payload.imagen_mime = form.value.imagen_mime ?? null
      payload.imagen_tamano_bytes = form.value.imagen_tamano_bytes ?? null
      payload.imagen_hash = form.value.imagen_hash ?? null
      payload.imagen_origen_id = form.value.imagen_origen_id ?? null
    }

    console.log('🔥 Guardando dateo con payload:', payload)

    const response = await updateDateo(id, payload)

    console.log('✅ Respuesta del servidor:', response)

    snackbar.value = { visible: true, msg: 'Cambios guardados correctamente ✅', color: 'success' }

    if (evidenciaFile.value) {
      evidenciaModel.value = null
      evidenciaFile.value = null
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = null
      }
    }

    await load()

  } catch (e) {
    console.error('❌ Error guardando:', e)
    const error = e as { response?: { data?: { message?: string } } }
    const message = error.response?.data?.message ||
      (e instanceof Error ? e.message : 'No se pudo guardar')
    snackbar.value = { visible: true, msg: message, color: 'error' }
  } finally {
    saving.value = false
  }
}

/* ===== Eliminar ===== */
const dlgEliminar = ref<{ visible: boolean; loading: boolean }>({ visible: false, loading: false })

function openEliminar() {
  dlgEliminar.value.visible = true
}

async function doEliminar() {
  dlgEliminar.value.loading = true
  try {
    await deleteDateo(id)
    router.push({ name: 'ComercialDateos' })
  } catch (e) {
    const error = e as { response?: { data?: { message?: string } } }
    const message = error.response?.data?.message || 'No se pudo eliminar'
    snackbar.value = { visible: true, msg: message, color: 'error' }
  } finally {
    dlgEliminar.value.loading = false
  }
}

function volver() {
  router.push({ name: 'ComercialDateos' })
}

onMounted(() => {
  load()
  loadDescuentos()
})
</script>

<style scoped>
.g-4 { gap: 16px; }
.g-3 { gap: 12px; }
.g-2 { gap: 8px; }
.gap-1 { gap: 4px; }
.font-weight-600 { font-weight: 600; }

@media (min-width: 600px) {
  .g-4 { gap: 16px; }
}
</style>
