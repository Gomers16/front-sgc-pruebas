<!-- src/views/tickets/TicketsList.vue -->
<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title
        class="py-4 px-4 px-sm-6 d-flex align-center justify-space-between flex-wrap gap-3"
      >
        <div class="d-flex align-center gap-2">
          <span class="text-h5 font-weight-bold">🎫 Tickets</span>
          <v-chip
            v-if="puedeVerGerencia && pendientes"
            color="warning"
            variant="flat"
            size="small"
            class="font-weight-bold"
            @click="verPendientes"
          >
            {{ pendientes }} pendiente{{ pendientes === 1 ? '' : 's' }}
          </v-chip>
        </div>
        <!-- Sin botón "Nuevo ticket": el ticket de Excepción de Dateo necesita el
             turno y nace del aviso REQUIERE_TICKET_DATEO al intentar datear. -->
        <div class="text-caption text-medium-emphasis">
          Los tickets de Excepción de Dateo se crean desde Comercial → Nuevo dateo, cuando el turno
          ya está en la sede.
        </div>
      </v-card-title>

      <!-- 🆕 Configuración: ventana de ticket sin penalización (global + overrides por asesor) -->
      <v-expansion-panels
        v-if="puedeConfigurarVentana"
        variant="accordion"
        class="mx-4 mx-sm-6 mb-4"
      >
        <v-expansion-panel title="⚙️ Ventana de ticket con comisión completa (Excepción de Dateo)">
          <v-expansion-panel-text>
            <v-row dense align="end" class="mb-3">
              <v-col cols="8" sm="4" md="3">
                <v-text-field
                  v-model.number="ventanaGlobal.valor"
                  label="Minutos globales de ventana"
                  type="number"
                  min="1"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :loading="ventanaGlobal.loading"
                />
              </v-col>
              <v-col cols="4" sm="2" md="2">
                <v-btn
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-content-save"
                  :disabled="!ventanaGlobalCambiada"
                  :loading="ventanaGlobal.guardando"
                  @click="guardarVentanaGlobal"
                >
                  Guardar
                </v-btn>
              </v-col>
            </v-row>

            <div class="text-subtitle-2 font-weight-bold mb-2">Overrides por asesor</div>
            <v-row dense class="mb-3">
              <v-col cols="12" sm="6" md="4">
                <v-autocomplete
                  v-model="ventanaAsesorForm.asesorId"
                  :items="asesoresItems"
                  item-title="nombre"
                  item-value="id"
                  label="Asesor"
                  density="comfortable"
                  variant="outlined"
                  :loading="asesoresLoading"
                  hide-details
                  clearable
                />
              </v-col>
              <v-col cols="8" sm="4" md="3">
                <v-text-field
                  v-model.number="ventanaAsesorForm.minutosVentana"
                  label="Minutos de ventana"
                  type="number"
                  min="1"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                />
              </v-col>
              <v-col cols="4" sm="2" md="1" class="d-flex align-center">
                <v-btn
                  color="primary"
                  :loading="ventanaAsesorForm.guardando"
                  :disabled="!ventanaAsesorForm.asesorId || !ventanaAsesorForm.minutosVentana"
                  @click="guardarVentanaAsesor"
                  icon="mdi-content-save"
                />
              </v-col>
            </v-row>

            <v-data-table
              :headers="ventanaAsesorHeaders"
              :items="ventanaAsesorOverrides"
              :loading="ventanaAsesorLoading"
              item-key="id"
              density="comfortable"
            >
              <template #item.asesor="{ item }">
                {{ item.asesor_nombre || `#${item.asesor_id}` }}
              </template>
              <template #item.acciones="{ item }">
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  icon="mdi-delete"
                  @click="confirmarEliminarVentanaAsesor(item)"
                />
              </template>
              <template #no-data>
                <div class="text-center py-4 text-medium-emphasis">
                  Sin overrides por asesor. Todos usan la ventana global.
                </div>
              </template>
            </v-data-table>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- Vista: bandeja / estadísticas (solo gerencia) -->
      <v-tabs v-if="puedeVerGerencia" v-model="vista" class="px-4 px-sm-6" color="primary">
        <v-tab value="bandeja" prepend-icon="mdi-inbox">Bandeja</v-tab>
        <v-tab value="estadisticas" prepend-icon="mdi-chart-box-outline">Estadísticas</v-tab>
      </v-tabs>

      <v-card-text class="px-4 px-sm-6 pt-3">
        <!-- Filtros (compartidos: estadísticas usa fecha, asesor y convenio) -->
        <v-row dense>
          <v-col cols="6" sm="4" md="2">
            <v-text-field
              v-model="filtros.fecha_desde"
              type="date"
              label="Desde"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field
              v-model="filtros.fecha_hasta"
              type="date"
              label="Hasta"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="4" md="4">
            <v-autocomplete
              v-model="filtros.comercial_id"
              :items="asesoresItems"
              item-title="nombre"
              item-value="id"
              label="Asesor"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              :loading="asesoresLoading"
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-autocomplete
              v-model="filtros.convenio_id"
              :items="conveniosItems"
              :item-title="etiquetaConvenio"
              item-value="id"
              label="Convenio"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              :custom-filter="filtroConvenio"
            />
          </v-col>
          <template v-if="vista === 'bandeja'">
            <v-col cols="6" sm="3" md="2">
              <v-select
                v-model="filtros.estado"
                :items="estadoItems"
                label="Estado"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </v-col>
            <v-col cols="6" sm="3" md="2">
              <v-select
                v-model="filtros.ventana"
                :items="ventanaItems"
                label="Ventana"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </v-col>
            <v-col cols="6" sm="3" md="2">
              <v-text-field
                v-model="placaInput"
                label="Placa"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </v-col>
            <v-col cols="6" sm="3" md="2">
              <v-text-field
                v-model="turnoInput"
                label="N° de turno (del día)"
                type="number"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="filtros.decision"
                :items="decisionItems"
                label="Decisión de comisión"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
            </v-col>
          </template>
        </v-row>

        <div class="d-flex align-center flex-wrap gap-2 mt-3 mb-2">
          <v-chip
            v-for="chip in chips"
            :key="chip.clave"
            size="small"
            closable
            color="primary"
            variant="tonal"
            @click:close="quitar(chip.clave)"
          >
            {{ chip.texto }}
          </v-chip>
          <v-btn
            v-if="chips.length"
            size="small"
            variant="text"
            prepend-icon="mdi-filter-remove"
            @click="limpiar"
          >
            Limpiar
          </v-btn>
          <v-spacer />
          <v-btn
            v-if="puedeVerGerencia"
            size="small"
            color="success"
            variant="tonal"
            prepend-icon="mdi-microsoft-excel"
            :loading="exportando"
            @click="exportar"
          >
            Exportar a Excel
          </v-btn>
        </div>

        <template v-if="vista === 'bandeja'">
          <v-tabs v-model="tipoActivo" density="compact" show-arrows class="mb-2">
            <v-tab value="TODOS">Todos</v-tab>
            <v-tab v-for="tipo in tipos" :key="tipo.codigo" :value="tipo.codigo">
              <span class="dot mr-2" :style="{ backgroundColor: colorPorTipo(tipo.codigo) }" />
              {{ tipo.nombre }}
              <v-chip
                v-if="pendientesPorTipo[tipo.codigo]"
                size="x-small"
                color="warning"
                class="ml-2"
              >
                {{ pendientesPorTipo[tipo.codigo] }}
              </v-chip>
            </v-tab>
          </v-tabs>

          <v-alert v-if="errorCarga" type="error" variant="tonal" density="compact" class="mb-2">
            {{ errorCarga }}
            <template #append>
              <v-btn size="small" variant="text" @click="cargar">Reintentar</v-btn>
            </template>
          </v-alert>

          <v-data-table-server
            :headers="headers"
            :items="tickets"
            :items-length="total"
            :loading="loading"
            :page="page"
            :items-per-page="perPage"
            :items-per-page-options="[10, 25, 50, 100]"
            item-value="id"
            density="comfortable"
            hover
            class="bandeja"
            @update:options="onOptions"
            @click:row="onRowClick"
          >
            <template #item.id="{ item }">
              <span
                class="dot mr-2"
                :style="{ backgroundColor: colorPorTipo(item.tipoTicket?.codigo) }"
              />#{{ item.id }}
            </template>
            <template #item.creado="{ item }">{{ formatDateTime(item.createdAt) }}</template>
            <template #item.placa="{ item }">
              <div class="font-weight-600">{{ item.resumen?.placa ?? '—' }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.tipoTicket?.nombre }}</div>
            </template>
            <template #item.turno="{ item }">
              <template v-if="item.resumen?.turnoId">
                <div class="font-weight-600">{{ turnoDeFila(item).principal }}</div>
                <div v-if="turnoDeFila(item).secundario" class="text-caption text-medium-emphasis">
                  {{ turnoDeFila(item).secundario }}
                </div>
              </template>
            </template>
            <template #item.asesor="{ item }">{{
              item.resumen?.comercialNombre ?? nombreCreador(item)
            }}</template>
            <template #item.convenio="{ item }">
              <span v-if="item.resumen?.convenioId">
                {{
                  etiquetaConvenio({
                    nombre: item.resumen.convenioNombre ?? '—',
                    establecimiento: item.resumen.convenioEstablecimiento,
                  })
                }}
              </span>
              <span v-else class="text-medium-emphasis">Sin convenio</span>
            </template>
            <template #item.ventana="{ item }">
              <v-chip
                v-if="item.resumen && item.resumen.dentroVentana !== null"
                size="x-small"
                :color="item.resumen.dentroVentana ? 'success' : 'warning'"
                variant="tonal"
              >
                {{
                  item.resumen.dentroVentana
                    ? 'Dentro'
                    : `Fuera (+${item.resumen.minutosExceso ?? 0} min)`
                }}
              </v-chip>
            </template>
            <template #item.estado="{ item }">
              <span
                class="text-caption font-weight-600"
                :style="{ color: colorPorEstado(item.estado) }"
              >
                {{ ETIQUETAS_ESTADO[item.estado] ?? item.estado }}
              </span>
            </template>
            <template #item.decision="{ item }">
              <span v-if="item.resumen?.decisionComision" class="text-caption">
                {{ ETIQUETAS_DECISION[item.resumen.decisionComision] }}
              </span>
            </template>
            <template #no-data>
              <div class="text-center py-6 text-medium-emphasis">
                No hay tickets para mostrar con estos filtros.
              </div>
            </template>
          </v-data-table-server>
        </template>

        <TicketsEstadisticas v-else :params="paramsEstadisticas" />
      </v-card-text>
    </v-card>

    <!-- Confirmar eliminar override de ventana -->
    <v-dialog v-model="dlgEliminarVentanaAsesor.visible" max-width="420">
      <v-card>
        <v-card-title class="text-subtitle-1 font-weight-bold">Eliminar override</v-card-title>
        <v-card-text>
          ¿Eliminar el override de ventana de
          <strong>{{
            dlgEliminarVentanaAsesor.item?.asesor_nombre ||
            `#${dlgEliminarVentanaAsesor.item?.asesor_id}`
          }}</strong
          >? Volverá a usar la ventana global.
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="dlgEliminarVentanaAsesor.visible = false">Cancelar</v-btn>
          <v-btn
            color="error"
            :loading="dlgEliminarVentanaAsesor.loading"
            @click="doEliminarVentanaAsesor"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="configSnack.show" :color="configSnack.color" timeout="3500">
      {{ configSnack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  listTickets,
  listTiposTicket,
  exportarTicketsExcel,
  getContadorPendientesTickets,
  getVentanaTicketGlobal,
  setVentanaTicketGlobal,
  getVentanaTicketAsesores,
  setVentanaTicketAsesor,
  deleteVentanaTicketAsesor,
  type ListTicketsParams,
  type Ticket,
  type TicketEstado,
  type TipoTicketLight,
  type VentanaTicketAsesorRow,
} from '@/services/ticketsService'
import { formatDateTime, listConveniosLight } from '@/services/dateosService'
import {
  listAgentesCaptacion,
  etiquetaConvenio,
  filtroConvenio,
  type ConvenioLight,
} from '@/services/conveniosService'
import { HttpError } from '@/services/http'
import { usePermissions } from '@/composables/usePermissions'
import { useTicketsPendientes } from '@/composables/useTicketsPendientes'
import {
  chipsFiltros,
  ETIQUETAS_DECISION,
  ETIQUETAS_ESTADO,
  filtrosAParams,
  filtrosAQuery,
  filtrosDesdeQuery,
  filtrosVacios,
  quitarFiltro,
  type FiltrosBandeja,
} from './filtrosTickets'
import { turnoVisible } from './turnoVisible'
import TicketsEstadisticas from './TicketsEstadisticas.vue'

const route = useRoute()
const router = useRouter()
const { can } = usePermissions()
const { pendientes, refrescarPendientes } = useTicketsPendientes()

const puedeVerGerencia = computed(() => can.verEstadisticasTickets())

/* ═══════════ Estado: la URL es la fuente de verdad (filtros, página, pestañas) ═══════════ */
const inicial = filtrosDesdeQuery(route.query)
const filtros = ref<FiltrosBandeja>(inicial.filtros)
const page = ref(inicial.page)
const perPage = ref(inicial.perPage)
const tipoActivo = ref<string>(typeof route.query.tipo === 'string' ? route.query.tipo : 'TODOS')
const vista = ref<'bandeja' | 'estadisticas'>(
  route.query.vista === 'estadisticas' && can.verEstadisticasTickets() ? 'estadisticas' : 'bandeja',
)

// Placa y turno se escriben a mano: se aplican con una pausa corta.
const placaInput = ref(filtros.value.placa)
const turnoInput = ref<string>(filtros.value.turno_numero ? String(filtros.value.turno_numero) : '')
let pausa: ReturnType<typeof setTimeout> | null = null
watch([placaInput, turnoInput], () => {
  if (pausa) clearTimeout(pausa)
  pausa = setTimeout(() => {
    const turno = Number(turnoInput.value)
    filtros.value = {
      ...filtros.value,
      placa: (placaInput.value ?? '').toUpperCase(),
      turno_numero: Number.isInteger(turno) && turno > 0 ? turno : null,
    }
  }, 400)
})

function queryActual(nuevaPagina = page.value) {
  const q: Record<string, string> = filtrosAQuery(filtros.value, nuevaPagina, perPage.value)
  if (tipoActivo.value !== 'TODOS') q.tipo = tipoActivo.value
  if (vista.value === 'estadisticas') q.vista = 'estadisticas'
  return q
}
function sincronizarUrl(nuevaPagina = page.value) {
  router.replace({ query: queryActual(nuevaPagina) }).catch(() => {})
}

// Cambió un filtro o la pestaña → primera página.
watch(
  [filtros, tipoActivo, vista],
  () => {
    page.value = 1
    sincronizarUrl(1)
  },
  { deep: true },
)

// La URL cambió (incluido volver desde el detalle) → recargar.
watch(
  () => route.fullPath,
  () => {
    if (route.name !== 'TicketsList') return
    const leido = filtrosDesdeQuery(route.query)
    page.value = leido.page
    perPage.value = leido.perPage
    if (vista.value === 'bandeja') cargar()
  },
)

/* ═══════════ Catálogos ═══════════ */
const tipos = ref<TipoTicketLight[]>([])
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)
const conveniosItems = ref<ConvenioLight[]>([])
const pendientesPorTipo = ref<Record<string, number>>({})

const estadoItems = (Object.keys(ETIQUETAS_ESTADO) as TicketEstado[]).map((value) => ({
  title: ETIQUETAS_ESTADO[value],
  value,
}))
const ventanaItems = [
  { title: 'Dentro de ventana', value: 'dentro' },
  { title: 'Fuera de ventana', value: 'fuera' },
]
const decisionItems = Object.entries(ETIQUETAS_DECISION).map(([value, title]) => ({ title, value }))

const chips = computed(() =>
  chipsFiltros(filtros.value, {
    comercial: (id) => asesoresItems.value.find((a) => a.id === id)?.nombre,
    convenio: (id) => {
      const c = conveniosItems.value.find((x) => x.id === id)
      return c ? etiquetaConvenio(c) : undefined
    },
  }),
)
function quitar(clave: keyof FiltrosBandeja) {
  filtros.value = quitarFiltro(filtros.value, clave)
  if (clave === 'placa') placaInput.value = ''
  if (clave === 'turno_numero') turnoInput.value = ''
}
function limpiar() {
  filtros.value = filtrosVacios()
  placaInput.value = ''
  turnoInput.value = ''
}
function verPendientes() {
  vista.value = 'bandeja'
  filtros.value = { ...filtros.value, estado: 'PENDIENTE' }
}

/* ═══════════ Bandeja ═══════════ */
const tickets = ref<Ticket[]>([])
const total = ref(0)
const loading = ref(false)
const errorCarga = ref<string | null>(null)

const headers = [
  { title: '#', key: 'id', sortable: false },
  { title: 'Creado', key: 'creado', sortable: false },
  { title: 'Placa', key: 'placa', sortable: false },
  { title: 'Turno', key: 'turno', sortable: false },
  { title: 'Asesor', key: 'asesor', sortable: false },
  { title: 'Convenio', key: 'convenio', sortable: false },
  { title: 'Ventana', key: 'ventana', sortable: false },
  { title: 'Estado', key: 'estado', sortable: false },
  { title: 'Decisión', key: 'decision', sortable: false },
]

function params(): ListTicketsParams {
  const p = filtrosAParams(filtros.value)
  const tipo = tipos.value.find((t) => t.codigo === tipoActivo.value)
  if (tipo) p.tipo_ticket_id = tipo.id
  return p
}
const paramsEstadisticas = computed<ListTicketsParams>(() => {
  const p = filtrosAParams(filtros.value)
  return {
    fecha_desde: p.fecha_desde,
    fecha_hasta: p.fecha_hasta,
    comercial_id: p.comercial_id,
    convenio_id: p.convenio_id,
  }
})

let solicitud = 0
async function cargar() {
  const mia = ++solicitud
  loading.value = true
  errorCarga.value = null
  try {
    const r = await listTickets({ ...params(), page: page.value, per_page: perPage.value })
    if (mia !== solicitud) return
    tickets.value = r.data
    total.value = r.meta.total
  } catch (err) {
    if (mia !== solicitud) return
    tickets.value = []
    total.value = 0
    errorCarga.value =
      err instanceof HttpError
        ? `No se pudieron cargar los tickets: ${err.message}`
        : 'No se pudieron cargar los tickets.'
  } finally {
    if (mia === solicitud) loading.value = false
  }
}

function onOptions(o: { page: number; itemsPerPage: number }) {
  if (o.page === page.value && o.itemsPerPage === perPage.value) return
  if (o.itemsPerPage !== perPage.value) {
    perPage.value = o.itemsPerPage
    page.value = 1
  } else {
    page.value = o.page
  }
  sincronizarUrl(page.value)
}

function abrir(t: Ticket) {
  router.push({ name: 'TicketDetalle', params: { id: t.id } })
}
function onRowClick(_e: unknown, row: { item: Ticket }) {
  abrir(row.item)
}

const COLORES_TIPO: Record<string, string> = { EXCEPCION_DATEO: '#F59E0B' }
function colorPorTipo(codigo?: string | null) {
  return (codigo && COLORES_TIPO[codigo]) || '#6B7280'
}
const COLORES_ESTADO: Record<TicketEstado, string> = {
  PENDIENTE: '#F59E0B',
  APROBADO: '#16A34A',
  RECHAZADO: '#DC2626',
}
function colorPorEstado(estado: TicketEstado) {
  return COLORES_ESTADO[estado] ?? '#6B7280'
}
function turnoDeFila(t: Ticket) {
  const r = t.resumen
  return turnoVisible({
    turnoId: r?.turnoId ?? null,
    turnoNumero: r?.turnoNumero ?? null,
    servicioCodigo: r?.servicioCodigo ?? null,
    fecha: r?.turnoFecha ?? null,
  })
}
function nombreCreador(t: Ticket) {
  const u = t.creadoPor
  if (!u) return '—'
  return [u.nombres, u.apellidos].filter(Boolean).join(' ') || u.correo || `#${u.id}`
}

/* ═══════════ Exportar (Bearer: download() de http.ts, nunca window.open) ═══════════ */
const exportando = ref(false)
async function exportar() {
  exportando.value = true
  try {
    const p = vista.value === 'bandeja' ? params() : paramsEstadisticas.value
    const blob = await exportarTicketsExcel(p)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Tickets_${[p.fecha_desde, p.fecha_hasta].filter(Boolean).join('_') || 'todos'}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    configSnack.value = {
      show: true,
      color: 'error',
      text:
        err instanceof HttpError ? `No se pudo exportar: ${err.message}` : 'No se pudo exportar.',
    }
  } finally {
    exportando.value = false
  }
}

async function cargarPendientesPorTipo() {
  try {
    pendientesPorTipo.value = (await getContadorPendientesTickets()).por_tipo
  } catch {
    pendientesPorTipo.value = {}
  }
}

/* ═══════════ 🆕 Config: ventana de ticket (global + overrides por asesor) ═══════════ */
const puedeConfigurarVentana = computed(() => can.configurarVentanaTicket())

const configSnack = ref<{ show: boolean; text: string; color: 'success' | 'error' }>({
  show: false,
  text: '',
  color: 'success',
})

async function loadAsesores() {
  asesoresLoading.value = true
  try {
    asesoresItems.value = await listAgentesCaptacion()
  } catch {
    asesoresItems.value = []
  } finally {
    asesoresLoading.value = false
  }
}

const ventanaGlobal = ref<{
  valor: number | null
  original: number | null
  loading: boolean
  guardando: boolean
}>({
  valor: null,
  original: null,
  loading: false,
  guardando: false,
})

const ventanaGlobalCambiada = computed(() => {
  const { valor, original } = ventanaGlobal.value
  return valor !== null && valor > 0 && valor !== original
})

async function cargarVentanaGlobal() {
  ventanaGlobal.value.loading = true
  try {
    const res = await getVentanaTicketGlobal()
    ventanaGlobal.value.valor = res.minutos_ventana
    ventanaGlobal.value.original = res.minutos_ventana
  } catch {
    configSnack.value = { show: true, color: 'error', text: 'No se pudo cargar la ventana global.' }
  } finally {
    ventanaGlobal.value.loading = false
  }
}

async function guardarVentanaGlobal() {
  if (!ventanaGlobalCambiada.value || ventanaGlobal.value.valor === null) return
  ventanaGlobal.value.guardando = true
  try {
    const res = await setVentanaTicketGlobal(ventanaGlobal.value.valor)
    ventanaGlobal.value.valor = res.minutos_ventana
    ventanaGlobal.value.original = res.minutos_ventana
    configSnack.value = { show: true, color: 'success', text: '✅ Ventana global actualizada' }
  } catch {
    configSnack.value = {
      show: true,
      color: 'error',
      text: 'No se pudo guardar la ventana global.',
    }
  } finally {
    ventanaGlobal.value.guardando = false
  }
}

const ventanaAsesorOverrides = ref<VentanaTicketAsesorRow[]>([])
const ventanaAsesorLoading = ref(false)
const ventanaAsesorHeaders = [
  { title: 'Asesor', key: 'asesor', sortable: false },
  { title: 'Minutos de ventana', key: 'minutos_ventana', sortable: false },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

async function cargarVentanaAsesorOverrides() {
  ventanaAsesorLoading.value = true
  try {
    const res = await getVentanaTicketAsesores()
    ventanaAsesorOverrides.value = res.data
  } catch {
    ventanaAsesorOverrides.value = []
  } finally {
    ventanaAsesorLoading.value = false
  }
}

const ventanaAsesorForm = ref<{
  asesorId: number | null
  minutosVentana: number | null
  guardando: boolean
}>({
  asesorId: null,
  minutosVentana: null,
  guardando: false,
})

async function guardarVentanaAsesor() {
  if (!ventanaAsesorForm.value.asesorId || !ventanaAsesorForm.value.minutosVentana) return
  ventanaAsesorForm.value.guardando = true
  try {
    await setVentanaTicketAsesor(
      ventanaAsesorForm.value.asesorId,
      ventanaAsesorForm.value.minutosVentana,
    )
    await cargarVentanaAsesorOverrides()
    ventanaAsesorForm.value = { asesorId: null, minutosVentana: null, guardando: false }
    configSnack.value = { show: true, color: 'success', text: '✅ Override de ventana guardado' }
  } catch {
    configSnack.value = { show: true, color: 'error', text: 'No se pudo guardar el override.' }
  } finally {
    ventanaAsesorForm.value.guardando = false
  }
}

const dlgEliminarVentanaAsesor = ref<{
  visible: boolean
  item: VentanaTicketAsesorRow | null
  loading: boolean
}>({
  visible: false,
  item: null,
  loading: false,
})

function confirmarEliminarVentanaAsesor(item: VentanaTicketAsesorRow) {
  dlgEliminarVentanaAsesor.value = { visible: true, item, loading: false }
}

async function doEliminarVentanaAsesor() {
  const item = dlgEliminarVentanaAsesor.value.item
  if (!item) return
  dlgEliminarVentanaAsesor.value.loading = true
  try {
    await deleteVentanaTicketAsesor(item.id)
    await cargarVentanaAsesorOverrides()
    dlgEliminarVentanaAsesor.value = { visible: false, item: null, loading: false }
  } catch {
    configSnack.value = { show: true, color: 'error', text: 'No se pudo eliminar el override.' }
    dlgEliminarVentanaAsesor.value.loading = false
  }
}

onMounted(async () => {
  loadAsesores()
  listConveniosLight().then((c) => (conveniosItems.value = c))
  try {
    tipos.value = await listTiposTicket()
  } catch (err) {
    tipos.value = []
    errorCarga.value =
      err instanceof HttpError
        ? `No se pudieron cargar los tipos de ticket: ${err.message}`
        : 'No se pudieron cargar los tipos de ticket.'
  }
  if (vista.value === 'bandeja') cargar()
  if (puedeVerGerencia.value) {
    refrescarPendientes()
    cargarPendientesPorTipo()
  }
  if (puedeConfigurarVentana.value) {
    cargarVentanaGlobal()
    cargarVentanaAsesorOverrides()
  }
})
</script>

<style scoped>
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.bandeja :deep(tbody tr) {
  cursor: pointer;
}
</style>
