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
        <v-tab value="dateos" :disabled="asesorSeleccionado === null">
          Detalle de Dateos
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
                <template #item.cantidad_total="{ item }">{{ item.cantidad_total }}</template>
                <template #item.cantidad_motos="{ item }">{{ item.cantidad_motos }}</template>
                <template #item.cantidad_carros="{ item }">{{ item.cantidad_carros }}</template>
                <template #item.pesos_convenio="{ item }">
                  <span class="text-secondary">{{ formatMoney(item.pesos_convenio) }} <span class="text-caption">({{ item.cantidad_convenio }})</span></span>
                </template>
                <template #item.pesos_comercial="{ item }">
                  <span class="text-secondary">{{ formatMoney(item.pesos_comercial) }} <span class="text-caption">({{ item.cantidad_comercial }})</span></span>
                </template>
                <template #item.pesos_total="{ item }"><span class="text-secondary">{{ formatMoney(item.pesos_total) }}</span></template>
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

            <v-alert
              v-if="semanal?.cantidad_vehiculo_estimada"
              type="info" variant="tonal" density="compact" class="mb-2"
            >
              Motos/Carros estimados por prorrateo mensual (no hay detalle real por semana antes de junio/2026).
            </v-alert>

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
              <template #item.cantidad_total="{ item }">{{ item.cantidad_total ?? '—' }}</template>
              <template #item.cantidad_motos="{ item }">{{ item.cantidad_motos ?? '—' }}</template>
              <template #item.cantidad_carros="{ item }">{{ item.cantidad_carros ?? '—' }}</template>
              <template #item.pesos_convenio="{ item }">
                <span class="text-secondary">
                  {{ formatMoney(item.pesos_convenio) }}
                  <span v-if="item.cantidad_convenio !== null" class="text-caption">({{ item.cantidad_convenio }})</span>
                </span>
              </template>
              <template #item.pesos_comercial="{ item }">
                <span class="text-secondary">
                  {{ formatMoney(item.pesos_comercial) }}
                  <span v-if="item.cantidad_comercial !== null" class="text-caption">({{ item.cantidad_comercial }})</span>
                </span>
              </template>
              <template #item.pesos_total="{ item }"><span class="text-secondary">{{ formatMoney(item.pesos_total) }}</span></template>
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
              <template #item.acumulado_total="{ item }">{{ formatMoney(item.acumulado_total) }}</template>
              <template #item.pct_acumulado_vs_meta="{ item }">
                <span v-if="item.pct_acumulado_vs_meta === null" class="text-caption text-medium-emphasis">Sin meta</span>
                <div v-else class="d-flex align-center ga-2">
                  <span class="text-caption" style="min-width: 40px;">{{ formatPct(item.pct_acumulado_vs_meta) }}</span>
                  <v-progress-linear
                    :model-value="Math.min(100, item.pct_acumulado_vs_meta)"
                    height="5" rounded :color="colorPctVsMeta(item.pct_acumulado_vs_meta)"
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

            <v-card
              v-if="detalleVehiculo?.disponible"
              variant="outlined"
              class="rounded-xl mt-4"
            >
              <v-card-title class="text-subtitle-1">
                Detalle real por tipo de vehículo — {{ detalleVehiculo.asesor_nombre }}
              </v-card-title>
              <v-card-text>
                <v-data-table
                  class="tabla-zebra"
                  :headers="headersDetalleVehiculo"
                  :items="filasDetalleVehiculo"
                  item-key="categoria"
                  hover
                  hide-default-footer
                  :items-per-page="-1"
                >
                  <template #item.categoria="{ item }">
                    <span :class="{ 'font-weight-bold': item.esTotal }">{{ item.categoria }}</span>
                  </template>
                  <template #item.cantidad="{ item }">
                    <span :class="{ 'font-weight-bold': item.esTotal }">{{ item.cantidad ?? '—' }}</span>
                  </template>
                  <template #item.tarifa="{ item }">
                    <span :class="{ 'font-weight-bold': item.esTotal }">{{ item.tarifa !== null ? formatMoney(item.tarifa) : '—' }}</span>
                  </template>
                  <template #item.pesos="{ item }">
                    <span :class="{ 'font-weight-bold': item.esTotal }">{{ formatMoney(item.pesos) }}</span>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>

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

          <!-- TAB DETALLE DE DATEOS -->
          <v-window-item value="dateos">
            <v-alert v-if="asesorSeleccionado === null" type="info" variant="tonal">
              Selecciona un asesor específico para ver este detalle.
            </v-alert>

            <template v-else>
              <div class="text-body-2 text-medium-emphasis mb-3">{{ textoNarrativoDateos }}</div>

              <v-row class="mb-4" dense align="center">
                <v-col cols="12" sm="4" md="3">
                  <v-text-field
                    v-model="fechaDesde"
                    label="Desde"
                    type="date"
                    density="compact"
                    variant="outlined"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="4" md="3">
                  <v-text-field
                    v-model="fechaHasta"
                    label="Hasta"
                    type="date"
                    density="compact"
                    variant="outlined"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="8" md="4">
                  <v-select
                    v-model="tiposDescuentoSeleccionados"
                    :items="tiposDescuentoDisponibles"
                    label="Tipo de descuento"
                    multiple
                    chips
                    closable-chips
                    density="compact"
                    variant="outlined"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" sm="4" md="2">
                  <v-btn variant="tonal" prepend-icon="mdi-filter-off" @click="limpiarFiltros" block>
                    Limpiar filtro
                  </v-btn>
                </v-col>
              </v-row>

              <v-row class="mb-4" dense>
                <v-col cols="12" class="d-flex flex-wrap" style="gap:8px">
                  <v-btn size="small" variant="outlined" @click="aplicarRangoHoy">Hoy</v-btn>
                  <v-btn size="small" variant="outlined" @click="aplicarRangoQuincena">Quincena</v-btn>
                  <v-btn size="small" variant="outlined" @click="aplicarRangoMesCompleto">Mes completo</v-btn>
                </v-col>
              </v-row>

              <v-row v-if="ingresoRealDateo" class="mb-4" dense>
                <v-col cols="12" sm="4">
                  <v-card variant="tonal" class="rounded-xl">
                    <v-card-text>
                      <div class="text-caption">Nuevo Directo</div>
                      <div class="text-h6">{{ formatMoney(acumuladoFiltrado.nuevo_directo.ingreso_real) }}</div>
                      <div class="text-caption">{{ acumuladoFiltrado.nuevo_directo.cantidad }} dateos</div>
                      <v-divider class="my-1" />
                      <div class="text-caption text-medium-emphasis">Comisión Asesor</div>
                      <div class="text-subtitle-1 font-weight-medium">{{ formatMoney(acumuladoFiltrado.nuevo_directo.comision_asesor_total) }}</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-card variant="tonal" class="rounded-xl">
                    <v-card-text>
                      <div class="text-caption">Convenio</div>
                      <div class="text-h6">{{ formatMoney(acumuladoFiltrado.convenio.ingreso_real) }}</div>
                      <div class="text-caption">{{ acumuladoFiltrado.convenio.cantidad }} dateos</div>
                      <v-divider class="my-1" />
                      <div class="text-caption text-medium-emphasis">Comisión Asesor</div>
                      <div class="text-subtitle-1 font-weight-medium">{{ formatMoney(acumuladoFiltrado.convenio.comision_asesor_total) }}</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-card variant="tonal" class="rounded-xl">
                    <v-card-text>
                      <div class="text-caption">Total General</div>
                      <div class="text-h6">{{ formatMoney(acumuladoFiltrado.total.ingreso_real) }}</div>
                      <div class="text-caption">{{ acumuladoFiltrado.total.cantidad }} dateos</div>
                      <v-divider class="my-1" />
                      <div class="text-caption text-medium-emphasis">Comisión Asesor</div>
                      <div class="text-subtitle-1 font-weight-medium">{{ formatMoney(acumuladoFiltrado.total.comision_asesor_total) }}</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-row v-if="resumenDescuentosFiltrado.total.cantidad" class="mb-4" dense>
                <v-col cols="12">
                  <v-card variant="tonal" class="rounded-xl">
                    <v-card-title class="text-subtitle-2 pb-0">Descuentos aplicados por tipo</v-card-title>
                    <v-card-text>
                      <v-table density="compact">
                        <thead>
                          <tr>
                            <th>Tipo de descuento</th>
                            <th class="text-right">Dateos</th>
                            <th class="text-right">Monto total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="d in resumenDescuentosFiltrado.por_tipo"
                            :key="d.descuento_nombre"
                          >
                            <td>{{ d.descuento_nombre }}</td>
                            <td class="text-right">
                              <v-btn
                                variant="text"
                                size="small"
                                density="compact"
                                class="pa-0"
                                style="min-width:0"
                                @click="abrirDetalleTipoDescuento(d.descuento_nombre)"
                              >
                                {{ d.cantidad }}
                              </v-btn>
                            </td>
                            <td class="text-right">{{ formatMoney(d.monto_total) }}</td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr class="font-weight-bold">
                            <td>Total</td>
                            <td class="text-right">{{ resumenDescuentosFiltrado.total.cantidad }}</td>
                            <td class="text-right">{{ formatMoney(resumenDescuentosFiltrado.total.monto_total) }}</td>
                          </tr>
                        </tfoot>
                      </v-table>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-data-table
                class="tabla-zebra"
                :headers="headersIngresoRealDateo"
                :items="filasIngresoRealDateo"
                :loading="loadingIngresoRealDateo"
                item-key="dateo_id"
                hover
                hide-default-footer
                :items-per-page="-1"
              >
                <template #item.fecha="{ item }">{{ formatFechaCorta(item.fecha) }}</template>
                <template #item.tipo_captacion="{ item }">
                  <v-chip
                    size="small"
                    :color="item.tipo_captacion === 'CONVENIO' ? COLORS.convenio : COLORS.comercial"
                    variant="tonal"
                  >
                    {{ item.tipo_captacion === 'CONVENIO' ? 'Convenio' : 'Nuevo Directo' }}
                  </v-chip>
                </template>
                <template #item.tipo_vehiculo="{ item }">
                  {{ item.tipo_vehiculo === 'CARRO' ? 'Carro' : item.tipo_vehiculo === 'MOTO' ? 'Moto' : '—' }}
                </template>
                <template #item.ingreso_real="{ item }">
                  <span class="text-secondary">{{ formatMoney(item.ingreso_real) }}</span>
                </template>
                <template #item.comision_asesor="{ item }">{{ formatMoney(item.comision_asesor) }}</template>
                <template #item.descuento="{ item }">
                  <v-chip v-if="item.tuvo_descuento" size="small" color="amber-darken-2" variant="tonal">
                    Sí: {{ item.descuento_nombre ?? 'Descuento' }} -{{ formatMoney(item.descuento_monto) }}
                  </v-chip>
                  <v-chip v-else size="small" color="grey" variant="tonal">No</v-chip>
                </template>
                <template #item.acumulado="{ item }">{{ formatMoney(item.acumulado) }}</template>
              </v-data-table>

              <v-alert
                v-if="!loadingIngresoRealDateo && !detalleFiltrado.length"
                type="info" variant="tonal" class="mt-4"
              >
                Sin dateos exitosos con factura confirmada para el rango de fechas seleccionado.
              </v-alert>
            </template>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialogDetalleDescuento.open" max-width="900">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between flex-wrap" style="gap:8px">
          <div class="d-flex align-center flex-wrap" style="gap:10px">
            <v-icon>mdi-format-list-bulleted</v-icon>
            <span>Detalle — {{ dialogDetalleDescuento.titulo }}</span>
          </div>
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="dialogDetalleDescuento.open = false" />
        </v-card-title>

        <v-card-subtitle class="pb-2">
          {{ detalleDialogDescuento.length }} dateos — {{ formatMoney(totalDialogDescuento) }} total descuento
        </v-card-subtitle>

        <v-divider />

        <v-card-text>
          <v-data-table
            :headers="headersDialogDescuento"
            :items="detalleDialogDescuento"
            item-key="dateo_id"
            hover
            density="compact"
            hide-default-footer
            :items-per-page="-1"
          >
            <template #item.fecha="{ item }">{{ formatFechaCorta(item.fecha) }}</template>
            <template #item.placa="{ item }">{{ item.placa ?? '—' }}</template>
            <template #item.tipo_captacion="{ item }">
              {{ item.tipo_captacion === 'CONVENIO' ? 'Convenio' : 'Nuevo Directo' }}
            </template>
            <template #item.descuento_monto="{ item }">{{ formatMoney(item.descuento_monto) }}</template>
            <template #item.ingreso_real="{ item }">{{ formatMoney(item.ingreso_real) }}</template>
          </v-data-table>

          <v-alert v-if="!detalleDialogDescuento.length" type="info" variant="tonal" class="mt-4">
            No hay dateos para este tipo de descuento en el rango filtrado.
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogDetalleDescuento.open = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  getMetaComercialResumen,
  getMetaComercialDiario,
  getMetaComercialSemanal,
  getMetaComercialProyectado,
  getMetaComercialDetalleVehiculo,
  getMetaComercialIngresoRealDateo,
  type MetaComercialResumenResponse,
  type MetaComercialDiarioResponse,
  type MetaComercialSemanalResponse,
  type MetaComercialProyectadoResponse,
  type MetaComercialDetalleVehiculoResponse,
  type MetaComercialIngresoRealDateoResponse,
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
const detalleVehiculo = ref<MetaComercialDetalleVehiculoResponse | null>(null)
const ingresoRealDateo = ref<MetaComercialIngresoRealDateoResponse | null>(null)
const loadingIngresoRealDateo = ref(false)
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
const textoNarrativoDateos = computed(() => {
  const d = ingresoRealDateo.value
  if (!d) return ''
  return `Ingreso real de caja (facturación confirmada) por cada dateo exitoso de ${d.asesor_nombre} en ${etiquetaMes(mesSeleccionado.value)} ${anioSeleccionado.value}.`
})

/* ===== Filtro de fechas (Detalle de Dateos) — filtra en memoria, sin pedir nada al backend ===== */
function primerDiaMes(mes: number, anio: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-01`
}
function ultimoDiaMes(mes: number, anio: number): string {
  const ultimoDia = new Date(anio, mes, 0).getDate()
  return `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
}

const fechaDesde = ref(primerDiaMes(mesSeleccionado.value, anioSeleccionado.value))
const fechaHasta = ref(ultimoDiaMes(mesSeleccionado.value, anioSeleccionado.value))
const tiposDescuentoSeleccionados = ref<string[]>([])

function limpiarFiltros() {
  fechaDesde.value = primerDiaMes(mesSeleccionado.value, anioSeleccionado.value)
  fechaHasta.value = ultimoDiaMes(mesSeleccionado.value, anioSeleccionado.value)
  tiposDescuentoSeleccionados.value = []
}

function hoyISO(): string {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
}

function aplicarRangoHoy() {
  const hoy = hoyISO()
  fechaDesde.value = hoy
  fechaHasta.value = hoy
}

function aplicarRangoQuincena() {
  const dia = new Date().getDate()
  const mes = mesSeleccionado.value
  const anio = anioSeleccionado.value
  if (dia <= 15) {
    fechaDesde.value = `${anio}-${String(mes).padStart(2, '0')}-01`
    fechaHasta.value = `${anio}-${String(mes).padStart(2, '0')}-15`
  } else {
    fechaDesde.value = `${anio}-${String(mes).padStart(2, '0')}-16`
    fechaHasta.value = ultimoDiaMes(mes, anio)
  }
}

function aplicarRangoMesCompleto() {
  fechaDesde.value = primerDiaMes(mesSeleccionado.value, anioSeleccionado.value)
  fechaHasta.value = ultimoDiaMes(mesSeleccionado.value, anioSeleccionado.value)
}

// Filtro solo por fecha — base para las opciones del v-select de tipo de descuento
const detalleFiltradoPorFecha = computed(() => {
  const detalle = ingresoRealDateo.value?.detalle ?? []
  return detalle.filter((d) => {
    if (fechaDesde.value && d.fecha < fechaDesde.value) return false
    if (fechaHasta.value && d.fecha > fechaHasta.value) return false
    return true
  })
})

const tiposDescuentoDisponibles = computed(() => {
  const nombres = new Set<string>()
  for (const d of detalleFiltradoPorFecha.value) {
    if (d.descuento_nombre) nombres.add(d.descuento_nombre)
  }
  return Array.from(nombres).sort()
})

// Filtro final (fecha + tipo de descuento) — usado por tarjetas, tabla de descuentos,
// tabla principal, acumulado corrido y el modal de drill-down
const detalleFiltrado = computed(() => {
  if (!tiposDescuentoSeleccionados.value.length) return detalleFiltradoPorFecha.value
  return detalleFiltradoPorFecha.value.filter(
    (d) => d.descuento_nombre !== null && tiposDescuentoSeleccionados.value.includes(d.descuento_nombre)
  )
})

const acumuladoFiltrado = computed(() => {
  const acumulado = {
    nuevo_directo: { cantidad: 0, ingreso_real: 0, comision_asesor_total: 0 },
    convenio: { cantidad: 0, ingreso_real: 0, comision_asesor_total: 0 },
    total: { cantidad: 0, ingreso_real: 0, comision_asesor_total: 0 },
  }
  for (const fila of detalleFiltrado.value) {
    const bucket = fila.tipo_captacion === 'CONVENIO' ? acumulado.convenio : acumulado.nuevo_directo
    bucket.cantidad += 1
    bucket.ingreso_real += fila.ingreso_real
    acumulado.total.cantidad += 1
    acumulado.total.ingreso_real += fila.ingreso_real

    // Comisiones ANULADAS no se le pagan al asesor: se excluyen del acumulado.
    if (fila.comision_asesor !== null && !fila.comision_anulada) {
      bucket.comision_asesor_total += fila.comision_asesor
      acumulado.total.comision_asesor_total += fila.comision_asesor
    }
  }
  return acumulado
})

const resumenDescuentosFiltrado = computed(() => {
  const porNombre = new Map<string, { cantidad: number; monto_total: number }>()
  for (const fila of detalleFiltrado.value) {
    if (!fila.tuvo_descuento) continue
    const nombre = fila.descuento_nombre ?? 'Sin nombre'
    const actual = porNombre.get(nombre) ?? { cantidad: 0, monto_total: 0 }
    actual.cantidad += 1
    actual.monto_total += fila.descuento_monto
    porNombre.set(nombre, actual)
  }
  const porTipo = Array.from(porNombre.entries())
    .map(([descuento_nombre, v]) => ({
      descuento_nombre,
      cantidad: v.cantidad,
      monto_total: Math.round(v.monto_total * 100) / 100,
    }))
    .sort((a, b) => b.monto_total - a.monto_total)
  const total = porTipo.reduce(
    (acc, r) => {
      acc.cantidad += r.cantidad
      acc.monto_total += r.monto_total
      return acc
    },
    { cantidad: 0, monto_total: 0 }
  )
  return { por_tipo: porTipo, total }
})

/* ===== Drill-down: detalle de dateos de un tipo de descuento puntual ===== */
const headersDialogDescuento = [
  { title: 'Fecha', key: 'fecha' },
  { title: 'Turno/Placa', key: 'placa' },
  { title: 'Tipo Captación', key: 'tipo_captacion' },
  { title: 'Monto Descuento', key: 'descuento_monto' },
  { title: 'Total Factura', key: 'ingreso_real' },
]

const dialogDetalleDescuento = reactive({ open: false, titulo: '' })

function abrirDetalleTipoDescuento(nombre: string) {
  dialogDetalleDescuento.titulo = nombre
  dialogDetalleDescuento.open = true
}

const detalleDialogDescuento = computed(() => {
  if (!dialogDetalleDescuento.open) return []
  return detalleFiltrado.value.filter(
    (d) => (d.descuento_nombre ?? 'Sin nombre') === dialogDetalleDescuento.titulo
  )
})

const totalDialogDescuento = computed(() =>
  detalleDialogDescuento.value.reduce((acc, d) => acc + d.descuento_monto, 0)
)

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
  { title: 'Total', key: 'cantidad_total' },
  { title: 'Motos', key: 'cantidad_motos' },
  { title: 'Carros', key: 'cantidad_carros' },
  { title: '$ Convenio', key: 'pesos_convenio' },
  { title: '$ Propio', key: 'pesos_comercial' },
  { title: '$ Total', key: 'pesos_total' },
  { title: 'Acumulado', key: 'acumulado_total' },
  { title: '% vs Meta', key: 'pct_vs_meta' },
]
const headersSemanal = [
  { title: 'Semana', key: 'semana', sortable: false },
  { title: 'Total', key: 'cantidad_total' },
  { title: 'Motos', key: 'cantidad_motos' },
  { title: 'Carros', key: 'cantidad_carros' },
  { title: '$ Convenio', key: 'pesos_convenio' },
  { title: '$ Propio', key: 'pesos_comercial' },
  { title: '$ Total semana', key: 'pesos_total' },
  { title: '% semana vs Meta', key: 'pct_vs_meta' },
  { title: 'Acumulado mes', key: 'acumulado_total' },
  { title: '% Acumulado vs Meta', key: 'pct_acumulado_vs_meta' },
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
const headersIngresoRealDateo = [
  { title: 'Fecha', key: 'fecha' },
  { title: 'Tipo Captación', key: 'tipo_captacion' },
  { title: 'Vehículo', key: 'tipo_vehiculo' },
  { title: 'Ingreso Real', key: 'ingreso_real' },
  { title: 'Comisión Asesor', key: 'comision_asesor' },
  { title: 'Descuento', key: 'descuento', sortable: false },
  { title: 'Acumulado', key: 'acumulado' },
]

/* ===== Tab Meta — Detalle por tipo de vehículo ===== */
const headersDetalleVehiculo = [
  { title: 'Categoría', key: 'categoria', sortable: false },
  { title: 'Cantidad', key: 'cantidad' },
  { title: 'Tarifa', key: 'tarifa' },
  { title: 'Pesos', key: 'pesos' },
]
const filasDetalleVehiculo = computed(() => {
  const d = detalleVehiculo.value
  if (!d?.disponible || !d.categorias || !d.total) return []
  return [
    ...d.categorias.map((c) => ({ ...c, esTotal: false })),
    { categoria: 'Total', cantidad: d.total.cantidad, tarifa: null, pesos: d.total.pesos, esTotal: true },
    { categoria: 'Meta del mes', cantidad: null, tarifa: null, pesos: d.meta_pesos, esTotal: true },
  ]
})

/* ===== Tab Detalle de Dateos ===== */
const filasIngresoRealDateo = computed(() => {
  let acumulado = 0
  return detalleFiltrado.value.map((d) => {
    acumulado += d.ingreso_real
    return { ...d, acumulado }
  })
})

/* ===== Carga de datos ===== */
async function cargarIngresoRealDateo() {
  if (asesorSeleccionado.value === null) return
  loadingIngresoRealDateo.value = true
  try {
    ingresoRealDateo.value = await getMetaComercialIngresoRealDateo(
      mesSeleccionado.value,
      anioSeleccionado.value,
      asesorSeleccionado.value
    )
    limpiarFiltros()
  } catch (err) {
    console.error('Error cargando detalle de dateos:', err)
    snack.text = '❌ Error al cargar el detalle de dateos'
    snack.show = true
  } finally {
    loadingIngresoRealDateo.value = false
  }
}

// Solo se pide al entrar a la pestaña con un asesor puntual ya elegido —
// evita sumar una petición en cada cargarTodo() si nadie la está viendo.
watch(tab, (nuevo) => {
  if (nuevo === 'dateos' && asesorSeleccionado.value !== null) cargarIngresoRealDateo()
})
watch(asesorSeleccionado, (nuevo) => {
  if (nuevo === null) ingresoRealDateo.value = null
})

async function cargarTodo() {
  loading.value = true
  detalleVehiculo.value = null
  try {
    const [resumenResp, diarioResp, semanalResp, proyectadoResp, detalleVehiculoResp] = await Promise.all([
      getMetaComercialResumen(mesSeleccionado.value, anioSeleccionado.value),
      getMetaComercialDiario(mesSeleccionado.value, anioSeleccionado.value, asesorSeleccionado.value),
      getMetaComercialSemanal(mesSeleccionado.value, anioSeleccionado.value, asesorSeleccionado.value),
      getMetaComercialProyectado(mesSeleccionado.value, anioSeleccionado.value, asesorSeleccionado.value),
      asesorSeleccionado.value !== null
        ? getMetaComercialDetalleVehiculo(mesSeleccionado.value, anioSeleccionado.value, asesorSeleccionado.value)
        : Promise.resolve(null),
    ])

    resumenGeneral.value = resumenResp
    diario.value = diarioResp
    semanal.value = semanalResp
    proyectado.value = proyectadoResp
    detalleVehiculo.value = detalleVehiculoResp
    fuenteDatos.value = resumenResp.fuente

    if (tab.value === 'dateos' && asesorSeleccionado.value !== null) {
      await cargarIngresoRealDateo()
    }
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
