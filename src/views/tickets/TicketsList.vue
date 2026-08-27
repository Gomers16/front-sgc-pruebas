<!-- src/views/tickets/TicketsList.vue -->
<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-4 px-4 px-sm-6 d-flex align-center justify-space-between flex-wrap gap-3">
        <div class="text-h5 font-weight-bold">🎫 Tickets</div>

        <!-- Un solo tipo disponible (hoy): navega directo, sin menú -->
        <v-btn
          v-if="tiposDisponibles.length === 1"
          color="primary"
          prepend-icon="mdi-plus"
          @click="irACrear(tiposDisponibles[0])"
        >
          Nuevo ticket
        </v-btn>

        <!-- Más de un tipo disponible (futuro): pregunta cuál -->
        <v-menu v-else-if="tiposDisponibles.length > 1" :close-on-content-click="true" location="bottom end">
          <template #activator="{ props }">
            <v-btn v-bind="props" color="primary" prepend-icon="mdi-plus">Nuevo ticket</v-btn>
          </template>
          <v-list density="compact">
            <v-list-item
              v-for="tipo in tiposDisponibles"
              :key="tipo.codigo"
              :title="tipo.nombre"
              @click="irACrear(tipo)"
            />
          </v-list>
        </v-menu>
      </v-card-title>

      <!-- 🆕 Configuración: ventana de ticket sin penalización (global + overrides por asesor) -->
      <v-expansion-panels v-if="puedeConfigurarVentana" variant="accordion" class="mx-4 mx-sm-6 mb-4">
        <v-expansion-panel title="⚙️ Ventana de ticket sin penalización (Excepción de Dateo)">
          <v-expansion-panel-text>
            <v-row dense align="end" class="mb-3">
              <v-col cols="8" sm="4" md="3">
                <v-text-field
                  v-model.number="ventanaGlobal.valor"
                  label="Minutos globales sin penalización"
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
                  label="Minutos sin penalización"
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

      <v-tabs v-model="tabActiva" class="px-4 px-sm-6" density="compact" show-arrows>
        <v-tab value="TODOS">
          Todos
          <v-chip size="x-small" class="ml-2">{{ tickets.length }}</v-chip>
        </v-tab>
        <v-tab v-for="tipo in tiposEnLista" :key="tipo.codigo" :value="tipo.codigo">
          <span class="dot mr-2" :style="{ backgroundColor: colorPorTipo(tipo.codigo) }" />
          {{ tipo.nombre }}
          <v-chip size="x-small" class="ml-2">{{ conteoPorTipo(tipo.codigo) }}</v-chip>
        </v-tab>
      </v-tabs>

      <v-card-text class="px-4 px-sm-6 pt-2">
        <v-row dense class="mb-2">
          <v-col cols="6" sm="4" md="3">
            <v-select
              v-model="filtroEstado"
              :items="estadoItems"
              label="Estado"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
        </v-row>

        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />

        <v-alert v-if="!loading && ticketsFiltrados.length === 0" type="info" variant="tonal" class="mb-2">
          No hay tickets para mostrar con estos filtros.
        </v-alert>

        <v-list v-if="!loading && ticketsFiltrados.length > 0" lines="two" class="inbox-list">
          <v-list-item
            v-for="t in ticketsFiltrados"
            :key="t.id"
            :to="{ name: 'TicketDetalle', params: { id: t.id } }"
            link
            class="inbox-row"
          >
            <template #prepend>
              <span class="dot" :style="{ backgroundColor: colorPorTipo(t.tipoTicket?.codigo) }" />
            </template>

            <v-list-item-title class="font-weight-600">{{ t.titulo }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ t.tipoTicket?.nombre ?? '—' }} · creado por {{ nombreCreador(t) }}
            </v-list-item-subtitle>

            <template #append>
              <div class="d-flex flex-column align-end">
                <span class="text-caption text-medium-emphasis">{{ formatDateTime(t.createdAt) }}</span>
                <span class="text-caption font-weight-600" :style="{ color: colorPorEstado(t.estado) }">
                  {{ estadoLabel(t.estado) }}
                </span>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Confirmar eliminar override de ventana -->
    <v-dialog v-model="dlgEliminarVentanaAsesor.visible" max-width="420">
      <v-card>
        <v-card-title class="text-subtitle-1 font-weight-bold">Eliminar override</v-card-title>
        <v-card-text>
          ¿Eliminar el override de ventana de
          <strong>{{ dlgEliminarVentanaAsesor.item?.asesor_nombre || `#${dlgEliminarVentanaAsesor.item?.asesor_id}` }}</strong>?
          Volverá a usar la ventana global.
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="dlgEliminarVentanaAsesor.visible = false">Cancelar</v-btn>
          <v-btn color="error" :loading="dlgEliminarVentanaAsesor.loading" @click="doEliminarVentanaAsesor">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  listTickets,
  listTiposTicket,
  getVentanaTicketGlobal,
  setVentanaTicketGlobal,
  getVentanaTicketAsesores,
  setVentanaTicketAsesor,
  deleteVentanaTicketAsesor,
  type Ticket,
  type TicketEstado,
  type TipoTicketLight,
  type VentanaTicketAsesorRow,
} from '@/services/ticketsService'
import { formatDateTime } from '@/services/dateosService'
import { listAgentesCaptacion } from '@/services/conveniosService'
import { usePermissions } from '@/composables/usePermissions'

const router = useRouter()
const { can } = usePermissions()

const tickets = ref<Ticket[]>([])
const tiposCreables = ref<TipoTicketLight[]>([])
const loading = ref(false)
const tabActiva = ref('TODOS')
const filtroEstado = ref<TicketEstado | null>(null)

const estadoItems = [
  { title: 'Pendiente', value: 'PENDIENTE' },
  { title: 'Aprobado', value: 'APROBADO' },
  { title: 'Rechazado', value: 'RECHAZADO' },
  { title: 'Resuelto', value: 'RESUELTO' },
  { title: 'Cerrado', value: 'CERRADO' },
]

// Mapeo codigo → nombre de ruta de creación. A propósito hardcodeado: cada
// tipo de ticket nuevo siempre va a necesitar su propia vista Vue de todos
// modos (eso no es lo que GET /tipos-ticket resuelve). Lo que SÍ viene del
// backend ahora es roles_creador — este mapeo ya no lo duplica.
const RUTA_CREAR_POR_CODIGO: Record<string, string> = {
  EXCEPCION_DATEO: 'TicketExcepcionDateoCreate',
}

// 🆕 Tipos de ticket que el usuario autenticado puede crear — vienen ya
// filtrados por roles_creador desde el backend (GET /tipos-ticket, ver
// tickets_controller.ts::tiposIndex()), no se vuelve a filtrar por rol acá.
const tiposDisponibles = computed(() => tiposCreables.value)

const COLORES_TIPO: Record<string, string> = {
  EXCEPCION_DATEO: '#F59E0B',
}
function colorPorTipo(codigo?: string | null) {
  return (codigo && COLORES_TIPO[codigo]) || '#6B7280'
}

const COLORES_ESTADO: Record<TicketEstado, string> = {
  PENDIENTE: '#F59E0B',
  APROBADO: '#16A34A',
  RECHAZADO: '#DC2626',
  RESUELTO: '#2563EB',
  CERRADO: '#6B7280',
}
function colorPorEstado(estado: TicketEstado) {
  return COLORES_ESTADO[estado] ?? '#6B7280'
}
function estadoLabel(estado: TicketEstado) {
  return estadoItems.find((e) => e.value === estado)?.title ?? estado
}

function nombreCreador(t: Ticket) {
  const u = t.creadoPor
  if (!u) return '—'
  return [u.nombres, u.apellidos].filter(Boolean).join(' ') || u.correo || `#${u.id}`
}

// 🆕 Pestañas derivadas de GET /tipos-ticket (tipos que el usuario puede
// CREAR), no de los tickets ya cargados — así un tipo con cero tickets
// todavía sigue apareciendo si el usuario tiene permiso de crearlo.
const tiposEnLista = computed(() => tiposCreables.value)

function conteoPorTipo(codigo: string) {
  return tickets.value.filter((t) => t.tipoTicket?.codigo === codigo).length
}

const ticketsFiltrados = computed(() => {
  let out = tickets.value
  if (tabActiva.value !== 'TODOS') {
    out = out.filter((t) => t.tipoTicket?.codigo === tabActiva.value)
  }
  if (filtroEstado.value) {
    out = out.filter((t) => t.estado === filtroEstado.value)
  }
  return out
})

async function cargar() {
  loading.value = true
  try {
    const [ticketsData, tiposData] = await Promise.all([listTickets(), listTiposTicket()])
    tickets.value = ticketsData
    tiposCreables.value = tiposData
  } finally {
    loading.value = false
  }
}

function irACrear(tipo: TipoTicketLight) {
  const routeName = RUTA_CREAR_POR_CODIGO[tipo.codigo]
  if (!routeName) return
  router.push({ name: routeName })
}

/* ═══════════ 🆕 Config: ventana de ticket sin penalización (global + overrides por asesor) ═══════════ */
const puedeConfigurarVentana = computed(() => can.configurarVentanaTicket())

const configSnack = ref<{ show: boolean; text: string; color: 'success' | 'error' }>({
  show: false,
  text: '',
  color: 'success',
})

const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)
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

const ventanaGlobal = ref<{ valor: number | null; original: number | null; loading: boolean; guardando: boolean }>({
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
    configSnack.value = { show: true, color: 'error', text: 'No se pudo guardar la ventana global.' }
  } finally {
    ventanaGlobal.value.guardando = false
  }
}

const ventanaAsesorOverrides = ref<VentanaTicketAsesorRow[]>([])
const ventanaAsesorLoading = ref(false)
const ventanaAsesorHeaders = [
  { title: 'Asesor', key: 'asesor', sortable: false },
  { title: 'Minutos sin penalización', key: 'minutos_ventana', sortable: false },
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

const ventanaAsesorForm = ref<{ asesorId: number | null; minutosVentana: number | null; guardando: boolean }>({
  asesorId: null,
  minutosVentana: null,
  guardando: false,
})

async function guardarVentanaAsesor() {
  if (!ventanaAsesorForm.value.asesorId || !ventanaAsesorForm.value.minutosVentana) return
  ventanaAsesorForm.value.guardando = true
  try {
    await setVentanaTicketAsesor(ventanaAsesorForm.value.asesorId, ventanaAsesorForm.value.minutosVentana)
    await cargarVentanaAsesorOverrides()
    ventanaAsesorForm.value = { asesorId: null, minutosVentana: null, guardando: false }
    configSnack.value = { show: true, color: 'success', text: '✅ Override de ventana guardado' }
  } catch {
    configSnack.value = { show: true, color: 'error', text: 'No se pudo guardar el override.' }
  } finally {
    ventanaAsesorForm.value.guardando = false
  }
}

const dlgEliminarVentanaAsesor = ref<{ visible: boolean; item: VentanaTicketAsesorRow | null; loading: boolean }>({
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

onMounted(() => {
  cargar()
  if (puedeConfigurarVentana.value) {
    loadAsesores()
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

.inbox-row {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
