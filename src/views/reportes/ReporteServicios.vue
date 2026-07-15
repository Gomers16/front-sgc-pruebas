<!-- src/views/reportes/ReporteServicios.vue -->
<template>
  <v-container class="py-6">
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-car-wrench</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Reporte de Servicios</div>
            <div class="text-medium-emphasis">Turnos y facturación generada por servicio</div>
          </div>
        </div>
      </v-card-title>

      <v-divider />

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

    <v-card elevation="8" class="rounded-xl">
      <v-card-text>
        <div class="d-flex justify-end mb-3">
          <v-btn
            variant="tonal"
            color="green-darken-2"
            prepend-icon="mdi-file-excel"
            :disabled="!detalleRows.length"
            @click="exportarExcelServicios"
          >
            Exportar Excel
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="filasConSubtotal"
          :loading="loading"
          item-key="_rowKey"
          :row-props="rowProps"
          hover
          hide-default-footer
        >
          <template #item.codigo_servicio="{ item }">
            <template v-if="item._esSubtotal">
              <span class="font-weight-bold">{{ item.nombre_servicio }} · Total</span>
            </template>
            <template v-else>
              <v-chip size="small" :color="colorServicio(item.codigo_servicio)" variant="flat">
                {{ item.codigo_servicio }}
              </v-chip>
              <span class="ml-2">{{ item.nombre_servicio }}</span>
            </template>
          </template>

          <template #item.tipo_vehiculo="{ item }">
            {{ item._esSubtotal ? '' : tipoVehiculoLabel(item.tipo_vehiculo) }}
          </template>

          <template #item.valor_unitario="{ item }">
            {{ item._esSubtotal ? '—' : formatCOP(item.valor_unitario) }}
          </template>

          <template #item.total_generado="{ item }">
            {{ formatCOP(item.total_generado) }}
          </template>

          <template #item.total_neto="{ item }">
            {{ formatCOP(item.total_neto) }}
          </template>

          <template #body.append v-if="reporteData?.totales">
            <tr class="fila-totales">
              <td class="font-weight-bold" colspan="2">Totales</td>
              <td class="font-weight-bold">{{ reporteData.totales.turnos }}</td>
              <td class="font-weight-bold">—</td>
              <td class="font-weight-bold">{{ formatCOP(reporteData.totales.total_generado) }}</td>
              <td class="font-weight-bold">{{ formatCOP(reporteData.totales.total_neto) }}</td>
            </tr>
          </template>
        </v-data-table>

        <v-alert v-if="!loading && !detalleRows.length" type="info" variant="tonal" class="mt-4">
          No hay datos para el rango de fechas seleccionado.
        </v-alert>

        <v-alert type="info" variant="tonal" density="compact" class="mt-4">
          Los servicios sin tarifa configurada muestran $0 en los totales
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
  getReporteServicios,
  getRangoMesActual,
  type ReporteServiciosResponse,
  type ReporteServicioDetalle,
} from '@/services/reportesAdminService'

interface FilaServicio extends ReporteServicioDetalle {
  _rowKey: string
  _esSubtotal?: boolean
}

const rangoMes = getRangoMesActual()
const fechaInicio = ref(rangoMes.inicio)
const fechaFin = ref(rangoMes.fin)

const loading = ref(false)
const snack = reactive({ show: false, text: '' })

const reporteData = ref<ReporteServiciosResponse | null>(null)
const detalleRows = computed(() => reporteData.value?.detalle ?? [])

// Inserta una fila "TOTAL" (Moto + Vehículo) después de cada par de filas del mismo servicio
const filasConSubtotal = computed<FilaServicio[]>(() => {
  const rows = detalleRows.value
  const resultado: FilaServicio[] = []

  let i = 0
  while (i < rows.length) {
    const codigo = rows[i].codigo_servicio
    const grupo: ReporteServicioDetalle[] = []
    while (i < rows.length && rows[i].codigo_servicio === codigo) {
      grupo.push(rows[i])
      i++
    }

    grupo.forEach((r, idx) => {
      resultado.push({ ...r, _rowKey: `${codigo}-${idx}` })
    })

    if (grupo.length > 1) {
      resultado.push({
        codigo_servicio: codigo,
        nombre_servicio: grupo[0].nombre_servicio,
        tipo_vehiculo: 'TOTAL',
        turnos: grupo.reduce((acc, r) => acc + r.turnos, 0),
        valor_unitario: 0,
        total_generado: grupo.reduce((acc, r) => acc + r.total_generado, 0),
        total_neto: grupo.reduce((acc, r) => acc + r.total_neto, 0),
        _rowKey: `${codigo}-subtotal`,
        _esSubtotal: true,
      })
    }
  }

  return resultado
})

function rowProps({ item }: { item: FilaServicio }) {
  return item._esSubtotal ? { class: 'fila-subtotal' } : {}
}

const headers = [
  { title: 'Servicio', key: 'codigo_servicio' },
  { title: 'Tipo', key: 'tipo_vehiculo' },
  { title: 'Turnos', key: 'turnos' },
  { title: 'Valor Unitario', key: 'valor_unitario' },
  { title: 'Total Generado', key: 'total_generado' },
  { title: 'Total Neto', key: 'total_neto' },
]

const SERVICIO_COLORS: Record<string, string> = {
  RTM: 'blue',
  SOAT: 'green',
  PREV: 'orange',
  PERI: 'purple',
}
function colorServicio(codigo: string) {
  return SERVICIO_COLORS[codigo] ?? 'grey'
}

function tipoVehiculoLabel(t: string) {
  return t === 'MOTO' ? 'Moto' : 'Vehículo'
}

function formatCOP(value: number | string) {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

function toInputDate(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
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

async function generarReporte() {
  if (!fechaInicio.value || !fechaFin.value) {
    snack.text = '❌ Selecciona un rango de fechas válido'
    snack.show = true
    return
  }

  loading.value = true
  try {
    reporteData.value = await getReporteServicios(fechaInicio.value, fechaFin.value)
  } catch (err) {
    console.error('Error generando reporte de servicios:', err)
    snack.text = '❌ Error al generar el reporte'
    snack.show = true
  } finally {
    loading.value = false
  }
}

function exportarExcelServicios() {
  const encabezados = ['Servicio', 'Tipo', 'Turnos', 'Valor Unitario', 'Total Generado', 'Total Neto']
  const filas = filasConSubtotal.value.map((r) => [
    r._esSubtotal ? `${r.nombre_servicio} - TOTAL` : `${r.codigo_servicio} - ${r.nombre_servicio}`,
    r._esSubtotal ? '' : tipoVehiculoLabel(r.tipo_vehiculo),
    r.turnos,
    r._esSubtotal ? '' : r.valor_unitario,
    r.total_generado,
    r.total_neto,
  ])
  if (reporteData.value?.totales) {
    const t = reporteData.value.totales
    filas.push(['Totales', '', t.turnos, '', t.total_generado, t.total_neto])
  }

  const data = [encabezados, ...filas]
  const ws = XLSX.utils.aoa_to_sheet(data)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
    if (ws[cellRef]) ws[cellRef].s = { font: { bold: true } }
  }
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
  XLSX.writeFile(wb, `ReporteServicios_${fechaInicio.value}_${fechaFin.value}.xlsx`)
}

onMounted(() => {
  generarReporte()
})
</script>

<style scoped>
.rounded-xl { border-radius: 16px; }
.rounded-2xl { border-radius: 20px; }
.text-medium-emphasis { color: rgba(0,0,0,.6); }
.fila-totales { background-color: #e3f2fd; }
.fila-subtotal { background-color: #f5f5f5; font-weight: 600; }
</style>
