<template>
  <v-dialog v-model="dialog" max-width="560" scrollable>
    <v-card class="rounded-xl">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <v-card-title
        class="d-flex align-center justify-space-between pa-4"
        style="background: linear-gradient(135deg, #e0f2f1, #e8f5e9)"
      >
        <div class="d-flex align-center" style="gap: 10px">
          <v-icon color="teal-darken-1" size="26">mdi-checkbox-multiple-marked-outline</v-icon>
          <div>
            <div class="text-subtitle-1 font-weight-bold">Checklist de Documentos</div>
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
            No se puede cargar el checklist: este trámite no tiene sede asignada.
          </div>
        </div>
      </v-card-text>

      <!-- ── Cargando ───────────────────────────────────────────────────── -->
      <v-card-text v-else-if="cargando" class="d-flex justify-center align-center py-12">
        <div class="text-center">
          <v-progress-circular indeterminate color="teal" size="48" />
          <div class="mt-4 text-medium-emphasis">Cargando checklist...</div>
        </div>
      </v-card-text>

      <!-- ── Contenido ──────────────────────────────────────────────────── -->
      <v-card-text v-else class="pa-4">
        <div class="d-flex align-center mb-3" style="gap: 12px">
          <v-progress-linear
            :model-value="(progreso / 14) * 100"
            color="teal"
            rounded
            height="8"
            class="flex-grow-1"
          />
          <v-chip size="small" :color="progreso === 14 ? 'teal' : 'grey'" variant="tonal">
            {{ progreso }} / 14 documentos
          </v-chip>
        </div>

        <v-row dense>
          <v-col v-for="item in checklistItems" :key="item.key" cols="12" sm="6">
            <v-checkbox
              :model-value="form[item.key] ?? false"
              :label="item.label"
              density="compact"
              hide-details
              color="teal"
              @update:model-value="(v) => { form[item.key] = v as boolean }"
            />
          </v-col>
        </v-row>

        <v-textarea
          v-model="form.observaciones"
          label="Observaciones"
          variant="outlined"
          density="compact"
          rows="3"
          auto-grow
          class="mt-4"
          placeholder="Observaciones del checklist..."
        />
      </v-card-text>

      <v-divider />

      <!-- ── Acciones ───────────────────────────────────────────────────── -->
      <v-card-actions class="pa-4" style="gap: 8px">
        <v-spacer />
        <v-btn color="grey-darken-1" variant="outlined" @click="dialog = false">
          Cerrar
        </v-btn>
        <v-btn
          v-if="sedeId && !cargando"
          color="teal"
          variant="elevated"
          :loading="guardando"
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
import { TramiteChecklistService } from '@/services/tramiteChecklistService'
import type { TramiteChecklist } from '@/services/tramiteChecklistService'
import { HttpError } from '@/services/http'

type ChecklistBoolKey = keyof Omit<TramiteChecklist, 'sedeId' | 'fecha' | 'turnoNumero' | 'observaciones'>
type FormState = Omit<TramiteChecklist, 'sedeId' | 'fecha' | 'turnoNumero'>

const props = defineProps<{
  modelValue: boolean
  sedeId: number
  fecha: string
  turnoNumero: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const checklistItems: { key: ChecklistBoolKey; label: string }[] = [
  { key: 'tarjetaPropiedad',       label: 'Tarjeta de propiedad' },
  { key: 'soat',                   label: 'SOAT' },
  { key: 'fotocopiaCedula',        label: 'Fotocopia cédula' },
  { key: 'runtVendedor',           label: 'RUNT vendedor' },
  { key: 'runtComprador',          label: 'RUNT comprador' },
  { key: 'antecedentesComprador',  label: 'Antecedentes comprador' },
  { key: 'antecedentesVendedor',   label: 'Antecedentes vendedor' },
  { key: 'levantaPrendaOriginal',  label: 'Levantamiento de prenda original' },
  { key: 'inscribePrendaOriginal', label: 'Inscripción de prenda original' },
  { key: 'camaraComercio',         label: 'Cámara de comercio' },
  { key: 'certificadoImpuestos',   label: 'Certificado de impuestos' },
  { key: 'declaracionExtrajuicio', label: 'Declaración extrajuicio' },
  { key: 'pazSalvoEmpresa',        label: 'Paz y salvo empresa' },
  { key: 'cesionDerechoEmpresa',   label: 'Cesión de derecho empresa' },
]

function makeForm(): FormState {
  return {
    tarjetaPropiedad:       null,
    soat:                   null,
    fotocopiaCedula:        null,
    runtVendedor:           null,
    runtComprador:          null,
    antecedentesComprador:  null,
    antecedentesVendedor:   null,
    levantaPrendaOriginal:  null,
    inscribePrendaOriginal: null,
    camaraComercio:         null,
    certificadoImpuestos:   null,
    declaracionExtrajuicio: null,
    pazSalvoEmpresa:        null,
    cesionDerechoEmpresa:   null,
    observaciones:          null,
  }
}

const dialog   = ref(props.modelValue)
const cargando = ref(false)
const guardando = ref(false)
const form     = ref<FormState>(makeForm())
const snackbar = ref({ show: false, message: '', color: '' })

function showSnackbar(message: string, color = 'info') {
  snackbar.value = { show: true, message, color }
}

const progreso = computed(() =>
  checklistItems.filter(item => form.value[item.key] === true).length
)

watch(() => props.modelValue, async (val) => {
  dialog.value = val
  if (!val) return

  form.value = makeForm()
  if (!props.sedeId) return

  cargando.value = true
  try {
    const datos = await TramiteChecklistService.getByTurno(props.sedeId, props.fecha, props.turnoNumero)
    const normalizado = { ...datos } as Record<string, unknown>
    ;(Object.keys(normalizado) as (keyof typeof datos)[]).forEach(k => {
      if (k in makeForm() && k !== 'observaciones') {
        normalizado[k] = datos[k] === null ? null : !!datos[k]
      }
    })
    form.value = { ...makeForm(), ...(normalizado as unknown as typeof datos) }
  } catch (err) {
    if (!(err instanceof HttpError && err.status === 404)) {
      showSnackbar('Error al cargar el checklist', 'error')
    }
  } finally {
    cargando.value = false
  }
})

watch(dialog, (val) => {
  emit('update:modelValue', val)
})

async function guardar() {
  guardando.value = true
  try {
    await TramiteChecklistService.upsert({
      sedeId:      props.sedeId,
      fecha:       props.fecha,
      turnoNumero: props.turnoNumero,
      ...form.value,
    })
    showSnackbar('Checklist guardado correctamente', 'success')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al guardar'
    showSnackbar(msg, 'error')
  } finally {
    guardando.value = false
  }
}
</script>
