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
        Hay más de {{ datos.meta.limite_calculo_por_ticket }} tickets por calcular: la comisión "por
        generar" y lo estimado de "quitada" cubren solo los
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

      <!-- Qué significan las columnas de plata -->
      <div class="text-body-2 text-medium-emphasis mb-2" data-test="explicacion-plata">
        Las columnas de plata suman asesor y convenio. <strong>Generada</strong>: ya está en
        Comisiones. <strong>Por generar</strong>: ticket aprobado, falta que Facturación confirme
        (estimado). <strong>Quitada</strong>: lo que no se pagó por decisiones "sin comisión". Haz
        clic en una fila para ver asesor y convenio por separado.
      </div>

      <!-- Una fila por asesor comercial; clic = detalle -->
      <v-data-table
        v-model:expanded="expandidas"
        :headers="headers"
        :items="filas"
        :item-value="(f: FilaAsesor) => String(f.comercial_id)"
        :items-per-page="-1"
        :sort-by="[{ key: 'creados', order: 'desc' }]"
        density="compact"
        hide-default-footer
        hover
        class="tabla-asesores"
        @click:row="alternar"
      >
        <template #header.por_generar="{ column, isSorted, getSortIcon }">
          <span class="d-inline-flex align-center ga-1">
            {{ column.title }}
            <v-tooltip location="top" max-width="300">
              <template #activator="{ props: tip }">
                <v-icon v-bind="tip" size="16" color="info" data-test="info-por-generar"
                  >mdi-information-outline</v-icon
                >
              </template>
              Tickets aprobados cuya Facturación todavía no se confirma: la comisión aún no existe.
              El valor es un estimado con la configuración de comisiones vigente.
            </v-tooltip>
            <v-icon v-if="isSorted(column)" :icon="getSortIcon(column)" size="16" />
          </span>
        </template>
        <template #item.nombre="{ item, internalItem, isExpanded }">
          <span class="d-inline-flex align-center ga-1">
            <v-icon size="18">{{
              isExpanded(internalItem) ? 'mdi-chevron-down' : 'mdi-chevron-right'
            }}</v-icon>
            {{ item.nombre }}
          </span>
        </template>
        <template v-for="k in CLAVES_DINERO" :key="k" #[`item.${k}`]="{ item }">
          {{ cop(item[k]) }}
        </template>

        <template #expanded-row="{ columns, item }">
          <tr class="fila-detalle">
            <td :colspan="columns.length">
              <v-row dense class="py-2" data-test="detalle-fila">
                <v-col cols="12" md="4">
                  <div class="text-caption font-weight-bold mb-1">Comisión generada</div>
                  <div>Asesor: {{ cop(item.asesor_real) }}</div>
                  <div>Convenio: {{ cop(item.convenio_real) }}</div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="text-caption font-weight-bold mb-1">
                    Comisión por generar <span class="text-medium-emphasis">(estimado)</span>
                  </div>
                  <div>Asesor: {{ cop(item.asesor_proceso) }}</div>
                  <div>Convenio: {{ cop(item.convenio_proceso) }}</div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="text-caption font-weight-bold mb-1">Comisión quitada</div>
                  <div>Asesor: {{ cop(item.dejado_asesor) }}</div>
                  <div>Convenio: {{ cop(item.dejado_convenio) }}</div>
                  <div v-if="item.dejado" class="text-caption text-medium-emphasis mt-1">
                    Exacta (valor guardado al aprobar): {{ cop(item.dejado_exacto) }} · Estimada:
                    {{ cop(item.dejado_estimado) }}
                  </div>
                </v-col>
              </v-row>
            </td>
          </tr>
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
                <template v-else-if="esDinero(c.key)">{{ cop(total[c.key]) }}</template>
                <template v-else-if="c.key">{{ total[c.key as keyof TotalesFilas] }}</template>
              </td>
            </tr>
          </tfoot>
        </template>
      </v-data-table>

      <div v-if="ticketsFuera > 0" class="text-caption text-medium-emphasis mt-2">
        {{ ticketsFuera }} ticket{{ ticketsFuera === 1 ? '' : 's' }} de asesores convenio (el asesor
        convenio se datea a sí mismo) se cuentan en las tarjetas de arriba, pero no tienen fila en
        esta tabla, que es solo de asesores comerciales.
      </div>

      <!-- Gráficos -->
      <v-row dense class="mt-3">
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="pa-3">
            <div class="text-subtitle-2 font-weight-bold mb-2">A tiempo vs tarde</div>
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
import {
  filasPorAsesor,
  totalesDeFilas,
  type FilaAsesor,
  type TotalesFilas,
} from './estadisticasPorAsesor'

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

const CLAVES_DINERO = ['generada', 'por_generar', 'dejado'] as const
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

// Filas abiertas (clic en la fila).
const expandidas = ref<string[]>([])
function alternar(_e: unknown, row: { item: FilaAsesor }) {
  const id = String(row.item.comercial_id)
  expandidas.value = expandidas.value.includes(id)
    ? expandidas.value.filter((x) => x !== id)
    : [...expandidas.value, id]
}

const tot = computed(() => datos.value!.totales)

const tarjetas = computed(() => {
  const t = tot.value
  return [
    { titulo: 'Creados', valor: t.creados, color: 'primary' },
    { titulo: 'A tiempo', valor: t.dentro_ventana, color: 'success' },
    { titulo: 'Tarde', valor: t.fuera_ventana, color: 'warning' },
    { titulo: 'Aprobados', valor: t.aprobados.total, color: 'success' },
    { titulo: 'Rechazados', valor: t.rechazados, color: 'error' },
    { titulo: 'Pendientes', valor: t.pendientes, color: 'amber' },
  ]
})

const num = { align: 'end' as const, sortable: true }
const headers = [
  { title: 'Asesor', key: 'nombre', sortable: true },
  { title: 'Tickets', key: 'creados', ...num },
  { title: 'A tiempo', key: 'dentro', ...num },
  { title: 'Tarde', key: 'fuera', ...num },
  { title: 'Aprobados', key: 'aprobados', ...num },
  { title: 'Rechazados', key: 'rechazados', ...num },
  { title: 'Pendientes', key: 'pendientes', ...num },
  { title: 'Comisión generada', key: 'generada', ...num },
  { title: 'Comisión por generar', key: 'por_generar', ...num },
  { title: 'Comisión quitada', key: 'dejado', ...num },
]

const graficoVentana = computed(() => ({
  labels: ['A tiempo', 'Tarde'],
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
.tabla-asesores :deep(td),
.tabla-asesores :deep(th) {
  padding-left: 8px !important;
  padding-right: 8px !important;
}
.tabla-asesores :deep(tbody tr:not(.fila-detalle)) {
  cursor: pointer;
}
.tabla-asesores :deep(td) {
  white-space: nowrap;
}
.tabla-asesores :deep(th) {
  white-space: nowrap;
}
.tabla-asesores :deep(.fila-detalle td) {
  white-space: normal;
  background: rgba(var(--v-theme-on-surface), 0.03);
}
.fila-total td {
  font-weight: 700;
  border-top: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
