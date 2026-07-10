<!-- src/views/reportes/ReporteProduccionLider.vue -->
<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-account-group</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Producción por Líder</div>
            <div class="text-medium-emphasis">Producción por sede y líder comercial</div>
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
            :disabled="!liderRows.length"
            @click="exportarLider"
          >
            Exportar Excel
          </v-btn>
        </div>

        <v-data-table
          :headers="headersLider"
          :items="liderRows"
          :loading="loading"
          item-key="lider_nombre"
          hover
          hide-default-footer
        >
          <template #item.total_bruto="{ item }">
            {{ formatCOP(item.total_bruto) }}
          </template>
          <template #item.total_neto="{ item }">
            {{ formatCOP(item.total_neto) }}
          </template>
        </v-data-table>

        <v-alert v-if="!loading && !liderRows.length" type="info" variant="tonal" class="mt-4">
          No hay datos para el rango de fechas seleccionado.
        </v-alert>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import {
  getProduccionPorLider,
  getRangoMesActual,
  type ProduccionLiderResponse,
} from '@/services/reportesAdminService'

/* ===== Filtros de fecha (por defecto: mes actual) ===== */
const rangoMes = getRangoMesActual()
const fechaInicio = ref(rangoMes.inicio)
const fechaFin = ref(rangoMes.fin)

const loading = ref(false)
const snack = reactive({ show: false, text: '' })

/* ===== Datos del reporte ===== */
const liderData = ref<ProduccionLiderResponse | null>(null)
const liderRows = computed(() => liderData.value?.por_sede ?? [])

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
const headersLider = [
  { title: 'Sede', key: 'sede_nombre' },
  { title: 'Líder', key: 'lider_nombre' },
  { title: 'Vehículos', key: 'vehiculos' },
  { title: 'Total Bruto', key: 'total_bruto' },
  { title: 'Total Neto', key: 'total_neto' },
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
    liderData.value = await getProduccionPorLider(fechaInicio.value, fechaFin.value)
  } catch (err) {
    console.error('Error generando reporte de producción por líder:', err)
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

function exportarLider() {
  const encabezados = ['Sede', 'Líder', 'Vehículos', 'Total Bruto', 'Total Neto']
  const filas = liderRows.value.map((r) => [
    r.sede_nombre,
    r.lider_nombre,
    r.vehiculos,
    r.total_bruto,
    r.total_neto,
  ])
  exportarExcel('ReporteLider', encabezados, filas)
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
</style>
