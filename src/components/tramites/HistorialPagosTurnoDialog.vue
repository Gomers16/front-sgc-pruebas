<template>
  <v-dialog v-model="dialog" max-width="680" scrollable>
    <v-card class="rounded-xl">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <v-card-title
        class="d-flex align-center justify-space-between pa-4"
        style="background: linear-gradient(135deg, #e8f5e9, #f1f8e9)"
      >
        <div class="d-flex align-center" style="gap: 10px">
          <v-icon color="green-darken-2" size="26">mdi-cash-clock</v-icon>
          <div>
            <div class="text-subtitle-1 font-weight-bold">Historial de Pagos</div>
            <div class="text-caption text-medium-emphasis">Turno #{{ turnoNumero }}</div>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="dialog = false" />
      </v-card-title>

      <v-divider />

      <!-- ── Sin sede ───────────────────────────────────────────────────── -->
      <v-card-text v-if="!sedeId" class="d-flex align-center justify-center py-10">
        <div class="text-center">
          <v-icon color="warning" size="40" class="mb-3">mdi-alert-circle-outline</v-icon>
          <div class="text-body-2 text-medium-emphasis">
            Este trámite no tiene sede asignada.
          </div>
        </div>
      </v-card-text>

      <!-- ── Cargando ───────────────────────────────────────────────────── -->
      <v-card-text v-else-if="cargando" class="d-flex justify-center align-center py-12">
        <div class="text-center">
          <v-progress-circular indeterminate color="green" size="48" />
          <div class="mt-4 text-medium-emphasis">Cargando historial...</div>
        </div>
      </v-card-text>

      <!-- ── Contenido ──────────────────────────────────────────────────── -->
      <v-card-text v-else class="pa-4">

        <div v-if="historial.length === 0" class="text-center text-medium-emphasis py-6">
          No hay trámites con liquidación en este turno.
        </div>

        <v-card
          v-for="tramite in historial"
          :key="tramite.tramiteId"
          variant="outlined"
          class="mb-4 rounded-lg"
        >
          <!-- Encabezado del trámite -->
          <v-card-title class="d-flex align-center justify-space-between pa-3 pb-1">
            <div class="d-flex align-center" style="gap: 8px">
              <span class="text-body-1 font-weight-bold">
                {{ tramite.placa ?? 'Sin placa' }}
              </span>
              <span class="text-caption text-medium-emphasis">
                {{ tramite.tipoTramite ?? '—' }}
              </span>
            </div>
            <v-chip
              :color="estadoColor[tramite.estado]"
              size="small"
              variant="tonal"
            >
              {{ estadoLabel[tramite.estado] }}
            </v-chip>
          </v-card-title>

          <v-card-text class="pa-3 pt-1">
            <!-- Totales -->
            <div class="d-flex flex-wrap mb-2" style="gap: 16px">
              <div class="text-body-2">
                <span class="text-medium-emphasis">Total liquidación: </span>
                <span class="font-weight-bold">
                  $ {{ tramite.totalLiquidacion.toLocaleString('es-CO') }}
                </span>
              </div>
              <div v-if="tramite.saldoPendiente > 0" class="text-body-2">
                <span class="text-medium-emphasis">Saldo pendiente: </span>
                <span class="font-weight-bold text-orange-darken-3">
                  $ {{ tramite.saldoPendiente.toLocaleString('es-CO') }}
                </span>
              </div>
              <div v-else class="text-body-2 text-green-darken-2 font-weight-bold">
                Pagado en su totalidad
              </div>
            </div>

            <!-- Lista de pagos anteriores -->
            <div v-if="tramite.pagos.length > 0">
              <div class="text-caption text-medium-emphasis mb-1">Pagos registrados</div>
              <v-list density="compact" class="pa-0 rounded-lg" style="background: #f9f9f9">
                <v-list-item
                  v-for="pago in tramite.pagos"
                  :key="pago.id"
                  class="px-2"
                >
                  <template #title>
                    <div class="d-flex align-center flex-wrap" style="gap: 8px">
                      <span class="text-body-2 font-weight-bold">
                        $ {{ pago.monto.toLocaleString('es-CO') }}
                      </span>
                      <span class="text-caption text-medium-emphasis">
                        {{ pago.formaPago ?? '—' }}
                      </span>
                      <span v-if="pago.referenciaPago" class="text-caption text-medium-emphasis">
                        · Ref: {{ pago.referenciaPago }}
                      </span>
                      <span v-if="pago.fecha" class="text-caption text-medium-emphasis">
                        · {{ pago.fecha }}
                      </span>
                    </div>
                  </template>
                  <template #append>
                    <v-btn
                      v-if="pago.pdfPath"
                      icon="mdi-file-pdf-box"
                      variant="text"
                      size="small"
                      color="red-darken-2"
                      @click="abrirPdf(pago.id)"
                    />
                    <v-btn
                      v-if="pago.evidenciaUrl"
                      icon="mdi-image-outline"
                      variant="text"
                      size="small"
                      color="blue-darken-2"
                      @click="abrirEvidencia(pago.evidenciaUrl!)"
                    />
                  </template>
                </v-list-item>
              </v-list>
            </div>
            <div v-else class="text-caption text-medium-emphasis mb-2">
              Sin pagos registrados aún.
            </div>

            <!-- Mini-formulario de pago inline -->
            <div class="mt-3">
              <v-btn
                v-if="pagoAbierto !== tramite.tramiteId"
                color="green-darken-2"
                variant="tonal"
                size="small"
                prepend-icon="mdi-plus"
                :disabled="tramite.saldoPendiente <= 0"
                @click="abrirFormPago(tramite.tramiteId)"
              >
                Registrar pago
              </v-btn>

              <v-card v-else variant="outlined" class="mt-2 pa-3 rounded-lg bg-white">
                <div class="text-body-2 font-weight-bold mb-3">Nuevo pago</div>
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="pagoForm.fecha"
                      label="Fecha"
                      type="date"
                      variant="outlined"
                      density="compact"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="text-caption text-medium-emphasis mb-1">
                      Saldo disponible:
                      <strong class="text-orange-darken-3">
                        $ {{ tramite.saldoPendiente.toLocaleString('es-CO') }}
                      </strong>
                    </div>
                    <v-text-field
                      v-model="pagoForm.monto"
                      label="Monto"
                      type="number"
                      variant="outlined"
                      density="compact"
                      min="0"
                      :rules="[v => !v || Number(v) <= tramite.saldoPendiente || 'No puede superar el saldo disponible']"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="pagoForm.formaPago"
                      :items="['Efectivo', 'Transferencia', 'Datáfono']"
                      label="Forma de pago"
                      variant="outlined"
                      density="compact"
                      :rules="[v => !!v || 'La forma de pago es obligatoria']"
                    />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="pagoForm.referenciaPago"
                      label="Referencia (opcional)"
                      variant="outlined"
                      density="compact"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-file-input
                      v-model="pagoForm.evidencia"
                      label="Evidencia (opcional)"
                      variant="outlined"
                      density="compact"
                      accept="image/*,.pdf"
                      prepend-icon=""
                      prepend-inner-icon="mdi-paperclip"
                    />
                  </v-col>
                </v-row>
                <div class="d-flex justify-end" style="gap: 8px">
                  <v-btn
                    variant="text"
                    size="small"
                    :disabled="enviando"
                    @click="pagoAbierto = null"
                  >
                    Cancelar
                  </v-btn>
                  <v-btn
                    color="green-darken-2"
                    variant="elevated"
                    size="small"
                    :loading="enviando"
                    :disabled="!pagoForm.formaPago || !pagoForm.monto || Number(pagoForm.monto) > tramite.saldoPendiente"
                    @click="confirmarPago(tramite.liquidacionId)"
                  >
                    Confirmar pago
                  </v-btn>
                </div>
              </v-card>
            </div>
          </v-card-text>
        </v-card>

      </v-card-text>

      <v-divider />

      <!-- ── Acciones ───────────────────────────────────────────────────── -->
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn color="grey-darken-1" variant="outlined" @click="dialog = false">
          Cerrar
        </v-btn>
      </v-card-actions>

      <!-- ── Snackbar ───────────────────────────────────────────────────── -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="4000"
        location="top right"
      >
        {{ snackbar.message }}
        <template #actions>
          <v-btn color="white" variant="text" @click="snackbar.show = false">Cerrar</v-btn>
        </template>
      </v-snackbar>

    </v-card>
  </v-dialog>

  <!-- Dialog evidencia -->
  <v-dialog v-model="dialogEvidencia" max-width="800">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <span class="text-subtitle-1 font-weight-bold">Evidencia de pago</span>
        <v-btn icon="mdi-close" variant="text" @click="dialogEvidencia = false" />
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <v-img :src="evidenciaActiva ?? ''" max-height="600" contain />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { LiquidacionPagoService } from '@/services/liquidacionPagoService'
import type { TramiteConLiquidacion } from '@/services/liquidacionPagoService'

// ── Props / Emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  modelValue:  boolean
  sedeId:      number
  fecha:       string
  turnoNumero: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// ── Constantes ────────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333').replace(/\/$/, '')

const estadoColor: Record<TramiteConLiquidacion['estado'], string> = {
  pendiente: 'orange',
  parcial:   'yellow-darken-3',
  pagado:    'green',
}

const estadoLabel: Record<TramiteConLiquidacion['estado'], string> = {
  pendiente: 'Pendiente',
  parcial:   'Parcial',
  pagado:    'Pagado',
}

// ── Estado ────────────────────────────────────────────────────────────────────

const dialog      = ref(props.modelValue)
const cargando    = ref(false)
const enviando    = ref(false)
const historial   = ref<TramiteConLiquidacion[]>([])
const pagoAbierto = ref<number | null>(null)
const snackbar    = ref({ show: false, message: '', color: '' })

function makePagoForm() {
  return {
    fecha:          new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }),
    monto:          '',
    formaPago:      null as string | null,
    referenciaPago: '',
    evidencia:      [] as File[],
  }
}

const pagoForm = ref(makePagoForm())

function showSnackbar(message: string, color = 'info') {
  snackbar.value = { show: true, message, color }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function abrirPdf(pagoId: number) {
  try {
    const blob = await LiquidacionPagoService.getPagoPdf(pagoId)
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    window.open(url, '_blank')
    setTimeout(() => window.URL.revokeObjectURL(url), 60000)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al abrir el PDF'
    showSnackbar(msg, 'error')
  }
}

const dialogEvidencia = ref(false)
const evidenciaActiva = ref<string | null>(null)

function abrirEvidencia(url: string) {
  evidenciaActiva.value = url.startsWith('http') ? url : `${BASE_URL}${url}`
  dialogEvidencia.value = true
}

function abrirFormPago(tramiteId: number) {
  pagoAbierto.value = tramiteId
  pagoForm.value = makePagoForm()
}

async function cargarHistorial() {
  if (!props.sedeId) return
  cargando.value = true
  try {
    historial.value = await LiquidacionPagoService.getHistorialTurno(
      props.sedeId,
      props.fecha,
      props.turnoNumero,
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al cargar el historial'
    showSnackbar(msg, 'error')
  } finally {
    cargando.value = false
  }
}

async function confirmarPago(liquidacionId: number) {
  if (!pagoForm.value.formaPago || !pagoForm.value.monto) return
  enviando.value = true
  try {
    const fd = new FormData()
    fd.append('fecha',     pagoForm.value.fecha)
    fd.append('monto',     pagoForm.value.monto)
    fd.append('formaPago', pagoForm.value.formaPago)
    if (pagoForm.value.referenciaPago) fd.append('referenciaPago', pagoForm.value.referenciaPago)
    const archivo = pagoForm.value.evidencia
    if (archivo instanceof File) {
      fd.append('evidencia', archivo)
    } else if (Array.isArray(archivo) && archivo.length > 0) {
      fd.append('evidencia', archivo[0])
    }
    await LiquidacionPagoService.registrarPago(liquidacionId, fd)
    showSnackbar('Pago registrado correctamente', 'success')
    pagoAbierto.value = null
    await cargarHistorial()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al registrar el pago'
    showSnackbar(msg, 'error')
  } finally {
    enviando.value = false
  }
}

// ── Watchers ──────────────────────────────────────────────────────────────────

watch(() => props.modelValue, async (val) => {
  dialog.value = val
  if (!val) return
  historial.value = []
  pagoAbierto.value = null
  await cargarHistorial()
})

watch(dialog, (val) => {
  emit('update:modelValue', val)
})
</script>
