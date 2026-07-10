<!-- src/views/reportes/ReporteComisiones.vue -->
<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-cash-multiple</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Comisiones y Pagos</div>
            <div class="text-medium-emphasis">Comisiones por asesor y convenio, según estado de pago</div>
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
            <v-select
              v-model="estadoFiltro"
              label="Estado"
              :items="ESTADO_OPCIONES"
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
    <v-row dense class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card kpi-clickable" color="warning" variant="tonal" @click="filtrarPorEstado('PENDIENTE')">
          <v-card-text class="text-center">
            <v-icon size="32" color="warning" class="mb-1">mdi-clock-outline</v-icon>
            <div class="text-overline font-weight-bold">Pendiente</div>
            <div class="text-h4 font-weight-bold">{{ resumenPorEstado.PENDIENTE.cantidad }}</div>
            <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenPorEstado.PENDIENTE.monto) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card kpi-clickable" color="info" variant="tonal" @click="filtrarPorEstado('APROBADA')">
          <v-card-text class="text-center">
            <v-icon size="32" color="info" class="mb-1">mdi-check-circle-outline</v-icon>
            <div class="text-overline font-weight-bold">Aprobada</div>
            <div class="text-h4 font-weight-bold">{{ resumenPorEstado.APROBADA.cantidad }}</div>
            <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenPorEstado.APROBADA.monto) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card kpi-clickable" color="success" variant="tonal" @click="filtrarPorEstado('PAGADA')">
          <v-card-text class="text-center">
            <v-icon size="32" color="success" class="mb-1">mdi-cash-check</v-icon>
            <div class="text-overline font-weight-bold">Pagada</div>
            <div class="text-h4 font-weight-bold">{{ resumenPorEstado.PAGADA.cantidad }}</div>
            <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenPorEstado.PAGADA.monto) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card kpi-clickable" color="error" variant="tonal" @click="filtrarPorEstado('ANULADA')">
          <v-card-text class="text-center">
            <v-icon size="32" color="error" class="mb-1">mdi-close-circle-outline</v-icon>
            <div class="text-overline font-weight-bold">Anulada</div>
            <div class="text-h4 font-weight-bold">{{ resumenPorEstado.ANULADA.cantidad }}</div>
            <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenPorEstado.ANULADA.monto) }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- TABLA (3 tabs -> drill-down por placa) -->
    <v-card elevation="8" class="rounded-xl">
      <v-card-text>
        <div class="d-flex align-center flex-wrap mb-3" style="gap:12px">
          <v-btn-toggle v-model="segmento" mandatory density="compact" color="primary" variant="outlined" divided rounded="lg">
            <v-btn value="ASESOR_COMERCIAL" size="small">Asesor Comercial</v-btn>
            <v-btn value="ASESOR_CONVENIO" size="small">Asesor Convenio</v-btn>
            <v-btn value="CONVENIO" size="small">Convenio</v-btn>
          </v-btn-toggle>
        </div>

        <div class="d-flex align-center flex-wrap mb-3" style="gap:12px">
          <v-text-field
            v-model="busqueda"
            :label="segmento === 'CONVENIO' ? 'Buscar por convenio' : 'Buscar por nombre'"
            prepend-inner-icon="mdi-magnify"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            style="max-width:280px"
          />
          <v-spacer />
          <v-btn
            variant="tonal"
            color="green-darken-2"
            prepend-icon="mdi-file-excel"
            :disabled="!segmentoTieneDatos"
            @click="exportarComisiones"
          >
            Exportar Excel
          </v-btn>
        </div>

        <!-- TAB 1: Asesor Comercial -->
        <v-data-table
          v-if="segmento === 'ASESOR_COMERCIAL'"
          class="tabla-clickable"
          :headers="headersComerciales"
          :items="comercialesFiltrados"
          :loading="loading"
          item-key="_key"
          hover
          hide-default-footer
          @click:row="onClickComercial"
        >
          <template #item.total_asesor="{ item }">{{ formatCOP(item.total_asesor) }}</template>
          <template #item.estados="{ item }">
            <v-chip v-if="chipEstado(item.estados) === 'MIXTO'" size="small" color="grey" variant="tonal">Mixto</v-chip>
            <v-chip v-else size="small" :color="colorEstado(chipEstado(item.estados))" variant="tonal">{{ chipEstado(item.estados) }}</v-chip>
          </template>

          <template #body.append v-if="comercialesFiltrados.length">
            <tr class="fila-totales">
              <td class="font-weight-bold">Totales</td>
              <td class="font-weight-bold">{{ totalesComerciales.cantidad }}</td>
              <td class="font-weight-bold">{{ formatCOP(totalesComerciales.total) }}</td>
              <td class="font-weight-bold">—</td>
            </tr>
          </template>
        </v-data-table>

        <!-- TAB 2: Asesor Convenio -->
        <v-data-table
          v-else-if="segmento === 'ASESOR_CONVENIO'"
          class="tabla-clickable"
          :headers="headersAsesorConvenio"
          :items="asesoresConvenioFiltrados"
          :loading="loading"
          item-key="_key"
          hover
          hide-default-footer
          @click:row="onClickAsesorConvenio"
        >
          <template #item.nombreConvenio="{ item }">
            {{ item.asesor_nombre }}<span v-if="item.convenio_nombre"> / {{ item.convenio_nombre }}</span>
          </template>
          <template #item.total_comision="{ item }">{{ formatCOP(item.total_comision) }}</template>
          <template #item.estados="{ item }">
            <v-chip v-if="chipEstado(item.estados) === 'MIXTO'" size="small" color="grey" variant="tonal">Mixto</v-chip>
            <v-chip v-else size="small" :color="colorEstado(chipEstado(item.estados))" variant="tonal">{{ chipEstado(item.estados) }}</v-chip>
          </template>

          <template #body.append v-if="asesoresConvenioFiltrados.length">
            <tr class="fila-totales">
              <td class="font-weight-bold">Totales</td>
              <td class="font-weight-bold">{{ totalesAsesorConvenio.cantidad }}</td>
              <td class="font-weight-bold">{{ formatCOP(totalesAsesorConvenio.totalComision) }}</td>
              <td class="font-weight-bold">—</td>
            </tr>
          </template>
        </v-data-table>

        <!-- TAB 3: Convenio -->
        <v-data-table
          v-else
          class="tabla-clickable"
          :headers="headersConvenios"
          :items="conveniosFiltrados"
          :loading="loading"
          item-key="_key"
          hover
          hide-default-footer
          @click:row="onClickConvenio"
        >
          <template #item.total_convenio="{ item }">{{ formatCOP(item.total_convenio) }}</template>
          <template #item.estados="{ item }">
            <v-chip v-if="chipEstado(item.estados) === 'MIXTO'" size="small" color="grey" variant="tonal">Mixto</v-chip>
            <v-chip v-else size="small" :color="colorEstado(chipEstado(item.estados))" variant="tonal">{{ chipEstado(item.estados) }}</v-chip>
          </template>

          <template #body.append v-if="conveniosFiltrados.length">
            <tr class="fila-totales">
              <td class="font-weight-bold" colspan="2">Totales</td>
              <td class="font-weight-bold">{{ totalesConvenios.cantidad }}</td>
              <td class="font-weight-bold">{{ formatCOP(totalesConvenios.total) }}</td>
              <td class="font-weight-bold">—</td>
            </tr>
          </template>
        </v-data-table>

        <v-alert v-if="!loading && !segmentoTieneDatos" type="info" variant="tonal" class="mt-4">
          No hay datos para este filtro.
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- DIALOG DE DETALLE (drill-down por placa) -->
    <v-dialog v-model="dialogDetalle.open" max-width="1000">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between flex-wrap" style="gap:8px">
          <div class="d-flex align-center flex-wrap" style="gap:10px">
            <v-icon>mdi-format-list-bulleted</v-icon>
            <span>Detalle — {{ dialogDetalle.titulo }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="dialogDetalle.open = false" />
        </v-card-title>

        <v-card-subtitle class="pb-2">
          {{ dialogDetalle.totalVehiculos }} vehículos — {{ formatCOP(dialogDetalle.totalComision) }} total
        </v-card-subtitle>

        <v-divider />

        <v-card-text>
          <v-data-table
            :headers="headersDialogActivo"
            :items="dialogDetalle.detalle"
            :loading="dialogDetalle.loading"
            item-key="placa"
            hover
            density="compact"
          >
            <template #item.fecha="{ item }">{{ soloFecha(item.fecha) }}</template>
            <template #item.tipo_cliente="{ item }">
              <v-chip v-if="item.tipo_cliente" size="small" :color="colorTipoCliente(item.tipo_cliente)" variant="tonal">
                {{ item.tipo_cliente }}
              </v-chip>
              <span v-else>—</span>
            </template>
            <template #item.convenio_nombre="{ item }">{{ item.convenio_nombre ?? '—' }}</template>
            <template #item.asesor_nombre="{ item }">{{ item.asesor_nombre }}</template>
            <template #item.monto_asesor="{ item }">{{ formatCOP(item.monto_asesor) }}</template>
            <template #item.monto_convenio="{ item }">{{ formatCOP(item.monto_convenio) }}</template>
            <template #item.total_comision="{ item }">{{ formatCOP(item.total_comision) }}</template>
            <template #item.estado="{ item }">
              <v-chip size="small" :color="colorEstado(item.estado)" variant="tonal">{{ item.estado }}</v-chip>
            </template>
            <template #item.pagado_at="{ item }">{{ soloFecha(item.pagado_at) }}</template>
            <template #item.cliente_nombre="{ item }">
              <v-chip v-if="!item.cliente_nombre" size="x-small" color="grey" variant="tonal">Sin RepGeneral</v-chip>
              <span v-else>{{ item.cliente_nombre }}</span>
            </template>
            <template #item.cliente_documento="{ item }">{{ item.cliente_documento ?? '—' }}</template>

            <template #body.append v-if="dialogDetalle.detalle.length">
              <tr class="fila-totales">
                <td :colspan="headersDialogActivo.length" class="font-weight-bold">
                  {{ dialogDetalle.totalVehiculos }} vehículos — {{ formatCOP(dialogDetalle.totalComision) }} total
                </td>
              </tr>
            </template>
          </v-data-table>

          <v-alert v-if="!dialogDetalle.loading && !dialogDetalle.detalle.length" type="info" variant="tonal" class="mt-4">
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
  getRangoMesActual,
  getReporteComisiones,
  getDetalleComisiones,
  getDetalleComisionesPorConvenio,
  type ComisionesResponse,
  type ComisionComercial,
  type ComisionAsesorConvenio,
  type ComisionConvenio,
  type DetalleComisionItem,
} from '@/services/reportesAdminService'

/* ===== Filtros de fecha (por defecto: mes actual) ===== */
const rangoMes = getRangoMesActual()
const fechaInicio = ref(rangoMes.inicio)
const fechaFin = ref(rangoMes.fin)

const ESTADO_OPCIONES = [
  { title: 'Todos', value: '' },
  { title: 'Pendiente', value: 'PENDIENTE' },
  { title: 'Aprobada', value: 'APROBADA' },
  { title: 'Pagada', value: 'PAGADA' },
  { title: 'Anulada', value: 'ANULADA' },
]
const estadoFiltro = ref('')

const loading = ref(false)
const snack = reactive({ show: false, text: '' })

/* ===== Datos del reporte ===== */
const comisionesData = ref<ComisionesResponse | null>(null)

const resumenVacio = { cantidad: 0, monto: 0 }
const resumenPorEstado = computed(
  () =>
    comisionesData.value?.resumen.por_estado ?? {
      PENDIENTE: resumenVacio,
      APROBADA: resumenVacio,
      PAGADA: resumenVacio,
      ANULADA: resumenVacio,
    }
)

/* ===== Chip de estado (posible "MIXTO") ===== */
function chipEstado(estados: string): string {
  const lista = estados.split(',').filter(Boolean)
  if (lista.length <= 1) return lista[0] ?? ''
  return 'MIXTO'
}

function colorEstado(estado: string) {
  switch (estado) {
    case 'PENDIENTE':
      return 'warning'
    case 'APROBADA':
      return 'info'
    case 'PAGADA':
      return 'success'
    case 'ANULADA':
      return 'error'
    default:
      return 'grey'
  }
}

function colorTipoCliente(tipo: string) {
  switch (tipo) {
    case 'NUEVO':
      return 'success'
    case 'RECURRENTE':
      return 'info'
    case 'RECUPERACION':
      return 'warning'
    default:
      return 'grey'
  }
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

function soloFecha(fecha: string | null | undefined) {
  if (!fecha) return '—'
  return String(fecha).slice(0, 10)
}

/* ===== Segmento activo + búsqueda ===== */
const busqueda = ref('')
type Segmento = 'ASESOR_COMERCIAL' | 'ASESOR_CONVENIO' | 'CONVENIO'
const segmento = ref<Segmento>('ASESOR_COMERCIAL')

const comercialesFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  const rows = (comisionesData.value?.comerciales ?? []).map((r) => ({ ...r, _key: `c-${r.asesor_id}` }))
  return q ? rows.filter((r) => r.asesor_nombre.toLowerCase().includes(q)) : rows
})

const asesoresConvenioFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  const rows = (comisionesData.value?.asesores_convenio ?? []).map((r) => ({
    ...r,
    _key: `ac-${r.asesor_id}-${r.convenio_nombre ?? ''}`,
  }))
  return q ? rows.filter((r) => r.asesor_nombre.toLowerCase().includes(q)) : rows
})

const conveniosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  const rows = (comisionesData.value?.convenios ?? []).map((r) => ({
    ...r,
    _key: `cv-${r.convenio_id}-${r.asesor_comercial_nombre}`,
  }))
  return q ? rows.filter((r) => r.convenio_nombre.toLowerCase().includes(q)) : rows
})

const filasSegmentoActivo = computed(() => {
  if (segmento.value === 'ASESOR_COMERCIAL') return comercialesFiltrados.value
  if (segmento.value === 'ASESOR_CONVENIO') return asesoresConvenioFiltrados.value
  return conveniosFiltrados.value
})
const segmentoTieneDatos = computed(() => filasSegmentoActivo.value.length > 0)

const totalesComerciales = computed(() =>
  comercialesFiltrados.value.reduce(
    (acc, r) => ({ cantidad: acc.cantidad + r.cantidad_vehiculos, total: acc.total + r.total_asesor }),
    { cantidad: 0, total: 0 }
  )
)
const totalesAsesorConvenio = computed(() =>
  asesoresConvenioFiltrados.value.reduce(
    (acc, r) => ({
      cantidad: acc.cantidad + r.cantidad_vehiculos,
      totalComision: acc.totalComision + r.total_comision,
    }),
    { cantidad: 0, totalComision: 0 }
  )
)
const totalesConvenios = computed(() =>
  conveniosFiltrados.value.reduce(
    (acc, r) => ({ cantidad: acc.cantidad + r.cantidad_vehiculos, total: acc.total + r.total_convenio }),
    { cantidad: 0, total: 0 }
  )
)

/* ===== Headers de tablas resumen ===== */
const headersComerciales = [
  { title: 'Nombre', key: 'asesor_nombre' },
  { title: 'Vehículos', key: 'cantidad_vehiculos' },
  { title: 'Comisión Asesor', key: 'total_asesor' },
  { title: 'Estado', key: 'estados' },
]

const headersAsesorConvenio = [
  { title: 'Nombre / Convenio', key: 'nombreConvenio', sortable: false },
  { title: 'Vehículos', key: 'cantidad_vehiculos' },
  { title: 'Comisión Total', key: 'total_comision' },
  { title: 'Estado', key: 'estados' },
]

const headersConvenios = [
  { title: 'Convenio', key: 'convenio_nombre' },
  { title: 'Asesor Comercial', key: 'asesor_comercial_nombre' },
  { title: 'Vehículos', key: 'cantidad_vehiculos' },
  { title: 'Monto Convenio', key: 'total_convenio' },
  { title: 'Estado', key: 'estados' },
]

/* ===== Headers del dialog de detalle (varían según el tab de origen) ===== */
const headersDialogComercial = [
  { title: 'Placa', key: 'placa' },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Tipo Cliente', key: 'tipo_cliente' },
  { title: 'Convenio', key: 'convenio_nombre' },
  { title: 'Comisión Asesor', key: 'monto_asesor' },
  { title: 'Estado', key: 'estado' },
  { title: 'Fecha Pago', key: 'pagado_at' },
  { title: 'Cliente', key: 'cliente_nombre' },
  { title: 'Documento', key: 'cliente_documento' },
]

const headersDialogAsesorConvenio = [
  { title: 'Placa', key: 'placa' },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Tipo Cliente', key: 'tipo_cliente' },
  { title: 'Comisión Asesor', key: 'monto_asesor' },
  { title: 'Comisión Convenio', key: 'monto_convenio' },
  { title: 'Total', key: 'total_comision' },
  { title: 'Estado', key: 'estado' },
  { title: 'Fecha Pago', key: 'pagado_at' },
  { title: 'Cliente', key: 'cliente_nombre' },
  { title: 'Documento', key: 'cliente_documento' },
]

const headersDialogConvenio = [
  { title: 'Placa', key: 'placa' },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Tipo Cliente', key: 'tipo_cliente' },
  { title: 'Asesor Comercial', key: 'asesor_nombre' },
  { title: 'Monto Convenio', key: 'monto_convenio' },
  { title: 'Estado', key: 'estado' },
  { title: 'Fecha Pago', key: 'pagado_at' },
  { title: 'Cliente', key: 'cliente_nombre' },
  { title: 'Documento', key: 'cliente_documento' },
]

/* ===== Rangos rápidos ===== */
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

/* ===== Cargar reporte ===== */
async function generarReporte() {
  if (!fechaInicio.value || !fechaFin.value) {
    snack.text = '❌ Selecciona un rango de fechas válido'
    snack.show = true
    return
  }

  loading.value = true
  try {
    comisionesData.value = await getReporteComisiones(
      fechaInicio.value,
      fechaFin.value,
      estadoFiltro.value || undefined
    )
  } catch (err) {
    console.error('Error generando reporte de comisiones:', err)
    snack.text = '❌ Error al generar el reporte'
    snack.show = true
  } finally {
    loading.value = false
  }
}

function filtrarPorEstado(estado: string) {
  estadoFiltro.value = estado
  generarReporte()
}

/* ===== Exportar Excel ===== */
function exportarExcel(nombreBase: string, encabezados: string[], filas: (string | number)[][]) {
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

function sanitizeFilename(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function exportarComisiones() {
  if (segmento.value === 'ASESOR_COMERCIAL') {
    const encabezados = ['Nombre', 'Vehículos', 'Comisión Asesor', 'Estado']
    const filas = comercialesFiltrados.value.map((r) => [
      r.asesor_nombre,
      r.cantidad_vehiculos,
      r.total_asesor,
      chipEstado(r.estados),
    ])
    const t = totalesComerciales.value
    filas.push(['Totales', t.cantidad, t.total, ''])
    exportarExcel('ReporteComisionesAsesorComercial', encabezados, filas)
  } else if (segmento.value === 'ASESOR_CONVENIO') {
    const encabezados = ['Nombre / Convenio', 'Vehículos', 'Comisión Total', 'Estado']
    const filas = asesoresConvenioFiltrados.value.map((r) => [
      r.convenio_nombre ? `${r.asesor_nombre} / ${r.convenio_nombre}` : r.asesor_nombre,
      r.cantidad_vehiculos,
      r.total_comision,
      chipEstado(r.estados),
    ])
    const t = totalesAsesorConvenio.value
    filas.push(['Totales', t.cantidad, t.totalComision, ''])
    exportarExcel('ReporteComisionesAsesorConvenio', encabezados, filas)
  } else {
    const encabezados = ['Convenio', 'Asesor Comercial', 'Vehículos', 'Monto Convenio', 'Estado']
    const filas = conveniosFiltrados.value.map((r) => [
      r.convenio_nombre,
      r.asesor_comercial_nombre,
      r.cantidad_vehiculos,
      r.total_convenio,
      chipEstado(r.estados),
    ])
    const t = totalesConvenios.value
    filas.push(['Totales', '', t.cantidad, t.total, ''])
    exportarExcel('ReporteComisionesConvenio', encabezados, filas)
  }
}

/* ===== Dialog de detalle (drill-down por placa) ===== */
type ModoDialog = 'COMERCIAL' | 'ASESOR_CONVENIO' | 'CONVENIO'

interface DialogDetalleState {
  open: boolean
  loading: boolean
  modo: ModoDialog
  titulo: string
  totalVehiculos: number
  totalAsesor: number
  totalConvenio: number
  totalComision: number
  detalle: DetalleComisionItem[]
}

const dialogDetalle = reactive<DialogDetalleState>({
  open: false,
  loading: false,
  modo: 'COMERCIAL',
  titulo: '',
  totalVehiculos: 0,
  totalAsesor: 0,
  totalConvenio: 0,
  totalComision: 0,
  detalle: [],
})

const headersDialogActivo = computed(() => {
  if (dialogDetalle.modo === 'COMERCIAL') return headersDialogComercial
  if (dialogDetalle.modo === 'ASESOR_CONVENIO') return headersDialogAsesorConvenio
  return headersDialogConvenio
})

function onClickComercial(_e: unknown, { item }: { item: ComisionComercial }) {
  abrirDetalleAsesor(item.asesor_id, item.asesor_nombre, 'COMERCIAL')
}
function onClickAsesorConvenio(_e: unknown, { item }: { item: ComisionAsesorConvenio }) {
  abrirDetalleAsesor(item.asesor_id, item.asesor_nombre, 'ASESOR_CONVENIO')
}
function onClickConvenio(_e: unknown, { item }: { item: ComisionConvenio }) {
  abrirDetalleConvenio(item.convenio_id, item.convenio_nombre)
}

function resetDialog(modo: ModoDialog, titulo: string) {
  dialogDetalle.open = true
  dialogDetalle.loading = true
  dialogDetalle.modo = modo
  dialogDetalle.titulo = titulo
  dialogDetalle.detalle = []
  dialogDetalle.totalVehiculos = 0
  dialogDetalle.totalAsesor = 0
  dialogDetalle.totalConvenio = 0
  dialogDetalle.totalComision = 0
}

async function abrirDetalleAsesor(asesorId: number, nombre: string, modo: 'COMERCIAL' | 'ASESOR_CONVENIO') {
  resetDialog(modo, nombre)
  try {
    const resp = await getDetalleComisiones(fechaInicio.value, fechaFin.value, asesorId)
    dialogDetalle.detalle = resp.detalle
    dialogDetalle.totalVehiculos = resp.total_vehiculos
    dialogDetalle.totalAsesor = resp.total_asesor
    dialogDetalle.totalConvenio = resp.total_convenio
    dialogDetalle.totalComision = resp.total_comision
  } catch (err) {
    console.error('Error cargando detalle de comisiones:', err)
    snack.text = '❌ Error al cargar el detalle'
    snack.show = true
    dialogDetalle.open = false
  } finally {
    dialogDetalle.loading = false
  }
}

async function abrirDetalleConvenio(convenioId: number, nombre: string) {
  resetDialog('CONVENIO', nombre)
  try {
    const resp = await getDetalleComisionesPorConvenio(fechaInicio.value, fechaFin.value, convenioId)
    dialogDetalle.detalle = resp.detalle
    dialogDetalle.totalVehiculos = resp.total_vehiculos
    dialogDetalle.totalAsesor = resp.total_asesor
    dialogDetalle.totalConvenio = resp.total_convenio
    dialogDetalle.totalComision = resp.total_comision
  } catch (err) {
    console.error('Error cargando detalle del convenio:', err)
    snack.text = '❌ Error al cargar el detalle'
    snack.show = true
    dialogDetalle.open = false
  } finally {
    dialogDetalle.loading = false
  }
}

function exportarDialogDetalle() {
  let encabezados: string[]
  let filas: (string | number)[][]

  if (dialogDetalle.modo === 'COMERCIAL') {
    encabezados = ['Placa', 'Fecha', 'Tipo Cliente', 'Convenio', 'Comisión Asesor', 'Estado', 'Fecha Pago', 'Cliente', 'Documento']
    filas = dialogDetalle.detalle.map((d) => [
      d.placa, soloFecha(d.fecha), d.tipo_cliente ?? '—', d.convenio_nombre ?? '—',
      d.monto_asesor, d.estado, soloFecha(d.pagado_at), d.cliente_nombre ?? 'Sin RepGeneral', d.cliente_documento ?? '—',
    ])
  } else if (dialogDetalle.modo === 'ASESOR_CONVENIO') {
    encabezados = ['Placa', 'Fecha', 'Tipo Cliente', 'Comisión Asesor', 'Comisión Convenio', 'Total', 'Estado', 'Fecha Pago', 'Cliente', 'Documento']
    filas = dialogDetalle.detalle.map((d) => [
      d.placa, soloFecha(d.fecha), d.tipo_cliente ?? '—', d.monto_asesor, d.monto_convenio, d.total_comision,
      d.estado, soloFecha(d.pagado_at), d.cliente_nombre ?? 'Sin RepGeneral', d.cliente_documento ?? '—',
    ])
  } else {
    encabezados = ['Placa', 'Fecha', 'Tipo Cliente', 'Asesor Comercial', 'Monto Convenio', 'Estado', 'Fecha Pago', 'Cliente', 'Documento']
    filas = dialogDetalle.detalle.map((d) => [
      d.placa, soloFecha(d.fecha), d.tipo_cliente ?? '—', d.asesor_nombre, d.monto_convenio,
      d.estado, soloFecha(d.pagado_at), d.cliente_nombre ?? 'Sin RepGeneral', d.cliente_documento ?? '—',
    ])
  }

  const nombreBase = `DetalleComisiones_${sanitizeFilename(dialogDetalle.titulo)}`
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

.kpi-card { height: 100%; }

.kpi-clickable {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.kpi-clickable:hover { transform: translateY(-2px); }

.fila-totales { background-color: #e3f2fd; }

.tabla-clickable :deep(tbody tr) { cursor: pointer; }
.tabla-clickable :deep(tbody tr:hover) { background-color: #e3f2fd !important; }
</style>
