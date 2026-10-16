<!-- src/views/tickets/TicketsEstadisticas.vue -->
<!-- Pestaña "Estadísticas" de la bandeja (solo SUPER_ADMIN/GERENCIA; el
     backend responde 403 a los demás). Recibe los filtros de fecha / asesor /
     convenio de la bandeja (GET /tickets/estadisticas). -->
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
      <v-row dense class="mb-2">
        <v-col v-for="t in tarjetas" :key="t.titulo" cols="6" sm="4" md="3" lg="2">
          <v-card variant="tonal" :color="t.color" class="pa-3 h-100">
            <div class="text-caption">{{ t.titulo }}</div>
            <div class="text-h6 font-weight-bold">{{ t.valor }}</div>
            <div v-if="t.detalle" class="text-caption text-medium-emphasis">{{ t.detalle }}</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Dinero (totales) -->
      <v-row dense class="mb-2">
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-3 h-100">
            <div class="text-subtitle-2 font-weight-bold mb-1">Comisión real</div>
            <div class="text-body-2">
              Asesor: <strong>{{ cop(tot.dinero.comision_real.asesor) }}</strong>
            </div>
            <div class="text-body-2">
              Convenio: <strong>{{ cop(tot.dinero.comision_real.convenio) }}</strong>
            </div>
            <div class="d-flex flex-wrap gap-1 mt-2">
              <v-chip
                v-for="(m, estado) in tot.dinero.comision_real.por_estado"
                :key="estado"
                size="x-small"
                :color="COLOR_ESTADO_COMISION[estado] ?? 'grey'"
                variant="tonal"
              >
                {{ estado }}: {{ m.tickets }} · {{ cop(m.asesor + m.convenio) }}
              </v-chip>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">Los totales excluyen ANULADA.</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-3 h-100">
            <div class="text-subtitle-2 font-weight-bold mb-1">
              En proceso
              <v-chip size="x-small" color="info" variant="tonal" class="ml-1">estimado</v-chip>
            </div>
            <div class="text-body-2">
              Asesor: <strong>{{ cop(tot.dinero.en_proceso.asesor) }}</strong>
            </div>
            <div class="text-body-2">
              Convenio: <strong>{{ cop(tot.dinero.en_proceso.convenio) }}</strong>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ tot.dinero.en_proceso.tickets }} tickets aprobados sin comisión todavía
              (Facturación sin confirmar). Calculado con la configuración vigente.
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-3 h-100">
            <div class="text-subtitle-2 font-weight-bold mb-1">Dejado de pagar</div>
            <div class="text-body-2">
              Asesor: <strong>{{ cop(tot.dinero.dejado_de_pagar.asesor) }}</strong>
            </div>
            <div class="text-body-2">
              Convenio: <strong>{{ cop(tot.dinero.dejado_de_pagar.convenio) }}</strong>
            </div>
            <div class="text-caption mt-1">
              <v-chip size="x-small" color="success" variant="tonal" class="mr-1">exacto</v-chip>
              {{
                cop(
                  tot.dinero.dejado_de_pagar.exacto.asesor +
                    tot.dinero.dejado_de_pagar.exacto.convenio,
                )
              }}
              ({{ tot.dinero.dejado_de_pagar.exacto.tickets }} tickets)
            </div>
            <div class="text-caption mt-1">
              <v-chip size="x-small" color="info" variant="tonal" class="mr-1">estimado</v-chip>
              {{
                cop(
                  tot.dinero.dejado_de_pagar.estimado.asesor +
                    tot.dinero.dejado_de_pagar.estimado.convenio,
                )
              }}
              ({{ tot.dinero.dejado_de_pagar.estimado.tickets }} tickets)
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Gráficos -->
      <v-row dense class="mb-2">
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

      <!-- Tabla por asesor -->
      <v-data-table
        :headers="headers"
        :items="datos.por_asesor"
        item-value="comercial_id"
        density="compact"
        class="tabla-asesores"
        :items-per-page="25"
      >
        <template #header.comercial_nombre>
          Asesor
          <v-tooltip location="top" max-width="320">
            <template #activator="{ props: p }">
              <v-icon v-bind="p" size="small" class="ml-1">mdi-information-outline</v-icon>
            </template>
            Es el asesor del ticket. En el Caso 2 (asesor convenio que se datea a sí mismo) es el
            propio asesor convenio: asesor y convenio son la misma persona.
          </v-tooltip>
        </template>
        <template #item.comercial_nombre="{ item }">
          {{ item.comercial_nombre ?? `#${item.comercial_id}` }}
        </template>
        <template #item.ventana="{ item }"
          >{{ item.dentro_ventana }} / {{ item.fuera_ventana }}</template
        >
        <template #item.decisiones="{ item }">
          <div class="text-caption">
            {{ item.aprobados.total }} ·
            <span title="Con comisión completa">✓{{ item.aprobados.con }}</span>
            <span title="Sin comisión asesor"> A{{ item.aprobados.sin_asesor }}</span>
            <span title="Sin comisión convenio"> C{{ item.aprobados.sin_convenio }}</span>
            <span title="Sin comisión para ninguno"> ∅{{ item.aprobados.sin_ninguno }}</span>
            <span title="Régimen anterior"> R{{ item.aprobados.regimen_anterior }}</span>
          </div>
        </template>
        <template #item.tasa="{ item }">{{ porcentaje(item.tasa_aprobacion) }}</template>
        <template #item.tiempo="{ item }">{{
          minutos(item.tiempo_promedio_resolucion_min)
        }}</template>
        <template #item.real="{ item }">
          <div class="text-caption">
            A {{ cop(item.dinero.comision_real.asesor) }}<br />C
            {{ cop(item.dinero.comision_real.convenio) }}
          </div>
          <div class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="(m, estado) in conTickets(item.dinero.comision_real.por_estado)"
              :key="estado"
              size="x-small"
              :color="COLOR_ESTADO_COMISION[estado] ?? 'grey'"
              variant="tonal"
            >
              {{ estado }} {{ m.tickets }}
            </v-chip>
          </div>
        </template>
        <template #item.en_proceso="{ item }">
          <div class="text-caption estimado" title="Estimado con la configuración vigente">
            A {{ cop(item.dinero.en_proceso.asesor) }}<br />C
            {{ cop(item.dinero.en_proceso.convenio) }}
          </div>
        </template>
        <template #item.dejado="{ item }">
          <div class="text-caption">
            A {{ cop(item.dinero.dejado_de_pagar.asesor) }}<br />C
            {{ cop(item.dinero.dejado_de_pagar.convenio) }}
          </div>
          <div class="text-caption text-medium-emphasis">
            <span class="exacto"
              >exacto
              {{
                cop(
                  item.dinero.dejado_de_pagar.exacto.asesor +
                    item.dinero.dejado_de_pagar.exacto.convenio,
                )
              }}</span
            >
            ·
            <span class="estimado"
              >est.
              {{
                cop(
                  item.dinero.dejado_de_pagar.estimado.asesor +
                    item.dinero.dejado_de_pagar.estimado.convenio,
                )
              }}</span
            >
          </div>
        </template>
        <template #no-data>
          <div class="text-center py-4 text-medium-emphasis">Sin tickets con estos filtros.</div>
        </template>
      </v-data-table>
      <div class="text-caption text-medium-emphasis mt-2">
        A = asesor · C = convenio. <span class="estimado">Subrayado punteado</span> = estimado con
        la configuración vigente; <span class="exacto">exacto</span> = valor calculado guardado al
        aprobar.
      </div>
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
  type MontosTicket,
} from '@/services/ticketsService'
import { HttpError } from '@/services/http'

ChartJS.register(Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale)

const props = defineProps<{ params: ListTicketsParams }>()

const datos = ref<EstadisticasTickets | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const COLOR_ESTADO_COMISION: Record<string, string> = {
  PENDIENTE: 'warning',
  APROBADA: 'info',
  PAGADA: 'success',
  ANULADA: 'grey',
}

const formatoCop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
const cop = (v: number) => formatoCop.format(v || 0)
const porcentaje = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`)
const minutos = (v: number | null) => {
  if (v === null) return '—'
  return v >= 60 ? `${Math.floor(v / 60)} h ${Math.round(v % 60)} min` : `${Math.round(v)} min`
}
const conTickets = (porEstado: Record<string, MontosTicket>) =>
  Object.fromEntries(Object.entries(porEstado).filter(([, m]) => m.tickets > 0))

const tot = computed(() => datos.value!.totales)

const tarjetas = computed(() => {
  const t = tot.value
  return [
    { titulo: 'Creados', valor: t.creados, color: 'primary' },
    { titulo: 'Dentro de ventana', valor: t.dentro_ventana, color: 'success' },
    { titulo: 'Fuera de ventana', valor: t.fuera_ventana, color: 'warning' },
    {
      titulo: 'Aprobados',
      valor: t.aprobados.total,
      color: 'success',
      detalle: `Con comisión completa ${t.aprobados.con}`,
    },
    { titulo: 'Sin comisión asesor', valor: t.aprobados.sin_asesor, color: 'orange' },
    { titulo: 'Sin comisión convenio', valor: t.aprobados.sin_convenio, color: 'orange' },
    { titulo: 'Sin comisión (ninguno)', valor: t.aprobados.sin_ninguno, color: 'deep-orange' },
    { titulo: 'Régimen anterior', valor: t.aprobados.regimen_anterior, color: 'grey' },
    { titulo: 'Rechazados', valor: t.rechazados, color: 'error' },
    { titulo: 'Pendientes', valor: t.pendientes, color: 'amber' },
    { titulo: 'Tasa de aprobación', valor: porcentaje(t.tasa_aprobacion), color: 'info' },
    {
      titulo: 'Resolución promedio',
      valor: minutos(t.tiempo_promedio_resolucion_min),
      color: 'info',
    },
  ]
})

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

const headers = [
  { title: 'Asesor', key: 'comercial_nombre', sortable: true },
  { title: 'Creados', key: 'creados', sortable: true },
  { title: 'Dentro / fuera', key: 'ventana', sortable: false },
  { title: 'Aprobados', key: 'decisiones', sortable: false },
  { title: 'Rechazados', key: 'rechazados', sortable: true },
  { title: 'Pendientes', key: 'pendientes', sortable: true },
  { title: 'Tasa', key: 'tasa', sortable: false },
  { title: 'Resolución', key: 'tiempo', sortable: false },
  { title: 'Comisión real', key: 'real', sortable: false },
  { title: 'En proceso (est.)', key: 'en_proceso', sortable: false },
  { title: 'Dejado de pagar', key: 'dejado', sortable: false },
]

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
.exacto {
  color: rgb(var(--v-theme-success));
}
.tabla-asesores :deep(td) {
  vertical-align: top;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}
</style>
