<template>
  <!-- align-self/justify: la vista arranca arriba aunque la tabla tenga pocas filas. -->
  <v-container fluid class="pa-4 telemercadeo-cola">
    <div class="d-flex align-center flex-wrap ga-2 mb-4">
      <v-icon size="28" class="mr-1">mdi-phone-outgoing</v-icon>
      <div>
        <h2 class="text-h6 font-weight-bold mb-0">Telemercadeo · Cola de trabajo</h2>
        <div class="text-caption text-medium-emphasis">
          Solo lectura. Se excluyen placas o clientes con turno hoy o con dateo RTM vigente.
          <span v-if="hoy">Corte: {{ fmtFecha(hoy) }}.</span>
        </div>
      </div>
    </div>

    <v-card>
      <v-tabs v-model="lista" color="primary" show-arrows @update:model-value="onCambioLista">
        <v-tab v-for="t in TABS" :key="t.value" :value="t.value">
          {{ t.label }}
          <v-chip size="x-small" class="ml-2" variant="tonal">{{
            contadores[t.value].total
          }}</v-chip>
        </v-tab>
      </v-tabs>

      <v-divider />

      <div class="d-flex flex-wrap align-center ga-3 pa-4">
        <span v-if="lista === 'CLIENTES'" class="text-body-2 font-weight-medium">
          Tiempo sin venir:
        </span>
        <v-chip-group
          v-model="rango"
          selected-class="text-primary"
          column
          @update:model-value="recargarDesdeInicio"
        >
          <v-chip :value="null" filter variant="outlined">
            Todos ({{ contadorLista.total }})
          </v-chip>
          <v-chip
            v-for="r in rangosLista"
            :key="r.value"
            :value="r.value"
            filter
            variant="outlined"
          >
            {{ r.label }} ({{ contadorLista[r.value] ?? 0 }})
          </v-chip>
        </v-chip-group>

        <v-spacer />

        <v-select
          v-if="lista === 'CLIENTES'"
          v-model="orden"
          :items="ORDENES"
          label="Ordenar"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 230px; min-width: 190px"
          @update:model-value="recargarDesdeInicio"
        />

        <v-text-field
          v-model="busqueda"
          :label="labelBusqueda"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          style="max-width: 340px; min-width: 220px"
          @update:model-value="onBuscar"
        />
      </div>

      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mx-4 mb-4"
        closable
        @click:close="error = ''"
      >
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
        item-value="clave"
        loading-text="Cargando cola…"
        hover
        @update:options="onUpdateOptions"
      >
        <template #item.cliente="{ item }">
          <div class="font-weight-medium">{{ item.cliente_nombre || 'Sin cliente' }}</div>
          <div v-if="lista === 'POR_VENCER'" class="text-caption text-medium-emphasis">
            {{ item.telefono || 'Sin teléfono' }}
          </div>
        </template>

        <template #item.telefono="{ item }">
          {{ item.telefono || '—' }}
        </template>

        <template #item.documento="{ item }">
          {{ item.documento || '—' }}
        </template>

        <template #item.placas="{ item }">
          <template v-if="item.placas.length">
            <v-chip
              v-for="p in item.placas"
              :key="p"
              size="small"
              variant="tonal"
              class="mr-1 mb-1"
              :color="p === item.placa ? 'primary' : undefined"
            >
              {{ p }}
            </v-chip>
          </template>
          <span v-else class="text-medium-emphasis">Sin vehículo</span>
        </template>

        <template #item.ultima_visita="{ item }">
          <div>{{ fmtFecha(item.ultima_visita) }}</div>
          <div v-if="item.servicio_ultima_visita" class="text-caption text-medium-emphasis">
            {{ item.servicio_ultima_visita }}
          </div>
        </template>

        <template #item.fuente_ultima_visita="{ item }">
          <v-chip
            v-if="item.fuente_ultima_visita"
            size="x-small"
            variant="tonal"
            :color="FUENTES[item.fuente_ultima_visita].color"
          >
            {{ FUENTES[item.fuente_ultima_visita].label }}
          </v-chip>
          <span v-else class="text-medium-emphasis">Sin fecha</span>
        </template>

        <template #item.meses_transcurridos="{ item }">
          <template v-if="item.meses_transcurridos !== null">
            {{ item.meses_transcurridos }}
            {{ item.meses_transcurridos === 1 ? 'mes' : 'meses' }}
          </template>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.vence_el="{ item }">
          <div>{{ fmtFecha(item.vence_el) }}</div>
          <v-chip size="x-small" :color="colorVencimiento(item)" variant="tonal">
            {{ textoVencimiento(item) }}
          </v-chip>
          <div v-if="item.puede_datear_desde" class="text-caption text-medium-emphasis">
            Ventana desde {{ fmtFecha(item.puede_datear_desde) }}
          </div>
        </template>

        <template #item.acciones="{ item }">
          <div class="d-flex ga-1 justify-end">
            <v-tooltip text="Próximamente" location="top">
              <template #activator="{ props }">
                <span v-bind="props">
                  <v-btn size="small" variant="tonal" prepend-icon="mdi-phone-log" disabled>
                    Registrar gestión
                  </v-btn>
                </span>
              </template>
            </v-tooltip>

            <!-- Varias placas: el operador elige cuál datear. -->
            <v-menu v-if="item.placas.length > 1" location="bottom end">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-note-plus-outline"
                  append-icon="mdi-menu-down"
                >
                  Datear
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-subheader>¿Qué placa?</v-list-subheader>
                <v-list-item
                  v-for="p in item.placas"
                  :key="p"
                  :title="p"
                  @click="datear(item, p)"
                />
              </v-list>
            </v-menu>
            <v-btn
              v-else
              size="small"
              color="primary"
              variant="flat"
              prepend-icon="mdi-note-plus-outline"
              @click="datear(item, item.placa)"
            >
              Datear
            </v-btn>
          </div>
        </template>

        <template #no-data>
          <div class="py-8 text-center text-medium-emphasis">
            <v-icon size="40" class="mb-2">mdi-phone-off-outline</v-icon>
            <div v-if="error">No se pudo cargar la cola.</div>
            <div v-else-if="busquedaActiva || rango">Sin resultados para este filtro.</div>
            <div v-else>No hay a quién llamar en esta lista.</div>
          </div>
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { HttpError } from '@/services/http'
import {
  getColaTelemercadeo,
  type ContadoresCola,
  type FilaCola,
  type FuenteVisita,
  type ListaCola,
  type OrdenClientes,
} from '@/services/telemercadeoService'

const router = useRouter()

const TABS: { value: ListaCola; label: string }[] = [
  { value: 'POR_VENCER', label: 'Por vencer' },
  { value: 'CLIENTES', label: 'Clientes' },
]

const RANGOS: Record<ListaCola, { value: string; label: string }[]> = {
  POR_VENCER: [
    { value: 'PROXIMAS', label: 'Próximos 30 días' },
    { value: 'VENCIDAS', label: 'Vencidas' },
  ],
  CLIENTES: [
    { value: '2_5', label: '2-5 meses' },
    { value: '6_11', label: '6-11 meses' },
    { value: '12_23', label: '12-23 meses' },
    { value: '24_MAS', label: '24+ meses' },
    { value: 'SIN_FECHA', label: 'Sin fecha de visita' },
  ],
}

const ORDENES: { value: OrdenClientes; title: string }[] = [
  { value: 'ANTIGUEDAD', title: 'Más tiempo sin venir' },
  { value: 'RECIENTE', title: 'Visita más reciente' },
  { value: 'NOMBRE', title: 'Nombre' },
]

const FUENTES: Record<FuenteVisita, { label: string; color: string }> = {
  TURNO_CLIENTE: { label: 'Turno (cliente)', color: 'primary' },
  TURNO_PLACA: { label: 'Turno (placa)', color: 'info' },
  TICKET: { label: 'Ticket', color: 'secondary' },
}

const lista = ref<ListaCola>('POR_VENCER')
const rango = ref<string | null>(null)
const orden = ref<OrdenClientes>('ANTIGUEDAD')
const busqueda = ref<string | null>('')
const busquedaActiva = ref('')

const rows = ref<FilaCola[]>([])
const total = ref(0)
const hoy = ref<string | null>(null)
const loading = ref(false)
const error = ref('')
const pagination = ref({ page: 1, itemsPerPage: 25 })
const contadores = ref<ContadoresCola>({
  POR_VENCER: { total: 0, PROXIMAS: 0, VENCIDAS: 0 },
  CLIENTES: { total: 0, '0_1': 0, '2_5': 0, '6_11': 0, '12_23': 0, '24_MAS': 0, SIN_FECHA: 0 },
})

const rangosLista = computed(() => RANGOS[lista.value])
const contadorLista = computed(() => contadores.value[lista.value] as Record<string, number>)
const labelBusqueda = computed(() =>
  lista.value === 'CLIENTES'
    ? 'Buscar nombre, documento, teléfono o placa'
    : 'Buscar placa, nombre o teléfono',
)

const headers = computed(() => {
  const acciones = { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const }
  if (lista.value === 'CLIENTES') {
    return [
      { title: 'Cliente', key: 'cliente', sortable: false },
      { title: 'Teléfono', key: 'telefono', sortable: false },
      { title: 'Documento', key: 'documento', sortable: false },
      { title: 'Placa(s)', key: 'placas', sortable: false },
      { title: 'Última visita', key: 'ultima_visita', sortable: false },
      { title: 'Fuente', key: 'fuente_ultima_visita', sortable: false },
      { title: 'Sin venir', key: 'meses_transcurridos', sortable: false },
      acciones,
    ]
  }
  return [
    { title: 'Cliente', key: 'cliente', sortable: false },
    { title: 'Placa(s)', key: 'placas', sortable: false },
    { title: 'Último RTM', key: 'ultima_visita', sortable: false },
    { title: 'Tiempo', key: 'meses_transcurridos', sortable: false },
    { title: 'Vencimiento RTM', key: 'vence_el', sortable: false },
    acciones,
  ]
})

let controller: AbortController | null = null

async function cargar() {
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = ''
  try {
    const resp = await getColaTelemercadeo(
      {
        lista: lista.value,
        rango: rango.value,
        q: busquedaActiva.value,
        orden: orden.value,
        page: pagination.value.page,
        perPage: pagination.value.itemsPerPage,
      },
      controller.signal,
    )
    rows.value = resp.data
    total.value = resp.total
    hoy.value = resp.hoy
    contadores.value = resp.contadores
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    rows.value = []
    total.value = 0
    error.value =
      e instanceof HttpError && e.status === 403
        ? 'No tienes permiso para ver la cola de Telemercadeo.'
        : e instanceof Error
          ? e.message
          : 'Error al cargar la cola.'
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

function onCambioLista() {
  rango.value = null
  recargarDesdeInicio()
}

let debounce: ReturnType<typeof setTimeout> | null = null
function onBuscar() {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => {
    busquedaActiva.value = (busqueda.value || '').trim()
    recargarDesdeInicio()
  }, 400)
}

onBeforeUnmount(() => {
  if (debounce) clearTimeout(debounce)
  controller?.abort()
})

function datear(item: FilaCola, placa: string) {
  const telefono = (item.telefono || '').replace(/\D/g, '')
  router.push({
    name: 'ComercialDateosNuevo',
    query: {
      ...(placa ? { placa } : {}),
      ...(telefono ? { telefono } : {}),
    },
  })
}

function fmtFecha(iso: string | null) {
  if (!iso) return '—'
  const [y, m, d] = iso.substring(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function textoVencimiento(item: FilaCola) {
  const dias = item.dias_para_vencer ?? 0
  if (dias < 0) return `Vencido hace ${-dias} día(s)`
  if (dias === 0) return 'Vence hoy'
  return `Vence en ${dias} día(s)`
}

function colorVencimiento(item: FilaCola) {
  const dias = item.dias_para_vencer ?? 0
  if (dias < 0) return 'error'
  if (item.puede_datear_desde && hoy.value && hoy.value >= item.puede_datear_desde) return 'warning'
  return 'info'
}
</script>

<style scoped>
.telemercadeo-cola {
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
</style>
