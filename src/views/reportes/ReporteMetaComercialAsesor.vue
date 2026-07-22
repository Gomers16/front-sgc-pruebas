<!-- src/views/reportes/ReporteMetaComercialAsesor.vue -->
<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-account-cash</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Meta Comercial por Asesor</div>
            <div class="text-medium-emphasis">
              Avance de captaciones (convenio + propio) vs. meta del mes, por asesor
            </div>
          </div>
        </div>

        <v-chip
          v-if="resumenActual"
          :color="colorSemaforo(resumenActual.semaforo)"
          variant="flat"
          size="large"
          :prepend-icon="iconSemaforo(resumenActual.semaforo)"
        >
          {{ labelSemaforo(resumenActual.semaforo) }}
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
            <v-select
              v-model="asesorSeleccionado"
              :items="asesorItems"
              item-title="label"
              item-value="value"
              label="Asesor"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              :loading="loading"
              block
              @click="cargarTodo"
            >
              Generar
            </v-btn>
          </v-col>
          <v-col cols="12" md="2" class="text-md-right">
            <v-chip :color="colorFuente(fuenteDatos)" variant="tonal" size="small">
              {{ etiquetaFuente(fuenteDatos) }}
            </v-chip>
          </v-col>
        </v-row>
        <v-alert
          v-if="resumenGeneral?.nota"
          type="info"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          {{ resumenGeneral.nota }}
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- KPIs -->
    <v-row class="mb-2" dense>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card" :class="borderSemaforo(resumenActual?.semaforo)">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">Total General</div>
            <div class="text-h6 font-weight-bold">
              {{ formatMoney(resumenActual?.pesos_total) }} / {{ formatMoney(resumenActual?.meta_pesos) }}
            </div>
            <div class="text-caption">{{ formatPct(resumenActual?.pct_avance) }} de la meta</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">Convenio</div>
            <div class="text-h6 font-weight-bold">{{ formatMoney(resumenActual?.pesos_convenio) }}</div>
            <div class="text-caption">
              {{ resumenActual?.cantidad_convenio !== null && resumenActual?.cantidad_convenio !== undefined
                ? `${resumenActual.cantidad_convenio} captaciones` : 'comisión real' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">Propio (Comercial)</div>
            <div class="text-h6 font-weight-bold">{{ formatMoney(resumenActual?.pesos_comercial) }}</div>
            <div class="text-caption">
              {{ resumenActual?.cantidad_comercial !== null && resumenActual?.cantidad_comercial !== undefined
                ? `${resumenActual.cantidad_comercial} captaciones` : 'comisión real' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card elevation="6" class="rounded-xl kpi-card" :class="borderSemaforo(semaforoProyectado)">
          <v-card-text>
            <div class="text-caption text-medium-emphasis">Proyección de cierre</div>
            <div class="text-h6 font-weight-bold">{{ formatMoney(proyectado?.resumen?.proyeccion_cierre) }}</div>
            <div class="text-caption">{{ formatPct(proyectado?.resumen?.pct_proyeccion) }} de la meta proyectado</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- TABS -->
    <v-card elevation="8" class="rounded-xl">
      <v-tabs v-model="tab" color="primary" grow>
        <v-tab value="diario">
          Diario
          <v-icon :color="colorSemaforo(semaforoDiario)" size="10" class="ml-1">mdi-circle</v-icon>
        </v-tab>
        <v-tab value="semanal">
          Semanal
          <v-icon :color="colorSemaforo(semaforoSemanal)" size="10" class="ml-1">mdi-circle</v-icon>
        </v-tab>
        <v-tab value="meta">
          Meta
          <v-icon :color="colorSemaforo(resumenActual?.semaforo)" size="10" class="ml-1">mdi-circle</v-icon>
        </v-tab>
        <v-tab value="proyectado">
          Proyectado
          <v-icon :color="colorSemaforo(semaforoProyectado)" size="10" class="ml-1">mdi-circle</v-icon>
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text>
        <v-window v-model="tab">
          <!-- TAB DIARIO -->
          <v-window-item value="diario">
            <template v-if="diario?.fuente === 'historico_sin_detalle_diario'">
              <v-alert type="info" variant="tonal">{{ diario.nota }}</v-alert>
            </template>
            <template v-else>
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
                    <v-btn value="comparativo">Convenio vs Propio</v-btn>
                    <v-btn value="composicion">Composición</v-btn>
                    <v-btn value="medidor">Medidor</v-btn>
                  </v-btn-toggle>

                  <template v-if="tipoGraficoDiario === 'tendencia'">
                    <div style="height: 220px;">
                      <Line :data="chartDiarioLinea" :options="chartOptionsAcumulado" />
                    </div>
                  </template>
                  <template v-else-if="tipoGraficoDiario === 'barras'">
                    <div style="height: 220px;">
                      <Bar :data="chartDiarioBarras" :options="chartOptionsApilado" />
                    </div>
                  </template>
                  <template v-else-if="tipoGraficoDiario === 'comparativo'">
                    <div style="height: 220px;">
                      <Bar :data="chartDiarioComparativo" :options="chartOptionsBase" />
                    </div>
                  </template>
                  <template v-else-if="tipoGraficoDiario === 'composicion'">
                    <div v-if="totalAcumDiario > 0" style="height: 220px;">
                      <Doughnut :data="chartComposicion(diario?.dias.at(-1))" :options="chartOptionsBase" />
                    </div>
                    <v-alert v-else type="info" variant="tonal" density="compact">Aún no hay captaciones este mes.</v-alert>
                  </template>
                  <template v-else-if="tipoGraficoDiario === 'medidor'">
                    <div v-if="resumenActual?.pct_avance !== null && resumenActual?.pct_avance !== undefined" style="height: 220px; position: relative;">
                      <Doughnut :data="chartGauge(resumenActual.pct_avance)" :options="chartOptionsGauge" />
                      <div class="text-h5 font-weight-bold text-center" style="position: absolute; left: 0; right: 0; bottom: 8px;">
                        {{ formatPct(resumenActual.pct_avance) }}
                      </div>
                    </div>
                    <v-alert v-else type="info" variant="tonal" density="compact">Aún no hay meta configurada.</v-alert>
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
                <template #item.fecha="{ item }">{{ formatFechaCorta(item.fecha) }}</template>
                <template #item.pesos_convenio="{ item }">{{ formatMoney(item.pesos_convenio) }}</template>
                <template #item.pesos_comercial="{ item }">{{ formatMoney(item.pesos_comercial) }}</template>
                <template #item.pesos_total="{ item }">{{ formatMoney(item.pesos_total) }}</template>
                <template #item.acumulado_total="{ item }">{{ formatMoney(item.acumulado_total) }}</template>
                <template #item.pct_vs_meta="{ item }">
                  <span v-if="item.pct_vs_meta === null" class="text-caption text-medium-emphasis">Sin meta</span>
                  <div v-else class="d-flex align-center ga-2">
                    <span class="text-caption" style="min-width: 40px;">{{ formatPct(item.pct_vs_meta) }}</span>
                    <v-progress-linear
                      :model-value="Math.min(100, item.pct_vs_meta)"
                      height="5" rounded :color="colorPctVsMeta(item.pct_vs_meta)"
                      style="flex: 1; max-width: 70px;"
                    />
                  </div>
                </template>
              </v-data-table>

              <v-alert v-if="!loading && !diario?.dias.length" type="info" variant="tonal" class="mt-4">
                Sin comisiones registradas todavía para {{ etiquetaMes(mesSeleccionado) }} {{ anioSeleccionado }}.
              </v-alert>
            </template>
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
                  <v-btn value="comparativo">Convenio vs Propio</v-btn>
                  <v-btn value="composicion">Composición</v-btn>
                  <v-btn value="medidor">Medidor</v-btn>
                </v-btn-toggle>

                <template v-if="tipoGraficoSemanal === 'tendencia'">
                  <div style="height: 220px;">
                    <Line :data="chartSemanalLinea" :options="chartOptionsAcumulado" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoSemanal === 'barras'">
                  <div style="height: 220px;">
                    <Bar :data="chartSemanalBarras" :options="chartOptionsApilado" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoSemanal === 'comparativo'">
                  <div style="height: 220px;">
                    <Bar :data="chartSemanalComparativo" :options="chartOptionsBase" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoSemanal === 'composicion'">
                  <div v-if="totalAcumSemanal > 0" style="height: 220px;">
                    <Doughnut :data="chartComposicionSemanas" :options="chartOptionsBase" />
                  </div>
                  <v-alert v-else type="info" variant="tonal" density="compact">Aún no hay captaciones este mes.</v-alert>
                </template>
                <template v-else-if="tipoGraficoSemanal === 'medidor'">
                  <div v-if="resumenActual?.pct_avance !== null && resumenActual?.pct_avance !== undefined" style="height: 220px; position: relative;">
                    <Doughnut :data="chartGauge(resumenActual.pct_avance)" :options="chartOptionsGauge" />
                    <div class="text-h5 font-weight-bold text-center" style="position: absolute; left: 0; right: 0; bottom: 8px;">
                      {{ formatPct(resumenActual.pct_avance) }}
                    </div>
                  </div>
                  <v-alert v-else type="info" variant="tonal" density="compact">Aún no hay meta configurada.</v-alert>
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
              <template #item.semana="{ item }">{{ formatFechaCorta(item.inicio) }} — {{ formatFechaCorta(item.fin) }}</template>
              <template #item.pesos_convenio="{ item }">
                {{ formatMoney(item.pesos_convenio) }}
                <span v-if="item.cantidad_convenio !== null" class="text-caption text-medium-emphasis">({{ item.cantidad_convenio }})</span>
              </template>
              <template #item.pesos_comercial="{ item }">
                {{ formatMoney(item.pesos_comercial) }}
                <span v-if="item.cantidad_comercial !== null" class="text-caption text-medium-emphasis">({{ item.cantidad_comercial }})</span>
              </template>
              <template #item.pesos_total="{ item }">{{ formatMoney(item.pesos_total) }}</template>
              <template #item.pct_vs_meta="{ item }">
                <span v-if="item.pct_vs_meta === null" class="text-caption text-medium-emphasis">Sin meta</span>
                <div v-else class="d-flex align-center ga-2">
                  <span class="text-caption" style="min-width: 40px;">{{ formatPct(item.pct_vs_meta) }}</span>
                  <v-progress-linear
                    :model-value="Math.min(100, item.pct_vs_meta)"
                    height="5" rounded :color="colorPctVsMeta(item.pct_vs_meta)"
                    style="flex: 1; max-width: 70px;"
                  />
                </div>
              </template>
            </v-data-table>

            <v-alert v-if="!loading && !semanal?.semanas.length" type="info" variant="tonal" class="mt-4">
              Sin datos disponibles para {{ etiquetaMes(mesSeleccionado) }} {{ anioSeleccionado }}.
            </v-alert>
          </v-window-item>

          <!-- TAB META -->
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
                  <v-btn value="comparativo">Convenio vs Propio</v-btn>
                  <v-btn value="composicion">Composición</v-btn>
                  <v-btn value="medidor">Medidor</v-btn>
                </v-btn-toggle>

                <template v-if="tipoGraficoMeta === 'tendencia'">
                  <div style="height: 220px;">
                    <Line :data="chartMetaLinea" :options="chartOptionsAcumulado" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoMeta === 'barras'">
                  <div style="height: 220px;">
                    <Bar :data="chartMetaBarras" :options="chartOptionsMetaBarras" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoMeta === 'comparativo'">
                  <div style="height: 220px;">
                    <Bar :data="chartAsesoresComparativo" :options="chartOptionsBase" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoMeta === 'composicion'">
                  <div v-if="(resumenActual?.pesos_total ?? 0) > 0" style="height: 220px;">
                    <Doughnut :data="chartComposicion(resumenActual)" :options="chartOptionsBase" />
                  </div>
                  <v-alert v-else type="info" variant="tonal" density="compact">Aún no hay captaciones este mes.</v-alert>
                </template>
                <template v-else-if="tipoGraficoMeta === 'medidor'">
                  <div v-if="resumenActual?.pct_avance !== null && resumenActual?.pct_avance !== undefined" style="height: 220px; position: relative;">
                    <Doughnut :data="chartGauge(resumenActual.pct_avance)" :options="chartOptionsGauge" />
                    <div class="text-h5 font-weight-bold text-center" style="position: absolute; left: 0; right: 0; bottom: 8px;">
                      {{ formatPct(resumenActual.pct_avance) }}
                    </div>
                  </div>
                  <v-alert v-else type="info" variant="tonal" density="compact">Aún no hay meta configurada.</v-alert>
                </template>
              </v-col>
            </v-row>

            <v-row v-if="resumenActual">
              <v-col cols="12">
                <v-card variant="outlined" class="rounded-xl">
                  <v-card-title class="text-subtitle-1">Cuánto se lleva vs. cuánto falta — {{ resumenActual.asesor_nombre }}</v-card-title>
                  <v-card-text>
                    <div>
                      <div class="d-flex justify-space-between font-weight-bold">
                        <span>Total</span>
                        <span>
                          {{ formatMoney(resumenActual.pesos_total) }} / {{ formatMoney(resumenActual.meta_pesos) }}
                          <template v-if="resumenActual.meta_pesos">
                            (falta {{ formatMoney(Math.max(0, resumenActual.meta_pesos - resumenActual.pesos_total)) }})
                          </template>
                        </span>
                      </div>
                      <v-progress-linear
                        :model-value="resumenActual.pct_avance ?? 0"
                        :color="colorSemaforo(resumenActual.semaforo)"
                        height="12" rounded class="mt-1"
                      />
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-alert v-else type="info" variant="tonal" class="mt-2">
              Sin meta ni datos configurados para {{ etiquetaMes(mesSeleccionado) }} {{ anioSeleccionado }}.
            </v-alert>

            <v-data-table
              v-if="asesorSeleccionado === null"
              class="tabla-zebra mt-4"
              :headers="headersResumenAsesores"
              :items="resumenGeneral?.asesores ?? []"
              :loading="loading"
              item-key="asesor_id"
              hover
              hide-default-footer
              :items-per-page="-1"
            >
              <template #item.pesos_convenio="{ item }">{{ formatMoney(item.pesos_convenio) }}</template>
              <template #item.pesos_comercial="{ item }">{{ formatMoney(item.pesos_comercial) }}</template>
              <template #item.pesos_total="{ item }">{{ formatMoney(item.pesos_total) }}</template>
              <template #item.meta_pesos="{ item }">{{ formatMoney(item.meta_pesos) }}</template>
              <template #item.pct_avance="{ item }">
                <span v-if="item.pct_avance === null" class="text-caption text-medium-emphasis">Sin meta</span>
                <v-chip v-else size="small" :color="colorSemaforo(item.semaforo)" variant="tonal">{{ formatPct(item.pct_avance) }}</v-chip>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- TAB PROYECTADO -->
          <v-window-item value="proyectado">
            <div class="text-body-2 text-medium-emphasis mb-3">{{ textoNarrativoProyectado }}</div>

            <v-alert v-if="proyectado?.nota" type="info" variant="tonal" density="compact" class="mb-3">
              {{ proyectado.nota }}
            </v-alert>

            <v-row v-if="proyectado?.resumen" class="mb-3" dense>
              <v-col cols="12" sm="4">
                <v-card variant="tonal" class="rounded-xl">
                  <v-card-text>
                    <div class="text-caption">Promedio por {{ proyectado.granularidad === 'diaria' ? 'día' : 'semana' }}</div>
                    <div class="text-h6">{{ formatMoney(proyectado.resumen.promedio_por_periodo) }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card variant="tonal" class="rounded-xl">
                  <v-card-text>
                    <div class="text-caption">Proyección de cierre</div>
                    <div class="text-h6">{{ formatMoney(proyectado.resumen.proyeccion_cierre) }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" sm="4">
                <v-card variant="tonal" class="rounded-xl">
                  <v-card-text>
                    <div class="text-caption">% de la meta proyectado</div>
                    <div class="text-h6">{{ formatPct(proyectado.resumen.pct_proyeccion) }}</div>
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
                  <v-btn value="comparativo">Convenio vs Propio</v-btn>
                  <v-btn value="composicion">Composición</v-btn>
                  <v-btn value="medidor">Medidor</v-btn>
                </v-btn-toggle>

                <template v-if="tipoGraficoProyectado === 'tendencia'">
                  <div v-if="proyectado?.periodos.length" style="height: 220px;">
                    <Line :data="chartProyectadoLinea" :options="chartOptionsAcumulado" />
                  </div>
                  <v-alert v-else type="info" variant="tonal" density="compact">Aún no hay periodos con datos.</v-alert>
                </template>
                <template v-else-if="tipoGraficoProyectado === 'barras'">
                  <div style="height: 220px;">
                    <Bar :data="chartProyectadoBarras" :options="chartOptionsBase" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoProyectado === 'comparativo'">
                  <div style="height: 220px;">
                    <Bar :data="chartDiarioComparativo" :options="chartOptionsBase" />
                  </div>
                </template>
                <template v-else-if="tipoGraficoProyectado === 'composicion'">
                  <div v-if="(resumenActual?.pesos_total ?? 0) > 0" style="height: 220px;">
                    <Doughnut :data="chartComposicion(resumenActual)" :options="chartOptionsBase" />
                  </div>
                  <v-alert v-else type="info" variant="tonal" density="compact">Aún no hay captaciones este mes.</v-alert>
                </template>
                <template v-else-if="tipoGraficoProyectado === 'medidor'">
                  <div v-if="proyectado?.resumen?.pct_proyeccion !== null && proyectado?.resumen?.pct_proyeccion !== undefined" style="height: 220px; position: relative;">
                    <Doughnut :data="chartGauge(proyectado.resumen.pct_proyeccion)" :options="chartOptionsGauge" />
                    <div class="text-h5 font-weight-bold text-center" style="position: absolute; left: 0; right: 0; bottom: 8px;">
                      {{ formatPct(proyectado.resumen.pct_proyeccion) }}
                    </div>
                  </div>
                  <v-alert v-else type="info" variant="tonal" density="compact">Aún no hay meta configurada para proyectar.</v-alert>
                </template>
              </v-col>
            </v-row>

            <v-data-table
              :headers="headersProyectado"
              :items="proyectado?.periodos ?? []"
              :loading="loading"
              item-key="etiqueta"
              hover
              hide-default-footer
              :items-per-page="-1"
            >
              <template #item.acumulado="{ item }">{{ formatMoney(item.acumulado) }}</template>
              <template #item.promedio="{ item }">{{ formatMoney(item.promedio) }}</template>
              <template #item.proyeccion="{ item }">{{ formatMoney(item.proyeccion) }}</template>
            </v-data-table>

            <v-alert v-if="!loading && !proyectado?.periodos.length" type="info" variant="tonal" class="mt-4">
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
  getMetaComercialResumen,
  getMetaComercialDiario,
  getMetaComercialSemanal,
  getMetaComercialProyectado,
  type MetaComercialResumenResponse,
  type MetaComercialDiarioResponse,
  type MetaComercialSemanalResponse,
  type MetaComercialProyectadoResponse,
  type MetaComercialAsesorResumen,
  type FuenteMetaComercial,
  type SemaforoColor,
} from '@/services/reportesAdminService'
import { listAsesores, type Agente } from '@/services/asesoresService'
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
  Title, Tooltip, Legend, LineElement, PointElement, LineController, Filler,
  BarElement, CategoryScale, LinearScale, ArcElement,
)

/* ===== Selectores ===== */
const MESES = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
]
function etiquetaMes(mes: number) {
  return MESES.find((m) => m.value === mes)?.label ?? String(mes)
}

const hoy = new Date()
const mesSeleccionado = ref(hoy.getMonth() + 1)
const anioSeleccionado = ref(hoy.getFullYear())
const asesorSeleccionado = ref<number | null>(null)

const asesores = ref<Agente[]>([])
const asesorItems = computed(() => [
  { value: null, label: 'Todos los asesores' },
  ...asesores.value.map((a) => ({ value: a.id, label: a.nombre })),
])

async function cargarAsesores() {
  try {
    const resp = await listAsesores({ tipo: 'ASESOR_COMERCIAL', activo: true, perPage: 100 })
    asesores.value = resp.data
  } catch (err) {
    console.error('Error cargando asesores:', err)
  }
}

type TipoGrafico = 'tendencia' | 'barras' | 'comparativo' | 'composicion' | 'medidor'

const tab = ref('diario')
const tipoGraficoDiario = ref<TipoGrafico>('tendencia')
const tipoGraficoSemanal = ref<TipoGrafico>('tendencia')
const tipoGraficoMeta = ref<TipoGrafico>('composicion')
const tipoGraficoProyectado = ref<TipoGrafico>('medidor')
const loading = ref(false)
const snack = reactive({ show: false, text: '' })

const resumenGeneral = ref<MetaComercialResumenResponse | null>(null)
const diario = ref<MetaComercialDiarioResponse | null>(null)
const semanal = ref<MetaComercialSemanalResponse | null>(null)
const proyectado = ref<MetaComercialProyectadoResponse | null>(null)
const fuenteDatos = ref<FuenteMetaComercial>('historico')

/* ===== Fila "actual" (asesor puntual o agregado de todos) ===== */
const resumenActual = computed<MetaComercialAsesorResumen | null>(() => {
  const lista = resumenGeneral.value?.asesores ?? []
  if (asesorSeleccionado.value !== null) {
    return lista.find((a) => a.asesor_id === asesorSeleccionado.value) ?? null
  }
  if (lista.length === 0) return null
  const agregado = lista.reduce(
    (acc, a) => {
      acc.pesos_convenio += a.pesos_convenio
      acc.pesos_comercial += a.pesos_comercial
      acc.cantidad_convenio = a.cantidad_convenio === null ? null : (acc.cantidad_convenio ?? 0) + a.cantidad_convenio
      acc.cantidad_comercial = a.cantidad_comercial === null ? null : (acc.cantidad_comercial ?? 0) + a.cantidad_comercial
      acc.meta_pesos = a.meta_pesos === null ? acc.meta_pesos : (acc.meta_pesos ?? 0) + a.meta_pesos
      return acc
    },
    { pesos_convenio: 0, pesos_comercial: 0, cantidad_convenio: null as number | null, cantidad_comercial: null as number | null, meta_pesos: null as number | null }
  )
  const pesosTotal = agregado.pesos_convenio + agregado.pesos_comercial
  const pct = calcularPct(pesosTotal, agregado.meta_pesos)
  return {
    asesor_id: -1,
    asesor_nombre: 'Todos los asesores',
    fuente: lista[0].fuente,
    es_estimado: lista.every((a) => a.es_estimado),
    cantidad_convenio: agregado.cantidad_convenio,
    cantidad_comercial: agregado.cantidad_comercial,
    pesos_convenio: agregado.pesos_convenio,
    pesos_comercial: agregado.pesos_comercial,
    pesos_total: pesosTotal,
    meta_pesos: agregado.meta_pesos,
    pct_avance: pct,
    semaforo: calcularSemaforo(pct),
  }
})

/* ===== Formato ===== */
function formatMoney(n: number | undefined | null) {
  if (n === undefined || n === null) return '—'
  return `$${new Intl.NumberFormat('es-CO').format(Math.round(n))}`
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
function calcularPct(avance: number, meta: number | null): number | null {
  if (!meta || meta <= 0) return null
  return Math.round((avance / meta) * 1000) / 10
}
function calcularSemaforo(pct: number | null): SemaforoColor {
  if (pct === null) return 'SIN_META'
  if (pct >= 100) return 'VERDE'
  if (pct >= 90) return 'AMARILLO'
  return 'ROJO'
}

const SEMAFORO_COLOR: Record<SemaforoColor, string> = {
  VERDE: 'green-darken-1', AMARILLO: 'amber-darken-2', ROJO: 'red-darken-1', SIN_META: 'grey-darken-1',
}
const SEMAFORO_ICON: Record<SemaforoColor, string> = {
  VERDE: 'mdi-circle', AMARILLO: 'mdi-circle', ROJO: 'mdi-circle', SIN_META: 'mdi-minus-circle-outline',
}
function colorSemaforo(color: SemaforoColor | undefined) { return color ? SEMAFORO_COLOR[color] : 'grey' }
function labelSemaforo(color: SemaforoColor | undefined) { return color ? color.replace('_', ' ') : '' }
function iconSemaforo(color: SemaforoColor | undefined) { return color ? SEMAFORO_ICON[color] : 'mdi-circle' }
function borderSemaforo(color: SemaforoColor | undefined) { return color ? `border-${color.toLowerCase()}` : '' }
function colorPctVsMeta(pct: number) {
  if (pct >= 100) return colorSemaforo('VERDE')
  if (pct >= 90) return colorSemaforo('AMARILLO')
  return colorSemaforo('ROJO')
}

const semaforoDiario = computed<SemaforoColor | undefined>(() => {
  if (diario.value?.fuente !== 'real') return undefined
  const ultimo = diario.value.dias.at(-1)
  return ultimo ? calcularSemaforo(ultimo.pct_vs_meta) : undefined
})
const semaforoSemanal = computed<SemaforoColor | undefined>(() => {
  const ultimo = semanal.value?.semanas.at(-1)
  return ultimo ? calcularSemaforo(ultimo.pct_vs_meta) : undefined
})
const semaforoProyectado = computed<SemaforoColor | undefined>(() =>
  proyectado.value?.resumen ? calcularSemaforo(proyectado.value.resumen.pct_proyeccion) : undefined
)

const FUENTE_LABEL: Record<FuenteMetaComercial, string> = { real: 'Datos reales (comisiones)', historico: 'Respaldo histórico (estimado)' }
const FUENTE_COLOR: Record<FuenteMetaComercial, string> = { real: 'green', historico: 'blue' }
function etiquetaFuente(f: FuenteMetaComercial) { return FUENTE_LABEL[f] }
function colorFuente(f: FuenteMetaComercial) { return FUENTE_COLOR[f] }

/* ===== Narrativas ===== */
const textoNarrativoDiario = computed(() => {
  if (!diario.value) return ''
  const pct = resumenActual.value?.pct_avance
  if (pct === null || pct === undefined) return 'Avance día a día de captaciones (convenio + propio) en pesos. Aún no hay una meta configurada para este mes.'
  return `Avance día a día de captaciones (convenio + propio) en pesos frente a la meta del mes. Vas en ${pct}%.`
})
const textoNarrativoSemanal = computed(() => {
  if (!semanal.value) return ''
  const acumulado = semanal.value.semanas.reduce((acc, s) => acc + s.pesos_total, 0)
  return `Captaciones agrupadas por semana (sábado a viernes)${semanal.value.es_estimado ? ', en pesos ESTIMADOS con tarifa plana' : ', en pesos reales de comisión'}. Acumulado del mes: ${formatMoney(acumulado)}.`
})
const textoNarrativoMeta = computed(() => {
  const r = resumenActual.value
  if (!r) return 'Aún no hay meta ni datos configurados para este mes.'
  if (r.meta_pesos === null) return `${r.asesor_nombre} no tiene meta configurada para ${etiquetaMes(mesSeleccionado.value)} ${anioSeleccionado.value}.`
  const falta = Math.max(0, r.meta_pesos - r.pesos_total)
  return `${r.asesor_nombre}: ${formatMoney(r.pesos_total)} de ${formatMoney(r.meta_pesos)} (${formatPct(r.pct_avance)}) — faltan ${formatMoney(falta)} para completar la meta.`
})
const textoNarrativoProyectado = computed(() => {
  const p = proyectado.value
  if (!p) return ''
  if (!p.resumen) return 'Aún no hay periodos con datos para proyectar el cierre del mes.'
  const unidad = p.granularidad === 'diaria' ? 'día' : 'semana'
  return `Proyección de cierre según el promedio por ${unidad} (${formatMoney(p.resumen.promedio_por_periodo)}/${unidad}): ${formatMoney(p.resumen.proyeccion_cierre)} — ${formatPct(p.resumen.pct_proyeccion)} de la meta.`
})

/* ===== Colores / opciones de gráficos ===== */
const COLORS = { convenio: '#42A5F5', comercial: '#AB47BC', meta: '#9E9E9E', exito: '#43A047', amarillo: '#FFA000', rojo: '#E53935' }
function colorGauge(pct: number) {
  if (pct >= 100) return COLORS.exito
  if (pct >= 90) return COLORS.amarillo
  return COLORS.rojo
}

const chartOptionsBase = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' as const } } }
const chartOptionsAcumulado = { ...chartOptionsBase, scales: { y: { beginAtZero: true } } }
const chartOptionsApilado = {
  ...chartOptionsBase,
  scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
}
const chartOptionsMetaBarras = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const } },
  scales: { x: { beginAtZero: true } },
}
const chartOptionsGauge = {
  responsive: true, maintainAspectRatio: false, rotation: -90, circumference: 180, cutout: '75%',
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
}

function chartGauge(pct: number) {
  const capped = Math.min(100, pct)
  return { labels: ['Avance', 'Restante'], datasets: [{ backgroundColor: [colorGauge(pct), '#E0E0E0'], borderWidth: 0, data: [capped, 100 - capped] }] }
}
function chartComposicion(item: { pesos_convenio: number; pesos_comercial: number } | undefined | null) {
  return {
    labels: ['Convenio', 'Propio'],
    datasets: [{ backgroundColor: [COLORS.convenio, COLORS.comercial], data: [item?.pesos_convenio ?? 0, item?.pesos_comercial ?? 0] }],
  }
}

/* ===== Tab Diario ===== */
const totalAcumDiario = computed(() => diario.value?.dias.at(-1)?.acumulado_total ?? 0)

const chartDiarioLinea = computed(() => {
  const dias = diario.value?.dias ?? []
  const datasets: any[] = [{
    label: 'Acumulado total', data: dias.map((d) => d.acumulado_total),
    borderColor: COLORS.convenio, backgroundColor: COLORS.convenio, fill: false, tension: 0.3, pointRadius: 2,
  }]
  const meta = resumenActual.value?.meta_pesos
  if (meta) datasets.push({ label: 'Meta del mes', data: dias.map(() => meta), borderColor: COLORS.meta, borderDash: [6, 6], fill: false, pointRadius: 0 })
  return { labels: dias.map((d) => formatFechaCorta(d.fecha)), datasets }
})
const chartDiarioBarras = computed(() => {
  const dias = diario.value?.dias ?? []
  return {
    labels: dias.map((d) => formatFechaCorta(d.fecha)),
    datasets: [
      { label: 'Convenio', backgroundColor: COLORS.convenio, data: dias.map((d) => d.pesos_convenio) },
      { label: 'Propio', backgroundColor: COLORS.comercial, data: dias.map((d) => d.pesos_comercial) },
    ],
  }
})
const chartDiarioComparativo = computed(() => {
  const dias = diario.value?.dias ?? []
  const semanas = semanal.value?.semanas ?? []
  if (dias.length > 0) {
    return {
      labels: dias.map((d) => formatFechaCorta(d.fecha)),
      datasets: [
        { label: 'Convenio', backgroundColor: COLORS.convenio, data: dias.map((d) => d.pesos_convenio) },
        { label: 'Propio', backgroundColor: COLORS.comercial, data: dias.map((d) => d.pesos_comercial) },
      ],
    }
  }
  return {
    labels: semanas.map((s) => `${formatFechaCorta(s.inicio)}–${formatFechaCorta(s.fin)}`),
    datasets: [
      { label: 'Convenio', backgroundColor: COLORS.convenio, data: semanas.map((s) => s.pesos_convenio) },
      { label: 'Propio', backgroundColor: COLORS.comercial, data: semanas.map((s) => s.pesos_comercial) },
    ],
  }
})

/* ===== Tab Semanal ===== */
const totalAcumSemanal = computed(() => (semanal.value?.semanas ?? []).reduce((acc, s) => acc + s.pesos_total, 0))

const chartSemanalLinea = computed(() => {
  const semanas = semanal.value?.semanas ?? []
  let acumulado = 0
  const acumuladoData = semanas.map((s) => (acumulado += s.pesos_total))
  const datasets: any[] = [{
    label: 'Acumulado', data: acumuladoData, borderColor: COLORS.convenio, backgroundColor: COLORS.convenio,
    fill: false, tension: 0.3, pointRadius: 4,
  }]
  const meta = resumenActual.value?.meta_pesos
  if (meta) datasets.push({ label: 'Meta del mes', data: semanas.map(() => meta), borderColor: COLORS.meta, borderDash: [6, 6], fill: false, pointRadius: 0 })
  return { labels: semanas.map((s) => `${formatFechaCorta(s.inicio)}–${formatFechaCorta(s.fin)}`), datasets }
})
const chartSemanalBarras = computed(() => {
  const semanas = semanal.value?.semanas ?? []
  return {
    labels: semanas.map((s) => `${formatFechaCorta(s.inicio)}–${formatFechaCorta(s.fin)}`),
    datasets: [
      { label: 'Convenio', backgroundColor: COLORS.convenio, data: semanas.map((s) => s.pesos_convenio) },
      { label: 'Propio', backgroundColor: COLORS.comercial, data: semanas.map((s) => s.pesos_comercial) },
    ],
  }
})
const chartSemanalComparativo = chartSemanalBarras
const chartComposicionSemanas = computed(() => {
  const semanas = semanal.value?.semanas ?? []
  const convenio = semanas.reduce((acc, s) => acc + s.pesos_convenio, 0)
  const comercial = semanas.reduce((acc, s) => acc + s.pesos_comercial, 0)
  return { labels: ['Convenio', 'Propio'], datasets: [{ backgroundColor: [COLORS.convenio, COLORS.comercial], data: [convenio, comercial] }] }
})

/* ===== Tab Meta ===== */
const chartMetaLinea = chartSemanalLinea
const chartMetaBarras = computed(() => {
  const r = resumenActual.value
  return {
    labels: ['Convenio', 'Propio', 'Total'],
    datasets: [
      { label: 'Avance', backgroundColor: COLORS.convenio, data: [r?.pesos_convenio ?? 0, r?.pesos_comercial ?? 0, r?.pesos_total ?? 0] },
      { label: 'Meta', backgroundColor: COLORS.meta, data: [null, null, r?.meta_pesos ?? null] },
    ],
  }
})
const chartAsesoresComparativo = computed(() => {
  const lista = resumenGeneral.value?.asesores ?? []
  return {
    labels: lista.map((a) => a.asesor_nombre),
    datasets: [
      { label: 'Convenio', backgroundColor: COLORS.convenio, data: lista.map((a) => a.pesos_convenio) },
      { label: 'Propio', backgroundColor: COLORS.comercial, data: lista.map((a) => a.pesos_comercial) },
    ],
  }
})

/* ===== Tab Proyectado ===== */
const chartProyectadoLinea = computed(() => {
  const periodos = proyectado.value?.periodos ?? []
  const datasets: any[] = [{
    label: 'Acumulado', data: periodos.map((p) => p.acumulado), borderColor: COLORS.convenio,
    backgroundColor: COLORS.convenio, fill: false, tension: 0.3, pointRadius: 3,
  }]
  const meta = resumenActual.value?.meta_pesos
  if (meta) datasets.push({ label: 'Meta del mes', data: periodos.map(() => meta), borderColor: COLORS.meta, borderDash: [6, 6], fill: false, pointRadius: 0 })
  return { labels: periodos.map((p) => p.etiqueta), datasets }
})
const chartProyectadoBarras = computed(() => {
  const r = resumenActual.value
  const p = proyectado.value
  return {
    labels: ['Avance actual', 'Proyección de cierre', 'Meta del mes'],
    datasets: [{
      label: `${etiquetaMes(mesSeleccionado.value)} ${anioSeleccionado.value}`,
      backgroundColor: [COLORS.convenio, p?.resumen ? colorGauge(p.resumen.pct_proyeccion ?? 0) : COLORS.meta, COLORS.meta],
      data: [r?.pesos_total ?? null, p?.resumen?.proyeccion_cierre ?? null, r?.meta_pesos ?? null],
    }],
  }
})

/* ===== Headers ===== */
const headersDiario = [
  { title: 'Fecha', key: 'fecha' },
  { title: 'Convenio', key: 'pesos_convenio' },
  { title: 'Propio', key: 'pesos_comercial' },
  { title: 'Total día', key: 'pesos_total' },
  { title: 'Acumulado', key: 'acumulado_total' },
  { title: '% vs Meta', key: 'pct_vs_meta' },
]
const headersSemanal = [
  { title: 'Semana', key: 'semana', sortable: false },
  { title: 'Convenio', key: 'pesos_convenio' },
  { title: 'Propio', key: 'pesos_comercial' },
  { title: 'Total', key: 'pesos_total' },
  { title: '% vs Meta', key: 'pct_vs_meta' },
]
const headersResumenAsesores = [
  { title: 'Asesor', key: 'asesor_nombre' },
  { title: 'Convenio', key: 'pesos_convenio' },
  { title: 'Propio', key: 'pesos_comercial' },
  { title: 'Total', key: 'pesos_total' },
  { title: 'Meta', key: 'meta_pesos' },
  { title: '% Avance', key: 'pct_avance' },
]
const headersProyectado = [
  { title: 'Periodo', key: 'etiqueta' },
  { title: 'Acumulado', key: 'acumulado' },
  { title: 'Promedio', key: 'promedio' },
  { title: 'Proyección', key: 'proyeccion' },
]

/* ===== Carga de datos ===== */
async function cargarTodo() {
  loading.value = true
  try {
    const [resumenResp, diarioResp, semanalResp, proyectadoResp] = await Promise.all([
      getMetaComercialResumen(mesSeleccionado.value, anioSeleccionado.value),
      getMetaComercialDiario(mesSeleccionado.value, anioSeleccionado.value, asesorSeleccionado.value),
      getMetaComercialSemanal(mesSeleccionado.value, anioSeleccionado.value, asesorSeleccionado.value),
      getMetaComercialProyectado(mesSeleccionado.value, anioSeleccionado.value, asesorSeleccionado.value),
    ])

    resumenGeneral.value = resumenResp
    diario.value = diarioResp
    semanal.value = semanalResp
    proyectado.value = proyectadoResp
    fuenteDatos.value = resumenResp.fuente
  } catch (err) {
    console.error('Error cargando reporte Meta Comercial:', err)
    snack.text = '❌ Error al generar el reporte'
    snack.show = true
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await cargarAsesores()
  await cargarTodo()
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
