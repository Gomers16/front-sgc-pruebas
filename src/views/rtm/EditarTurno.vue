<template>
  <v-container class="mt-4 mt-sm-6">
    <v-card elevation="8" class="pa-0 rounded-xl rounded-sm-2xl card-surface">
      <!-- Header corporativo -->
      <div class="card-header px-4 px-sm-6 py-3 py-sm-5">
        <div class="header-left">
          <div class="icon-pill d-none d-sm-inline-flex">
            <v-icon size="22">mdi-clipboard-text-outline</v-icon>
          </div>
          <div class="title-group">
            <h2 class="title text-h6 text-sm-h5">Editar Turno</h2>
            <p class="subtitle d-none d-sm-block">Actualiza la información del turno seleccionado</p>
          </div>
        </div>

        <div class="d-flex align-center flex-wrap" style="gap:6px">
          <v-chip
            class="turno-chip"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            variant="elevated"
            prepend-icon="mdi-counter"
          >
            <span class="d-none d-sm-inline">Global: </span>{{ form.turnoNumero ?? '—' }}
          </v-chip>
          <v-chip
            class="turno-chip"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            variant="elevated"
            prepend-icon="mdi-counter"
          >
            {{ servicioCodigoActual || 'SERV' }}: {{ form.turnoNumeroServicio ?? '—' }}
          </v-chip>

          <!-- Chip de estado -->
          <v-chip
            :size="$vuetify.display.xs ? 'small' : 'default'"
            variant="elevated"
            :color="estadoColor"
            prepend-icon="mdi-circle-medium"
          >
            <span class="d-none d-sm-inline">Estado: </span>{{ form.estado }}
          </v-chip>
        </div>
      </div>

      <v-divider class="mx-4 mx-sm-6 divider-muted" />

      <div class="pa-4 pa-sm-6 pa-md-8">
        <v-form ref="formRef" @submit.prevent="openConfirmDialog">
          <v-row dense>
            <!-- Servicio -->
            <v-col cols="12">
              <v-select
                v-model="form.servicioId"
                :items="serviciosItems"
                :loading="serviciosLoading"
                label="Servicio"
                variant="outlined"
                required
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                hide-details
                prepend-inner-icon="mdi-wrench-cog"
                class="servicio-fit"
                :rules="[(v: any) => !!v || 'El servicio es requerido']"
              />
            </v-col>

            <!-- Fecha (solo visual) y hora ingreso -->
            <v-col cols="12" sm="6">
              <v-text-field
                :model-value="fechaBonita"
                label="Fecha"
                variant="outlined"
                readonly
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-calendar"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.horaIngreso"
                label="Hora de Ingreso (HH:mm)"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-clock-time-four-outline"
              />
            </v-col>

            <!-- Placa -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.placa"
                label="Placa del Vehículo"
                variant="outlined"
                required
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-car-info"
                @input="onPlacaInput"
                :rules="[(v: any) => !!v || 'La placa es requerida']"
              />
            </v-col>

            <!-- Tipo de Vehículo -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.tipoVehiculo"
                :items="tipoVehiculoItems"
                label="Tipo de Vehículo"
                variant="outlined"
                required
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-car-multiple"
                :rules="[(v: any) => !!v || 'El tipo de vehículo es requerido']"
              />
            </v-col>

            <!-- ¿Cómo nos conoció? -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.medioEntero"
                :items="medioEnteroItems"
                label="¿Cómo nos conoció?"
                variant="outlined"
                required
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-account-question"
                :rules="[(v: any) => !!v || 'Este campo es requerido']"
              />
            </v-col>

            <!-- Si es Asesor → detalle asesor (opcional) -->
            <template v-if="form.medioEntero === 'asesor'">
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.asesorNombre"
                  label="Nombre del Asesor"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  prepend-inner-icon="mdi-account-tie"
                />
              </v-col>
            </template>

            <!-- Observaciones -->
            <v-col cols="12">
              <v-textarea
                v-model="form.observaciones"
                label="Observaciones (opcional)"
                :rows="$vuetify.display.xs ? 2 : 3"
                auto-grow
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-comment-text-multiple"
              />
            </v-col>

            <!-- Estado / Hora Salida / Tiempo Servicio -->
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.estado"
                :items="['activo','inactivo','cancelado','finalizado']"
                label="Estado del Turno"
                variant="outlined"
                required
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-check-decagram"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.horaSalida"
                label="Hora de Salida (HH:mm:ss)"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                clearable
                prepend-inner-icon="mdi-clock-end"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.tiempoServicio"
                label="Tiempo de Servicio (ej. 30 min)"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                clearable
                prepend-inner-icon="mdi-timer-outline"
              />
            </v-col>

            <!-- ====== Fila 1: Captación/Dateo + Cliente ====== -->
            <v-col cols="12" md="6" class="d-flex">
              <v-card variant="tonal" class="card-compact d-flex flex-column flex-grow-1">
                <div class="card-header text-caption text-sm-body-2">
                  <v-icon class="mr-2" :size="$vuetify.display.xs ? 18 : 20">mdi-bullhorn</v-icon>
                  <span>Captación / Dateo</span>
                </div>

                <!-- Chips de canal actual y agente -->
                <div class="mb-2 d-flex flex-wrap" style="gap:6px">
                  <v-chip
                    :size="$vuetify.display.xs ? 'x-small' : 'small'"
                    color="teal"
                    variant="elevated"
                    prepend-icon="mdi-bullhorn"
                  >
                    Canal: {{ canalPretty }}
                  </v-chip>
                  <v-chip
                    v-if="agenteChip"
                    :size="$vuetify.display.xs ? 'x-small' : 'small'"
                    color="indigo"
                    variant="elevated"
                    prepend-icon="mdi-account-tie"
                  >
                    {{ agenteChip }}
                  </v-chip>
                </div>

                <!-- Panel tipo dateo con imagen y datos -->
                <div v-if="dateo">
                  <v-card class="pa-2 pa-sm-4 rounded-lg dateo-card" variant="outlined">
                    <div
                      class="d-flex align-center justify-space-between flex-wrap"
                      style="gap:8px"
                    >
                      <div class="d-flex align-center" style="gap:10px">
                        <v-avatar :size="$vuetify.display.xs ? 56 : 72" variant="elevated">
                          <v-img
                            v-if="dateoImagenUrl"
                            :src="dateoImagenUrl"
                            alt="Evidencia placa/telefono"
                          />
                          <v-icon v-else :size="$vuetify.display.xs ? 32 : 40">mdi-image-off-outline</v-icon>
                        </v-avatar>
                        <div>
                          <div class="text-caption text-sm-subtitle-1 font-weight-600">
                            Dateo:
                            <strong>{{ dateoCanalPretty }}</strong>
                            <span v-if="dateoAgenteNombre" class="d-none d-sm-inline"> — {{ dateoAgenteNombre }}</span>
                          </div>
                          <div class="text-caption text-sm-body-2 text-medium-emphasis">
                            Origen: {{ dateoOrigenPretty }}
                          </div>
                          <div class="text-caption text-sm-body-2 text-medium-emphasis">
                            Registrado: {{ dateoFechaHora }}
                          </div>
                          <div
                            class="text-caption text-sm-body-2 text-medium-emphasis"
                            v-if="dateo?.observacion"
                          >
                            {{ dateo?.observacion }}
                          </div>

                          <!-- Convenio del dateo (sin SIN-COD) -->
                          <div class="mt-2" v-if="dateoConvenio">
                            <v-chip
                              color="deep-purple"
                              text-color="white"
                              variant="elevated"
                              :size="$vuetify.display.xs ? 'x-small' : 'small'"
                              prepend-icon="mdi-file-document-multiple-outline"
                            >
                              Convenio: {{ formatConvenioChip(dateoConvenio) }}
                            </v-chip>
                          </div>
                        </div>
                      </div>
                    </div>
                  </v-card>
                </div>
                <div v-else>
                  <div class="text-caption text-sm-body-2 text-medium-emphasis">
                    No hay dateo asociado a este turno.
                  </div>
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="6" class="d-flex">
              <v-card variant="tonal" class="card-compact d-flex flex-column flex-grow-1">
                <div class="card-header text-caption text-sm-body-2">
                  <v-icon class="mr-2" :size="$vuetify.display.xs ? 18 : 20">mdi-account</v-icon>
                  <span>Datos del Cliente</span>
                </div>
                <v-text-field
                  :model-value="cliente?.nombre || '—'"
                  label="Nombre"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  readonly
                  prepend-inner-icon="mdi-account"
                  class="mb-2"
                />
                <v-text-field
                  :model-value="cliente?.telefono || '—'"
                  label="Teléfono"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  readonly
                  prepend-inner-icon="mdi-phone"
                  class="mb-2"
                />
                <v-text-field
                  :model-value="cliente?.email || '—'"
                  label="Email"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  readonly
                  prepend-inner-icon="mdi-email"
                />
              </v-card>
            </v-col>

            <!-- ====== Fila 2: Vehículo + Metadatos ====== -->
            <v-col cols="12" md="6" class="d-flex">
              <v-card variant="tonal" class="card-compact d-flex flex-column flex-grow-1">
                <div class="card-header text-caption text-sm-body-2">
                  <v-icon class="mr-2" :size="$vuetify.display.xs ? 18 : 20">mdi-car-info</v-icon>
                  <span>Datos del Vehículo</span>
                </div>
                <v-text-field
                  :model-value="form.placa"
                  label="Placa"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  readonly
                  prepend-inner-icon="mdi-car"
                  class="mb-2"
                />
                <v-text-field
                  :model-value="vehiculoClase"
                  label="Clase"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  readonly
                  prepend-inner-icon="mdi-shape-outline"
                  class="mb-2"
                />
                <v-text-field
                  :model-value="vehiculo?.marca || '—'"
                  label="Marca"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  readonly
                  prepend-inner-icon="mdi-alpha-m-box"
                  class="mb-2"
                />
                <v-text-field
                  :model-value="vehiculo?.linea || '—'"
                  label="Línea"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  readonly
                  prepend-inner-icon="mdi-timeline-outline"
                  class="mb-2"
                />
                <v-text-field
                  :model-value="vehiculo?.modelo != null ? String(vehiculo?.modelo) : '—'"
                  label="Modelo"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  readonly
                  prepend-inner-icon="mdi-numeric"
                />
              </v-card>
            </v-col>

            <v-col cols="12" md="6" class="d-flex">
              <v-card variant="tonal" class="card-compact d-flex flex-column flex-grow-1">
                <div class="card-header text-caption text-sm-body-2">
                  <v-icon class="mr-2" :size="$vuetify.display.xs ? 18 : 20">mdi-information-outline</v-icon>
                  <span>Metadatos</span>
                </div>
                <v-text-field
                  :model-value="usuarioNombre"
                  label="Usuario"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  readonly
                  prepend-inner-icon="mdi-account-badge"
                  class="mb-2"
                />
                <v-text-field
                  :model-value="sedeNombre"
                  label="Sede"
                  variant="outlined"
                  :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                  readonly
                  prepend-inner-icon="mdi-office-building"
                  class="mb-2"
                />
              </v-card>
            </v-col>

            <!-- Botones -->
            <v-col cols="12" class="text-right mt-2">
              <v-btn
                color="grey-darken-1"
                variant="outlined"
                :block="$vuetify.display.xs"
                class="mr-0 mr-sm-2 mb-2"
                :size="$vuetify.display.xs ? 'default' : 'default'"
                @click="goBack"
              >
                <v-icon left>mdi-arrow-left</v-icon>
                Volver
              </v-btn>

              <v-btn
                color="error"
                variant="outlined"
                :block="$vuetify.display.xs"
                class="mr-0 mr-sm-2 mb-2"
                :loading="isCancelling"
                :disabled="isCancelling || form.estado === 'cancelado'"
                :size="$vuetify.display.xs ? 'default' : 'default'"
                @click="openCancelDialog"
              >
                <v-icon left>mdi-close-circle-outline</v-icon>
                <span v-if="$vuetify.display.xs">Cancelar</span>
                <span v-else>Cancelar turno</span>
              </v-btn>

              <v-btn
                color="primary"
                class="font-weight-bold action-btn"
                :block="$vuetify.display.xs"
                :size="$vuetify.display.xs ? 'default' : 'large'"
                :loading="isSaving"
                :disabled="isSaving"
                @click="openConfirmDialog"
              >
                <v-icon left>mdi-content-save</v-icon>
                <span v-if="$vuetify.display.xs">Guardar</span>
                <span v-else>Guardar cambios</span>
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </div>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn color="white" variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>

    <!-- Confirmación GUARDAR -->
    <v-dialog
      v-model="showConfirmDialog"
      :max-width="$vuetify.display.xs ? '100%' : '500'"
      :fullscreen="$vuetify.display.xs"
    >
      <v-card class="rounded-xl">
        <v-card-title class="headline text-center text-primary font-weight-bold pa-3 pa-sm-4 text-subtitle-1 text-sm-h6">
          Confirmar Guardado
        </v-card-title>
        <v-card-text class="text-center text-caption text-sm-body-1 pa-3 pa-sm-4">
          ¿Deseas guardar los cambios del turno?
        </v-card-text>
        <v-card-actions class="justify-center pa-3 pa-sm-4">
          <v-btn
            color="grey-darken-1"
            variant="outlined"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="showConfirmDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="save"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmación CANCELAR TURNO -->
    <v-dialog
      v-model="showCancelDialog"
      :max-width="$vuetify.display.xs ? '100%' : '500'"
      :fullscreen="$vuetify.display.xs"
    >
      <v-card class="rounded-xl">
        <v-card-title class="headline text-center text-error font-weight-bold pa-3 pa-sm-4 text-subtitle-1 text-sm-h6">
          Cancelar turno
        </v-card-title>
        <v-card-text class="text-caption text-sm-body-1 pa-3 pa-sm-4">
          <p class="text-center mb-3">
            ¿Seguro que quieres cancelar este turno?<br />
            Se marcará como <strong>cancelado</strong>, pero conservará sus números de turno.
          </p>

          <v-alert
            v-if="cancelTieneEvidencia"
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-3 text-left"
          >
            Este turno ya tiene <strong>{{ cancelEvidenciaLabel }}</strong> registrada.
            Cancelarlo puede implicar una devolución u otras consecuencias.
            Confirma el motivo para continuar.
          </v-alert>

          <v-textarea
            v-model="motivoCancelacion"
            label="Motivo de la cancelación"
            :placeholder="`Explica por qué se cancela este turno (mínimo ${MOTIVO_CANCELACION_MIN_LEN} caracteres)`"
            variant="outlined"
            density="compact"
            rows="3"
            auto-grow
            :rules="[
              (v: string) =>
                (!!v && v.trim().length >= MOTIVO_CANCELACION_MIN_LEN) ||
                `Debes indicar el motivo (mínimo ${MOTIVO_CANCELACION_MIN_LEN} caracteres)`,
            ]"
          />
        </v-card-text>
        <v-card-actions class="justify-center pa-3 pa-sm-4">
          <v-btn
            color="grey-darken-1"
            variant="outlined"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="showCancelDialog = false"
          >
            No, volver
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            :disabled="!motivoCancelacionValido"
            @click="cancelTurno"
          >
            Sí, cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Loader -->
    <v-dialog v-model="isLoading" persistent width="300">
      <v-card color="primary" dark>
        <v-card-text class="py-4 text-center text-caption text-sm-body-2">
          Cargando turno...
          <v-progress-linear indeterminate color="white" class="mb-0" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { DateTime } from 'luxon'
import { useRoute, useRouter } from 'vue-router'
import type { VForm } from 'vuetify/components'
import { authSetStore } from '@/stores/AuthStore'
import TurnosDelDiaService from '@/services/turnosdeldiaService'

type TipoVehiculoFrontend =
  | 'Liviano Particular'
  | 'Liviano Taxi'
  | 'Liviano Público'
  | 'Motocicleta'

type MedioEntero = 'redes_sociales' | 'call_center' | 'fachada' | 'asesor'
type AsesorTipo = 'ASESOR_INTERNO' | 'ASESOR_EXTERNO'

interface ServicioDTO { id: number; codigo: string; nombre: string }
interface ServicioItem { title: string; value: number }

interface ClaseVehiculoDTO {
  codigo?: string
  nombre?: string
}

interface VehiculoDTO {
  id?: number
  placa?: string
  marca?: string
  linea?: string
  modelo?: number
  clase?: ClaseVehiculoDTO | null
  clienteId?: number | null
}

interface ClienteDTO {
  id?: number
  nombre?: string
  telefono?: string
  email?: string
}

interface AgenteDTO {
  id?: number
  nombre?: string
  tipo?: string
}

interface ConvenioDTO {
  id?: number
  nombre?: string
  codigo?: string | null
}

interface DateoDTO {
  id?: number
  canal?: string
  agente?: AgenteDTO | null
  placa?: string | null
  telefono?: string | null
  origen?: string | null
  observacion?: string | null
  imagen_url?: string | null
  imagenUrl?: string | null
  created_at?: string
  createdAt?: string
  consumido_turno_id?: number | null
  consumido_at?: string | null
  convenio?: ConvenioDTO | null
}

interface UsuarioDTO {
  id?: number
  nombres?: string
  apellidos?: string
}

interface SedeDTO {
  id?: number
  nombre?: string
}

interface ServicioEnTurno {
  id?: number
  codigoServicio?: string
  nombre?: string
}

interface TurnoRawDTO {
  id?: number
  turnoNumero?: number
  turnoNumeroServicio?: number
  turno_numero_servicio?: number
  fecha?: string
  horaIngreso?: string
  horaSalida?: string | null
  tiempoServicio?: string | null
  placa?: string
  tipoVehiculo?: TipoVehiculoFrontend | null
  medioEntero?: string | null
  observaciones?: string
  estado?: 'activo' | 'inactivo' | 'cancelado' | 'finalizado'
  servicioId?: number | null
  servicioCodigo?: string | null
  canalAtribucion?: string | null
  tieneFacturacion?: boolean | null
  vehiculo?: VehiculoDTO | null
  cliente?: ClienteDTO | null
  captacionDateo?: DateoDTO | null
  agenteCaptacion?: AgenteDTO | null
  usuario?: UsuarioDTO | null
  sede?: SedeDTO | null
  servicio?: ServicioEnTurno | null
}

interface UserObject {
  id?: number
}

const route = useRoute()
const router = useRouter()
const authStore = authSetStore()

/** === Modo sin auth (parche temporal) === */
/** Usuario a enviar siempre a backend (crear, actualizar, cancelar, etc.) */
const usuarioIdForActions = computed<number>(() => {
  const user = authStore.user as UserObject
  return typeof user?.id === 'number' ? user.id : 0
})

/** ===== Form ===== **/
interface EditForm {
  turnoNumero: number | null
  turnoNumeroServicio: number | null
  fecha: string
  horaIngreso: string
  horaSalida: string | null
  tiempoServicio: string | null
  placa: string
  tipoVehiculo: TipoVehiculoFrontend | null
  medioEntero: MedioEntero | null
  observaciones: string
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado'
  servicioId: number | null
  asesorNombre: string | null
  asesorTipo: AsesorTipo | null
  servicioCodigo?: string | null
}

const formRef = ref<VForm | null>(null)
const form = ref<EditForm>({
  turnoNumero: null,
  turnoNumeroServicio: null,
  fecha: '',
  horaIngreso: '',
  horaSalida: null,
  tiempoServicio: null,
  placa: '',
  tipoVehiculo: null,
  medioEntero: null,
  observaciones: '',
  estado: 'activo',
  servicioId: null,
  asesorNombre: null,
  asesorTipo: null,
  servicioCodigo: null,
})

/** Catálogos */
const tipoVehiculoItems: ReadonlyArray<TipoVehiculoFrontend> = [
  'Liviano Particular',
  'Liviano Taxi',
  'Liviano Público',
  'Motocicleta',
] as const

const medioEnteroItems: ReadonlyArray<{ title: string; value: MedioEntero }> = [
  { title: 'Redes Sociales', value: 'redes_sociales' },
  { title: 'Call Center', value: 'call_center' },
  { title: 'Fachada', value: 'fachada' },
  { title: 'Asesor', value: 'asesor' },
] as const

const serviciosItems = ref<ServicioItem[]>([])
const serviciosLoading = ref(false)
const serviciosMapById = ref<Record<number, ServicioDTO>>({})

/** Relacionados leídos del turno */
const vehiculo = ref<VehiculoDTO | null>(null)
const cliente  = ref<ClienteDTO | null>(null)
const dateo    = ref<DateoDTO | null>(null)
const agente   = ref<AgenteDTO | null>(null) // agenteCaptacion del turno o del dateo

/** UI State */
const snackbar = ref({ show: false, message: '', color: '', timeout: 4000 })
const isLoading = ref(true)
const isSaving  = ref(false)
const isCancelling = ref(false)
const showConfirmDialog = ref(false)
const showCancelDialog = ref(false)
const motivoCancelacion = ref('')

const MOTIVO_CANCELACION_MIN_LEN = 5
const motivoCancelacionValido = computed(
  () => motivoCancelacion.value.trim().length >= MOTIVO_CANCELACION_MIN_LEN
)

const showSnackbar = (message: string, color = 'info', timeout = 4000) => {
  snackbar.value = { show: true, message, color, timeout }
}

/** raw turno para metadatos */
const originalRaw = ref<TurnoRawDTO | null>(null)

/** ¿El turno que se va a cancelar ya tiene evidencia (facturación o certificación)? */
const cancelTieneFacturacion = computed(() => !!originalRaw.value?.tieneFacturacion)
const cancelTieneCertificacion = computed(() => !!form.value.horaSalida)
const cancelTieneEvidencia = computed(
  () => cancelTieneFacturacion.value || cancelTieneCertificacion.value
)
const cancelEvidenciaLabel = computed(() => {
  const partes: string[] = []
  if (cancelTieneFacturacion.value) partes.push('facturación')
  if (cancelTieneCertificacion.value) partes.push('certificación')
  return partes.join(' y ')
})

/** Pretty / helpers */
const fechaBonita = computed(() => {
  const dt = form.value.fecha
    ? DateTime.fromISO(form.value.fecha, { zone: 'America/Bogota' })
    : null
  return dt && dt.isValid ? dt.toFormat('dd/MM/yyyy') : ''
})

const servicioCodigoActual = computed(() => {
  const id = form.value.servicioId
  return id ? serviciosMapById.value[id]?.codigo : form.value.servicioCodigo || null
})

const usuarioNombre = computed(() => {
  const u = originalRaw.value?.usuario
  return u ? `${u.nombres} ${u.apellidos}` : '—'
})

const sedeNombre = computed(() => originalRaw.value?.sede?.nombre || '—')

const vehiculoClase = computed(() =>
  vehiculo.value?.clase?.nombre || vehiculo.value?.clase?.codigo || '—'
)

/** Color del estado para chip */
const estadoColor = computed(() => {
  switch (form.value.estado) {
    case 'activo': return 'success'
    case 'inactivo': return 'grey'
    case 'cancelado': return 'error'
    case 'finalizado': return 'primary'
    default: return 'grey'
  }
})

/** Captación / Dateo pretty (canal del turno) */
const canalPretty = computed(() => {
  const c = (originalRaw.value?.canalAtribucion || '').toUpperCase()
  if (c === 'TELE') return 'Telemercadeo'
  if (c === 'ASESOR') return 'Asesor'
  if (c === 'REDES') return 'Redes Sociales'
  if (c === 'FACHADA') return 'Fachada'
  return '—'
})

const agenteChip = computed(() => {
  const a = agente.value
  if (!a) return ''
  const tipo = (a.tipo || '').toUpperCase()
  const tipoPretty =
    tipo === 'ASESOR_INTERNO' ? 'Asesor Interno' :
    tipo === 'ASESOR_EXTERNO' ? 'Asesor Externo' :
    tipo === 'TELEMERCADEO'   ? 'Telemercadeo'   : (a.tipo || '')
  return `${a.nombre} (${tipoPretty})`
})

const dateoOrigenPretty = computed(() => {
  const raw = dateo.value?.origen || ''
  const u = String(raw).toUpperCase()
  const map: Record<string, string> = { IMPORT:'Importado', MANUAL:'Manual', API:'API' }
  return map[u] ?? (raw || '—')
})

/** Dateo avanzado: imagen, convenio, etc. */
const dateoConvenio = computed(() => dateo.value?.convenio ?? null)

const dateoImagenUrl = computed(() =>
  dateo.value?.imagen_url || dateo.value?.imagenUrl || null
)

const dateoCanalPretty = computed(() => {
  const raw = dateo.value?.canal || ''
  const c = String(raw).toUpperCase()
  if (c === 'TELE') return 'Telemercadeo'
  if (c === 'ASESOR') return 'Asesor'
  if (c === 'REDES') return 'Redes Sociales'
  if (c === 'FACHADA') return 'Fachada'
  return raw || '—'
})

const dateoFechaHora = computed(() => {
  const iso = (dateo.value?.createdAt || dateo.value?.created_at) as string | undefined
  if (!iso) return '—'
  const dt = DateTime.fromISO(iso, { zone: 'America/Bogota' })
  return dt.isValid ? dt.toFormat('dd LLL yyyy • hh:mm a') : '—'
})

const dateoAgenteNombre = computed(() => {
  return dateo.value?.agente?.nombre || agente.value?.nombre || ''
})

function formatConvenioChip(c?: ConvenioDTO | null): string {
  if (!c) return ''
  const codeRaw = c.codigo ?? ''
  const code = typeof codeRaw === 'string' ? codeRaw.toUpperCase() : String(codeRaw).toUpperCase()
  const name = c.nombre ?? ''
  return code && code !== 'SIN-COD' ? `${code} — ${name}` : `${name}`
}

/** Input placa */
function onPlacaInput(e: Event) {
  const target = e.target as HTMLInputElement | null
  if (target) form.value.placa = target.value.toUpperCase().replace(/\s|-/g, '')
}

/** Mapas medio<->canal */
function canalToMedio(canal: string | null | undefined): MedioEntero {
  const c = (canal || '').toUpperCase()
  if (c === 'REDES') return 'redes_sociales'
  if (c === 'TELE')  return 'call_center'
  if (c === 'ASESOR')return 'asesor'
  return 'fachada'
}

function medioToCanal(medio: MedioEntero | null): 'FACHADA'|'TELE'|'REDES'|'ASESOR' {
  if (medio === 'redes_sociales') return 'REDES'
  if (medio === 'call_center')    return 'TELE'
  if (medio === 'asesor')         return 'ASESOR'
  return 'FACHADA'
}

/** Catálogo de servicios */
async function loadServicios() {
  serviciosLoading.value = true
  try {
    const data: ServicioDTO[] = await TurnosDelDiaService.getServicios()
    serviciosItems.value = data.map((s) => ({
      title: `${s.codigo} — ${s.nombre}`,
      value: s.id,
    }))
    serviciosMapById.value = Object.fromEntries(data.map((s) => [s.id, s]))
  } catch (e) {
    console.error(e)
    showSnackbar('No se pudieron cargar los servicios', 'error')
  } finally {
    serviciosLoading.value = false
  }
}

/** Cargar turno (incluye relaciones) */
async function fetchTurno() {
  isLoading.value = true
  try {
    const id = Number(route.params.id)
    if (!id) {
      showSnackbar('ID inválido', 'error')
      router.push('/rtm/turnos-dia')
      return
    }

    const data = await TurnosDelDiaService.fetchTurnoById(id) as TurnoRawDTO
    originalRaw.value = data

    vehiculo.value = data?.vehiculo ?? null
    cliente.value  = data?.cliente ?? null
    dateo.value    = data?.captacionDateo ?? null
    agente.value   = data?.agenteCaptacion ?? data?.captacionDateo?.agente ?? null

    form.value.turnoNumero         = data?.turnoNumero ?? null
    form.value.turnoNumeroServicio =
      data?.turnoNumeroServicio ?? data?.turno_numero_servicio ?? null
    form.value.fecha          = data?.fecha ?? ''
    form.value.horaIngreso    = data?.horaIngreso ?? ''
    form.value.horaSalida     = data?.horaSalida ?? null
    form.value.tiempoServicio = data?.tiempoServicio ?? null
    form.value.placa          = data?.placa ?? ''
    form.value.tipoVehiculo   = data?.tipoVehiculo ?? null
    form.value.observaciones  = data?.observaciones ?? ''
    form.value.estado         = data?.estado ?? 'activo'
    form.value.servicioId     = data?.servicio?.id ?? data?.servicioId ?? null
    form.value.servicioCodigo = data?.servicio?.codigoServicio ?? data?.servicioCodigo ?? null

    // medio/canal
    const canal = data?.canalAtribucion ?? null
    form.value.medioEntero = canal
      ? canalToMedio(canal)
      : ((): MedioEntero => {
          const val = String(data?.medioEntero || '').toLowerCase()
          if (['redes_sociales','call_center','fachada','asesor'].includes(val)) {
            return val as MedioEntero
          }
          return 'fachada'
        })()

    if (form.value.medioEntero === 'asesor' && agente.value) {
      form.value.asesorNombre = agente.value.nombre || null
      const t = String(agente.value.tipo || '').toUpperCase()
      form.value.asesorTipo =
        t === 'ASESOR_INTERNO' ? 'ASESOR_INTERNO'
        : t === 'ASESOR_EXTERNO' ? 'ASESOR_EXTERNO'
        : null
    } else {
      form.value.asesorNombre = null
      form.value.asesorTipo   = null
    }
  } catch (e) {
    console.error(e)
    showSnackbar('No fue posible cargar el turno', 'error')
    router.push('/rtm/turnos-dia')
  } finally {
    isLoading.value = false
  }
}

/** Guardar */
function openConfirmDialog() {
  showConfirmDialog.value = true
}

async function save() {
  showConfirmDialog.value = false
  if (!formRef.value) return

  const { valid } = await formRef.value.validate()
  if (!valid) {
    showSnackbar('Completa los campos requeridos', 'warning')
    return
  }

  // Validación adicional
  if (!form.value.tipoVehiculo) {
    showSnackbar('El tipo de vehículo es requerido', 'warning')
    return
  }

  if (!form.value.medioEntero) {
    showSnackbar('El campo "¿Cómo nos conoció?" es requerido', 'warning')
    return
  }

  isSaving.value = true
  try {
    const id = Number(route.params.id)
    if (!id) throw new Error('ID inválido')

    const canal = medioToCanal(form.value.medioEntero)


    const payload = {
      placa: form.value.placa,
      tipoVehiculo: form.value.tipoVehiculo,
      observaciones: form.value.observaciones,
      horaIngreso: form.value.horaIngreso,
      horaSalida: form.value.horaSalida ?? undefined,
      tiempoServicio: form.value.tiempoServicio ?? undefined,
      estado: form.value.estado,
      servicioId: form.value.servicioId ?? undefined,
      canal,
      medioEntero: form.value.medioEntero,
      usuarioId: usuarioIdForActions.value,
      asesorComercial: form.value.medioEntero === 'asesor' ? (form.value.asesorNombre ?? undefined) : undefined,
      asesorTipo: form.value.medioEntero === 'asesor' ? (form.value.asesorTipo ?? undefined) : undefined,
    }

    await TurnosDelDiaService.updateTurno(id, payload)
    showSnackbar('✅ Turno actualizado correctamente', 'success')
  } catch (e) {
    const error = e as Error
    console.error(e)
    showSnackbar(error?.message || 'Error al guardar el turno', 'error')
  } finally {
    isSaving.value = false
  }
}

/** Cancelar turno (usa endpoint cancelar del backend) */
function openCancelDialog() {
  motivoCancelacion.value = ''
  showCancelDialog.value = true
}

async function cancelTurno() {
  if (!motivoCancelacionValido.value) {
    showSnackbar(
      `Debes indicar el motivo de la cancelación (mínimo ${MOTIVO_CANCELACION_MIN_LEN} caracteres).`,
      'warning'
    )
    return
  }

  showCancelDialog.value = false
  const id = Number(route.params.id)
  if (!id) {
    showSnackbar('ID inválido', 'error')
    return
  }

  isCancelling.value = true
  try {
    const usuarioId = usuarioIdForActions.value
    await TurnosDelDiaService.cancelarTurno(id, usuarioId, motivoCancelacion.value.trim())

    form.value.estado = 'cancelado'
    if (originalRaw.value) originalRaw.value.estado = 'cancelado'

    showSnackbar('🚫 Turno cancelado correctamente', 'warning')
  } catch (e) {
    const error = e as Error
    console.error(e)
    showSnackbar(error?.message || 'Error al cancelar el turno', 'error')
  } finally {
    isCancelling.value = false
  }
}

/** Navegación */
function goBack() {
  router.push('/rtm/turnos-dia')
}

onMounted(async () => {
  await loadServicios()
  await fetchTurno()
})
</script>

<style scoped>
/* El select de servicio se ve "corto" aunque esté en una fila completa */
.servicio-fit { display:inline-block; min-width:120px; max-width:260px; }
.servicio-fit :deep(.v-input__control) { width:100%; }

/* —— Card base —— */
.card-surface {
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  border: 1px solid rgba(16,24,40,0.06);
}

/* —— Header —— */
.card-header {
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  background:
    radial-gradient(1200px 200px at 20% -50%, rgba(25,118,210,.08), transparent 60%),
    radial-gradient(900px 180px at 80% -60%, rgba(76,175,80,.10), transparent 60%),
    linear-gradient(180deg, #ffffff, #f7f9fc);
  border-top-left-radius:12px; border-top-right-radius:12px;
}

@media (min-width: 600px) {
  .card-header {
    gap:16px;
    border-top-left-radius:16px; border-top-right-radius:16px;
  }
}

.header-left { display:flex; align-items:center; gap:12px; }
.icon-pill {
  display:inline-flex; align-items:center; justify-content:center;
  height:40px; width:40px; border-radius:10px;
  border:1px solid rgba(16,24,40,0.08); background:#fff;
  box-shadow:0 1px 2px rgba(16,24,40,0.06);
}
.title-group .title { margin:0; font-weight:700; letter-spacing:.2px; line-height:1.2; color:#0f172a; }
.title-group .subtitle { margin:2px 0 0 0; font-size:.925rem; color:#475569; }

.turno-chip :deep(.v-chip__content) { font-weight:600; }
.turno-chip {
  --chip-bg:#0ea5e9; background: linear-gradient(180deg,#0ea5e9,#0284c7);
  color:#fff; box-shadow:0 4px 12px rgba(2,132,199,0.25);
}

@media (min-width: 600px) {
  .turno-chip {
    box-shadow:0 6px 16px rgba(2,132,199,0.25);
  }
}

/* —— Divider —— */
.divider-muted { border-color: rgba(16,24,40,0.08) !important; }

/* —— Inputs —— */
:deep(.v-text-field .v-input__control),
:deep(.v-select .v-input__control) { border-radius:8px; }

@media (min-width: 600px) {
  :deep(.v-text-field .v-input__control),
  :deep(.v-select .v-input__control) { border-radius:10px; }
}

:deep(.v-input__prepend-inner .v-icon) { color:#1976D2; }

/* —— Button principal —— */
.action-btn {
  border-radius:10px !important; text-transform:none; letter-spacing:.2px;
  box-shadow:0 4px 12px rgba(25,118,210,.25) !important;
  border:1px solid rgba(16,24,40,0.06);
}

@media (min-width: 600px) {
  .action-btn {
    border-radius:12px !important;
    box-shadow:0 6px 16px rgba(25,118,210,.25) !important;
  }
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow:0 10px 20px rgba(25,118,210,.28) !important;
}

/* Tarjetas compactas 2×2 */
.card-compact {
  padding: 10px;
  border-radius: 10px;
  border: 1px dashed rgba(16,24,40,0.12);
}

@media (min-width: 600px) {
  .card-compact {
    padding: 12px;
    border-radius: 12px;
  }
}

.card-header {
  display:flex;
  align-items:center;
  font-weight:700;
  margin-bottom:6px;
}

@media (min-width: 600px) {
  .card-header {
    margin-bottom:8px;
  }
}

/* Panel dateo estilo CrearTurno */
.dateo-card {
  border: 1px dashed rgba(16,24,40,0.12);
  background: linear-gradient(180deg, #ffffff 0%, #f9fbfe 100%);
}

/* util */
.radio-row :deep(.v-label) { font-weight: 500; }
</style>
