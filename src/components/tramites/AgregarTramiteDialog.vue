<template>
  <v-dialog v-model="dialog" max-width="560" scrollable>
    <v-card class="rounded-xl">

      <!-- Header -->
      <v-card-title
        class="d-flex align-center justify-space-between pa-4"
        style="background: linear-gradient(135deg, #ede7f6, #e8eaf6)"
      >
        <div class="d-flex align-center" style="gap: 10px">
          <v-icon color="deep-purple" size="26">mdi-plus-circle-outline</v-icon>
          <div>
            <div class="text-subtitle-1 font-weight-bold">Agregar trámite</div>
            <div class="text-caption text-medium-emphasis">Turno #{{ turnoNumero }}</div>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="dialog = false" />
      </v-card-title>

      <v-divider />

      <!-- Contenido -->
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.nombreCliente"
              label="Nombre del cliente *"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-account-outline"
              :error-messages="errores.nombreCliente"
              @input="errores.nombreCliente = ''"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.cedula"
              label="Cédula *"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-card-account-details-outline"
              :error-messages="errores.cedula"
              @input="errores.cedula = ''"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.telefono"
              label="Teléfono"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-phone-outline"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.placa"
              label="Placa"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-car-outline"
              hint="Ej: ABC123"
              persistent-hint
            />
          </v-col>
          <v-col cols="12">
            <v-select
              v-model="form.tipoTramite"
              :items="tipoTramiteItems"
              label="Tipo de trámite"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-file-document-outline"
              clearable
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="form.observaciones"
              label="Observaciones"
              variant="outlined"
              density="comfortable"
              rows="3"
              auto-grow
              prepend-inner-icon="mdi-comment-text-outline"
              placeholder="Observaciones del trámite..."
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
        <v-btn
          color="deep-purple"
          variant="elevated"
          :loading="guardando"
          @click="guardar"
        >
          Agregar trámite
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000" location="top right">
    {{ snackbar.message }}
    <template #actions>
      <v-btn color="white" variant="text" @click="snackbar.show = false">Cerrar</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { TramitesService, TIPOS_TRAMITE_ITEMS } from '@/services/tramitesService'
import type { Tramite, TipoTramite } from '@/services/tramitesService'
import { authSetStore } from '@/stores/AuthStore'

const props = defineProps<{
  modelValue: boolean
  turnoNumero: number
  turnoRef: {
    nombreCliente: string
    cedula: string
    servicioId: number
  }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'tramite-agregado': [tramite: Tramite]
}>()

const authStore = authSetStore()
const guardando = ref(false)
const tipoTramiteItems = TIPOS_TRAMITE_ITEMS
const snackbar = ref({ show: false, message: '', color: '' })

const dialog = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

function makeForm() {
  return {
    nombreCliente: props.turnoRef.nombreCliente,
    cedula:        props.turnoRef.cedula,
    telefono:      '',
    placa:         '',
    tipoTramite:   null as TipoTramite | null,
    observaciones: '',
  }
}

const form   = ref(makeForm())
const errores = ref({ nombreCliente: '', cedula: '' })

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value   = makeForm()
      errores.value = { nombreCliente: '', cedula: '' }
    }
  },
)

function validar(): boolean {
  let ok = true
  if (!form.value.nombreCliente.trim()) {
    errores.value.nombreCliente = 'El nombre es obligatorio'
    ok = false
  }
  if (!form.value.cedula.trim()) {
    errores.value.cedula = 'La cédula es obligatoria'
    ok = false
  }
  return ok
}

async function guardar() {
  if (!validar()) return

  const userUnknown: unknown = authStore.user
  const userId = (() => {
    if (typeof userUnknown === 'object' && userUnknown !== null) {
      const maybe = userUnknown as Record<string, unknown>
      return typeof maybe.id === 'number' ? maybe.id : null
    }
    return null
  })()

  if (!userId) {
    snackbar.value = { show: true, message: 'Usuario no autenticado', color: 'error' }
    return
  }

  guardando.value = true
  try {
    const nuevo = await TramitesService.agregarATurno(props.turnoNumero, {
      usuarioId:     userId,
      servicioId:    props.turnoRef.servicioId,
      nombreCliente: form.value.nombreCliente.trim(),
      cedula:        form.value.cedula.trim(),
      telefono:      form.value.telefono.trim() || undefined,
      placa:         form.value.placa.trim() || null,
      tipoTramite:   form.value.tipoTramite ?? undefined,
      observaciones: form.value.observaciones.trim() || undefined,
    })

    emit('tramite-agregado', nuevo)
    dialog.value = false
  } catch (err) {
    console.error('Error al agregar trámite:', err)
    snackbar.value = { show: true, message: 'Error al agregar el trámite', color: 'error' }
  } finally {
    guardando.value = false
  }
}
</script>
