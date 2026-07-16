<!-- src/views/reportes/ReporteMetaMensual.vue -->
<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-target</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Meta Mensual</div>
            <div class="text-medium-emphasis">
              Avance de turnos RTM (Livianos + Motos) vs. meta del mes
            </div>
          </div>
        </div>

        <v-chip
          v-if="resumen"
          :color="colorSemaforo(resumen.semaforo.general)"
          variant="flat"
          size="large"
          prepend-icon="mdi-circle"
        >
          {{ resumen.semaforo.general }}
        </v-chip>
      </v-card-title>

      <v-divider />

      <!-- FILTROS -->
      <v-card-text>
        <v-row align="center" dense>
          <v-col cols="6" sm="3" md="2">
            <v-select
              v-model="mesSeleccionado"
              :items="MESES"
              item-title="label"
              item-value="value"
              label="Mes"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="3" md="2">
            <v-text-field
              v-model.number="anioSeleccionado"
              label="Año"
              type="number"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              :loading="loading"
              block
              @click="cargarTodo"
            >
              Generar reporte
            </v-btn>
          </v-col>
          <v-col cols="12" md="5" class="text-md-right">
            <v-chip :color="colorFuente(fuenteDatos)" variant="tonal" size="small">
              {{ etiquetaFuente(fuenteDatos) }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- KPIs -->
    <v-row class="mb-2" dense>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card" :class="borderSemaforo(resumen?.semaforo.general)">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">Total General</div>
            <div class="text-h5 font-weight-bold">
              {{ formatNum(resumen?.kpis.total_general.avance) }} / {{ formatNum(resumen?.kpis.total_general.meta) }}
            </div>
            <div class="text-caption">{{ formatPct(resumen?.kpis.total_general.pct_avance) }} de la meta</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">Livianos</div>
            <div class="text-h5 font-weight-bold">
              {{ formatNum(resumen?.kpis.livianos.avance) }} / {{ formatNum(resumen?.kpis.livianos.meta) }}
            </div>
            <div class="text-caption">{{ formatPct(resumen?.kpis.livianos.pct_avance) }} de la meta</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">Motos</div>
            <div class="text-h5 font-weight-bold">
              {{ formatNum(resumen?.kpis.motos.avance) }} / {{ formatNum(resumen?.kpis.motos.meta) }}
            </div>
            <div class="text-caption">{{ formatPct(resumen?.kpis.motos.pct_avance) }} de la meta</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card" :class="borderSemaforo(resumen?.semaforo.proyectado)">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">Proyección de cierre</div>
            <div class="text-h5 font-weight-bold">
              {{ formatNum(resumen?.kpis.total_general.proyeccion_cierre) }}
            </div>
            <div class="text-caption">
              {{ formatPct(resumen?.kpis.total_general.pct_proyeccion) }} de la meta proyectado
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- TABS -->
    <v-card elevation="8" class="rounded-xl">
      <v-tabs v-model="tab" color="primary" grow>
        <v-tab value="diario">
          Diario
          <v-icon v-if="resumen" :color="colorSemaforo(resumen.semaforo.diario)" size="10" class="ml-1">mdi-circle</v-icon>
        </v-tab>
        <v-tab value="semanal">
          Semanal
          <v-icon v-if="resumen" :color="colorSemaforo(resumen.semaforo.semanal)" size="10" class="ml-1">mdi-circle</v-icon>
        </v-tab>
        <v-tab value="meta">
          Meta
          <v-icon v-if="resumen" :color="colorSemaforo(resumen.semaforo.meta)" size="10" class="ml-1">mdi-circle</v-icon>
        </v-tab>
        <v-tab value="proyectado">
          Proyectado
          <v-icon v-if="resumen" :color="colorSemaforo(resumen.semaforo.proyectado)" size="10" class="ml-1">mdi-circle</v-icon>
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text>
        <v-window v-model="tab">
          <!-- TAB DIARIO -->
          <v-window-item value="diario">
            <v-data-table
              :headers="headersDiario"
              :items="diario?.dias ?? []"
              :loading="loading"
              item-key="fecha"
              hover
              hide-default-footer
              :items-per-page="-1"
            >
              <template #item.fecha="{ item }">{{ formatFechaCorta(item.fecha) }}</template>
              <template #item.pct_vs_meta="{ item }">{{ formatPct(item.pct_vs_meta) }}</template>
              <template #item.total_anio_anterior="{ item }">{{ item.total_anio_anterior ?? '—' }}</template>
              <template #item.diferencia_vs_anio_anterior="{ item }">
                <span v-if="item.diferencia_vs_anio_anterior === null">—</span>
                <span v-else :class="item.diferencia_vs_anio_anterior >= 0 ? 'text-green-darken-2' : 'text-red-darken-2'">
                  {{ item.diferencia_vs_anio_anterior >= 0 ? '+' : '' }}{{ item.diferencia_vs_anio_anterior }}
                </span>
              </template>
            </v-data-table>

            <v-alert v-if="!loading && !diario?.dias.length" type="info" variant="tonal" class="mt-4">
              Sin datos disponibles para {{ etiquetaMes(mesSeleccionado) }} {{ anioSeleccionado }}
              (ni en turnos reales ni en el histórico cargado).
            </v-alert>
            <div v-if="diario" class="text-caption text-medium-emphasis mt-2">
              Comparativo año anterior: {{ etiquetaFuente(diario.fuente_datos_anio_anterior) }}
            </div>
          </v-window-item>

          <!-- TAB SEMANAL -->
          <v-window-item value="semanal">
            <div class="text-caption text-medium-emphasis mb-3">
              Semanas sábado→viernes. Cada semana se compara contra la meta TOTAL del mes
              ({{ formatNum(semanal?.meta_livianos) }} livianos / {{ formatNum(semanal?.meta_motos) }} motos),
              sin prorratear entre semanas.
            </div>
            <v-data-table
              :headers="headersSemanal"
              :items="semanal?.semanas ?? []"
              :loading="loading"
              item-key="inicio"
              hover
              hide-default-footer
              :items-per-page="-1"
            >
              <template #item.semana="{ item }">
                {{ formatFechaCorta(item.inicio) }} — {{ formatFechaCorta(item.fin) }}
              </template>
              <template #item.pct_livianos="{ item }">{{ formatPct(item.pct_livianos) }}</template>
              <template #item.pct_motos="{ item }">{{ formatPct(item.pct_motos) }}</template>
            </v-data-table>

            <v-alert v-if="!loading && !semanal?.semanas.length" type="info" variant="tonal" class="mt-4">
              Sin datos disponibles para {{ etiquetaMes(mesSeleccionado) }} {{ anioSeleccionado }}.
            </v-alert>
          </v-window-item>

          <!-- TAB META (configuración) -->
          <v-window-item value="meta">
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="rounded-xl">
                  <v-card-title class="text-subtitle-1">Configurar meta de {{ etiquetaMes(mesSeleccionado) }} {{ anioSeleccionado }}</v-card-title>
                  <v-card-text>
                    <v-text-field
                      v-model.number="configForm.meta_livianos"
                      label="Meta Livianos"
                      type="number"
                      density="compact"
                      variant="outlined"
                      class="mb-3"
                      hide-details
                    />
                    <v-text-field
                      v-model.number="configForm.meta_motos"
                      label="Meta Motos"
                      type="number"
                      density="compact"
                      variant="outlined"
                      class="mb-3"
                      hide-details
                    />
                    <v-text-field
                      v-model.number="configForm.pct_crecimiento_referencia"
                      label="% Crecimiento de referencia (vs. año anterior)"
                      type="number"
                      suffix="%"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer />
                    <v-btn color="primary" :loading="savingConfig" @click="guardarConfig">
                      Guardar meta
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="outlined" class="rounded-xl">
                  <v-card-title class="text-subtitle-1">Cuánto se lleva vs. cuánto falta</v-card-title>
                  <v-card-text v-if="resumen">
                    <div class="mb-3">
                      <div class="d-flex justify-space-between">
                        <span>Livianos</span>
                        <span>{{ formatNum(resumen.kpis.livianos.avance) }} / {{ formatNum(resumen.kpis.livianos.meta) }}
                          (falta {{ formatNum(Math.max(0, resumen.kpis.livianos.meta - resumen.kpis.livianos.avance)) }})</span>
                      </div>
                      <v-progress-linear
                        :model-value="resumen.kpis.livianos.pct_avance"
                        :color="colorSemaforo(resumen.semaforo.meta)"
                        height="10"
                        rounded
                        class="mt-1"
                      />
                    </div>
                    <div class="mb-3">
                      <div class="d-flex justify-space-between">
                        <span>Motos</span>
                        <span>{{ formatNum(resumen.kpis.motos.avance) }} / {{ formatNum(resumen.kpis.motos.meta) }}
                          (falta {{ formatNum(Math.max(0, resumen.kpis.motos.meta - resumen.kpis.motos.avance)) }})</span>
                      </div>
                      <v-progress-linear
                        :model-value="resumen.kpis.motos.pct_avance"
                        :color="colorSemaforo(resumen.semaforo.meta)"
                        height="10"
                        rounded
                        class="mt-1"
                      />
                    </div>
                    <div>
                      <div class="d-flex justify-space-between font-weight-bold">
                        <span>Total</span>
                        <span>{{ formatNum(resumen.kpis.total_general.avance) }} / {{ formatNum(resumen.kpis.total_general.meta) }}
                          (falta {{ formatNum(Math.max(0, resumen.kpis.total_general.meta - resumen.kpis.total_general.avance)) }})</span>
                      </div>
                      <v-progress-linear
                        :model-value="resumen.kpis.total_general.pct_avance"
                        :color="colorSemaforo(resumen.semaforo.meta)"
                        height="12"
                        rounded
                        class="mt-1"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- TAB PROYECTADO -->
          <v-window-item value="proyectado">
            <v-row v-if="proyectado?.resumen" class="mb-3" dense>
              <v-col cols="12" sm="4">
                <v-card variant="tonal" class="rounded-xl">
                  <v-card-text>
                    <div class="text-caption">Promedio diario</div>
                    <div class="text-h6">
                      {{ proyectado.resumen.promedio_diario_livianos }} livianos / {{ proyectado.resumen.promedio_diario_motos }} motos
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card variant="tonal" class="rounded-xl">
                  <v-card-text>
                    <div class="text-caption">Proyección de cierre</div>
                    <div class="text-h6">{{ formatNum(proyectado.resumen.proyeccion_cierre_total) }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card variant="tonal" class="rounded-xl">
                  <v-card-text>
                    <div class="text-caption">% de la meta proyectado</div>
                    <div class="text-h6">{{ formatPct(proyectado.resumen.pct_proyeccion_total) }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-data-table
              :headers="headersProyectado"
              :items="proyectado?.dias ?? []"
              :loading="loading"
              item-key="fecha"
              hover
              hide-default-footer
              :items-per-page="-1"
            >
              <template #item.fecha="{ item }">{{ formatFechaCorta(item.fecha) }}</template>
            </v-data-table>

            <v-alert v-if="!loading && !proyectado?.dias.length" type="info" variant="tonal" class="mt-4">
              Sin datos disponibles para {{ etiquetaMes(mesSeleccionado) }} {{ anioSeleccionado }}.
            </v-alert>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  getMetaMensualConfig,
  putMetaMensualConfig,
  getMetaMensualResumen,
  getMetaMensualDiario,
  getMetaMensualSemanal,
  getMetaMensualProyectado,
  type MetaMensualResumenResponse,
  type MetaMensualDiarioResponse,
  type MetaMensualSemanalResponse,
  type MetaMensualProyectadoResponse,
  type FuenteMetaMensual,
  type SemaforoColor,
} from '@/services/reportesAdminService'

/* ===== Selector mes/año ===== */
const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]
function etiquetaMes(mes: number) {
  return MESES.find((m) => m.value === mes)?.label ?? String(mes)
}

const hoy = new Date()
const mesSeleccionado = ref(hoy.getMonth() + 1)
const anioSeleccionado = ref(hoy.getFullYear())

const tab = ref('diario')
const loading = ref(false)
const savingConfig = ref(false)
const snack = reactive({ show: false, text: '' })

const resumen = ref<MetaMensualResumenResponse | null>(null)
const diario = ref<MetaMensualDiarioResponse | null>(null)
const semanal = ref<MetaMensualSemanalResponse | null>(null)
const proyectado = ref<MetaMensualProyectadoResponse | null>(null)
const fuenteDatos = ref<FuenteMetaMensual>('sin_datos')

const configForm = reactive({
  meta_livianos: 0,
  meta_motos: 0,
  pct_crecimiento_referencia: 0,
})

/* ===== Formato ===== */
function formatNum(n: number | undefined | null) {
  if (n === undefined || n === null) return '—'
  return new Intl.NumberFormat('es-CO').format(n)
}
function formatPct(n: number | undefined | null) {
  if (n === undefined || n === null) return '—'
  return `${n}%`
}
function formatFechaCorta(fecha: string) {
  const [, mm, dd] = fecha.split('-')
  return `${dd}/${mm}`
}

const SEMAFORO_COLOR: Record<SemaforoColor, string> = {
  VERDE: 'green-darken-1',
  AMARILLO: 'amber-darken-2',
  ROJO: 'red-darken-1',
}
function colorSemaforo(color: SemaforoColor | undefined) {
  if (!color) return 'grey'
  return SEMAFORO_COLOR[color]
}
function borderSemaforo(color: SemaforoColor | undefined) {
  if (!color) return ''
  return `border-${color.toLowerCase()}`
}

const FUENTE_LABEL: Record<FuenteMetaMensual, string> = {
  real: 'Datos reales (turnos_rtms)',
  historico: 'Respaldo histórico',
  sin_datos: 'Sin datos disponibles',
}
const FUENTE_COLOR: Record<FuenteMetaMensual, string> = {
  real: 'green',
  historico: 'blue',
  sin_datos: 'grey',
}
function etiquetaFuente(f: FuenteMetaMensual) {
  return FUENTE_LABEL[f]
}
function colorFuente(f: FuenteMetaMensual) {
  return FUENTE_COLOR[f]
}

/* ===== Headers ===== */
const headersDiario = [
  { title: 'Fecha', key: 'fecha' },
  { title: 'Livianos', key: 'livianos' },
  { title: 'Motos', key: 'motos' },
  { title: 'Total', key: 'total' },
  { title: 'Acum. Livianos', key: 'acumulado_livianos' },
  { title: 'Acum. Motos', key: 'acumulado_motos' },
  { title: 'Acum. Total', key: 'acumulado_total' },
  { title: '% vs Meta', key: 'pct_vs_meta' },
  { title: 'Año anterior', key: 'total_anio_anterior' },
  { title: 'Diferencia', key: 'diferencia_vs_anio_anterior' },
]

const headersSemanal = [
  { title: 'Semana', key: 'semana', sortable: false },
  { title: 'Livianos', key: 'livianos' },
  { title: '% Livianos', key: 'pct_livianos' },
  { title: 'Motos', key: 'motos' },
  { title: '% Motos', key: 'pct_motos' },
  { title: 'Total', key: 'total' },
]

const headersProyectado = [
  { title: 'Fecha', key: 'fecha' },
  { title: 'Acum. Livianos', key: 'acumulado_livianos' },
  { title: 'Acum. Motos', key: 'acumulado_motos' },
  { title: 'Prom. Livianos/día', key: 'promedio_diario_livianos' },
  { title: 'Prom. Motos/día', key: 'promedio_diario_motos' },
  { title: 'Proy. Livianos', key: 'proyeccion_cierre_livianos' },
  { title: 'Proy. Motos', key: 'proyeccion_cierre_motos' },
  { title: 'Proy. Total', key: 'proyeccion_cierre_total' },
]

/* ===== Carga de datos ===== */
async function cargarTodo() {
  loading.value = true
  try {
    const [configResp, resumenResp, diarioResp, semanalResp, proyectadoResp] = await Promise.all([
      getMetaMensualConfig(mesSeleccionado.value, anioSeleccionado.value),
      getMetaMensualResumen(mesSeleccionado.value, anioSeleccionado.value),
      getMetaMensualDiario(mesSeleccionado.value, anioSeleccionado.value),
      getMetaMensualSemanal(mesSeleccionado.value, anioSeleccionado.value),
      getMetaMensualProyectado(mesSeleccionado.value, anioSeleccionado.value),
    ])

    configForm.meta_livianos = configResp.meta_livianos
    configForm.meta_motos = configResp.meta_motos
    configForm.pct_crecimiento_referencia = configResp.pct_crecimiento_referencia

    resumen.value = resumenResp
    diario.value = diarioResp
    semanal.value = semanalResp
    proyectado.value = proyectadoResp
    fuenteDatos.value = resumenResp.fuente_datos
  } catch (err) {
    console.error('Error cargando reporte Meta Mensual:', err)
    snack.text = '❌ Error al generar el reporte'
    snack.show = true
  } finally {
    loading.value = false
  }
}

async function guardarConfig() {
  savingConfig.value = true
  try {
    await putMetaMensualConfig({
      mes: mesSeleccionado.value,
      anio: anioSeleccionado.value,
      meta_livianos: configForm.meta_livianos,
      meta_motos: configForm.meta_motos,
      pct_crecimiento_referencia: configForm.pct_crecimiento_referencia,
    })
    snack.text = '✅ Meta guardada'
    snack.show = true
    await cargarTodo()
  } catch (err) {
    console.error('Error guardando meta mensual:', err)
    snack.text = '❌ Error al guardar la meta'
    snack.show = true
  } finally {
    savingConfig.value = false
  }
}

onMounted(() => {
  cargarTodo()
})
</script>

<style scoped>
.rounded-xl { border-radius: 16px; }
.rounded-2xl { border-radius: 20px; }
.text-medium-emphasis { color: rgba(0,0,0,.6); }

.kpi-card { border-left: 4px solid transparent; }
.border-verde { border-left-color: #2e7d32; }
.border-amarillo { border-left-color: #ff8f00; }
.border-rojo { border-left-color: #c62828; }
</style>
