<template>
  <v-dialog v-model="dialog" max-width="900" scrollable>
    <v-card class="rounded-xl">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <v-card-title
        class="d-flex align-center justify-space-between pa-4"
        style="background: linear-gradient(135deg, #ede7f6, #f3e5f5)"
      >
        <div class="d-flex align-center" style="gap: 10px">
          <v-icon color="deep-purple" size="26">mdi-clipboard-list-outline</v-icon>
          <div>
            <div class="text-subtitle-1 font-weight-bold">Formulario RUNT</div>
            <div class="text-caption text-medium-emphasis">Trámite #{{ tramiteNumero }}</div>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="dialog = false" />
      </v-card-title>

      <v-divider />

      <!-- ── Cargando ───────────────────────────────────────────────────── -->
      <v-card-text v-if="cargando" class="d-flex justify-center align-center py-12">
        <div class="text-center">
          <v-progress-circular indeterminate color="deep-purple" size="48" />
          <div class="mt-4 text-medium-emphasis">Cargando formulario...</div>
        </div>
      </v-card-text>

      <!-- ── Formulario ─────────────────────────────────────────────────── -->
      <v-card-text v-else class="pa-4">
        <v-switch
          v-if="props.tipoTramite === 'TRASPASO'"
          v-model="localIncluyeCompraventa"
          label="¿Incluye compraventa de este vehículo?"
          color="orange"
          density="compact"
          class="mb-2"
        />

        <v-expansion-panels v-model="panelAbierto" multiple variant="accordion">

          <!-- S1 — Datos del Vehículo ───────────────────────────────────── -->
          <v-expansion-panel value="vehiculo" eager>
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon class="mr-2" color="deep-purple" size="20">mdi-car</v-icon>
              Datos del Vehículo
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense class="mt-1">
                <v-col cols="12" sm="3">
                  <v-text-field
                    v-model="form.placa"
                    label="Placa"
                    variant="outlined"
                    density="compact"
                    maxlength="6"
                    @update:model-value="v => form.placa = v ? v.toUpperCase() : null"
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field v-model="form.marca" label="Marca" variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field v-model="form.linea" label="Línea" variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field
                    v-model="form.modelo"
                    label="Modelo (año)"
                    variant="outlined"
                    density="compact"
                    maxlength="4"
                    :rules="[v => !v || /^\d{4}$/.test(v) || 'Debe ser un año de 4 dígitos']"
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field v-model="form.color" label="Color" variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-select
                    v-model="form.claseVehiculo"
                    :items="CLASE_VEHICULO_ITEMS"
                    label="Clase de vehículo"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-select
                    v-model="form.combustible"
                    :items="COMBUSTIBLE_ITEMS"
                    label="Combustible"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-select
                    v-model="form.tipoServicio"
                    :items="TIPO_SERVICIO_ITEMS"
                    label="Tipo de servicio"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.noMotor"  label="No. Motor"  variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.noChasis" label="No. Chasis" variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.noSerie"  label="No. Serie"  variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.noVin"       label="No. VIN"       variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="2">
                  <v-text-field v-model="form.capacidadKg" label="Capacidad Kg"  variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="2">
                  <v-text-field v-model="form.potenciaHp"  label="Potencia HP"   variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="2">
                  <v-text-field v-model="form.cilindrada"  label="Cilindrada"    variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="2">
                  <v-text-field v-model="form.puertas" label="Puertas" variant="outlined" density="compact" type="number" />
                </v-col>
                <v-col cols="12" sm="2" class="d-flex align-center">
                  <v-checkbox v-model="form.blindaje" label="Blindaje" density="compact" hide-details />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- S2 — Datos del Propietario ──────────────────────────────── -->
          <v-expansion-panel value="propietario" eager>
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon class="mr-2" color="blue-darken-2" size="20">mdi-account</v-icon>
              Datos del Propietario
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense class="mt-1">
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.propPrimerApellido"  label="Primer apellido"  variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.propSegundoApellido" label="Segundo apellido" variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.propNombres"         label="Nombres"          variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-select
                    v-model="form.propTipoDocumento"
                    :items="TIPO_DOCUMENTO_ITEMS"
                    label="Tipo documento"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.propNoDocumento" label="No. Documento" variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.propTelefono"    label="Teléfono"      variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.propCorreo" label="Correo electrónico" variant="outlined" density="compact" type="email" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.propDireccion" label="Dirección" variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.propCiudad"    label="Ciudad"    variant="outlined" density="compact" />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- S3 — Datos del Comprador ─────────────────────────────────── -->
          <v-expansion-panel v-if="props.tipoTramite === 'TRASPASO' && localIncluyeCompraventa" value="comprador" eager>
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon class="mr-2" color="orange-darken-2" size="20">mdi-account-arrow-right</v-icon>
              Datos del Comprador
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense class="mt-1">
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.compPrimerApellido"  label="Primer apellido"  variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.compSegundoApellido" label="Segundo apellido" variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.compNombres"         label="Nombres"          variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-select
                    v-model="form.compTipoDocumento"
                    :items="TIPO_DOCUMENTO_ITEMS"
                    label="Tipo documento"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.compNoDocumento" label="No. Documento" variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.compTelefono"    label="Teléfono"      variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.compCorreo" label="Correo electrónico" variant="outlined" density="compact" type="email" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.compDireccion" label="Dirección" variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.compCiudad"    label="Ciudad"    variant="outlined" density="compact" />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- S4 — Datos del Mandatario ───────────────────────────────── -->
          <v-expansion-panel value="mandatario" eager>
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon class="mr-2" color="teal-darken-2" size="20">mdi-account-tie</v-icon>
              Datos del Mandatario
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense class="mt-1">
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.mandatarioNombre"    label="Nombre del mandatario"   variant="outlined" density="compact" />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="form.mandatarioDocumento" label="Documento del mandatario" variant="outlined" density="compact" />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- S5 — Alertas e Importación ──────────────────────────────── -->
          <v-expansion-panel value="alertas" eager>
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon class="mr-2" color="red-darken-2" size="20">mdi-alert-circle-outline</v-icon>
              Alertas e Importación
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense class="mt-1">
                <v-col cols="12" sm="4" class="d-flex align-center">
                  <v-checkbox v-model="form.alertaHurto"               label="Hurto"                   density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="4" class="d-flex align-center">
                  <v-checkbox v-model="form.alertaLimitacionPropiedad" label="Limitación de propiedad" density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="4" class="d-flex align-center">
                  <v-checkbox v-model="form.alertaEmbargo"             label="Embargo"                 density="compact" hide-details />
                </v-col>
                <v-col cols="12" sm="12">
                  <v-text-field
                    v-model="form.alertaOtro"
                    label="Otra alerta (descripción)"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-select
                    v-model="form.tipoImportacion"
                    :items="TIPO_IMPORTACION_ITEMS"
                    label="Tipo importación"
                    variant="outlined"
                    density="compact"
                    clearable
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="form.noDocumentoImportacion"
                    label="No. Documento importación"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="form.fechaImportacion"
                    label="Fecha importación"
                    variant="outlined"
                    density="compact"
                    type="date"
                  />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- S6 — Observaciones ──────────────────────────────────────── -->
          <v-expansion-panel value="observaciones" eager>
            <v-expansion-panel-title class="font-weight-bold">
              <v-icon class="mr-2" color="grey-darken-2" size="20">mdi-comment-text-outline</v-icon>
              Observaciones
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-textarea
                v-model="form.observacionesRunt"
                variant="outlined"
                density="compact"
                rows="3"
                auto-grow
                class="mt-1"
                placeholder="Observaciones del formulario RUNT..."
              />
            </v-expansion-panel-text>
          </v-expansion-panel>

        </v-expansion-panels>
      </v-card-text>

      <v-divider />

      <!-- ── Acciones ───────────────────────────────────────────────────── -->
      <v-card-actions class="pa-4 flex-wrap" style="gap: 8px">
        <v-spacer />
        <v-btn color="grey-darken-1" variant="outlined" @click="dialog = false">
          Cerrar
        </v-btn>
        <v-btn
          color="deep-purple"
          variant="elevated"
          prepend-icon="mdi-file-multiple"
          :loading="empaquetando"
          :disabled="cargando || guardando"
          @click="exportarPaquete"
        >
          Generar documentos del trámite
          <v-tooltip activator="parent" location="top" max-width="260">
            <div>Descarga un solo archivo Excel con:</div>
            <div>- Formulario RUNT</div>
            <div>- Contrato de Mandato</div>
            <div>- Contrato de Compraventa</div>
            <div>- Hoja de Datos</div>
          </v-tooltip>
        </v-btn>
        <v-btn
          color="deep-purple"
          variant="elevated"
          :loading="guardando"
          :disabled="cargando"
          @click="guardar"
        >
          Guardar
        </v-btn>
      </v-card-actions>

      <!-- ── Snackbar local ─────────────────────────────────────────────── -->
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
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'
import {
  FormulariosRuntService,
  CLASE_VEHICULO_ITEMS,
  COMBUSTIBLE_ITEMS,
  TIPO_SERVICIO_ITEMS,
  TIPO_DOCUMENTO_ITEMS,
  TIPO_IMPORTACION_ITEMS,
} from '@/services/formulariosRuntService'
import type { FormularioRunt } from '@/services/formulariosRuntService'
import { TramitesService } from '@/services/tramitesService'
import { HttpError } from '@/services/http'

// ── Props / Emits ─────────────────────────────────────────────────────────────

const props = defineProps<{
  modelValue: boolean
  tramiteId: number
  tramiteNumero: number
  tipoTramite: string | null
  incluyeCompraventa: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'tramite-actualizado': [incluyeCompraventa: boolean]
}>()

// ── Estado ────────────────────────────────────────────────────────────────────

function makeForm(): FormularioRunt {
  return {
    tramiteId:              props.tramiteId,
    placa:                  null, marca:      null, linea:     null, modelo:    null,
    color:                  null, claseVehiculo: null, combustible: null,
    noMotor:                null, noChasis:   null, noSerie:   null, noVin:     null,
    tipoServicio:           null, capacidadKg: null, blindaje: false,
    potenciaHp:             null, cilindrada:  null, puertas:  null,
    propPrimerApellido:     null, propSegundoApellido: null, propNombres:        null,
    propTipoDocumento:      null, propNoDocumento:     null, propDireccion:      null,
    propCiudad:             null, propTelefono:        null, propCorreo:         null,
    compPrimerApellido:     null, compSegundoApellido: null, compNombres:        null,
    compTipoDocumento:      null, compNoDocumento:     null, compDireccion:      null,
    compCiudad:             null, compTelefono:        null, compCorreo:         null,
    mandatarioNombre:       null, mandatarioDocumento: null,
    alertaHurto:            false, alertaLimitacionPropiedad: false, alertaEmbargo: false,
    alertaOtro:             null, tipoImportacion: null, noDocumentoImportacion: null,
    fechaImportacion:       null, observacionesRunt: null,
  }
}

const authStore  = useAuthStore()

const dialog               = ref(props.modelValue)
const cargando             = ref(false)
const guardando            = ref(false)
const empaquetando         = ref(false)
const form                 = ref<FormularioRunt>(makeForm())
const localIncluyeCompraventa = ref(false)
const panelAbierto         = ref<string[]>(['vehiculo', 'propietario'])
const snackbar             = ref({ show: false, message: '', color: '' })

function showSnackbar(message: string, color = 'info') {
  snackbar.value = { show: true, message, color }
}

// ── Watchers ──────────────────────────────────────────────────────────────────

watch(() => props.modelValue, async (val) => {
  dialog.value = val
  if (!val) return

  localIncluyeCompraventa.value = props.incluyeCompraventa
  form.value = makeForm()
  cargando.value = true
  try {
    const datos = await FormulariosRuntService.getByTramite(props.tramiteId)
    form.value = { ...makeForm(), ...datos }
  } catch (err) {
    if (!(err instanceof HttpError && err.status === 404)) {
      showSnackbar('Error al cargar el formulario', 'error')
    }
    // 404 → formulario vacío ya establecido
  } finally {
    cargando.value = false
    const user = authStore.user
    if (user) {
      if (!form.value.mandatarioNombre) {
        form.value.mandatarioNombre = `${user.nombres} ${user.apellidos}`
      }
      if (!form.value.mandatarioDocumento) {
        form.value.mandatarioDocumento = user.numeroDocumento ?? null
      }
    }
  }
})

watch(dialog, (val) => {
  emit('update:modelValue', val)
})

// ── Acciones ──────────────────────────────────────────────────────────────────

async function guardar() {
  guardando.value = true
  try {
    const resultado = await FormulariosRuntService.upsert(props.tramiteId, form.value)
    form.value = { ...makeForm(), ...resultado }

    if (props.tipoTramite === 'TRASPASO') {
      await TramitesService.update(props.tramiteId, {
        incluyeCompraventa: localIncluyeCompraventa.value,
      })
      emit('tramite-actualizado', localIncluyeCompraventa.value)
    }

    showSnackbar('Formulario guardado correctamente', 'success')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al guardar'
    showSnackbar(msg, 'error')
  } finally {
    guardando.value = false
  }
}

async function exportarPaquete() {
  empaquetando.value = true
  try {
    const blob = await FormulariosRuntService.exportPaqueteCompleto(props.tramiteId)
    const placa = form.value.placa
    const filename = placa
      ? `PAQUETE-${placa}-${props.tramiteNumero}.xlsx`
      : `PAQUETE-SIN-PLACA-${props.tramiteNumero}.xlsx`
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al generar el paquete'
    showSnackbar(msg, 'error')
  } finally {
    empaquetando.value = false
  }
}
</script>
