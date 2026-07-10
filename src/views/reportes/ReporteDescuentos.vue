<!-- src/views/reportes/ReporteDescuentos.vue -->
<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-tag-multiple</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Descuentos</div>
            <div class="text-medium-emphasis">Descuentos aplicados por tipo, canal y autorizador</div>
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

    <!-- TABS -->
    <v-card elevation="8" class="rounded-xl">
      <v-tabs v-model="tab" color="primary" grow>
        <v-tab value="tipo">Por Tipo</v-tab>
        <v-tab value="canal">Por Canal</v-tab>
        <v-tab value="autorizador">Por Autorizador</v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text>
        <v-window v-model="tab">
          <!-- TAB 1: POR TIPO -->
          <v-window-item value="tipo">
            <div class="d-flex justify-end mb-3">
              <v-btn
                variant="tonal"
                color="green-darken-2"
                prepend-icon="mdi-file-excel"
                :disabled="!porTipoRows.length"
                @click="exportarPorTipo"
              >
                Exportar Excel
              </v-btn>
            </div>

            <v-data-table
              class="tabla-clickable"
              :headers="headersPorTipo"
              :items="porTipoRows"
              :loading="loading"
              item-key="codigo"
              hover
              hide-default-footer
              @click:row="onClickTipoRow"
            >
              <template #item.total_descuentos="{ item }">{{ formatCOP(item.total_descuentos) }}</template>
              <template #item.promedio="{ item }">{{ formatCOP(item.promedio) }}</template>

              <template #body.append v-if="totalesTipo">
                <tr class="fila-totales">
                  <td class="font-weight-bold" colspan="2">Totales</td>
                  <td class="font-weight-bold">{{ totalesTipo.cantidad }}</td>
                  <td class="font-weight-bold">{{ formatCOP(totalesTipo.total_descuentos) }}</td>
                  <td class="font-weight-bold">—</td>
                </tr>
              </template>
            </v-data-table>

            <v-alert v-if="!loading && !porTipoRows.length" type="info" variant="tonal" class="mt-4">
              No hay datos para el rango de fechas seleccionado.
            </v-alert>
          </v-window-item>

          <!-- TAB 2: POR CANAL -->
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
              class="tabla-clickable"
              :headers="headersPorCanal"
              :items="porCanalRows"
              :loading="loading"
              item-key="canal"
              hover
              hide-default-footer
              @click:row="onClickCanalRow"
            >
              <template #item.canal="{ item }">{{ nombreCanal(item.canal) }}</template>
              <template #item.total_descuentos="{ item }">{{ formatCOP(item.total_descuentos) }}</template>

              <template #body.append v-if="totalesCanal">
                <tr class="fila-totales">
                  <td class="font-weight-bold">Totales</td>
                  <td class="font-weight-bold">{{ totalesCanal.cantidad }}</td>
                  <td class="font-weight-bold">{{ formatCOP(totalesCanal.total_descuentos) }}</td>
                  <td class="font-weight-bold">—</td>
                </tr>
              </template>
            </v-data-table>

            <v-alert v-if="!loading && !porCanalRows.length" type="info" variant="tonal" class="mt-4">
              No hay datos para el rango de fechas seleccionado.
            </v-alert>
          </v-window-item>

          <!-- TAB 3: POR AUTORIZADOR -->
          <v-window-item value="autorizador">
            <div class="d-flex justify-end mb-3">
              <v-btn
                variant="tonal"
                color="green-darken-2"
                prepend-icon="mdi-file-excel"
                :disabled="!porAutorizadorRows.length"
                @click="exportarPorAutorizador"
              >
                Exportar Excel
              </v-btn>
            </div>

            <v-data-table
              class="tabla-clickable"
              :headers="headersPorAutorizador"
              :items="porAutorizadorRows"
              :loading="loading"
              item-key="usuario_id"
              hover
              hide-default-footer
              @click:row="onClickAutorizadorRow"
            >
              <template #item.total_descuentos="{ item }">{{ formatCOP(item.total_descuentos) }}</template>

              <template #body.append v-if="totalesAutorizador">
                <tr class="fila-totales">
                  <td class="font-weight-bold">Totales</td>
                  <td class="font-weight-bold">{{ totalesAutorizador.cantidad }}</td>
                  <td class="font-weight-bold">{{ formatCOP(totalesAutorizador.total_descuentos) }}</td>
                </tr>
              </template>
            </v-data-table>

            <v-alert v-if="!loading && !porAutorizadorRows.length" type="info" variant="tonal" class="mt-4">
              No hay datos para el rango de fechas seleccionado.
            </v-alert>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- DIALOG DE DETALLE (drill-down) -->
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
          {{ dialogDetalle.totalVehiculos }} vehículos — {{ formatCOP(dialogDetalle.totalDescuentos) }} total descuentos
        </v-card-subtitle>

        <v-divider />

        <v-card-text>
          <v-data-table
            :headers="headersDialogDescuento"
            :items="dialogDetalle.detalle"
            :loading="dialogDetalle.loading"
            item-key="placa"
            hover
            density="compact"
          >
            <template #item.fecha="{ item }">{{ soloFecha(item.fecha) }}</template>
            <template #item.captacion_canal="{ item }">{{ nombreCanal(item.captacion_canal) }}</template>
            <template #item.tipo_vehiculo="{ item }">{{ item.tipo_vehiculo ?? '—' }}</template>
            <template #item.asesor="{ item }">{{ nombreAsesorConvenio(item) }}</template>
            <template #item.descuento_nombre="{ item }">{{ item.descuento_nombre }}</template>
            <template #item.descuento_monto_aplicado="{ item }">{{ formatCOP(item.descuento_monto_aplicado) }}</template>
            <template #item.total_sin_descuento="{ item }">{{ formatCOP(item.total_sin_descuento) }}</template>
            <template #item.autorizador_nombre="{ item }">{{ item.autorizador_nombre ?? '—' }}</template>
            <template #item.cliente_nombre="{ item }">
              <v-chip v-if="!item.cliente_nombre" size="x-small" color="grey" variant="tonal">
                Sin RepGeneral
              </v-chip>
              <span v-else>{{ item.cliente_nombre }}</span>
            </template>
            <template #item.cliente_documento="{ item }">{{ item.cliente_documento ?? '—' }}</template>

            <template #body.append v-if="dialogDetalle.detalle.length">
              <tr class="fila-totales">
                <td colspan="11" class="font-weight-bold">
                  {{ dialogDetalle.totalVehiculos }} vehículos — {{ formatCOP(dialogDetalle.totalDescuentos) }} total descuentos
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
import { ref, reactive, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import {
  getRangoMesActual,
  getDescuentosPorTipo,
  getDescuentosPorCanal,
  getDescuentosPorAutorizador,
  getDetalleDescuentos,
  type DescuentoPorTipo,
  type DescuentoPorCanal,
  type DescuentoPorAutorizador,
  type DetalleDescuento,
  type TotalesDescuentos,
} from '@/services/reportesAdminService'

/* ===== Filtros de fecha (por defecto: mes actual) ===== */
const rangoMes = getRangoMesActual()
const fechaInicio = ref(rangoMes.inicio)
const fechaFin = ref(rangoMes.fin)

const tab = ref('tipo')
const loading = ref(false)
const snack = reactive({ show: false, text: '' })

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

function soloFecha(fecha: string | null | undefined) {
  if (!fecha) return '—'
  return String(fecha).slice(0, 10)
}

function nombreAsesorConvenio(d: DetalleDescuento) {
  const nombre = d.agente_comercial_nombre || d.asesor_convenio_nombre || '—'
  return d.convenio_nombre ? `${nombre} (${d.convenio_nombre})` : nombre
}

/* ===== Datos de los 3 reportes ===== */
const porTipoRows = ref<DescuentoPorTipo[]>([])
const porCanalRows = ref<DescuentoPorCanal[]>([])
const porAutorizadorRows = ref<DescuentoPorAutorizador[]>([])

const totalesTipo = ref<TotalesDescuentos | null>(null)
const totalesCanal = ref<TotalesDescuentos | null>(null)
const totalesAutorizador = ref<TotalesDescuentos | null>(null)

/* ===== Headers ===== */
const headersPorTipo = [
  { title: 'Código', key: 'codigo' },
  { title: 'Tipo de descuento', key: 'nombre' },
  { title: 'Cantidad', key: 'cantidad' },
  { title: 'Total descuento', key: 'total_descuentos' },
  { title: 'Promedio', key: 'promedio' },
]

const headersPorCanal = [
  { title: 'Canal', key: 'canal' },
  { title: 'Cantidad', key: 'cantidad' },
  { title: 'Total descuento', key: 'total_descuentos' },
  { title: 'Tipos usados', key: 'tipos_usados' },
]

const headersPorAutorizador = [
  { title: 'Autorizador', key: 'nombre' },
  { title: 'Cantidad', key: 'cantidad' },
  { title: 'Total descuento', key: 'total_descuentos' },
]

const headersDialogDescuento = [
  { title: 'Placa', key: 'placa' },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Tipo Vehículo', key: 'tipo_vehiculo' },
  { title: 'Canal', key: 'captacion_canal' },
  { title: 'Asesor/Convenio', key: 'asesor' },
  { title: 'Tipo Descuento', key: 'descuento_nombre' },
  { title: 'Monto Descuento', key: 'descuento_monto_aplicado' },
  { title: 'Valor Original', key: 'total_sin_descuento' },
  { title: 'Autorizador', key: 'autorizador_nombre' },
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
    const [tipo, canal, autor] = await Promise.all([
      getDescuentosPorTipo(fechaInicio.value, fechaFin.value),
      getDescuentosPorCanal(fechaInicio.value, fechaFin.value),
      getDescuentosPorAutorizador(fechaInicio.value, fechaFin.value),
    ])
    porTipoRows.value = tipo.por_tipo
    totalesTipo.value = tipo.totales
    porCanalRows.value = canal.por_canal
    totalesCanal.value = canal.totales
    porAutorizadorRows.value = autor.por_autorizador
    totalesAutorizador.value = autor.totales
  } catch (err) {
    console.error('Error generando reporte de descuentos:', err)
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

function exportarPorTipo() {
  const encabezados = ['Código', 'Tipo de descuento', 'Cantidad', 'Total descuento', 'Promedio']
  const filas = porTipoRows.value.map((r) => [r.codigo, r.nombre, r.cantidad, r.total_descuentos, r.promedio])
  if (totalesTipo.value) {
    filas.push(['', 'Totales', totalesTipo.value.cantidad, totalesTipo.value.total_descuentos, ''])
  }
  exportarExcel('ReporteDescuentosPorTipo', encabezados, filas)
}

function exportarPorCanal() {
  const encabezados = ['Canal', 'Cantidad', 'Total descuento', 'Tipos usados']
  const filas = porCanalRows.value.map((r) => [
    nombreCanal(r.canal),
    r.cantidad,
    r.total_descuentos,
    r.tipos_usados,
  ])
  if (totalesCanal.value) {
    filas.push(['Totales', totalesCanal.value.cantidad, totalesCanal.value.total_descuentos, ''])
  }
  exportarExcel('ReporteDescuentosPorCanal', encabezados, filas)
}

function exportarPorAutorizador() {
  const encabezados = ['Autorizador', 'Cantidad', 'Total descuento']
  const filas = porAutorizadorRows.value.map((r) => [r.nombre, r.cantidad, r.total_descuentos])
  if (totalesAutorizador.value) {
    filas.push(['Totales', totalesAutorizador.value.cantidad, totalesAutorizador.value.total_descuentos])
  }
  exportarExcel('ReporteDescuentosPorAutorizador', encabezados, filas)
}

/* ===== Dialog de detalle (drill-down) ===== */
interface DialogDetalleState {
  open: boolean
  loading: boolean
  titulo: string
  totalVehiculos: number
  totalDescuentos: number
  detalle: DetalleDescuento[]
}

const dialogDetalle = reactive<DialogDetalleState>({
  open: false,
  loading: false,
  titulo: '',
  totalVehiculos: 0,
  totalDescuentos: 0,
  detalle: [],
})

/**
 * El backend no acepta filtro por autorizador (solo tipo/canal), así que para
 * esa vista se trae el detalle completo del rango y se filtra en el cliente
 * comparando autorizador_nombre — ambos endpoints arman ese nombre con el
 * mismo CONCAT(nombres, ' ', apellidos), así que el match es exacto.
 */
async function cargarDetalle(params: { tipo?: string; canal?: string; autorizadorNombre?: string }) {
  dialogDetalle.open = true
  dialogDetalle.loading = true
  dialogDetalle.detalle = []
  dialogDetalle.totalVehiculos = 0
  dialogDetalle.totalDescuentos = 0

  try {
    const resp = await getDetalleDescuentos(fechaInicio.value, fechaFin.value, params.tipo, params.canal)
    let detalle = resp.detalle
    let totalVehiculos = resp.total_vehiculos
    let totalDescuentos = resp.total_descuentos

    if (params.autorizadorNombre) {
      detalle = detalle.filter((d) => d.autorizador_nombre === params.autorizadorNombre)
      totalVehiculos = detalle.length
      totalDescuentos = detalle.reduce((acc, d) => acc + d.descuento_monto_aplicado, 0)
    }

    dialogDetalle.detalle = detalle
    dialogDetalle.totalVehiculos = totalVehiculos
    dialogDetalle.totalDescuentos = totalDescuentos
  } catch (err) {
    console.error('Error cargando detalle de descuentos:', err)
    snack.text = '❌ Error al cargar el detalle'
    snack.show = true
    dialogDetalle.open = false
  } finally {
    dialogDetalle.loading = false
  }
}

function onClickTipoRow(_e: unknown, { item }: { item: DescuentoPorTipo }) {
  dialogDetalle.titulo = item.nombre
  cargarDetalle({ tipo: item.codigo })
}

function onClickCanalRow(_e: unknown, { item }: { item: DescuentoPorCanal }) {
  dialogDetalle.titulo = nombreCanal(item.canal)
  cargarDetalle({ canal: item.canal })
}

function onClickAutorizadorRow(_e: unknown, { item }: { item: DescuentoPorAutorizador }) {
  dialogDetalle.titulo = item.nombre
  cargarDetalle({ autorizadorNombre: item.nombre })
}

function exportarDialogDetalle() {
  const encabezados = [
    'Placa', 'Fecha', 'Tipo Vehículo', 'Canal', 'Asesor/Convenio',
    'Tipo Descuento', 'Monto Descuento', 'Valor Original', 'Autorizador', 'Cliente', 'Documento',
  ]

  const filas = dialogDetalle.detalle.map((d) => [
    d.placa,
    soloFecha(d.fecha),
    d.tipo_vehiculo ?? '—',
    nombreCanal(d.captacion_canal),
    nombreAsesorConvenio(d),
    d.descuento_nombre,
    d.descuento_monto_aplicado,
    d.total_sin_descuento,
    d.autorizador_nombre ?? '—',
    d.cliente_nombre ?? 'Sin RepGeneral',
    d.cliente_documento ?? '—',
  ])

  if (dialogDetalle.detalle.length) {
    filas.push(['', '', '', '', '', '', '', '', '', 'Totales', String(dialogDetalle.totalVehiculos)])
  }

  const nombreBase = `DetalleDescuentos_${sanitizeFilename(dialogDetalle.titulo)}`
  exportarExcel(nombreBase, encabezados, filas)
}

function sanitizeFilename(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
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
