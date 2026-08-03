<!-- src/views/reportes/SuperInforme.vue -->
<template>
  <v-container class="py-6">
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center py-4">
        <v-avatar size="40" class="mr-3" color="blue-darken-3">
          <v-icon>mdi-file-pdf-box</v-icon>
        </v-avatar>
        <div>
          <div class="text-h5 font-weight-bold">Súper Informe</div>
          <div class="text-medium-emphasis">
            Reporte consolidado en PDF: Meta Mensual, Meta Comercial por Asesor, Ingresos por Canal,
            Servicios (RTM), Retención de Clientes, Descuentos y Producción por Líder.
          </div>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-btn-toggle v-model="modo" mandatory density="compact" color="primary" class="mb-4" @update:model-value="onCambioModo">
          <v-btn value="dia">Día</v-btn>
          <v-btn value="semana">Semana</v-btn>
          <v-btn value="mes">Mes</v-btn>
          <v-btn value="personalizado">Personalizado</v-btn>
        </v-btn-toggle>

        <v-row v-if="modo === 'dia'" align="center" dense>
          <v-col cols="12" sm="6" md="4">
            <v-text-field v-model="diaSeleccionado" label="Día" type="date" density="compact" variant="outlined" hide-details />
          </v-col>
        </v-row>

        <v-row v-else-if="modo === 'semana'" align="center" dense>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="diaDeLaSemana"
              label="Cualquier día de la semana deseada"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="5">
            <div class="text-caption text-medium-emphasis">
              Semana calculada: <strong>{{ rangoActivo?.inicio ?? '—' }}</strong> (lunes) a
              <strong>{{ rangoActivo?.fin ?? '—' }}</strong> (domingo)
            </div>
          </v-col>
        </v-row>

        <v-row v-else-if="modo === 'mes'" align="center" dense>
          <v-col cols="6" sm="4" md="3">
            <v-select v-model="mesSeleccionado" :items="opcionesMes" label="Mes" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <v-text-field v-model.number="anioSeleccionado" label="Año" type="number" density="compact" variant="outlined" hide-details />
          </v-col>
        </v-row>

        <v-row v-else align="center" dense>
          <v-col cols="6" sm="4" md="3">
            <v-text-field v-model="fechaDesde" label="Desde" type="date" density="compact" variant="outlined" hide-details />
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <v-text-field v-model="fechaHasta" label="Hasta" type="date" density="compact" variant="outlined" hide-details />
          </v-col>
        </v-row>

        <v-row dense class="mt-2">
          <v-col cols="12" sm="6" md="4">
            <v-btn color="secondary" prepend-icon="mdi-eye-outline" :loading="cargandoPreview" block @click="aplicarFiltro">
              Aplicar filtro
            </v-btn>
          </v-col>
          <v-col v-if="previewDatos" cols="12" sm="6" md="4">
            <v-btn color="primary" prepend-icon="mdi-file-pdf-box" :loading="generandoPdf" block @click="generarPdf">
              Generar PDF
            </v-btn>
          </v-col>
        </v-row>

        <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact" class="mt-4">
          {{ errorMsg }}
        </v-alert>

        <v-alert v-if="exitoMsg" type="success" variant="tonal" density="compact" class="mt-4">
          {{ exitoMsg }}
        </v-alert>

        <div class="text-caption text-medium-emphasis mt-4">
          El rango puede cruzar meses: para Meta Mensual y Meta Comercial por Asesor, si el rango
          toca el mes en curso, la proyección de cierre se calcula solo con el ritmo de ese tramo;
          si toca solo meses ya cerrados, se muestra el real acumulado sin proyección.
        </div>
      </v-card-text>
    </v-card>

    <SuperInformePreview v-if="previewDatos" :datos="previewDatos" />
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import SuperInformePreview from './SuperInformePreview.vue'
import type { SuperInformePreviewDatos } from './SuperInformePreview.vue'
import {
  descargarSuperInformePdf,
  formatFecha,
  getSuperInformeMetaMensual,
  getSuperInformeMetaComercial,
  getIngresosPorCanal,
  getReporteServicios,
  getRetencionClientes,
  getDescuentosPorTipo,
  getDescuentosPorCanal,
  getDescuentosPorAutorizador,
  getProduccionPorLider,
} from '@/services/reportesAdminService'

type ModoFiltro = 'dia' | 'semana' | 'mes' | 'personalizado'

function hoyISO() {
  return formatFecha(new Date())
}
function primerDiaMesActualISO() {
  const d = new Date()
  return formatFecha(new Date(d.getFullYear(), d.getMonth(), 1))
}

/** Lunes (0) a domingo (6) de la semana que contiene `fechaStr` (YYYY-MM-DD). */
function rangoDeSemana(fechaStr: string): { inicio: string; fin: string } {
  const d = new Date(`${fechaStr}T00:00:00`)
  const dow = d.getDay() // 0=domingo..6=sábado
  const offsetDesdeLunes = (dow + 6) % 7
  const lunes = new Date(d)
  lunes.setDate(d.getDate() - offsetDesdeLunes)
  const domingo = new Date(lunes)
  domingo.setDate(lunes.getDate() + 6)
  return { inicio: formatFecha(lunes), fin: formatFecha(domingo) }
}

/** Primer y último día del mes/año dados. */
function rangoDeMes(mes: number, anio: number): { inicio: string; fin: string } {
  const primerDia = new Date(anio, mes - 1, 1)
  const ultimoDia = new Date(anio, mes, 0)
  return { inicio: formatFecha(primerDia), fin: formatFecha(ultimoDia) }
}

/** Mismo número de días, inmediatamente antes de [inicio, fin] — para el comparativo de Ingresos por Canal. */
function rangoAnterior(inicio: string, fin: string): { inicio: string; fin: string } {
  const di = new Date(`${inicio}T00:00:00`)
  const df = new Date(`${fin}T00:00:00`)
  const dias = Math.round((df.getTime() - di.getTime()) / 86400000) + 1
  const finAnterior = new Date(di)
  finAnterior.setDate(di.getDate() - 1)
  const inicioAnterior = new Date(finAnterior)
  inicioAnterior.setDate(finAnterior.getDate() - (dias - 1))
  return { inicio: formatFecha(inicioAnterior), fin: formatFecha(finAnterior) }
}

const modo = ref<ModoFiltro>('personalizado')

const diaSeleccionado = ref(hoyISO())
const diaDeLaSemana = ref(hoyISO())
const mesSeleccionado = ref(new Date().getMonth() + 1)
const anioSeleccionado = ref(new Date().getFullYear())
const fechaDesde = ref(primerDiaMesActualISO())
const fechaHasta = ref(hoyISO())

const opcionesMes = [
  { title: 'Enero', value: 1 }, { title: 'Febrero', value: 2 }, { title: 'Marzo', value: 3 },
  { title: 'Abril', value: 4 }, { title: 'Mayo', value: 5 }, { title: 'Junio', value: 6 },
  { title: 'Julio', value: 7 }, { title: 'Agosto', value: 8 }, { title: 'Septiembre', value: 9 },
  { title: 'Octubre', value: 10 }, { title: 'Noviembre', value: 11 }, { title: 'Diciembre', value: 12 },
]

function onCambioModo() {
  errorMsg.value = ''
}

/** Rango efectivo según el modo activo — recalculado cada vez que se usa (Aplicar filtro / Generar PDF). */
const rangoActivo = computed<{ inicio: string; fin: string } | null>(() => {
  if (modo.value === 'dia') {
    if (!diaSeleccionado.value) return null
    return { inicio: diaSeleccionado.value, fin: diaSeleccionado.value }
  }
  if (modo.value === 'semana') {
    if (!diaDeLaSemana.value) return null
    return rangoDeSemana(diaDeLaSemana.value)
  }
  if (modo.value === 'mes') {
    if (!mesSeleccionado.value || !anioSeleccionado.value) return null
    return rangoDeMes(mesSeleccionado.value, anioSeleccionado.value)
  }
  if (!fechaDesde.value || !fechaHasta.value) return null
  return { inicio: fechaDesde.value, fin: fechaHasta.value }
})


const cargandoPreview = ref(false)
const generandoPdf = ref(false)
const errorMsg = ref('')
const exitoMsg = ref('')
const previewDatos = ref<SuperInformePreviewDatos | null>(null)

async function aplicarFiltro() {
  errorMsg.value = ''
  exitoMsg.value = ''
  previewDatos.value = null

  const rango = rangoActivo.value
  if (!rango) {
    errorMsg.value = 'Selecciona un rango de fechas válido.'
    return
  }
  if (rango.inicio > rango.fin) {
    errorMsg.value = 'La fecha de inicio no puede ser mayor que la fecha fin.'
    return
  }

  cargandoPreview.value = true
  try {
    const anterior = rangoAnterior(rango.inicio, rango.fin)
    const [
      metaMensual,
      metaComercial,
      ingresosCanal,
      ingresosCanalAnterior,
      servicios,
      retencion,
      descuentosTipo,
      descuentosCanal,
      descuentosAutorizador,
      produccionLider,
    ] = await Promise.all([
      getSuperInformeMetaMensual(rango.inicio, rango.fin),
      getSuperInformeMetaComercial(rango.inicio, rango.fin),
      getIngresosPorCanal(rango.inicio, rango.fin),
      getIngresosPorCanal(anterior.inicio, anterior.fin),
      getReporteServicios(rango.inicio, rango.fin),
      getRetencionClientes(rango.inicio, rango.fin),
      getDescuentosPorTipo(rango.inicio, rango.fin),
      getDescuentosPorCanal(rango.inicio, rango.fin),
      getDescuentosPorAutorizador(rango.inicio, rango.fin),
      getProduccionPorLider(rango.inicio, rango.fin),
    ])

    previewDatos.value = {
      fechaInicio: rango.inicio,
      fechaFin: rango.fin,
      metaMensual,
      metaComercial,
      ingresosCanal,
      ingresosCanalAnterior,
      servicios,
      retencion,
      descuentosTipo,
      descuentosCanal,
      descuentosAutorizador,
      produccionLider,
    }
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'No se pudo generar la previsualización.'
  } finally {
    cargandoPreview.value = false
  }
}

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

async function generarPdf() {
  if (!previewDatos.value) return
  errorMsg.value = ''
  exitoMsg.value = ''
  generandoPdf.value = true
  try {
    const { fechaInicio, fechaFin } = previewDatos.value
    const blob = await descargarSuperInformePdf(fechaInicio, fechaFin)
    descargarBlob(blob, `Super_Informe_${fechaInicio}_${fechaFin}.pdf`)
    exitoMsg.value = 'Súper Informe generado correctamente.'
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'No se pudo generar el Súper Informe.'
  } finally {
    generandoPdf.value = false
  }
}
</script>
