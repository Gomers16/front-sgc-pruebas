<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">

      <!-- ── CABECERA ─────────────────────────────────────────── -->
      <v-card-title class="py-4 px-4 px-sm-6 d-flex align-center justify-space-between flex-wrap gap-2">
        <div class="text-h5 font-weight-bold d-flex align-center gap-2">
          💸 Comisiones
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <v-btn
            color="success"
            size="small"
            prepend-icon="mdi-plus"
            @click="abrirCrear"
          >
            Nueva comisión
          </v-btn>
          <v-btn
            variant="outlined"
            size="small"
            prepend-icon="mdi-filter-variant"
            @click="showFilters = !showFilters"
          >
            Filtros
            <v-badge v-if="activeFiltersCount > 0" :content="activeFiltersCount" color="primary" inline />
          </v-btn>
          <v-btn variant="text" size="small" :disabled="loading || metaLoading" @click="resetFilters">
            Limpiar
          </v-btn>
          <v-btn color="primary" size="small" :loading="loading || metaLoading" @click="reload" prepend-icon="mdi-refresh">
            <span class="d-none d-sm-inline">Actualizar</span>
          </v-btn>
        </div>
      </v-card-title>

      <!-- ── PANEL DE FILTROS (colapsable) ─────────────────────── -->
      <v-expand-transition>
        <div v-show="showFilters">
          <v-divider />
          <v-card-text class="pt-4 pb-2 px-4 px-sm-6">
            <v-row dense>
              <!-- Desde -->
              <v-col cols="6" sm="6" md="2" lg="2">
                <v-text-field
                  v-model="filters.desde"
                  label="Desde"
                  type="date"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                />
              </v-col>

              <!-- Hasta -->
              <v-col cols="6" sm="6" md="2" lg="2">
                <v-text-field
                  v-model="filters.hasta"
                  label="Hasta"
                  type="date"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                />
              </v-col>

              <!-- Estado -->
              <v-col cols="6" sm="6" md="3" lg="2">
                <v-select
                  v-model="filters.estado"
                  :items="estadoItems"
                  item-title="label"
                  item-value="value"
                  label="Estado"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  clearable
                />
              </v-col>

              <!-- Tipo Vehículo -->
              <v-col cols="6" sm="6" md="3" lg="2">
                <v-select
                  v-model="filters.tipoVehiculo"
                  :items="tipoVehiculoItems"
                  item-title="label"
                  item-value="value"
                  label="Tipo vehículo"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  clearable
                />
              </v-col>

              <!-- Descuento -->
              <v-col cols="12" sm="6" md="3" lg="2">
                <v-autocomplete
                  v-model="filters.descuentoCodigo"
                  :items="descuentosItems"
                  item-title="label"
                  item-value="codigo"
                  label="Descuento"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  clearable
                  :loading="descuentosLoading"
                  prepend-inner-icon="mdi-tag"
                  placeholder="Todos los descuentos"
                />
              </v-col>

              <!-- Placa -->
<v-col cols="6" sm="4" md="2">
  <v-text-field
    v-model="filters.placa"
    label="Placa"
    variant="outlined"
    density="comfortable"
    hide-details
    clearable
    prepend-inner-icon="mdi-car"
  />
</v-col>

<!-- Chips tipo asesor -->
<v-col cols="12" md="10">
  <div class="d-flex align-center gap-1 mb-2" style="flex-wrap:wrap">
    <v-chip
      v-for="opt in [
        { title: 'TODOS', value: '' },
        { title: 'ASESOR COMERCIAL', value: 'ASESOR_COMERCIAL' },
        { title: 'ASESOR CONVENIO', value: 'ASESOR_CONVENIO' },
        { title: 'CONVENIO', value: 'CONVENIO' },
      ]"
      :key="opt.value"
      :color="filters.tipoAsesor === opt.value ? 'primary' : undefined"
      :variant="filters.tipoAsesor === opt.value ? 'flat' : 'outlined'"
      size="small"
      class="font-weight-600"
      style="cursor:pointer"
      @click="filters.tipoAsesor = opt.value as typeof filters.tipoAsesor; filters.asesorId = null; filters.convenioId = null; onCambiarTabTipo()"
    >
      {{ opt.title }}
    </v-chip>
  </div>

  <v-row dense>
    <!-- Autocomplete asesor -->
    <v-col cols="12" :md="filters.tipoAsesor === 'ASESOR_COMERCIAL' ? 6 : 12" v-if="filters.tipoAsesor !== 'CONVENIO'">
      <v-autocomplete
        v-model="filters.asesorId"
        :items="agentesVisiblesFiltro"
        item-title="nombre"
        item-value="id"
        :label="filters.tipoAsesor === 'ASESOR_COMERCIAL' ? 'Buscar comercial…' : filters.tipoAsesor === 'ASESOR_CONVENIO' ? 'Buscar asesor convenio…' : 'Buscar asesor…'"
        density="comfortable"
        variant="outlined"
        hide-details
        clearable
        :loading="asesoresLoading"
        :prepend-inner-icon="filters.tipoAsesor === 'ASESOR_CONVENIO' ? 'mdi-handshake' : 'mdi-account-tie'"
        auto-select-first
        @update:model-value="onFiltroAsesorChange"
      />
    </v-col>

    <!-- Convenios asignados al comercial seleccionado -->
    <v-col cols="12" md="6" v-if="filters.tipoAsesor === 'ASESOR_COMERCIAL'">
      <v-autocomplete
        v-model="filters.convenioId"
        :items="conveniosFiltroComercial"
        item-title="nombre"
        item-value="id"
        label="Convenio del comercial"
        density="comfortable"
        variant="outlined"
        hide-details
        clearable
        :loading="conveniosFiltroLoading"
        prepend-inner-icon="mdi-handshake"
        :disabled="!filters.asesorId"
        :placeholder="!filters.asesorId ? 'Selecciona primero un comercial' : 'Todos sus convenios'"
      />
    </v-col>
  </v-row>
</v-col>
            </v-row>

            <div class="d-flex justify-end mt-3 gap-2">
              <v-btn size="small" variant="text" @click="resetFilters">Limpiar filtros</v-btn>
              <v-btn color="primary" size="small" :loading="loading" @click="applyFilters">
                Aplicar
              </v-btn>
            </div>
          </v-card-text>
        </div>
      </v-expand-transition>

      <!-- ── PESTAÑAS ──────────────────────────────────────────── -->
      <v-tabs v-model="activeTab" density="comfortable" class="px-4 mt-1">
        <v-tab value="detalle">Detalle comisiones</v-tab>
        <v-tab value="metas">Metas mensuales</v-tab>
      </v-tabs>

      <v-divider />

      <!-- ====== TAB DETALLE ====================================== -->
      <template v-if="activeTab === 'detalle'">

        <!-- Resumen KPI: tipo de captación y estado (mismo patrón visual que ReporteComisiones.vue) -->
        <v-card-text class="pt-4 pb-2 px-6">
          <div class="text-caption text-medium-emphasis mb-2">Por tipo de captación</div>
          <v-row dense class="mb-4">
            <v-col cols="12" sm="4">
              <v-card
                elevation="4"
                class="rounded-xl kpi-card kpi-clickable"
                :class="{ 'kpi-active': filters.tipoCaptacion === 'NUEVO_DIRECTO' }"
                color="primary"
                :variant="filters.tipoCaptacion === 'NUEVO_DIRECTO' ? 'flat' : 'tonal'"
                @click="filtrarPorTipoCaptacion('NUEVO_DIRECTO')"
              >
                <v-card-text class="text-center position-relative">
                  <v-icon v-if="filters.tipoCaptacion === 'NUEVO_DIRECTO'" size="18" class="kpi-active-check">mdi-check-circle</v-icon>
                  <div class="text-overline font-weight-bold">Nuevo Directo</div>
                  <div class="text-h5 font-weight-bold">{{ resumenPorTipo.nuevo_directo.cantidad }}</div>
                  <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenPorTipo.nuevo_directo.monto) }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" sm="4">
              <v-card
                elevation="4"
                class="rounded-xl kpi-card kpi-clickable"
                :class="{ 'kpi-active': filters.tipoCaptacion === 'CONVENIO' }"
                color="deep-purple"
                :variant="filters.tipoCaptacion === 'CONVENIO' ? 'flat' : 'tonal'"
                @click="filtrarPorTipoCaptacion('CONVENIO')"
              >
                <v-card-text class="text-center position-relative">
                  <v-icon v-if="filters.tipoCaptacion === 'CONVENIO'" size="18" class="kpi-active-check">mdi-check-circle</v-icon>
                  <div class="text-overline font-weight-bold">Convenio</div>
                  <div class="text-h5 font-weight-bold">{{ resumenPorTipo.convenio.cantidad }}</div>
                  <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenPorTipo.convenio.monto) }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" sm="4">
              <v-card elevation="4" class="rounded-xl kpi-card" color="grey-darken-1" variant="tonal">
                <v-card-text class="text-center">
                  <div class="text-overline font-weight-bold">Total General</div>
                  <div class="text-h5 font-weight-bold">{{ resumenPorTipo.total.cantidad }}</div>
                  <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenPorTipo.total.monto) }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-row v-if="resumenPorDescuentos.total.cantidad" dense class="mb-4">
            <v-col cols="12">
              <v-card variant="tonal" class="rounded-xl">
                <v-card-title class="text-subtitle-2 pb-0">Descuentos aplicados por tipo</v-card-title>
                <v-card-text>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>Tipo de descuento</th>
                        <th class="text-right">Cantidad</th>
                        <th class="text-right">Monto total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="d in resumenPorDescuentos.por_tipo" :key="d.descuento_id">
                        <td>{{ d.nombre }}</td>
                        <td class="text-right">{{ d.cantidad }}</td>
                        <td class="text-right">{{ formatCOP(d.monto) }}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr class="font-weight-bold">
                        <td>Total</td>
                        <td class="text-right">{{ resumenPorDescuentos.total.cantidad }}</td>
                        <td class="text-right">{{ formatCOP(resumenPorDescuentos.total.monto) }}</td>
                      </tr>
                    </tfoot>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div class="text-caption text-medium-emphasis mb-2">Por estado</div>

          <v-card elevation="6" class="rounded-xl kpi-card mb-4" color="teal-darken-1" variant="tonal">
            <v-card-text class="text-center">
              <div class="text-overline font-weight-bold">Total generado en el período (sin anular)</div>
              <div class="text-h4 font-weight-bold">{{ formatCOP(totalGeneradoSinAnuladas.monto) }}</div>
              <div class="text-subtitle-2 font-weight-medium mt-1">
                {{ totalGeneradoSinAnuladas.cantidad }} comisiones (pendiente + aprobada + pagada)
              </div>
            </v-card-text>
          </v-card>

          <v-row dense>
            <v-col cols="12" sm="6" md="3">
              <v-card elevation="4" class="rounded-xl kpi-card kpi-clickable" color="warning" variant="tonal" @click="filtrarPorEstadoComision('PENDIENTE')">
                <v-card-text class="text-center">
                  <v-icon size="28" color="warning" class="mb-1">mdi-clock-outline</v-icon>
                  <div class="text-overline font-weight-bold">Pendiente</div>
                  <div class="text-h5 font-weight-bold">{{ resumenPorEstadoComisiones.PENDIENTE.cantidad }}</div>
                  <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenPorEstadoComisiones.PENDIENTE.monto) }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card elevation="4" class="rounded-xl kpi-card kpi-clickable" color="info" variant="tonal" @click="filtrarPorEstadoComision('APROBADA')">
                <v-card-text class="text-center">
                  <v-icon size="28" color="info" class="mb-1">mdi-check-circle-outline</v-icon>
                  <div class="text-overline font-weight-bold">Aprobada</div>
                  <div class="text-h5 font-weight-bold">{{ resumenPorEstadoComisiones.APROBADA.cantidad }}</div>
                  <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenPorEstadoComisiones.APROBADA.monto) }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card elevation="4" class="rounded-xl kpi-card kpi-clickable" color="success" variant="tonal" @click="filtrarPorEstadoComision('PAGADA')">
                <v-card-text class="text-center">
                  <v-icon size="28" color="success" class="mb-1">mdi-cash-check</v-icon>
                  <div class="text-overline font-weight-bold">Pagada</div>
                  <div class="text-h5 font-weight-bold">{{ resumenPorEstadoComisiones.PAGADA.cantidad }}</div>
                  <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenPorEstadoComisiones.PAGADA.monto) }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-card elevation="4" class="rounded-xl kpi-card kpi-clickable" color="error" variant="tonal" @click="filtrarPorEstadoComision('ANULADA')">
                <v-card-text class="text-center">
                  <v-icon size="28" color="error" class="mb-1">mdi-close-circle-outline</v-icon>
                  <div class="text-overline font-weight-bold">Anulada</div>
                  <div class="text-h5 font-weight-bold">{{ resumenPorEstadoComisiones.ANULADA.cantidad }}</div>
                  <div class="text-subtitle-2 font-weight-medium mt-1">{{ formatCOP(resumenPorEstadoComisiones.ANULADA.monto) }}</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <!-- Tabs de tipo (no TODOS): lista expandible por asesor/convenio -->
        <template v-if="filters.tipoAsesor">
          <v-card-text class="pt-4 pb-2 px-6">
            <div v-if="resumenPorAsesorLoading" class="text-center py-6">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <v-alert v-else-if="!asesoresAgrupados.length" type="info" variant="tonal">
              No hay comisiones pendientes o aprobadas para este filtro.
            </v-alert>
            <v-expansion-panels v-else v-model="panelAbierto" variant="accordion">
              <v-expansion-panel
                v-for="item in asesoresAgrupados"
                :key="panelKey(item)"
                :value="panelKey(item)"
              >
                <v-expansion-panel-title>
                  <div class="d-flex flex-column" style="width:100%">
                    <div class="d-flex align-center gap-2">
                      <v-icon size="20">mdi-account-circle</v-icon>
                      <span class="font-weight-bold">{{ nombreItem(item) }}</span>
                    </div>
                    <div class="text-caption text-medium-emphasis mt-1">
                      <span v-if="item.pendientes > 0">{{ item.pendientes }} pendientes ({{ formatCOP(item.total_pendiente) }})</span>
                      <span v-if="item.pendientes > 0 && item.aprobadas > 0"> · </span>
                      <span v-if="item.aprobadas > 0">{{ item.aprobadas }} aprobadas ({{ formatCOP(item.total_aprobada) }})</span>
                    </div>
                  </div>
                  <template #actions>
                    <div class="d-flex align-center gap-3" @click.stop>
                      <span class="text-body-2 font-weight-bold">Por pagar: {{ formatCOP(item.total_por_pagar) }}</span>
                      <v-btn
                        size="small"
                        color="success"
                        variant="elevated"
                        prepend-icon="mdi-cash-multiple"
                        :disabled="panelAbierto === panelKey(item) && panelDetalle.truncado"
                        @click="pagarTodasDelPanel(item)"
                      >
                        Pagar todas
                      </v-btn>
                    </div>
                  </template>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                  <div v-if="panelDetalle.loading" class="text-center py-4">
                    <v-progress-circular indeterminate color="primary" size="24" />
                  </div>
                  <template v-else>
                    <v-expand-transition>
                      <div v-if="panelSeleccionIds.length > 0" class="mb-3">
                        <v-card variant="tonal" color="primary" class="rounded-lg px-4 py-2">
                          <div class="d-flex align-center flex-wrap gap-3">
                            <span class="font-weight-medium">
                              {{ panelSeleccionIds.length }} seleccionadas — {{ formatCOP(panelSeleccionTotal) }}
                            </span>
                            <v-spacer />
                            <v-btn v-if="panelPuedeAprobar" size="small" color="info" variant="elevated" @click="panelConfirmarAprobar(item)">
                              Aprobar
                            </v-btn>
                            <v-btn v-if="panelPuedePagar" size="small" color="success" variant="elevated" @click="panelConfirmarPagar(item)">
                              Pagar
                            </v-btn>
                            <v-btn size="small" variant="text" icon="mdi-close" @click="panelSeleccionIds = []" />
                          </div>
                        </v-card>
                      </div>
                    </v-expand-transition>

                    <v-alert
                      v-if="panelDetalle.truncado"
                      type="warning"
                      variant="tonal"
                      density="compact"
                      class="mb-3"
                    >
                      Se muestran las primeras {{ panelDetalle.rows.length }} comisiones de {{ panelDetalle.totalReal }} totales —
                      usa filtros más específicos (fechas, estado) para ver el resto. "Pagar todas" está bloqueado mientras esto ocurra.
                    </v-alert>

                    <v-data-table
                      :headers="headersPanel"
                      :items="panelDetalle.rows"
                      item-key="id"
                      item-selectable="_selectable"
                      v-model="panelSeleccionIds"
                      show-select
                      return-object
                      density="compact"
                    >
                      <template #item.estado="{ item: fila }">
                        <v-chip size="small" :color="estadoColor(fila.estado)" variant="flat">{{ fila.estado }}</v-chip>
                      </template>
                      <template #item.placa="{ item: fila }">{{ fila.turno?.placa ?? '—' }}</template>
                      <template #item.tipo_vehiculo="{ item: fila }">{{ fila.tipo_vehiculo ?? '—' }}</template>
                      <template #item.tipo_cliente="{ item: fila }">
                        <v-chip size="x-small" :color="tipoClienteColor(fila.turno)" variant="tonal">
                          {{ tipoClienteLabel(fila.turno) }}
                        </v-chip>
                      </template>
                      <template #item.convenio="{ item: fila }">{{ fila.convenio?.nombre ?? '—' }}</template>
                      <template #item.monto="{ item: fila }">{{ formatCOP(calcTotalItem(fila)) }}</template>
                      <template #item.generado_at="{ item: fila }">{{ formatDate(fila.generado_at) }}</template>
                    </v-data-table>

                    <v-alert v-if="!panelDetalle.rows.length" type="info" variant="tonal" density="compact" class="mt-3">
                      Este asesor no tiene comisiones registradas.
                    </v-alert>
                  </template>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </template>

        <!-- Tab TODOS: comportamiento original sin cambios -->
        <template v-else>
          <!-- Resumen de página -->
          <v-card-text class="pt-4 pb-2 px-6">
            <div class="d-flex flex-wrap gap-3 align-center">
              <v-chip variant="tonal" size="large">
                Total página: <strong class="ms-1">{{ formatCOP(totalPagina) }}</strong>
              </v-chip>
              <v-chip v-if="pendientesPagina > 0" variant="tonal" size="large" color="warning">
                Pendientes: <strong class="ms-1">{{ pendientesPagina }}</strong>
              </v-chip>
              <v-chip v-if="pagadasPagina > 0" variant="tonal" size="large" color="success">
                Pagadas: <strong class="ms-1">{{ pagadasPagina }}</strong>
              </v-chip>
              <v-chip v-if="filters.descuentoCodigo" variant="outlined" size="small" color="orange">
                <v-icon start size="12">mdi-tag</v-icon>
                Descuento: {{ filters.descuentoCodigo }}
              </v-chip>
            </div>
          </v-card-text>

          <!-- ── BARRA DE ACCIONES BULK ── -->
          <v-expand-transition>
            <div v-if="selectedIds.length > 0" class="px-6 pb-3">
              <v-card variant="tonal" color="primary" class="rounded-lg px-4 py-3">
                <div class="d-flex align-center flex-wrap gap-3">
                  <v-icon color="primary">mdi-checkbox-multiple-marked</v-icon>
                  <span class="font-weight-medium">
                    {{ selectedIds.length }} comisión{{ selectedIds.length !== 1 ? 'es' : '' }} seleccionada{{ selectedIds.length !== 1 ? 's' : '' }}
                    &nbsp;|&nbsp; Total:
                    <strong>{{ formatCOP(totalSeleccionado) }}</strong>
                  </span>

                  <v-spacer />

                  <v-btn
                    v-if="canAprobarSelected"
                    size="small"
                    color="info"
                    variant="elevated"
                    prepend-icon="mdi-check-decagram"
                    @click="confirmBulkAprobar"
                  >
                    Aprobar seleccionadas
                  </v-btn>

                  <v-btn
                    v-if="canPagarSelected"
                    size="small"
                    color="success"
                    variant="elevated"
                    prepend-icon="mdi-cash-multiple"
                    @click="confirmBulkPagar"
                  >
                    Pagar seleccionadas
                  </v-btn>

                  <!-- 🆕 Generar comprobante (guarda en backend) -->
                  <v-btn
                    size="small"
                    color="orange"
                    variant="elevated"
                    prepend-icon="mdi-file-document-plus"
                    @click="abrirConfirmacionComprobante"
                  >
                    Generar comprobante
                  </v-btn>

                  <v-btn
                    size="small"
                    variant="text"
                    @click="selectedIds = []"
                    icon="mdi-close"
                  />
                </div>
              </v-card>
            </div>
          </v-expand-transition>

          <!-- ── TABLA ──────────────────────────────────────────── -->
          <div class="scroll-wrapper tabla-ancha-breakout" ref="scrollWrapper">
            <div class="scroll-top" ref="scrollTop">
              <div :style="{ width: innerWidth + 'px', height: '1px' }"></div>
            </div>
            <div class="scroll-content" ref="scrollContent" @scroll="syncScroll('content')">
          <v-data-table-server
            class="px-4 pb-4"
            style="min-width: 1400px"
            :headers="headers"
            :items="filteredRows"
            :items-length="totalItems"
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            :loading="loading"
            :sort-by="sortBy"
            @update:options="loadItems"
            item-value="id"
            item-selectable="_selectable"
            v-model="selectedIds"
            show-select
            return-object
          >
            <template #item.estado="{ item }">
              <v-chip :color="estadoColor(item.estado)" size="small" variant="flat">
                {{ item.estado }}
              </v-chip>
            </template>

            <template #item.tipo_vehiculo="{ item }">
              <v-chip
                v-if="item.tipo_vehiculo"
                size="x-small"
                :color="item.tipo_vehiculo === 'MOTO' ? 'deep-purple' : 'teal'"
                variant="tonal"
                :prepend-icon="item.tipo_vehiculo === 'MOTO' ? 'mdi-motorbike' : 'mdi-car'"
              >
                {{ item.tipo_vehiculo === 'MOTO' ? 'Moto' : 'Vehículo' }}
              </v-chip>
              <span v-else class="text-medium-emphasis text-caption">—</span>
            </template>

            <template #item.tipo_cliente="{ item }">
              <v-chip size="x-small" :color="tipoClienteColor(item.turno)" variant="tonal">
                {{ tipoClienteLabel(item.turno) }}
              </v-chip>
            </template>
            <template #item.placa="{ item }">
    <span class="font-weight-medium">{{ item.turno?.placa || '—' }}</span>
  </template>

            <template #item.turno="{ item }">
              <div class="d-flex flex-column">
                <span>
                  Turno #{{ item.turno?.numero_global || item.turno?.numero || item.turno?.id || '—' }}
                </span>
                <span class="text-caption text-medium-emphasis">
                  {{ item.turno?.placa || '—' }} ·
                  {{ item.turno?.servicio?.nombre || item.turno?.servicio?.codigo || '—' }}
                </span>
              </div>
            </template>

            <template #item.descuento="{ item }">
              <template v-if="item.descuento">
                <v-chip size="x-small" color="orange-darken-2" variant="tonal" prepend-icon="mdi-tag-check">
                  {{ item.descuento.nombre }}
                </v-chip>
                <div class="text-caption text-medium-emphasis mt-1">
                  <v-icon size="12" class="mr-1">
                    {{ item.descuento_origen === 'dateo' ? 'mdi-calendar-check' : 'mdi-cash-register' }}
                  </v-icon>
                  {{ item.descuento_origen === 'dateo' ? 'Pre-marcado' : 'En caja' }}
                </div>
              </template>
              <span v-else class="text-medium-emphasis text-caption">—</span>
            </template>

            <template #item.valor_unitario="{ item }">
              {{ formatCOP(Number(item.monto_asesor ?? item.valor_unitario ?? 0)) }}
            </template>

            <template #item.valor_cliente="{ item }">
              {{ formatCOP(Number(item.monto_convenio ?? item.valor_cliente ?? 0)) }}
            </template>

            <template #item.valor_total="{ item }">
              <strong>{{ formatCOP(calcTotalItem(item)) }}</strong>
            </template>

            <template #item.asesor="{ item }">{{ item.asesor?.nombre || '—' }}</template>
            <template #item.convenio="{ item }">{{ item.convenio?.nombre || '—' }}</template>
            <template #item.generado_at="{ item }">{{ formatDate(item.generado_at) }}</template>
            <template #item.rep_general="{ item }">
              <v-chip
               v-if="item.turno?.rep_general_verificado"
                size="x-small"
                color="success"
                variant="tonal"
                prepend-icon="mdi-check-circle"
              >
                Verificado
              </v-chip>
              <v-chip
                v-else
                size="x-small"
                color="warning"
                variant="tonal"
                prepend-icon="mdi-clock-outline"
              >
                Sin Rep
              </v-chip>
            </template>

            <template #item.acciones="{ item }">
    <div class="d-flex gap-1">
      <v-btn size="small" variant="text" icon="mdi-eye" @click="verDetalle(item)" />
      <v-btn
        v-if="item.estado === 'PENDIENTE'"
        size="small" variant="text" color="primary"
        icon="mdi-pencil"
        @click="abrirEditar(item)"
      />
      <v-btn
        v-if="item.estado === 'PENDIENTE'"
        size="small" variant="text" color="warning"
                  icon="mdi-check-decagram"
                  @click="confirmAprobar(item.id)"
                />
                <v-btn
                  v-if="item.estado === 'APROBADA'"
                  size="small" variant="text" color="success"
                  icon="mdi-cash-multiple"
                  @click="confirmPagar(item.id)"
                />
                <v-btn
                  v-if="item.estado === 'PENDIENTE' || item.estado === 'APROBADA'"
                  size="small" variant="text" color="error"
                  icon="mdi-cancel"
                  @click="confirmAnular(item.id)"
                />
              </div>
            </template>
          </v-data-table-server>
            </div>
          </div>
        </template>
      </template>

      <!-- ====== TAB METAS ======================================== -->
      <template v-else>
        <v-card-text class="pt-5">
          <div class="mb-4 text-subtitle-1 font-weight-medium">
            Metas mensuales de RTM por asesor
          </div>
          <v-row dense class="mb-2">
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="valorRtmMoto"
                label="Valor RTM Motos" prefix="$"
                variant="outlined" density="comfortable" type="number" hide-details
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="valorRtmVehiculo"
                label="Valor RTM Vehículos" prefix="$"
                variant="outlined" density="comfortable" type="number" hide-details
              />
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center">
              <div class="text-caption text-medium-emphasis">
                Valores usados para estimar la facturación RTM y la comisión de meta mensual.
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-data-table
          class="px-4 pb-4"
          :headers="metaHeaders"
          :items="metaRows"
          :loading="metaLoading"
          item-key="asesor_id"
        >
          <template #item.asesor="{ item }">{{ item.asesor_nombre }}</template>
          <template #item.rtm_motos="{ item }">{{ item.rtm_motos || 0 }}</template>
          <template #item.rtm_vehiculos="{ item }">{{ item.rtm_vehiculos || 0 }}</template>
          <template #item.total_rtm="{ item }">{{ calcTotalRtm(item) }}</template>
          <template #item.meta_rtm="{ item }">
            <span v-if="getMetaDinero(item) > 0">{{ formatCOP(getMetaDinero(item)) }}</span>
            <span v-else>—</span>
          </template>
          <template #item.avance="{ item }">
            <span v-if="getMetaDinero(item) > 0">{{ calcAvance(item).toFixed(1) }}%</span>
            <span v-else>—</span>
          </template>
          <template #item.faltante="{ item }">
            <span v-if="getMetaDinero(item) > 0">{{ formatCOP(calcFaltante(item)) }}</span>
            <span v-else>—</span>
          </template>
          <template #item.porcentaje_comision_meta="{ item }">
            {{ item.porcentaje_comision_meta ?? 0 }}%
          </template>
          <template #item.comision_estimada="{ item }">
            {{ formatCOP(calcComisionMeta(item)) }}
          </template>
        </v-data-table>
      </template>
    </v-card>

    <!-- ══════════════════════════════════════════════════════════
         DIÁLOGO: Confirmación simple
    ══════════════════════════════════════════════════════════ -->
    <v-dialog v-model="dialog.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">{{ dialog.title }}</v-card-title>
        <v-card-text>{{ dialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog.visible = false">Cancelar</v-btn>
          <v-btn :color="dialog.color" @click="dialog.onConfirm">Confirmar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════════════════════════════════════════════════
         DIÁLOGO: Confirmación de acción masiva (aprobar/pagar)
    ══════════════════════════════════════════════════════════ -->
    <v-dialog v-model="bulkAccionDialog.visible" max-width="480" persistent>
      <v-card>
        <v-card-title class="text-h6">
          {{ bulkAccionDialog.accion === 'APROBAR'
            ? `Aprobar comisiones — ${bulkAccionDialog.nombre}`
            : `Registrar pago — ${bulkAccionDialog.nombre}` }}
        </v-card-title>
        <v-card-text>
          <template v-if="bulkAccionDialog.accion === 'APROBAR'">
            <p>
              ¿Confirmas aprobar {{ bulkAccionDialog.ids.length }} comisiones por
              <strong>{{ formatCOP(bulkAccionDialog.total) }}</strong> total?
            </p>
          </template>
          <template v-else>
            <v-table density="compact">
              <tbody>
                <tr>
                  <td class="text-medium-emphasis">Asesor</td>
                  <td class="font-weight-medium">{{ bulkAccionDialog.nombre }}</td>
                </tr>
                <tr>
                  <td class="text-medium-emphasis">Cantidad</td>
                  <td class="font-weight-medium">{{ bulkAccionDialog.ids.length }} comisiones</td>
                </tr>
                <tr>
                  <td class="text-medium-emphasis">Total a pagar</td>
                  <td class="font-weight-bold text-success">{{ formatCOP(bulkAccionDialog.total) }}</td>
                </tr>
              </tbody>
            </v-table>
            <v-text-field
              v-model="bulkAccionDialog.fechaPago"
              label="Fecha de pago"
              type="date"
              variant="outlined"
              density="comfortable"
              class="mt-3"
              hide-details
            />
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="bulkAccionDialog.loading" @click="bulkAccionDialog.visible = false">
            Cancelar
          </v-btn>
          <v-btn
            :color="bulkAccionDialog.accion === 'APROBAR' ? 'info' : 'success'"
            variant="elevated"
            :loading="bulkAccionDialog.loading"
            @click="ejecutarAccionMasiva"
          >
            {{ bulkAccionDialog.accion === 'APROBAR' ? 'APROBAR' : 'CONFIRMAR PAGO' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════════════════════════════════════════════════
     DIÁLOGO: Detalle comisión
══════════════════════════════════════════════════════════ -->
<v-dialog v-model="detailDialog.visible" max-width="820" scrollable>
  <v-card v-if="detailDialog.item">
    <v-card-title class="text-h6 d-flex align-center justify-space-between py-3 px-5">
      <span>Detalle comisión #{{ detailDialog.item.id }}</span>
      <div class="d-flex align-center gap-2">
        <v-chip
          v-if="detailDialog.item.tipo_vehiculo"
          size="x-small"
          :color="detailDialog.item.tipo_vehiculo === 'MOTO' ? 'deep-purple' : 'teal'"
          variant="tonal"
          :prepend-icon="detailDialog.item.tipo_vehiculo === 'MOTO' ? 'mdi-motorbike' : 'mdi-car'"
        >
          {{ detailDialog.item.tipo_vehiculo === 'MOTO' ? 'Moto' : 'Vehículo' }}
        </v-chip>
        <v-chip :color="estadoColor(detailDialog.item.estado)" size="small" variant="flat">
          {{ detailDialog.item.estado }}
        </v-chip>
      </div>
    </v-card-title>
    <v-divider />

    <v-card-text class="pt-4 px-5">
      <v-skeleton-loader v-if="detailDialog.loading" type="card, card, card" />

      <template v-else>

        <!-- ══ SECCIÓN: INFO DEL CLIENTE ══ -->
        <div class="mb-4">
          <div class="text-caption font-weight-bold text-medium-emphasis mb-2 d-flex align-center gap-1">
            <v-icon size="14" color="teal">mdi-account-circle</v-icon>
            INFORMACIÓN DEL CLIENTE
          </div>

          <v-skeleton-loader v-if="detailDialog.clienteLoading" type="list-item-two-line" />

          <v-card v-else-if="detailDialog.clienteData" variant="tonal" color="teal" class="rounded-lg">
            <v-card-text class="py-3 px-4">
              <v-row dense>
                <!-- Nombre y doc -->
                <v-col cols="12" md="5">
                  <div class="text-caption text-medium-emphasis">Propietario</div>
                  <div class="font-weight-bold text-body-2">
                    {{ detailDialog.clienteData.cliente?.nombre ?? '—' }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ detailDialog.clienteData.cliente?.docTipo ?? '' }}
                    {{ detailDialog.clienteData.cliente?.docNumero ?? '' }}
                    <template v-if="detailDialog.clienteData.cliente?.telefono">
                      · 📞 {{ detailDialog.clienteData.cliente.telefono }}
                    </template>
                  </div>
                </v-col>

                <!-- Métricas -->
                <v-col cols="4" md="2" class="text-center">
                  <div class="text-h6 font-weight-bold">
                    {{ (detailDialog.clienteData.metricas ?? detailDialog.clienteData.kpis)?.visitas_count ?? 0 }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Visitas totales</div>
                </v-col>
                <v-col cols="4" md="3" class="text-center">
                  <div class="text-body-2 font-weight-bold">
                    {{ (detailDialog.clienteData.metricas ?? detailDialog.clienteData.kpis)?.ultima_visita_at ?? '—' }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Última visita</div>
                </v-col>
                <v-col cols="4" md="2" class="text-center">
                  <div class="text-h6 font-weight-bold">
                    {{ (detailDialog.clienteData.metricas ?? detailDialog.clienteData.kpis)?.dias_desde_ultima_visita ?? '—' }}
                  </div>
                  <div class="text-caption text-medium-emphasis">Días desde última</div>
                </v-col>

                <!-- Vehículos -->
                <v-col cols="12" class="pt-1">
                  <div class="d-flex flex-wrap gap-1">
                    <v-chip
                      v-for="v in detailDialog.clienteData.vehiculos"
                      :key="v.id"
                      size="x-small"
                      variant="tonal"
                      color="indigo"
                      prepend-icon="mdi-car"
                    >
                      {{ v.placa }}{{ v.marca ? ` · ${v.marca}` : '' }}{{ v.modelo ? ` ${v.modelo}` : '' }}
                    </v-chip>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-alert v-else type="info" variant="tonal" density="compact" class="text-caption">
            No se encontró información del cliente para la placa
            <strong>{{ detailDialog.item.turno?.placa ?? '—' }}</strong>.
          </v-alert>
        </div>

        <!-- ══ SECCIÓN: POR QUÉ SE PAGA ESTO ══ -->
        <div class="mb-4">
          <div class="text-caption font-weight-bold text-medium-emphasis mb-2 d-flex align-center gap-1">
            <v-icon size="14" color="primary">mdi-lightbulb</v-icon>
            ¿POR QUÉ SE PAGA ESTO?
          </div>

          <template v-if="detailDialog.item">
            <v-card
              :color="buildJustificacion(detailDialog.item).color"
              variant="tonal"
              class="rounded-lg"
            >
              <v-card-title class="d-flex align-center gap-2 text-subtitle-2 py-2 px-4">
                <v-icon size="18">{{ buildJustificacion(detailDialog.item).icono }}</v-icon>
                {{ buildJustificacion(detailDialog.item).titulo }}
              </v-card-title>
              <v-card-text class="py-2 px-4">
                <p class="text-caption text-medium-emphasis mb-2">
                  {{ buildJustificacion(detailDialog.item).descripcion }}
                </p>
                <v-divider class="mb-2" />
                <div class="d-flex flex-wrap gap-3">
                  <div
                    v-for="linea in buildJustificacion(detailDialog.item).lineas"
                    :key="linea.label"
                    class="text-caption"
                  >
                    <span class="text-medium-emphasis">{{ linea.label }}:</span>
                    <strong class="ms-1">{{ linea.valor }}</strong>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </template>
        </div>

        <!-- ══ SECCIÓN: DESCUENTO INFORMATIVO ══ -->
        <v-card
          v-if="detailDialog.item.descuento"
          class="mb-4"
          variant="tonal"
          color="orange-darken-2"
        >
          <v-card-title class="d-flex align-center gap-2 text-subtitle-2 py-2 px-4">
            <v-icon size="16">mdi-tag-check</v-icon>
            Descuento informativo aplicado
            <v-chip
              size="x-small" class="ms-2"
              :color="detailDialog.item.descuento_origen === 'dateo' ? 'blue' : 'purple'"
              variant="flat"
            >
              {{ detailDialog.item.descuento_origen === 'dateo' ? 'Pre-marcado' : 'En caja' }}
            </v-chip>
          </v-card-title>
          <v-card-text class="py-2 px-4">
            <v-row dense>
              <v-col cols="12" md="4">
                <strong>Descuento:</strong>
                {{ detailDialog.item.descuento.nombre }}
                <span class="text-caption">({{ detailDialog.item.descuento.codigo }})</span>
              </v-col>
              <v-col cols="12" md="4" v-if="detailDialog.item.descuento_aplicado_at">
                <strong>Aplicado el:</strong><br />
                {{ formatDate(detailDialog.item.descuento_aplicado_at) }}
              </v-col>
              <v-col cols="12" md="4" v-if="detailDialog.item.descuento_aplicado_por">
                <strong>Confirmado por:</strong><br />
                {{ detailDialog.item.descuento_aplicado_por.nombre }}
              </v-col>
            </v-row>
            <template v-if="detailDialog.item.es_avance">
              <v-divider class="my-2" />
              <div class="text-caption text-medium-emphasis">
                <strong>🏷️ AVANCE:</strong>
                Incentivo base: <strong>{{ formatCOP(Number(detailDialog.item.base ?? 0)) }}</strong>
                − Avance cobrado: <strong style="color:#e53935">{{ formatCOP(Number(detailDialog.item.descuento_monto_aplicado ?? 0)) }}</strong>
                = Incentivo final: <strong>{{ formatCOP(Number(detailDialog.item.monto_convenio ?? 0)) }}</strong>
              </div>
            </template>
          </v-card-text>
        </v-card>

        <!-- ══ SECCIÓN: RESUMEN FINANCIERO ══ -->
        <div class="text-caption font-weight-bold text-medium-emphasis mb-2 d-flex align-center gap-1">
          <v-icon size="14" color="green">mdi-cash-multiple</v-icon>
          RESUMEN FINANCIERO
        </div>

        <v-row dense class="mb-2">
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="rounded-lg pa-3">
              <div class="text-caption text-medium-emphasis">Asesor</div>
              <div class="font-weight-medium">{{ detailDialog.item.asesor?.nombre || '—' }}</div>
              <div class="text-caption text-medium-emphasis mt-1">Tipo: {{ detailDialog.item.asesor?.tipo || '—' }}</div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">💼 Dateo</span>
                <strong>{{ formatCOP(Number(detailDialog.item.monto_asesor ?? detailDialog.item.valor_unitario ?? 0)) }}</strong>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card variant="outlined" class="rounded-lg pa-3" :class="{ 'border-opacity-0 bg-grey-lighten-4': !detailDialog.item.convenio }">
              <div class="text-caption text-medium-emphasis">Convenio</div>
              <div class="font-weight-medium">{{ detailDialog.item.convenio?.nombre || '—' }}</div>
              <div class="text-caption text-medium-emphasis mt-1">
                Turno #{{ detailDialog.item.turno?.numero_global || detailDialog.item.turno?.id || '—' }}
                · Placa: {{ detailDialog.item.turno?.placa || '—' }}
              </div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">🏢 Incentivo</span>
                <strong>{{ formatCOP(Number(detailDialog.item.monto_convenio ?? detailDialog.item.valor_cliente ?? 0)) }}</strong>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12">
            <v-card color="success" variant="tonal" class="rounded-lg pa-3">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-caption text-medium-emphasis">Total comisión</div>
                  <div class="text-caption text-medium-emphasis">
                    Generado: {{ formatDate(detailDialog.item.generado_at) }}
                  </div>
                </div>
                <div class="text-h5 font-weight-bold text-success">
                  {{ formatCOP(calcTotalDetalle(detailDialog.item)) }}
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
<!-- ══ SECCIÓN: HISTORIAL DE VISITAS ══ -->
<div class="mb-4">
  <div class="text-caption font-weight-bold text-medium-emphasis mb-2 d-flex align-center gap-1">
    <v-icon size="14" color="indigo">mdi-history</v-icon>
    HISTORIAL DE VISITAS
  </div>

  <v-skeleton-loader v-if="detailDialog.clienteLoading" type="list-item-two-line" />

  <template v-else-if="detailDialog.clienteData">
    <v-table density="compact" class="rounded-lg" style="border:1px solid rgba(0,0,0,0.12)">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Placa</th>
          <th>Servicio</th>
          <th>Estado</th>
          <th>Rep General</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="v in (detailDialog.clienteData as any).visitas_recientes"
          :key="v.id"
        >
          <td class="text-caption">{{ v.fecha ? formatDate(v.fecha) : '—' }}</td>
          <td class="text-caption font-weight-medium">{{ v.placa ?? '—' }}</td>
          <td class="text-caption">{{ v.servicioNombre ?? 'RTM' }}</td>
          <td>
            <v-chip
              size="x-small"
              :color="v.estado === 'finalizado' ? 'success' : 'warning'"
              variant="flat"
            >
              {{ v.estado }}
            </v-chip>
          </td>
          <td>
            <v-chip
              v-if="v.rep_general_verificado"
              size="x-small" color="success" variant="tonal"
            >
              ✅ Verificado
            </v-chip>
            <v-chip v-else size="x-small" color="warning" variant="tonal">
              ⏳ Sin Rep
            </v-chip>
          </td>
        </tr>
        <tr v-if="!(detailDialog.clienteData as any).visitas_recientes?.length">
          <td colspan="5" class="text-center text-medium-emphasis py-3 text-caption">
            Sin visitas registradas
          </td>
        </tr>
      </tbody>
    </v-table>
  </template>

 <v-alert v-else type="info" variant="tonal" density="compact" class="text-caption">
    Sin historial disponible para esta placa.
  </v-alert>
</div>
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="detailDialog.visible = false">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

    <!-- ══════════════════════════════════════════════════════════
     DIÁLOGO: Vista previa del comprobante
══════════════════════════════════════════════════════════ -->
    <v-dialog v-model="printDialog.visible" max-width="880" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between py-4 px-6">
          <div class="d-flex align-center gap-2">
            <v-icon color="primary">mdi-printer</v-icon>
            <span class="text-h6">Vista previa del comprobante</span>
          </div>
          <div class="d-flex gap-2">
            <v-btn color="primary" prepend-icon="mdi-printer" @click="doPrint">
              Imprimir / Guardar PDF
            </v-btn>
            <v-btn variant="text" icon="mdi-close" @click="printDialog.visible = false" />
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6 bg-grey-lighten-4" style="max-height:65vh; overflow-y:auto;">
          <v-card class="mb-4 rounded-lg pa-5" elevation="1">
            <div class="text-center mb-3">
              <div class="text-h6 font-weight-bold text-primary">COMPROBANTE DE PAGO DE COMISIONES</div>
              <div class="text-caption text-medium-emphasis">
                Generado el {{ printDialog.fechaGeneracion }}
                <template v-if="filters.desde || filters.hasta"> · Período: {{ filters.desde || '...' }} → {{ filters.hasta || '...' }}</template>
                <template v-if="printDialog.estadoPagado"> · Estado pagado: {{ printDialog.estadoPagado }}</template>
              </div>
            </div>

            <v-row dense class="mt-3">
              <v-col cols="6" sm="3" class="text-center">
                <div class="text-caption text-medium-emphasis">Total comisiones</div>
                <div class="font-weight-bold">{{ printDialog.items.length }}</div>
              </v-col>
              <v-col cols="6" sm="3" class="text-center">
                <div class="text-caption text-medium-emphasis">🏍️ Motos</div>
                <div class="font-weight-bold">{{ printDialog.totalMotos }}</div>
              </v-col>
              <v-col cols="6" sm="3" class="text-center">
                <div class="text-caption text-medium-emphasis">🚗 Vehículos</div>
                <div class="font-weight-bold">{{ printDialog.totalVehiculos }}</div>
              </v-col>
              <v-col cols="6" sm="3" class="text-center">
                <div class="text-caption text-medium-emphasis">Total general</div>
                <div class="text-h6 font-weight-bold text-success">{{ formatCOP(printDialog.totalGeneral) }}</div>
              </v-col>
            </v-row>
          </v-card>

          <v-card
            v-for="group in printDialog.groups"
            :key="group.key"
            class="mb-4 rounded-lg"
            elevation="1"
          >
            <div class="bg-primary pa-3 rounded-t-lg d-flex align-center justify-space-between">
              <div class="text-white font-weight-bold d-flex align-center gap-2">
                <v-icon color="white" size="18">mdi-handshake</v-icon>
                {{ group.nombre }}
              </div>
              <div class="text-white text-caption">
                {{ group.items.length }} comisión{{ group.items.length !== 1 ? 'es' : '' }}
              </div>
            </div>

            <v-table density="compact">
              <thead>
                <tr>
                  <th class="text-left">Turno</th>
                  <th class="text-left">Placa</th>
                  <th class="text-left">Tipo</th>
                  <th class="text-left">Servicio</th>
                  <th class="text-right">Dateo (asesor)</th>
                  <th class="text-right">Incentivo (convenio)</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in group.items" :key="item.id">
                  <td class="text-caption">#{{ item.turno?.numero_global || item.turno?.id || '—' }}</td>
                  <td class="text-caption font-weight-medium">{{ item.turno?.placa || '—' }}</td>
                  <td>
                    <v-chip size="x-small" :color="item.tipo_vehiculo === 'MOTO' ? 'deep-purple' : 'teal'" variant="tonal">
                      {{ item.tipo_vehiculo === 'MOTO' ? '🏍️ Moto' : '🚗 Vehículo' }}
                    </v-chip>
                  </td>
                  <td class="text-caption">{{ item.turno?.servicio?.nombre || item.turno?.servicio?.codigo || '—' }}</td>
                  <td class="text-right text-caption">{{ formatCOP(Number(item.monto_asesor ?? item.valor_unitario ?? 0)) }}</td>
                  <td class="text-right text-caption">{{ formatCOP(Number(item.monto_convenio ?? item.valor_cliente ?? 0)) }}</td>
                  <td class="text-right text-caption font-weight-medium">{{ formatCOP(calcTotalItem(item)) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-grey-lighten-3">
                  <td colspan="2" class="text-caption font-weight-bold">
                    🏍️ {{ group.motosCount }} moto{{ group.motosCount !== 1 ? 's' : '' }}
                    · 🚗 {{ group.vehiculosCount }} vehículo{{ group.vehiculosCount !== 1 ? 's' : '' }}
                  </td>
                  <td colspan="2" class="text-caption text-medium-emphasis">Subtotales del grupo</td>
                  <td class="text-right text-caption font-weight-bold">{{ formatCOP(group.totalDateo) }}</td>
                  <td class="text-right text-caption font-weight-bold">{{ formatCOP(group.totalIncentivo) }}</td>
                  <td class="text-right font-weight-bold text-primary">{{ formatCOP(group.totalDateo + group.totalIncentivo) }}</td>
                </tr>
              </tfoot>
            </v-table>
          </v-card>

          <v-card class="rounded-lg pa-4" color="success" variant="tonal" elevation="1">
            <div class="d-flex justify-space-between align-center">
              <div class="font-weight-bold text-success text-h6">TOTAL GENERAL A PAGAR</div>
              <div class="text-h5 font-weight-bold text-success">{{ formatCOP(printDialog.totalGeneral) }}</div>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              Dateo asesores: {{ formatCOP(printDialog.totalDateoGlobal) }}
              · Incentivos convenios: {{ formatCOP(printDialog.totalIncentivoGlobal) }}
            </div>
          </v-card>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- ══════════════════════════════════════════════════════════
         DIÁLOGO: Confirmar generación de comprobante
    ══════════════════════════════════════════════════════════ -->
    <v-dialog v-model="confirmComprobante.visible" max-width="560">
      <v-card>
        <v-card-title class="text-h6 d-flex align-center gap-2 py-4 px-6">
          <v-icon color="orange">mdi-file-document-plus</v-icon>
          Generar comprobante de pago
        </v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <p class="mb-3 text-body-2">
            Se generarán <strong>{{ confirmComprobante.groups.length }} comprobante{{ confirmComprobante.groups.length !== 1 ? 's' : '' }}</strong>
            (uno por beneficiario):
          </p>

          <v-list density="compact" class="mb-3 rounded-lg border">
            <v-list-item
              v-for="(g, i) in confirmComprobante.groups"
              :key="i"
              :title="g.nombre"
              :subtitle="`🏍️ ${g.motosCount} motos · 🚗 ${g.vehiculosCount} vehículos · ${formatCOP(g.totalDateo + g.totalIncentivo)}`"
            >
              <template #prepend>
                <v-avatar size="28" color="primary" class="text-caption font-weight-bold">
                  {{ i + 1 }}
                </v-avatar>
              </template>
            </v-list-item>
          </v-list>

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-chip variant="tonal" size="large" color="success" class="w-100 justify-center">
                Total: <strong class="ms-1">{{ formatCOP(confirmComprobante.totalGeneral) }}</strong>
              </v-chip>
            </v-col>
            <v-col cols="12" sm="6">
              <v-chip variant="tonal" size="large" color="info" class="w-100 justify-center">
                {{ confirmComprobante.totalComisiones }} comisiones
              </v-chip>
            </v-col>
          </v-row>

          <v-textarea
            v-model="confirmComprobante.notas"
            label="Notas opcionales"
            rows="2"
            class="mt-4"
            variant="outlined"
            density="comfortable"
            hide-details
            placeholder="Ej: Pago semana del 10 al 16 de marzo"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-btn variant="text" @click="confirmComprobante.visible = false" :disabled="confirmComprobante.loading">
            Cancelar
          </v-btn>
          <v-spacer />
          <v-btn
            color="orange"
            variant="elevated"
            prepend-icon="mdi-content-save"
            :loading="confirmComprobante.loading"
            @click="ejecutarGenerarComprobante"
          >
            Confirmar y guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
<!-- Diálogo editar comisión -->
   <!-- Diálogo editar comisión -->
    <v-dialog v-model="editDialog.visible" max-width="760">
      <v-card v-if="editDialog.item">

        <!-- ── Cabecera ── -->
        <v-card-title class="d-flex align-center gap-2 py-3 px-5">
          <v-icon color="primary" size="20">mdi-pencil-box</v-icon>
          <span class="text-subtitle-1 font-weight-bold">
            Editar comisión #{{ editDialog.item.id }}
          </span>
          <v-spacer />
          <v-chip :color="estadoColor(editDialog.item.estado)" size="small" variant="flat">
            {{ editDialog.item.estado }}
          </v-chip>
        </v-card-title>

        <!-- ── Strip de datos actuales (solo lectura) ── -->
        <div class="px-5 pb-3 pt-0">
          <v-card variant="tonal" color="grey" class="rounded-lg px-4 py-2">
            <div class="d-flex flex-wrap align-center gap-3 text-caption">
              <v-chip
                size="x-small"
                :color="editDialog.item.tipo_vehiculo === 'MOTO' ? 'deep-purple' : 'teal'"
                variant="tonal"
                :prepend-icon="editDialog.item.tipo_vehiculo === 'MOTO' ? 'mdi-motorbike' : 'mdi-car'"
              >
                {{ editDialog.item.tipo_vehiculo === 'MOTO' ? 'Moto' : 'Vehículo' }}
              </v-chip>
              <span class="font-weight-medium">
                {{ editDialog.item.turno?.placa || '—' }}
              </span>
              <span class="text-medium-emphasis">
                Turno #{{ editDialog.item.turno?.numero_global || editDialog.item.turno?.id || '—' }}
              </span>
              <span class="text-medium-emphasis">
                {{ editDialog.item.turno?.servicio?.nombre || editDialog.item.turno?.servicio?.codigo || '—' }}
              </span>
              <v-spacer />
              <span class="text-medium-emphasis">
                {{ formatDate(editDialog.item.generado_at) }}
              </span>
            </div>
          </v-card>
        </div>

        <v-divider />

        <v-card-text class="px-5 py-4">
          <v-row dense>

            <!-- ── Fila 1: Tipo cliente ── -->
            <v-col cols="12">
              <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">
                TIPO DE CLIENTE
              </div>
              <v-btn-toggle
                v-model="editDialog.form.tipoCliente"
                mandatory rounded="lg" divided
                style="width:100%"
                density="compact"
              >
                <v-btn value="NUEVO" style="flex:1" size="small">
                  🆕 Nuevo
                </v-btn>
                <v-btn value="RECURRENTE" style="flex:1" size="small">
                  🔄 Recurrente
                </v-btn>
                <v-btn value="RECUPERACION" style="flex:1" size="small">
                  💛 Recuperación
                </v-btn>
              </v-btn-toggle>
            </v-col>

            <!-- ── Fila 2: Tipo asesor ── -->
            <v-col cols="12" class="mt-3">
              <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">
                TIPO DE ASESOR
              </div>
              <v-btn-toggle
                v-model="editDialog.form.tipoAsesor"
                rounded="lg" divided
                style="width:100%"
                density="compact"
                @update:model-value="onTipoAsesorChange"
              >
                <v-btn value="" style="flex:1" size="small">
                  Sin asesor
                </v-btn>
                <v-btn value="COMERCIAL" style="flex:1" size="small">
                  <v-icon start size="13">mdi-account-tie</v-icon>
                  Comercial
                </v-btn>
                <v-btn value="CONVENIO" style="flex:1" size="small">
                  <v-icon start size="13">mdi-handshake</v-icon>
                  Convenio
                </v-btn>
              </v-btn-toggle>
            </v-col>

            <!-- ── Fila 3: Asesor + Convenio ── -->
            <v-col
              cols="12"
              :md="editDialog.form.tipoAsesor === 'COMERCIAL' ? 6 : 12"
              v-if="editDialog.form.tipoAsesor"
              class="mt-1"
            >
              <v-autocomplete
                v-if="editDialog.form.tipoAsesor === 'COMERCIAL'"
                v-model="editDialog.form.asesorId"
                :items="asesoresComerciales2"
                item-title="nombre" item-value="id"
                label="Asesor comercial"
                density="compact" variant="outlined" clearable
                :loading="asesoresLoading"
                prepend-inner-icon="mdi-account-tie"
                @update:model-value="onAsesorEditChange"
              />
              <v-autocomplete
                v-else-if="editDialog.form.tipoAsesor === 'CONVENIO'"
                v-model="editDialog.form.asesorId"
                :items="asesoresConvenio2"
                item-title="nombre" item-value="id"
                label="Asesor convenio"
                density="compact" variant="outlined" clearable
                :loading="asesoresLoading"
                prepend-inner-icon="mdi-handshake"
                @update:model-value="onAsesorEditChange"
              />
            </v-col>

            <!-- Convenio del comercial -->
            <v-col cols="12" md="6"
              v-if="editDialog.form.tipoAsesor === 'COMERCIAL'"
              class="mt-1"
            >
              <v-autocomplete
                v-model="editDialog.form.convenioId"
                :items="conveniosParaEdicion"
                item-title="nombre" item-value="id"
                label="Convenio (opcional)"
                density="compact" variant="outlined" clearable
                :loading="conveniosEditLoading"
                prepend-inner-icon="mdi-handshake"
                :disabled="!editDialog.form.asesorId"
                :hint="!editDialog.form.asesorId
                  ? 'Selecciona primero el asesor'
                  : conveniosParaEdicion.length === 0
                  ? 'Sin convenios asignados'
                  : ''"
                persistent-hint
              />
            </v-col>

            <!-- Info convenio automático para CONVENIO -->
            <v-col cols="12" v-if="editDialog.form.tipoAsesor === 'CONVENIO'" class="mt-0">
              <v-alert type="info" variant="tonal" density="compact" class="text-caption py-1">
                El convenio se asigna automáticamente por el nombre del asesor.
              </v-alert>
            </v-col>

            <!-- ── Fila 4: Dateo + Incentivo + Total ── -->
            <v-col cols="12" class="mt-2">
              <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">
                VALORES
              </div>
            </v-col>
            <v-col cols="5">
              <v-text-field
                v-model="editDialog.form.montoAsesor"
                label="💼 Dateo (asesor)"
                type="number" min="0"
                density="compact" variant="outlined" prefix="$"
              />
            </v-col>
            <v-col cols="5">
              <v-text-field
                v-model="editDialog.form.montoConvenio"
                label="🏢 Incentivo (convenio)"
                type="number" min="0"
                density="compact" variant="outlined" prefix="$"
              />
            </v-col>
            <v-col cols="2" class="d-flex align-center justify-center">
              <div class="text-center">
                <div class="text-caption text-medium-emphasis">Total</div>
                <div class="text-body-2 font-weight-bold text-primary">
                  {{ formatCOP(
                    (Number(editDialog.form.montoAsesor) || 0) +
                    (Number(editDialog.form.montoConvenio) || 0)
                  ) }}
                </div>
              </div>
            </v-col>

            <!-- ── Fila 5: Descuento ── -->
            <v-col cols="12" class="mt-1">
              <v-autocomplete
                v-model="editDialog.form.descuentoId"
                :items="allDescuentos"
                item-title="nombre" item-value="id"
                label="🏷️ Descuento aplicado"
                density="compact" variant="outlined"
                clearable :loading="descuentosLoading"
                prepend-inner-icon="mdi-tag-text"
                hint="Dejar vacío para quitar el descuento"
                persistent-hint
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #append>
                      <v-chip size="x-small" variant="tonal" color="orange">
                        {{ item.raw.codigo }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </template>
                <template #selection="{ item }">
                  {{ item.raw.nombre }}
                  <v-chip size="x-small" class="ml-2" variant="tonal" color="orange">
                    {{ item.raw.codigo }}
                  </v-chip>
                </template>
              </v-autocomplete>
              <v-alert
                v-if="editDialog.item.descuento && !editDialog.form.descuentoId"
                type="warning" variant="tonal" density="compact" class="mt-1 text-caption"
              >
                Se eliminará el descuento
                <strong>{{ editDialog.item.descuento.nombre }}</strong>.
              </v-alert>
            </v-col>

            <!-- ── Fila 6: Observación ── -->
            <v-col cols="12" class="mt-1">
              <div class="d-flex align-center gap-2 mb-1">
                <div class="text-caption text-medium-emphasis font-weight-medium">
                  OBSERVACIÓN DEL DATEO
                </div>
                <v-tooltip
                  v-if="editDialog.observacionOriginal"
                  location="top" max-width="280"
                >
                  <template #activator="{ props }">
                    <v-icon
                      v-bind="props" size="15" style="cursor:pointer"
                      :color="editDialog.form.observacionDateo !== editDialog.observacionOriginal
                        ? 'warning' : 'primary'"
                    >mdi-eye</v-icon>
                  </template>
                  <div class="text-caption">
                    <strong>Original:</strong><br>
                    {{ editDialog.observacionOriginal }}
                    <div
                      v-if="editDialog.form.observacionDateo !== editDialog.observacionOriginal"
                      class="mt-1"
                    >
                      ⚠️ Modificado.
                    </div>
                  </div>
                </v-tooltip>
                <v-chip v-else size="x-small" variant="tonal" color="grey">
                  Sin observación
                </v-chip>
              </div>
              <v-textarea
                v-model="editDialog.form.observacionDateo"
                :placeholder="editDialog.observacionOriginal || 'Escribe una observación...'"
                variant="outlined" density="compact" rows="2"
                prepend-inner-icon="mdi-note-text" clearable
                hide-details
              />
            </v-col>

          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-5 py-3">
          <v-btn
            variant="text" size="small"
            :disabled="editDialog.loading"
            @click="editDialog.visible = false"
          >
            Cancelar
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary" variant="elevated" size="small"
            prepend-icon="mdi-content-save"
            :loading="editDialog.loading"
            @click="guardarEdicion"
          >
            Guardar cambios
          </v-btn>
        </v-card-actions>

      </v-card>
    </v-dialog>
    <!-- ══ DIÁLOGO: Crear comisión ══ -->
    <v-dialog v-model="crearDialog.visible" max-width="780" scrollable persistent>
      <v-card>
        <v-card-title class="d-flex align-center gap-2 py-3 px-5">
          <v-icon color="success" size="20">mdi-plus-circle</v-icon>
          <span class="text-subtitle-1 font-weight-bold">Nueva comisión</span>
          <v-spacer />
          <div class="d-flex align-center gap-2 text-caption text-medium-emphasis">
            <v-chip
              :color="crearDialog.step === 1 ? 'success' : 'grey'"
              :variant="crearDialog.step === 1 ? 'flat' : 'outlined'"
              size="x-small"
            >1 · Buscar turno</v-chip>
            <v-icon size="12">mdi-chevron-right</v-icon>
            <v-chip
              :color="crearDialog.step === 2 ? 'success' : 'grey'"
              :variant="crearDialog.step === 2 ? 'flat' : 'outlined'"
              size="x-small"
            >2 · Configurar comisión</v-chip>
          </div>
        </v-card-title>
        <v-divider />

        <v-card-text class="px-5 py-4" style="min-height:420px">

          <!-- PASO 1: BUSCAR TURNO -->
          <template v-if="crearDialog.step === 1">
            <v-row dense class="mb-3">
              <v-col cols="12" sm="7">
                <v-text-field
                  v-model="crearDialog.searchPlaca"
                  label="Buscar por placa"
                  variant="outlined" density="compact" clearable
                  prepend-inner-icon="mdi-magnify" hide-details
                  placeholder="Ej: ABC123"
                  @keyup.enter="buscarTurnosPorPlacaCrear"
                  @click:clear="cargarTurnosHoy"
                />
              </v-col>
              <v-col cols="6" sm="3">
                <v-btn block color="primary" variant="elevated" density="comfortable"
                  prepend-icon="mdi-magnify" :loading="crearDialog.searchLoading"
                  @click="buscarTurnosPorPlacaCrear">
                  Buscar
                </v-btn>
              </v-col>
              <v-col cols="6" sm="2">
                <v-btn block variant="outlined" density="comfortable"
                  prepend-icon="mdi-calendar-today" :loading="crearDialog.searchLoading"
                  @click="crearDialog.searchPlaca = ''; cargarTurnosHoy()">
                  Hoy
                </v-btn>
              </v-col>
            </v-row>

            <div class="text-caption text-medium-emphasis mb-2">
              <v-icon size="13" class="mr-1">mdi-information-outline</v-icon>
              {{ crearDialog.searchPlaca
                  ? `Resultados para placa "${crearDialog.searchPlaca}"`
                  : 'Turnos de hoy — haz clic en Seleccionar para continuar' }}
            </div>

            <v-skeleton-loader
              v-if="crearDialog.searchLoading"
              type="table-row-divider,table-row-divider,table-row-divider"
            />

            <template v-else>
              <v-alert v-if="crearDialog.searchResults.length === 0"
                type="info" variant="tonal" density="compact" class="text-caption">
                No se encontraron turnos. Prueba buscando por placa o cambia la fecha.
              </v-alert>

              <v-table v-else density="compact" class="rounded-lg"
                style="border:1px solid rgba(0,0,0,0.12)">
                <thead>
                  <tr>
                    <th># Turno</th>
                    <th>Placa</th>
                    <th>Tipo</th>
                    <th>Servicio</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Dateo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="t in crearDialog.searchResults"
                    :key="t.id"
                    style="cursor:pointer"
                    :style="crearDialog.turnoSeleccionado?.id === t.id
                      ? 'background:rgba(76,175,80,0.08)' : ''"
                  >
                    <td class="text-caption font-weight-medium">
                      #{{ (t as any).turnoNumero ?? (t as any).turno_numero ?? t.id }}
                    </td>
                    <td class="text-caption font-weight-bold">{{ t.placa }}</td>
                    <td>
                      <v-chip size="x-small"
                        :color="turnoTipoVehiculoColor((t as any).tipoVehiculo ?? (t as any).tipo_vehiculo ?? '')"
                        variant="tonal"
                        :prepend-icon="turnoTipoVehiculoIcon((t as any).tipoVehiculo ?? (t as any).tipo_vehiculo ?? '')">
                        {{ turnoTipoVehiculoLabel((t as any).tipoVehiculo ?? (t as any).tipo_vehiculo ?? '') }}
                      </v-chip>
                    </td>
                    <td class="text-caption">
                      {{ (t.servicio as any)?.codigoServicio ?? (t.servicio as any)?.codigo_servicio ?? '—' }}
                    </td>
                    <td class="text-caption">{{ t.fecha ? String(t.fecha).substring(0,10) : '—' }}</td>
                    <td>
                      <v-chip size="x-small"
                        :color="t.estado === 'finalizado' ? 'success' : t.estado === 'activo' ? 'info' : 'grey'"
                        variant="flat">
                        {{ t.estado }}
                      </v-chip>
                    </td>
                    <td>
                      <v-icon size="16"
                        :color="(t as any).captacionDateoId || (t as any).captacion_dateo_id ? 'success' : 'grey'">
                        {{ (t as any).captacionDateoId || (t as any).captacion_dateo_id
                            ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                      </v-icon>
                    </td>
                    <td>
                      <v-btn size="x-small" color="success" variant="tonal"
                        @click.stop="seleccionarTurnoParaComision(t)">
                        Seleccionar
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </template>
          </template>

          <!-- PASO 2: CONFIGURAR COMISIÓN -->
          <template v-else-if="crearDialog.step === 2 && crearDialog.turnoSeleccionado">

            <v-card variant="tonal" color="success" class="rounded-lg px-4 py-2 mb-4">
              <div class="d-flex align-center flex-wrap gap-3">
                <v-btn size="x-small" variant="text" icon="mdi-arrow-left"
                  @click="volverABuscarTurno" />
                <v-chip size="x-small"
                  :color="turnoTipoVehiculoColor(
                    (crearDialog.turnoSeleccionado as any).tipoVehiculo
                    ?? (crearDialog.turnoSeleccionado as any).tipo_vehiculo ?? '')"
                  variant="tonal"
                  :prepend-icon="turnoTipoVehiculoIcon(
                    (crearDialog.turnoSeleccionado as any).tipoVehiculo
                    ?? (crearDialog.turnoSeleccionado as any).tipo_vehiculo ?? '')">
                  {{ turnoTipoVehiculoLabel(
                    (crearDialog.turnoSeleccionado as any).tipoVehiculo
                    ?? (crearDialog.turnoSeleccionado as any).tipo_vehiculo ?? '') }}
                </v-chip>
                <span class="font-weight-bold text-caption">
                  {{ crearDialog.turnoSeleccionado.placa }}
                </span>
                <span class="text-caption text-medium-emphasis">
                  Turno #{{
                    (crearDialog.turnoSeleccionado as any).turnoNumero
                    ?? (crearDialog.turnoSeleccionado as any).turno_numero
                    ?? crearDialog.turnoSeleccionado.id
                  }}
                </span>
                <span class="text-caption text-medium-emphasis">
                  {{ (crearDialog.turnoSeleccionado.servicio as any)?.codigoServicio
                    ?? (crearDialog.turnoSeleccionado.servicio as any)?.codigo_servicio
                    ?? '—' }}
                </span>
                <v-chip size="x-small" color="success" variant="flat">Seleccionado ✓</v-chip>
              </div>
            </v-card>

            <v-row dense>

              <v-col cols="12">
                <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">TIPO DE CLIENTE</div>
                <v-btn-toggle v-model="crearDialog.form.tipoCliente"
                  mandatory rounded="lg" divided style="width:100%" density="compact">
                  <v-btn value="NUEVO" style="flex:1" size="small">🆕 Nuevo</v-btn>
                  <v-btn value="RECURRENTE" style="flex:1" size="small">🔄 Recurrente</v-btn>
                  <v-btn value="RECUPERACION" style="flex:1" size="small">💛 Recuperación</v-btn>
                </v-btn-toggle>
              </v-col>

              <v-col cols="12" class="mt-3">
                <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">TIPO DE ASESOR</div>
                <v-btn-toggle v-model="crearDialog.form.tipoAsesor"
                  rounded="lg" divided style="width:100%" density="compact"
                  @update:model-value="onTipoAsesorCrearChange">
                  <v-btn value="" style="flex:1" size="small">Sin asesor</v-btn>
                  <v-btn value="COMERCIAL" style="flex:1" size="small">
                    <v-icon start size="13">mdi-account-tie</v-icon>Comercial
                  </v-btn>
                  <v-btn value="CONVENIO" style="flex:1" size="small">
                    <v-icon start size="13">mdi-handshake</v-icon>Convenio
                  </v-btn>
                </v-btn-toggle>
              </v-col>

              <v-col cols="12"
                :md="crearDialog.form.tipoAsesor === 'COMERCIAL' ? 6 : 12"
                v-if="crearDialog.form.tipoAsesor"
                class="mt-1">
                <v-autocomplete
                  v-if="crearDialog.form.tipoAsesor === 'COMERCIAL'"
                  v-model="crearDialog.form.asesorId"
                  :items="asesoresComerciales3" item-title="nombre" item-value="id"
                  label="Asesor comercial" density="compact" variant="outlined" clearable
                  :loading="asesoresLoading" prepend-inner-icon="mdi-account-tie"
                  @update:model-value="onAsesorCrearChange"
                />
                <v-autocomplete
                  v-else-if="crearDialog.form.tipoAsesor === 'CONVENIO'"
                  v-model="crearDialog.form.asesorId"
                  :items="asesoresConvenio3" item-title="nombre" item-value="id"
                  label="Asesor convenio" density="compact" variant="outlined" clearable
                  :loading="asesoresLoading" prepend-inner-icon="mdi-handshake"
                />
              </v-col>

              <v-col cols="12" md="6"
                v-if="crearDialog.form.tipoAsesor === 'COMERCIAL'"
                class="mt-1">
                <v-autocomplete
                  v-model="crearDialog.form.convenioId"
                  :items="crearDialog.conveniosParaCrear"
                  item-title="nombre" item-value="id"
                  label="Convenio (opcional)"
                  density="compact" variant="outlined" clearable
                  :loading="crearDialog.conveniosCrearLoading"
                  prepend-inner-icon="mdi-handshake"
                  :disabled="!crearDialog.form.asesorId"
                  :placeholder="!crearDialog.form.asesorId
                    ? 'Selecciona primero el asesor'
                    : crearDialog.conveniosParaCrear.length === 0
                    ? 'Sin convenios asignados'
                    : 'Todos sus convenios'"
                />
              </v-col>

              <v-col cols="12" class="mt-2">
                <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">VALORES</div>
              </v-col>
              <v-col cols="5">
                <v-text-field
                  v-model="crearDialog.form.montoAsesor"
                  label="💼 Dateo (asesor)"
                  type="number" min="0"
                  density="compact" variant="outlined" prefix="$"
                />
              </v-col>
              <v-col cols="5">
                <v-text-field
                  v-model="crearDialog.form.montoConvenio"
                  label="🏢 Incentivo (convenio)"
                  type="number" min="0"
                  density="compact" variant="outlined" prefix="$"
                />
              </v-col>
              <v-col cols="2" class="d-flex align-center justify-center">
                <div class="text-center">
                  <div class="text-caption text-medium-emphasis">Total</div>
                  <div class="text-body-2 font-weight-bold text-primary">
                    {{ formatCOP(
                      (Number(crearDialog.form.montoAsesor) || 0) +
                      (Number(crearDialog.form.montoConvenio) || 0)
                    ) }}
                  </div>
                </div>
              </v-col>

              <v-col cols="12" class="mt-0 pt-0">
                <v-checkbox
                  v-model="crearDialog.form.esAvance"
                  label="🏷️ Es avance (incentivo cobrado como descuento en factura)"
                  density="compact" hide-details color="purple"
                />
              </v-col>

              <v-col cols="12" class="mt-1">
                <v-autocomplete
                  v-model="crearDialog.form.descuentoId"
                  :items="allDescuentos" item-title="nombre" item-value="id"
                  label="🏷️ Descuento aplicado (opcional)"
                  density="compact" variant="outlined" clearable
                  :loading="descuentosLoading"
                  prepend-inner-icon="mdi-tag-text" hide-details
                >
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #append>
                        <v-chip size="x-small" variant="tonal" color="orange">
                          {{ item.raw.codigo }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </template>
                  <template #selection="{ item }">
                    {{ item.raw.nombre }}
                    <v-chip size="x-small" class="ml-2" variant="tonal" color="orange">
                      {{ item.raw.codigo }}
                    </v-chip>
                  </template>
                </v-autocomplete>
              </v-col>

              <v-col cols="12" class="mt-2">
                <v-textarea
                  v-model="crearDialog.form.observacionDateo"
                  label="Observación del dateo (opcional)"
                  variant="outlined" density="compact" rows="2"
                  prepend-inner-icon="mdi-note-text" clearable hide-details
                  placeholder="Escribe una observación..."
                />
              </v-col>

            </v-row>
          </template>

        </v-card-text>

        <v-divider />
        <v-card-actions class="px-5 py-3">
          <v-btn variant="text" size="small" :disabled="crearDialog.loading"
            @click="crearDialog.visible = false">
            Cancelar
          </v-btn>
          <v-btn v-if="crearDialog.step === 2" variant="text" size="small"
            :disabled="crearDialog.loading" prepend-icon="mdi-arrow-left"
            @click="volverABuscarTurno">
            Volver
          </v-btn>
          <v-spacer />
          <v-btn
            v-if="crearDialog.step === 2"
            color="success" variant="elevated" size="small"
            prepend-icon="mdi-content-save"
            :loading="crearDialog.loading"
            :disabled="!crearDialog.turnoSeleccionado"
            @click="guardarCreacion"
          >
            Crear comisión
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3000" :color="snack.color">{{ snack.text }}</v-snackbar>
</v-container>
</template>
<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  listComisiones,
  getComision,
  aprobarComision,
  pagarComision,
  anularComision,
  pagarMasivoComisiones,
  getResumenPorAsesor,
  getResumenComisiones,
  patchComisionEditar,
  listConveniosDeAsesor,
  listAgentesCaptacion,
  listConvenios,
  listDescuentos,
  formatCOP,
  listMetasMensuales,
  buscarTurnosParaComision,
  createComision,
  type ComisionListItem,
  type ComisionDetail,
  type ComisionEstado,
  type MetaMensualRow,
  type TurnoLight,
  type ConvenioItem,
  type TurnoParaComision,
  type ResumenAsesorItem,
  type ResumenComisionesResponse,
} from '@/services/comisionesService'
import { createComprobantes, type ComprobantePago as ComprobantePagoDto } from '@/services/comprobantesService'
import { ClientesService, type ClienteDetalle } from '@/services/clientes_service'

/* ── Extended types ── */
interface ComisionListItemExtended extends ComisionListItem {
  monto_asesor?: number | null
  monto_convenio?: number | null
  es_avance?: boolean | null
  base?: number | null
  descuento_monto_aplicado?: number | null
  tipo_vehiculo?: 'MOTO' | 'VEHICULO' | null
  _selectable?: boolean
}

interface ComisionDetailExtended extends ComisionDetail {
  es_avance?: boolean | null
  base?: number | null
  descuento_monto_aplicado?: number | null
  tipo_vehiculo?: 'MOTO' | 'VEHICULO' | null
}

interface MetaMensualResumen extends MetaMensualRow {
  meta_global_rtm?: number | null
  porcentaje_comision?: number | null
}

interface PrintGroup {
  key: string
  nombre: string
  medioPago: string | null
  telefono: string | null
  esConvenio: boolean
  items: ComisionListItemExtended[]
  motosCount: number
  vehiculosCount: number
  totalIncentivo: number
  totalDateo: number
}

interface ConfirmComprobanteGroup {
  key: string
  nombre: string
  motosCount: number
  vehiculosCount: number
  totalDateo: number
  totalIncentivo: number
  esConvenio: boolean
  beneficiarioId: number | null
  medioPago: string | null
  telefono: string | null
  comisionIds: number[]
  placas: string[]
}

/* ── Estado general ── */
const activeTab = ref<'detalle' | 'metas'>('detalle')
const showFilters = ref(true)

const filters = ref<{
  desde: string
  hasta: string
  asesorId: number | null
  convenioId: number | null
  estado: ComisionEstado | ''
  tipoVehiculo: 'MOTO' | 'VEHICULO' | ''
  descuentoCodigo: string
  tipoAsesor: '' | 'ASESOR_COMERCIAL' | 'ASESOR_CONVENIO' | 'CONVENIO'
  tipoCaptacion: '' | 'NUEVO_DIRECTO' | 'CONVENIO'
  placa: string
}>({
  desde: '',
  hasta: '',
  asesorId: null,
  convenioId: null,
  estado: '',
  tipoVehiculo: '',
  descuentoCodigo: '',
  tipoAsesor: '',
  tipoCaptacion: '',
  placa: '',
})

const activeFiltersCount = computed(() =>
  [filters.value.desde, filters.value.hasta, filters.value.asesorId, filters.value.convenioId,
   filters.value.estado, filters.value.tipoVehiculo, filters.value.descuentoCodigo]
   .filter(Boolean).length
)

/* ── Scroll horizontal sincronizado (barra arriba + tabla ancha) ── */
const scrollWrapper = ref<HTMLDivElement | null>(null)
const scrollTop = ref<HTMLDivElement | null>(null)
const scrollContent = ref<HTMLDivElement | null>(null)
const innerWidth = ref(1400)

function syncScroll(source: 'top' | 'content') {
  if (!scrollTop.value || !scrollContent.value) return
  if (source === 'top') {
    scrollContent.value.scrollLeft = scrollTop.value.scrollLeft
  } else {
    scrollTop.value.scrollLeft = scrollContent.value.scrollLeft
  }
}

onMounted(() => {
  scrollTop.value?.addEventListener('scroll', () => syncScroll('top'))
})

/* ── Tabla detalle ── */
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Estado', key: 'estado', sortable: true },
  { title: 'Vehículo', key: 'tipo_vehiculo', sortable: false },
  { title: 'Tipo cliente', key: 'tipo_cliente', sortable: false },
  { title: 'Turno', key: 'turno', sortable: false },
{ title: 'Placa', key: 'placa', sortable: false },
  { title: 'Asesor', key: 'asesor', sortable: false },
  { title: 'Convenio', key: 'convenio', sortable: false },
  { title: 'Descuento', key: 'descuento', sortable: false },
  { title: 'Dateo', key: 'valor_unitario', sortable: true },
  { title: 'Incentivo', key: 'valor_cliente', sortable: false },
  { title: 'Total', key: 'valor_total', sortable: true },
  { title: 'Fecha', key: 'generado_at', sortable: true },
  { title: 'Rep General', key: 'rep_general', sortable: false },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

const rows = ref<ComisionListItemExtended[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<Array<{ key: string; order: 'asc' | 'desc' }>>([{ key: 'id', order: 'desc' }])
const loading = ref(false)

const selectedIds = ref<ComisionListItemExtended[]>([])
const selectedItemsData = computed<ComisionListItemExtended[]>(() => selectedIds.value)

const filteredRows = computed<ComisionListItemExtended[]>(() => {
  let items = rows.value

  // NOTA: el filtro por descuentoCodigo sigue siendo client-side sobre la
  // página ya paginada (bug conocido, pendiente aparte — no incluido en este
  // lote). El filtro por tipoAsesor ya se envía al backend (ver loadItems),
  // así que rows.value ya viene filtrado por tipo y no hay que repetirlo acá.
  if (filters.value.descuentoCodigo) {
    const codigo = filters.value.descuentoCodigo.toUpperCase()
    items = items.filter((item) => item.descuento?.codigo?.toUpperCase() === codigo)
  }

  return items.map((item) => ({
    ...item,
    _selectable: item.estado === 'PENDIENTE' || item.estado === 'APROBADA',
  }))
})

const totalSeleccionado = computed(() =>
  selectedItemsData.value.reduce((acc, i) => acc + calcTotalItem(i), 0)
)

const canAprobarSelected = computed(() =>
  selectedItemsData.value.some((i) => i.estado === 'PENDIENTE')
)
const canPagarSelected = computed(() =>
  selectedItemsData.value.some((i) => i.estado === 'PENDIENTE' || i.estado === 'APROBADA')
)

/* ── Resumen agregado (tarjetas KPI: tipo de captación / estado) ──
   A propósito, esta llamada NUNCA incluye filters.value.estado: las
   tarjetas (tipo de captación, por estado, total generado) deben mostrar
   siempre los números reales completos, sin colapsar cuando el usuario
   hace clic en una tarjeta de estado (eso solo filtra la tabla de abajo,
   vía filtrarPorEstadoComision -> applyFilters -> loadItems). */
const resumenBucketVacio = { cantidad: 0, monto: 0 }
const resumenComisiones = ref<ResumenComisionesResponse | null>(null)
const resumenComisionesLoading = ref(false)

async function loadResumen() {
  resumenComisionesLoading.value = true
  try {
    resumenComisiones.value = await getResumenComisiones({
      desde: filters.value.desde || undefined,
      hasta: filters.value.hasta || undefined,
      asesorId: filters.value.asesorId || undefined,
      convenioId: filters.value.convenioId || undefined,
      tipoVehiculo: (filters.value.tipoVehiculo as 'MOTO' | 'VEHICULO') || undefined,
      placa: filters.value.placa || undefined,
      tipoAsesor: filters.value.tipoAsesor || undefined,
    })
  } catch {
    resumenComisiones.value = null
  } finally {
    resumenComisionesLoading.value = false
  }
}

const resumenPorTipo = computed(
  () =>
    resumenComisiones.value?.por_tipo_captacion ?? {
      nuevo_directo: resumenBucketVacio,
      convenio: resumenBucketVacio,
      total: resumenBucketVacio,
    }
)
const resumenPorDescuentos = computed(
  () =>
    resumenComisiones.value?.resumen_descuentos ?? {
      total: { cantidad: 0, monto: 0 },
      por_tipo: [] as { descuento_id: number; nombre: string; cantidad: number; monto: number }[],
    }
)
const resumenPorEstadoComisiones = computed(
  () =>
    resumenComisiones.value?.por_estado ?? {
      PENDIENTE: resumenBucketVacio,
      APROBADA: resumenBucketVacio,
      PAGADA: resumenBucketVacio,
      ANULADA: resumenBucketVacio,
      total: resumenBucketVacio,
    }
)

// Suma Pendiente+Aprobada+Pagada (excluye Anulada) — resumenComisiones ya no
// depende de filters.value.estado, así que esto tampoco cambia con el clic.
const totalGeneradoSinAnuladas = computed(() => {
  const r = resumenComisiones.value?.por_estado
  if (!r) return { cantidad: 0, monto: 0 }
  return {
    cantidad: r.PENDIENTE.cantidad + r.APROBADA.cantidad + r.PAGADA.cantidad,
    monto: r.PENDIENTE.monto + r.APROBADA.monto + r.PAGADA.monto,
  }
})

function filtrarPorEstadoComision(estado: ComisionEstado) {
  filters.value.estado = estado
  applyFilters()
}

// Igual que filtrarPorEstadoComision: filtra la tabla/acordeón de abajo,
// pero las tarjetas de arriba (resumenPorTipo, resumenPorEstadoComisiones,
// totalGeneradoSinAnuladas) no cambian porque loadResumen() nunca envía
// tipoCaptacion (ver nota en loadResumen).
function filtrarPorTipoCaptacion(tipo: 'NUEVO_DIRECTO' | 'CONVENIO') {
  filters.value.tipoCaptacion = filters.value.tipoCaptacion === tipo ? '' : tipo
  applyFilters()
}

/* ── Resumen por asesor (lista expandible, pagos masivos) ── */
const resumenPorAsesorList = ref<ResumenAsesorItem[]>([])
const resumenPorAsesorLoading = ref(false)
const panelAbierto = ref<string | null>(null)

interface PanelDetalleState {
  loading: boolean
  rows: ComisionListItemExtended[]
  /** true si se alcanzó PANEL_DETALLE_MAX_PAGINAS sin agotar el resultado real */
  truncado: boolean
  totalReal: number
}
const panelDetalle = ref<PanelDetalleState>({ loading: false, rows: [], truncado: false, totalReal: 0 })
const panelSeleccionIds = ref<ComisionListItemExtended[]>([])

function panelKey(item: ResumenAsesorItem): string {
  // Agrupado: en los tabs de asesor la clave es el asesor; en CONVENIO,
  // como una fila ahora puede combinar varios asesores, la clave es el convenio.
  return filters.value.tipoAsesor === 'CONVENIO' ? `cv-${item.convenio_id}` : `as-${item.asesor_id}`
}
function nombreItem(item: ResumenAsesorItem): string {
  return filters.value.tipoAsesor === 'CONVENIO' ? (item.convenio_nombre ?? '—') : item.asesor_nombre
}

/**
 * El backend agrupa por (asesor, convenio, ...), así que un mismo asesor con
 * comisiones de varios convenios (o con y sin convenio) llega como varias
 * filas. Acá se consolida en una sola fila por asesor (o por convenio en el
 * tab CONVENIO, donde varios asesores pueden aportar al mismo convenio).
 */
const asesoresAgrupados = computed<ResumenAsesorItem[]>(() => {
  const map = new Map<string, ResumenAsesorItem>()

  for (const item of resumenPorAsesorList.value) {
    const key = panelKey(item)
    const existing = map.get(key)
    if (existing) {
      existing.pendientes += item.pendientes
      existing.aprobadas += item.aprobadas
      existing.pagadas += item.pagadas
      existing.total_por_pagar += item.total_por_pagar
      existing.total_pendiente += item.total_pendiente
      existing.total_aprobada += item.total_aprobada
    } else {
      map.set(key, { ...item })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total_por_pagar - a.total_por_pagar)
})

async function cargarResumenPorAsesor() {
  const tab = filters.value.tipoAsesor
  if (!tab) {
    resumenPorAsesorList.value = []
    return
  }
  resumenPorAsesorLoading.value = true
  panelAbierto.value = null
  try {
    const resp = await getResumenPorAsesor({
      tipo: tab,
      fechaInicio: filters.value.desde || undefined,
      fechaFin: filters.value.hasta || undefined,
      estado: filters.value.estado || undefined,
      tipoVehiculo: filters.value.tipoVehiculo || undefined,
      placa: filters.value.placa || undefined,
      asesorId: filters.value.asesorId || undefined,
      convenioId: filters.value.convenioId || undefined,
      tipoCaptacion: filters.value.tipoCaptacion || undefined,
    })
    resumenPorAsesorList.value = resp.asesores
  } catch (err) {
    resumenPorAsesorList.value = []
    snack.text = 'Error al cargar el resumen de asesores'
    snack.color = 'error'
    snack.show = true
  } finally {
    resumenPorAsesorLoading.value = false
  }
}

// Tope de seguridad del loop multi-página: 20 páginas * 100 = 2000 filas.
// Si se alcanza sin agotar el resultado real, se marca panelDetalle.truncado
// para que el template avise y bloquee "Pagar todas" (ver PanelDetalleState).
const PANEL_DETALLE_MAX_PAGINAS = 20
const PANEL_DETALLE_PER_PAGE = 100

async function cargarPanelDetalle(item: ResumenAsesorItem) {
  panelDetalle.value = { loading: true, rows: [], truncado: false, totalReal: 0 }
  panelSeleccionIds.value = []
  try {
    // ASESOR_COMERCIAL/ASESOR_CONVENIO: la fila es por asesor (puede abarcar
    // varios convenios) -> filtrar solo por asesorId, sin acotar convenio.
    // CONVENIO: la fila es por convenio (puede abarcar varios asesores) ->
    // filtrar solo por convenioId, sin acotar asesor.
    const baseQuery: Record<string, unknown> = {
      perPage: PANEL_DETALLE_PER_PAGE,
      desde: filters.value.desde || undefined,
      hasta: filters.value.hasta || undefined,
      estado: filters.value.estado || undefined,
      tipoVehiculo: filters.value.tipoVehiculo || undefined,
      placa: filters.value.placa || undefined,
      tipoCaptacion: filters.value.tipoCaptacion || undefined,
    }
    if (filters.value.tipoAsesor === 'CONVENIO') {
      baseQuery.convenioId = item.convenio_id ?? undefined
    } else {
      baseQuery.asesorId = item.asesor_id
    }

    // Trae TODAS las páginas (el backend limita perPage a 100 por request),
    // no solo la primera — "Pagar todas" depende de tener el set completo,
    // no solo lo que entra en una página.
    let acumulado: ComisionListItem[] = []
    let total = Infinity
    let pagina = 1
    let truncado = false
    while (acumulado.length < total && pagina <= PANEL_DETALLE_MAX_PAGINAS) {
      const res = await listComisiones({ ...baseQuery, page: pagina } as any)
      acumulado = acumulado.concat(res.data)
      total = res.total
      if (res.data.length === 0) break
      pagina++
    }
    if (acumulado.length < total) truncado = true

    if (truncado) {
      snack.text = `Se muestran las primeras ${acumulado.length} comisiones de ${total} totales — usa filtros más específicos (fechas, estado) para ver el resto.`
      snack.color = 'warning'
      snack.show = true
    }

    panelDetalle.value = {
      loading: false,
      rows: acumulado.map((r) => ({ ...r, _selectable: r.estado === 'PENDIENTE' || r.estado === 'APROBADA' })),
      truncado,
      totalReal: total,
    }
  } catch (err) {
    panelDetalle.value = { loading: false, rows: [], truncado: false, totalReal: 0 }
    snack.text = 'Error al cargar el detalle del asesor'
    snack.color = 'error'
    snack.show = true
  }
}

watch(panelAbierto, (key) => {
  if (!key) {
    panelDetalle.value = { loading: false, rows: [], truncado: false, totalReal: 0 }
    panelSeleccionIds.value = []
    return
  }
  const item = asesoresAgrupados.value.find((i) => panelKey(i) === key)
  if (item) cargarPanelDetalle(item)
})

function onCambiarTabTipo() {
  panelAbierto.value = null
  page.value = 1
  loadItems()
  loadResumen()
  if (filters.value.tipoAsesor) cargarResumenPorAsesor()
  else resumenPorAsesorList.value = []
}

const panelPuedeAprobar = computed(() => panelSeleccionIds.value.some((i) => i.estado === 'PENDIENTE'))
const panelPuedePagar = computed(() =>
  panelSeleccionIds.value.some((i) => i.estado === 'PENDIENTE' || i.estado === 'APROBADA')
)
const panelSeleccionTotal = computed(() => panelSeleccionIds.value.reduce((acc, i) => acc + calcTotalItem(i), 0))

function panelConfirmarAprobar(item: ResumenAsesorItem) {
  const elegibles = panelSeleccionIds.value.filter((i) => i.estado === 'PENDIENTE')
  abrirDialogAccionMasiva(
    'APROBAR',
    elegibles.map((i) => i.id),
    elegibles.reduce((acc, i) => acc + calcTotalItem(i), 0),
    nombreItem(item)
  )
}
function panelConfirmarPagar(item: ResumenAsesorItem) {
  const elegibles = panelSeleccionIds.value.filter((i) => i.estado === 'PENDIENTE' || i.estado === 'APROBADA')
  abrirDialogAccionMasiva(
    'PAGAR',
    elegibles.map((i) => i.id),
    elegibles.reduce((acc, i) => acc + calcTotalItem(i), 0),
    nombreItem(item)
  )
}

async function pagarTodasDelPanel(item: ResumenAsesorItem) {
  panelAbierto.value = panelKey(item)
  await cargarPanelDetalle(item)
  // No pagar "todas" si el fetch se truncó (tope de seguridad de páginas):
  // pagar solo lo cargado sería pagar de menos sin que el usuario lo note.
  if (panelDetalle.value.truncado) {
    snack.text = `"Pagar todas" se bloqueó: solo se cargaron ${panelDetalle.value.rows.length} de ${panelDetalle.value.totalReal} comisiones de este asesor. Aplica filtros más específicos (fechas, estado) para reducir el volumen antes de pagar en masa.`
    snack.color = 'error'
    snack.show = true
    return
  }
  const elegibles = panelDetalle.value.rows.filter((r) => r.estado === 'PENDIENTE' || r.estado === 'APROBADA')
  panelSeleccionIds.value = elegibles
  panelConfirmarPagar(item)
}

const headersPanel = [
  { title: 'ID', key: 'id' },
  { title: 'Estado', key: 'estado' },
  { title: 'Placa', key: 'placa' },
  { title: 'Tipo Vehículo', key: 'tipo_vehiculo' },
  { title: 'Tipo Cliente', key: 'tipo_cliente' },
  { title: 'Convenio', key: 'convenio' },
  { title: 'Monto', key: 'monto' },
  { title: 'Fecha', key: 'generado_at' },
]

/* ── Tabla metas ── */
const metaHeaders = [
  { title: 'Asesor', key: 'asesor' },
  { title: 'RTM Motos', key: 'rtm_motos' },
  { title: 'RTM Vehículos', key: 'rtm_vehiculos' },
  { title: 'Total RTM', key: 'total_rtm' },
  { title: 'Meta facturación RTM', key: 'meta_rtm' },
  { title: '% Avance', key: 'avance' },
  { title: 'Faltante ($)', key: 'faltante' },
  { title: '% Comisión Meta', key: 'porcentaje_comision_meta' },
  { title: 'Comisión estimada', key: 'comision_estimada' },
]

const metaRows = ref<MetaMensualRow[]>([])
const metaLoading = ref(false)
const valorRtmMoto = ref(126100)
const valorRtmVehiculo = ref(208738)

/* ── Catálogos ── */
const asesoresLoading = ref(false)
const conveniosLoading = ref(false)
const allAsesores = ref<{ id: number; nombre: string; tipo: string; medioPago?: string | null; telefono?: string | null }[]>([])
const conveniosItems = ref<ConvenioItem[]>([])



const agentesVisiblesFiltro = computed(() => {
  const tipo = filters.value.tipoAsesor
  if (!tipo || tipo === 'CONVENIO') return allAsesores.value
  return allAsesores.value.filter((a) => {
    const u = (a.tipo ?? '').toUpperCase()
    if (tipo === 'ASESOR_COMERCIAL') return !u.includes('CONVENIO')
    if (tipo === 'ASESOR_CONVENIO') return u.includes('CONVENIO')
    return true
  })
})

const conveniosFiltroComercial = ref<{ id: number; nombre: string }[]>([])
const conveniosFiltroLoading = ref(false)

async function onFiltroAsesorChange(asesorId: number | null) {
  filters.value.convenioId = null
  conveniosFiltroComercial.value = []
  if (asesorId && filters.value.tipoAsesor === 'ASESOR_COMERCIAL') {
    conveniosFiltroLoading.value = true
    try {
      conveniosFiltroComercial.value = await listConveniosDeAsesor(asesorId)
    } finally {
      conveniosFiltroLoading.value = false
    }
  }
  page.value = 1
  loadItems()
  loadResumen()
  if (filters.value.tipoAsesor) cargarResumenPorAsesor()
}

const descuentosLoading = ref(false)
const descuentosItems = ref<{ codigo: string; label: string }[]>([])
const allDescuentos = ref<{ id: number; codigo: string; nombre: string }[]>([])
const conveniosAsignadosEdit = ref<{ id: number; nombre: string }[]>([])
const conveniosEditLoading = ref(false)

const estadoItems = [
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Aprobada', value: 'APROBADA' },
  { label: 'Pagada', value: 'PAGADA' },
  { label: 'Anulada', value: 'ANULADA' },
]

const tipoVehiculoItems = [
  { label: '🏍️ Moto', value: 'MOTO' },
  { label: '🚗 Vehículo', value: 'VEHICULO' },
]

const totalPagina = computed(() => filteredRows.value.reduce((acc, r) => acc + calcTotalItem(r), 0))
const pendientesPagina = computed(() => filteredRows.value.filter((r) => r.estado === 'PENDIENTE').length)
const pagadasPagina = computed(() => filteredRows.value.filter((r) => r.estado === 'PAGADA').length)

/* ── Print dialog ── */
interface PrintDialogState {
  visible: boolean
  items: ComisionListItemExtended[]
  groups: PrintGroup[]
  fechaGeneracion: string
  estadoPagado: string
  comprobantes: ComprobantePagoDto[]
  totalMotos: number
  totalVehiculos: number
  totalGeneral: number
  totalDateoGlobal: number
  totalIncentivoGlobal: number
}

const printDialog = ref<PrintDialogState>({
  visible: false,
  items: [],
  groups: [],
  fechaGeneracion: '',
  estadoPagado: '',
  comprobantes: [],
  totalMotos: 0,
  totalVehiculos: 0,
  totalGeneral: 0,
  totalDateoGlobal: 0,
  totalIncentivoGlobal: 0,
})

/* ── Confirm comprobante ── */
const confirmComprobante = ref<{
  visible: boolean
  loading: boolean
  groups: ConfirmComprobanteGroup[]
  totalGeneral: number
  totalComisiones: number
  notas: string
}>({
  visible: false,
  loading: false,
  groups: [],
  totalGeneral: 0,
  totalComisiones: 0,
  notas: '',
})

/* ── Helpers ── */
function tipoClienteLabel(turno?: TurnoLight | null): string {
  if (!turno) return '—'
  if (turno.es_recuperacion) return '💛 Recuperación'
  if (turno.es_recurrente) return '🔄 Recurrente'
  return '🆕 Nuevo'
}

function tipoClienteColor(turno?: TurnoLight | null): string {
  if (!turno) return 'grey'
  if (turno.es_recuperacion) return 'amber-darken-2'
  if (turno.es_recurrente) return 'warning'
  return 'success'
}



function calcTotalItem(item: ComisionListItemExtended): number {
  if (item.monto_asesor != null && item.monto_convenio != null) {
    return Number(item.monto_asesor) + Number(item.monto_convenio)
  }
  return item.valor_total || 0
}

function calcTotalDetalle(item: ComisionDetailExtended | null): number {
  if (!item) return 0
  if (item.monto_asesor != null && item.monto_convenio != null) {
    return Number(item.monto_asesor) + Number(item.monto_convenio)
  }
  return item.valor_total || 0
}

function estadoColor(e: ComisionEstado) {
  switch (e) {
    case 'PENDIENTE': return 'warning'
    case 'APROBADA': return 'info'
    case 'PAGADA': return 'success'
    case 'ANULADA': return 'error'
    default: return undefined
  }
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(d)
}
/* ── Editar comisión ── */
const editDialog = ref<{
  visible: boolean
  loading: boolean
  item: ComisionListItemExtended | null
  observacionOriginal: string
  form: {
    tipoAsesor: '' | 'COMERCIAL' | 'CONVENIO'
    asesorId: number | null
    convenioId: number | null
    montoAsesor: string
    montoConvenio: string
    tipoCliente: 'NUEVO' | 'RECURRENTE' | 'RECUPERACION'
    descuentoId: number | null
    observacionDateo: string
  }
}>({
  visible: false,
  loading: false,
  item: null,
  observacionOriginal: '',
  form: {
    tipoAsesor: '',
    asesorId: null,
    convenioId: null,
    montoAsesor: '',
    montoConvenio: '',
    tipoCliente: 'NUEVO',
    descuentoId: null,
    observacionDateo: '',
  },
})

// Asesores comerciales para el select del diálogo
const asesoresComerciales2 = computed(() =>
  allAsesores.value.filter(a => {
    const t = (a.tipo ?? '').toUpperCase()
    return !t.includes('CONVENIO')
  })
)

// Asesores convenio para el select del diálogo
const asesoresConvenio2 = computed(() =>
  allAsesores.value.filter(a => {
    const t = (a.tipo ?? '').toUpperCase()
    return t.includes('CONVENIO')
  })
)

// Convenios disponibles en el diálogo según tipo
const conveniosParaEdicion = computed(() => {
  if (editDialog.value.form.tipoAsesor === 'COMERCIAL') return conveniosAsignadosEdit.value
  if (editDialog.value.form.tipoAsesor === 'CONVENIO') return conveniosItems.value
  return []
})

function inferTipoAsesor(item: ComisionListItemExtended): '' | 'COMERCIAL' | 'CONVENIO' {
  if (!item.asesor) return ''
  const t = (item.asesor.tipo ?? '').toUpperCase()
  if (t.includes('CONVENIO')) return 'CONVENIO'
  return 'COMERCIAL'
}

function inferTipoCliente(
  turno?: { es_recurrente?: boolean; es_recuperacion?: boolean } | null
): 'NUEVO' | 'RECURRENTE' | 'RECUPERACION' {
  if (turno?.es_recuperacion) return 'RECUPERACION'
  if (turno?.es_recurrente) return 'RECURRENTE'
  return 'NUEVO'
}

async function cargarConveniosDeAsesor(asesorId: number | null) {
  conveniosAsignadosEdit.value = []
  if (!asesorId) return
  conveniosEditLoading.value = true
  try {
    conveniosAsignadosEdit.value = await listConveniosDeAsesor(asesorId)
  } finally {
    conveniosEditLoading.value = false
  }
}

function onTipoAsesorChange() {
  // Al cambiar tipo, resetear asesor y convenio
  editDialog.value.form.asesorId = null
  editDialog.value.form.convenioId = null
  conveniosAsignadosEdit.value = []
}

async function onAsesorEditChange(asesorId: number | null) {
  editDialog.value.form.convenioId = null
  conveniosAsignadosEdit.value = []
  if (!asesorId) return

  if (editDialog.value.form.tipoAsesor === 'COMERCIAL') {
    // Cargar convenios asignados a este comercial
    await cargarConveniosDeAsesor(asesorId)
  } else if (editDialog.value.form.tipoAsesor === 'CONVENIO') {
    // Para asesor convenio el backend asigna el convenio por nombre,
    // no se muestra al usuario ni se envía desde el frontend
    editDialog.value.form.convenioId = null
  }
}

async function abrirEditar(item: ComisionListItemExtended) {
  const tipoAsesor = inferTipoAsesor(item)
  const obsOriginal = (item as any).dateo_observacion ?? ''

  const descuentoActual = item.descuento?.id
    ?? allDescuentos.value.find(d => d.codigo === item.descuento?.codigo)?.id
    ?? null

  editDialog.value = {
    visible: true,
    loading: false,
    item,
    observacionOriginal: obsOriginal,
    form: {
      tipoAsesor,
      asesorId: item.asesor?.id ?? null,
      convenioId: item.convenio?.id ?? null,
      montoAsesor: String(item.monto_asesor ?? item.valor_unitario ?? 0),
      montoConvenio: String(item.monto_convenio ?? item.valor_cliente ?? 0),
      tipoCliente: inferTipoCliente(item.turno),
      descuentoId: descuentoActual,
      observacionDateo: obsOriginal,
    },
  }

  // Cargar convenios si es comercial con asesor ya asignado
  if (tipoAsesor === 'COMERCIAL' && item.asesor?.id) {
    await cargarConveniosDeAsesor(item.asesor.id)
  }
}

async function guardarEdicion() {
  const { item, form } = editDialog.value
  if (!item) return
  editDialog.value.loading = true
  try {
    await patchComisionEditar(item.id, {
      asesor_id: form.asesorId,
      convenio_id: form.convenioId,
      monto_asesor: Number(form.montoAsesor) || 0,
      monto_convenio: Number(form.montoConvenio) || 0,
      tipo_cliente: form.tipoCliente,
      descuento_id: form.descuentoId,
      dateo_observacion: form.observacionDateo.trim() || null,
    })
    editDialog.value.visible = false
    await loadItems()
  } finally {
    editDialog.value.loading = false
  }
}
/* ── Carga de datos ── */
async function loadCatalogos() {
  asesoresLoading.value = true
  conveniosLoading.value = true
  descuentosLoading.value = true
  try {
    const [asesores, convenios, descuentos] = await Promise.all([
      listAgentesCaptacion(),
      listConvenios(),
      listDescuentos(),
    ])
    allAsesores.value = asesores
    conveniosItems.value = convenios
    descuentosItems.value = descuentos.map((d) => ({ codigo: d.codigo, label: d.nombre }))
    allDescuentos.value = descuentos.map((d) => ({ id: d.id, codigo: d.codigo, nombre: d.nombre }))
  } finally {
    asesoresLoading.value = false
    conveniosLoading.value = false
    descuentosLoading.value = false
  }
}

async function loadItems() {
  loading.value = true
  try {
    const sort = Array.isArray(sortBy.value) && sortBy.value[0]
      ? sortBy.value[0]
      : { key: 'id', order: 'desc' as const }

    const res = await listComisiones({
  page: page.value,
  perPage: itemsPerPage.value,
  desde: filters.value.desde || undefined,
  hasta: filters.value.hasta || undefined,
  asesorId: filters.value.asesorId || undefined,
  convenioId: filters.value.convenioId || undefined,
  estado: filters.value.estado || undefined,
  tipoVehiculo: (filters.value.tipoVehiculo as 'MOTO' | 'VEHICULO') || undefined,
  placa: filters.value.placa || undefined,
  tipoAsesor: filters.value.tipoAsesor || undefined,
  tipoCaptacion: filters.value.tipoCaptacion || undefined,
  sortBy: sort.key,
  order: sort.order,
})
    rows.value = res.data as ComisionListItemExtended[]
    totalItems.value = res.total
  } catch {
    rows.value = []
    totalItems.value = 0
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 1
  selectedIds.value = []
  loadItems()
  loadResumen()
  if (filters.value.tipoAsesor) cargarResumenPorAsesor()
}

async function loadMetas() {
  metaLoading.value = true
  try {
    let mes: string
    if (filters.value.desde) {
      mes = filters.value.desde.substring(0, 7)
    } else {
      const now = new Date()
      mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }
    const res = await listMetasMensuales({ mes, asesorId: filters.value.asesorId || undefined })
    let data = res.data as MetaMensualRow[]
    data = data.filter((r) => !(r.asesor_tipo?.toUpperCase()?.includes('CONVENIO')))
    metaRows.value = data

    const rowMoto = metaRows.value.find((r) => r.valor_rtm_moto && r.valor_rtm_moto > 0)
    if (rowMoto?.valor_rtm_moto) valorRtmMoto.value = rowMoto.valor_rtm_moto
    const rowVehiculo = metaRows.value.find((r) => r.valor_rtm_vehiculo && r.valor_rtm_vehiculo > 0)
    if (rowVehiculo?.valor_rtm_vehiculo) valorRtmVehiculo.value = rowVehiculo.valor_rtm_vehiculo
  } catch {
    metaRows.value = []
  } finally {
    metaLoading.value = false
  }
}

function reload() {
  if (activeTab.value === 'detalle') {
    page.value = 1
    loadItems()
    loadResumen()
    if (filters.value.tipoAsesor) cargarResumenPorAsesor()
  } else {
    loadMetas()
  }
}

function resetFilters() {
  filters.value = { desde: '', hasta: '', asesorId: null, convenioId: null, estado: '', tipoVehiculo: '', descuentoCodigo: '', tipoAsesor: '', tipoCaptacion: '', placa: '' }
  conveniosFiltroComercial.value = []
  selectedIds.value = []
  reload()
}

/* ── Metas helpers ── */
function calcTotalRtm(item: MetaMensualRow): number {
  return (item.rtm_motos || 0) + (item.rtm_vehiculos || 0)
}

function getMetaDinero(item: MetaMensualRow): number {
  const ext = item as MetaMensualResumen
  const raw = ext.meta_global_rtm ?? item.meta_rtm ?? item.meta_mensual ?? 0
  return Number(raw) || 0
}

function getTotalFacturacion(item: MetaMensualRow): number {
  const backend = item.total_facturacion_global ?? null
  if (backend != null && !Number.isNaN(backend)) return backend
  return (item.rtm_motos || 0) * valorRtmMoto.value + (item.rtm_vehiculos || 0) * valorRtmVehiculo.value
}

function calcAvance(item: MetaMensualRow): number {
  const metaDinero = getMetaDinero(item)
  if (!metaDinero) return 0
  return (getTotalFacturacion(item) / metaDinero) * 100
}

function calcFaltante(item: MetaMensualRow): number {
  const metaDinero = getMetaDinero(item)
  if (!metaDinero) return 0
  const diff = metaDinero - getTotalFacturacion(item)
  return diff > 0 ? diff : 0
}

function calcComisionMeta(item: MetaMensualRow): number {
  const metaDinero = getMetaDinero(item)
  const porcentaje = item.porcentaje_comision_meta ?? (item as MetaMensualResumen).porcentaje_comision ?? 0
  if (!metaDinero || !porcentaje) return 0
  const totalFacturacion = getTotalFacturacion(item)
  if (totalFacturacion < metaDinero) return 0
  return (totalFacturacion * porcentaje) / 100
}

/* ── Diálogos simples ── */
const dialog = ref<{
  visible: boolean; title: string; message: string; color: string; onConfirm: () => void
}>({ visible: false, title: '', message: '', color: 'primary', onConfirm: () => {} })

function openConfirm(title: string, message: string, color: string, onConfirm: () => void) {
  dialog.value = { visible: true, title, message, color, onConfirm }
}

function confirmAprobar(id: number) {
  openConfirm('Aprobar comisión', '¿Confirmas aprobar esta comisión?', 'info', async () => {
    dialog.value.visible = false
    await aprobarComision(id)
    loadItems()
  })
}

function confirmPagar(id: number) {
  openConfirm('Pagar comisión', '¿Confirmas registrar el pago?', 'success', async () => {
    dialog.value.visible = false
    await pagarComision(id)
    loadItems()
  })
}

function confirmAnular(id: number) {
  openConfirm('Anular comisión', '¿Seguro que deseas anularla?', 'error', async () => {
    dialog.value.visible = false
    await anularComision(id)
    loadItems()
  })
}

/* ── Detalle ── */
const detailDialog = ref<{
  visible: boolean
  item: ComisionDetailExtended | null
  loading: boolean
  clienteData: ClienteDetalle | null
  clienteLoading: boolean
}>({
  visible: false,
  item: null,
  loading: false,
  clienteData: null,
  clienteLoading: false,
})
async function verDetalle(item: ComisionListItem) {
  detailDialog.value = {
    visible: true,
    item: item as ComisionDetailExtended,
    loading: true,
    clienteData: null,
    clienteLoading: false,
  }

  // Cargar comisión completa y cliente en paralelo
  const placa = (item as any).turno?.placa ?? null

  const [full] = await Promise.all([
    getComision(item.id),
    placa ? cargarClientePorPlaca(placa) : Promise.resolve(),
  ])

  detailDialog.value.item = full as ComisionDetailExtended
  detailDialog.value.loading = false
}

async function cargarClientePorPlaca(placa: string) {
  detailDialog.value.clienteLoading = true
  try {
    const res = await ClientesService.list({ q: placa, perPage: 1 }) as any
    const clientes = res?.data ?? res ?? []
    const cliente = Array.isArray(clientes) ? clientes[0] : null
    if (cliente?.id) {
      detailDialog.value.clienteData = await ClientesService.detalle(cliente.id) as ClienteDetalle
    }
  } catch {
    detailDialog.value.clienteData = null
  } finally {
    detailDialog.value.clienteLoading = false
  }
}

/* ── Acciones Bulk (pago masivo vía /comisiones/pagar-masivo) ── */
const snack = reactive({ show: false, text: '', color: 'success' })

interface BulkAccionDialogState {
  visible: boolean
  accion: 'APROBAR' | 'PAGAR'
  ids: number[]
  total: number
  nombre: string
  fechaPago: string
  loading: boolean
}
const bulkAccionDialog = ref<BulkAccionDialogState>({
  visible: false,
  accion: 'APROBAR',
  ids: [],
  total: 0,
  nombre: '',
  fechaPago: '',
  loading: false,
})

function abrirDialogAccionMasiva(accion: 'APROBAR' | 'PAGAR', ids: number[], total: number, nombre: string) {
  if (ids.length === 0) return
  bulkAccionDialog.value = {
    visible: true,
    accion,
    ids,
    total,
    nombre,
    fechaPago: new Date().toISOString().slice(0, 10),
    loading: false,
  }
}

const nombreSeleccion = computed(() => {
  const nombres = new Set(selectedItemsData.value.map((i) => i.asesor?.nombre || i.convenio?.nombre || '—'))
  return nombres.size === 1 ? [...nombres][0] : `${nombres.size} beneficiarios`
})

function confirmBulkAprobar() {
  const elegibles = selectedItemsData.value.filter((i) => i.estado === 'PENDIENTE')
  abrirDialogAccionMasiva(
    'APROBAR',
    elegibles.map((i) => i.id),
    elegibles.reduce((acc, i) => acc + calcTotalItem(i), 0),
    nombreSeleccion.value
  )
}

function confirmBulkPagar() {
  const elegibles = selectedItemsData.value.filter((i) => i.estado === 'PENDIENTE' || i.estado === 'APROBADA')
  abrirDialogAccionMasiva(
    'PAGAR',
    elegibles.map((i) => i.id),
    elegibles.reduce((acc, i) => acc + calcTotalItem(i), 0),
    nombreSeleccion.value
  )
}

async function ejecutarAccionMasiva() {
  const { accion, ids, fechaPago, nombre } = bulkAccionDialog.value
  bulkAccionDialog.value.loading = true
  try {
    const resp = await pagarMasivoComisiones({
      ids,
      accion,
      fecha_pago: accion === 'PAGAR' ? fechaPago : undefined,
    })
    const verbo = accion === 'APROBAR' ? 'aprobadas' : 'pagadas'
    snack.text = `${resp.actualizadas} comisiones ${verbo} a ${nombre}`
    snack.color = 'success'
    snack.show = true
    bulkAccionDialog.value.visible = false
    selectedIds.value = []
    panelSeleccionIds.value = []
    panelAbierto.value = null
    await loadItems()
    await cargarResumenPorAsesor()
    await loadResumen()
  } catch (err) {
    snack.text = err instanceof Error ? err.message : 'Error al procesar la acción masiva'
    snack.color = 'error'
    snack.show = true
  } finally {
    bulkAccionDialog.value.loading = false
  }
}

/* ── Comprobante / Print ── */
function buildPrintGroups(items: ComisionListItemExtended[]): PrintGroup[] {
  const groupsMap = new Map<string, PrintGroup>()

  for (const item of items) {
    const esConvenio = !!item.convenio
    const key = esConvenio ? `c-${item.convenio!.id}` : `a-${item.asesor?.id ?? 'sin'}`
    const nombre = item.convenio?.nombre || item.asesor?.nombre || 'Sin asignar'

    if (!groupsMap.has(key)) {
      let medioPago: string | null = null
      let telefono: string | null = null

      if (esConvenio) {
        const metodo = item.convenio?.metodo_pago ?? null
        const numero = item.convenio?.numero_metodo_pago ?? null
        if (metodo && numero) medioPago = `${metodo}: ${numero}`
        else if (numero) medioPago = numero
        else if (metodo) medioPago = metodo
      } else {
        const agenteInfo = item.asesor?.id ? allAsesores.value.find(a => a.id === item.asesor!.id) : null
        medioPago = agenteInfo?.medioPago ?? null
        telefono = agenteInfo?.telefono ?? null
      }

      groupsMap.set(key, { key, nombre, esConvenio, medioPago, telefono, items: [], motosCount: 0, vehiculosCount: 0, totalIncentivo: 0, totalDateo: 0 })
    }

    const g = groupsMap.get(key)!
    g.items.push(item)
    if (item.tipo_vehiculo === 'MOTO') g.motosCount++
    else g.vehiculosCount++
    g.totalIncentivo += Number(item.monto_convenio ?? item.valor_cliente ?? 0)
    g.totalDateo += Number(item.monto_asesor ?? item.valor_unitario ?? 0)
  }

  return Array.from(groupsMap.values())
}

function openPrintPreview(items: ComisionListItemExtended[], estadoPagado?: string, savedComprobantes?: ComprobantePagoDto[]) {
  const groups = buildPrintGroups(items)
  const totalMotos = items.filter((i) => i.tipo_vehiculo === 'MOTO').length
  const totalVehiculos = items.filter((i) => i.tipo_vehiculo === 'VEHICULO').length
  const totalDateoGlobal = items.reduce((acc, i) => acc + Number(i.monto_asesor ?? i.valor_unitario ?? 0), 0)
  const totalIncentivoGlobal = items.reduce((acc, i) => acc + Number(i.monto_convenio ?? i.valor_cliente ?? 0), 0)
  const totalGeneral = totalDateoGlobal + totalIncentivoGlobal
  const fechaGeneracion = new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date())

  printDialog.value = {
    visible: true,
    items,
    groups,
    fechaGeneracion,
    estadoPagado: estadoPagado || '',
    comprobantes: savedComprobantes ?? [],
    totalMotos,
    totalVehiculos,
    totalGeneral,
    totalDateoGlobal,
    totalIncentivoGlobal,
  }
}

/* ── Abrir confirmación de comprobante ── */
function abrirConfirmacionComprobante() {
  const items = selectedItemsData.value
  if (items.length === 0) return

  const groupsMap = new Map<string, ConfirmComprobanteGroup>()
  for (const item of items) {
    const esConvenio = !!item.convenio
    const key = esConvenio ? `c-${item.convenio!.id}` : `a-${item.asesor?.id ?? 'sin'}`
    const nombre = item.convenio?.nombre || item.asesor?.nombre || 'Sin asignar'

    if (!groupsMap.has(key)) {
      let medioPago: string | null = null
      let telefono: string | null = null
      let beneficiarioId: number | null = null

      if (esConvenio) {
        beneficiarioId = item.convenio?.id ?? null
        const metodo = item.convenio?.metodo_pago ?? null
        const numero = item.convenio?.numero_metodo_pago ?? null
        if (metodo && numero) medioPago = `${metodo}: ${numero}`
        else if (numero) medioPago = numero
        else if (metodo) medioPago = metodo
      } else {
        beneficiarioId = item.asesor?.id ?? null
        const ag = item.asesor?.id ? allAsesores.value.find(a => a.id === item.asesor!.id) : null
        medioPago = ag?.medioPago ?? null
        telefono = ag?.telefono ?? null
      }

      groupsMap.set(key, {
        key, nombre, esConvenio, beneficiarioId, medioPago, telefono,
        motosCount: 0, vehiculosCount: 0, totalDateo: 0, totalIncentivo: 0,
        comisionIds: [], placas: [],
      })
    }

    const g = groupsMap.get(key)!
    if (item.tipo_vehiculo === 'MOTO') g.motosCount++
    else g.vehiculosCount++
    g.totalDateo += Number(item.monto_asesor ?? item.valor_unitario ?? 0)
    g.totalIncentivo += Number(item.monto_convenio ?? item.valor_cliente ?? 0)
    g.comisionIds.push(item.id)
    if (item.turno?.placa) g.placas.push(item.turno.placa)
  }

  const groups = Array.from(groupsMap.values())
  confirmComprobante.value = {
    visible: true,
    loading: false,
    groups,
    totalGeneral: groups.reduce((acc, g) => acc + g.totalDateo + g.totalIncentivo, 0),
    totalComisiones: items.length,
    notas: '',
  }
}

/* ── Ejecutar generación y guardar en backend ── */
async function ejecutarGenerarComprobante() {
  confirmComprobante.value.loading = true
  try {
    const { groups, notas } = confirmComprobante.value
    const itemsSnapshot = [...selectedItemsData.value]

    const payload = {
      periodo_desde: filters.value.desde || undefined,
      periodo_hasta: filters.value.hasta || undefined,
      filtro_estado: filters.value.estado || undefined,
      filtro_tipo_vehiculo: filters.value.tipoVehiculo || undefined,
      notas: notas || undefined,
      groups: groups.map(g => ({
        beneficiario_tipo: g.esConvenio ? 'CONVENIO' as const : 'ASESOR' as const,
        beneficiario_id: g.beneficiarioId,
        beneficiario_nombre: g.nombre,
        medio_pago: g.medioPago,
        telefono: g.telefono,
        total_motos: g.motosCount,
        total_vehiculos: g.vehiculosCount,
        total_dateo: g.totalDateo,
        total_incentivo: g.totalIncentivo,
        total_general: g.totalDateo + g.totalIncentivo,
        comision_ids: g.comisionIds,
        placas: g.placas,
      })),
    }

    // Guarda en backend → devuelve un comprobante por beneficiario
    const savedList = await createComprobantes(payload)
    confirmComprobante.value.visible = false
    selectedIds.value = []

    // Abre el PDF con los números reales asignados
    openPrintPreview(itemsSnapshot, undefined, savedList)
  } finally {
    confirmComprobante.value.loading = false
  }
}

function doPrint() {
  const { groups, fechaGeneracion, totalMotos, totalVehiculos, totalGeneral, totalDateoGlobal, totalIncentivoGlobal } = printDialog.value

  const savedComprobantes = printDialog.value.comprobantes
  const numComp = savedComprobantes.length > 0
    ? savedComprobantes.map(c => `#${c.numero}`).join(', ')
    : null
  const numLabel = numComp
    ? `Comprobante${savedComprobantes.length > 1 ? 's' : ''} ${numComp}`
    : 'Vista previa'

  const periodoParts: string[] = []
  if (filters.value.desde || filters.value.hasta) {
    const rango = [filters.value.desde, filters.value.hasta].filter(Boolean).join(' → ')
    periodoParts.push(`Período: ${rango}`)
  }
  if (filters.value.tipoVehiculo) periodoParts.push(`Filtro: ${filters.value.tipoVehiculo === 'MOTO' ? 'Solo motos' : 'Solo vehículos'}`)
  if (filters.value.descuentoCodigo) periodoParts.push(`Descuento: ${filters.value.descuentoCodigo}`)

  const groupsHtml = groups.map((g, gIdx) => {
    const compNum = savedComprobantes[gIdx]?.numero ?? null
    const compLabel = compNum ? `Comprobante N° ${compNum}` : ''
    const totalGrupo = g.totalDateo + g.totalIncentivo

    const motoItems = g.items.filter(i => i.tipo_vehiculo === 'MOTO')
    const carroItems = g.items.filter(i => i.tipo_vehiculo === 'VEHICULO')

    const motosByValor = new Map<number, number>()
    motoItems.forEach(i => { const v = calcTotalItem(i); motosByValor.set(v, (motosByValor.get(v) || 0) + 1) })
    const carrosByValor = new Map<number, number>()
    carroItems.forEach(i => { const v = calcTotalItem(i); carrosByValor.set(v, (carrosByValor.get(v) || 0) + 1) })

    const desgloseMotoHtml = motoItems.length > 0
      ? Array.from(motosByValor.entries()).map(([val, cnt]) => {
          const label = val === 0
            ? motoItems.filter(i => calcTotalItem(i) === 0 && i.descuento?.nombre).map(i => i.descuento!.nombre)[0] ?? 'con descuento'
            : null
          const extra = label ? ` <span style="font-size:9px;color:#E65100">(${label})</span>` : ''
          return `<div class="desglose-row"><span>🏍️ ${cnt} moto${cnt !== 1 ? 's' : ''}${extra} × ${formatCOP(val)}</span><span class="desglose-val">${formatCOP(cnt * val)}</span></div>`
        }).join('') : ''

    const desgloseCarroHtml = carroItems.length > 0
      ? Array.from(carrosByValor.entries()).map(([val, cnt]) => {
          const label = val === 0
            ? carroItems.filter(i => calcTotalItem(i) === 0 && i.descuento?.nombre).map(i => i.descuento!.nombre)[0] ?? 'con descuento'
            : null
          const extra = label ? ` <span style="font-size:9px;color:#E65100">(${label})</span>` : ''
          return `<div class="desglose-row"><span>🚗 ${cnt} vehículo${cnt !== 1 ? 's' : ''}${extra} × ${formatCOP(val)}</span><span class="desglose-val">${formatCOP(cnt * val)}</span></div>`
        }).join('') : ''

    const medioPagoHtml = g.medioPago
      ? `<div class="pay-detail"><span class="pay-label">💳 Medio de pago</span><span class="pay-value">${g.medioPago}</span></div>`
      : `<div class="pay-detail pay-missing"><span class="pay-label">💳 Medio de pago</span><span class="pay-value">No registrado</span></div>`
    const telHtml = g.telefono
      ? `<div class="pay-detail"><span class="pay-label">📞 Teléfono</span><span class="pay-value">${g.telefono}</span></div>`
      : ''

    const rowsHtml = g.items.map((item, idx) => {
      const descNombre = item.descuento?.nombre ?? null
      const descOrigen = item.descuento_origen ?? null
      let descCell = '—'
      if (descNombre) {
        const origenLabel = descOrigen === 'caja' ? 'En caja' : 'Pre-marcado'
        descCell = `<span class="badge-desc-name">${descNombre}</span><br><span class="desc-origen">${origenLabel}</span>`
      }
      return `<tr>
        <td class="center">${idx + 1}</td>
        <td class="center bold">${item.turno?.placa || '—'}</td>
        <td class="center">${item.tipo_vehiculo === 'MOTO' ? '🏍️ Moto' : item.tipo_vehiculo === 'VEHICULO' ? '🚗 Carro' : '—'}</td>
        <td>${item.turno?.servicio?.nombre || item.turno?.servicio?.codigo || '—'}</td>
        <td>${descCell}</td>
        <td class="right">${formatCOP(Number(item.monto_asesor ?? item.valor_unitario ?? 0))}</td>
        <td class="right">${formatCOP(Number(item.monto_convenio ?? item.valor_cliente ?? 0))}</td>
        <td class="right bold-green">${formatCOP(calcTotalItem(item))}</td>
      </tr>`
    }).join('')

    return `<div class="group">
      <div class="recipient-header">
        <div class="recipient-left">
          <div class="recipient-label">${g.esConvenio ? 'PAGO A CONVENIO' : 'PAGO A ASESOR'}${compLabel ? ' · ' + compLabel : ''}</div>
          <div class="recipient-name">${g.nombre}</div>
          <div class="recipient-count">${g.items.length} comisión${g.items.length !== 1 ? 'es' : ''} · 🏍️ ${g.motosCount} · 🚗 ${g.vehiculosCount}</div>
        </div>
        <div class="recipient-right">${medioPagoHtml}${telHtml}</div>
      </div>
      <div class="pay-summary">
        <div class="pay-summary-title">RESUMEN DE PAGO</div>
        ${desgloseMotoHtml}${desgloseCarroHtml}
        <div class="pay-total-row"><span>TOTAL A PAGAR</span><span class="pay-total-amount">${formatCOP(totalGrupo)}</span></div>
      </div>
      <table>
        <thead><tr>
          <th class="center">#</th><th class="center">Placa</th><th class="center">Tipo</th>
          <th>Servicio</th><th>Descuento</th><th class="right">Dateo</th><th class="right">Incentivo</th><th class="right">Total</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`
  }).join('')

  const printScript = '<scr' + 'ipt>window.onload = function() { window.print(); }</scr' + 'ipt>'
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${numLabel} – ${fechaGeneracion}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size:11px; color:#1a1a1a; padding:20px; background:#fff; }
    .doc-header { border-bottom:3px solid #1565C0; padding-bottom:12px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:flex-end; }
    .doc-title { font-size:18px; font-weight:bold; color:#1565C0; letter-spacing:.3px; }
    .doc-meta { font-size:9.5px; color:#666; text-align:right; line-height:1.6; }
    .global-summary { display:flex; gap:0; margin-bottom:20px; border:1px solid #90CAF9; border-radius:6px; overflow:hidden; }
    .gs-item { flex:1; padding:8px 12px; text-align:center; background:#E3F2FD; border-right:1px solid #90CAF9; }
    .gs-item:last-child { border-right:none; background:#E8F5E9; }
    .gs-label { font-size:9px; color:#555; margin-bottom:3px; text-transform:uppercase; }
    .gs-value { font-size:15px; font-weight:bold; color:#1565C0; }
    .gs-item:last-child .gs-value { color:#1B5E20; font-size:17px; }
    .group { margin-bottom:24px; border:1px solid #ddd; border-radius:6px; overflow:hidden; page-break-inside:avoid; }
    .recipient-header { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 14px; background:linear-gradient(135deg,#1565C0,#1976D2); color:white; }
    .recipient-label { font-size:9px; opacity:.8; text-transform:uppercase; letter-spacing:.5px; }
    .recipient-name { font-size:16px; font-weight:bold; margin:2px 0 4px; }
    .recipient-count { font-size:10px; opacity:.85; }
    .recipient-right { text-align:right; }
    .pay-detail { display:flex; gap:8px; justify-content:flex-end; align-items:center; margin-bottom:3px; }
    .pay-label { font-size:9px; opacity:.75; }
    .pay-value { font-size:11px; font-weight:bold; }
    .pay-missing .pay-value { opacity:.5; font-weight:normal; font-style:italic; }
    .pay-summary { background:#F8FFF8; border-bottom:1px solid #C8E6C9; padding:8px 14px; }
    .pay-summary-title { font-size:9px; font-weight:bold; color:#388E3C; text-transform:uppercase; letter-spacing:.4px; margin-bottom:5px; }
    .desglose-row { display:flex; justify-content:space-between; font-size:11px; color:#444; padding:1px 0; }
    .desglose-val { font-weight:bold; color:#1a1a1a; }
    .pay-total-row { display:flex; justify-content:space-between; align-items:center; margin-top:6px; padding-top:6px; border-top:1px solid #A5D6A7; }
    .pay-total-row span:first-child { font-size:11px; font-weight:bold; color:#2E7D32; text-transform:uppercase; }
    .pay-total-amount { font-size:17px; font-weight:bold; color:#1B5E20; }
    table { width:100%; border-collapse:collapse; }
    th { background:#E8EAF6; color:#283593; padding:5px 8px; border-bottom:2px solid #C5CAE9; font-size:9.5px; }
    td { padding:4px 8px; border-bottom:1px solid #EEE; font-size:10px; }
    tr:last-child td { border-bottom:none; }
    tr:nth-child(even) td { background:#FAFAFA; }
    .right { text-align:right; } .center { text-align:center; } .bold { font-weight:bold; }
    .bold-green { font-weight:bold; color:#2E7D32; }
    .badge-desc-name { background:#FFF3E0; color:#E65100; border:1px solid #FFCC80; border-radius:3px; padding:1px 5px; font-size:9px; font-weight:bold; }
    .desc-origen { font-size:8.5px; color:#888; }
    .grand-total { margin-top:20px; background:#E8F5E9; border:2px solid #A5D6A7; border-radius:6px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; }
    .grand-left .grand-label { font-size:11px; color:#555; }
    .grand-left .grand-breakdown { font-size:9.5px; color:#777; margin-top:3px; }
    .grand-amount { font-size:22px; font-weight:bold; color:#1B5E20; }
    .footer { margin-top:16px; text-align:center; font-size:9px; color:#bbb; border-top:1px solid #eee; padding-top:8px; }
    @media print { body { padding:10px; } .group { page-break-inside:avoid; } }
  </style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="doc-title">COMPROBANTE DE PAGO DE COMISIONES</div>
      <div style="font-size:13px;color:#1565C0;font-weight:bold;margin-top:2px;">${numLabel}</div>
    </div>
    <div class="doc-meta">
      Generado: ${fechaGeneracion}<br>
      ${periodoParts.length ? periodoParts.join(' · ') : 'Sin filtro de período'}
    </div>
  </div>
  <div class="global-summary">
    <div class="gs-item"><div class="gs-label">Comisiones</div><div class="gs-value">${printDialog.value.items.length}</div></div>
    <div class="gs-item"><div class="gs-label">🏍️ Motos</div><div class="gs-value">${totalMotos}</div></div>
    <div class="gs-item"><div class="gs-label">🚗 Vehículos</div><div class="gs-value">${totalVehiculos}</div></div>
    <div class="gs-item"><div class="gs-label">Beneficiarios</div><div class="gs-value">${groups.length}</div></div>
    <div class="gs-item"><div class="gs-label">TOTAL GENERAL</div><div class="gs-value">${formatCOP(totalGeneral)}</div></div>
  </div>
  ${groupsHtml}
  <div class="grand-total">
    <div class="grand-left">
      <div class="grand-label">TOTAL GENERAL A PAGAR (${groups.length} beneficiario${groups.length !== 1 ? 's' : ''})</div>
      <div class="grand-breakdown">Dateo asesores: ${formatCOP(totalDateoGlobal)} &nbsp;·&nbsp; Incentivos convenios: ${formatCOP(totalIncentivoGlobal)}</div>
    </div>
    <div class="grand-amount">${formatCOP(totalGeneral)}</div>
  </div>
  <div class="footer">Comprobante generado automáticamente · Sistema de Comisiones · ${fechaGeneracion}</div>
  ${printScript}
</body>
</html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
}
/* ── Justificación del pago ── */
interface JustificacionPago {
  icono: string
  titulo: string
  color: string
  descripcion: string
  lineas: Array<{ label: string; valor: string }>
}

function buildJustificacion(item: ComisionDetailExtended): JustificacionPago {
  const turno = item.turno
  const esRecurrente = turno?.es_recurrente ?? false
  const esRecuperacion = turno?.es_recuperacion ?? false
  const esNuevo = !esRecurrente && !esRecuperacion
  const tieneConvenio = !!item.convenio
  const montoAsesor = Number(item.monto_asesor ?? item.valor_unitario ?? 0)
  const montoConvenio = Number(item.monto_convenio ?? item.valor_cliente ?? 0)
  const tieneDescuento = !!item.descuento
  const esAvance = item.es_avance ?? false

  // ── CASO: AVANCE ──
  if (esAvance) {
    const base = Number(item.base ?? 0)
    const descMonto = Number(item.descuento_monto_aplicado ?? 0)
    return {
      icono: 'mdi-cash-fast',
      titulo: 'Avance aplicado en factura',
      color: 'purple',
      descripcion: 'El propietario recibió un descuento en la factura equivalente al incentivo. El convenio cobra solo la diferencia pendiente.',
      lineas: [
        { label: 'Incentivo base', valor: formatCOP(base) },
        { label: 'Avance cobrado en factura', valor: formatCOP(descMonto) },
        { label: 'Incentivo final para convenio', valor: formatCOP(montoConvenio) },
        { label: 'Dateo asesor comercial', valor: formatCOP(montoAsesor) },
      ],
    }
  }

  // ── CASO: NUEVO + INFORMATIVO ──
  if (esNuevo && tieneDescuento && montoConvenio === 0 && montoAsesor > 0 && montoAsesor < 10000) {
    return {
      icono: 'mdi-tag-check',
      titulo: 'Cliente nuevo con descuento informativo',
      color: 'orange-darken-2',
      descripcion: `Se aplicó el descuento "${item.descuento!.nombre}". El asesor cobra el valor de dateo recurrente en lugar del valor nuevo directo. El convenio no recibe incentivo.`,
      lineas: [
        { label: 'Descuento aplicado', valor: item.descuento!.nombre },
        { label: 'Origen descuento', valor: item.descuento_origen === 'caja' ? 'En caja' : 'Pre-marcado' },
        { label: 'Asesor cobra (reducido)', valor: formatCOP(montoAsesor) },
        { label: 'Convenio cobra', valor: formatCOP(montoConvenio) },
      ],
    }
  }

  // ── CASO: NUEVO con convenio (descuento caja → convenio $0) ──
  if (esNuevo && tieneDescuento && montoConvenio === 0 && montoAsesor === 0) {
    return {
      icono: 'mdi-tag-off',
      titulo: 'Cliente nuevo — descuento aplicado en caja',
      color: 'orange-darken-2',
      descripcion: `El descuento "${item.descuento!.nombre}" fue aplicado en caja. Ni el asesor ni el convenio reciben comisión en este caso.`,
      lineas: [
        { label: 'Descuento', valor: item.descuento!.nombre },
        { label: 'Dateo asesor', valor: formatCOP(montoAsesor) },
        { label: 'Incentivo convenio', valor: formatCOP(montoConvenio) },
      ],
    }
  }

  // ── CASO: NUEVO sin convenio ──
  if (esNuevo && !tieneConvenio) {
    return {
      icono: 'mdi-account-star',
      titulo: 'Cliente nuevo — asesor directo',
      color: 'success',
      descripcion: 'Primera visita del cliente. El asesor comercial lo dató directamente sin convenio, por lo que cobra el valor nuevo directo completo.',
      lineas: [
        { label: 'Tipo visita', valor: 'Primera visita' },
        { label: 'Canal', valor: 'Sin convenio (directo)' },
        { label: 'Asesor cobra', valor: formatCOP(montoAsesor) },
      ],
    }
  }

  // ── CASO: NUEVO con convenio — convenio datea ──
  // Con el fix: montoAsesor tiene el valor, montoConvenio siempre es $0
  if (esNuevo && tieneConvenio && montoConvenio === 0 && !tieneDescuento && !esAvance) {
    return {
      icono: 'mdi-account-star',
      titulo: 'Cliente nuevo — asesor convenio datea',
      color: 'success',
      descripcion: 'Primera visita del cliente. El propio asesor del convenio realizó el dateo, por lo que recibe el incentivo completo configurado para este tipo de vehículo.',
      lineas: [
        { label: 'Tipo visita', valor: 'Primera visita' },
        { label: 'Convenio', valor: item.convenio!.nombre },
        { label: 'Incentivo convenio cobra', valor: formatCOP(montoConvenio) },
      ],
    }
  }

  // ── CASO: NUEVO con convenio — comercial datea ──
  if (esNuevo && tieneConvenio && montoAsesor > 0 && montoConvenio > 0) {
    return {
      icono: 'mdi-account-star',
      titulo: 'Cliente nuevo — comercial datea con convenio',
      color: 'success',
      descripcion: 'Primera visita del cliente. Un asesor comercial realizó el dateo y existe un convenio activo, por lo que ambos reciben comisión.',
      lineas: [
        { label: 'Tipo visita', valor: 'Primera visita' },
        { label: 'Asesor comercial cobra', valor: formatCOP(montoAsesor) },
        { label: `Convenio "${item.convenio!.nombre}" cobra`, valor: formatCOP(montoConvenio) },
      ],
    }
  }

  // ── CASO: RECURRENTE con continuidad ──
  // Con el fix: montoAsesor tiene el valor (él es asesor Y convenio)
  if (esRecurrente && tieneConvenio && montoConvenio === 0 && montoAsesor > 0 && !esAvance) {
    const meses = turno?.meses_desde_ultima_visita ?? null
    return {
      icono: 'mdi-account-clock',
      titulo: 'Recurrente con continuidad de asesor',
      color: 'warning',
      descripcion: 'El cliente ya visitó antes y el mismo convenio lo dató en la visita anterior. Por continuidad, el convenio recibe el incentivo completo.',
      lineas: [
        { label: 'Meses desde última visita', valor: meses ? `${meses} meses` : '—' },
        { label: 'Turno anterior', valor: turno?.ultimo_turno_id ? `#${turno.ultimo_turno_id}` : '—' },
        { label: 'Continuidad', valor: '✅ Sí — mismo asesor/convenio' },
        { label: 'Asesor convenio cobra (él mismo dateó)', valor: formatCOP(montoAsesor) },
      ],
    }
  }

  // ── CASO: RECURRENTE sin continuidad ──
  if (esRecurrente && (montoAsesor > 0 || montoConvenio === 0)) {
    const meses = turno?.meses_desde_ultima_visita ?? null
    return {
      icono: 'mdi-account-clock',
      titulo: 'Recurrente sin continuidad',
      color: 'warning',
      descripcion: 'El cliente ya visitó antes, pero la visita anterior fue datada por un asesor distinto. Por eso el asesor actual solo cobra el valor de dateo recurrente, no el incentivo completo.',
      lineas: [
        { label: 'Meses desde última visita', valor: meses ? `${meses} meses` : '—' },
        { label: 'Turno anterior', valor: turno?.ultimo_turno_id ? `#${turno.ultimo_turno_id}` : '—' },
        { label: 'Continuidad', valor: '❌ No — diferente asesor en visita anterior' },
        { label: 'Asesor cobra (recurrente)', valor: formatCOP(montoAsesor) },
        { label: 'Convenio cobra', valor: formatCOP(montoConvenio) },
      ],
    }
  }

  // ── CASO: RECUPERACIÓN ──
  if (esRecuperacion) {
    const meses = turno?.meses_desde_ultima_visita ?? null
    return {
      icono: 'mdi-account-reactivate',
      titulo: 'Recuperación de cliente',
      color: 'amber-darken-2',
      descripcion: `El cliente llevaba ${meses ? `${meses} meses` : 'mucho tiempo'} sin visitar. Se aplica el valor de recuperación, mayor al recurrente normal, para incentivar la reactivación.`,
      lineas: [
        { label: 'Meses sin visitar', valor: meses ? `${meses} meses` : '—' },
        { label: 'Turno anterior', valor: turno?.ultimo_turno_id ? `#${turno.ultimo_turno_id}` : '—' },
        { label: 'Asesor cobra (recuperación)', valor: formatCOP(montoAsesor) },
        ...(montoConvenio > 0 ? [{ label: 'Convenio cobra', valor: formatCOP(montoConvenio) }] : []),
      ],
    }
  }

  // Fallback genérico
  return {
    icono: 'mdi-information',
    titulo: 'Comisión generada',
    color: 'grey',
    descripcion: 'Comisión calculada según las reglas de configuración vigentes.',
    lineas: [
      { label: 'Dateo asesor', valor: formatCOP(montoAsesor) },
      { label: 'Incentivo convenio', valor: formatCOP(montoConvenio) },
    ],
  }
}
/* ══════════════════════════════════════════════════════════
   CREAR COMISIÓN
══════════════════════════════════════════════════════════ */
const crearDialog = ref<{
  visible: boolean
  loading: boolean
  step: 1 | 2
  searchPlaca: string
  searchLoading: boolean
  searchResults: TurnoParaComision[]
  turnoSeleccionado: TurnoParaComision | null
  conveniosParaCrear: { id: number; nombre: string }[]
  conveniosCrearLoading: boolean
  form: {
    tipoAsesor: '' | 'COMERCIAL' | 'CONVENIO'
    asesorId: number | null
    convenioId: number | null
    montoAsesor: string
    montoConvenio: string
    tipoCliente: 'NUEVO' | 'RECURRENTE' | 'RECUPERACION'
    descuentoId: number | null
    observacionDateo: string
    esAvance: boolean
  }
}>({
  visible: false,
  loading: false,
  step: 1,
  searchPlaca: '',
  searchLoading: false,
  searchResults: [],
  turnoSeleccionado: null,
  conveniosParaCrear: [],
  conveniosCrearLoading: false,
  form: {
    tipoAsesor: '',
    asesorId: null,
    convenioId: null,
    montoAsesor: '0',
    montoConvenio: '0',
    tipoCliente: 'NUEVO',
    descuentoId: null,
    observacionDateo: '',
    esAvance: false,
  },
})

function turnoTipoVehiculoIcon(tv: string) {
  return (tv ?? '').includes('Moto') ? 'mdi-motorbike' : 'mdi-car'
}
function turnoTipoVehiculoColor(tv: string) {
  return (tv ?? '').includes('Moto') ? 'deep-purple' : 'teal'
}
function turnoTipoVehiculoLabel(tv: string) {
  return (tv ?? '').includes('Moto') ? 'Moto' : 'Vehículo'
}

async function abrirCrear() {
  crearDialog.value = {
    visible: true,
    loading: false,
    step: 1,
    searchPlaca: '',
    searchLoading: false,
    searchResults: [],
    turnoSeleccionado: null,
    conveniosParaCrear: [],
    conveniosCrearLoading: false,
    form: {
      tipoAsesor: '',
      asesorId: null,
      convenioId: null,
      montoAsesor: '0',
      montoConvenio: '0',
      tipoCliente: 'NUEVO',
      descuentoId: null,
      observacionDateo: '',
      esAvance: false,
    },
  }
  await cargarTurnosHoy()
}

async function cargarTurnosHoy() {
  crearDialog.value.searchLoading = true
  try {
    const hoy = new Date().toISOString().substring(0, 10)
    crearDialog.value.searchResults = await buscarTurnosParaComision({
      fechaInicio: hoy,
      fechaFin: hoy,
    })
  } finally {
    crearDialog.value.searchLoading = false
  }
}

async function buscarTurnosPorPlacaCrear() {
  const placa = crearDialog.value.searchPlaca.trim()
  if (!placa) { await cargarTurnosHoy(); return }
  crearDialog.value.searchLoading = true
  try {
    crearDialog.value.searchResults = await buscarTurnosParaComision({ placa })
  } finally {
    crearDialog.value.searchLoading = false
  }
}

function seleccionarTurnoParaComision(turno: TurnoParaComision) {
  crearDialog.value.turnoSeleccionado = turno
  crearDialog.value.step = 2
  const t = turno as any
  crearDialog.value.form.tipoCliente =
    (t.esRecuperacion ?? t.es_recuperacion)
      ? 'RECUPERACION'
      : (t.esRecurrente ?? t.es_recurrente)
      ? 'RECURRENTE'
      : 'NUEVO'
}

function volverABuscarTurno() {
  crearDialog.value.step = 1
  crearDialog.value.turnoSeleccionado = null
}

async function onTipoAsesorCrearChange() {
  crearDialog.value.form.asesorId = null
  crearDialog.value.form.convenioId = null
  crearDialog.value.conveniosParaCrear = []
}

async function onAsesorCrearChange(asesorId: number | null) {
  crearDialog.value.form.convenioId = null
  crearDialog.value.conveniosParaCrear = []
  if (!asesorId || crearDialog.value.form.tipoAsesor !== 'COMERCIAL') return
  crearDialog.value.conveniosCrearLoading = true
  try {
    crearDialog.value.conveniosParaCrear = await listConveniosDeAsesor(asesorId)
  } finally {
    crearDialog.value.conveniosCrearLoading = false
  }
}

async function guardarCreacion() {
  const { turnoSeleccionado, form } = crearDialog.value
  if (!turnoSeleccionado) return
  crearDialog.value.loading = true
  try {
    await createComision({
      turno_id: turnoSeleccionado.id,
      asesor_id: form.asesorId,
      convenio_id: form.convenioId,
      monto_asesor: Number(form.montoAsesor) || 0,
      monto_convenio: Number(form.montoConvenio) || 0,
      tipo_cliente: form.tipoCliente,
      descuento_id: form.descuentoId,
      dateo_observacion: form.observacionDateo.trim() || null,
      es_avance: form.esAvance,
    })
    crearDialog.value.visible = false
    await loadItems()
  } finally {
    crearDialog.value.loading = false
  }
}

const asesoresComerciales3 = computed(() =>
  allAsesores.value.filter((a) => !String(a.tipo ?? '').toUpperCase().includes('CONVENIO'))
)
const asesoresConvenio3 = computed(() =>
  allAsesores.value.filter((a) => String(a.tipo ?? '').toUpperCase().includes('CONVENIO'))
)
/* ── Watchers ── */
watch(activeTab, (val) => {
  if (val === 'metas' && metaRows.value.length === 0) loadMetas()
})

/* ── Init ── */
loadCatalogos()
loadItems()
loadResumen()
</script>

<style scoped>
.scroll-wrapper {
  position: relative;
}

/*
 * Rompe SOLO el ancho del v-container padre (tope de 1250px fijado en
 * App.vue) para esta tabla puntual, sin tocar el resto de la vista
 * (título, filtros, tarjetas KPI, tabla de descuentos) ni el padding
 * global de MainLayout.vue (pa-15, se queda fijo para toda la app).
 *
 * El borde IZQUIERDO se queda fijo (mismo margin-left que sus hermanos,
 * el checkbox/ID no se mueven de su posición actual): todo el espacio
 * extra se gana solo hacia la derecha, vía margin-right negativo + un
 * width mayor al 100%.
 *
 * --espacio-extra es el espacio "sobrante" (a un solo lado, por eso sin
 * dividir entre 2) entre el borde del v-container (tope 1250px) y el
 * borde del padding del v-main (pa-15 = 60px por lado + sidebar rail
 * 64px): 1250 (cap del v-container) + 120 (pa-15 x2) + 64 (sidebar rail)
 * = 1434. Por debajo de ese ancho de viewport el v-container ya no llega
 * a tocar su tope de 1250px (está limitado por el padre, no por el cap),
 * así que clamp() devuelve 0 y la tabla no se mueve — sin riesgo de
 * desbordar el padding de v-main en pantallas más angostas. El tope de
 * 440px es el mismo ancho total ganado que la versión repartida a 2
 * lados (2 x 220px), solo que ahora va entero hacia la derecha.
 */
.tabla-ancha-breakout {
  --espacio-extra: clamp(0px, calc(100vw - 1434px), 440px);
  margin-right: calc(-1 * var(--espacio-extra));
  width: calc(100% + var(--espacio-extra));
}
.scroll-top {
  overflow-x: auto;
  overflow-y: hidden;
}
.scroll-content {
  overflow-x: auto;
}

.rounded-xl { border-radius: 16px; }
.kpi-card { height: 100%; }
.kpi-clickable {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.kpi-clickable:hover { transform: translateY(-2px); }
.kpi-active {
  border: 2px solid rgba(var(--v-theme-on-surface), 0.87);
}
.kpi-active-check {
  position: absolute;
  top: 8px;
  right: 8px;
  color: white;
}
</style>
