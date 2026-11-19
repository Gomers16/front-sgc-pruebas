<!--
Historial de gestiones server-side (GET /api/telemercadeo/gestiones → { data, meta }).
modo="asesor": las propias (el backend ignora agente_id), botón "Datear".
modo="control": filtro por asesor y "Autorizar seguimiento extra" en filas
cuyo ciclo está abierto y numero_en_ciclo ya alcanzó el límite.
-->
<template>
  <div>
    <v-row dense class="px-4 pt-4">
      <v-col v-if="modo === 'control'" cols="12" sm="6" md="3">
        <v-autocomplete
          v-model="filtros.agente_id"
          :items="asesores"
          item-title="nombre"
          item-value="id"
          label="Asesor"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          @update:model-value="recargarDesdeInicio"
        />
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-text-field
          v-model="filtros.desde"
          type="date"
          label="Desde"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          @update:model-value="recargarDesdeInicio"
        />
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-text-field
          v-model="filtros.hasta"
          type="date"
          label="Hasta"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          @update:model-value="recargarDesdeInicio"
        />
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-text-field
          v-model="filtros.placa"
          label="Placa"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          @update:model-value="onPlaca"
        />
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-select
          v-model="filtros.medio"
          :items="catalogos.medios"
          label="Medio"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          @update:model-value="recargarDesdeInicio"
        />
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-select
          v-model="filtros.origen_id"
          :items="catalogos.origenes"
          item-title="nombre"
          item-value="id"
          label="Origen"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          @update:model-value="recargarDesdeInicio"
        />
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-select
          v-model="filtros.resultado"
          :items="resultadosFiltro"
          label="Resultado"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          @update:model-value="recargarDesdeInicio"
        />
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" variant="tonal" class="mx-4 mt-3" closable @click:close="error = ''">
      {{ error }}
      <template #append>
        <v-btn size="small" variant="text" @click="cargar">Reintentar</v-btn>
      </template>
    </v-alert>

    <v-data-table-server
      :headers="headers"
      :items="rows"
      :items-length="total"
      :loading="loading"
      :items-per-page="pagination.itemsPerPage"
      :page="pagination.page"
      :items-per-page-options="[10, 25, 50, 100]"
      item-value="id"
      loading-text="Cargando gestiones…"
      density="comfortable"
      hover
      @update:options="onUpdateOptions"
    >
      <template #item.created_at="{ item }">
        <span class="text-no-wrap">{{ fmtFechaHora(item.created_at) }}</span>
      </template>
      <template #item.placa="{ item }">
        <div class="font-weight-medium">{{ item.placa }}</div>
        <div class="text-caption text-medium-emphasis">
          {{ item.cliente_nombre || 'Sin cliente' }}<template v-if="item.telefono"> · {{ item.telefono }}</template>
        </div>
      </template>
      <template #item.medio="{ item }">
        <v-icon size="small" class="mr-1">{{ MEDIO_ICONO[item.medio] }}</v-icon>{{ etiquetaMedio(item.medio) }}
        <div class="text-caption text-medium-emphasis">{{ item.origen_nombre }}</div>
      </template>
      <template #item.resultado="{ item }">
        <v-chip size="small" :color="colorResultado(item.resultado)" variant="tonal">
          {{ etiquetaResultado(item.resultado) }}
        </v-chip>
        <div v-if="item.proximo_contacto_at" class="text-caption text-medium-emphasis">
          Próx. contacto {{ fmtFecha(item.proximo_contacto_at) }}
        </div>
        <div v-if="item.captacion_dateo_id" class="text-caption">
          Dateo #{{ item.captacion_dateo_id }}<template v-if="item.dateo_resultado"> · {{ item.dateo_resultado }}</template>
        </div>
      </template>
      <template #item.seguimiento="{ item }">
        <v-chip
          size="small"
          variant="tonal"
          :color="item.seguimiento.ciclo_abierto ? (seguimientoAgotado(item.seguimiento.numero_en_ciclo, item.seguimiento.limite) ? 'error' : 'primary') : undefined"
        >
          {{ textoSeguimiento(item.seguimiento.numero_en_ciclo, item.seguimiento.limite) }}
        </v-chip>
        <div v-if="!item.seguimiento.ciclo_abierto" class="text-caption text-medium-emphasis">
          {{ MOTIVO_CIERRE_LABEL[item.seguimiento.cerrado_motivo ?? ''] ?? 'Ciclo cerrado' }}
        </div>
      </template>
      <template #item.observacion="{ item }">
        <span class="text-caption">{{ item.observacion || '' }}</span>
      </template>
      <template #item.acciones="{ item }">
        <div class="d-flex ga-1 justify-end">
          <v-btn
            size="small"
            variant="text"
            icon="mdi-image-search"
            :title="'Ver evidencia'"
            @click="evidenciaId = item.id"
          />
          <v-btn
            v-if="modo === 'asesor' && puedeDatear(item)"
            size="small"
            color="primary"
            variant="flat"
            prepend-icon="mdi-note-plus-outline"
            @click="emit('datear', item)"
          >
            Datear
          </v-btn>
          <v-btn
            v-if="modo === 'control' && puedeAutorizarExtra(item)"
            size="small"
            color="warning"
            variant="tonal"
            prepend-icon="mdi-shield-plus-outline"
            @click="emit('autorizar', item)"
          >
            Autorizar seguimiento extra
          </v-btn>
        </div>
      </template>
      <template #no-data>
        <div class="py-8 text-center text-medium-emphasis">
          <v-icon size="40" class="mb-2">mdi-phone-off-outline</v-icon>
          <div>{{ error ? 'No se pudieron cargar las gestiones.' : 'Sin gestiones para este filtro.' }}</div>
        </div>
      </template>
    </v-data-table-server>

    <EvidenciaGestionDialog :gestion-id="evidenciaId" @cerrar="evidenciaId = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { HttpError } from '@/services/http'
import {
  getCatalogosTele,
  listGestiones,
  type AsesorTele,
  type CatalogosTele,
  type Gestion,
  type MedioGestion,
  type ResultadoGestion,
} from '@/services/telemercadeoService'
import {
  MEDIO_ICONO,
  MOTIVO_CIERRE_LABEL,
  RESULTADO_LABEL,
  colorResultado,
  etiquetaMedio,
  etiquetaResultado,
  fmtFecha,
  fmtFechaHora,
  puedeAutorizarExtra,
  seguimientoAgotado,
  textoSeguimiento,
} from '../telemercadeoHelpers'
import EvidenciaGestionDialog from './EvidenciaGestionDialog.vue'

const props = withDefaults(
  defineProps<{
    modo: 'asesor' | 'control'
    asesores?: AsesorTele[]
    /** Filtro inicial (drill-down desde el resumen). */
    agenteIdInicial?: number | null
    desdeInicial?: string | null
    hastaInicial?: string | null
  }>(),
  { asesores: () => [], agenteIdInicial: null, desdeInicial: null, hastaInicial: null },
)

const emit = defineEmits<{ datear: [Gestion]; autorizar: [Gestion] }>()

const catalogos = ref<CatalogosTele>({ origenes: [], medios: [], resultados: [] })
// El filtro sí admite DATEADO (lo asigna el sistema, pero se puede buscar).
const resultadosFiltro = computed(() =>
  (Object.keys(RESULTADO_LABEL) as ResultadoGestion[]).map((v) => ({ value: v, title: RESULTADO_LABEL[v] })),
)

const filtros = reactive({
  agente_id: props.agenteIdInicial as number | null,
  desde: props.desdeInicial as string | null,
  hasta: props.hastaInicial as string | null,
  placa: '' as string | null,
  medio: null as MedioGestion | null,
  origen_id: null as number | null,
  resultado: null as ResultadoGestion | null,
})

const rows = ref<Gestion[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const pagination = ref({ page: 1, itemsPerPage: 25 })
const evidenciaId = ref<number | null>(null)

const headers = computed(() => [
  { title: 'Fecha', key: 'created_at', sortable: false },
  ...(props.modo === 'control' ? [{ title: 'Asesor', key: 'agente_nombre', sortable: false }] : []),
  { title: 'Placa / cliente', key: 'placa', sortable: false },
  { title: 'Medio', key: 'medio', sortable: false },
  { title: 'Resultado', key: 'resultado', sortable: false },
  { title: 'Seguimiento', key: 'seguimiento', sortable: false },
  { title: 'Observación', key: 'observacion', sortable: false },
  { title: '', key: 'acciones', sortable: false, align: 'end' as const },
])

const puedeDatear = (g: Gestion) =>
  !g.captacion_dateo_id && g.resultado !== 'DATEADO' && g.seguimiento.ciclo_abierto

let ctrl: AbortController | null = null

async function cargar() {
  ctrl?.abort()
  ctrl = new AbortController()
  loading.value = true
  error.value = ''
  try {
    const r = await listGestiones(
      {
        ...filtros,
        agente_id: props.modo === 'control' ? filtros.agente_id : null,
        page: pagination.value.page,
        per_page: pagination.value.itemsPerPage,
      },
      ctrl.signal,
    )
    rows.value = r.data
    total.value = r.meta.total
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    rows.value = []
    total.value = 0
    error.value =
      e instanceof HttpError && e.status === 403
        ? 'No tienes permiso para ver estas gestiones.'
        : e instanceof Error
          ? e.message
          : 'Error al cargar las gestiones.'
  } finally {
    loading.value = false
  }
}

function onUpdateOptions(opts: { page: number; itemsPerPage: number }) {
  pagination.value = { page: opts.page, itemsPerPage: opts.itemsPerPage }
  cargar()
}

function recargarDesdeInicio() {
  pagination.value = { ...pagination.value, page: 1 }
  cargar()
}

let debounce: ReturnType<typeof setTimeout> | null = null
function onPlaca() {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(recargarDesdeInicio, 400)
}

watch(
  () => [props.agenteIdInicial, props.desdeInicial, props.hastaInicial] as const,
  ([a, d, h]) => {
    filtros.agente_id = a
    filtros.desde = d
    filtros.hasta = h
    recargarDesdeInicio()
  },
)

getCatalogosTele()
  .then((c) => (catalogos.value = c))
  .catch(() => {})

onBeforeUnmount(() => {
  if (debounce) clearTimeout(debounce)
  ctrl?.abort()
})

defineExpose({ recargar: cargar })
</script>
