<!--
Diálogo "Registrar gestión" (asesor ASESOR_TELEMERCADEO). Lo usan "Mi
gestión" y la cola. Al salir del campo placa consulta /seguimiento
(cliente, teléfono, "seguimiento n de max", gestiones del ciclo y avisos).

Idempotencia: la idempotency_key se genera al abrir el formulario y se
reutiliza si el usuario reintenta tras un error; solo una gestión nueva
(nueva apertura tras un registro exitoso) lleva una clave nueva. Un 200
"repetida" no duplica nada: se avisa y se cierra.
-->
<template>
  <v-dialog
    :model-value="modelValue"
    max-width="860"
    :fullscreen="$vuetify.display.xs"
    persistent
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-phone-log</v-icon>
        Registrar gestión
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" :disabled="enviando" @click="cerrar" />
      </v-card-title>
      <v-divider />

      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.placa"
              label="Placa *"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-car"
              :error-messages="errores.placa"
              :loading="consultando"
              :disabled="enviando"
              maxlength="10"
              hint="Al salir del campo se consulta el seguimiento del cliente"
              persistent-hint
              @update:model-value="onPlacaInput"
              @blur="consultarSeguimiento"
              @keydown.enter.prevent="consultarSeguimiento"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.telefono"
              label="Teléfono"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-phone"
              :disabled="enviando"
              inputmode="numeric"
              @update:model-value="(v: string) => (form.telefono = normalizarTelefono(v))"
            />
          </v-col>
        </v-row>

        <!-- Seguimiento del cliente -->
        <v-alert
          v-if="errorSeguimiento"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ errorSeguimiento }}
        </v-alert>
        <v-card v-if="seg" variant="tonal" class="mb-3 pa-3" :color="seg.seguimiento.puede_registrar ? undefined : 'error'">
          <div class="d-flex flex-wrap align-center ga-2">
            <v-chip
              :color="seg.seguimiento.puede_registrar ? 'primary' : 'error'"
              variant="flat"
              size="small"
              prepend-icon="mdi-counter"
            >
              {{ textoSeguimiento(seg.seguimiento.n, seg.seguimiento.limite) }}
            </v-chip>
            <span v-if="seg.seguimiento.extras_autorizados" class="text-caption">
              (incluye {{ seg.seguimiento.extras_autorizados }} extra autorizado por gerencia)
            </span>
            <v-spacer />
            <span class="text-body-2">
              <strong>{{ seg.cliente?.nombre || 'Sin cliente registrado' }}</strong>
              <template v-if="seg.cliente?.documento"> · {{ seg.cliente.documento }}</template>
              <template v-if="seg.cliente?.telefono"> · {{ seg.cliente.telefono }}</template>
            </span>
          </div>
          <div v-if="!seg.seguimiento.puede_registrar" class="text-body-2 mt-2">
            Este cliente ya alcanzó el máximo de seguimientos del ciclo. Pide a gerencia
            que autorice un seguimiento extra.
          </div>

          <v-alert
            v-if="seg.avisos.rtm_vigente"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-2"
            icon="mdi-calendar-check"
          >
            RTM vigente hasta el <strong>{{ fmtFecha(seg.avisos.rtm_vigente.vence_el) }}</strong>.
            Se puede datear RTM desde el
            <strong>{{ fmtFecha(seg.avisos.rtm_vigente.puede_datear_desde) }}</strong>.
          </v-alert>
          <v-alert
            v-if="seg.avisos.dateo_activo"
            :type="seg.avisos.dateo_activo.es_propio ? 'info' : 'warning'"
            variant="tonal"
            density="compact"
            class="mt-2"
            icon="mdi-account-lock"
          >
            <template v-if="seg.avisos.dateo_activo.es_propio">
              Ya tienes un dateo activo de esta placa (#{{ seg.avisos.dateo_activo.dateo_id }}).
            </template>
            <template v-else>
              Esta placa tiene un dateo activo de otro asesor
              (#{{ seg.avisos.dateo_activo.dateo_id }})<template v-if="seg.avisos.dateo_activo.bloquea_hasta">
                hasta el {{ fmtFecha(seg.avisos.dateo_activo.bloquea_hasta) }}</template>.
              Puedes registrar la gestión igual.
            </template>
          </v-alert>

          <div v-if="seg.gestiones_ciclo.length" class="mt-3">
            <div class="text-caption font-weight-bold mb-1">Gestiones previas del ciclo</div>
            <v-table density="compact">
              <tbody>
                <tr v-for="g in seg.gestiones_ciclo" :key="g.id">
                  <td class="text-no-wrap">#{{ g.numero_en_ciclo }}</td>
                  <td class="text-no-wrap">{{ fmtFechaHora(g.created_at) }}</td>
                  <td>{{ etiquetaMedio(g.medio) }}</td>
                  <td>
                    <v-chip size="x-small" :color="colorResultado(g.resultado)" variant="tonal">
                      {{ etiquetaResultado(g.resultado) }}
                    </v-chip>
                  </td>
                  <td>{{ g.agente_nombre || '—' }}</td>
                  <td class="text-caption">{{ g.observacion || '' }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card>

        <v-row dense>
          <v-col cols="12" sm="4">
            <v-select
              v-model="form.medio"
              :items="catalogos.medios"
              label="Medio *"
              variant="outlined"
              density="comfortable"
              :error-messages="errores.medio"
              :disabled="enviando"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="form.origen_id"
              :items="catalogos.origenes"
              item-title="nombre"
              item-value="id"
              label="Origen *"
              variant="outlined"
              density="comfortable"
              :error-messages="errores.origen"
              :disabled="enviando"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="form.resultado"
              :items="catalogos.resultados"
              label="Resultado *"
              variant="outlined"
              density="comfortable"
              :error-messages="errores.resultado"
              :disabled="enviando"
              hint="“Dateado” lo pone el sistema al datear"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.proximo_contacto_at"
              type="date"
              label="Próximo contacto"
              variant="outlined"
              density="comfortable"
              :min="hoy"
              :disabled="enviando"
              clearable
            />
          </v-col>
          <v-col cols="12" sm="8">
            <v-textarea
              v-model="form.observacion"
              label="Observaciones"
              variant="outlined"
              density="comfortable"
              rows="2"
              auto-grow
              :counter="OBSERVACION_MAX"
              :maxlength="OBSERVACION_MAX"
              :disabled="enviando"
            />
          </v-col>
          <v-col cols="12">
            <DropzoneImagen
              v-model="archivo"
              label="Evidencia (captura de la llamada o el chat) *"
              :extensiones="EXT_EVIDENCIA"
              :max-mb="8"
              :disabled="enviando"
              :error="errores.evidencia"
            />
          </v-col>
        </v-row>

        <v-alert v-if="errorEnvio" type="error" variant="tonal" class="mt-3" closable @click:close="errorEnvio = ''">
          {{ errorEnvio }}
        </v-alert>
      </v-card-text>

      <v-divider />
      <v-card-actions>
        <span v-if="reintento" class="text-caption text-medium-emphasis ml-2">
          Reintentar no duplica la gestión.
        </span>
        <v-spacer />
        <v-btn variant="text" :disabled="enviando" @click="cerrar">Cancelar</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-content-save"
          :loading="enviando"
          :disabled="enviando || bloqueadoPorLimite"
          @click="registrar"
        >
          {{ reintento ? 'Reintentar' : 'Registrar' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import DropzoneImagen from '@/components/UI/DropzoneImagen.vue'
import { HttpError } from '@/services/http'
import {
  getCatalogosTele,
  getSeguimiento,
  registrarGestion,
  subirEvidenciaTele,
  type CatalogosTele,
  type MedioGestion,
  type RegistrarGestionResp,
  type ResultadoElegible,
  type SeguimientoResp,
} from '@/services/telemercadeoService'
import {
  EXT_EVIDENCIA,
  OBSERVACION_MAX,
  colorResultado,
  etiquetaMedio,
  etiquetaResultado,
  fmtFecha,
  fmtFechaHora,
  hoyBogota,
  mensajeErrorGestion,
  normalizarPlaca,
  normalizarTelefono,
  nuevaIdempotencyKey,
  placaValida,
  textoSeguimiento,
} from '../telemercadeoHelpers'

const props = defineProps<{
  modelValue: boolean
  placaInicial?: string | null
  telefonoInicial?: string | null
}>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  registrada: [RegistrarGestionResp]
}>()

let catalogosCache: CatalogosTele | null = null
const catalogos = ref<CatalogosTele>({ origenes: [], medios: [], resultados: [] })

const form = reactive({
  placa: '',
  telefono: '',
  medio: null as MedioGestion | null,
  origen_id: null as number | null,
  resultado: null as ResultadoElegible | null,
  proximo_contacto_at: null as string | null,
  observacion: '',
})
const archivo = ref<File | null>(null)
const errores = reactive<Record<'placa' | 'medio' | 'origen' | 'resultado' | 'evidencia', string | null>>({
  placa: null,
  medio: null,
  origen: null,
  resultado: null,
  evidencia: null,
})

const seg = ref<SeguimientoResp | null>(null)
const placaConsultada = ref('')
const consultando = ref(false)
const errorSeguimiento = ref('')
const errorEnvio = ref('')
const enviando = ref(false)
const reintento = ref(false)
const hoy = ref(hoyBogota())

/** Clave de la gestión en curso: nueva al abrir, la misma al reintentar. */
let idempotencyKey = ''
/** Evidencia ya subida para este archivo (no se vuelve a subir al reintentar). */
let subida: { file: File; ruta: string } | null = null
let consultaCtrl: AbortController | null = null

const bloqueadoPorLimite = computed(
  () => !!seg.value && placaConsultada.value === normalizarPlaca(form.placa) && !seg.value.seguimiento.puede_registrar,
)

async function cargarCatalogos() {
  if (catalogosCache) {
    catalogos.value = catalogosCache
    return
  }
  try {
    catalogosCache = await getCatalogosTele()
    catalogos.value = catalogosCache
  } catch {
    errorEnvio.value = 'No se pudieron cargar los catálogos (medios, orígenes, resultados).'
  }
}

function reiniciar() {
  form.placa = normalizarPlaca(props.placaInicial)
  form.telefono = normalizarTelefono(props.telefonoInicial)
  form.medio = null
  form.origen_id = null
  form.resultado = null
  form.proximo_contacto_at = null
  form.observacion = ''
  archivo.value = null
  Object.keys(errores).forEach((k) => (errores[k as keyof typeof errores] = null))
  seg.value = null
  placaConsultada.value = ''
  errorSeguimiento.value = ''
  errorEnvio.value = ''
  reintento.value = false
  subida = null
  hoy.value = hoyBogota()
  idempotencyKey = nuevaIdempotencyKey()
}

watch(
  () => props.modelValue,
  (abierto) => {
    if (!abierto) return
    reiniciar()
    cargarCatalogos()
    if (form.placa) consultarSeguimiento()
  },
  { immediate: true },
)

function onPlacaInput(v: string) {
  form.placa = normalizarPlaca(v)
  errores.placa = null
}

async function consultarSeguimiento() {
  const placa = normalizarPlaca(form.placa)
  if (!placa || placa === placaConsultada.value) return
  if (!placaValida(placa)) {
    errores.placa = 'Placa inválida (4 a 10 letras o números)'
    return
  }
  consultaCtrl?.abort()
  consultaCtrl = new AbortController()
  consultando.value = true
  errorSeguimiento.value = ''
  try {
    const r = await getSeguimiento(placa, { telefono: form.telefono || null }, consultaCtrl.signal)
    seg.value = r
    placaConsultada.value = placa
    if (!form.telefono && r.cliente?.telefono) form.telefono = normalizarTelefono(r.cliente.telefono)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    seg.value = null
    placaConsultada.value = ''
    errorSeguimiento.value =
      e instanceof HttpError && e.status === 403
        ? 'No tienes permiso para consultar el seguimiento.'
        : 'No se pudo consultar el seguimiento de la placa. Puedes registrar igual.'
  } finally {
    consultando.value = false
  }
}

function validar() {
  errores.placa = placaValida(form.placa) ? null : 'La placa es obligatoria y debe ser válida'
  errores.medio = form.medio ? null : 'Elige el medio'
  errores.origen = form.origen_id ? null : 'Elige el origen'
  errores.resultado = form.resultado ? null : 'Elige el resultado'
  errores.evidencia = archivo.value ? null : 'La evidencia es obligatoria'
  return !Object.values(errores).some(Boolean)
}

async function registrar() {
  if (enviando.value) return // anti doble clic
  if (!validar()) return
  enviando.value = true
  errorEnvio.value = ''
  try {
    const file = archivo.value!
    if (!subida || subida.file !== file) {
      const r = await subirEvidenciaTele(file)
      subida = { file, ruta: r.ruta }
    }
    const resp = await registrarGestion({
      placa: normalizarPlaca(form.placa),
      telefono: form.telefono || null,
      medio: form.medio!,
      origen_id: form.origen_id!,
      resultado: form.resultado!,
      evidencia_ruta: subida.ruta,
      observacion: form.observacion.trim() || null,
      proximo_contacto_at: form.proximo_contacto_at || null,
      idempotency_key: idempotencyKey,
    })
    emit('registrada', resp)
    emit('update:modelValue', false)
  } catch (e) {
    reintento.value = true
    const err = e instanceof HttpError ? { status: e.status, data: e.data, message: e.message } : { message: e instanceof Error ? e.message : undefined }
    errorEnvio.value = mensajeErrorGestion(err)
    const code = e instanceof HttpError ? (e.data as { code?: string } | undefined)?.code : undefined
    if (code === 'EVIDENCIA_INVALIDA' || code === 'EVIDENCIA_NO_EXISTE') subida = null
    if (code === 'SEGUIMIENTO_LIMITE') {
      placaConsultada.value = ''
      await consultarSeguimiento()
    }
  } finally {
    enviando.value = false
  }
}

function cerrar() {
  if (enviando.value) return
  consultaCtrl?.abort()
  emit('update:modelValue', false)
}
</script>
