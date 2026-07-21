<!-- src/views/reportes/ReporteMetaMensual.vue -->
<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-target</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Meta Mensual</div>
            <div class="text-medium-emphasis">
              Avance de turnos RTM (Livianos + Motos) vs. meta del mes
            </div>
          </div>
        </div>

        <v-chip
          v-if="resumen"
          :color="colorSemaforo(resumen.semaforo.general)"
          variant="flat"
          size="large"
          :prepend-icon="iconSemaforo(resumen.semaforo.general)"
        >
          {{ labelSemaforo(resumen.semaforo.general) }}
        </v-chip>
      </v-card-title>

      <v-divider />

      <!-- FILTROS -->
      <v-card-text>
        <v-row align="center" dense>
          <v-col cols="6" sm="3" md="2">
            <v-select
              v-model="mesSeleccionado"
              :items="MESES"
              item-title="label"
              item-value="value"
              label="Mes"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="3" md="2">
            <v-text-field
              v-model.number="anioSeleccionado"
              label="Año"
              type="number"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              :loading="loading"
              block
              @click="cargarTodo"
            >
              Generar reporte
            </v-btn>
          </v-col>
          <v-col cols="12" md="5" class="text-md-right">
            <v-chip :color="colorFuente(fuenteDatos)" variant="tonal" size="small">
              {{ etiquetaFuente(fuenteDatos) }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- KPIs -->
    <v-row class="mb-2" dense>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card" :class="borderSemaforo(resumen?.semaforo.general)">
          <v-card-text>
            <div class="text-caption text-medium-emphasis d-flex align-center">
              Total General
              <v-tooltip location="top" max-width="240">
                <template #activator="{ props }">
                  <v-icon v-bind="props" size="14" icon="mdi-information-outline" class="ml-1" />
                </template>
                <span>{{ TOOLTIPS.totalGeneral }}</span>
              </v-tooltip>
            </div>
            <div class="text-h5 font-weight-bold">
              {{ formatNum(resumen?.kpis.total_general.avance) }} / {{ formatNum(resumen?.kpis.total_general.meta) }}
            </div>
            <div class="text-caption">{{ formatPct(resumen?.kpis.total_general.pct_avance) }} de la meta</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card">
          <v-card-text>
            <div class="text-caption text-medium-emphasis d-flex align-center">
              Livianos
              <v-tooltip location="top" max-width="240">
                <template #activator="{ props }">
                  <v-icon v-bind="props" size="14" icon="mdi-information-outline" class="ml-1" />
                </template>
                <span>{{ TOOLTIPS.livianos }}</span>
              </v-tooltip>
            </div>
            <div class="text-h5 font-weight-bold">
              {{ formatNum(resumen?.kpis.livianos.avance) }} / {{ formatNum(resumen?.kpis.livianos.meta) }}
            </div>
            <div class="text-caption">{{ formatPct(resumen?.kpis.livianos.pct_avance) }} de la meta</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card">
          <v-card-text>
            <div class="text-caption text-medium-emphasis d-flex align-center">
              Motos
              <v-tooltip location="top" max-width="240">
                <template #activator="{ props }">
                  <v-icon v-bind="props" size="14" icon="mdi-information-outline" class="ml-1" />
                </template>
                <span>{{ TOOLTIPS.motos }}</span>
              </v-tooltip>
            </div>
            <div class="text-h5 font-weight-bold">
              {{ formatNum(resumen?.kpis.motos.avance) }} / {{ formatNum(resumen?.kpis.motos.meta) }}
            </div>
            <div class="text-caption">{{ formatPct(resumen?.kpis.motos.pct_avance) }} de la meta</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card" :class="borderSemaforo(resumen?.semaforo.proyectado)">
          <v-card-text>
            <div class="text-caption text-medium-emphasis d-flex align-center">
              Proyección de cierre
              <v-tooltip location="top" max-width="240">
                <template #activator="{ props }">
                  <v-icon v-bind="props" size="14" icon="mdi-information-outline" class="ml-1" />
                </template>
                <span>{{ TOOLTIPS.proyeccion }}</span>
              </v-tooltip>
            </div>
            <div class="text-h5 font-weight-bold">
              {{ formatNum(resumen?.kpis.total_general.proyeccion_cierre) }}
            </div>
            <div class="text-caption">
              {{ formatPct(resumen?.kpis.total_general.pct_proyeccion) }} de la meta proyectado
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- TABS -->
    <v-card elevation="8" class="rounded-xl">
      <v-tabs v-model="tab" color="primary" grow>
        <v-tab value="diario">
          Diario
          <v-icon v-if="resumen" :color="colorSemaforo(resumen.semaforo.diario)" size="10" class="ml-1">mdi-circle</v-icon>
        </v-tab>
        <v-tab value="semanal">
          Semanal
          <v-icon v-if="resumen" :color="colorSemaforo(resumen.semaforo.semanal)" size="10" class="ml-1">mdi-circle</v-icon>
        </v-tab>
        <v-tab value="meta">
          Meta
          <v-icon v-if="resumen" :color="colorSemaforo(resumen.semaforo.meta)" size="10" class="ml-1">mdi-circle</v-icon>
        </v-tab>
        <v-tab value="proyectado">
          Proyectado
          <v-icon v-if="resumen" :color="colorSemaforo(resumen.semaforo.proyectado)" size="10" class="ml-1">mdi-circle</v-icon>
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text>
        <v-window v-model="tab">
          <!-- TAB DIARIO -->
          <v-window-item value="diario">
            <div class="text-body-2 text-medium-emphasis mb-3">{{ textoNarrativoDiario }}</div>

            <v-row class="mb-4" dense>
              <v-col cols="12">
                <v-btn-toggle
                  v-model="tipoGraficoDiario"
                  color="primary"
                  density="compact"
                  variant="outlined"
                  mandatory
                  class="mb-2 flex-wrap"
                >
                  <v-btn value="tendencia">Tendencia</v-btn>
                  <v-btn value="barras">Barras</v-btn>
                  <v-btn value="comparativo">Comparativo año anterior</v-btn>
                  <v-btn value="composicion">Composición</v-btn>
                  <v-btn value="medidor">Medidor</v-btn>
                </v-btn-toggle>

                <template v-if="tipoGraficoDiario === 'tendencia'">
                  <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoDiarioLinea }}</div>
                  <div style="height: 220px;">
                    <Line :data="chartDataDiarioLinea" :options="chartOptionsAcumulado" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoDiario === 'barras'">
                  <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoDiarioBarras }}</div>
                  <div style="height: 220px;">
                    <Bar :data="chartDataDiarioBarras" :options="chartOptionsSemanal" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoDiario === 'comparativo'">
                  <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoComparativo }}</div>
                  <div style="height: 220px;">
                    <Bar :data="chartDataComparativoAnio" :options="chartOptionsComparativo" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoDiario === 'composicion'">
                  <div v-if="acumuladoTotalDiario > 0">
                    <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoDiarioComposicion }}</div>
                    <div style="height: 220px;">
                      <Doughnut :data="chartDataDiarioComposicion" :options="chartOptionsMeta" />
                    </div>
                  </div>
                  <v-alert v-else-if="!loading" type="info" variant="tonal" density="compact">
                    Aún no hay turnos este mes.
                  </v-alert>
                </template>
                <template v-else-if="tipoGraficoDiario === 'medidor'">
                  <div v-if="pctAvanceGauge !== null" style="height: 220px; position: relative;">
                    <Doughnut :data="chartDataDiarioGauge" :options="chartOptionsProyectado" />
                    <div
                      class="text-h4 font-weight-bold text-center"
                      style="position: absolute; left: 0; right: 0; bottom: 8px; pointer-events: none;"
                    >
                      {{ formatPct(pctAvanceGauge) }}
                    </div>
                  </div>
                  <v-alert v-else-if="!loading" type="info" variant="tonal" density="compact">
                    {{ resumen ? 'Aún no hay una meta configurada para calcular el % de avance.' : 'Aún no hay datos para calcular el avance.' }}
                  </v-alert>
                </template>
              </v-col>
            </v-row>

            <v-data-table
              class="tabla-zebra"
              :headers="headersDiario"
              :items="diario?.dias ?? []"
              :loading="loading"
              item-key="fecha"
              hover
              hide-default-footer
              :items-per-page="-1"
            >
              <template #header.livianos="{ column }">
                {{ column.title }}
                <v-tooltip location="top" max-width="200">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="12" icon="mdi-information-outline" class="ml-1" />
                  </template>
                  <span>{{ TOOLTIPS.colLivianos }}</span>
                </v-tooltip>
              </template>
              <template #header.motos="{ column }">
                {{ column.title }}
                <v-tooltip location="top" max-width="200">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="12" icon="mdi-information-outline" class="ml-1" />
                  </template>
                  <span>{{ TOOLTIPS.colMotos }}</span>
                </v-tooltip>
              </template>
              <template #header.total="{ column }">
                {{ column.title }}
                <v-tooltip location="top" max-width="200">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="12" icon="mdi-information-outline" class="ml-1" />
                  </template>
                  <span>{{ TOOLTIPS.colTotal }}</span>
                </v-tooltip>
              </template>
              <template #header.acumulado_livianos="{ column }">
                {{ column.title }}
                <v-tooltip location="top" max-width="200">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="12" icon="mdi-information-outline" class="ml-1" />
                  </template>
                  <span>{{ TOOLTIPS.colAcumLivianos }}</span>
                </v-tooltip>
              </template>
              <template #header.acumulado_motos="{ column }">
                {{ column.title }}
                <v-tooltip location="top" max-width="200">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="12" icon="mdi-information-outline" class="ml-1" />
                  </template>
                  <span>{{ TOOLTIPS.colAcumMotos }}</span>
                </v-tooltip>
              </template>
              <template #header.acumulado_total="{ column }">
                {{ column.title }}
                <v-tooltip location="top" max-width="200">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="12" icon="mdi-information-outline" class="ml-1" />
                  </template>
                  <span>{{ TOOLTIPS.colAcumTotal }}</span>
                </v-tooltip>
              </template>
              <template #header.pct_vs_meta="{ column }">
                {{ column.title }}
                <v-tooltip location="top" max-width="200">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="12" icon="mdi-information-outline" class="ml-1" />
                  </template>
                  <span>{{ TOOLTIPS.colPctMeta }}</span>
                </v-tooltip>
              </template>
              <template #header.vs_anio_anterior="{ column }">
                {{ column.title }}
                <v-tooltip location="top" max-width="220">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="12" icon="mdi-information-outline" class="ml-1" />
                  </template>
                  <span>{{ TOOLTIPS.colVsAnioAnterior }}</span>
                </v-tooltip>
              </template>
              <template #item.fecha="{ item }">{{ formatFechaCorta(item.fecha) }}</template>
              <template #item.pct_vs_meta="{ item }">
                <span v-if="item.pct_vs_meta === null" class="text-caption text-medium-emphasis">Sin meta</span>
                <div v-else class="d-flex align-center ga-2">
                  <span class="text-caption" style="min-width: 40px;">{{ formatPct(item.pct_vs_meta) }}</span>
                  <v-progress-linear
                    :model-value="Math.min(100, item.pct_vs_meta)"
                    height="5"
                    rounded
                    :color="colorPctVsMeta(item.pct_vs_meta)"
                    style="flex: 1; max-width: 70px;"
                  />
                </div>
              </template>
              <template #item.vs_anio_anterior="{ item }">
                <template v-if="item.diferencia_vs_anio_anterior === null">
                  <span class="text-caption text-medium-emphasis">Sin dato</span>
                </template>
                <template v-else>
                  <div class="d-flex align-center ga-1">
                    <v-chip
                      size="small"
                      :color="item.diferencia_vs_anio_anterior >= 0 ? 'success' : 'error'"
                      variant="tonal"
                      :prepend-icon="item.diferencia_vs_anio_anterior >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                    >
                      {{ item.diferencia_vs_anio_anterior >= 0 ? '+' : '' }}{{ item.diferencia_vs_anio_anterior }}
                    </v-chip>
                    <span class="text-caption text-medium-emphasis">({{ item.total_anio_anterior ?? '—' }})</span>
                  </div>
                </template>
              </template>
            </v-data-table>

            <v-alert v-if="!loading && !diario?.dias.length" type="info" variant="tonal" class="mt-4">
              Sin datos disponibles para {{ etiquetaMes(mesSeleccionado) }} {{ anioSeleccionado }}
              (ni en turnos reales ni en el histórico cargado).
            </v-alert>
            <div v-if="diario" class="text-caption text-medium-emphasis mt-2">
              Comparativo año anterior: {{ etiquetaFuente(diario.fuente_datos_anio_anterior) }}
            </div>
          </v-window-item>

          <!-- TAB SEMANAL -->
          <v-window-item value="semanal">
            <div class="text-body-2 text-medium-emphasis mb-3">{{ textoNarrativoSemanal }}</div>

            <v-row class="mb-4" dense>
              <v-col cols="12">
                <v-btn-toggle
                  v-model="tipoGraficoSemanal"
                  color="primary"
                  density="compact"
                  variant="outlined"
                  mandatory
                  class="mb-2 flex-wrap"
                >
                  <v-btn value="tendencia">Tendencia</v-btn>
                  <v-btn value="barras">Barras</v-btn>
                  <v-btn value="comparativo">Comparativo año anterior</v-btn>
                  <v-btn value="composicion">Composición</v-btn>
                  <v-btn value="medidor">Medidor</v-btn>
                </v-btn-toggle>

                <template v-if="tipoGraficoSemanal === 'tendencia'">
                  <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoSemanal }}</div>
                  <div style="height: 220px;">
                    <Line :data="chartDataSemanal" :options="chartOptionsAcumulado" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoSemanal === 'barras'">
                  <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoSemanalBarras }}</div>
                  <div style="height: 220px;">
                    <Bar :data="chartDataSemanalBarras" :options="chartOptionsSemanal" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoSemanal === 'comparativo'">
                  <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoSemanalComparativo }}</div>
                  <div style="height: 220px;">
                    <Bar :data="chartDataSemanalComparativo" :options="chartOptionsComparativo" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoSemanal === 'composicion'">
                  <div v-if="avanceTotalMeta > 0">
                    <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoMeta }}</div>
                    <div style="height: 220px;">
                      <Doughnut :data="chartDataMeta" :options="chartOptionsMeta" />
                    </div>
                  </div>
                  <v-alert v-else-if="!loading" type="info" variant="tonal" density="compact">
                    Aún no hay turnos este mes.
                  </v-alert>
                </template>
                <template v-else-if="tipoGraficoSemanal === 'medidor'">
                  <div v-if="pctAvanceGauge !== null" style="height: 220px; position: relative;">
                    <Doughnut :data="chartDataDiarioGauge" :options="chartOptionsProyectado" />
                    <div
                      class="text-h4 font-weight-bold text-center"
                      style="position: absolute; left: 0; right: 0; bottom: 8px; pointer-events: none;"
                    >
                      {{ formatPct(pctAvanceGauge) }}
                    </div>
                  </div>
                  <v-alert v-else-if="!loading" type="info" variant="tonal" density="compact">
                    {{ resumen ? 'Aún no hay una meta configurada para calcular el % de avance.' : 'Aún no hay datos para calcular el avance.' }}
                  </v-alert>
                </template>
              </v-col>
            </v-row>

            <v-data-table
              class="tabla-zebra"
              :headers="headersSemanal"
              :items="semanal?.semanas ?? []"
              :loading="loading"
              item-key="inicio"
              hover
              hide-default-footer
              :items-per-page="-1"
            >
              <template #item.semana="{ item }">
                {{ formatFechaCorta(item.inicio) }} — {{ formatFechaCorta(item.fin) }}
              </template>
              <template #item.pct_livianos="{ item }">
                <span v-if="item.pct_livianos === null" class="text-caption text-medium-emphasis">Sin meta</span>
                <div v-else class="d-flex align-center ga-2">
                  <span class="text-caption" style="min-width: 40px;">{{ formatPct(item.pct_livianos) }}</span>
                  <v-progress-linear
                    :model-value="Math.min(100, item.pct_livianos)"
                    height="5"
                    rounded
                    :color="colorPctVsMeta(item.pct_livianos)"
                    style="flex: 1; max-width: 70px;"
                  />
                </div>
              </template>
              <template #item.pct_motos="{ item }">
                <span v-if="item.pct_motos === null" class="text-caption text-medium-emphasis">Sin meta</span>
                <div v-else class="d-flex align-center ga-2">
                  <span class="text-caption" style="min-width: 40px;">{{ formatPct(item.pct_motos) }}</span>
                  <v-progress-linear
                    :model-value="Math.min(100, item.pct_motos)"
                    height="5"
                    rounded
                    :color="colorPctVsMeta(item.pct_motos)"
                    style="flex: 1; max-width: 70px;"
                  />
                </div>
              </template>
            </v-data-table>

            <v-alert v-if="!loading && !semanal?.semanas.length" type="info" variant="tonal" class="mt-4">
              Sin datos disponibles para {{ etiquetaMes(mesSeleccionado) }} {{ anioSeleccionado }}.
            </v-alert>
          </v-window-item>

          <!-- TAB META (configuración) -->
          <v-window-item value="meta">
            <div class="text-body-2 text-medium-emphasis mb-3">{{ textoNarrativoMeta }}</div>

            <v-row class="mb-4" dense>
              <v-col cols="12">
                <v-btn-toggle
                  v-model="tipoGraficoMeta"
                  color="primary"
                  density="compact"
                  variant="outlined"
                  mandatory
                  class="mb-2 flex-wrap"
                >
                  <v-btn value="tendencia">Tendencia</v-btn>
                  <v-btn value="barras">Barras</v-btn>
                  <v-btn value="comparativo">Comparativo año anterior</v-btn>
                  <v-btn value="composicion">Composición</v-btn>
                  <v-btn value="medidor">Medidor</v-btn>
                </v-btn-toggle>

                <template v-if="tipoGraficoMeta === 'tendencia'">
                  <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoMetaLinea }}</div>
                  <div style="height: 220px;">
                    <Line :data="chartDataMetaLinea" :options="chartOptionsAcumulado" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoMeta === 'barras'">
                  <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoMetaBarras }}</div>
                  <div style="height: 220px;">
                    <Bar :data="chartDataMetaBarras" :options="chartOptionsMetaBarras" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoMeta === 'comparativo'">
                  <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoComparativo }}</div>
                  <div style="height: 220px;">
                    <Bar :data="chartDataComparativoAnio" :options="chartOptionsComparativo" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoMeta === 'composicion'">
                  <div v-if="avanceTotalMeta > 0">
                    <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoMeta }}</div>
                    <div style="height: 220px;">
                      <Doughnut :data="chartDataMeta" :options="chartOptionsMeta" />
                    </div>
                  </div>
                  <v-alert v-else-if="!loading" type="info" variant="tonal" density="compact">
                    Aún no hay turnos este mes.
                  </v-alert>
                </template>
                <template v-else-if="tipoGraficoMeta === 'medidor'">
                  <div v-if="pctAvanceGauge !== null" style="height: 220px; position: relative;">
                    <Doughnut :data="chartDataDiarioGauge" :options="chartOptionsProyectado" />
                    <div
                      class="text-h4 font-weight-bold text-center"
                      style="position: absolute; left: 0; right: 0; bottom: 8px; pointer-events: none;"
                    >
                      {{ formatPct(pctAvanceGauge) }}
                    </div>
                  </div>
                  <v-alert v-else-if="!loading" type="info" variant="tonal" density="compact">
                    {{ resumen ? 'Aún no hay una meta configurada para calcular el % de avance.' : 'Aún no hay datos para calcular el avance.' }}
                  </v-alert>
                </template>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="rounded-xl">
                  <v-card-title class="text-subtitle-1">Configurar meta de {{ etiquetaMes(mesSeleccionado) }} {{ anioSeleccionado }}</v-card-title>
                  <v-card-text>
                    <v-text-field
                      v-model.number="configForm.meta_livianos"
                      label="Meta Livianos"
                      type="number"
                      density="compact"
                      variant="outlined"
                      class="mb-3"
                      hide-details
                    />
                    <v-text-field
                      v-model.number="configForm.meta_motos"
                      label="Meta Motos"
                      type="number"
                      density="compact"
                      variant="outlined"
                      class="mb-3"
                      hide-details
                    />
                    <v-text-field
                      v-model.number="configForm.pct_crecimiento_referencia"
                      label="% Crecimiento de referencia (vs. año anterior)"
                      type="number"
                      suffix="%"
                      density="compact"
                      variant="outlined"
                      hide-details
                    />
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer />
                    <v-btn color="primary" :loading="savingConfig" @click="guardarConfig">
                      Guardar meta
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="outlined" class="rounded-xl">
                  <v-card-title class="text-subtitle-1">Cuánto se lleva vs. cuánto falta</v-card-title>
                  <v-card-text v-if="resumen">
                    <div class="mb-3">
                      <div class="d-flex justify-space-between">
                        <span>Livianos</span>
                        <span>{{ formatNum(resumen.kpis.livianos.avance) }} / {{ formatNum(resumen.kpis.livianos.meta) }}
                          (falta {{ formatNum(Math.max(0, resumen.kpis.livianos.meta - resumen.kpis.livianos.avance)) }})</span>
                      </div>
                      <v-progress-linear
                        :model-value="resumen.kpis.livianos.pct_avance ?? 0"
                        :color="colorSemaforo(resumen.semaforo.meta)"
                        height="10"
                        rounded
                        class="mt-1"
                      />
                    </div>
                    <div class="mb-3">
                      <div class="d-flex justify-space-between">
                        <span>Motos</span>
                        <span>{{ formatNum(resumen.kpis.motos.avance) }} / {{ formatNum(resumen.kpis.motos.meta) }}
                          (falta {{ formatNum(Math.max(0, resumen.kpis.motos.meta - resumen.kpis.motos.avance)) }})</span>
                      </div>
                      <v-progress-linear
                        :model-value="resumen.kpis.motos.pct_avance ?? 0"
                        :color="colorSemaforo(resumen.semaforo.meta)"
                        height="10"
                        rounded
                        class="mt-1"
                      />
                    </div>
                    <div>
                      <div class="d-flex justify-space-between font-weight-bold">
                        <span>Total</span>
                        <span>{{ formatNum(resumen.kpis.total_general.avance) }} / {{ formatNum(resumen.kpis.total_general.meta) }}
                          (falta {{ formatNum(Math.max(0, resumen.kpis.total_general.meta - resumen.kpis.total_general.avance)) }})</span>
                      </div>
                      <v-progress-linear
                        :model-value="resumen.kpis.total_general.pct_avance ?? 0"
                        :color="colorSemaforo(resumen.semaforo.meta)"
                        height="12"
                        rounded
                        class="mt-1"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- TAB PROYECTADO -->
          <v-window-item value="proyectado">
            <div class="text-body-2 text-medium-emphasis mb-3">{{ textoNarrativoProyectado }}</div>
            <v-row v-if="proyectado?.resumen" class="mb-3" dense>
              <v-col cols="12" sm="4">
                <v-card variant="tonal" class="rounded-xl">
                  <v-card-text>
                    <div class="text-caption">Promedio diario</div>
                    <div class="text-h6">
                      {{ proyectado.resumen.promedio_diario_livianos }} livianos / {{ proyectado.resumen.promedio_diario_motos }} motos
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card variant="tonal" class="rounded-xl">
                  <v-card-text>
                    <div class="text-caption">Proyección de cierre</div>
                    <div class="text-h6">{{ formatNum(proyectado.resumen.proyeccion_cierre_total) }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card variant="tonal" class="rounded-xl">
                  <v-card-text>
                    <div class="text-caption">% de la meta proyectado</div>
                    <div class="text-h6">{{ formatPct(proyectado.resumen.pct_proyeccion_total) }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-row class="mb-4" dense>
              <v-col cols="12">
                <v-btn-toggle
                  v-model="tipoGraficoProyectado"
                  color="primary"
                  density="compact"
                  variant="outlined"
                  mandatory
                  class="mb-2 flex-wrap"
                >
                  <v-btn value="tendencia">Tendencia</v-btn>
                  <v-btn value="barras">Barras</v-btn>
                  <v-btn value="comparativo">Comparativo año anterior</v-btn>
                  <v-btn value="composicion">Composición</v-btn>
                  <v-btn value="medidor">Medidor</v-btn>
                </v-btn-toggle>

                <template v-if="tipoGraficoProyectado === 'tendencia'">
                  <template v-if="proyectado?.resumen">
                    <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoProyectadoLinea }}</div>
                    <div style="height: 220px;">
                      <Line :data="chartDataProyectadoLinea" :options="chartOptionsAcumulado" />
                    </div>
                  </template>
                  <v-alert v-else-if="!loading" type="info" variant="tonal" density="compact">
                    Aún no hay días con datos para calcular una proyección.
                  </v-alert>
                </template>
                <template v-else-if="tipoGraficoProyectado === 'barras'">
                  <div style="height: 220px;">
                    <Bar :data="chartDataProyectadoBarras" :options="chartOptionsProyectadoBarras" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoProyectado === 'comparativo'">
                  <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoComparativo }}</div>
                  <div style="height: 220px;">
                    <Bar :data="chartDataComparativoAnio" :options="chartOptionsComparativo" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoProyectado === 'composicion'">
                  <div v-if="avanceTotalMeta > 0">
                    <div class="text-body-2 text-medium-emphasis mb-2">{{ textoGraficoMeta }}</div>
                    <div style="height: 220px;">
                      <Doughnut :data="chartDataMeta" :options="chartOptionsMeta" />
                    </div>
                  </div>
                  <v-alert v-else-if="!loading" type="info" variant="tonal" density="compact">
                    Aún no hay turnos este mes.
                  </v-alert>
                </template>
                <template v-else-if="tipoGraficoProyectado === 'medidor'">
                  <div v-if="pctProyeccionGauge !== null" style="height: 220px; position: relative;">
                    <Doughnut :data="chartDataProyectado" :options="chartOptionsProyectado" />
                    <div
                      class="text-h4 font-weight-bold text-center"
                      style="position: absolute; left: 0; right: 0; bottom: 8px; pointer-events: none;"
                    >
                      {{ formatPct(pctProyeccionGauge) }}
                    </div>
                  </div>
                  <v-alert v-else-if="!loading" type="info" variant="tonal" density="compact">
                    {{ proyectado?.resumen ? 'Aún no hay meta configurada para calcular el % de proyección.' : 'Aún no hay días con datos para calcular una proyección.' }}
                  </v-alert>
                </template>
              </v-col>
            </v-row>

            <v-data-table
              :headers="headersProyectado"
              :items="proyectado?.dias ?? []"
              :loading="loading"
              item-key="fecha"
              hover
              hide-default-footer
              :items-per-page="-1"
            >
              <template #item.fecha="{ item }">{{ formatFechaCorta(item.fecha) }}</template>
            </v-data-table>

            <v-alert v-if="!loading && !proyectado?.dias.length" type="info" variant="tonal" class="mt-4">
              Sin datos disponibles para {{ etiquetaMes(mesSeleccionado) }} {{ anioSeleccionado }}.
            </v-alert>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  getMetaMensualConfig,
  putMetaMensualConfig,
  getMetaMensualResumen,
  getMetaMensualDiario,
  getMetaMensualSemanal,
  getMetaMensualProyectado,
  type MetaMensualResumenResponse,
  type MetaMensualDiarioResponse,
  type MetaMensualSemanalResponse,
  type MetaMensualProyectadoResponse,
  type MetaMensualSemana,
  type MetaMensualDiarioDia,
  type FuenteMetaMensual,
  type SemaforoColor,
} from '@/services/reportesAdminService'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LineController,
  Filler,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'vue-chartjs'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LineController,
  Filler,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
)

/* ===== Selector mes/año ===== */
const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]
function etiquetaMes(mes: number) {
  return MESES.find((m) => m.value === mes)?.label ?? String(mes)
}

const hoy = new Date()
const mesSeleccionado = ref(hoy.getMonth() + 1)
const anioSeleccionado = ref(hoy.getFullYear())

type TipoGrafico = 'tendencia' | 'barras' | 'comparativo' | 'composicion' | 'medidor'

const tab = ref('diario')
const tipoGraficoDiario = ref<TipoGrafico>('tendencia')
const tipoGraficoSemanal = ref<TipoGrafico>('tendencia')
const tipoGraficoMeta = ref<TipoGrafico>('composicion')
const tipoGraficoProyectado = ref<TipoGrafico>('medidor')
const loading = ref(false)
const savingConfig = ref(false)
const snack = reactive({ show: false, text: '' })

const resumen = ref<MetaMensualResumenResponse | null>(null)
const diario = ref<MetaMensualDiarioResponse | null>(null)
const semanal = ref<MetaMensualSemanalResponse | null>(null)
const proyectado = ref<MetaMensualProyectadoResponse | null>(null)
const fuenteDatos = ref<FuenteMetaMensual>('sin_datos')

const configForm = reactive({
  meta_livianos: 0,
  meta_motos: 0,
  pct_crecimiento_referencia: 0,
})

/* ===== Formato ===== */
function formatNum(n: number | undefined | null) {
  if (n === undefined || n === null) return '—'
  return new Intl.NumberFormat('es-CO').format(n)
}
function formatPct(n: number | undefined | null) {
  if (n === undefined) return '—'
  if (n === null) return 'Sin meta'
  return `${n}%`
}
function formatFechaCorta(fecha: string) {
  const [, mm, dd] = fecha.split('-')
  return `${dd}/${mm}`
}

const SEMAFORO_COLOR: Record<SemaforoColor, string> = {
  VERDE: 'green-darken-1',
  AMARILLO: 'amber-darken-2',
  ROJO: 'red-darken-1',
  SIN_META: 'grey-darken-1',
}
const SEMAFORO_LABEL: Record<SemaforoColor, string> = {
  VERDE: 'VERDE',
  AMARILLO: 'AMARILLO',
  ROJO: 'ROJO',
  SIN_META: 'SIN META',
}
const SEMAFORO_ICON: Record<SemaforoColor, string> = {
  VERDE: 'mdi-circle',
  AMARILLO: 'mdi-circle',
  ROJO: 'mdi-circle',
  SIN_META: 'mdi-minus-circle-outline',
}
function colorSemaforo(color: SemaforoColor | undefined) {
  if (!color) return 'grey'
  return SEMAFORO_COLOR[color]
}
function labelSemaforo(color: SemaforoColor | undefined) {
  if (!color) return ''
  return SEMAFORO_LABEL[color]
}
function iconSemaforo(color: SemaforoColor | undefined) {
  if (!color) return 'mdi-circle'
  return SEMAFORO_ICON[color]
}
function borderSemaforo(color: SemaforoColor | undefined) {
  if (!color) return ''
  return `border-${color.toLowerCase()}`
}
function colorPctVsMeta(pct: number) {
  if (pct >= 100) return colorSemaforo('VERDE')
  if (pct >= 90) return colorSemaforo('AMARILLO')
  return colorSemaforo('ROJO')
}

const TOOLTIPS = {
  totalGeneral:
    'Suma de todos los turnos RTM finalizados en el mes (livianos + motos), comparados contra la meta total.',
  livianos:
    'Turnos RTM finalizados de vehículos livianos (particular, taxi y público) en el mes, comparados contra su meta.',
  motos: 'Turnos RTM finalizados de motocicletas en el mes, comparados contra su meta.',
  proyeccion: 'Estimado de cómo cerrará el mes si se mantiene el ritmo actual de turnos por día.',
  colLivianos: 'Turnos de vehículos livianos finalizados ese día.',
  colMotos: 'Turnos de motocicletas finalizadas ese día.',
  colTotal: 'Suma de livianos + motos de ese día.',
  colAcumLivianos: 'Total de livianos acumulados desde el día 1 del mes hasta este día.',
  colAcumMotos: 'Total de motos acumuladas desde el día 1 del mes hasta este día.',
  colAcumTotal: 'Total general acumulado (livianos + motos) desde el día 1 del mes hasta este día.',
  colPctMeta:
    "Porcentaje del acumulado del mes frente a la meta total configurada. Si no hay meta configurada, se muestra 'Sin meta'.",
  colVsAnioAnterior:
    'Compara el total de ese día contra el mismo día del año anterior: el chip muestra cuántos turnos más (o menos) se hicieron; el número entre paréntesis es el total de ese día el año pasado.',
}

const textoNarrativoDiario = computed(() => {
  if (!resumen.value) return ''
  const pct = resumen.value.kpis.total_general.pct_avance
  const diasRestantes = Math.max(0, resumen.value.dias_del_mes - resumen.value.dias_transcurridos)
  if (pct === null) {
    return `Este es el avance día a día de turnos RTM (livianos + motos) del mes. Aún no hay una meta configurada para ${etiquetaMes(mesSeleccionado.value)} ${anioSeleccionado.value} — configúrala en la pestaña "Meta" para ver el % de cumplimiento.`
  }
  return `Este es el avance día a día de turnos RTM (livianos + motos) frente a la meta del mes. Vas en ${pct}% con ${diasRestantes} día${diasRestantes === 1 ? '' : 's'} restante${diasRestantes === 1 ? '' : 's'}.`
})

/* ===== Gráficos tab Diario ===== */
const CHART_COLORS = {
  esteAnio: '#42A5F5',
  anioAnterior: '#9E9E9E',
  metaLinea: '#9E9E9E',
  motos: '#AB47BC',
  // mismos hex que resuelve Vuetify para SEMAFORO_COLOR.VERDE/AMARILLO/ROJO
  // (green-darken-1 / amber-darken-2 / red-darken-1), para que el gauge de
  // Proyectado sea visualmente idéntico al semáforo y las mini-barras.
  exito: '#43A047',
  amarillo: '#FFA000',
  rojo: '#E53935',
}

const chartOptionsAcumulado = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const },
  },
  scales: {
    y: { beginAtZero: true },
  },
}

const chartDataComparativoAnio = computed(() => {
  const dias = diario.value?.dias ?? []
  const labels = dias.map((d) => formatFechaCorta(d.fecha))

  return {
    labels,
    datasets: [
      {
        label: `Este año (${anioSeleccionado.value})`,
        backgroundColor: CHART_COLORS.esteAnio,
        data: dias.map((d) => d.total),
      },
      {
        label: 'Año anterior',
        backgroundColor: CHART_COLORS.anioAnterior,
        data: dias.map((d) => (d.total_anio_anterior === null ? null : d.total_anio_anterior)),
      },
    ],
  }
})

const chartOptionsComparativo = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const },
    tooltip: {
      callbacks: {
        label: (context: { dataset: { label?: string }; parsed: { y: number | null } }) => {
          const label = context.dataset.label ?? ''
          if (context.parsed.y === null) return `${label}: sin dato`
          return `${label}: ${context.parsed.y}`
        },
      },
    },
  },
}

const textoGraficoComparativo = computed(() => {
  const dias = diario.value?.dias ?? []
  const conDato = dias.filter((d) => d.diferencia_vs_anio_anterior !== null)
  if (conDato.length === 0) {
    return 'Cada barra compara ese día contra el mismo día del año anterior.'
  }
  const mejores = conDato.filter((d) => (d.diferencia_vs_anio_anterior as number) > 0).length
  return `Cada barra compara ese día contra el mismo día del año anterior. Vas mejor que el año pasado en ${mejores} de ${conDato.length} días.`
})

/* ===== Gráfico tab Diario — Tendencia (con año anterior) / Barras (sin acumular) ===== */
const chartDataDiarioLinea = computed(() => {
  const dias = diario.value?.dias ?? []
  return {
    labels: dias.map((d) => formatFechaCorta(d.fecha)),
    datasets: [
      {
        label: 'Turnos por día',
        borderColor: CHART_COLORS.esteAnio,
        backgroundColor: CHART_COLORS.esteAnio,
        fill: false,
        tension: 0.3,
        pointRadius: 2,
        data: dias.map((d) => d.total),
      },
      {
        label: 'Año anterior',
        borderColor: CHART_COLORS.anioAnterior,
        backgroundColor: CHART_COLORS.anioAnterior,
        fill: false,
        tension: 0.3,
        pointRadius: 2,
        data: dias.map((d) => d.total_anio_anterior),
      },
    ],
  }
})

const chartDataDiarioBarras = computed(() => {
  const dias = diario.value?.dias ?? []
  return {
    labels: dias.map((d) => formatFechaCorta(d.fecha)),
    datasets: [
      {
        label: 'Turnos por día',
        backgroundColor: CHART_COLORS.esteAnio,
        data: dias.map((d) => d.total),
      },
    ],
  }
})

const textoGraficoDiarioLinea = computed(() => {
  const dias = diario.value?.dias ?? []
  if (dias.length === 0) {
    return 'La línea sólida es el total de turnos (livianos + motos) de ese día, sin acumular; la línea gris es el mismo día del año anterior (si un día no tiene dato del año pasado, queda un hueco).'
  }
  const mejor = dias.reduce((max, d) => (d.total > max.total ? d : max), dias[0])
  return `La línea sólida es el total de turnos (livianos + motos) de ese día, sin acumular; la línea gris es el mismo día del año anterior (si un día no tiene dato del año pasado, queda un hueco). El día con más turnos fue ${formatFechaCorta(mejor.fecha)} con ${formatNum(mejor.total)}.`
})

const textoGraficoDiarioBarras = computed(() => {
  const dias = diario.value?.dias ?? []
  if (dias.length === 0) {
    return 'Cada valor es el total de turnos (livianos + motos) de ese día, sin acumular.'
  }
  const mejor = dias.reduce((max, d) => (d.total > max.total ? d : max), dias[0])
  return `Cada valor es el total de turnos (livianos + motos) de ese día, sin acumular. El día con más turnos fue ${formatFechaCorta(mejor.fecha)} con ${formatNum(mejor.total)}.`
})

/* ===== Gráfico tab Diario — Composición (acumulado a la fecha) ===== */
const acumuladoActualDiario = computed(() => {
  const dias = diario.value?.dias ?? []
  const ultimo = dias[dias.length - 1]
  if (!ultimo) return { livianos: 0, motos: 0 }
  return { livianos: ultimo.acumulado_livianos, motos: ultimo.acumulado_motos }
})

const acumuladoTotalDiario = computed(
  () => acumuladoActualDiario.value.livianos + acumuladoActualDiario.value.motos,
)

const chartDataDiarioComposicion = computed(() => {
  const { livianos, motos } = acumuladoActualDiario.value
  return {
    labels: ['Livianos', 'Motos'],
    datasets: [
      {
        backgroundColor: [CHART_COLORS.esteAnio, CHART_COLORS.motos],
        data: [livianos, motos],
      },
    ],
  }
})

const textoGraficoDiarioComposicion = computed(() => {
  const total = acumuladoTotalDiario.value
  if (total === 0) return ''
  const { livianos } = acumuladoActualDiario.value
  const pctLivianos = Math.round((livianos / total) * 100)
  const pctMotos = 100 - pctLivianos
  return `Del acumulado a la fecha (${formatNum(total)} turnos), ${pctLivianos}% son livianos y ${pctMotos}% motos.`
})

/* ===== Gráfico tab Diario — Medidor (% de avance vs meta) ===== */
const pctAvanceGauge = computed(() => resumen.value?.kpis.total_general.pct_avance ?? null)

const chartDataDiarioGauge = computed(() => {
  const pct = pctAvanceGauge.value
  if (pct === null) return { labels: [], datasets: [] }
  const pctCapped = Math.min(100, pct)
  return {
    labels: ['Avance', 'Restante'],
    datasets: [
      {
        backgroundColor: [colorGauge(pct), '#E0E0E0'],
        borderWidth: 0,
        data: [pctCapped, 100 - pctCapped],
      },
    ],
  }
})

const textoNarrativoSemanal = computed(() => {
  if (!resumen.value || !semanal.value) return ''
  const pct = resumen.value.kpis.total_general.pct_avance
  const semanas = semanal.value.semanas
  const hoy = new Date()
  const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
  const semanasCompletas = semanas.filter((s) => s.fin < hoyISO).length
  const acumulado = semanas.reduce((acc, s) => acc + s.total, 0)
  const plural = semanasCompletas === 1 ? '' : 's'
  if (pct === null) {
    return `Estos son los turnos agrupados por semana (sábado a viernes) frente a la meta total del mes. Aún no hay una meta configurada para ${etiquetaMes(mesSeleccionado.value)} ${anioSeleccionado.value} — configúrala en la pestaña "Meta" para ver el % de cumplimiento. Llevas ${semanasCompletas} semana${plural} completa${plural} con un acumulado de ${formatNum(acumulado)} turnos.`
  }
  return `Estos son los turnos agrupados por semana (sábado a viernes) frente a la meta total del mes (${formatNum(resumen.value.kpis.total_general.meta)}). Llevas ${semanasCompletas} semana${plural} completa${plural} con un acumulado de ${formatNum(acumulado)} turnos.`
})

/* ===== Gráfico tab Semanal — Tendencia (con año anterior) / Comparativo ===== */
function calcularTotalAnioAnteriorPorSemana(
  semanas: MetaMensualSemana[],
  dias: MetaMensualDiarioDia[],
): (number | null)[] {
  return semanas.map((s) => {
    const diasSemana = dias.filter((d) => d.fecha >= s.inicio && d.fecha <= s.fin)
    const conDato = diasSemana.filter((d) => d.total_anio_anterior !== null)
    if (conDato.length === 0) return null
    return conDato.reduce((acc, d) => acc + (d.total_anio_anterior as number), 0)
  })
}

const chartDataSemanal = computed(() => {
  const semanas = semanal.value?.semanas ?? []
  const dias = diario.value?.dias ?? []
  return {
    labels: semanas.map((s) => `${formatFechaCorta(s.inicio)}–${formatFechaCorta(s.fin)}`),
    datasets: [
      {
        label: 'Total semanal',
        borderColor: CHART_COLORS.esteAnio,
        backgroundColor: CHART_COLORS.esteAnio,
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        data: semanas.map((s) => s.total),
      },
      {
        label: 'Año anterior',
        borderColor: CHART_COLORS.anioAnterior,
        backgroundColor: CHART_COLORS.anioAnterior,
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        data: calcularTotalAnioAnteriorPorSemana(semanas, dias),
      },
    ],
  }
})

const chartOptionsSemanal = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { beginAtZero: true },
  },
}

const chartDataSemanalBarras = computed(() => {
  const semanas = semanal.value?.semanas ?? []
  return {
    labels: semanas.map((s) => `${formatFechaCorta(s.inicio)}–${formatFechaCorta(s.fin)}`),
    datasets: [
      {
        label: 'Total semanal',
        backgroundColor: CHART_COLORS.esteAnio,
        data: semanas.map((s) => s.total),
      },
    ],
  }
})

const textoGraficoSemanal = computed(() => {
  const semanas = semanal.value?.semanas ?? []
  if (semanas.length === 0) {
    return 'La línea sólida es el total de turnos (livianos + motos) de esa semana; la línea gris es el mismo rango de días del año anterior (si ninguno de esos días tiene dato del año pasado, queda un hueco).'
  }
  const mejor = semanas.reduce((max, s) => (s.total > max.total ? s : max), semanas[0])
  return `La línea sólida es el total de turnos (livianos + motos) de esa semana; la línea gris es el mismo rango de días del año anterior (si ninguno de esos días tiene dato del año pasado, queda un hueco). La semana con más turnos fue ${formatFechaCorta(mejor.inicio)}–${formatFechaCorta(mejor.fin)} con ${formatNum(mejor.total)}.`
})

const textoGraficoSemanalBarras = computed(() => {
  const semanas = semanal.value?.semanas ?? []
  if (semanas.length === 0) {
    return 'Cada valor es el total de turnos (livianos + motos) de esa semana.'
  }
  const mejor = semanas.reduce((max, s) => (s.total > max.total ? s : max), semanas[0])
  return `Cada valor es el total de turnos (livianos + motos) de esa semana. La semana con más turnos fue ${formatFechaCorta(mejor.inicio)}–${formatFechaCorta(mejor.fin)} con ${formatNum(mejor.total)}.`
})

/* ===== Gráfico tab Semanal — Comparativo año anterior ===== */
const chartDataSemanalComparativo = computed(() => {
  const semanas = semanal.value?.semanas ?? []
  const dias = diario.value?.dias ?? []

  return {
    labels: semanas.map((s) => `${formatFechaCorta(s.inicio)}–${formatFechaCorta(s.fin)}`),
    datasets: [
      {
        label: `Este año (${anioSeleccionado.value})`,
        backgroundColor: CHART_COLORS.esteAnio,
        data: semanas.map((s) => s.total),
      },
      {
        label: 'Año anterior',
        backgroundColor: CHART_COLORS.anioAnterior,
        data: calcularTotalAnioAnteriorPorSemana(semanas, dias),
      },
    ],
  }
})

const textoGraficoSemanalComparativo = computed(() => {
  const semanas = semanal.value?.semanas ?? []
  if (semanas.length === 0) {
    return 'Cada barra compara el total de esa semana contra el mismo rango de días del año anterior.'
  }
  return 'Cada barra compara el total de esa semana contra el mismo rango de días del año anterior. Si ningún día de esa semana tiene dato del año pasado, no se dibuja la barra de comparación.'
})

const textoNarrativoMeta = computed(() => {
  if (!resumen.value) return ''
  const pct = resumen.value.kpis.total_general.pct_avance
  const mesLabel = `${etiquetaMes(mesSeleccionado.value)} ${anioSeleccionado.value}`
  if (pct === null) {
    return `Aquí configuras la meta mensual de turnos RTM (livianos y motos) y ves cuánto falta para cumplirla. Aún no hay una meta configurada para ${mesLabel} — complétala en el formulario de la izquierda para ver el avance.`
  }
  const avance = resumen.value.kpis.total_general.avance
  const meta = resumen.value.kpis.total_general.meta
  if (avance >= meta) {
    return `Aquí configuras la meta mensual de turnos RTM (livianos y motos) y ves cuánto falta para cumplirla. Meta cumplida: llevas ${formatNum(avance)} de ${formatNum(meta)} turnos (${pct}%).`
  }
  const falta = meta - avance
  return `Aquí configuras la meta mensual de turnos RTM (livianos y motos) y ves cuánto falta para cumplirla. Llevas ${formatNum(avance)} de ${formatNum(meta)} turnos (${pct}%) — faltan ${formatNum(falta)} para completar la meta del mes.`
})

/* ===== Gráfico tab Meta ===== */
const avanceTotalMeta = computed(() => {
  const livianos = resumen.value?.kpis.livianos.avance ?? 0
  const motos = resumen.value?.kpis.motos.avance ?? 0
  return livianos + motos
})

const chartDataMeta = computed(() => {
  const livianos = resumen.value?.kpis.livianos.avance ?? 0
  const motos = resumen.value?.kpis.motos.avance ?? 0
  return {
    labels: ['Livianos', 'Motos'],
    datasets: [
      {
        backgroundColor: [CHART_COLORS.esteAnio, CHART_COLORS.motos],
        data: [livianos, motos],
      },
    ],
  }
})

const chartOptionsMeta = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const },
  },
}

const textoGraficoMeta = computed(() => {
  const total = avanceTotalMeta.value
  if (total === 0) return ''
  const livianos = resumen.value?.kpis.livianos.avance ?? 0
  const pctLivianos = Math.round((livianos / total) * 100)
  const pctMotos = 100 - pctLivianos
  return `De los ${formatNum(total)} turnos que llevas este mes, ${pctLivianos}% son livianos y ${pctMotos}% motos.`
})

/* ===== Gráfico tab Meta — Barras horizontales ===== */
const chartDataMetaBarras = computed(() => {
  const livianos = resumen.value?.kpis.livianos
  const motos = resumen.value?.kpis.motos
  return {
    labels: ['Livianos', 'Motos'],
    datasets: [
      {
        label: 'Avance',
        backgroundColor: CHART_COLORS.esteAnio,
        data: [livianos?.avance ?? null, motos?.avance ?? null],
      },
      {
        label: 'Meta',
        backgroundColor: CHART_COLORS.metaLinea,
        data: [
          livianos && livianos.pct_avance !== null ? livianos.meta : null,
          motos && motos.pct_avance !== null ? motos.meta : null,
        ],
      },
    ],
  }
})

const chartOptionsMetaBarras = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const },
    tooltip: {
      callbacks: {
        label: (context: { dataset: { label?: string }; parsed: { x: number | null } }) => {
          const label = context.dataset.label ?? ''
          if (context.parsed.x === null) return `${label}: sin meta configurada`
          return `${label}: ${context.parsed.x}`
        },
      },
    },
  },
  scales: {
    x: { beginAtZero: true },
  },
}

const textoGraficoMetaBarras = computed(() => {
  const livianos = resumen.value?.kpis.livianos
  const motos = resumen.value?.kpis.motos
  if (!livianos || !motos) return ''
  const sinMetaLivianos = livianos.pct_avance === null
  const sinMetaMotos = motos.pct_avance === null
  if (sinMetaLivianos && sinMetaMotos) {
    return 'Compara el avance actual contra la meta por tipo de vehículo. Aún no hay meta configurada para ninguno de los dos — la barra de meta no se dibuja hasta que la configures abajo.'
  }
  if (sinMetaLivianos || sinMetaMotos) {
    const cual = sinMetaLivianos ? 'Livianos' : 'Motos'
    return `Compara el avance actual contra la meta por tipo de vehículo. ${cual} aún no tiene meta configurada — su barra de meta no se dibuja hasta que la configures abajo.`
  }
  return 'Compara el avance actual contra la meta por tipo de vehículo.'
})

/* ===== Gráfico tab Meta — Tendencia ===== */
const chartDataMetaLinea = computed(() => {
  const dias = diario.value?.dias ?? []
  const labels = dias.map((d) => formatFechaCorta(d.fecha))

  const datasets: any[] = [
    {
      label: 'Acumulado del mes',
      data: dias.map((d) => d.acumulado_total),
      borderColor: CHART_COLORS.esteAnio,
      backgroundColor: CHART_COLORS.esteAnio,
      fill: false,
      tension: 0.3,
      pointRadius: 2,
    },
  ]

  const pctAvance = resumen.value?.kpis.total_general.pct_avance ?? null
  const metaTotal = resumen.value?.kpis.total_general.meta ?? null
  if (pctAvance !== null && metaTotal) {
    datasets.push({
      label: 'Meta del mes',
      data: dias.map(() => metaTotal),
      borderColor: CHART_COLORS.metaLinea,
      borderDash: [6, 6],
      fill: false,
      pointRadius: 0,
    })
  }

  return { labels, datasets }
})

const textoGraficoMetaLinea = computed(() => {
  if (!resumen.value || !diario.value) return ''
  const pct = resumen.value.kpis.total_general.pct_avance
  if (pct === null) {
    return 'La línea muestra tu acumulado real del mes. Configura una meta arriba para ver la línea de referencia.'
  }
  const { meta, avance } = resumen.value.kpis.total_general
  const { dias_del_mes: diasDelMes, dias_transcurridos: diasTranscurridos } = resumen.value
  const ritmoEsperado = diasDelMes > 0 ? (meta * diasTranscurridos) / diasDelMes : 0
  const vaBien = avance >= ritmoEsperado
  return `La línea sólida es tu acumulado real; la línea punteada es la meta del mes. Hoy vas ${vaBien ? 'por encima' : 'por debajo'} del ritmo necesario para llegar a la meta.`
})

const textoNarrativoProyectado = computed(() => {
  if (!proyectado.value) return ''
  const r = proyectado.value.resumen
  const mesLabel = `${etiquetaMes(mesSeleccionado.value)} ${anioSeleccionado.value}`
  if (!r) {
    return `Esto estima el cierre del mes según el promedio diario actual (solo días ya transcurridos). Aún no hay días con datos para calcular una proyección de ${mesLabel}.`
  }
  const promedioTotal = (r.promedio_diario_livianos + r.promedio_diario_motos).toFixed(1)
  if (r.pct_proyeccion_total === null) {
    return `Esto estima el cierre del mes según el promedio diario actual (solo días ya transcurridos, sin contar días futuros en cero). Con el promedio actual de ${promedioTotal} turnos/día, se proyecta cerrar el mes en ${formatNum(r.proyeccion_cierre_total)} turnos. Aún no hay una meta configurada para ${mesLabel} — configúrala en la pestaña "Meta" para saber si esa proyección alcanza.`
  }
  const alcanza = r.pct_proyeccion_total >= 100
  return `Esto estima el cierre del mes según el promedio diario actual (solo días ya transcurridos, sin contar días futuros en cero). Con el promedio actual de ${promedioTotal} turnos/día, se proyecta cerrar el mes en ${formatNum(r.proyeccion_cierre_total)} turnos — ${alcanza ? 'alcanza' : 'no alcanza'} la meta de ${formatNum(proyectado.value.meta_total)}.`
})

/* ===== Gráfico tab Proyectado ===== */
const pctProyeccionGauge = computed(() => proyectado.value?.resumen?.pct_proyeccion_total ?? null)

function colorGauge(pct: number) {
  if (pct >= 100) return CHART_COLORS.exito
  if (pct >= 90) return CHART_COLORS.amarillo
  return CHART_COLORS.rojo
}

const chartDataProyectado = computed(() => {
  const pct = pctProyeccionGauge.value
  if (pct === null) return { labels: [], datasets: [] }
  const pctCapped = Math.min(100, pct)
  return {
    labels: ['Avance', 'Restante'],
    datasets: [
      {
        backgroundColor: [colorGauge(pct), '#E0E0E0'],
        borderWidth: 0,
        data: [pctCapped, 100 - pctCapped],
      },
    ],
  }
})

const chartOptionsProyectado = {
  responsive: true,
  maintainAspectRatio: false,
  rotation: -90,
  circumference: 180,
  cutout: '75%',
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
}

/* ===== Gráfico tab Proyectado — Barras ===== */
const chartDataProyectadoBarras = computed(() => {
  const totalGeneral = resumen.value?.kpis.total_general
  const pct = pctProyeccionGauge.value
  const sinMeta = totalGeneral?.pct_avance === null

  return {
    labels: ['Avance actual', 'Proyección de cierre', 'Meta del mes'],
    datasets: [
      {
        label: `${etiquetaMes(mesSeleccionado.value)} ${anioSeleccionado.value}`,
        backgroundColor: [
          CHART_COLORS.esteAnio,
          pct === null ? CHART_COLORS.metaLinea : colorGauge(pct),
          CHART_COLORS.metaLinea,
        ],
        data: [
          totalGeneral?.avance ?? null,
          proyectado.value?.resumen?.proyeccion_cierre_total ?? null,
          sinMeta ? null : (proyectado.value?.meta_total ?? null),
        ],
      },
    ],
  }
})

const chartOptionsProyectadoBarras = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: { parsed: { y: number | null } }) =>
          context.parsed.y === null ? 'Sin dato disponible' : `${context.parsed.y}`,
      },
    },
  },
  scales: {
    y: { beginAtZero: true },
  },
}

/* ===== Gráfico tab Proyectado — Tendencia ===== */
const chartDataProyectadoLinea = computed(() => {
  const diasDelMes = proyectado.value?.dias_del_mes ?? 0
  const dias = proyectado.value?.dias ?? []
  if (diasDelMes === 0 || dias.length === 0) return { labels: [], datasets: [] }

  const labels = Array.from({ length: diasDelMes }, (_, i) => {
    const dia = String(i + 1).padStart(2, '0')
    const mes = String(mesSeleccionado.value).padStart(2, '0')
    return formatFechaCorta(`${anioSeleccionado.value}-${mes}-${dia}`)
  })

  const acumuladoReal = labels.map((_, i) => {
    const fechaEsperada = `${anioSeleccionado.value}-${String(mesSeleccionado.value).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    const d = dias.find((dia) => dia.fecha === fechaEsperada)
    return d ? d.acumulado_livianos + d.acumulado_motos : null
  })

  const datasets: any[] = [
    {
      label: 'Acumulado real',
      data: acumuladoReal,
      borderColor: CHART_COLORS.esteAnio,
      backgroundColor: CHART_COLORS.esteAnio,
      fill: false,
      tension: 0.3,
      pointRadius: 2,
    },
  ]

  const proyeccionFinal = proyectado.value?.resumen?.proyeccion_cierre_total ?? null
  if (proyeccionFinal !== null) {
    const proyeccionData: (number | null)[] = labels.map(() => null)
    proyeccionData[dias.length - 1] = acumuladoReal[dias.length - 1]
    proyeccionData[diasDelMes - 1] = proyeccionFinal
    datasets.push({
      label: 'Proyección de cierre',
      data: proyeccionData,
      borderColor: CHART_COLORS.metaLinea,
      backgroundColor: CHART_COLORS.metaLinea,
      borderDash: [6, 6],
      fill: false,
      spanGaps: true,
      pointRadius: 0,
    })
  }

  return { labels, datasets }
})

const textoGraficoProyectadoLinea =
  'La línea sólida muestra el acumulado real día a día; el tramo punteado extiende la proyección hasta fin de mes según el ritmo actual.'

const FUENTE_LABEL: Record<FuenteMetaMensual, string> = {
  real: 'Datos reales (turnos_rtms)',
  historico: 'Respaldo histórico',
  sin_datos: 'Sin datos disponibles',
}
const FUENTE_COLOR: Record<FuenteMetaMensual, string> = {
  real: 'green',
  historico: 'blue',
  sin_datos: 'grey',
}
function etiquetaFuente(f: FuenteMetaMensual) {
  return FUENTE_LABEL[f]
}
function colorFuente(f: FuenteMetaMensual) {
  return FUENTE_COLOR[f]
}

/* ===== Headers ===== */
const headersDiario = [
  { title: 'Fecha', key: 'fecha' },
  { title: 'Livianos', key: 'livianos' },
  { title: 'Motos', key: 'motos' },
  { title: 'Total', key: 'total' },
  { title: 'Acum. Livianos', key: 'acumulado_livianos' },
  { title: 'Acum. Motos', key: 'acumulado_motos' },
  { title: 'Acum. Total', key: 'acumulado_total' },
  { title: '% vs Meta', key: 'pct_vs_meta' },
  { title: 'vs. Año anterior', key: 'vs_anio_anterior', sortable: false },
]

const headersSemanal = [
  { title: 'Semana', key: 'semana', sortable: false },
  { title: 'Livianos', key: 'livianos' },
  { title: '% Livianos', key: 'pct_livianos' },
  { title: 'Motos', key: 'motos' },
  { title: '% Motos', key: 'pct_motos' },
  { title: 'Total', key: 'total' },
]

const headersProyectado = [
  { title: 'Fecha', key: 'fecha' },
  { title: 'Acum. Livianos', key: 'acumulado_livianos' },
  { title: 'Acum. Motos', key: 'acumulado_motos' },
  { title: 'Prom. Livianos/día', key: 'promedio_diario_livianos' },
  { title: 'Prom. Motos/día', key: 'promedio_diario_motos' },
  { title: 'Proy. Livianos', key: 'proyeccion_cierre_livianos' },
  { title: 'Proy. Motos', key: 'proyeccion_cierre_motos' },
  { title: 'Proy. Total', key: 'proyeccion_cierre_total' },
]

/* ===== Carga de datos ===== */
async function cargarTodo() {
  loading.value = true
  try {
    const [configResp, resumenResp, diarioResp, semanalResp, proyectadoResp] = await Promise.all([
      getMetaMensualConfig(mesSeleccionado.value, anioSeleccionado.value),
      getMetaMensualResumen(mesSeleccionado.value, anioSeleccionado.value),
      getMetaMensualDiario(mesSeleccionado.value, anioSeleccionado.value),
      getMetaMensualSemanal(mesSeleccionado.value, anioSeleccionado.value),
      getMetaMensualProyectado(mesSeleccionado.value, anioSeleccionado.value),
    ])

    configForm.meta_livianos = configResp.meta_livianos
    configForm.meta_motos = configResp.meta_motos
    configForm.pct_crecimiento_referencia = configResp.pct_crecimiento_referencia

    resumen.value = resumenResp
    diario.value = diarioResp
    semanal.value = semanalResp
    proyectado.value = proyectadoResp
    fuenteDatos.value = resumenResp.fuente_datos
  } catch (err) {
    console.error('Error cargando reporte Meta Mensual:', err)
    snack.text = '❌ Error al generar el reporte'
    snack.show = true
  } finally {
    loading.value = false
  }
}

async function guardarConfig() {
  savingConfig.value = true
  try {
    await putMetaMensualConfig({
      mes: mesSeleccionado.value,
      anio: anioSeleccionado.value,
      meta_livianos: configForm.meta_livianos,
      meta_motos: configForm.meta_motos,
      pct_crecimiento_referencia: configForm.pct_crecimiento_referencia,
    })
    snack.text = '✅ Meta guardada'
    snack.show = true
    await cargarTodo()
  } catch (err) {
    console.error('Error guardando meta mensual:', err)
    snack.text = '❌ Error al guardar la meta'
    snack.show = true
  } finally {
    savingConfig.value = false
  }
}

onMounted(() => {
  cargarTodo()
})
</script>

<style scoped>
.rounded-xl { border-radius: 16px; }
.rounded-2xl { border-radius: 20px; }
.text-medium-emphasis { color: rgba(0,0,0,.6); }

.kpi-card { border-left: 4px solid transparent; }
.border-verde { border-left-color: #2e7d32; }
.border-amarillo { border-left-color: #ff8f00; }
.border-rojo { border-left-color: #c62828; }
.border-sin_meta { border-left-color: #9e9e9e; }

:deep(.tabla-zebra tbody tr:nth-child(even)) {
  background-color: rgba(0, 0, 0, 0.025);
}
</style>
