<!-- src/views/Dateos.vue -->
<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-4 px-4 px-sm-6 d-flex align-center justify-space-between flex-wrap gap-3">
        <div class="text-h5 font-weight-bold">🗒️ Dateos</div>

        <div class="d-flex align-end gap-2">
          <v-text-field
            v-model.number="exclusividad.horas"
            label="Horas de exclusividad"
            type="number"
            min="1"
            variant="outlined"
            density="compact"
            hide-details
            style="width: 160px"
            :loading="exclusividad.loading"
          />
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-content-save"
            :disabled="!exclusividadCambiada"
            :loading="exclusividad.guardando"
            @click="guardarExclusividad"
          >
            Guardar
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text class="px-4 px-sm-6 pt-0">
        <v-row dense>
          <v-col cols="6" sm="4" md="2">
            <v-text-field v-model="filters.placa" label="Placa" variant="outlined" density="compact" hide-details clearable />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field v-model="filters.telefono" label="Teléfono" variant="outlined" density="compact" hide-details clearable />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-select v-model="filters.canal" :items="canalItems" label="Canal" variant="outlined" density="compact" hide-details />
          </v-col>
         <v-col cols="12" sm="4" md="3">
  <div class="d-flex align-center gap-1" style="flex-wrap:wrap; padding: 4px 0">
    <v-chip
      v-for="opt in tipoAgenteItems"
      :key="opt.value"
      :color="filters.tipoAgente === opt.value ? 'primary' : undefined"
      :variant="filters.tipoAgente === opt.value ? 'flat' : 'outlined'"
      size="small"
      class="font-weight-600"
      style="cursor:pointer"
      @click="filters.tipoAgente = opt.value as '' | 'COMERCIAL' | 'CONVENIO'"
    >
      {{ opt.title }}
    </v-chip>
  </div>
</v-col>

<v-col cols="12" sm="8" md="5">
  <v-autocomplete
    v-model="filters.agenteId"
    :items="agentesVisibles"
    item-title="nombre"
    item-value="id"
    :label="filters.tipoAgente === 'COMERCIAL' ? 'Buscar comercial…' : filters.tipoAgente === 'CONVENIO' ? 'Buscar convenio…' : 'Buscar asesor…'"
    variant="outlined"
    density="compact"
    hide-details
    clearable
    :loading="asesoresLoading"
    auto-select-first
  >
    <template #prepend-item>
      <v-list-item density="compact" class="text-caption text-medium-emphasis px-4">
        {{ agentesVisibles.length }} asesor{{ agentesVisibles.length !== 1 ? 'es' : '' }}
        {{ filters.tipoAgente ? `· solo ${filters.tipoAgente.toLowerCase()}` : '· todos' }}
      </v-list-item>
      <v-divider />
    </template>
    <template #item="{ props, item }">
      <v-list-item v-bind="props" :title="item?.raw?.nombre">
        <template #append>
          <v-chip size="small" class="agent-type-chip" :class="{ 'agent-type--comercial': /COMERCIAL/i.test(item?.raw?.tipo), 'agent-type--convenio': /CONVENIO/i.test(item?.raw?.tipo), 'agent-type--tele': /TELE/i.test(item?.raw?.tipo) }">
            {{ mapTipoCorto(item?.raw?.tipo) }}
          </v-chip>
        </template>
      </v-list-item>
    </template>
    <template #selection="{ item }">
      <div class="d-flex align-center gap-1">
        <span>{{ safe(item?.raw?.nombre) }}</span>
        <v-chip size="small" class="agent-type-chip" :class="{ 'agent-type--comercial': /COMERCIAL/i.test(item?.raw?.tipo), 'agent-type--convenio': /CONVENIO/i.test(item?.raw?.tipo), 'agent-type--tele': /TELE/i.test(item?.raw?.tipo) }">
          {{ mapTipoCorto(item?.raw?.tipo) }}
        </v-chip>
      </div>
    </template>
  </v-autocomplete>
</v-col>
          <v-col cols="12" sm="6" md="4">
            <v-autocomplete v-model="filters.convenioId" :items="conveniosVisibles" item-title="nombre" item-value="id" label="Convenio" variant="outlined" density="compact" hide-details clearable :loading="conveniosLoading" />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-select v-model="filters.resultado" :items="resultadoItems" label="Estado" variant="outlined" density="compact" hide-details clearable />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field v-model="filters.desde" type="date" label="Desde" variant="outlined" density="compact" hide-details />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field v-model="filters.hasta" type="date" label="Hasta" variant="outlined" density="compact" hide-details />
          </v-col>

          <!-- Botones -->
          <v-col cols="6" sm="3" md="2">
            <v-btn color="primary" :loading="loading" @click="reload" block>
              Aplicar
            </v-btn>
          </v-col>
          <v-col cols="6" sm="3" md="2">
            <v-btn variant="outlined" :disabled="loading" @click="resetFilters" block>
              Limpiar
            </v-btn>
          </v-col>
          <v-col cols="6" sm="3" md="2">
            <v-btn color="secondary" @click="irCrear" prepend-icon="mdi-plus" block>
              Nuevo
            </v-btn>
          </v-col>
          <v-col cols="6" sm="3" md="2">
            <v-btn color="teal-darken-1" variant="tonal" prepend-icon="mdi-file-upload-outline" @click="abrirImportacion" block>
              <span class="d-none d-sm-inline">Importar histórico</span>
              <span class="d-sm-none">Importar</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>



      <v-expand-transition>
        <v-alert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          class="mx-6 mb-3"
          density="comfortable"
        >
          {{ errorMsg }}
        </v-alert>
      </v-expand-transition>

      <v-data-table-server
        class="px-4 pb-4"
        :headers="headers"
        :items="rows"
        :items-length="totalItems"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :loading="loading"
        :sort-by="sortBy"
        @update:options="loadItems"
        item-value="id"
      >
        <!-- Foto -->
        <template #item.imagen_url="{ item }">
          <div class="d-flex items-center">
            <v-avatar
              v-if="item.imagen_url"
              size="42"
              class="evidence-thumb"
              @click="openViewer(item.imagen_url)"
            >
              <v-img :src="item.imagen_url" alt="evidencia" cover />
            </v-avatar>
            <v-btn
              v-else
              icon="mdi-image-off"
              variant="text"
              size="small"
              class="text-medium-emphasis"
              :disabled="true"
              :ripple="false"
              aria-label="Sin evidencia"
              :title="'Sin evidencia'"
            />
          </div>
        </template>

        <!-- Canal fijo: ASESOR -->
        <template #item.canal>
          <v-chip size="small" variant="flat">ASESOR</v-chip>
        </template>

        <!-- Agente -->
        <template #item.agente="{ item }">
          <div class="d-flex align-center gap-1">
            <span>{{ safe(item.agente?.nombre) }}</span>
            <v-chip
              v-if="item.agente?.tipo"
              size="small"
              class="agent-type-chip"
              :class="{
                'agent-type--comercial': /COMERCIAL/i.test(item.agente.tipo),
                'agent-type--convenio': /CONVENIO/i.test(item.agente.tipo),
                'agent-type--tele': /TELE/i.test(item.agente.tipo),
              }"
            >
              {{ mapTipoCorto(item.agente.tipo) }}
            </v-chip>
          </div>
        </template>

        <!-- Convenio -->
        <template #item.convenio="{ item }">
          <v-chip v-if="item.convenio?.nombre" size="small" variant="flat">
            {{ item.convenio.nombre }}
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <!-- Creado -->
        <template #item.created_at="{ item }">
          {{ item.created_at_fmt || formatDateTime(item.created_at) }}
        </template>

<!-- Tipo dateo -->
<template #item.tipo_dateo="{ item }">
  <div class="d-flex align-center gap-1">
    <template v-if="item.turnoInfo">
      <v-chip v-if="item.turnoInfo.es_recurrente" size="x-small"
        color="orange-darken-1" variant="flat" class="font-weight-600">
        Recurrente
      </v-chip>
      <v-chip v-else size="x-small"
        color="blue-darken-1" variant="flat" class="font-weight-600">
        Continuidad
      </v-chip>
    </template>
    <span v-else class="text-medium-emphasis">—</span>
    <v-tooltip text="Ver detalle del cliente">
      <template #activator="{ props }">
        <v-btn v-bind="props" icon="mdi-account-eye" size="x-small"
          variant="text" color="teal" @click.stop="item.placa && abrirDetalleCliente(item.placa)" />
      </template>
    </v-tooltip>
  </div>
</template>

        <!-- Estado (resultado del dateo) -->
        <template #item.resultado="{ item }">
          <div class="d-flex align-center justify-center" style="gap:4px">
            <v-chip
              :color="chipColorResultado(item.resultado)"
              size="small"
              variant="flat"
              :prepend-icon="item.resultado === 'RE_DATEAR' ? 'mdi-refresh' : undefined"
            >
              {{ textoResultado(item.resultado) }}
            </v-chip>
            <v-tooltip v-if="item.aprobado_excepcion_por" location="top">
              <template #activator="{ props }">
                <v-icon v-bind="props" color="warning" size="18">mdi-shield-alert</v-icon>
              </template>
              <span>Excepción RTM aprobada por {{ item.aprobado_excepcion_por_nombre || '—' }}</span>
            </v-tooltip>
          </div>
        </template>

        <!-- Descuento -->
        <template #item.descuento="{ item }">
          <v-chip
            v-if="item.descuento_id || item.descuento?.nombre"
            size="x-small"
            color="orange-darken-1"
            variant="tonal"
            prepend-icon="mdi-tag-text"
            class="font-weight-600"
          >
            {{ item.descuento?.nombre ?? `#${item.descuento_id}` }}
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>


        <!-- Turno -->
        <template #item.turnoInfo="{ item }">
          <div v-if="item.turnoInfo" class="d-flex align-center justify-center" style="gap:6px">
            <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-600">
              {{ (item.turnoInfo.fecha && formatDateOnly(item.turnoInfo.fecha)) || '—' }}
            </v-chip>
            <v-chip size="x-small" color="indigo" variant="tonal" class="font-weight-600">
              G: {{ item.turnoInfo.numeroGlobal ?? '—' }}
            </v-chip>
            <v-chip size="x-small" color="deep-purple" variant="tonal" class="font-weight-600">
              S: {{ item.turnoInfo.numeroServicio ?? '—' }}
            </v-chip>
            <v-chip
              v-if="item.turnoInfo.servicioCodigo"
              size="x-small"
              variant="tonal"
              class="font-weight-600"
            >
              {{ item.turnoInfo.servicioCodigo }}
            </v-chip>
            <v-chip
              size="x-small"
              :color="chipColorEstadoTurno(item.turnoInfo.estado || item.resultado)"
              variant="elevated"
              prepend-icon="mdi-progress-clock"
              class="font-weight-600"
            >
              {{ textoEstadoTurno(item.turnoInfo.estado || item.resultado) }}
            </v-chip>
          </div>
          <span v-else class="text-medium-emphasis d-flex justify-center">—</span>
        </template>

        <!-- Exclusividad (countdown) -->
        <template #item.exclusividad="{ item }">
          <v-chip
            v-if="reservaCountdown(item).aplica"
            size="x-small"
            :color="reservaCountdown(item).vigente ? 'orange-darken-1' : 'grey-darken-1'"
            variant="tonal"
            prepend-icon="mdi-timer-sand"
            class="font-weight-600"
          >
            {{ reservaCountdown(item).texto }}
          </v-chip>
          <span v-else class="text-medium-emphasis d-flex justify-center">—</span>
        </template>

        <!-- Acciones -->
        <template #item.acciones="{ item }">
          <div class="d-flex gap-1">
            <v-tooltip text="Ver detalle del dateo">
              <template #activator="{ props }">
                <v-btn size="small" variant="text" icon="mdi-eye" v-bind="props" @click="verDetalle(item.id)" />
              </template>
            </v-tooltip>
            <v-tooltip text="Marcar EN PROCESO">
              <template #activator="{ props }">
                <v-btn size="small" variant="text" icon="mdi-progress-clock" color="info" v-bind="props" @click="marcarResultado(item.id, 'EN_PROCESO')" />
              </template>
            </v-tooltip>
            <v-tooltip text="Marcar EXITOSO">
              <template #activator="{ props }">
                <v-btn size="small" variant="text" icon="mdi-clipboard-check" color="success" v-bind="props" @click="marcarResultado(item.id, 'EXITOSO')" />
              </template>
            </v-tooltip>
            <v-tooltip text="Marcar NO EXITOSO">
              <template #activator="{ props }">
                <v-btn size="small" variant="text" icon="mdi-clipboard-remove" color="error" v-bind="props" @click="marcarResultado(item.id, 'NO_EXITOSO')" />
              </template>
            </v-tooltip>
            <v-tooltip text="Marcar PENDIENTE">
              <template #activator="{ props }">
                <v-btn size="small" variant="text" icon="mdi-clipboard-text-clock" v-bind="props" @click="marcarResultado(item.id, 'PENDIENTE')" />
              </template>
            </v-tooltip>
            <v-tooltip text="Eliminar dateo">
              <template #activator="{ props }">
                <v-btn size="small" variant="text" icon="mdi-delete" color="error" v-bind="props" @click="confirmEliminar(item.id)" />
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- ═══════════════════════════════════════════════════════
         MODAL IMPORTAR HISTÓRICO
    ════════════════════════════════════════════════════════ -->
    <v-dialog v-model="importacion.visible" max-width="680" persistent>
      <v-card class="rounded-xl">
        <v-card-title class="pt-5 pb-2 px-6 d-flex align-center gap-2">
          <v-icon color="teal-darken-1">mdi-file-upload-outline</v-icon>
          <span class="text-h6 font-weight-bold">Importar histórico RTM</span>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            :disabled="importacion.loading"
            @click="cerrarImportacion"
          />
        </v-card-title>

        <v-divider />

        <v-card-text class="px-6 pt-5">

          <!-- PASO 1: Selección de archivo -->
          <div v-if="importacion.paso === 1">
            <p class="text-body-2 text-medium-emphasis mb-4">
              Sube el archivo <strong>INTERNOS_TOTAL2025.xlsx</strong>. El sistema leerá todas las
              hojas (MAR2025 → FEB2026) y creará los dateos y turnos históricos vinculados a cada
              asesor y convenio.
            </p>

            <v-file-input
              v-model="importacion.archivo"
              label="Seleccionar archivo Excel"
              accept=".xlsx,.xls"
              prepend-icon="mdi-microsoft-excel"
              variant="outlined"
              density="comfortable"
              :error-messages="importacion.archivoError"
              show-size
              @update:model-value="importacion.archivoError = ''"
            />

            <v-expansion-panels variant="accordion" class="mt-3">
              <v-expansion-panel title="Opciones avanzadas">
                <v-expansion-panel-text>
                  <v-text-field
                    v-model="importacion.hojas"
                    label="Filtrar hojas (vacío = todas)"
                    placeholder="Ej: MAR2025,ABR2025"
                    variant="outlined"
                    density="comfortable"
                    hint="Separa con comas si quieres importar solo algunas hojas"
                    persistent-hint
                    class="mb-3"
                  />
                  <v-switch
                    v-model="importacion.dryRun"
                    label="Modo simulación (no guarda nada)"
                    color="warning"
                    density="comfortable"
                    hide-details
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>

          <!-- PASO 2: Preview -->
          <div v-if="importacion.paso === 2 && importacion.preview">
            <v-alert type="info" variant="tonal" density="comfortable" class="mb-4">
              Vista previa generada. Revisa los totales antes de confirmar la importación.
            </v-alert>

            <div class="resumen-grid mb-4">
              <div class="resumen-card">
                <div class="resumen-label">Total filas</div>
                <div class="resumen-valor">{{ importacion.preview.total_filas }}</div>
              </div>
              <div class="resumen-card resumen-card--green">
                <div class="resumen-label">A importar</div>
                <div class="resumen-valor">{{ importacion.preview.total_filas - contarSinAsesor }}</div>
              </div>
              <div class="resumen-card resumen-card--orange">
                <div class="resumen-label">Sin asesor</div>
                <div class="resumen-valor">{{ contarSinAsesor }}</div>
              </div>
              <div class="resumen-card resumen-card--red">
                <div class="resumen-label">Errores parseo</div>
                <div class="resumen-valor">{{ importacion.preview.errores_parseo }}</div>
              </div>
            </div>

            <p class="text-caption text-medium-emphasis mb-2 font-weight-bold">DESGLOSE POR HOJA</p>
            <v-table density="compact" class="rounded-lg tabla-borde mb-4">
              <thead>
                <tr>
                  <th>Hoja</th>
                  <th class="text-center">Total</th>
                  <th class="text-center">Continuidad</th>
                  <th class="text-center">Recurrente</th>
                  <th class="text-center">Sin asesor</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(stats, hoja) in importacion.preview.por_hoja" :key="hoja">
                  <td class="font-weight-medium">{{ hoja }}</td>
                  <td class="text-center">{{ stats.total }}</td>
                  <td class="text-center">
                    <v-chip size="x-small" color="blue" variant="tonal">{{ stats.aprobado }}</v-chip>
                  </td>
                  <td class="text-center">
                    <v-chip size="x-small" color="orange" variant="tonal">{{ stats.dateo }}</v-chip>
                  </td>
                  <td class="text-center">
                    <v-chip
                      size="x-small"
                      :color="stats.sinAsesor > 0 ? 'error' : 'success'"
                      variant="tonal"
                    >
                      {{ stats.sinAsesor }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <v-alert
              v-if="importacion.dryRun"
              type="warning"
              variant="tonal"
              density="comfortable"
              prepend-icon="mdi-test-tube"
            >
              Modo simulación activo. No se guardará nada en la base de datos.
            </v-alert>
          </div>

          <!-- PASO 3: Resultado final -->
          <div v-if="importacion.paso === 3 && importacion.resultado">
            <v-alert
              :type="importacion.resultado.resumen.errores_proceso > 0 ? 'warning' : 'success'"
              variant="tonal"
              density="comfortable"
              class="mb-4"
            >
              {{ importacion.dryRun ? 'Simulación completada.' : 'Importación completada.' }}
            </v-alert>

            <div class="resumen-grid mb-4">
              <div class="resumen-card resumen-card--green">
                <div class="resumen-label">{{ importacion.dryRun ? 'A crear' : 'Creados' }}</div>
                <div class="resumen-valor">{{ importacion.resultado.resumen.creados }}</div>
              </div>
              <div class="resumen-card">
                <div class="resumen-label">Duplicados</div>
                <div class="resumen-valor">{{ importacion.resultado.resumen.skipped_duplicado }}</div>
              </div>
              <div class="resumen-card resumen-card--orange">
                <div class="resumen-label">Sin asesor</div>
                <div class="resumen-valor">{{ importacion.resultado.resumen.skipped_sin_asesor }}</div>
              </div>
              <div class="resumen-card resumen-card--red">
                <div class="resumen-label">Errores</div>
                <div class="resumen-valor">{{ importacion.resultado.resumen.errores_proceso }}</div>
              </div>
            </div>

            <div v-if="importacion.resultado.errores_detalle?.length">
              <p class="text-caption text-medium-emphasis mb-2 font-weight-bold">ERRORES DETALLE</p>
              <v-table density="compact" class="rounded-lg tabla-borde">
                <thead>
                  <tr>
                    <th>Hoja</th>
                    <th>Fila</th>
                    <th>Placa</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(e, i) in importacion.resultado.errores_detalle.slice(0, 20)"
                    :key="i"
                  >
                    <td>{{ e.hoja }}</td>
                    <td>{{ e.fila }}</td>
                    <td class="font-weight-medium">{{ e.placa }}</td>
                    <td class="text-caption text-error">{{ e.motivo }}</td>
                  </tr>
                </tbody>
              </v-table>
              <p
                v-if="importacion.resultado.errores_detalle.length > 20"
                class="text-caption text-medium-emphasis mt-1"
              >
                ... y {{ importacion.resultado.errores_detalle.length - 20 }} errores más.
              </p>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="importacion.loading" class="d-flex flex-column align-center py-6 gap-3">
            <v-progress-circular indeterminate color="teal-darken-1" size="48" />
            <p class="text-body-2 text-medium-emphasis">{{ importacion.loadingMsg }}</p>
          </div>

        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4">
          <v-btn variant="text" :disabled="importacion.loading" @click="cerrarImportacion">
            {{ importacion.paso === 3 ? 'Cerrar' : 'Cancelar' }}
          </v-btn>

          <v-spacer />

          <!-- Paso 1 → Vista previa -->
          <v-btn
            v-if="importacion.paso === 1"
            color="teal-darken-1"
            variant="tonal"
            prepend-icon="mdi-eye-outline"
            :loading="importacion.loading"
            @click="hacerPreview"
          >
            Vista previa
          </v-btn>

          <!-- Paso 2 → Volver + Confirmar -->
          <template v-if="importacion.paso === 2">
            <v-btn
              variant="text"
              prepend-icon="mdi-arrow-left"
              :disabled="importacion.loading"
              @click="importacion.paso = 1"
            >
              Volver
            </v-btn>
            <v-btn
              color="teal-darken-1"
              variant="flat"
              prepend-icon="mdi-check"
              :loading="importacion.loading"
              @click="confirmarImportacion"
            >
              {{ importacion.dryRun ? 'Simular' : 'Importar' }}
            </v-btn>
          </template>

          <!-- Paso 3 → Nueva importación -->
          <v-btn
            v-if="importacion.paso === 3"
            color="teal-darken-1"
            variant="tonal"
            prepend-icon="mdi-refresh"
            @click="resetImportacion"
          >
            Nueva importación
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Visor de imagen -->
    <v-dialog v-model="viewer.visible" max-width="720">
      <v-card>
        <v-card-title class="text-h6">Evidencia</v-card-title>
        <v-card-text>
          <v-img v-if="viewer.url" :src="viewer.url" class="rounded" height="420" cover />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            v-if="viewer.url"
            variant="text"
            :href="viewer.url"
            target="_blank"
            prepend-icon="mdi-open-in-new"
          >
            Abrir en pestaña
          </v-btn>
          <v-btn color="primary" @click="viewer.visible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Eliminar -->
    <v-dialog v-model="dlgEliminar.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">Eliminar dateo</v-card-title>
        <v-card-text>¿Seguro que deseas eliminar este dateo?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgEliminar.visible = false">Cancelar</v-btn>
          <v-btn color="error" :loading="dlgEliminar.loading" @click="doEliminar">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Modal detalle cliente -->
    <v-dialog v-model="modalCliente.visible" max-width="580" scrollable>
      <v-card class="rounded-xl">
        <v-card-title class="pt-5 pb-2 px-6 d-flex align-center gap-2">
          <v-icon color="teal">mdi-account-circle</v-icon>
          <span class="text-h6 font-weight-bold">Cliente — {{ modalCliente.placa }}</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="modalCliente.visible = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="px-6 pt-4">

          <div v-if="modalCliente.loading" class="d-flex justify-center py-8">
            <v-progress-circular indeterminate color="teal" />
          </div>

          <v-alert v-else-if="!modalCliente.data" type="warning" variant="tonal">
            No se encontró información del cliente para esta placa.
          </v-alert>

          <template v-else>
            <p class="text-caption text-medium-emphasis font-weight-bold mb-2">PROPIETARIO</p>
            <v-card variant="tonal" color="teal" class="mb-4 pa-3 rounded-lg">
              <div class="d-flex flex-wrap gap-3">
                <div>
                  <div class="text-caption text-medium-emphasis">Nombre</div>
                  <div class="font-weight-600">{{ modalCliente.data.cliente?.nombre ?? '—' }}</div>
                </div>
                <div>
                  <div class="text-caption text-medium-emphasis">Cédula</div>
                  <div class="font-weight-600">{{ modalCliente.data.cliente?.docNumero ?? '—' }}</div>
                </div>
                <div>
                  <div class="text-caption text-medium-emphasis">Teléfono</div>
                  <div class="font-weight-600">{{ modalCliente.data.cliente?.telefono ?? '—' }}</div>
                </div>
              </div>
            </v-card>

            <p class="text-caption text-medium-emphasis font-weight-bold mb-2">HISTORIAL RTM</p>
            <div class="d-flex gap-3 mb-4">
              <v-card variant="outlined" class="pa-3 rounded-lg text-center flex-1">
                <div class="text-h6 font-weight-bold">{{ (modalCliente.data.metricas ?? modalCliente.data.kpis)?.visitas_count ?? 0 }}</div>
                <div class="text-caption text-medium-emphasis">Visitas totales</div>
              </v-card>
              <v-card variant="outlined" class="pa-3 rounded-lg text-center flex-1">
                <div class="text-h6 font-weight-bold">{{ (modalCliente.data.metricas ?? modalCliente.data.kpis)?.ultima_visita_at ?? '—' }}</div>
                <div class="text-caption text-medium-emphasis">Última visita</div>
              </v-card>
              <v-card variant="outlined" class="pa-3 rounded-lg text-center flex-1">
                <div class="text-h6 font-weight-bold">{{ (modalCliente.data.metricas ?? modalCliente.data.kpis)?.dias_desde_ultima_visita ?? '—' }}</div>
                <div class="text-caption text-medium-emphasis">Días desde última</div>
              </v-card>
            </div>

            <p class="text-caption text-medium-emphasis font-weight-bold mb-2">VEHÍCULOS</p>
            <div class="d-flex flex-wrap gap-2 mb-4">
              <v-chip v-for="v in modalCliente.data.vehiculos" :key="v.id"
                size="small" variant="tonal" color="indigo" prepend-icon="mdi-car">
                {{ v.placa }}{{ v.marca ? ` · ${v.marca}` : '' }}{{ v.modelo ? ` ${v.modelo}` : '' }}
              </v-chip>
              <span v-if="!modalCliente.data.vehiculos?.length" class="text-medium-emphasis">Sin vehículos</span>
            </div>

            <p class="text-caption text-medium-emphasis font-weight-bold mb-2">VISITAS RECIENTES</p>
            <v-table density="compact" class="rounded-lg tabla-borde">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Placa</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in modalCliente.data.visitas_recientes" :key="v.id">
                  <td>{{ v.fecha ? formatDateOnly(v.fecha) : '—' }}</td>
                  <td class="font-weight-medium">{{ v.placa }}</td>
                  <td>{{ v.servicioNombre ?? '—' }}</td>
                  <td>
                    <v-chip size="x-small"
                      :color="v.estado === 'finalizado' ? 'success' : 'warning'"
                      variant="flat">
                      {{ v.estado }}
                    </v-chip>
                  </td>
                </tr>
                <tr v-if="!modalCliente.data.visitas_recientes?.length">
                  <td colspan="4" class="text-center text-medium-emphasis py-3">Sin visitas registradas</td>
                </tr>
              </tbody>
            </v-table>
          </template>

        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  listDateos,
  updateDateo,
  deleteDateo,
  listAgentesCaptacion,
  listConveniosLight,
  formatDateTime,
  previewHistoricoRtm,
  importarHistoricoRtm,
  getExclusividadConfig,
  updateExclusividadConfig,
  type Dateo,
  type ResultadoDateo,
  type HistoricoPreviewResponse,
  type HistoricoImportarResponse,
} from '@/services/dateosService'
import { listConveniosAsignados } from '@/services/conveniosService'
import { ClientesService } from '@/services/clientes_service'
import { calcularReservaCountdown } from '@/composables/useReservaCountdown'

const router = useRouter()

/* ── Filtros ── */
const filters = ref<{
  placa: string
  telefono: string
  canal: 'ASESOR'
  tipoAgente: '' | 'COMERCIAL' | 'CONVENIO'
  agenteId: number | null
  convenioId: number | null
  resultado: ResultadoDateo | ''
  desde: string
  hasta: string
}>({
  placa: '',
  telefono: '',
  canal: 'ASESOR',
  tipoAgente: '',
  agenteId: null,
  convenioId: null,
  resultado: '',
  desde: '',
  hasta: '',
})

/* ── Config: horas de exclusividad del dateo ── */
const exclusividad = ref<{ horas: number | null; original: number | null; loading: boolean; guardando: boolean }>({
  horas: null,
  original: null,
  loading: false,
  guardando: false,
})

const exclusividadCambiada = computed(() => {
  const { horas, original } = exclusividad.value
  return horas !== null && horas > 0 && horas !== original
})

async function cargarExclusividad() {
  exclusividad.value.loading = true
  try {
    const res = await getExclusividadConfig()
    exclusividad.value.horas = res.horas_exclusividad
    exclusividad.value.original = res.horas_exclusividad
  } catch {
    errorMsg.value = 'No se pudo cargar la configuración de exclusividad'
  } finally {
    exclusividad.value.loading = false
  }
}

async function guardarExclusividad() {
  if (!exclusividadCambiada.value || exclusividad.value.horas === null) return
  exclusividad.value.guardando = true
  try {
    const res = await updateExclusividadConfig(exclusividad.value.horas)
    exclusividad.value.horas = res.horas_exclusividad
    exclusividad.value.original = res.horas_exclusividad
    snack.text = '✅ Horas de exclusividad actualizadas'
    snack.show = true
  } catch {
    errorMsg.value = 'No se pudo guardar la configuración de exclusividad'
  } finally {
    exclusividad.value.guardando = false
  }
}

const canalItems = [{ title: 'Asesor', value: 'ASESOR' as const }]

const tipoAgenteItems = [
  { title: 'Todos', value: '' },
  { title: 'Comercial', value: 'COMERCIAL' },
  { title: 'Convenio', value: 'CONVENIO' },
]

const resultadoItems: { title: string; value: ResultadoDateo }[] = [
  { title: 'Pendiente', value: 'PENDIENTE' },
  { title: 'En proceso', value: 'EN_PROCESO' },
  { title: 'Exitoso', value: 'EXITOSO' },
  { title: 'No exitoso', value: 'NO_EXITOSO' },
  { title: 'Re-datear', value: 'RE_DATEAR' },
]

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Foto', key: 'imagen_url', sortable: false },
  { title: 'Canal', key: 'canal', sortable: false },
  { title: 'Agente', key: 'agente', sortable: false },
  { title: 'Convenio', key: 'convenio', sortable: false },
  { title: 'Placa', key: 'placa', sortable: true },
  { title: 'Teléfono cliente', key: 'telefono', sortable: true },
  { title: 'Creado', key: 'created_at', sortable: true },
  { title: 'Tipo', key: 'tipo_dateo', sortable: false },  // ← AGREGAR ESTA LÍNEA
  { title: 'Estado', key: 'resultado', sortable: true },
  { title: 'Descuento', key: 'descuento', sortable: false },
  { title: 'Turno', key: 'turnoInfo', sortable: false, align: 'center' as const },
  { title: 'Exclusividad', key: 'exclusividad', sortable: false, align: 'center' as const },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

const rows = ref<Dateo[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'id', order: 'desc' }])
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const snack = reactive({ show: false, text: '' })

/* ── Visor ── */
const viewer = ref<{ visible: boolean; url: string | null }>({ visible: false, url: null })
function openViewer(url: string) {
  viewer.value = { visible: true, url }
}

/* ── Asesores ── */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)
async function loadAsesores() {
  asesoresLoading.value = true
  try {
    asesoresItems.value = await listAgentesCaptacion()
  } finally {
    asesoresLoading.value = false
  }
}

/* ── Convenios ── */
const conveniosAll = ref<{ id: number; nombre: string }[]>([])
const conveniosAsignados = ref<{ id: number; nombre: string }[]>([])
const conveniosLoading = ref(false)

async function loadConveniosAll() {
  conveniosLoading.value = true
  try {
    conveniosAll.value = await listConveniosLight()
  } finally {
    conveniosLoading.value = false
  }
}

async function loadConveniosAsignadosByAsesor(asesorId: number) {
  if (!asesorId) { conveniosAsignados.value = []; return }
  conveniosLoading.value = true
  try {
    conveniosAsignados.value = await listConveniosAsignados(asesorId)
  } catch {
    conveniosAsignados.value = []
  } finally {
    conveniosLoading.value = false
  }
}

/* ── Helpers ── */
function mapTipoCorto(t?: string) {
  const u = String(t || '').toUpperCase()
  if (u.includes('CONVENIO')) return 'Convenio'
  if (u.includes('COMERCIAL')) return 'Comercial'
  if (u.includes('TELE')) return 'Tele'
  return ''
}
function safe(val?: string | number | null) {
  return val === null || val === undefined || val === '' ? '' : String(val)
}

const agentesVisibles = computed(() => {
  const tipo = filters.value.tipoAgente
  if (!tipo) return asesoresItems.value
  return asesoresItems.value.filter((a) => {
    const u = String(a.tipo || '').toUpperCase()
    if (tipo === 'COMERCIAL') return u.includes('COMERCIAL')
    if (tipo === 'CONVENIO') return u.includes('CONVENIO')
    return true
  })
})

const conveniosVisibles = computed(() => {
  const tipo = filters.value.tipoAgente
  const agenteId = filters.value.agenteId
  if (!tipo || !agenteId) return conveniosAll.value
  if (tipo === 'CONVENIO') {
    const conv = conveniosAll.value.find((c) => c.id === filters.value.convenioId)
    return conv ? [conv] : []
  }
  if (tipo === 'COMERCIAL') {
    return conveniosAsignados.value.length ? conveniosAsignados.value : conveniosAll.value
  }
  return conveniosAll.value
})

watch(
  () => filters.value.tipoAgente,
  () => {
    filters.value.agenteId = null
    filters.value.convenioId = null
    conveniosAsignados.value = []
  }
)

function autoVincularConvenioDeAsesorConvenio() {
  if (!filters.value.agenteId) return
  const asesor = asesoresItems.value.find((a) => a.id === filters.value.agenteId)
  if (!asesor) return
  const conv = conveniosAll.value.find((c) => c.nombre === asesor.nombre)
  if (conv) filters.value.convenioId = conv.id
}

watch(
  () => filters.value.agenteId,
  async (nuevo) => {
    filters.value.convenioId = null
    conveniosAsignados.value = []
    if (!nuevo) return
    if (filters.value.tipoAgente === 'CONVENIO') {
      autoVincularConvenioDeAsesorConvenio()
      return
    }
    if (filters.value.tipoAgente === 'COMERCIAL') {
      await loadConveniosAsignadosByAsesor(nuevo)
    }
  }
)

watch(
  () => conveniosAll.value,
  () => {
    if (filters.value.tipoAgente === 'CONVENIO' && filters.value.agenteId) {
      autoVincularConvenioDeAsesorConvenio()
    }
  }
)

/* ── Chips ── */
function chipColorResultado(r?: string) {
  if (r === 'EXITOSO') return 'success'
  if (r === 'NO_EXITOSO') return 'error'
  if (r === 'EN_PROCESO') return 'info'
  if (r === 'RE_DATEAR') return 'orange'
  return 'warning'
}
function textoResultado(r?: string) {
  if (r === 'EXITOSO') return 'Exitoso'
  if (r === 'NO_EXITOSO') return 'No exitoso'
  if (r === 'EN_PROCESO') return 'En proceso'
  if (r === 'RE_DATEAR') return 'Re-datear'
  return 'Pendiente'
}
function reservaCountdown(item: Dateo) {
  return calcularReservaCountdown(item, exclusividad.value.horas)
}
function chipColorEstadoTurno(e?: string) {
  const v = String(e || '').toLowerCase()
  if (v.includes('proceso')) return 'info'
  if (v.includes('final')) return 'success'
  if (v.includes('cancel')) return 'error'
  return 'warning'
}
function textoEstadoTurno(e?: string) {
  const v = String(e || '').toUpperCase()
  if (v === 'EN_PROCESO') return 'En proceso'
  if (v === 'FINALIZADO') return 'Finalizado'
  if (v === 'CANCELADO') return 'Cancelado'
  if (v === 'ACTIVO') return 'Activo'
  return 'Pendiente'
}
function formatDateOnly(iso: string) {
  const p = iso.split('T')[0] || iso
  const [y, m, d] = p.split('-')
  return `${d}/${m}/${y}`
}

/* ── Tabla ── */
async function loadItems() {
  loading.value = true
  errorMsg.value = null
  try {
    const sort =
      Array.isArray(sortBy.value) && sortBy.value[0]
        ? sortBy.value[0]
        : { key: 'id', order: 'desc' as const }
    const res = await listDateos({
      page: page.value,
      perPage: itemsPerPage.value,
      placa: filters.value.placa || undefined,
      telefono: filters.value.telefono || undefined,
      canal: 'ASESOR',
      agenteId: filters.value.agenteId || undefined,
      convenioId: filters.value.convenioId || undefined,
      resultado: (filters.value.resultado as ResultadoDateo) || undefined,
      desde: filters.value.desde || undefined,
      hasta: filters.value.hasta || undefined,
      sortBy: sort.key,
      order: sort.order,
    })
    rows.value = res.data as Dateo[]
    totalItems.value = Number(res.total || rows.value.length || 0)
  } catch (e) {
    rows.value = []
    totalItems.value = 0
    errorMsg.value = e instanceof Error ? e.message : 'No fue posible cargar los dateos'
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  loadItems()
}

function resetFilters() {
  filters.value = {
    placa: '',
    telefono: '',
    canal: 'ASESOR',
    tipoAgente: '',
    agenteId: null,
    convenioId: null,
    resultado: '',
    desde: '',
    hasta: '',
  }
  conveniosAsignados.value = []
  reload()
}

function irCrear() {
  router.push({ name: 'ComercialDateosNuevo' })
}
function verDetalle(id: number) {
  router.push({ name: 'ComercialDateoDetalle', params: { id } })
}

async function marcarResultado(id: number, resultado: ResultadoDateo) {
  try {
    await updateDateo(id, { resultado })
    loadItems()
  } catch {
    errorMsg.value = 'No se pudo actualizar el estado'
  }
}

const dlgEliminar = ref<{ visible: boolean; id: number | null; loading: boolean }>({
  visible: false,
  id: null,
  loading: false,
})
function confirmEliminar(id: number) {
  dlgEliminar.value = { visible: true, id, loading: false }
}
async function doEliminar() {
  if (!dlgEliminar.value.id) return
  dlgEliminar.value.loading = true
  try {
    await deleteDateo(dlgEliminar.value.id)
    dlgEliminar.value.visible = false
    loadItems()
  } catch {
    errorMsg.value = 'No se pudo eliminar el dateo'
  } finally {
    dlgEliminar.value.loading = false
  }
}

/* ══════════════════════════════════════════════════
   IMPORTACIÓN HISTÓRICO RTM
══════════════════════════════════════════════════ */

const importacion = ref<{
  visible: boolean
  paso: 1 | 2 | 3
  archivo: File | null
  archivoError: string
  hojas: string
  dryRun: boolean
  loading: boolean
  loadingMsg: string
  preview: HistoricoPreviewResponse | null
  resultado: HistoricoImportarResponse | null
}>({
  visible: false,
  paso: 1,
  archivo: null,
  archivoError: '',
  hojas: '',
  dryRun: false,
  loading: false,
  loadingMsg: '',
  preview: null,
  resultado: null,
})

const contarSinAsesor = computed(() => {
  if (!importacion.value.preview) return 0
  return Object.values(importacion.value.preview.por_hoja).reduce(
    (acc, h) => acc + h.sinAsesor,
    0
  )
})

function abrirImportacion() {
  resetImportacion()
  importacion.value.visible = true
}

function cerrarImportacion() {
  if (importacion.value.loading) return
  importacion.value.visible = false
  if (importacion.value.paso === 3 && (importacion.value.resultado?.resumen.creados ?? 0) > 0) {
    reload()
  }
}

function resetImportacion() {
  importacion.value = {
    visible: false,
    paso: 1,
    archivo: null,
    archivoError: '',
    hojas: '',
    dryRun: false,
    loading: false,
    loadingMsg: '',
    preview: null,
    resultado: null,
  }
}

async function hacerPreview() {
  if (!importacion.value.archivo) {
    importacion.value.archivoError = 'Debes seleccionar un archivo Excel'
    return
  }
  importacion.value.loading = true
  importacion.value.loadingMsg = 'Leyendo el archivo y analizando filas...'
  try {
    const data = await previewHistoricoRtm(
      importacion.value.archivo,
      importacion.value.hojas
    )
    importacion.value.preview = data
    importacion.value.paso = 2
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Error al generar la vista previa'
  } finally {
    importacion.value.loading = false
    importacion.value.loadingMsg = ''
  }
}

async function confirmarImportacion() {
  if (!importacion.value.archivo) return
  importacion.value.loading = true
  importacion.value.loadingMsg = importacion.value.dryRun
    ? 'Simulando importación...'
    : 'Importando dateos y turnos históricos...'
  try {
    const data = await importarHistoricoRtm(
      importacion.value.archivo,
      importacion.value.dryRun,
      importacion.value.hojas
    )
    importacion.value.resultado = data
    importacion.value.paso = 3
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'Error durante la importación'
  } finally {
    importacion.value.loading = false
    importacion.value.loadingMsg = ''
  }
}

/* ── Modal detalle cliente ── */
interface ClienteDetalleModal {
  cliente: {
    nombre: string | null
    docNumero: string | null
    telefono: string | null
  }
  vehiculos: Array<{
    id: number
    placa: string
    marca?: string | null
    modelo?: number | null
  }>
  metricas?: {
    visitas_count: number
    ultima_visita_at: string | null
    dias_desde_ultima_visita: string | null
  }
  kpis?: {
    visitas_count: number
    ultima_visita_at: string | null
    dias_desde_ultima_visita: string | null
  }
  visitas_recientes: Array<{
    id: number
    fecha: string
    placa: string
    estado: string
    servicioNombre?: string | null
  }>
}

const modalCliente = ref<{
  visible: boolean
  loading: boolean
  placa: string | null
  data: ClienteDetalleModal | null
}>({ visible: false, loading: false, placa: null, data: null })

async function abrirDetalleCliente(placa: string) {
  modalCliente.value = { visible: true, loading: true, placa, data: null }
  try {
    const res = await ClientesService.list({ q: placa, perPage: 1 })
    const cliente = (res as { data?: { id: number }[] }).data?.[0]
    if (!cliente) { modalCliente.value.loading = false; return }
    modalCliente.value.data = await ClientesService.detalle(cliente.id) as ClienteDetalleModal
  } catch {
    modalCliente.value.data = null
  } finally {
    modalCliente.value.loading = false
  }
}

/* ── Init ── */
loadAsesores()
loadConveniosAll()
loadItems()
cargarExclusividad()
</script>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.text-h5 { font-weight: bold; }
.evidence-thumb { cursor: zoom-in; }
.font-weight-600 { font-weight: 600; }

.agent-type-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 12px;
  min-width: 92px;
  font-size: 12.6px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  overflow: visible;
  border-radius: 9999px;
}
.agent-type--comercial { background: #E3F2FD; color: #0D47A1; }
.agent-type--convenio  { background: #E8F5E9; color: #1B5E20; }
.agent-type--tele      { background: #FFF3E0; color: #E65100; }

/* Tarjetas resumen del modal */
.resumen-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.resumen-card {
  background: #F5F5F5;
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}
.resumen-card--green  { background: #E8F5E9; }
.resumen-card--orange { background: #FFF3E0; }
.resumen-card--red    { background: #FFEBEE; }
.resumen-label {
  font-size: 11px;
  color: #757575;
  margin-bottom: 4px;
  font-weight: 500;
}
.resumen-valor {
  font-size: 22px;
  font-weight: 700;
  color: #212121;
}
.tabla-borde {
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
