<!-- src/views/reportes/SuperInformePreview.vue -->
<template>
  <div>
    <v-alert type="info" variant="tonal" density="compact" class="mb-4">
      Previsualización de los datos que traerá el PDF para el rango
      <strong>{{ datos.fechaInicio }}</strong> — <strong>{{ datos.fechaFin }}</strong>. Confirma que es
      lo esperado antes de generar el PDF.
    </v-alert>

    <!-- 1. Meta Mensual -->
    <v-card elevation="6" class="rounded-xl mb-4">
      <v-card-title class="d-flex align-center py-3">
        <v-avatar size="32" class="mr-2" color="blue-darken-3"><v-icon size="18">mdi-target</v-icon></v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">1. Meta Mensual</div>
          <div class="text-caption text-medium-emphasis">
            Avance de turnos RTM (livianos + motos) contra la meta del mes, con proyección de cierre y
            comparativo contra el mismo rango del año anterior.
          </div>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-row dense>
          <v-col cols="6" sm="4" md="3">
            <div class="text-caption text-medium-emphasis">Real del rango</div>
            <div class="text-body-1 font-weight-bold">{{ formatNum(datos.metaMensual.real_total.total) }}</div>
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <div class="text-caption text-medium-emphasis">Meta del mes completo</div>
            <div class="text-body-1 font-weight-bold">{{ formatNum(datos.metaMensual.meta_total.total) }}</div>
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <div class="text-caption text-medium-emphasis">% de la meta</div>
            <div class="text-body-1 font-weight-bold" :style="{ color: semaforoColor(datos.metaMensual.semaforo) }">
              {{ formatPct(datos.metaMensual.pct_real_sobre_meta) }} ({{ semaforoLabel(datos.metaMensual.semaforo) }})
            </div>
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <div class="text-caption text-medium-emphasis">Proyección de cierre</div>
            <div class="text-body-1 font-weight-bold">
              {{ datos.metaMensual.proyeccion_total ? formatNum(datos.metaMensual.proyeccion_total.total) : 'No aplica' }}
            </div>
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <div class="text-caption text-medium-emphasis">Livianos (real / meta)</div>
            <div class="text-body-1 font-weight-bold">
              {{ formatNum(datos.metaMensual.real_total.livianos) }} / {{ formatNum(datos.metaMensual.meta_total.livianos) }}
            </div>
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <div class="text-caption text-medium-emphasis">Motos (real / meta)</div>
            <div class="text-body-1 font-weight-bold">
              {{ formatNum(datos.metaMensual.real_total.motos) }} / {{ formatNum(datos.metaMensual.meta_total.motos) }}
            </div>
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <div class="text-caption text-medium-emphasis">Mismo rango, año anterior</div>
            <div class="text-body-1 font-weight-bold">{{ formatNum(datos.metaMensual.real_anio_anterior.total) }}</div>
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <div class="text-caption text-medium-emphasis">Variación interanual</div>
            <div
              class="text-body-1 font-weight-bold"
              :style="{ color: datos.metaMensual.variacion_abs >= 0 ? '#1e7e34' : '#c0392b' }"
            >
              {{ datos.metaMensual.variacion_abs >= 0 ? '+' : '' }}{{ formatNum(datos.metaMensual.variacion_abs) }}
              ({{ formatPct(datos.metaMensual.variacion_pct) }})
            </div>
          </v-col>
        </v-row>
        <v-data-table
          class="mt-4"
          density="compact"
          :headers="headersMetaMensual"
          :items="filasMetaMensual"
          hide-default-footer
        />
      </v-card-text>
    </v-card>

    <!-- 2. Meta Comercial por Asesor -->
    <v-card elevation="6" class="rounded-xl mb-4">
      <v-card-title class="d-flex align-center py-3">
        <v-avatar size="32" class="mr-2" color="blue-darken-3"><v-icon size="18">mdi-account-cash</v-icon></v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">2. Meta Comercial por Asesor</div>
          <div class="text-caption text-medium-emphasis">
            Avance de meta comercial (en pesos) por asesor Comercial, con proyección de cierre individual y
            comisión pagada vs. pendiente.
          </div>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-alert v-if="datos.metaComercial.nota" type="warning" variant="tonal" density="compact" class="mb-3">
          {{ datos.metaComercial.nota }}
        </v-alert>
        <v-row dense>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Total General / Meta</div>
            <div class="text-body-1 font-weight-bold">
              {{ formatPeso(datos.metaComercial.kpis.pesos_total) }} /
              {{ datos.metaComercial.kpis.meta_pesos === null ? 'Sin meta' : formatPeso(datos.metaComercial.kpis.meta_pesos) }}
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Convenio</div>
            <div class="text-body-1 font-weight-bold">{{ formatPeso(datos.metaComercial.kpis.pesos_convenio) }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Propio (Comercial)</div>
            <div class="text-body-1 font-weight-bold">{{ formatPeso(datos.metaComercial.kpis.pesos_comercial) }}</div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-caption text-medium-emphasis">Proyección de cierre</div>
            <div class="text-body-1 font-weight-bold">
              {{ datos.metaComercial.kpis.proyeccion_cierre === null ? '—' : formatPeso(datos.metaComercial.kpis.proyeccion_cierre) }}
            </div>
          </v-col>
        </v-row>
        <v-alert
          v-if="!datos.metaComercial.comision_estado_disponible"
          type="info"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          El desglose Comisión Pagada / Pendiente no está disponible en meses históricos ("N/D" en esos casos).
        </v-alert>
        <v-data-table
          class="mt-4"
          density="compact"
          :headers="headersMetaComercial"
          :items="filasMetaComercial"
          hide-default-footer
        >
          <template #item.cumplio="{ item }">
            <v-chip
              v-if="item.cumplio !== '—'"
              size="small"
              :color="item.cumplio === 'Sí' ? 'green' : 'red'"
              variant="tonal"
            >
              {{ item.cumplio }}
            </v-chip>
            <span v-else>—</span>
          </template>
        </v-data-table>
        <v-alert v-if="!datos.metaComercial.asesores.length" type="info" variant="tonal" density="compact" class="mt-3">
          Sin asesores con datos en este rango.
        </v-alert>

        <div class="text-caption font-weight-bold mb-1 mt-4">Unidades (vehículos)</div>
        <v-data-table density="compact" :headers="headersMetaComercialVehiculos" :items="filasMetaComercialVehiculos" hide-default-footer />
        <div class="text-caption text-medium-emphasis mt-1">
          Logrado (vehículos) = vehículos facturados atribuidos al asesor (facturacion_tickets), no filas de comisiones.
        </div>

        <template v-if="asesoresConDescuentos.length">
          <div class="text-caption font-weight-bold mb-1 mt-4">Descuentos dados por asesor</div>
          <div v-for="a in asesoresConDescuentos" :key="a.asesor_id" class="mb-2">
            <div class="text-body-2 font-weight-bold">{{ a.asesor_nombre }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ a.detalle }} (Total: {{ formatPeso(a.total) }})
            </div>
          </div>
        </template>
      </v-card-text>
    </v-card>

    <!-- 3. Ingresos por Canal -->
    <v-card elevation="6" class="rounded-xl mb-4">
      <v-card-title class="d-flex align-center py-3">
        <v-avatar size="32" class="mr-2" color="blue-darken-3"><v-icon size="18">mdi-chart-line</v-icon></v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">3. Ingresos por Canal</div>
          <div class="text-caption text-medium-emphasis">
            Vehículos e ingresos por canal de captación, comparado contra el período inmediatamente anterior
            de igual duración ({{ datos.ingresosCanalAnterior.fecha_inicio }} — {{ datos.ingresosCanalAnterior.fecha_fin }}).
          </div>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-data-table density="compact" :headers="headersIngresosCanal" :items="filasIngresosCanal" hide-default-footer>
          <template #item.variacion="{ item }">
            <span :style="{ color: item.variacionAbs >= 0 ? '#1e7e34' : '#c0392b' }">{{ item.variacion }}</span>
          </template>
        </v-data-table>
        <v-alert v-if="!datos.ingresosCanal.por_canal.length" type="info" variant="tonal" density="compact" class="mt-3">
          Sin datos en este rango.
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- 4. Servicios (RTM) -->
    <v-card elevation="6" class="rounded-xl mb-4">
      <v-card-title class="d-flex align-center py-3">
        <v-avatar size="32" class="mr-2" color="blue-darken-3"><v-icon size="18">mdi-car-wrench</v-icon></v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">4. Servicios (RTM)</div>
          <div class="text-caption text-medium-emphasis">
            Turnos por servicio y tipo de vehículo: valor Estimado (tarifa configurada) vs. valor Real cobrado
            (post-descuento, directo de la factura).
          </div>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-data-table density="compact" :headers="headersServicios" :items="filasServicios" hide-default-footer />
        <v-alert v-if="!datos.servicios.detalle.length" type="info" variant="tonal" density="compact" class="mt-3">
          Sin datos en este rango.
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- 5. Retención de Clientes -->
    <v-card elevation="6" class="rounded-xl mb-4">
      <v-card-title class="d-flex align-center py-3">
        <v-avatar size="32" class="mr-2" color="blue-darken-3"><v-icon size="18">mdi-account-reactivate</v-icon></v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">5. Retención de Clientes</div>
          <div class="text-caption text-medium-emphasis">
            Clientes Nuevos, Recurrentes y Recuperados, con el detalle de los más recientes de cada categoría
            (top {{ datos.retencion.top_clientes_limite }}).
          </div>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-row dense class="mb-3">
          <v-col cols="4">
            <div class="text-caption text-medium-emphasis">Nuevos</div>
            <div class="text-body-1 font-weight-bold">
              {{ formatNum(datos.retencion.resumen.nuevos.cantidad) }} ({{ formatPct(datos.retencion.resumen.nuevos.porcentaje) }})
            </div>
          </v-col>
          <v-col cols="4">
            <div class="text-caption text-medium-emphasis">Recurrentes</div>
            <div class="text-body-1 font-weight-bold">
              {{ formatNum(datos.retencion.resumen.recurrentes.cantidad) }} ({{ formatPct(datos.retencion.resumen.recurrentes.porcentaje) }})
            </div>
          </v-col>
          <v-col cols="4">
            <div class="text-caption text-medium-emphasis">Recuperaciones</div>
            <div class="text-body-1 font-weight-bold">
              {{ formatNum(datos.retencion.resumen.recuperaciones.cantidad) }} ({{ formatPct(datos.retencion.resumen.recuperaciones.porcentaje) }})
            </div>
          </v-col>
        </v-row>
        <div class="text-caption font-weight-bold mb-1">Por Canal</div>
        <v-data-table density="compact" :headers="headersRetencionCanal" :items="datos.retencion.por_canal" hide-default-footer class="mb-4">
          <template #item.canal="{ item }">{{ nombreCanal(item.canal) }}</template>
          <template #item.total_bruto="{ item }">{{ formatPeso(item.total_bruto) }}</template>
          <template #item.porcentaje="{ item }">{{ formatPct(item.porcentaje) }}</template>
        </v-data-table>

        <div v-for="cat in categoriasRetencion" :key="cat.key" class="mb-3">
          <div class="text-caption font-weight-bold mb-1">Top clientes — {{ cat.titulo }}</div>
          <v-data-table
            v-if="cat.filas.length"
            density="compact"
            :headers="headersTopClientes"
            :items="cat.filas"
            hide-default-footer
          />
          <v-alert v-else type="info" variant="tonal" density="compact">Sin registros en este rango.</v-alert>
        </div>
      </v-card-text>
    </v-card>

    <!-- 6. Descuentos -->
    <v-card elevation="6" class="rounded-xl mb-4">
      <v-card-title class="d-flex align-center py-3">
        <v-avatar size="32" class="mr-2" color="blue-darken-3"><v-icon size="18">mdi-tag-multiple</v-icon></v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">6. Descuentos</div>
          <div class="text-caption text-medium-emphasis">
            Descuentos aplicados a facturación RTM confirmada, por tipo, canal y quién autorizó.
          </div>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <div class="text-caption font-weight-bold mb-1">Por Tipo</div>
        <v-data-table density="compact" :headers="headersDescuentosTipo" :items="datos.descuentosTipo.por_tipo" hide-default-footer class="mb-2">
          <template #item.total_descuentos="{ item }">{{ formatPeso(item.total_descuentos) }}</template>
          <template #item.promedio="{ item }">{{ formatPeso(item.promedio) }}</template>
        </v-data-table>
        <div v-for="t in tiposConDescripcion" :key="t.codigo" class="text-caption text-medium-emphasis mb-3">
          <strong>{{ t.nombre }}:</strong> {{ t.descripcion }}
        </div>

        <div class="text-caption font-weight-bold mb-1 mt-2">Por Canal</div>
        <v-data-table density="compact" :headers="headersDescuentosCanal" :items="datos.descuentosCanal.por_canal" hide-default-footer class="mb-4">
          <template #item.canal="{ item }">{{ nombreCanal(item.canal) }}</template>
          <template #item.total_descuentos="{ item }">{{ formatPeso(item.total_descuentos) }}</template>
          <template #item.porcentaje="{ item }">{{ formatPct(item.porcentaje) }}</template>
        </v-data-table>

        <div class="text-caption font-weight-bold mb-1">Por Autorizador (Top 15 por monto)</div>
        <v-data-table density="compact" :headers="headersDescuentosAutorizador" :items="filasAutorizadorTop" hide-default-footer />
      </v-card-text>
    </v-card>

    <!-- 7. Producción por Líder -->
    <v-card elevation="6" class="rounded-xl mb-4">
      <v-card-title class="d-flex align-center py-3">
        <v-avatar size="32" class="mr-2" color="blue-darken-3"><v-icon size="18">mdi-account-group</v-icon></v-avatar>
        <div>
          <div class="text-subtitle-1 font-weight-bold">7. Producción por Líder</div>
          <div class="text-caption text-medium-emphasis">
            Producción agregada por sede/líder, más el detalle individual por funcionario.
          </div>
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <div class="text-caption font-weight-bold mb-1">Por Sede</div>
        <v-data-table density="compact" :headers="headersProduccionLider" :items="datos.produccionLider.por_sede" hide-default-footer class="mb-4">
          <template #item.total_bruto="{ item }">{{ formatPeso(item.total_bruto) }}</template>
          <template #item.total_neto="{ item }">{{ formatPeso(item.total_neto) }}</template>
        </v-data-table>

        <div class="text-caption font-weight-bold mb-1">Por Funcionario (detalle individual)</div>
        <v-data-table
          v-if="datos.produccionLider.por_funcionario.length"
          density="compact"
          :headers="headersProduccionFuncionario"
          :items="datos.produccionLider.por_funcionario"
          hide-default-footer
        >
          <template #item.total_bruto="{ item }">{{ formatPeso(item.total_bruto) }}</template>
          <template #item.total_neto="{ item }">{{ formatPeso(item.total_neto) }}</template>
        </v-data-table>
        <v-alert v-else type="info" variant="tonal" density="compact">Sin registros en este rango.</v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  SuperInformeMetaMensualResponse,
  SuperInformeMetaComercialResponse,
  IngresosCanalResponse,
  ReporteServiciosResponse,
  RetencionResponse,
  DescuentosPorTipoResponse,
  DescuentosPorCanalResponse,
  DescuentosPorAutorizadorResponse,
  ProduccionLiderResponse,
} from '@/services/reportesAdminService'

export interface SuperInformePreviewDatos {
  fechaInicio: string
  fechaFin: string
  metaMensual: SuperInformeMetaMensualResponse
  metaComercial: SuperInformeMetaComercialResponse
  ingresosCanal: IngresosCanalResponse
  ingresosCanalAnterior: IngresosCanalResponse
  servicios: ReporteServiciosResponse
  retencion: RetencionResponse
  descuentosTipo: DescuentosPorTipoResponse
  descuentosCanal: DescuentosPorCanalResponse
  descuentosAutorizador: DescuentosPorAutorizadorResponse
  produccionLider: ProduccionLiderResponse
}

const props = defineProps<{ datos: SuperInformePreviewDatos }>()

/* ===== Formato ===== */
function formatPeso(v: number | null | undefined): string {
  return `$ ${new Intl.NumberFormat('es-CO').format(Math.round(v ?? 0))}`
}
function formatNum(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : new Intl.NumberFormat('es-CO').format(v)
}
function formatPct(v: number | null | undefined): string {
  return v === null || v === undefined ? '—' : `${v}%`
}

const SEMAFORO_COLOR: Record<string, string> = {
  VERDE: '#1e7e34',
  AMARILLO: '#b8860b',
  ROJO: '#c0392b',
  SIN_META: '#666666',
}
const SEMAFORO_LABEL: Record<string, string> = {
  VERDE: 'Verde',
  AMARILLO: 'Amarillo',
  ROJO: 'Rojo',
  SIN_META: 'Sin meta',
}
function semaforoColor(s: string) {
  return SEMAFORO_COLOR[s] ?? '#666666'
}
function semaforoLabel(s: string) {
  return SEMAFORO_LABEL[s] ?? s
}

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

const MESES_LABEL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

/* ===== 1. Meta Mensual ===== */
const headersMetaMensual = [
  { title: 'Mes', key: 'mes' },
  { title: 'Meta', key: 'meta' },
  { title: 'Real', key: 'real' },
  { title: '% Avance', key: 'pct' },
]
const filasMetaMensual = computed(() =>
  props.datos.metaMensual.detalle_por_mes.map((m) => ({
    mes: `${MESES_LABEL[m.mes - 1]} ${m.anio}${m.es_mes_actual ? ' (actual)' : ''}`,
    meta: formatNum(m.meta.total),
    real: formatNum(m.real.total),
    pct: m.meta.total > 0 ? formatPct(Math.round((m.real.total / m.meta.total) * 1000) / 10) : '—',
  }))
)

/* ===== 2. Meta Comercial por Asesor ===== */
const headersMetaComercial = [
  { title: 'Asesor', key: 'asesor' },
  { title: 'Total', key: 'total' },
  { title: 'Meta', key: 'meta' },
  { title: '% Avance', key: 'pctAvance' },
  { title: 'Cumplió', key: 'cumplio' },
  { title: 'Faltante', key: 'faltante' },
  { title: 'Proy. Cierre', key: 'proyeccion' },
  { title: 'Com. Pagada', key: 'comisionPagada' },
  { title: 'Com. Pendiente', key: 'comisionPendiente' },
]
const filasMetaComercial = computed(() =>
  props.datos.metaComercial.asesores.map((a) => ({
    asesor: a.asesor_nombre,
    total: formatPeso(a.pesos_total),
    meta: a.meta_pesos === null ? 'Sin meta' : formatPeso(a.meta_pesos),
    pctAvance: a.pct_avance === null ? '—' : formatPct(a.pct_avance),
    cumplio: a.cumplio === null ? '—' : a.cumplio ? 'Sí' : 'No',
    faltante: a.faltante === null ? '—' : formatPeso(a.faltante),
    proyeccion: formatPeso(a.proyeccion_cierre),
    comisionPagada: props.datos.metaComercial.comision_estado_disponible ? formatPeso(a.comision_pagada) : 'N/D',
    comisionPendiente: props.datos.metaComercial.comision_estado_disponible ? formatPeso(a.comision_pendiente) : 'N/D',
  }))
)

const headersMetaComercialVehiculos = [
  { title: 'Asesor', key: 'asesor' },
  { title: 'Meta (Veh)', key: 'meta' },
  { title: 'Logrado (Veh)', key: 'logrado' },
  { title: 'Faltante (Veh)', key: 'faltante' },
]
const filasMetaComercialVehiculos = computed(() =>
  props.datos.metaComercial.asesores.map((a) => ({
    asesor: a.asesor_nombre,
    meta: a.meta_vehiculos === null ? 'Sin meta' : formatNum(a.meta_vehiculos),
    logrado: formatNum(a.logrado_vehiculos),
    faltante: a.faltante_vehiculos === null ? '—' : formatNum(a.faltante_vehiculos),
  }))
)

const asesoresConDescuentos = computed(() =>
  props.datos.metaComercial.asesores
    .filter((a) => a.descuentos_total > 0)
    .map((a) => ({
      asesor_id: a.asesor_id,
      asesor_nombre: a.asesor_nombre,
      detalle: a.descuentos.map((d) => `${d.nombre} x${d.cantidad} = ${formatPeso(d.total_descuentos)}`).join('; '),
      total: a.descuentos_total,
    }))
)

/* ===== 3. Ingresos por Canal ===== */
const headersIngresosCanal = [
  { title: 'Canal', key: 'canal' },
  { title: 'Vehículos', key: 'vehiculos' },
  { title: 'Total Bruto', key: 'totalBruto' },
  { title: 'Total Neto', key: 'totalNeto' },
  { title: 'Prom. Ticket', key: 'promedio' },
  { title: 'Var. vs. Anterior', key: 'variacion' },
]
const filasIngresosCanal = computed(() => {
  const anteriorMap = new Map(props.datos.ingresosCanalAnterior.por_canal.map((c) => [c.canal, c]))
  const filas = props.datos.ingresosCanal.por_canal.map((c) => {
    const anterior = anteriorMap.get(c.canal)
    const base = anterior?.total_bruto ?? 0
    const variacionAbs = c.total_bruto - base
    const variacionPct = base > 0 ? Math.round((variacionAbs / base) * 1000) / 10 : null
    return {
      canal: nombreCanal(c.canal),
      vehiculos: formatNum(c.cantidad),
      totalBruto: formatPeso(c.total_bruto),
      totalNeto: formatPeso(c.total_neto),
      promedio: formatPeso(c.promedio_ticket),
      variacion: `${variacionAbs >= 0 ? '+' : ''}${formatPct(variacionPct)}`,
      variacionAbs,
    }
  })
  const baseTotal = props.datos.ingresosCanalAnterior.totales.total_bruto
  const variacionAbsTotal = props.datos.ingresosCanal.totales.total_bruto - baseTotal
  const variacionPctTotal = baseTotal > 0 ? Math.round((variacionAbsTotal / baseTotal) * 1000) / 10 : null
  filas.push({
    canal: 'Totales',
    vehiculos: formatNum(props.datos.ingresosCanal.totales.cantidad),
    totalBruto: formatPeso(props.datos.ingresosCanal.totales.total_bruto),
    totalNeto: formatPeso(props.datos.ingresosCanal.totales.total_neto),
    promedio: formatPeso(props.datos.ingresosCanal.totales.promedio_ticket),
    variacion: `${variacionAbsTotal >= 0 ? '+' : ''}${formatPct(variacionPctTotal)}`,
    variacionAbs: variacionAbsTotal,
  })
  return filas
})

/* ===== 4. Servicios (RTM) ===== */
const headersServicios = [
  { title: 'Servicio', key: 'servicio' },
  { title: 'Tipo', key: 'tipo' },
  { title: 'Turnos', key: 'turnos' },
  { title: 'Est. Bruto', key: 'estBruto' },
  { title: 'Est. Neto', key: 'estNeto' },
  { title: 'Real Bruto', key: 'realBruto' },
  { title: 'Real Neto', key: 'realNeto' },
]
const filasServicios = computed(() =>
  props.datos.servicios.detalle.map((d) => ({
    servicio: `${d.codigo_servicio} - ${d.nombre_servicio}`,
    tipo: d.tipo_vehiculo === 'MOTO' ? 'Moto' : 'Vehículo',
    turnos: formatNum(d.turnos),
    estBruto: formatPeso(d.total_generado),
    estNeto: formatPeso(d.total_neto),
    realBruto: formatPeso(d.valor_real_bruto),
    realNeto: formatPeso(d.valor_real_neto),
  }))
)

/* ===== 5. Retención de Clientes ===== */
const headersRetencionCanal = [
  { title: 'Canal', key: 'canal' },
  { title: 'Nuevos', key: 'nuevos' },
  { title: 'Recurrentes', key: 'recurrentes' },
  { title: 'Recuperaciones', key: 'recuperaciones' },
  { title: 'Total', key: 'total' },
  { title: 'Total Bruto', key: 'total_bruto' },
  { title: '% del Total', key: 'porcentaje' },
]
const headersTopClientes = [
  { title: 'Placa', key: 'placa' },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Cliente', key: 'cliente_nombre' },
  { title: 'Documento', key: 'cliente_documento' },
  { title: 'Canal', key: 'canal' },
  { title: 'Valor', key: 'valor' },
]
const categoriasRetencion = computed(() => [
  {
    key: 'nuevos',
    titulo: 'Nuevos',
    filas: props.datos.retencion.top_clientes.nuevos.map((f) => ({
      placa: f.placa,
      fecha: f.fecha,
      cliente_nombre: f.cliente_nombre ?? '—',
      cliente_documento: f.cliente_documento ?? '—',
      canal: nombreCanal(f.captacion_canal),
      valor: formatPeso(f.total),
    })),
  },
  {
    key: 'recurrentes',
    titulo: 'Recurrentes',
    filas: props.datos.retencion.top_clientes.recurrentes.map((f) => ({
      placa: f.placa,
      fecha: f.fecha,
      cliente_nombre: f.cliente_nombre ?? '—',
      cliente_documento: f.cliente_documento ?? '—',
      canal: nombreCanal(f.captacion_canal),
      valor: formatPeso(f.total),
    })),
  },
  {
    key: 'recuperaciones',
    titulo: 'Recuperados',
    filas: props.datos.retencion.top_clientes.recuperaciones.map((f) => ({
      placa: f.placa,
      fecha: f.fecha,
      cliente_nombre: f.cliente_nombre ?? '—',
      cliente_documento: f.cliente_documento ?? '—',
      canal: nombreCanal(f.captacion_canal),
      valor: formatPeso(f.total),
    })),
  },
])

/* ===== 6. Descuentos ===== */
const headersDescuentosTipo = [
  { title: 'Código', key: 'codigo' },
  { title: 'Tipo', key: 'nombre' },
  { title: 'Cantidad', key: 'cantidad' },
  { title: 'Total', key: 'total_descuentos' },
  { title: 'Promedio', key: 'promedio' },
]
const headersDescuentosCanal = [
  { title: 'Canal', key: 'canal' },
  { title: 'Cantidad', key: 'cantidad' },
  { title: 'Total', key: 'total_descuentos' },
  { title: 'Tipos usados', key: 'tipos_usados' },
  { title: '% del Total', key: 'porcentaje' },
]
const headersDescuentosAutorizador = [
  { title: 'Autorizador', key: 'nombre' },
  { title: 'Cantidad', key: 'cantidad' },
  { title: 'Total', key: 'total' },
]
const tiposConDescripcion = computed(() => props.datos.descuentosTipo.por_tipo.filter((t) => t.descripcion))
const filasAutorizadorTop = computed(() => {
  const ordenados = [...props.datos.descuentosAutorizador.por_autorizador].sort(
    (a, b) => b.total_descuentos - a.total_descuentos
  )
  const top = ordenados.slice(0, 15)
  const resto = ordenados.slice(15)
  const filas = top.map((a) => ({ nombre: a.nombre, cantidad: formatNum(a.cantidad), total: formatPeso(a.total_descuentos) }))
  if (resto.length > 0) {
    filas.push({
      nombre: `Otros (${resto.length} autorizadores)`,
      cantidad: formatNum(resto.reduce((acc, a) => acc + a.cantidad, 0)),
      total: formatPeso(resto.reduce((acc, a) => acc + a.total_descuentos, 0)),
    })
  }
  return filas
})

/* ===== 7. Producción por Líder ===== */
const headersProduccionLider = [
  { title: 'Sede', key: 'sede_nombre' },
  { title: 'Líder', key: 'lider_nombre' },
  { title: 'RTM', key: 'turnos_rtm' },
  { title: 'SOAT', key: 'turnos_soat' },
  { title: 'PREV', key: 'turnos_prev' },
  { title: 'PERI', key: 'turnos_peri' },
  { title: 'Vehículos', key: 'vehiculos' },
  { title: 'Total Bruto', key: 'total_bruto' },
  { title: 'Total Neto', key: 'total_neto' },
]
const headersProduccionFuncionario = [
  { title: 'Funcionario', key: 'funcionario_nombre' },
  { title: 'RTM', key: 'turnos_rtm' },
  { title: 'SOAT', key: 'turnos_soat' },
  { title: 'PREV', key: 'turnos_prev' },
  { title: 'PERI', key: 'turnos_peri' },
  { title: 'Vehículos', key: 'vehiculos' },
  { title: 'Total Bruto', key: 'total_bruto' },
  { title: 'Total Neto', key: 'total_neto' },
]
</script>
