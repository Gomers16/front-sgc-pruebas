<template>
  <v-dialog v-model="dialog" max-width="560" scrollable>
    <v-card class="rounded-xl">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <v-card-title
        class="d-flex align-center justify-space-between pa-4"
        style="background: linear-gradient(135deg, #fff3e0, #fce4ec)"
      >
        <div class="d-flex align-center" style="gap: 10px">
          <v-icon color="orange-darken-2" size="26">mdi-calculator</v-icon>
          <div>
            <div class="text-subtitle-1 font-weight-bold">Liquidación de Trámite</div>
            <div class="text-caption text-medium-emphasis">
              Turno #{{ turnoNumero }}{{ placa ? ` · ${placa}` : '' }}
            </div>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="dialog = false" />
      </v-card-title>

      <v-divider />

      <!-- ── Cargando ───────────────────────────────────────────────────── -->
      <v-card-text v-if="cargando" class="d-flex justify-center align-center py-12">
        <div class="text-center">
          <v-progress-circular indeterminate color="orange" size="48" />
          <div class="mt-4 text-medium-emphasis">Cargando liquidación...</div>
        </div>
      </v-card-text>

      <!-- ── Formulario ─────────────────────────────────────────────────── -->
      <v-card-text v-else class="pa-4">
        <v-row dense>
          <v-col v-for="item in campos" :key="item.key" cols="12" sm="6">
            <v-text-field
              :model-value="form[item.key] ?? undefined"
              :label="item.label"
              type="number"
              variant="outlined"
              density="compact"
              min="0"
              @update:model-value="v => setField(item.key, String(v))"
            />
          </v-col>
        </v-row>

        <!-- Total -->
        <v-card color="orange-lighten-5" variant="flat" class="mt-3 pa-3 rounded-lg">
          <div class="d-flex align-center justify-space-between">
            <span class="text-body-2 font-weight-bold text-orange-darken-3">TOTAL</span>
            <span class="text-h6 font-weight-bold text-orange-darken-3">
              $ {{ total.toLocaleString('es-CO') }}
            </span>
          </div>
        </v-card>
      </v-card-text>

      <v-divider />

      <!-- ── Acciones ───────────────────────────────────────────────────── -->
      <v-card-actions class="pa-4 flex-wrap" style="gap: 8px">
        <v-spacer />
        <v-btn color="grey-darken-1" variant="outlined" @click="dialog = false">
          Cerrar
        </v-btn>
        <v-btn
          color="orange-darken-2"
          variant="tonal"
          prepend-icon="mdi-file-pdf-box"
          :loading="generando"
          :disabled="cargando || guardando"
          @click="generarPdf"
        >
          Generar PDF
        </v-btn>
        <v-btn
          color="orange-darken-2"
          variant="elevated"
          :loading="guardando"
          :disabled="cargando"
          @click="guardar"
        >
          Guardar
        </v-btn>
      </v-card-actions>

      <!-- ── Snackbar ───────────────────────────────────────────────────── -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="3500"
        location="top right"
      >
        {{ snackbar.message }}
        <template #actions>
          <v-btn color="white" variant="text" @click="snackbar.show = false">Cerrar</v-btn>
        </template>
      </v-snackbar>

    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { TramiteLiquidacionService } from '@/services/tramiteLiquidacionService'
import type { TramiteLiquidacion } from '@/services/tramiteLiquidacionService'
import { HttpError } from '@/services/http'

type FormState = Omit<TramiteLiquidacion, 'tramiteId'>
type FormKey   = keyof FormState

// ── Props / Emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  modelValue:  boolean
  tramiteId:   number
  placa:       string | null
  turnoNumero: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// ── Definición de campos ──────────────────────────────────────────────────────

const campos: { key: FormKey; label: string }[] = [
  { key: 'retencion',             label: 'Retención' },
  { key: 'derechosTraspaso',      label: 'Derechos de traspaso' },
  { key: 'pazSalvo',              label: 'Paz y salvo' },
  { key: 'levantamientoPrenda',   label: 'Levantamiento de prenda' },
  { key: 'inscripcionPrenda',     label: 'Inscripción de prenda' },
  { key: 'papeleria',             label: 'Papelería' },
  { key: 'honorarios',            label: 'Honorarios' },
  { key: 'impuestoAnioActual',    label: 'Impuesto año actual' },
  { key: 'impuestoAniosVencidos', label: 'Impuesto años vencidos' },
]

// ── Estado ────────────────────────────────────────────────────────────────────

function makeForm(): FormState {
  return {
    retencion:             null,
    derechosTraspaso:      null,
    pazSalvo:              null,
    levantamientoPrenda:   null,
    inscripcionPrenda:     null,
    papeleria:             null,
    honorarios:            null,
    impuestoAnioActual:    null,
    impuestoAniosVencidos: null,
  }
}

function makeFormZero(): FormState {
  return {
    retencion:             0,
    derechosTraspaso:      0,
    pazSalvo:              0,
    levantamientoPrenda:   0,
    inscripcionPrenda:     0,
    papeleria:             0,
    honorarios:            0,
    impuestoAnioActual:    0,
    impuestoAniosVencidos: 0,
  }
}

const dialog   = ref(props.modelValue)
const cargando  = ref(false)
const guardando = ref(false)
const generando = ref(false)
const form      = ref<FormState>(makeForm())
const snackbar  = ref({ show: false, message: '', color: '' })

function showSnackbar(message: string, color = 'info') {
  snackbar.value = { show: true, message, color }
}

function setField(key: FormKey, v: string) {
  form.value[key] = v !== '' ? Number(v) : null
}

const total = computed(() =>
  campos.reduce((sum, { key }) => sum + Number(form.value[key] ?? 0), 0)
)

// ── Watchers ──────────────────────────────────────────────────────────────────

watch(() => props.modelValue, async (val) => {
  dialog.value = val
  if (!val) return

  form.value = makeForm()
  cargando.value = true
  try {
    const datos = await TramiteLiquidacionService.getByTramite(props.tramiteId)
    form.value = { ...makeForm(), ...datos }
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      form.value = makeFormZero()
    } else {
      showSnackbar('Error al cargar la liquidación', 'error')
    }
  } finally {
    cargando.value = false
  }
})

watch(dialog, (val) => {
  emit('update:modelValue', val)
})

// ── Acciones ──────────────────────────────────────────────────────────────────

async function guardar() {
  guardando.value = true
  try {
    const resultado = await TramiteLiquidacionService.upsert(props.tramiteId, form.value)
    form.value = { ...makeForm(), ...resultado }
    showSnackbar('Liquidación guardada correctamente', 'success')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al guardar'
    showSnackbar(msg, 'error')
  } finally {
    guardando.value = false
  }
}

async function generarPdf() {
  generando.value = true
  try {
    const blob = await TramiteLiquidacionService.exportPdf(props.tramiteId)
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    window.open(url, '_blank')
    setTimeout(() => window.URL.revokeObjectURL(url), 60000)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al generar PDF'
    showSnackbar(msg, 'error')
  } finally {
    generando.value = false
  }
}
</script>
