<!--
Control de Telemercadeo · Resumen: totales y embudo, por medio, por origen
(procedencia), por resultado y por asesor (semáforo, avance / ritmo) con
drill-down al historial. Excel con aviso si el detalle se cortó
(cabecera X-Detalle-Truncado).
-->
<template>
  <div class="pa-4">
    <v-row dense>
      <v-col cols="6" sm="3" md="2">
        <v-text-field v-model="desde" type="date" label="Desde" density="compact" variant="outlined" hide-details />
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-text-field v-model="hasta" type="date" label="Hasta" density="compact" variant="outlined" hide-details />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-autocomplete
          v-model="agenteId"
          :items="asesores"
          item-title="nombre"
          item-value="id"
          label="Asesor (todos)"
          density="compact"
          variant="outlined"
          hide-details
          clearable
        />
      </v-col>
      <v-col cols="12" md="5" class="d-flex align-center ga-2 flex-wrap">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-magnify" :loading="cargando" @click="cargar">
          Consultar
        </v-btn>
        <v-btn
          variant="tonal"
          color="success"
          prepend-icon="mdi-microsoft-excel"
          :loading="descargando"
          :disabled="descargando"
          @click="descargarExcel"
        >
          Excel
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" variant="tonal" class="mt-3" closable @click:close="error = ''">{{ error }}</v-alert>
    <v-alert v-if="avisoExcel" type="warning" variant="tonal" class="mt-3" closable @click:close="avisoExcel = ''">
      {{ avisoExcel }}
    </v-alert>

    <v-progress-linear v-if="cargando" indeterminate class="mt-3" />

    <template v-if="res">
      <!-- Embudo -->
      <div class="text-subtitle-1 font-weight-bold mt-4 mb-2">
        Embudo · {{ fmtFecha(res.rango.desde) }} a {{ fmtFecha(res.rango.hasta) }}
      </div>
      <v-row dense>
        <v-col v-for="e in embudo" :key="e.titulo" cols="6" md="3">
          <v-card variant="tonal" :color="e.color">
            <v-card-text>
              <div class="text-caption">{{ e.titulo }}</div>
              <div class="text-h5 font-weight-bold">{{ e.valor }}</div>
              <div class="text-caption">{{ e.tasa }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12" md="5">
          <div class="text-subtitle-2 font-weight-bold mb-1">Por canal de origen (procedencia)</div>
          <v-table density="compact">
            <thead>
              <tr><th>Origen</th><th class="text-end">Gestiones</th><th class="text-end">Dateos</th><th class="text-end">Exitosos</th><th class="text-end">Conversión</th></tr>
            </thead>
            <tbody>
              <tr v-for="o in res.por_origen" :key="o.origen_id">
                <td>{{ o.nombre }}</td>
                <td class="text-end">{{ o.gestiones }}</td>
                <td class="text-end">{{ o.dateos }}</td>
                <td class="text-end">{{ o.exitosos }}</td>
                <td class="text-end">{{ fmtPct(o.tasa_exito_sobre_gestiones) }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-col>
        <v-col cols="12" md="4">
          <div class="text-subtitle-2 font-weight-bold mb-1">Por medio de contacto</div>
          <v-table density="compact">
            <thead>
              <tr><th>Medio</th><th class="text-end">Gestiones</th><th class="text-end">Dateos</th><th class="text-end">Exitosos</th></tr>
            </thead>
            <tbody>
              <tr v-for="m in res.por_medio" :key="m.medio">
                <td>{{ etiquetaMedio(m.medio) }}</td>
                <td class="text-end">{{ m.gestiones }}</td>
                <td class="text-end">{{ m.dateos }}</td>
                <td class="text-end">{{ m.exitosos }}</td>
              </tr>
              <tr v-if="!res.por_medio.length"><td colspan="4" class="text-medium-emphasis">Sin gestiones</td></tr>
            </tbody>
          </v-table>
        </v-col>
        <v-col cols="12" md="3">
          <div class="text-subtitle-2 font-weight-bold mb-1">Por resultado</div>
          <v-table density="compact">
            <tbody>
              <tr v-for="r in res.por_resultado" :key="r.resultado">
                <td>
                  <v-chip size="x-small" :color="colorResultado(r.resultado)" variant="tonal">
                    {{ etiquetaResultado(r.resultado) }}
                  </v-chip>
                </td>
                <td class="text-end">{{ r.gestiones }}</td>
              </tr>
              <tr v-if="!res.por_resultado.length"><td class="text-medium-emphasis">Sin gestiones</td></tr>
            </tbody>
          </v-table>
        </v-col>
      </v-row>

      <div class="text-subtitle-1 font-weight-bold mt-4 mb-1">Por asesor</div>
      <div class="text-caption text-medium-emphasis mb-2">
        Semáforo sobre dateos exitosos. “Avance” compara con la meta completa del periodo;
        “ritmo”, con lo que toca a hoy. Clic en una fila para ver su historial.
      </div>
      <v-data-table
        :headers="headersAsesor"
        :items="res.por_asesor"
        item-value="agente_id"
        density="compact"
        hover
        :items-per-page="-1"
        hide-default-footer
        @click:row="onFila"
      >
        <template #item.nombre="{ item }">
          <span class="font-weight-medium">{{ item.nombre }}</span>
          <v-chip v-if="!item.activo" size="x-small" class="ml-1">Inactivo</v-chip>
        </template>
        <template #item.conversion="{ item }">{{ fmtPct(item.tasa_exito_sobre_gestiones) }}</template>
        <template v-for="k in METRICAS" :key="k" #[`item.meta_${k}`]="{ item }">
          <template v-if="presentarMeta(item.metas[k]).sinMeta">
            <span class="text-caption text-medium-emphasis">Sin meta definida</span>
          </template>
          <template v-else>
            <div class="text-body-2">{{ presentarMeta(item.metas[k]).cifra }}</div>
            <div class="text-caption text-no-wrap">
              {{ presentarMeta(item.metas[k]).avance }} · {{ presentarMeta(item.metas[k]).ritmo }}
            </div>
          </template>
        </template>
        <template #item.semaforo="{ item }">
          <v-chip
            v-if="!presentarMeta(item.metas.exitosos).sinMeta"
            size="small"
            variant="flat"
            :color="presentarMeta(item.metas.exitosos).color ?? undefined"
          >
            {{ presentarMeta(item.metas.exitosos).etiqueta }}
          </v-chip>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>
      </v-data-table>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { HttpError } from '@/services/http'
import {
  descargarResumenExcel,
  getResumenTele,
  type AsesorTele,
  type MetricaMeta,
  type ResumenAsesor,
  type ResumenTele,
} from '@/services/telemercadeoService'
import {
  colorResultado,
  etiquetaMedio,
  etiquetaResultado,
  fmtFecha,
  fmtPct,
  mesActualBogota,
  presentarMeta,
  rangoDeMes,
} from '../telemercadeoHelpers'

defineProps<{ asesores: AsesorTele[] }>()
const emit = defineEmits<{ 'ver-historial': [{ agenteId: number; desde: string; hasta: string }] }>()

const METRICAS: MetricaMeta[] = ['gestiones', 'dateos', 'exitosos']

const mes = mesActualBogota()
const rango = rangoDeMes(mes.mes, mes.anio)
const desde = ref<string | null>(rango.desde)
const hasta = ref<string | null>(rango.hasta)
const agenteId = ref<number | null>(null)

const res = ref<ResumenTele | null>(null)
const cargando = ref(false)
const descargando = ref(false)
const error = ref('')
const avisoExcel = ref('')

const headersAsesor = [
  { title: 'Asesor', key: 'nombre', sortable: true },
  { title: 'Gestiones', key: 'gestiones', align: 'end' as const },
  { title: 'Dateos', key: 'dateos', align: 'end' as const },
  { title: 'Exitosos', key: 'exitosos', align: 'end' as const },
  { title: 'Turnos', key: 'turnos', align: 'end' as const },
  { title: 'Conversión', key: 'conversion', sortable: false, align: 'end' as const },
  { title: 'Meta gestiones', key: 'meta_gestiones', sortable: false },
  { title: 'Meta dateos', key: 'meta_dateos', sortable: false },
  { title: 'Meta exitosos', key: 'meta_exitosos', sortable: false },
  { title: 'Semáforo', key: 'semaforo', sortable: false },
]

const embudo = computed(() => {
  const t = res.value?.totales
  if (!t) return []
  return [
    { titulo: 'Gestiones', valor: t.gestiones, tasa: ' ', color: 'primary' },
    { titulo: 'Dateos', valor: t.dateos, tasa: `${fmtPct(t.tasa_dateo)} de las gestiones`, color: 'info' },
    { titulo: 'Dateos exitosos', valor: t.exitosos, tasa: `${fmtPct(t.tasa_exito_sobre_dateos)} de los dateos`, color: 'success' },
    { titulo: 'Turnos logrados', valor: t.turnos, tasa: `${fmtPct(t.tasa_turno_sobre_gestiones)} de las gestiones`, color: 'secondary' },
  ]
})

function onFila(_e: unknown, fila: { item: ResumenAsesor }) {
  if (!res.value) return
  emit('ver-historial', { agenteId: fila.item.agente_id, desde: res.value.rango.desde, hasta: res.value.rango.hasta })
}

const params = () => ({ desde: desde.value, hasta: hasta.value, agente_id: agenteId.value })

async function cargar() {
  if (cargando.value) return
  cargando.value = true
  error.value = ''
  try {
    res.value = await getResumenTele(params())
  } catch (e) {
    error.value = e instanceof HttpError ? e.message : 'No se pudo cargar el resumen.'
  } finally {
    cargando.value = false
  }
}

async function descargarExcel() {
  if (descargando.value) return
  descargando.value = true
  avisoExcel.value = ''
  try {
    const { blob, nombre, truncado } = await descargarResumenExcel(params())
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombre
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    if (truncado) {
      avisoExcel.value = `El Excel se descargó, pero la hoja "Gestiones" trae solo las primeras ${truncado.toLocaleString('es-CO')} gestiones. Reduce el rango o filtra por asesor para ver el detalle completo. Las hojas de resumen sí están completas.`
    }
  } catch (e) {
    error.value = e instanceof HttpError ? e.message : 'No se pudo descargar el Excel.'
  } finally {
    descargando.value = false
  }
}

onMounted(cargar)
</script>
