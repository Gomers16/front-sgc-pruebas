<!-- src/views/reportes/ReporteSegundaVez.vue -->
<template>
  <v-container class="py-6">
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="deep-purple-darken-2">
            <v-icon>mdi-autorenew</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Segunda vez</div>
            <div class="text-medium-emphasis">
              Rechazos de RTM y Preventiva y qué pasó con su ventana de 15 días (solo conteos)
            </div>
          </div>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-row align="center" dense>
          <v-col cols="12" sm="6" md="2">
            <v-text-field
              v-model="fechaInicio"
              label="Fecha inicio"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-text-field
              v-model="fechaFin"
              label="Fecha fin"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-select
              v-model="servicio"
              :items="serviciosItems"
              label="Servicio"
              density="compact"
              variant="outlined"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-select
              v-model="sedeId"
              :items="sedesItems"
              item-title="nombre"
              item-value="id"
              label="Sede"
              density="compact"
              variant="outlined"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field
              v-model="placa"
              label="Placa"
              density="compact"
              variant="outlined"
              clearable
              hide-details
              @keyup.enter="generarReporte"
            />
          </v-col>
          <v-col cols="6" sm="6" md="2">
            <v-select
              v-model="estado"
              :items="estadosItems"
              label="Estado de la ventana"
              density="compact"
              variant="outlined"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" variant="tonal" prepend-icon="mdi-calendar-range" block>
                  Rangos rápidos
                </v-btn>
              </template>
              <v-list>
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
          <v-col cols="12" sm="6" md="3">
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

    <v-alert v-if="reporte?.aviso" type="warning" variant="tonal" class="mb-4" icon="mdi-clock-alert">
      {{ reporte.aviso }}
    </v-alert>

    <v-row v-if="reporte" dense class="mb-4">
      <v-col v-for="k in kpis" :key="k.label" cols="6" sm="4" md="3" lg="2">
        <v-card elevation="4" class="rounded-xl pa-3 h-100">
          <div class="text-caption text-medium-emphasis">{{ k.label }}</div>
          <div class="text-h6 font-weight-bold" :class="k.clase">{{ k.valor }}</div>
          <div v-if="k.ayuda" class="text-caption text-medium-emphasis">{{ k.ayuda }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-card elevation="8" class="rounded-xl">
      <v-card-text>
        <div class="d-flex justify-end mb-3">
          <v-btn
            variant="tonal"
            color="green-darken-2"
            prepend-icon="mdi-file-excel"
            :loading="exportando"
            :disabled="!reporte"
            @click="exportarExcel"
          >
            Exportar Excel
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="reporte?.detalle ?? []"
          :loading="loading"
          item-value="turno_origen_id"
          hover
          density="comfortable"
        >
          <template #item.servicio="{ item }">
            <v-chip size="small" :color="item.servicio === 'RTM' ? 'blue' : 'orange'" variant="flat">
              {{ item.servicio }}
            </v-chip>
          </template>
          <template #item.origen="{ item }">
            <div class="font-weight-medium">{{ item.turno_origen_codigo }}</div>
            <div class="text-caption text-medium-emphasis">
              Rechazo: {{ formatFechaHora(item.rechazado_at) }}
              <span v-if="item.certificado_por"> · {{ item.certificado_por }}</span>
            </div>
            <div v-if="item.rechazo_corregido" class="text-caption text-deep-purple">
              Corregido a {{ item.resultado_actual }}
            </div>
          </template>
          <template #item.ventana_hasta="{ item }">
            {{ formatFechaHora(item.ventana_hasta) }}
          </template>
          <template #item.estado="{ item }">
            <v-chip size="small" :color="colorEstado(item.estado)" variant="tonal">
              {{ etiquetaEstado(item.estado) }}
            </v-chip>
            <div v-if="item.regreso_tras_vencer_pagando" class="text-caption text-medium-emphasis">
              Regresó pagando ({{ item.turno_posterior_codigo }})
            </div>
          </template>
          <template #item.segunda_vez="{ item }">
            <template v-if="item.segunda_vez_codigo">
              <div>{{ item.segunda_vez_codigo }}</div>
              <v-chip
                size="x-small"
                :color="
                  item.segunda_vez_resultado === 'APROBADA'
                    ? 'success'
                    : item.segunda_vez_resultado === 'RECHAZADA'
                      ? 'error'
                      : 'grey'
                "
                variant="tonal"
              >
                {{ item.segunda_vez_resultado }}
              </v-chip>
            </template>
            <span v-else class="text-medium-emphasis">—</span>
          </template>
          <template #item.horas_transcurridas="{ item }">
            {{ item.horas_transcurridas === null ? '—' : `${item.horas_transcurridas} h` }}
          </template>
        </v-data-table>

        <v-alert v-if="reporte && !reporte.detalle.length" type="info" variant="tonal" class="mt-4">
          No hay rechazos para los filtros seleccionados.
        </v-alert>
        <v-alert type="info" variant="tonal" density="compact" class="mt-4">
          Tasa de regreso = usadas / (usadas + vencidas). "Superada": hubo otro turno de la
          placa que no fue su segunda vez (p. ej. regresó y pagó normal). "Anulada": el origen
          se canceló o su rechazo se corrigió a Aprobada. Horas transcurridas: del rechazo al
          regreso (o a hoy si no ha regresado).
        </v-alert>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { DateTime } from 'luxon'
import {
  descargarReporteSegundaVezExcel,
  getRangoMesActual,
  getReporteSegundaVez,
  type EstadoVentanaSegundaVez,
  type FiltrosReporteSegundaVez,
  type ReporteSegundaVezResponse,
} from '@/services/reportesAdminService'
import { obtenerSedes } from '@/services/UserService'

const rangoMes = getRangoMesActual()
const fechaInicio = ref(rangoMes.inicio)
const fechaFin = ref(rangoMes.fin)
const servicio = ref<'RTM' | 'PREV' | null>(null)
const sedeId = ref<number | null>(null)
const placa = ref<string | null>(null)
const estado = ref<EstadoVentanaSegundaVez | null>(null)

const loading = ref(false)
const exportando = ref(false)
const snack = reactive({ show: false, text: '' })
const reporte = ref<ReporteSegundaVezResponse | null>(null)
const sedesItems = ref<{ id: number; nombre: string }[]>([])

const serviciosItems = [
  { title: 'RTM', value: 'RTM' },
  { title: 'Preventiva', value: 'PREV' },
]
const ESTADOS: Record<EstadoVentanaSegundaVez, { label: string; color: string }> = {
  ABIERTA: { label: 'Abierta', color: 'blue' },
  USADA: { label: 'Usada', color: 'success' },
  VENCIDA: { label: 'Vencida', color: 'error' },
  SUPERADA: { label: 'Superada', color: 'amber-darken-2' },
  ANULADA: { label: 'Anulada', color: 'grey' },
}
const estadosItems = (Object.keys(ESTADOS) as EstadoVentanaSegundaVez[]).map((k) => ({
  title: ESTADOS[k].label,
  value: k,
}))
const etiquetaEstado = (e: string) => ESTADOS[e as EstadoVentanaSegundaVez]?.label ?? e
const colorEstado = (e: string) => ESTADOS[e as EstadoVentanaSegundaVez]?.color ?? 'grey'

const headers = [
  { title: 'Placa', key: 'placa' },
  { title: 'Servicio', key: 'servicio' },
  { title: 'Sede', key: 'sede' },
  { title: 'Turno de origen', key: 'origen', sortable: false },
  { title: 'Ventana hasta', key: 'ventana_hasta' },
  { title: 'Estado', key: 'estado' },
  { title: 'Segunda vez', key: 'segunda_vez', sortable: false },
  { title: 'Horas', key: 'horas_transcurridas' },
]

const kpis = computed(() => {
  const i = reporte.value?.indicadores
  if (!i) return []
  return [
    { label: 'Rechazos', valor: i.rechazos },
    { label: 'Abiertas hoy', valor: i.abiertas, clase: 'text-blue' },
    { label: 'Usadas', valor: i.usadas, clase: 'text-success' },
    { label: 'Vencidas (no regresaron)', valor: i.vencidas, clase: 'text-error' },
    { label: 'Superadas', valor: i.superadas },
    { label: 'Anuladas', valor: i.anuladas },
    {
      label: 'Tasa de regreso',
      valor: i.tasa_regreso_pct === null ? '—' : `${i.tasa_regreso_pct} %`,
      ayuda: 'usadas / (usadas + vencidas)',
    },
    {
      label: '2ª vez aprobadas / rechazadas',
      valor: `${i.segundas_veces.aprobadas} / ${i.segundas_veces.rechazadas}`,
      ayuda: `${i.segundas_veces.pendientes} pendientes`,
    },
    {
      label: 'Horas promedio al regreso',
      valor: i.horas_promedio_hasta_regreso === null ? '—' : `${i.horas_promedio_hasta_regreso} h`,
    },
    {
      label: 'Regresaron tras vencer',
      valor: i.regresaron_tras_vencer_pagando,
      ayuda: 'pagando normal, ≤ 30 días',
    },
  ]
})

function filtros(): FiltrosReporteSegundaVez {
  return {
    fecha_inicio: fechaInicio.value,
    fecha_fin: fechaFin.value,
    servicio: servicio.value,
    sede_id: sedeId.value,
    placa: placa.value?.trim() || null,
    estado: estado.value,
  }
}

function formatFechaHora(iso: string | null) {
  if (!iso) return '—'
  const d = DateTime.fromISO(iso, { zone: 'America/Bogota' })
  return d.isValid ? d.toFormat('dd/LL/yyyy hh:mm a') : iso
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
    reporte.value = await getReporteSegundaVez(filtros())
  } catch (err) {
    console.error('Error generando reporte de segunda vez:', err)
    snack.text = `❌ ${err instanceof Error ? err.message : 'Error generando el reporte'}`
    snack.show = true
  } finally {
    loading.value = false
  }
}

async function exportarExcel() {
  exportando.value = true
  try {
    const blob = await descargarReporteSegundaVezExcel(filtros())
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Segunda_Vez_${fechaInicio.value}_${fechaFin.value}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    snack.text = `❌ ${err instanceof Error ? err.message : 'No se pudo exportar'}`
    snack.show = true
  } finally {
    exportando.value = false
  }
}

onMounted(async () => {
  try {
    const sedes = await obtenerSedes()
    sedesItems.value = (sedes ?? []).map((s) => ({ id: s.id, nombre: s.nombre }))
  } catch {
    sedesItems.value = []
  }
  await generarReporte()
})
</script>
