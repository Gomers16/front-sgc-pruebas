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
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  listTickets,
  listTiposTicket,
  type Ticket,
  type TicketEstado,
  type TipoTicketLight,
} from '@/services/ticketsService'
import { formatDateTime } from '@/services/dateosService'

const router = useRouter()

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

onMounted(cargar)
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
