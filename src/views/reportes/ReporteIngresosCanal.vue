<!-- src/views/reportes/ReporteIngresosCanal.vue -->
<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-chart-line</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Ingresos por Canal</div>
            <div class="text-medium-emphasis">Distribución de ingresos por canal de captación</div>
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

    <!-- TABLA -->
    <v-card elevation="8" class="rounded-xl">
      <v-card-text>
        <div class="d-flex justify-end mb-3">
          <v-btn
            variant="tonal"
            color="green-darken-2"
            prepend-icon="mdi-file-excel"
            :disabled="!canalRows.length"
            @click="exportarCanal"
          >
            Exportar Excel
          </v-btn>
        </div>

        <v-data-table
          class="tabla-clickable"
          :headers="headersCanal"
          :items="canalRows"
          :loading="loading"
          item-key="canal"
          hover
          hide-default-footer
          @click:row="onClickCanalRow"
        >
          <template #item.canal="{ item }">
            {{ nombreCanal(item.canal) }}
          </template>
          <template #item.total_bruto="{ item }">
            {{ formatCOP(item.total_bruto) }}
          </template>
          <template #item.total_neto="{ item }">
            {{ formatCOP(item.total_neto) }}
          </template>
          <template #item.promedio_ticket="{ item }">
            {{ formatCOP(item.promedio_ticket) }}
          </template>

          <template #body.append v-if="canalData?.totales">
            <tr class="fila-totales">
              <td class="font-weight-bold">Totales</td>
              <td class="font-weight-bold">{{ canalData.totales.cantidad }}</td>
              <td class="font-weight-bold">{{ formatCOP(canalData.totales.total_bruto) }}</td>
              <td class="font-weight-bold">{{ formatCOP(canalData.totales.total_neto) }}</td>
              <td class="font-weight-bold">{{ formatCOP(canalData.totales.promedio_ticket) }}</td>
            </tr>
          </template>
        </v-data-table>

        <v-alert v-if="!loading && !canalRows.length" type="info" variant="tonal" class="mt-4">
          No hay datos para el rango de fechas seleccionado.
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- DIALOG DE DETALLE (canal) -->
    <v-dialog v-model="dialogDetalle.open" max-width="900">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between flex-wrap" style="gap:8px">
          <div class="d-flex align-center flex-wrap" style="gap:10px">
            <v-icon>mdi-format-list-bulleted</v-icon>
            <span>Detalle — {{ dialogDetalle.titulo }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="dialogDetalle.open = false" />
        </v-card-title>

        <v-card-subtitle class="pb-2">
          {{ fechaInicio }} — {{ fechaFin }} · {{ dialogDetalle.totalVehiculos }} vehículos ·
          {{ formatCOP(dialogDetalle.totalBruto) }} total
        </v-card-subtitle>

        <v-divider />

        <v-card-text>
          <v-data-table
            :headers="headersDialogCanal"
            :items="dialogDetalle.detalle"
            :loading="dialogDetalle.loading"
            item-key="placa"
            hover
            density="compact"
          >
            <template #item.fecha="{ item }">{{ soloFecha(item.fecha) }}</template>
            <template #item.tipo_vehiculo="{ item }">{{ item.tipo_vehiculo ?? '—' }}</template>
            <template #item.total="{ item }">{{ formatCOP(item.total) }}</template>
            <template #item.convenio_nombre="{ item }">{{ item.convenio_nombre ?? '—' }}</template>
            <template #item.asesor="{ item }">{{ nombreAsesorDetalle(item) }}</template>
            <template #item.cliente_nombre="{ item }">
              <v-chip v-if="!item.cliente_nombre" size="x-small" color="grey" variant="tonal">
                Sin RepGeneral
              </v-chip>
              <span v-else>{{ item.cliente_nombre }}</span>
            </template>
            <template #item.cliente_documento="{ item }">{{ item.cliente_documento ?? '—' }}</template>

            <template #body.append v-if="dialogDetalle.detalle.length">
              <tr class="fila-totales">
                <td colspan="8" class="font-weight-bold">
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
  getIngresosPorCanal,
  getDetalleCanal,
  getRangoMesActual,
  type IngresosCanalResponse,
  type IngresoCanal,
  type DetalleTicket,
} from '@/services/reportesAdminService'

/* ===== Filtros de fecha (por defecto: mes actual) ===== */
const rangoMes = getRangoMesActual()
const fechaInicio = ref(rangoMes.inicio)
const fechaFin = ref(rangoMes.fin)

const loading = ref(false)
const snack = reactive({ show: false, text: '' })

/* ===== Datos del reporte ===== */
const canalData = ref<IngresosCanalResponse | null>(null)
const canalRows = computed(() => canalData.value?.por_canal ?? [])

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

/* ===== Headers ===== */
const headersCanal = [
  { title: 'Canal', key: 'canal' },
  { title: 'Vehículos', key: 'cantidad' },
  { title: 'Total Bruto', key: 'total_bruto' },
  { title: 'Total Neto', key: 'total_neto' },
  { title: 'Promedio Ticket', key: 'promedio_ticket' },
]

const headersDialogCanal = [
  { title: 'Placa', key: 'placa' },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Tipo Vehículo', key: 'tipo_vehiculo' },
  { title: 'Asesor', key: 'asesor' },
  { title: 'Convenio', key: 'convenio_nombre' },
  { title: 'Valor', key: 'total' },
  { title: 'Cliente', key: 'cliente_nombre' },
  { title: 'Documento', key: 'cliente_documento' },
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
    canalData.value = await getIngresosPorCanal(fechaInicio.value, fechaFin.value)
  } catch (err) {
    console.error('Error generando reporte de ingresos por canal:', err)
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

function exportarCanal() {
  const encabezados = ['Canal', 'Vehículos', 'Total Bruto', 'Total Neto', 'Promedio Ticket']
  const filas = canalRows.value.map((r) => [
    nombreCanal(r.canal),
    r.cantidad,
    r.total_bruto,
    r.total_neto,
    r.promedio_ticket,
  ])
  if (canalData.value?.totales) {
    const t = canalData.value.totales
    filas.push(['Totales', t.cantidad, t.total_bruto, t.total_neto, t.promedio_ticket])
  }
  exportarExcel('ReporteCanal', encabezados, filas)
}

/* ===== Dialog de detalle (drill-down por canal) ===== */
interface DialogDetalleState {
  open: boolean
  loading: boolean
  titulo: string
  canalCodigo: string
  totalVehiculos: number
  totalBruto: number
  detalle: DetalleTicket[]
}

const dialogDetalle = reactive<DialogDetalleState>({
  open: false,
  loading: false,
  titulo: '',
  canalCodigo: '',
  totalVehiculos: 0,
  totalBruto: 0,
  detalle: [],
})

function soloFecha(fecha: string | null | undefined) {
  if (!fecha) return '—'
  return String(fecha).slice(0, 10)
}

function nombreAsesorDetalle(d: DetalleTicket) {
  return d.agente_comercial_nombre || d.asesor_convenio_nombre || '—'
}

function onClickCanalRow(_e: unknown, { item }: { item: IngresoCanal }) {
  abrirDetalleCanal(item.canal)
}

async function abrirDetalleCanal(canal: string) {
  dialogDetalle.open = true
  dialogDetalle.loading = true
  dialogDetalle.titulo = nombreCanal(canal)
  dialogDetalle.canalCodigo = canal
  dialogDetalle.detalle = []
  dialogDetalle.totalVehiculos = 0
  dialogDetalle.totalBruto = 0

  try {
    const resp = await getDetalleCanal(fechaInicio.value, fechaFin.value, canal)
    dialogDetalle.detalle = resp.detalle
    dialogDetalle.totalVehiculos = resp.total_vehiculos
    dialogDetalle.totalBruto = resp.total_bruto
  } catch (err) {
    console.error('Error cargando detalle del canal:', err)
    snack.text = '❌ Error al cargar el detalle del canal'
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
  const encabezados = ['Placa', 'Fecha', 'Tipo Vehículo', 'Asesor', 'Convenio', 'Valor', 'Cliente', 'Documento']

  const filas = dialogDetalle.detalle.map((d) => [
    d.placa,
    soloFecha(d.fecha),
    d.tipo_vehiculo ?? '—',
    nombreAsesorDetalle(d),
    d.convenio_nombre ?? '—',
    d.total,
    d.cliente_nombre ?? 'Sin RepGeneral',
    d.cliente_documento ?? '—',
  ])

  const nombreBase = `DetalleCanal_${sanitizeFilename(dialogDetalle.canalCodigo)}`
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

.fila-totales {
  background-color: #e3f2fd;
}

.tabla-clickable :deep(tbody tr) {
  cursor: pointer;
}

.tabla-clickable :deep(tbody tr:hover) {
  background-color: #e3f2fd !important;
}
</style>
