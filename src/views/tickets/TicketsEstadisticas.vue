<!-- src/views/tickets/TicketsEstadisticas.vue -->
<!-- Pestaña "Estadísticas por asesor" (solo SUPER_ADMIN/GERENCIA; el backend
     responde 403 a los demás). GET /tickets/estadisticas con los filtros de
     fecha, asesor, ventana y estado de la bandeja. -->
<template>
  <div>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
      {{ error }}
    </v-alert>

    <template v-if="datos">
      <v-alert
        v-if="datos.meta.tope_aplicado"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        Hay más de {{ datos.meta.limite_calculo_por_ticket }} tickets por calcular: los montos "en
        proceso" y lo estimado de "dejado de pagar" cubren solo los
        {{ datos.meta.limite_calculo_por_ticket }} más recientes. Acota el rango de fechas para
        verlos completos.
      </v-alert>

      <!-- Tarjetas de totales -->
      <v-row dense class="mb-3">
        <v-col v-for="t in tarjetas" :key="t.titulo" cols="6" sm="4" md="2">
          <v-card variant="tonal" :color="t.color" class="pa-3 h-100">
            <div class="text-caption">{{ t.titulo }}</div>
            <div class="text-h5 font-weight-bold">{{ t.valor }}</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Una fila por asesor comercial -->
      <v-data-table
        :headers="headers"
        :items="filas"
        item-value="comercial_id"
        :items-per-page="-1"
        :sort-by="[{ key: 'creados', order: 'desc' }]"
        density="compact"
        hide-default-footer
        class="tabla-asesores"
      >
        <template v-for="k in CLAVES_DINERO" :key="k" #[`item.${k}`]="{ item }">
          <span :class="{ estimado: k.endsWith('_proceso') }">{{ cop(item[k]) }}</span>
        </template>
        <template #item.dejado="{ item }">
          <div>{{ cop(item.dejado) }}</div>
          <div v-if="item.dejado" class="text-caption text-medium-emphasis">
            A {{ cop(item.dejado_asesor) }} · C {{ cop(item.dejado_convenio) }}
          </div>
        </template>
        <template #no-data>
          <div class="text-center py-4 text-medium-emphasis">
            Sin tickets de asesores comerciales con estos filtros.
          </div>
        </template>
        <template #tfoot="{ columns }">
          <tfoot v-if="filas.length">
            <tr class="fila-total">
              <td
                v-for="c in columns"
                :key="String(c.key)"
                :class="c.align === 'end' ? 'text-end' : ''"
              >
                <template v-if="c.key === 'nombre'">Total</template>
                <template v-else-if="c.key === 'dejado'">{{ cop(total.dejado) }}</template>
                <template v-else-if="esDinero(c.key)">{{ cop(total[c.key]) }}</template>
                <template v-else-if="c.key">{{ total[c.key as keyof TotalesFilas] }}</template>
              </td>
            </tr>
          </tfoot>
        </template>
      </v-data-table>

      <div class="text-caption text-medium-emphasis mt-2">
        <strong>Real</strong> = comisión ya creada (sin ANULADA).
        <span class="estimado">En proceso</span> = ticket aprobado con Facturación sin confirmar,
        estimado con la configuración vigente. <strong>Dejado de pagar</strong> = lo que no se pagó
        por las decisiones "sin comisión" (A = asesor, C = convenio).
      </div>
      <div v-if="ticketsFuera > 0" class="text-caption text-medium-emphasis mt-1">
        {{ ticketsFuera }} ticket{{ ticketsFuera === 1 ? '' : 's' }} de asesores convenio (que se
        datean a sí mismos) cuentan en las tarjetas pero no en la tabla.
      </div>

      <!-- Gráficos -->
      <v-row dense class="mt-3">
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-3">
            <div class="text-subtitle-2 font-weight-bold mb-2">Dentro vs fuera de ventana</div>
            <div class="grafico"><Doughnut :data="graficoVentana" :options="opcionesDona" /></div>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-3">
            <div class="text-subtitle-2 font-weight-bold mb-2">Aprobados vs rechazados</div>
            <div class="grafico"><Bar :data="graficoResolucion" :options="opcionesBarras" /></div>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  getEstadisticasTickets,
  type EstadisticasTickets,
  type ListTicketsParams,
} from '@/services/ticketsService'
import { HttpError } from '@/services/http'
import { filasPorAsesor, totalesDeFilas, type TotalesFilas } from './estadisticasPorAsesor'

ChartJS.register(Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale)

const props = defineProps<{
  params: ListTicketsParams
  /** Ids de los asesores comerciales: solo ellos tienen fila en la tabla. */
  comercialesIds: number[]
}>()

const datos = ref<EstadisticasTickets | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const formatoCop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
const cop = (v: number) => formatoCop.format(v || 0)

const CLAVES_DINERO = [
  'asesor_real',
  'asesor_proceso',
  'convenio_real',
  'convenio_proceso',
] as const
const esDinero = (k: unknown): k is (typeof CLAVES_DINERO)[number] =>
  (CLAVES_DINERO as readonly unknown[]).includes(k)

const tabla = computed(() => {
  if (!datos.value) return { filas: [], ticketsFuera: 0 }
  const ids = new Set(props.comercialesIds)
  return filasPorAsesor(datos.value, (id) => ids.has(id))
})
const filas = computed(() => tabla.value.filas)
const ticketsFuera = computed(() => tabla.value.ticketsFuera)
const total = computed(() => totalesDeFilas(filas.value))

const tot = computed(() => datos.value!.totales)

const tarjetas = computed(() => {
  const t = tot.value
  return [
    { titulo: 'Creados', valor: t.creados, color: 'primary' },
    { titulo: 'Dentro de ventana', valor: t.dentro_ventana, color: 'success' },
    { titulo: 'Fuera de ventana', valor: t.fuera_ventana, color: 'warning' },
    { titulo: 'Aprobados', valor: t.aprobados.total, color: 'success' },
    { titulo: 'Rechazados', valor: t.rechazados, color: 'error' },
    { titulo: 'Pendientes', valor: t.pendientes, color: 'amber' },
  ]
})

// Anchos fijos y títulos cortos: la tabla entera cabe en la tarjeta sin scroll lateral.
const num = { align: 'end' as const, sortable: true, width: 76 }
const dinero = { align: 'end' as const, sortable: true, width: 104 }
const headers = [
  { title: 'Asesor', key: 'nombre', sortable: true },
  { title: 'Creados', key: 'creados', ...num },
  { title: 'Dentro', key: 'dentro', ...num },
  { title: 'Fuera', key: 'fuera', ...num },
  { title: 'Aprob.', key: 'aprobados', ...num },
  { title: 'Rech.', key: 'rechazados', ...num },
  { title: 'Pend.', key: 'pendientes', ...num },
  {
    title: 'Comisión asesor',
    align: 'center' as const,
    children: [
      { title: 'Real', key: 'asesor_real', ...dinero },
      { title: 'En proceso', key: 'asesor_proceso', ...dinero },
    ],
  },
  {
    title: 'Comisión convenio',
    align: 'center' as const,
    children: [
      { title: 'Real', key: 'convenio_real', ...dinero },
      { title: 'En proceso', key: 'convenio_proceso', ...dinero },
    ],
  },
  { title: 'Dejado de pagar', key: 'dejado', ...dinero, width: 150 },
]

const graficoVentana = computed(() => ({
  labels: ['Dentro de ventana', 'Fuera de ventana'],
  datasets: [
    {
      data: [tot.value.dentro_ventana, tot.value.fuera_ventana],
      backgroundColor: ['#16A34A', '#F59E0B'],
    },
  ],
}))
const graficoResolucion = computed(() => ({
  labels: ['Aprobados', 'Rechazados', 'Pendientes'],
  datasets: [
    {
      label: 'Tickets',
      data: [tot.value.aprobados.total, tot.value.rechazados, tot.value.pendientes],
      backgroundColor: ['#16A34A', '#DC2626', '#9CA3AF'],
    },
  ],
}))
const opcionesDona = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } },
}
const opcionesBarras = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
}

async function cargar() {
  loading.value = true
  error.value = null
  try {
    datos.value = await getEstadisticasTickets(props.params)
  } catch (err) {
    datos.value = null
    error.value =
      err instanceof HttpError && err.status === 403
        ? 'No tienes permiso para ver las estadísticas de tickets.'
        : err instanceof HttpError
          ? err.message
          : 'No se pudieron cargar las estadísticas.'
  } finally {
    loading.value = false
  }
}

watch(() => JSON.stringify(props.params), cargar, { immediate: true })
</script>

<style scoped>
.grafico {
  position: relative;
  height: 220px;
}
.estimado {
  text-decoration: underline dotted;
}
.tabla-asesores :deep(td),
.tabla-asesores :deep(th) {
  padding-left: 8px !important;
  padding-right: 8px !important;
}
.tabla-asesores :deep(td) {
  vertical-align: top;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  white-space: nowrap;
}
.tabla-asesores :deep(th) {
  white-space: nowrap;
}
/* El nombre del asesor puede partir en dos líneas; los números no. */
.tabla-asesores :deep(td:first-child) {
  white-space: normal;
  min-width: 160px;
}
.fila-total td {
  font-weight: 700;
  border-top: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
