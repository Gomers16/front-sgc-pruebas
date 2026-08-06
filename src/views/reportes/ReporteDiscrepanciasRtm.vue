<!-- src/views/reportes/ReporteDiscrepanciasRtm.vue -->
<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-file-compare</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Discrepancias RTM</div>
            <div class="text-medium-emphasis">
              SGC vs Tecnoingeniería — un informe por cada importación de RepGeneral
            </div>
          </div>
        </div>
      </v-card-title>

      <v-divider />

      <!-- FILTROS (opcionales, sobre el período cubierto por cada informe) -->
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
              clearable
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
              clearable
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-btn
              color="primary"
              prepend-icon="mdi-magnify"
              :loading="historial.loading"
              block
              @click="filtrar"
            >
              Filtrar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- TABLA -->
    <v-card elevation="8" class="rounded-xl">
      <v-card-text class="pt-5">
        <v-table density="compact" class="mb-2">
          <thead>
            <tr>
              <th>Período</th>
              <th>Archivo</th>
              <th>Generado</th>
              <th>Por</th>
              <th class="text-right">Tecno válido</th>
              <th class="text-right">Coinciden</th>
              <th class="text-right">Requiere revisión</th>
              <th class="text-center">Excel</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="informe in historial.items" :key="informe.id">
              <td>{{ informe.fechaInicio }} a {{ informe.fechaFin }}</td>
              <td>{{ informe.archivoNombre ?? '—' }}</td>
              <td>{{ formatFechaHora(informe.generadoAt) }}</td>
              <td>{{ informe.generadoPor ?? '—' }}</td>
              <td class="text-right">{{ informe.resumen.totalTecnoValido }}</td>
              <td class="text-right">{{ informe.resumen.totalCoinciden }}</td>
              <td class="text-right">
                <v-chip
                  size="small"
                  :color="totalRequiereRevision(informe) > 0 ? 'warning' : 'success'"
                  variant="tonal"
                >
                  {{ totalRequiereRevision(informe) }}
                </v-chip>
              </td>
              <td class="text-center">
                <v-btn
                  icon="mdi-file-excel"
                  size="small"
                  variant="text"
                  color="success"
                  :loading="excelLoadingId === informe.id"
                  @click="descargarExcel(informe)"
                />
              </td>
            </tr>
            <tr v-if="!historial.items.length && !historial.loading">
              <td colspan="8" class="text-center text-medium-emphasis">
                Sin informes de discrepancias registrados
              </td>
            </tr>
            <tr v-if="historial.loading">
              <td colspan="8" class="text-center py-4">
                <v-progress-circular indeterminate color="primary" size="24" />
              </td>
            </tr>
          </tbody>
        </v-table>

        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-caption text-medium-emphasis">{{ historial.total }} informe(s)</div>
          <div class="d-flex align-center gap-2">
            <v-btn size="small" variant="text" :disabled="historial.page <= 1" @click="cambiarPagina(-1)">
              Anterior
            </v-btn>
            <span class="text-caption">Página {{ historial.page }}</span>
            <v-btn
              size="small"
              variant="text"
              :disabled="historial.items.length < historial.perPage"
              @click="cambiarPagina(1)"
            >
              Siguiente
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snack.show" :timeout="3000" color="error">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  getDiscrepanciasRtmHistorial,
  descargarDiscrepanciasRtmExcel,
  type DiscrepanciasRtmItem,
} from '@/services/reportesAdminService'

const fechaInicio = ref<string | null>(null)
const fechaFin = ref<string | null>(null)

interface HistorialState {
  items: DiscrepanciasRtmItem[]
  total: number
  page: number
  perPage: number
  loading: boolean
}

const historial = reactive<HistorialState>({
  items: [],
  total: 0,
  page: 1,
  perPage: 15,
  loading: false,
})

const snack = reactive({ show: false, text: '' })

async function cargarHistorial() {
  historial.loading = true
  try {
    const res = await getDiscrepanciasRtmHistorial({
      page: historial.page,
      perPage: historial.perPage,
      fechaInicio: fechaInicio.value ?? undefined,
      fechaFin: fechaFin.value ?? undefined,
    })
    historial.items = res.data
    historial.total = res.total
  } catch (err) {
    console.error('Error cargando historial de discrepancias RTM:', err)
    historial.items = []
    snack.text = 'Error al cargar el historial de discrepancias RTM'
    snack.show = true
  } finally {
    historial.loading = false
  }
}

function filtrar() {
  historial.page = 1
  cargarHistorial()
}

function cambiarPagina(delta: number) {
  const nuevaPagina = historial.page + delta
  if (nuevaPagina < 1) return
  historial.page = nuevaPagina
  cargarHistorial()
}

/** Todo lo que NO es una coincidencia limpia: los 7 tipos + duplicados + ambiguos. */
function totalRequiereRevision(informe: DiscrepanciasRtmItem): number {
  const r = informe.resumen
  return (
    r.totalTipo1PlacaMalDigitada +
    r.totalTipo2ActivoDebeFinalizar +
    r.totalTipo3TurnoFantasma +
    r.totalTipo4ServicioMalAsignado +
    r.totalTipo5FaltaEnSgc +
    r.totalTipo6AlertaCobroNoRegistrado +
    r.totalTipo7FinalizadoSinRastroTecno +
    r.totalDuplicadosFinalizado +
    r.totalAmbiguosRevisarManual
  )
}

function formatFechaHora(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

/** Mismo patrón de descarga usado en ComisionesList.vue para los Excel de reportes-admin. */
function descargarBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const excelLoadingId = ref<number | null>(null)
async function descargarExcel(informe: DiscrepanciasRtmItem) {
  excelLoadingId.value = informe.id
  try {
    const blob = await descargarDiscrepanciasRtmExcel(informe.id)
    descargarBlob(blob, `Discrepancias_RTM_${informe.fechaInicio}_${informe.fechaFin}.xlsx`)
  } catch (err) {
    console.error('Error descargando Excel de discrepancias RTM:', err)
    snack.text = 'Error al generar el Excel de discrepancias RTM'
    snack.show = true
  } finally {
    excelLoadingId.value = null
  }
}

onMounted(() => {
  cargarHistorial()
})
</script>

<style scoped>
.rounded-xl { border-radius: 16px; }
.rounded-2xl { border-radius: 20px; }
.text-medium-emphasis { color: rgba(0,0,0,.6); }
</style>
