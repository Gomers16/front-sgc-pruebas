<template>
  <v-container class="py-4 py-sm-6">
    <v-card elevation="10" class="rounded-xl rounded-sm-2xl">
      <v-card-title class="d-flex justify-space-between align-center flex-wrap py-3 py-sm-5 px-3 px-sm-4">
        <div class="d-flex align-center">
          <v-avatar
            class="mr-2 mr-sm-4"
            :size="$vuetify.display.xs ? 40 : 46"
            color="primary"
          >
            <v-icon :size="$vuetify.display.xs ? 20 : 24">mdi-clipboard-plus</v-icon>
          </v-avatar>
          <div>
            <div class="text-subtitle-1 text-sm-h5 font-weight-bold">
              <span class="d-none d-sm-inline">Nuevo dateo</span>
              <span class="d-sm-none">Nuevo</span>
            </div>
            <div class="text-caption text-sm-body-2 text-medium-emphasis d-none d-sm-block">
              Registrar nueva captación de cliente
            </div>
          </div>
        </div>
        <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          :size="$vuetify.display.xs ? 'small' : 'default'"
          @click="router.back()"
        >
          Volver
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="py-4 py-sm-6 px-3 px-sm-4">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-row>
            <!-- Canal -->
            <v-col cols="12" md="6">
              <v-select
                v-model="form.canal"
                :items="canalesOptions"
                label="Canal de captación"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-source-branch"
                :disabled="canalBloqueado"
              />
            </v-col>

            <!-- Tipo de Asesor -->
            <v-col v-if="showTipoAsesor" cols="12" md="6">
              <v-select
                v-model="form.tipo_asesor"
                :items="['ASESOR_COMERCIAL', 'ASESOR_CONVENIO']"
                label="Tipo de Asesor"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-account-settings"
                :disabled="tipoAsesorBloqueado"
              />
            </v-col>

            <!-- Agente -->
            <v-col v-if="mostrarAgente" cols="12" md="6">
              <v-autocomplete
                v-model="form.agente_id"
                :items="filteredAgentes"
                item-title="nombre"
                item-value="id"
                label="Agente / Asesor"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                :rules="mostrarAgente ? [rules.required] : []"
                prepend-inner-icon="mdi-account"
                :disabled="agenteBloqueado"
                :clearable="!agenteBloqueado"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-avatar :size="32" color="primary" class="mr-3">
                        <v-icon size="20">mdi-account</v-icon>
                      </v-avatar>
                    </template>
                    <template #subtitle>
                      <span class="text-caption">{{ item.raw.tipo }}</span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- Convenio -->
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="form.convenio_id"
                :items="conveniosVisibles"
                item-title="nombre"
                item-value="id"
                label="Convenio (opcional)"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-handshake"
                clearable
                :disabled="isConvenioDisabled || convenioBloqueado"
                :loading="conveniosLoading"
              >
                <template #item="{ props }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-avatar :size="32" color="secondary" class="mr-3">
                        <v-icon size="20">mdi-handshake</v-icon>
                      </v-avatar>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- Placa -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.placa"
                label="Placa del vehículo *"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                :rules="[rules.required, rules.placaLength]"
                prepend-inner-icon="mdi-car"
                :counter="6"
                :maxlength="6"
                hint="Formato válido: 3 letras + 3 dígitos, o 3 letras + 2 dígitos (+ letra opcional)"
                persistent-hint
              />
            </v-col>

            <!-- Alerta RTM — solo si el servicio seleccionado es RTM -->
            <v-col v-if="rtmInfo?.rtm_vigente && servicioSeleccionadoEsRtm" cols="12">
              <v-alert
                :type="rtmBloqueado ? 'error' : 'warning'"
                :icon="rtmBloqueado ? 'mdi-lock' : 'mdi-clock-alert'"
                variant="tonal"
                density="comfortable"
                class="rounded-lg"
              >
                <template v-if="rtmBloqueado">
                  <strong>RTM vigente — No puede datear aún</strong><br />
                  Esta placa tiene RTM vigente hasta el <strong>{{ rtmInfo?.valido_hasta }}</strong>.<br />
                  Podrá datear a partir del <strong>{{ rtmInfo?.puede_datear_desde }}</strong>
                  ({{ diasVentanaPreRtm }} días antes del vencimiento).
                </template>
                <template v-else>
                  <strong>⚠️ RTM próxima a vencer</strong><br />
                  Esta placa tiene RTM vigente hasta el <strong>{{ rtmInfo?.valido_hasta }}</strong>.<br />
                  Estás dentro de la ventana permitida de {{ diasVentanaPreRtm }} días previos al vencimiento.
                </template>
              </v-alert>
            </v-col>
<!-- Servicio a datear -->
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="form.servicio_id"
                :items="servicios"
                item-title="nombre"
                item-value="id"
                label="Servicio a datear"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-wrench"
                :rules="[rules.required]"
                :loading="serviciosLoading"
                hint="RTM preseleccionado. Cambia si es para otro servicio."
                persistent-hint
              />
            </v-col>
            <!-- Teléfono -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.telefono"
                label="Teléfono cliente (opcional)"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-phone"
              />
            </v-col>

            <!-- Descuento -->
            <v-col v-if="puedeSeleccionarDescuento" cols="12" md="6">
              <v-autocomplete
                v-model="form.descuento_id"
                :items="descuentosFiltrados"
                item-title="nombre"
                item-value="id"
                :label="labelDescuento"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-tag-text"
                clearable
                :loading="descuentosLoading"
                :hint="hintDescuento"
                persistent-hint
              />
            </v-col>

            <!-- Comprobante AVANCE -->
            <v-col v-if="debeSubirComprobante" cols="12" md="6">
              <v-file-input
                v-model="comprobanteFile"
                label="Comprobante WhatsApp *"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                accept="image/*"
                prepend-icon="mdi-whatsapp"
                :rules="[rules.comprobanteRequerido]"
                show-size
                :multiple="false"
                @change="handleComprobanteChange"
                @click:clear="handleClearComprobante"
              />
              <small class="text-caption text-medium-emphasis">
                Obligatorio cuando el comercial solicita el avance en nombre del convenio.
              </small>
              <div v-if="comprobantePreview" class="mt-2">
                <v-img
                  :src="comprobantePreview"
                  :max-width="$vuetify.display.xs ? '100%' : '260'"
                  max-height="160"
                  class="rounded"
                />
              </div>
            </v-col>

            <!-- Observación -->
            <v-col cols="12">
              <v-textarea
                v-model="form.observacion"
                label="Observaciones (opcional)"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                :rows="$vuetify.display.xs ? 2 : 3"
                prepend-inner-icon="mdi-note-text"
              />
            </v-col>

            <!-- Imagen -->
            <v-col cols="12">
              <v-file-input
                v-model="imageFile"
                label="Evidencia fotográfica *"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                accept="image/*"
                prepend-icon="mdi-camera"
                :rules="[rules.imagenRequerida, maxSizeRule]"
                show-size
                :multiple="false"
                @change="handleImageChange"
                @click:clear="handleClearImage"
              >
                <template #selection="{ fileNames }">
                  <v-chip :size="$vuetify.display.xs ? 'x-small' : 'small'" label color="primary">
                    {{ fileNames[0] }}
                  </v-chip>
                </template>
              </v-file-input>

              <small class="text-caption text-medium-emphasis">
                Obligatoria. Tamaño máx. {{ MAX_IMAGE_MB }}MB. Formatos: JPG/PNG/WEBP/HEIC…
              </small>

              <div v-if="imagePreview" class="mt-2">
                <v-img
                  :src="imagePreview"
                  :max-width="$vuetify.display.xs ? '100%' : '300'"
                  :max-height="$vuetify.display.xs ? 150 : 200"
                  class="rounded"
                />
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-3 my-sm-4" />

          <div class="d-flex gap-2 flex-wrap">
            <v-btn
              color="primary"
              :loading="loading || uploading || uploadingComprobante"
              :disabled="!canSubmit || loading || uploading || uploadingComprobante"
              :size="$vuetify.display.xs ? 'small' : 'default'"
              :block="$vuetify.display.xs"
              @click="showConfirmDialog = true"
              prepend-icon="mdi-content-save"
            >
              <span v-if="uploadingComprobante">Subiendo comprobante...</span>
              <span v-else-if="uploading">Subiendo imagen...</span>
              <span v-else-if="$vuetify.display.xs">Guardar</span>
              <span v-else>Guardar dateo</span>
            </v-btn>
            <v-btn
              variant="text"
              :size="$vuetify.display.xs ? 'small' : 'default'"
              :block="$vuetify.display.xs"
              :disabled="loading || uploading || uploadingComprobante"
              @click="router.back()"
            >
              Cancelar
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Modal confirmación -->
    <v-dialog
      v-model="showConfirmDialog"
      :max-width="$vuetify.display.xs ? '100%' : '500'"
      :fullscreen="$vuetify.display.xs"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center justify-center py-4 py-sm-6">
          <v-icon color="warning" :size="$vuetify.display.xs ? 48 : 60">mdi-help-circle</v-icon>
        </v-card-title>
        <v-card-text class="text-center px-3 px-sm-4">
          <div class="text-subtitle-1 text-sm-h5 font-weight-bold mb-2">¿Estás seguro?</div>
          <div class="text-caption text-sm-body-1 text-medium-emphasis">
            ¿Deseas crear este dateo con los datos ingresados?
          </div>
          <!-- Advertencia RTM en ventana -->
          <v-alert
            v-if="rtmEnVentana"
            type="warning"
            icon="mdi-clock-alert"
            variant="tonal"
            density="comfortable"
            class="rounded-lg mt-3 text-left"
          >
            <strong>RTM próxima a vencer</strong><br />
            Esta placa tiene RTM vigente hasta el <strong>{{ rtmInfo?.valido_hasta }}</strong>.<br />
            Estás dentro de la ventana de {{ diasVentanaPreRtm }} días antes del vencimiento.
          </v-alert>
        </v-card-text>
        <v-card-actions class="justify-center pb-4 pb-sm-6 gap-2">
          <v-btn
            variant="text"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            :disabled="loading || uploading || uploadingComprobante"
            @click="showConfirmDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            :loading="loading || uploading || uploadingComprobante"
            @click="confirmCreate"
          >
            Sí, crear dateo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal éxito -->
    <v-dialog
      v-model="showSuccessDialog"
      :max-width="$vuetify.display.xs ? '100%' : '500'"
      :fullscreen="$vuetify.display.xs"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center justify-center py-4 py-sm-6">
          <v-icon color="success" :size="$vuetify.display.xs ? 48 : 60">mdi-check-circle</v-icon>
        </v-card-title>
        <v-card-text class="text-center px-3 px-sm-4">
          <div class="text-subtitle-1 text-sm-h5 font-weight-bold mb-2">
            ¡Dateo creado exitosamente!
          </div>
          <div v-if="excepcionAprobada" class="text-caption text-sm-body-1 text-medium-emphasis">
            Este dateo excede el tiempo permitido y ha sido creado exitosamente.<br />
            Aprobado por: <strong>{{ authStore.user?.nombres }} {{ authStore.user?.apellidos }}</strong>
          </div>
          <div v-else class="text-caption text-sm-body-1 text-medium-emphasis">
            El dateo ha sido registrado correctamente en el sistema.
          </div>
        </v-card-text>
        <v-card-actions class="justify-center pb-4 pb-sm-6">
          <v-btn
            color="primary"
            variant="elevated"
            :size="$vuetify.display.xs ? 'default' : 'large'"
            @click="handleConfirmSuccess"
          >
            Aceptar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal excepción RTM_VIGENTE (SUPER_ADMIN / GERENCIA) -->
    <v-dialog
      v-model="showExcepcionRtmDialog"
      :max-width="$vuetify.display.xs ? '100%' : '500'"
      :fullscreen="$vuetify.display.xs"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center justify-center py-4 py-sm-6">
          <v-icon color="warning" :size="$vuetify.display.xs ? 48 : 60">mdi-shield-alert</v-icon>
        </v-card-title>
        <v-card-text class="text-center px-3 px-sm-4">
          <div class="text-subtitle-1 text-sm-h5 font-weight-bold mb-2">
            Este dateo excede los días permitidos
          </div>
          <div class="text-caption text-sm-body-1 text-medium-emphasis">
            Esta placa excede el límite de días permitido por
            <strong>{{ excepcionRtmDias }}</strong> día{{ excepcionRtmDias === 1 ? '' : 's' }}.
            ¿Deseas continuar de todos modos?
          </div>
        </v-card-text>
        <v-card-actions class="justify-center pb-4 pb-sm-6 gap-2">
          <v-btn
            variant="text"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            :disabled="loading"
            @click="showExcepcionRtmDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="warning"
            variant="elevated"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            :loading="loading"
            @click="confirmarExcepcionRtm"
          >
            Continuar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createDateo, esDescuentoAvance, verificarPlacaRtm, type RtmVerificacion } from '@/services/dateosService'
import { HttpError } from '@/services/http'
import { listAgentesCaptacion, listConveniosAsignados } from '@/services/conveniosService'
import { uploadImage, type UploadImageResponse } from '@/services/uploadsService'
import { listConveniosLight } from '@/services/dateosService'
import descuentosService from '@/services/descuentosService'
import type { Descuento } from '@/services/descuentosService'
import serviciosService from '@/services/Servicios_service'
import { useAuthStore } from '@/stores/AuthStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const esPrivilegiado = computed(() => authStore.isSuperAdmin || authStore.isGerencia)

interface AgenteItem {
  id: number
  nombre: string
  tipo: string
}

interface FormRef {
  validate: () => Promise<{ valid: boolean }>
}

interface CreateDateoPayload {
  canal: 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES'
  origen: 'UI'
  agente_id: number | null
  convenio_id: number | null
  placa: string | null
  telefono: string | null
  observacion: string | null
  descuento_id?: number | null
  es_avance?: boolean
  comprobante_avance_url?: string | null
  imagen_url?: string | null
  imagen_mime?: string | null
  imagen_tamano_bytes?: number | null
  imagen_hash?: string | null
  imagen_origen_id?: string | number | null
   servicio_id?: number | null  // 🆕 agregar esta línea
  confirmar_excepcion?: boolean // 🆕 excepción RTM_VIGENTE (SUPER_ADMIN/GERENCIA)
}

/* ===== Contexto desde ficha ===== */
const fromAsesor = ref<number | null>(null)
const canalBloqueado = ref(false)
const tipoAsesorBloqueado = ref(false)
const agenteBloqueado = ref(false)
const convenioBloqueado = ref(false)

/* ===== Estado del formulario ===== */
const formRef = ref<FormRef | null>(null)
const loading = ref(false)
const uploading = ref(false)
const showConfirmDialog = ref(false)
const showSuccessDialog = ref(false)
const snackbar = ref<{ show: boolean; text: string; color: 'success' | 'error' }>({
  show: false,
  text: '',
  color: 'success',
})

/* ===== 🆕 Excepción RTM_VIGENTE (SUPER_ADMIN / GERENCIA) ===== */
const showExcepcionRtmDialog = ref(false)
const excepcionRtmDias = ref<number | null>(null)
const excepcionAprobada = ref(false)

/* ===== RTM verificación ===== */
const rtmInfo = ref<RtmVerificacion | null>(null)
const rtmChecking = ref(false)

const rtmBloqueado = computed(() =>
  !!(rtmInfo.value?.rtm_vigente && !rtmInfo.value?.dentro_de_ventana)
)
const rtmEnVentana = computed(() =>
  !!(rtmInfo.value?.rtm_vigente && rtmInfo.value?.dentro_de_ventana)
)

const form = ref({
  canal: 'ASESOR' as 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES',
  agente_id: null as number | null,
  convenio_id: null as number | null,
  placa: '',
  telefono: '',
  observacion: '',
  tipo_asesor: null as 'ASESOR_COMERCIAL' | 'ASESOR_CONVENIO' | null,
  descuento_id: null as number | null,
  es_avance: false as boolean,
  comprobante_avance_url: null as string | null,
  imagen_url: null as string | null,
  imagen_mime: null as string | null,
  imagen_tamano_bytes: null as number | null,
  imagen_hash: null as string | null,
  imagen_origen_id: null as string | number | null,
  servicio_id: null as number | null, // 🆕
})

// 🆕 Servicios disponibles para datear
const servicios = ref<{ id: number; codigoServicio: string; nombre: string }[]>([])
const serviciosLoading = ref(false)

const servicioSeleccionadoEsRtm = computed(() => {
  if (!form.value.servicio_id) return true
  const s = servicios.value.find((x) => x.id === form.value.servicio_id)
  return !s || s.codigoServicio?.toUpperCase() === 'RTM'
})

async function loadServicios() {
  serviciosLoading.value = true
  try {
    const data = await serviciosService.getActivos() // ajusta según tu servicio
    servicios.value = data
    // Preseleccionar RTM
    const rtm = data.find((s: any) => s.codigoServicio?.toUpperCase() === 'RTM')
    if (rtm) form.value.servicio_id = rtm.id
  } catch (e) {
    console.error('Error cargando servicios:', e)
  } finally {
    serviciosLoading.value = false
  }
}

/* ===== Normalización reactiva ===== */
let rtmCheckTimer: ReturnType<typeof setTimeout> | null = null

watch(() => form.value.placa, (val) => {
  if (!val) return
  const normalizada = val.toUpperCase().replace(/[\s-]/g, '').slice(0, 6)
  if (normalizada !== val) form.value.placa = normalizada

  // Limpiar resultado anterior
  rtmInfo.value = null

  // Verificar RTM cuando la placa tenga un formato válido (con debounce)
  if (rtmCheckTimer) clearTimeout(rtmCheckTimer)
  if (PLACA_REGEX.test(normalizada)) {
    rtmCheckTimer = setTimeout(async () => {
      rtmChecking.value = true
      try {
        rtmInfo.value = await verificarPlacaRtm(normalizada)
      } catch {
        rtmInfo.value = null
      } finally {
        rtmChecking.value = false
      }
    }, 500)
  }
})

watch(() => form.value.telefono, (val) => {
  if (!val) return
  const normalizado = val.replace(/\D/g, '')
  if (normalizado !== val) form.value.telefono = normalizado
})

/* ===== Descuentos ===== */
const descuentosActivos = ref<Descuento[]>([])
const descuentosLoading = ref(false)

const puedeSeleccionarDescuento = computed(() => {
  return (
    form.value.tipo_asesor === 'ASESOR_COMERCIAL' ||
    form.value.tipo_asesor === 'ASESOR_CONVENIO'
  )
})

/**
 * Solo muestra "Informativo" y "Avance" (exactos), luego aplica
 * la lógica de negocio según tipo de asesor y si tiene convenio:
 *
 * - COMERCIAL sin convenio  → solo Informativo
 * - COMERCIAL con convenio  → solo Avance
 * - CONVENIO  (siempre)     → solo Avance
 */
const descuentosFiltrados = computed((): Descuento[] => {
  const tipo = form.value.tipo_asesor
  const tieneConvenio = !!form.value.convenio_id

  // Primero: solo los dos tipos permitidos por nombre exacto
  const soloPermitidos = descuentosActivos.value.filter((d) => {
    const nombre = (d.nombre ?? '').toLowerCase().trim()
    return nombre === 'informativo' || nombre === 'avance'
  })

  if (tipo === 'ASESOR_COMERCIAL' && !tieneConvenio) {
    return soloPermitidos.filter(
      (d) => (d.nombre ?? '').toLowerCase().trim() === 'informativo',
    )
  }

  if (tipo === 'ASESOR_COMERCIAL' && tieneConvenio) {
    return soloPermitidos.filter(
      (d) => (d.nombre ?? '').toLowerCase().trim() === 'avance',
    )
  }

  if (tipo === 'ASESOR_CONVENIO') {
    return soloPermitidos.filter(
      (d) => (d.nombre ?? '').toLowerCase().trim() === 'avance',
    )
  }

  return soloPermitidos
})

const labelDescuento = computed(() => {
  const tipo = form.value.tipo_asesor
  const tieneConvenio = !!form.value.convenio_id
  if (tipo === 'ASESOR_COMERCIAL' && !tieneConvenio) return 'Descuento informativo (opcional)'
  if (tipo === 'ASESOR_COMERCIAL' && tieneConvenio)  return 'Avance (opcional)'
  if (tipo === 'ASESOR_CONVENIO')                    return 'Avance (opcional)'
  return 'Descuento (opcional)'
})

const hintDescuento = computed(() => {
  const tipo = form.value.tipo_asesor
  const tieneConvenio = !!form.value.convenio_id
  if (tipo === 'ASESOR_COMERCIAL' && !tieneConvenio)
    return 'Solo descuentos informativos (dateo sin convenio).'
  if (tipo === 'ASESOR_COMERCIAL' && tieneConvenio)
    return 'Solo avances disponibles para este convenio.'
  if (tipo === 'ASESOR_CONVENIO')
    return 'Solo avances disponibles.'
  return 'Selecciona el tipo de descuento que aplica a este dateo.'
})

const esAvanceSeleccionado = computed(() => {
  if (!form.value.descuento_id) return false
  const d = descuentosActivos.value.find((x) => x.id === form.value.descuento_id)
  return esDescuentoAvance(d?.codigo)
})

const debeSubirComprobante = computed(() => {
  return esAvanceSeleccionado.value && form.value.tipo_asesor === 'ASESOR_COMERCIAL'
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

// Limpia el descuento si al cambiar convenio ya no está en la lista filtrada
watch(() => form.value.convenio_id, () => {
  const idActual = form.value.descuento_id
  if (!idActual) return
  const sigueDisponible = descuentosFiltrados.value.some((d) => d.id === idActual)
  if (!sigueDisponible) {
    form.value.descuento_id = null
    form.value.es_avance = false
    handleClearComprobante()
  }
})

// Sincroniza es_avance con el descuento seleccionado
watch(() => form.value.descuento_id, () => {
  form.value.es_avance = esAvanceSeleccionado.value
  if (!esAvanceSeleccionado.value) {
    handleClearComprobante()
  }
})

/* ===== Opciones de selects ===== */
const canalesOptions = [
  { title: 'Asesor', value: 'ASESOR' },
  { title: 'Telemercadeo', value: 'TELE' },
  { title: 'Fachada', value: 'FACHADA' },
  { title: 'Redes sociales', value: 'REDES' },
]

const agentes = ref<AgenteItem[]>([])
const conveniosAll = ref<{ id: number; nombre: string }[]>([])
const conveniosAsignados = ref<{ id: number; nombre: string }[]>([])
const conveniosLoading = ref(false)

const filteredAgentes = computed((): AgenteItem[] => {
  return agentes.value.filter((agente) =>
    form.value.canal === 'ASESOR' && form.value.tipo_asesor === 'ASESOR_COMERCIAL'
      ? agente.tipo === 'ASESOR_COMERCIAL'
      : form.value.canal === 'ASESOR' && form.value.tipo_asesor === 'ASESOR_CONVENIO'
      ? agente.tipo === 'ASESOR_CONVENIO'
      : true,
  )
})

const conveniosVisibles = computed(() => {
  const tipo = form.value.tipo_asesor
  const agenteId = form.value.agente_id

  if (!tipo) return conveniosAll.value

  if (tipo === 'ASESOR_COMERCIAL' && agenteId) return conveniosAsignados.value

  if (tipo === 'ASESOR_CONVENIO' && form.value.convenio_id) {
    const convenio = conveniosAll.value.find((c) => c.id === form.value.convenio_id)
    return convenio ? [convenio] : []
  }

  return conveniosAll.value
})

const isConvenioDisabled = computed(() => {
  return form.value.tipo_asesor === 'ASESOR_CONVENIO' && form.value.agente_id !== null
})

/* ===== Comprobante AVANCE ===== */
const comprobanteFile = ref<File | null>(null)
const comprobantePreview = ref('')
const uploadingComprobante = ref(false)

function handleComprobanteChange() {
  if (comprobantePreview.value) URL.revokeObjectURL(comprobantePreview.value)
  comprobantePreview.value = ''
  form.value.comprobante_avance_url = null
  const f = Array.isArray(comprobanteFile.value) ? comprobanteFile.value[0] : comprobanteFile.value
  if (f instanceof File) comprobantePreview.value = URL.createObjectURL(f)
}

function handleClearComprobante() {
  if (comprobantePreview.value) URL.revokeObjectURL(comprobantePreview.value)
  comprobantePreview.value = ''
  comprobanteFile.value = null
  form.value.comprobante_avance_url = null
}

async function subirComprobante(): Promise<boolean> {
  const f = Array.isArray(comprobanteFile.value) ? comprobanteFile.value[0] : comprobanteFile.value
  if (!f) return true
  uploadingComprobante.value = true
  try {
    const data: UploadImageResponse = await uploadImage(f)
    form.value.comprobante_avance_url = data.url ?? null
    return true
  } catch {
    snackbar.value = { show: true, color: 'error', text: 'Error al subir el comprobante de avance.' }
    return false
  } finally {
    uploadingComprobante.value = false
  }
}

/* ===== Imagen principal ===== */
const imageFile = ref<File | File[] | null>(null)
const imagePreview = ref('')
const MAX_IMAGE_MB = 8
const diasVentanaPreRtm = 10


function maxSizeRule(v: File | File[] | null) {
  const f = Array.isArray(v) ? v?.[0] : v
  if (!f) return true
  return f.size <= MAX_IMAGE_MB * 1024 * 1024 || `La imagen no debe superar ${MAX_IMAGE_MB}MB`
}

function handleImageChange() {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value)
    imagePreview.value = ''
  }
  form.value.imagen_url = null
  form.value.imagen_mime = null
  form.value.imagen_tamano_bytes = null
  form.value.imagen_hash = null
  form.value.imagen_origen_id = null

  let file: File | null = null
  if (Array.isArray(imageFile.value)) {
    file = imageFile.value[0] || null
  } else if (imageFile.value instanceof File) {
    file = imageFile.value
  }

  if (file instanceof File) {
    imagePreview.value = URL.createObjectURL(file)
  }
}

function handleClearImage() {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  imagePreview.value = ''
  imageFile.value = null
  form.value.imagen_url = null
  form.value.imagen_mime = null
  form.value.imagen_tamano_bytes = null
  form.value.imagen_hash = null
  form.value.imagen_origen_id = null
}

onBeforeUnmount(() => {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  if (comprobantePreview.value) URL.revokeObjectURL(comprobantePreview.value)
})

/* ===== Reglas ===== */
const PLACA_REGEX = /^(?:[A-Z]{3}\d{3}|[A-Z]{3}\d{2}[A-Z]?|\d{3}[A-Z]{3})$/

const rules = {
  required: (v: unknown) => !!v || 'Este campo es requerido',
  placaLength: (v: unknown) => {
    if (!v) return 'La placa es requerida'
    const trimmed = v.toString().trim()
    return PLACA_REGEX.test(trimmed) || 'Formato de placa inválido'
  },
  imagenRequerida: (v: unknown) => {
    const f = Array.isArray(v) ? v[0] : v
    return !!f || 'La evidencia fotográfica es obligatoria'
  },
  comprobanteRequerido: (v: unknown) => {
    if (!debeSubirComprobante.value) return true
    const f = Array.isArray(v) ? v[0] : v
    return !!f || 'El comprobante es obligatorio cuando el comercial solicita el avance'
  },
}

/* ===== Computed generales ===== */
const showTipoAsesor = computed(() => {
  return form.value.canal === 'ASESOR' || form.value.canal === 'TELE'
})

const mostrarAgente = computed(() => {
  return form.value.canal === 'ASESOR' || form.value.canal === 'TELE'
})



const canSubmit = computed(() => {
  return (
    !!form.value.placa?.trim() &&
    PLACA_REGEX.test(form.value.placa.trim()) &&
    !(rtmBloqueado.value && servicioSeleccionadoEsRtm.value && !esPrivilegiado.value) &&
    !rtmChecking.value
  )
})
/* ===== Convenios por asesor ===== */
async function loadConveniosAsignadosByAsesor(asesorId: number) {
  if (!asesorId) {
    conveniosAsignados.value = []
    return
  }
  conveniosLoading.value = true
  try {
    conveniosAsignados.value = await listConveniosAsignados(asesorId)
  } catch (error) {
    console.error('Error cargando convenios asignados:', error)
    conveniosAsignados.value = []
  } finally {
    conveniosLoading.value = false
  }
}

function autoSeleccionarConvenioAsesorConvenio() {
  if (!form.value.agente_id) return
  const asesor = agentes.value.find((a) => a.id === form.value.agente_id)
  if (!asesor) return
  const convenio = conveniosAll.value.find((c) => c.nombre === asesor.nombre)
  if (convenio) form.value.convenio_id = convenio.id
}

/* ===== Watchers principales ===== */
watch(
  () => form.value.tipo_asesor,
  () => {
    if (fromAsesor.value && tipoAsesorBloqueado.value && agenteBloqueado.value) return
    form.value.agente_id = null
    form.value.convenio_id = null
    form.value.descuento_id = null
    form.value.es_avance = false
    handleClearComprobante()
    conveniosAsignados.value = []
  },
)

watch(
  () => form.value.agente_id,
  async (nuevoAgenteId) => {
    form.value.convenio_id = null
    form.value.descuento_id = null
    form.value.es_avance = false
    handleClearComprobante()
    conveniosAsignados.value = []

    if (!nuevoAgenteId) return

    if (form.value.tipo_asesor === 'ASESOR_COMERCIAL') {
      await loadConveniosAsignadosByAsesor(nuevoAgenteId)
      return
    }

    if (form.value.tipo_asesor === 'ASESOR_CONVENIO') {
      autoSeleccionarConvenioAsesorConvenio()
    }
  },
)

/* ===== Subir imagen principal ===== */
async function subirImagen(): Promise<boolean> {
  let file: File | null = null
  if (Array.isArray(imageFile.value)) {
    file = imageFile.value[0] || null
  } else if (imageFile.value instanceof File) {
    file = imageFile.value
  }

  if (!file) return true

  if (!(file instanceof File)) {
    snackbar.value = { show: true, color: 'error', text: 'Error: el archivo seleccionado no es válido.' }
    return false
  }

  uploading.value = true
  try {
    const data: UploadImageResponse = await uploadImage(file)
    form.value.imagen_url = data.url ?? null
    form.value.imagen_mime = data.mime ?? file.type ?? null
    form.value.imagen_tamano_bytes = typeof data.size === 'number' ? data.size : file.size
    form.value.imagen_hash = data.hash ?? null
    form.value.imagen_origen_id = data.id ?? null
    return true
  } catch (error) {
    console.error('Error subiendo imagen:', error)
    snackbar.value = { show: true, color: 'error', text: 'Error al subir la imagen. Intenta de nuevo.' }
    return false
  } finally {
    uploading.value = false
  }
}

/* ===== Submit ===== */
async function confirmCreate() {
  showConfirmDialog.value = false
  await handleSubmit()
}

/** Arma el payload desde form.value (imágenes ya subidas) y crea el dateo. */
async function submitDateo(confirmarExcepcion = false) {
  const payload: CreateDateoPayload = {
    canal: form.value.canal,
    origen: 'UI',
    agente_id: form.value.agente_id,
    convenio_id: form.value.convenio_id,
    placa: form.value.placa ? form.value.placa.toUpperCase().trim() : null,
    telefono: form.value.telefono || null,
    observacion: form.value.observacion || null,
    descuento_id: puedeSeleccionarDescuento.value ? (form.value.descuento_id || null) : null,
    es_avance: form.value.es_avance || false,
    comprobante_avance_url: form.value.es_avance ? (form.value.comprobante_avance_url || null) : null,
    servicio_id: form.value.servicio_id || null, // 🆕
  }

  if (form.value.imagen_url) {
    payload.imagen_url = form.value.imagen_url
    payload.imagen_mime = form.value.imagen_mime ?? null
    payload.imagen_tamano_bytes = form.value.imagen_tamano_bytes ?? null
    payload.imagen_hash = form.value.imagen_hash ?? null
    payload.imagen_origen_id = form.value.imagen_origen_id ?? null
  }

  if (confirmarExcepcion) payload.confirmar_excepcion = true

  return createDateo(payload)
}

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (!valid?.valid) {
    snackbar.value = { show: true, color: 'error', text: 'Completa los campos obligatorios.' }
    return
  }

  if (debeSubirComprobante.value) {
    const f = Array.isArray(comprobanteFile.value) ? comprobanteFile.value[0] : comprobanteFile.value
    if (!f) {
      snackbar.value = {
        show: true,
        color: 'error',
        text: 'El comprobante de WhatsApp es obligatorio para solicitar un avance como comercial.',
      }
      return
    }
  }

  loading.value = true

  try {
    const imagenSubida = await subirImagen()
    if (!imagenSubida) { loading.value = false; return }

    if (debeSubirComprobante.value) {
      const comprobanteSubido = await subirComprobante()
      if (!comprobanteSubido) { loading.value = false; return }
    }

    excepcionAprobada.value = false
    await submitDateo(false)
    showSuccessDialog.value = true
  } catch (error) {
    // http.ts lanza HttpError (fetch-based), no un error estilo axios: el body
    // del backend viene en error.data, NO en error.response.data.
    const data =
      error instanceof HttpError
        ? (error.data as { code?: string; diasExcedidos?: number; message?: string } | undefined)
        : undefined
    const code = data?.code

    if (code === 'RTM_VIGENTE_EXCEPCION_DISPONIBLE' && esPrivilegiado.value) {
      excepcionRtmDias.value = data?.diasExcedidos ?? null
      showExcepcionRtmDialog.value = true
    } else {
      console.error('❌ Error creando dateo:', error)
      const fallback = error instanceof Error ? error.message : 'Error al crear el dateo'
      const msg = data?.message || fallback
      snackbar.value = { show: true, color: 'error', text: msg }
    }
  } finally {
    loading.value = false
  }
}

/** El admin confirmó crear el dateo aunque exceda los días permitidos de RTM. */
async function confirmarExcepcionRtm() {
  showExcepcionRtmDialog.value = false
  loading.value = true
  try {
    await submitDateo(true)
    excepcionAprobada.value = true
    showSuccessDialog.value = true
  } catch (error) {
    console.error('❌ Error creando dateo con excepción RTM:', error)
    const data = error instanceof HttpError ? (error.data as { message?: string } | undefined) : undefined
    const fallback = error instanceof Error ? error.message : 'Error al crear el dateo'
    const msg = data?.message || fallback
    snackbar.value = { show: true, color: 'error', text: msg }
  } finally {
    loading.value = false
  }
}

function handleConfirmSuccess() {
  showSuccessDialog.value = false
  if (fromAsesor.value) {
    router
      .push({ name: 'FichaComercialAsesor', params: { id: String(fromAsesor.value) } })
      .catch((err) => console.error('Error navegando a FichaComercialAsesor:', err))
  } else {
    router
      .push({ name: 'ComercialDateos' })
      .catch(() => router.push('/comercial/dateos'))
  }
}

/* ===== Inicializar desde ficha ===== */
function inicializarDesdeFicha() {
  if (!fromAsesor.value) return
  const asesor = agentes.value.find((a) => a.id === fromAsesor.value)
  if (!asesor) return

  form.value.canal = 'ASESOR'
  canalBloqueado.value = true

  const tipo = asesor.tipo === 'ASESOR_CONVENIO' ? 'ASESOR_CONVENIO' : 'ASESOR_COMERCIAL'
  form.value.tipo_asesor = tipo
  tipoAsesorBloqueado.value = true

  form.value.agente_id = asesor.id
  agenteBloqueado.value = true

  if (tipo === 'ASESOR_COMERCIAL') {
    convenioBloqueado.value = false
    loadConveniosAsignadosByAsesor(asesor.id)
  } else {
    convenioBloqueado.value = true
    autoSeleccionarConvenioAsesorConvenio()
  }
}

/* ===== Cargar catálogos ===== */
async function loadCatalogos() {
  try {
    const agentesData = await listAgentesCaptacion()
    agentes.value = agentesData

    try {
      const conveniosData = await listConveniosLight()
      conveniosAll.value = conveniosData || []
    } catch (error) {
      console.error('Error cargando convenios:', error)
      conveniosAll.value = []
    }

    if (fromAsesor.value) inicializarDesdeFicha()
  } catch (error) {
    console.error('Error cargando catálogos:', error)
  }
}

onMounted(() => {
  const q = route.query.fromFicha as string | undefined
  fromAsesor.value = q ? Number(q) : null
  loadCatalogos()
  loadDescuentos()
  loadServicios() // 🆕
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

@media (max-width: 599px) {
  .gap-2 {
    gap: 6px;
  }
}
</style>
