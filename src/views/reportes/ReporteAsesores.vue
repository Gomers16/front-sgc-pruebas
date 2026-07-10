<!-- src/views/reportes/ReporteAsesores.vue -->
<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-handshake</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Asesores</div>
            <div class="text-medium-emphasis">Producción por asesor comercial, asesor de convenio y convenio</div>
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
        <div class="d-flex align-center flex-wrap mb-3" style="gap:12px">
          <v-btn-toggle
            v-model="segmentoAsesor"
            mandatory
            density="compact"
            color="primary"
            variant="outlined"
            divided
            rounded="lg"
          >
            <v-btn value="COMERCIAL" size="small">Asesor Comercial</v-btn>
            <v-btn value="CONVENIO_ASESOR" size="small">Asesor Convenio</v-btn>
            <v-btn value="CONVENIO" size="small">Convenio</v-btn>
          </v-btn-toggle>
        </div>

        <div class="d-flex align-center flex-wrap mb-3" style="gap:12px">
          <v-text-field
            v-model="busquedaAsesor"
            :label="segmentoAsesor === 'CONVENIO' ? 'Buscar por convenio' : 'Buscar por nombre'"
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
            :disabled="!asesoresTabTieneDatos"
            @click="exportarAsesores"
          >
            Exportar Excel
          </v-btn>
        </div>

        <!-- SEGMENTO: Asesor Comercial -->
        <v-data-table
          v-if="segmentoAsesor === 'COMERCIAL'"
          class="tabla-clickable"
          :headers="headersAsesorComercial"
          :items="asesoresComercial"
          :loading="loading"
          item-key="agente_id"
          hover
          @click:row="onClickAsesorRow"
        >
          <template #item.total_bruto="{ item }">{{ formatCOP(item.total_bruto) }}</template>
          <template #item.total_neto="{ item }">{{ formatCOP(item.total_neto) }}</template>
        </v-data-table>

        <!-- SEGMENTO: Asesor Convenio -->
        <v-data-table
          v-else-if="segmentoAsesor === 'CONVENIO_ASESOR'"
          class="tabla-clickable"
          :headers="headersAsesorConvenio"
          :items="asesoresConvenio"
          :loading="loading || convenioDetalleLoading"
          item-key="agente_id"
          hover
          @click:row="onClickAsesorRow"
        >
          <template #item.convenio_nombre="{ item }">{{ item.convenio_nombre ?? '—' }}</template>
          <template #item.total_bruto="{ item }">{{ formatCOP(item.total_bruto) }}</template>
          <template #item.total_neto="{ item }">{{ formatCOP(item.total_neto) }}</template>
        </v-data-table>

        <!-- SEGMENTO: Convenio -->
        <v-data-table
          v-else
          class="tabla-clickable"
          :headers="headersConvenios"
          :items="conveniosAgrupados"
          :loading="loading || convenioDetalleLoading"
          item-key="convenio_nombre"
          hover
          @click:row="onClickConvenioRow"
        >
          <template #item.total_bruto="{ item }">{{ formatCOP(item.total_bruto) }}</template>
        </v-data-table>

        <v-alert
          v-if="!loading && !convenioDetalleLoading && !asesoresTabTieneDatos"
          type="info"
          variant="tonal"
          class="mt-4"
        >
          No hay datos para este filtro.
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- DIALOG DE DETALLE (asesor / convenio) -->
    <v-dialog v-model="dialogDetalle.open" max-width="900">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between flex-wrap" style="gap:8px">
          <div class="d-flex align-center flex-wrap" style="gap:10px">
            <v-icon>mdi-format-list-bulleted</v-icon>
            <span>Detalle — {{ dialogDetalle.titulo }}</span>
            <v-chip v-if="dialogDetalle.chipLabel" size="small" color="primary" variant="tonal">
              {{ dialogDetalle.chipLabel }}
            </v-chip>
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
            :headers="headersDialogAsesor"
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
            <template #item.cliente_nombre="{ item }">
              <v-chip v-if="!item.cliente_nombre" size="x-small" color="grey" variant="tonal">
                Sin RepGeneral
              </v-chip>
              <span v-else>{{ item.cliente_nombre }}</span>
            </template>
            <template #item.cliente_documento="{ item }">{{ item.cliente_documento ?? '—' }}</template>

            <template #body.append v-if="dialogDetalle.detalle.length">
              <tr class="fila-totales">
                <td colspan="7" class="font-weight-bold">
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
import { ref, computed, reactive, onMounted, watch } from 'vue'
import * as XLSX from 'xlsx'
import {
  getReporteAsesores,
  getDetalleAsesor,
  getDetalleCanal,
  getRangoMesActual,
  type ReporteAsesoresResponse,
  type ReporteAsesor,
  type DetalleTicket,
} from '@/services/reportesAdminService'

/* ===== Filtros de fecha (por defecto: mes actual) ===== */
const rangoMes = getRangoMesActual()
const fechaInicio = ref(rangoMes.inicio)
const fechaFin = ref(rangoMes.fin)

const loading = ref(false)
const snack = reactive({ show: false, text: '' })

/* ===== Datos del reporte ===== */
const asesoresData = ref<ReporteAsesoresResponse | null>(null)
const asesoresRows = computed(() => asesoresData.value?.asesores ?? [])

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

/* ===== Headers de tablas resumen ===== */
const headersAsesorComercial = [
  { title: 'Nombre', key: 'nombre' },
  { title: 'Directos', key: 'vehiculos_directos' },
  { title: 'Con Convenio', key: 'vehiculos_convenio' },
  { title: 'Total', key: 'total_vehiculos' },
  { title: 'Total Bruto', key: 'total_bruto' },
  { title: 'Total Neto', key: 'total_neto' },
]

const headersAsesorConvenio = [
  { title: 'Nombre', key: 'nombre' },
  { title: 'Convenio', key: 'convenio_nombre' },
  { title: 'Vehículos', key: 'total_vehiculos' },
  { title: 'Total Bruto', key: 'total_bruto' },
  { title: 'Total Neto', key: 'total_neto' },
]

const headersConvenios = [
  { title: 'Convenio', key: 'convenio_nombre' },
  { title: 'Asesores', key: 'asesores' },
  { title: 'Vehículos', key: 'vehiculos' },
  { title: 'Total Bruto', key: 'total_bruto' },
]

/* ===== Headers de la tabla del dialog de detalle ===== */
const headersDialogAsesor = [
  { title: 'Placa', key: 'placa' },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Tipo Vehículo', key: 'tipo_vehiculo' },
  { title: 'Valor', key: 'total' },
  { title: 'Convenio', key: 'convenio_nombre' },
  { title: 'Cliente', key: 'cliente_nombre' },
  { title: 'Documento', key: 'cliente_documento' },
]

/* ===== Segmento activo + búsqueda ===== */
type SegmentoAsesor = 'COMERCIAL' | 'CONVENIO_ASESOR' | 'CONVENIO'
const segmentoAsesor = ref<SegmentoAsesor>('COMERCIAL')
const busquedaAsesor = ref('')

/**
 * El endpoint /reportes-admin/asesores no trae `convenio_nombre` por fila
 * (agrupa por agente_id + canal, sin desglosar convenio). Para poblar la
 * columna "Convenio" del segmento Asesor Convenio y para armar el segmento
 * Convenio completo, se reutiliza /reportes-admin/detalle-canal con
 * canal=ASESOR_CONVENIO (mismo endpoint del drill-down), que sí trae
 * convenio_nombre por ticket. Se carga una sola vez (lazy) y se cachea.
 */
const convenioDetalleRows = ref<DetalleTicket[]>([])
const convenioDetalleLoaded = ref(false)
const convenioDetalleLoading = ref(false)

async function ensureConvenioDetalle() {
  if (convenioDetalleLoaded.value || convenioDetalleLoading.value) return
  convenioDetalleLoading.value = true
  try {
    const resp = await getDetalleCanal(fechaInicio.value, fechaFin.value, 'ASESOR_CONVENIO')
    convenioDetalleRows.value = resp.detalle
    convenioDetalleLoaded.value = true
  } catch (err) {
    console.error('Error cargando datos de convenio:', err)
    snack.text = '❌ Error al cargar datos de convenio'
    snack.show = true
  } finally {
    convenioDetalleLoading.value = false
  }
}

watch(segmentoAsesor, (val) => {
  if (val !== 'COMERCIAL') ensureConvenioDetalle()
})

/* ===== Segmento: Asesor Comercial ===== */
const asesoresComercial = computed(() => {
  let rows = asesoresRows.value.filter((a) => a.canal === 'ASESOR_COMERCIAL')
  const q = busquedaAsesor.value.trim().toLowerCase()
  if (q) rows = rows.filter((a) => a.nombre.toLowerCase().includes(q))
  return rows
})

/* ===== Segmento: Asesor Convenio (enriquecido con convenio_nombre) ===== */
const convenioPorAsesorNombre = computed(() => {
  const map = new Map<string, string>()
  for (const d of convenioDetalleRows.value) {
    const key = d.asesor_convenio_nombre
    if (key && d.convenio_nombre && !map.has(key)) map.set(key, d.convenio_nombre)
  }
  return map
})

const asesoresConvenio = computed(() => {
  let rows = asesoresRows.value
    .filter((a) => a.canal === 'ASESOR_CONVENIO')
    .map((a) => ({ ...a, convenio_nombre: convenioPorAsesorNombre.value.get(a.nombre) ?? null }))
  const q = busquedaAsesor.value.trim().toLowerCase()
  if (q) rows = rows.filter((a) => a.nombre.toLowerCase().includes(q))
  return rows
})

/* ===== Segmento: Convenio (agrupado desde convenioDetalleRows) =====
 * Nota: no incluye "Total Neto" porque detalle-canal no trae `subtotal`
 * por ticket (solo detalle-asesor lo trae); solo Total Bruto es exacto
 * en esta agrupación por convenio. */
interface ConvenioResumen {
  convenio_nombre: string
  asesores: number
  vehiculos: number
  total_bruto: number
}

const conveniosAgrupados = computed<ConvenioResumen[]>(() => {
  const map = new Map<string, { asesores: Set<string>; vehiculos: number; total_bruto: number }>()
  for (const d of convenioDetalleRows.value) {
    if (!d.convenio_nombre) continue
    if (!map.has(d.convenio_nombre)) {
      map.set(d.convenio_nombre, { asesores: new Set(), vehiculos: 0, total_bruto: 0 })
    }
    const g = map.get(d.convenio_nombre)!
    if (d.asesor_convenio_nombre) g.asesores.add(d.asesor_convenio_nombre)
    g.vehiculos += 1
    g.total_bruto += d.total || 0
  }

  let rows: ConvenioResumen[] = Array.from(map.entries()).map(([convenio_nombre, g]) => ({
    convenio_nombre,
    asesores: g.asesores.size,
    vehiculos: g.vehiculos,
    total_bruto: g.total_bruto,
  }))

  const q = busquedaAsesor.value.trim().toLowerCase()
  if (q) rows = rows.filter((r) => r.convenio_nombre.toLowerCase().includes(q))

  return rows.sort((a, b) => b.total_bruto - a.total_bruto)
})

const filasSegmentoActivo = computed(() => {
  if (segmentoAsesor.value === 'COMERCIAL') return asesoresComercial.value
  if (segmentoAsesor.value === 'CONVENIO_ASESOR') return asesoresConvenio.value
  return conveniosAgrupados.value
})
const asesoresTabTieneDatos = computed(() => filasSegmentoActivo.value.length > 0)

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
    asesoresData.value = await getReporteAsesores(fechaInicio.value, fechaFin.value)

    // El caché de convenio queda ligado al rango de fechas anterior: se
    // invalida y, si el segmento activo lo necesita, se recarga.
    convenioDetalleRows.value = []
    convenioDetalleLoaded.value = false
    if (segmentoAsesor.value !== 'COMERCIAL') await ensureConvenioDetalle()
  } catch (err) {
    console.error('Error generando reporte de asesores:', err)
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

function sanitizeFilename(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function exportarAsesores() {
  if (segmentoAsesor.value === 'COMERCIAL') {
    const encabezados = ['Nombre', 'Directos', 'Con Convenio', 'Total', 'Total Bruto', 'Total Neto']
    const filas = asesoresComercial.value.map((r) => [
      r.nombre,
      r.vehiculos_directos,
      r.vehiculos_convenio,
      r.total_vehiculos,
      r.total_bruto,
      r.total_neto,
    ])
    exportarExcel('ReporteAsesorComercial', encabezados, filas)
  } else if (segmentoAsesor.value === 'CONVENIO_ASESOR') {
    const encabezados = ['Nombre', 'Convenio', 'Vehículos', 'Total Bruto', 'Total Neto']
    const filas = asesoresConvenio.value.map((r) => [
      r.nombre,
      r.convenio_nombre ?? '—',
      r.total_vehiculos,
      r.total_bruto,
      r.total_neto,
    ])
    exportarExcel('ReporteAsesorConvenio', encabezados, filas)
  } else {
    const encabezados = ['Convenio', 'Asesores', 'Vehículos', 'Total Bruto']
    const filas = conveniosAgrupados.value.map((r) => [r.convenio_nombre, r.asesores, r.vehiculos, r.total_bruto])
    exportarExcel('ReporteConvenios', encabezados, filas)
  }
}

/* ===== Dialog de detalle (drill-down asesor / convenio) ===== */
interface DialogDetalleState {
  open: boolean
  loading: boolean
  modo: 'asesor' | 'convenio'
  titulo: string
  chipLabel: string | null
  canalCodigo: string
  totalVehiculos: number
  totalBruto: number
  detalle: DetalleTicket[]
}

const dialogDetalle = reactive<DialogDetalleState>({
  open: false,
  loading: false,
  modo: 'asesor',
  titulo: '',
  chipLabel: null,
  canalCodigo: '',
  totalVehiculos: 0,
  totalBruto: 0,
  detalle: [],
})

function soloFecha(fecha: string | null | undefined) {
  if (!fecha) return '—'
  return String(fecha).slice(0, 10)
}

function onClickAsesorRow(_e: unknown, { item }: { item: ReporteAsesor }) {
  abrirDetalleAsesor(item.agente_id, item.canal, item.nombre)
}
function onClickConvenioRow(_e: unknown, { item }: { item: ConvenioResumen }) {
  abrirDetalleConvenio(item.convenio_nombre)
}

async function abrirDetalleAsesor(agenteId: number, canal: string, nombre: string) {
  dialogDetalle.open = true
  dialogDetalle.loading = true
  dialogDetalle.modo = 'asesor'
  dialogDetalle.titulo = nombre
  dialogDetalle.chipLabel = nombreCanal(canal)
  dialogDetalle.canalCodigo = canal
  dialogDetalle.detalle = []
  dialogDetalle.totalVehiculos = 0
  dialogDetalle.totalBruto = 0

  try {
    const resp = await getDetalleAsesor(fechaInicio.value, fechaFin.value, agenteId, canal)
    dialogDetalle.titulo = resp.nombre || nombre
    dialogDetalle.detalle = resp.detalle
    dialogDetalle.totalVehiculos = resp.total_vehiculos
    dialogDetalle.totalBruto = resp.total_bruto
  } catch (err) {
    console.error('Error cargando detalle del asesor:', err)
    snack.text = '❌ Error al cargar el detalle del asesor'
    snack.show = true
    dialogDetalle.open = false
  } finally {
    dialogDetalle.loading = false
  }
}

/** El detalle por convenio se arma en el frontend filtrando el caché de
 * detalle-canal(ASESOR_CONVENIO) que ya está cargado para el segmento
 * Convenio — no requiere una llamada adicional al backend. */
function abrirDetalleConvenio(convenioNombre: string) {
  const rows = convenioDetalleRows.value.filter((d) => d.convenio_nombre === convenioNombre)

  dialogDetalle.open = true
  dialogDetalle.loading = false
  dialogDetalle.modo = 'convenio'
  dialogDetalle.titulo = convenioNombre
  dialogDetalle.chipLabel = 'Convenio'
  dialogDetalle.canalCodigo = 'ASESOR_CONVENIO'
  dialogDetalle.detalle = rows
  dialogDetalle.totalVehiculos = rows.length
  dialogDetalle.totalBruto = rows.reduce((acc, r) => acc + (r.total || 0), 0)
}

function exportarDialogDetalle() {
  const encabezados = ['Placa', 'Fecha', 'Tipo Vehículo', 'Valor', 'Convenio', 'Cliente', 'Documento']

  const filas = dialogDetalle.detalle.map((d) => [
    d.placa,
    soloFecha(d.fecha),
    d.tipo_vehiculo ?? '—',
    d.total,
    d.convenio_nombre ?? '—',
    d.cliente_nombre ?? 'Sin RepGeneral',
    d.cliente_documento ?? '—',
  ])

  const nombreBase =
    dialogDetalle.modo === 'asesor'
      ? `DetalleAsesor_${sanitizeFilename(dialogDetalle.titulo)}`
      : `DetalleConvenio_${sanitizeFilename(dialogDetalle.titulo)}`

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
