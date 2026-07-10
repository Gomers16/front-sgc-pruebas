<!-- src/views/reportes/ReporteRetencion.vue -->
<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-account-reactivate</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Retención de Clientes</div>
            <div class="text-medium-emphasis">Clientes nuevos, recurrentes y recuperados</div>
          </div>
        </div>
      </v-card-title>

      <v-divider />

      <!-- FILTROS -->
      <v-card-text>
        <v-row align="center" dense>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model="fechaInicio"
              label="Fecha inicio"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-text-field
              v-model="fechaFin"
              label="Fecha fin"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" variant="tonal" prepend-icon="mdi-calendar-range" block>
                  Rangos rápidos
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="setRango(7)">
                  <v-list-item-title>Últimos 7 días</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setRango(30)">
                  <v-list-item-title>Últimos 30 días</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setRango(90)">
                  <v-list-item-title>Últimos 90 días</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setEsteMes()">
                  <v-list-item-title>Este mes</v-list-item-title>
                </v-list-item>
                <v-list-item @click="setMesAnterior()">
                  <v-list-item-title>Mes anterior</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              :loading="loading"
              block
              @click="generarReporte"
            >
              Generar reporte
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- KPI CARDS -->
    <v-row dense class="mb-2">
      <v-col cols="12" sm="4">
        <v-card
          elevation="6"
          class="rounded-xl kpi-card kpi-clickable"
          color="success"
          variant="tonal"
          @click="abrirDetalleRetencion('NUEVO')"
        >
          <v-card-text class="text-center">
            <v-icon size="32" color="success" class="mb-1">mdi-account-plus</v-icon>
            <div class="text-overline font-weight-bold">Nuevos</div>
            <div class="text-h4 font-weight-bold">{{ resumenNuevos.cantidad }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ formatPercent(resumenNuevos.porcentaje) }} del total</div>
            <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenNuevos.total_bruto) }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card
          elevation="6"
          class="rounded-xl kpi-card kpi-clickable"
          color="primary"
          variant="tonal"
          @click="abrirDetalleRetencion('RECURRENTE')"
        >
          <v-card-text class="text-center">
            <v-icon size="32" color="primary" class="mb-1">mdi-autorenew</v-icon>
            <div class="text-overline font-weight-bold">Recurrentes</div>
            <div class="text-h4 font-weight-bold">{{ resumenRecurrentes.cantidad }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ formatPercent(resumenRecurrentes.porcentaje) }} del total</div>
            <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenRecurrentes.total_bruto) }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="4">
        <v-card
          elevation="6"
          class="rounded-xl kpi-card kpi-clickable"
          color="warning"
          variant="tonal"
          @click="abrirDetalleRetencion('RECUPERACION')"
        >
          <v-card-text class="text-center">
            <v-icon size="32" color="warning" class="mb-1">mdi-account-heart</v-icon>
            <div class="text-overline font-weight-bold">Recuperaciones</div>
            <div class="text-h4 font-weight-bold">{{ resumenRecuperaciones.cantidad }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ formatPercent(resumenRecuperaciones.porcentaje) }} del total</div>
            <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenRecuperaciones.total_bruto) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- NOTA INFORMATIVA -->
    <v-alert type="info" variant="tonal" density="compact" class="mb-6">
      Clasificación basada en {{ retencionData?.meses_minimos ?? '—' }} meses de referencia configurados en el sistema
    </v-alert>

    <!-- TABS -->
    <v-card elevation="8" class="rounded-xl">
      <v-tabs v-model="tab" color="primary" grow>
        <v-tab value="canal">Por Canal</v-tab>
        <v-tab value="mes">Por Mes</v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text>
        <v-window v-model="tab">
          <!-- TAB 1: POR CANAL -->
          <v-window-item value="canal">
            <div class="d-flex justify-end mb-3">
              <v-btn
                variant="tonal"
                color="green-darken-2"
                prepend-icon="mdi-file-excel"
                :disabled="!porCanalRows.length"
                @click="exportarPorCanal"
              >
                Exportar Excel
              </v-btn>
            </div>

            <v-data-table
              :headers="headersPorCanal"
              :items="porCanalRows"
              :loading="loading"
              item-key="canal"
              hover
              hide-default-footer
            >
              <template #item.canal="{ item }">
                {{ nombreCanal(item.canal) }}
              </template>
              <template #item.nuevos="{ item }">
                <span
                  class="celda-clickable"
                  @click="abrirDetalleRetencion('NUEVO', item.canal)"
                >{{ item.nuevos }}</span>
              </template>
              <template #item.recurrentes="{ item }">
                <span
                  class="celda-clickable"
                  @click="abrirDetalleRetencion('RECURRENTE', item.canal)"
                >{{ item.recurrentes }}</span>
              </template>
              <template #item.recuperaciones="{ item }">
                <span
                  class="celda-clickable"
                  @click="abrirDetalleRetencion('RECUPERACION', item.canal)"
                >{{ item.recuperaciones }}</span>
              </template>
              <template #item.total_bruto="{ item }">
                {{ formatCOP(item.total_bruto) }}
              </template>

              <template #body.append v-if="porCanalRows.length">
                <tr class="fila-totales">
                  <td class="font-weight-bold">Totales</td>
                  <td class="font-weight-bold">{{ totalesPorCanal.nuevos }}</td>
                  <td class="font-weight-bold">{{ totalesPorCanal.recurrentes }}</td>
                  <td class="font-weight-bold">{{ totalesPorCanal.recuperaciones }}</td>
                  <td class="font-weight-bold">{{ totalesPorCanal.total }}</td>
                  <td class="font-weight-bold">{{ formatCOP(totalesPorCanal.total_bruto) }}</td>
                </tr>
              </template>
            </v-data-table>

            <v-alert v-if="!loading && !porCanalRows.length" type="info" variant="tonal" class="mt-4">
              No hay datos para el rango de fechas seleccionado.
            </v-alert>
          </v-window-item>

          <!-- TAB 2: POR MES -->
          <v-window-item value="mes">
            <div class="d-flex justify-end mb-3">
              <v-btn
                variant="tonal"
                color="green-darken-2"
                prepend-icon="mdi-file-excel"
                :disabled="!porMesRows.length"
                @click="exportarPorMes"
              >
                Exportar Excel
              </v-btn>
            </div>

            <v-data-table
              :headers="headersPorMes"
              :items="porMesRows"
              :loading="loading"
              item-key="mes"
              hover
              hide-default-footer
            >
              <template #item.mes="{ item }">
                {{ formatMes(item.mes) }}
              </template>

              <template #body.append v-if="porMesRows.length">
                <tr class="fila-totales">
                  <td class="font-weight-bold">Totales</td>
                  <td class="font-weight-bold">{{ totalesPorMes.nuevos }}</td>
                  <td class="font-weight-bold">{{ totalesPorMes.recurrentes }}</td>
                  <td class="font-weight-bold">{{ totalesPorMes.recuperaciones }}</td>
                  <td class="font-weight-bold">{{ totalesPorMes.total }}</td>
                </tr>
              </template>
            </v-data-table>

            <v-alert v-if="!loading && !porMesRows.length" type="info" variant="tonal" class="mt-4">
              No hay datos para el rango de fechas seleccionado.
            </v-alert>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- DIALOG DE DETALLE (drill-down retención) -->
    <v-dialog v-model="dialogDetalle.open" max-width="950">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between flex-wrap" style="gap:8px">
          <div class="d-flex align-center flex-wrap" style="gap:10px">
            <span>{{ categoriaEmoji(dialogDetalle.categoria) }} {{ categoriaNombre(dialogDetalle.categoria) }}</span>
            <v-chip size="small" color="primary" variant="tonal">
              {{ dialogDetalle.canal ? nombreCanal(dialogDetalle.canal) : 'Todos los canales' }}
            </v-chip>
          </div>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="dialogDetalle.open = false" />
        </v-card-title>

        <v-card-subtitle class="pb-2">
          {{ dialogDetalle.totalVehiculos }} vehículos — {{ formatCOP(dialogDetalle.totalBruto) }} total
        </v-card-subtitle>

        <v-divider />

        <v-card-text>
          <v-data-table
            :headers="headersDialogRetencion"
            :items="dialogDetalle.detalle"
            :loading="dialogDetalle.loading"
            item-key="placa"
            hover
            density="compact"
          >
            <template #item.fecha="{ item }">{{ soloFecha(item.fecha) }}</template>
            <template #item.tipo_vehiculo="{ item }">{{ item.tipo_vehiculo ?? '—' }}</template>
            <template #item.captacion_canal="{ item }">{{ nombreCanal(item.captacion_canal) }}</template>
            <template #item.asesor="{ item }">{{ nombreAsesorDetalle(item) }}</template>
            <template #item.meses_desde_ultima_visita="{ item }">
              {{ formatMesesDesdeUltimaVisita(item.meses_desde_ultima_visita) }}
            </template>
            <template #item.cliente_nombre="{ item }">
              <v-chip v-if="!item.cliente_nombre" size="x-small" color="grey" variant="tonal">
                Sin RepGeneral
              </v-chip>
              <span v-else>{{ item.cliente_nombre }}</span>
            </template>
            <template #item.cliente_documento="{ item }">{{ item.cliente_documento ?? '—' }}</template>
            <template #item.total="{ item }">{{ formatCOP(item.total) }}</template>

            <template #body.append v-if="dialogDetalle.detalle.length">
              <tr class="fila-totales">
                <td colspan="9" class="font-weight-bold">
                  {{ dialogDetalle.totalVehiculos }} vehículos — {{ formatCOP(dialogDetalle.totalBruto) }} total
                </td>
              </tr>
            </template>
          </v-data-table>

          <v-alert
            v-if="!dialogDetalle.loading && !dialogDetalle.detalle.length"
            type="info"
            variant="tonal"
            class="mt-4"
          >
            No hay placas registradas para este filtro.
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-btn
            variant="tonal"
            color="green-darken-2"
            prepend-icon="mdi-file-excel"
            :disabled="!dialogDetalle.detalle.length"
            @click="exportarDialogDetalle"
          >
            Exportar Excel
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="dialogDetalle.open = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import {
  getRetencionClientes,
  getDetalleRetencion,
  getRangoMesActual,
  type RetencionResponse,
  type DetalleRetencionTicket,
} from '@/services/reportesAdminService'

/* ===== Filtros de fecha (por defecto: mes actual) ===== */
const rangoMes = getRangoMesActual()
const fechaInicio = ref(rangoMes.inicio)
const fechaFin = ref(rangoMes.fin)

const tab = ref('canal')
const loading = ref(false)
const snack = reactive({ show: false, text: '' })

/* ===== Datos del reporte ===== */
const retencionData = ref<RetencionResponse | null>(null)
const porCanalRows = computed(() => retencionData.value?.por_canal ?? [])
const porMesRows = computed(() => retencionData.value?.por_mes ?? [])

const resumenVacio = { cantidad: 0, total_bruto: 0, porcentaje: 0 }
const resumenNuevos = computed(() => retencionData.value?.resumen.nuevos ?? resumenVacio)
const resumenRecurrentes = computed(() => retencionData.value?.resumen.recurrentes ?? resumenVacio)
const resumenRecuperaciones = computed(() => retencionData.value?.resumen.recuperaciones ?? resumenVacio)

/* ===== Totales de tablas ===== */
const totalesPorCanal = computed(() =>
  porCanalRows.value.reduce(
    (acc, r) => ({
      nuevos: acc.nuevos + r.nuevos,
      recurrentes: acc.recurrentes + r.recurrentes,
      recuperaciones: acc.recuperaciones + r.recuperaciones,
      total: acc.total + r.total,
      total_bruto: acc.total_bruto + r.total_bruto,
    }),
    { nuevos: 0, recurrentes: 0, recuperaciones: 0, total: 0, total_bruto: 0 }
  )
)

const totalesPorMes = computed(() =>
  porMesRows.value.reduce(
    (acc, r) => ({
      nuevos: acc.nuevos + r.nuevos,
      recurrentes: acc.recurrentes + r.recurrentes,
      recuperaciones: acc.recuperaciones + r.recuperaciones,
      total: acc.total + r.total,
    }),
    { nuevos: 0, recurrentes: 0, recuperaciones: 0, total: 0 }
  )
)

/* ===== Mapeo de nombres de canal ===== */
const CANAL_LABELS: Record<string, string> = {
  FACHADA: 'Fachada',
  ASESOR_COMERCIAL: 'Asesor Comercial',
  ASESOR_CONVENIO: 'Asesor Convenio',
  TELEMERCADEO: 'Telemercadeo',
  REDES: 'Redes / Marketing Digital',
}
function nombreCanal(c: string) {
  return CANAL_LABELS[c] ?? c
}

/* ===== Formato de mes ('YYYY-MM' -> 'junio 2026') ===== */
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
function formatMes(mes: string) {
  const [y, m] = mes.split('-').map(Number)
  if (!y || !m || m < 1 || m > 12) return mes
  return `${MESES[m - 1]} ${y}`
}

/* ===== Formato de pesos colombianos ===== */
function formatCOP(value: number | string) {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

/* ===== Formato de porcentaje ===== */
function formatPercent(value: number) {
  if (Number.isNaN(value)) return '—'
  return `${value.toFixed(1)}%`
}

/* ===== Headers ===== */
const headersPorCanal = [
  { title: 'Canal', key: 'canal' },
  { title: 'Nuevos', key: 'nuevos' },
  { title: 'Recurrentes', key: 'recurrentes' },
  { title: 'Recuperaciones', key: 'recuperaciones' },
  { title: 'Total', key: 'total' },
  { title: 'Total Bruto', key: 'total_bruto' },
]

const headersPorMes = [
  { title: 'Mes', key: 'mes' },
  { title: 'Nuevos', key: 'nuevos' },
  { title: 'Recurrentes', key: 'recurrentes' },
  { title: 'Recuperaciones', key: 'recuperaciones' },
  { title: 'Total', key: 'total' },
]

const headersDialogRetencion = [
  { title: 'Placa', key: 'placa' },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Tipo Vehículo', key: 'tipo_vehiculo' },
  { title: 'Canal', key: 'captacion_canal' },
  { title: 'Asesor/Convenio', key: 'asesor' },
  { title: 'Meses desde última visita', key: 'meses_desde_ultima_visita' },
  { title: 'Cliente', key: 'cliente_nombre' },
  { title: 'Documento', key: 'cliente_documento' },
  { title: 'Valor', key: 'total' },
]

/* ===== Rangos rápidos ===== */
function toInputDate(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10)
}

function setRango(dias: number) {
  const hoy = new Date()
  const desde = new Date()
  desde.setDate(hoy.getDate() - dias)
  fechaInicio.value = toInputDate(desde)
  fechaFin.value = toInputDate(hoy)
}

function setEsteMes() {
  const hoy = new Date()
  fechaInicio.value = toInputDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
  fechaFin.value = toInputDate(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0))
}

function setMesAnterior() {
  const hoy = new Date()
  fechaInicio.value = toInputDate(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1))
  fechaFin.value = toInputDate(new Date(hoy.getFullYear(), hoy.getMonth(), 0))
}

/* ===== Cargar reporte ===== */
async function generarReporte() {
  if (!fechaInicio.value || !fechaFin.value) {
    snack.text = '❌ Selecciona un rango de fechas válido'
    snack.show = true
    return
  }

  loading.value = true
  try {
    retencionData.value = await getRetencionClientes(fechaInicio.value, fechaFin.value)
  } catch (err) {
    console.error('Error generando reporte de retención de clientes:', err)
    snack.text = '❌ Error al generar el reporte'
    snack.show = true
  } finally {
    loading.value = false
  }
}

/* ===== Exportar Excel ===== */
function exportarExcel(
  nombreBase: string,
  encabezados: string[],
  filas: (string | number)[][]
) {
  const data = [encabezados, ...filas]
  const ws = XLSX.utils.aoa_to_sheet(data)

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
    if (ws[cellRef]) {
      ws[cellRef].s = { font: { bold: true } }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte')

  const nombreArchivo = `${nombreBase}_${fechaInicio.value}_${fechaFin.value}.xlsx`
  XLSX.writeFile(wb, nombreArchivo)
}

function exportarPorCanal() {
  const encabezados = ['Canal', 'Nuevos', 'Recurrentes', 'Recuperaciones', 'Total', 'Total Bruto']
  const filas = porCanalRows.value.map((r) => [
    nombreCanal(r.canal),
    r.nuevos,
    r.recurrentes,
    r.recuperaciones,
    r.total,
    r.total_bruto,
  ])
  const t = totalesPorCanal.value
  filas.push(['Totales', t.nuevos, t.recurrentes, t.recuperaciones, t.total, t.total_bruto])
  exportarExcel('RetencionPorCanal', encabezados, filas)
}

function exportarPorMes() {
  const encabezados = ['Mes', 'Nuevos', 'Recurrentes', 'Recuperaciones', 'Total']
  const filas = porMesRows.value.map((r) => [
    formatMes(r.mes),
    r.nuevos,
    r.recurrentes,
    r.recuperaciones,
    r.total,
  ])
  const t = totalesPorMes.value
  filas.push(['Totales', t.nuevos, t.recurrentes, t.recuperaciones, t.total])
  exportarExcel('RetencionPorMes', encabezados, filas)
}

/* ===== Dialog de detalle (drill-down por categoría / canal) ===== */
type CategoriaRetencion = 'NUEVO' | 'RECURRENTE' | 'RECUPERACION'

interface DialogDetalleRetencionState {
  open: boolean
  loading: boolean
  categoria: CategoriaRetencion | ''
  canal: string
  totalVehiculos: number
  totalBruto: number
  detalle: DetalleRetencionTicket[]
}

const dialogDetalle = reactive<DialogDetalleRetencionState>({
  open: false,
  loading: false,
  categoria: '',
  canal: '',
  totalVehiculos: 0,
  totalBruto: 0,
  detalle: [],
})

const CATEGORIA_LABELS: Record<CategoriaRetencion, string> = {
  NUEVO: 'Nuevos',
  RECURRENTE: 'Recurrentes',
  RECUPERACION: 'Recuperaciones',
}
const CATEGORIA_EMOJIS: Record<CategoriaRetencion, string> = {
  NUEVO: '🆕',
  RECURRENTE: '🔄',
  RECUPERACION: '💛',
}
function categoriaNombre(c: CategoriaRetencion | '') {
  return c ? CATEGORIA_LABELS[c] : ''
}
function categoriaEmoji(c: CategoriaRetencion | '') {
  return c ? CATEGORIA_EMOJIS[c] : ''
}

function soloFecha(fecha: string | null | undefined) {
  if (!fecha) return '—'
  return String(fecha).slice(0, 10)
}

function nombreAsesorDetalle(d: DetalleRetencionTicket) {
  return d.agente_comercial_nombre || d.asesor_convenio_nombre || '—'
}

function formatMesesDesdeUltimaVisita(meses: number | null) {
  if (meses === null || meses === undefined) return 'Primera vez'
  return `${meses} meses`
}

async function abrirDetalleRetencion(categoria: CategoriaRetencion, canal?: string) {
  dialogDetalle.open = true
  dialogDetalle.loading = true
  dialogDetalle.categoria = categoria
  dialogDetalle.canal = canal ?? ''
  dialogDetalle.detalle = []
  dialogDetalle.totalVehiculos = 0
  dialogDetalle.totalBruto = 0

  try {
    const resp = await getDetalleRetencion(fechaInicio.value, fechaFin.value, categoria, canal)
    dialogDetalle.detalle = resp.detalle
    dialogDetalle.totalVehiculos = resp.total_vehiculos
    dialogDetalle.totalBruto = resp.total_bruto
  } catch (err) {
    console.error('Error cargando detalle de retención:', err)
    snack.text = '❌ Error al cargar el detalle'
    snack.show = true
    dialogDetalle.open = false
  } finally {
    dialogDetalle.loading = false
  }
}

function sanitizeFilename(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function exportarDialogDetalle() {
  const encabezados = [
    'Placa', 'Fecha', 'Tipo Vehículo', 'Canal', 'Asesor/Convenio',
    'Meses desde última visita', 'Cliente', 'Documento', 'Valor',
  ]

  const filas = dialogDetalle.detalle.map((d) => [
    d.placa,
    soloFecha(d.fecha),
    d.tipo_vehiculo ?? '—',
    nombreCanal(d.captacion_canal),
    nombreAsesorDetalle(d),
    formatMesesDesdeUltimaVisita(d.meses_desde_ultima_visita),
    d.cliente_nombre ?? 'Sin RepGeneral',
    d.cliente_documento ?? '—',
    d.total,
  ])

  const nombreBase = `DetalleRetencion_${sanitizeFilename(categoriaNombre(dialogDetalle.categoria))}${
    dialogDetalle.canal ? `_${sanitizeFilename(dialogDetalle.canal)}` : ''
  }`
  exportarExcel(nombreBase, encabezados, filas)
}

/* ===== Lifecycle ===== */
onMounted(() => {
  generarReporte()
})
</script>

<style scoped>
.rounded-xl { border-radius: 16px; }
.rounded-2xl { border-radius: 20px; }
.text-medium-emphasis { color: rgba(0,0,0,.6); }

.kpi-card {
  height: 100%;
}

.kpi-clickable {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.kpi-clickable:hover {
  transform: translateY(-2px);
}

.celda-clickable {
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 3px;
}

.celda-clickable:hover {
  font-weight: 700;
}

.fila-totales {
  background-color: #e3f2fd;
}
</style>
