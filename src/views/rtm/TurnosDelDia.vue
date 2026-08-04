<!-- ==================== FRAGMENTO 1: TEMPLATE ==================== -->
<!-- Copia desde aquí hasta el cierre de </template> -->

<template>
  <v-container class="py-4 py-sm-6" :fluid="$vuetify.display.xs">
    <v-card elevation="8" class="pa-4 pa-sm-6 pa-md-8 rounded-xl bg-background-light">
      <v-card-title
        class="text-h5 text-sm-h4 mb-4 mb-sm-6 font-weight-bold d-flex justify-center title-full-bordered-container"
      >
        <span class="title-text-with-border">
          📋 Turnos del Día
          <span class="text-secondary d-none d-sm-inline">
            {{ fechaSeleccionada === todayDateISO ? '(HOY)' : fechaSeleccionada }}
          </span>
        </span>
      </v-card-title>

      <!-- Panel resumen: leyenda del semáforo + contadores del día.
           Los contadores se calculan sobre turnosFiltrados (respeta el
           filtro de servicio/placa activo) — a diferencia del modal
           "Estadísticas" más abajo, que cuenta sobre todos los turnos del
           día sin importar el filtro (comportamiento previo, sin cambios). -->
      <v-card variant="outlined" class="pa-3 pa-sm-4 mb-4 mb-sm-6 rounded-lg">
        <div class="d-flex flex-wrap align-center" style="gap: 8px">
          <span class="text-caption text-sm-body-2 font-weight-bold mr-1">Leyenda:</span>
          <v-chip size="small" color="light-blue-accent-3" variant="elevated" label>
            🔵 En proceso
          </v-chip>
          <v-chip size="small" color="amber" variant="elevated" label>
            🟡 Incompleto (falta una etapa)
          </v-chip>
          <v-chip size="small" color="light-green-accent-3" variant="elevated" label>
            🟢 Finalizado
          </v-chip>
          <v-chip size="small" color="red-accent-2" variant="elevated" label>
            🔴 Cancelado
          </v-chip>
        </div>

        <v-divider class="my-3" />

        <v-row dense>
          <v-col cols="6" sm="3">
            <div class="text-center">
              <div class="text-h6 text-sm-h5 font-weight-bold text-light-blue-darken-2">
                {{ resumenSemaforo.en_proceso }}
              </div>
              <div class="text-caption text-sm-body-2">En proceso</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-center">
              <div class="text-h6 text-sm-h5 font-weight-bold text-amber-darken-3">
                {{ resumenSemaforo.incompleto }}
              </div>
              <div class="text-caption text-sm-body-2">Incompletos</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-center">
              <div class="text-h6 text-sm-h5 font-weight-bold text-green-darken-2">
                {{ resumenSemaforo.finalizado }}
              </div>
              <div class="text-caption text-sm-body-2">Finalizados</div>
            </div>
          </v-col>
          <v-col cols="6" sm="3">
            <div class="text-center">
              <div class="text-h6 text-sm-h5 font-weight-bold text-red-darken-2">
                {{ resumenSemaforo.cancelado }}
              </div>
              <div class="text-caption text-sm-body-2">Cancelados</div>
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-3" />

        <div class="text-center text-subtitle-2 text-sm-subtitle-1 font-weight-bold">
          Total visible con el filtro actual: {{ turnosFiltrados.length }}
        </div>
      </v-card>

      <!-- Filtros y acciones - Responsive -->
      <v-row class="mb-4 align-center">
        <!-- Botón Refrescar -->
        <v-col cols="12" sm="6" md="2">
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-refresh"
            @click="loadTurnosHoy"
            :loading="isLoading"
            class="bordered-button"
            :size="$vuetify.display.xs ? 'default' : 'large'"
            :block="$vuetify.display.xs"
          >
            Refrescar
          </v-btn>
        </v-col>

        <!-- Filtro por servicio -->
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="servicioFiltro"
            :items="servicioFiltroItems"
            label="Filtrar por servicio"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-filter-variant"
            hide-details
          />
        </v-col>

        <!-- Filtro por fecha -->
        <v-col cols="12" sm="6" md="2">
          <v-text-field
            v-model="fechaSeleccionada"
            type="date"
            label="Fecha"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>

        <!-- Búsqueda por placa -->
        <v-col cols="12" sm="6" md="2">
          <v-text-field
            v-model="busquedaPlaca"
            label="Buscar por placa"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-car-search"
            hide-details
            clearable
          />
        </v-col>

        <!-- Botón Ver estadísticas -->
        <v-col cols="12" sm="6" md="2">
          <v-btn
            color="info"
            variant="outlined"
            prepend-icon="mdi-chart-bar"
            @click="openStatsModal"
            class="bordered-button-info"
            :size="$vuetify.display.xs ? 'default' : 'large'"
            :block="$vuetify.display.xs"
          >
            Estadísticas
          </v-btn>
        </v-col>

        <!-- Botón Crear Nuevo Turno -->
        <v-col cols="12" sm="6" md="2">
          <v-btn
            color="success"
            variant="elevated"
            prepend-icon="mdi-plus-circle"
            @click="router.push('/rtm/crear-turno')"
            class="bordered-button-success"
            :size="$vuetify.display.xs ? 'default' : 'large'"
            :block="$vuetify.display.xs"
          >
            Nuevo Turno
          </v-btn>
        </v-col>
      </v-row>

      <v-divider class="my-4 my-sm-6" />

      <!-- Loading -->
      <v-row v-if="isLoading" class="justify-center my-10">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" :size="$vuetify.display.xs ? 48 : 64" />
          <p class="text-caption text-sm-subtitle-1 mt-4">
            Cargando turnos del día...
          </p>
        </v-col>
      </v-row>

      <!-- Sin turnos -->
      <v-row v-else-if="turnosFiltrados.length === 0" class="justify-center my-10">
        <v-col cols="12" class="text-center">
          <v-icon :size="$vuetify.display.xs ? 48 : 64" color="grey-lighten-1">
            mdi-inbox-remove-outline
          </v-icon>
          <p class="text-subtitle-1 text-sm-h6 text-grey-darken-1 mt-4">
            No hay turnos para hoy con el filtro seleccionado.
          </p>
          <p class="text-body-2 text-sm-body-1 text-grey-darken-1">
            ¡Es un buen momento para crear uno nuevo!
          </p>
        </v-col>
      </v-row>

      <!-- Tarjetas - Grid responsive: 1 col móvil, 2 tablet, 3-4 PC -->
      <v-row v-else>
        <v-col
          v-for="turno in turnosFiltrados"
          :key="turno.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            class="turno-card pa-3 pa-sm-4 rounded-lg elevation-4"
            :color="cardColor(turno)"
            :class="`estado-${getEstadoVisual(turno)}`"
          >
            <v-card-title class="text-subtitle-1 text-sm-h6 font-weight-bold pb-1 text-on-primary-text">
              🔢 Turno: {{ displayTurnoNumero(turno) }}
            </v-card-title>

            <!-- Turno del servicio (RTM / SOAT / PREV / PERI) -->
            <div class="text-caption text-sm-subtitle-2 mb-2 font-weight-medium text-on-primary-text">
              {{ getServicioCodigo(turno) }}:
              <span class="font-weight-bold">
                {{ displayTurnoServicio(turno) }}
              </span>
            </div>

            <v-card-text class="pa-2 pa-sm-3">
              <!-- Chip de estado -->
              <v-chip
                class="mb-2 mb-sm-3"
                :size="$vuetify.display.xs ? 'x-small' : 'small'"
                :color="estadoChipColor(turno)"
                variant="elevated"
                label
              >
                {{ estadoChipLabel(turno) }}
              </v-chip>

              <p class="text-caption text-sm-subtitle-1 text-on-primary-text mb-1">
                🛠 Servicio:
                <span class="font-weight-medium">
                  {{ getServicioCodigo(turno) }}
                </span>
              </p>
              <p class="text-caption text-sm-subtitle-1 text-on-primary-text mb-1">
                🚗 Tipo Vehículo:
                <span class="font-weight-medium">
                  {{ turno.tipoVehiculo || 'Desconocido' }}
                </span>
              </p>
              <p class="text-caption text-sm-subtitle-1 text-on-primary-text mb-1">
                🚗 Placa:
                <span class="font-weight-medium">{{ turno.placa }}</span>
              </p>
              <p class="text-caption text-sm-subtitle-1 text-on-primary-text mb-2">
                ⏰ Ingreso:
                <span class="font-weight-medium">
                  {{ formatTime(turno.horaIngreso) }}
                </span>
              </p>

              <p class="text-caption text-sm-subtitle-1 mt-2 mt-sm-3 font-weight-bold text-on-primary-text">
                📌 Etapas:
              </p>

              <div class="etapas-lista">
                <div
                  v-for="(etapa, i) in getEtapas(turno)"
                  :key="etapa.key || i"
                  class="etapa-item"
                >
                  <v-icon
                    :size="$vuetify.display.xs ? 18 : 20"
                    :color="iconColor(etapa, turno)"
                    :class="{
                      'etapa-icon-completed-finalizado':
                        etapa.completed && turno.estado === 'finalizado',
                    }"
                    class="etapa-icono"
                  >
                    {{ etapa.completed ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                  </v-icon>

                  <div class="etapa-contenido">
                    <div class="etapa-row">
                      <div class="etapa-label">
                        <template v-if="etapa.name === 'Facturación'">
                          <v-btn
                            variant="text"
                            color="button-text-light-secondary"
                            class="pa-0 text-capitalize text-on-primary-text"
                            :size="$vuetify.display.xs ? 'x-small' : 'small'"
                            @click.stop="goToFacturacion(turno)"
                          >
                            Facturación
                          </v-btn>
                        </template>

                        <template v-else-if="etapa.name === 'Certificación'">
                          <v-btn
                            variant="text"
                            color="button-text-light-secondary"
                            class="pa-0 text-capitalize text-on-primary-text"
                            :size="$vuetify.display.xs ? 'x-small' : 'small'"
                            @click.stop="goToCertificacion(turno)"
                          >
                            Certificación
                          </v-btn>
                        </template>

                        <span
                          v-else
                          :class="{
                            'text-decoration-line-through text-on-primary-text-faded':
                              etapa.completed && etapa.name !== 'Puerta',
                          }"
                          class="text-caption text-sm-body-2 text-on-primary-text"
                        >
                          {{ etapa.name }}
                        </span>
                      </div>

                      <span
                        v-if="etapa.time"
                        class="text-on-primary-text-faded etapa-time"
                      >
                        {{ formatTime(etapa.time) }}
                      </span>
                    </div>

                    <div
                      v-if="etapa.funcionario && etapa.completed"
                      class="etapa-funcionario text-on-primary-text-faded"
                    >
                      <v-icon size="x-small" class="mr-1">mdi-account</v-icon>
                      {{ etapa.funcionario }}
                    </div>
                  </div>
                </div>
              </div>
              <!-- 👇 CHIPS DE OBSERVACIONES CON HOVER + CLICK -->
              <div class="mt-2 mt-sm-3 d-flex flex-wrap" style="gap:6px">
                <!-- Observaciones del dateo - HOVER + CLICK -->
                <v-menu
                  v-if="turno.dateoObservacion"
                  open-on-hover
                  :open-delay="200"
                  :close-delay="100"
                  location="top"
                  max-width="350"
                >
                  <template #activator="{ props }">
                    <v-chip
                      v-bind="props"
                      color="amber-darken-2"
                      variant="elevated"
                      :size="$vuetify.display.xs ? 'x-small' : 'small'"
                      prepend-icon="mdi-comment-text-outline"
                      @click="abrirObservacionesDateo(turno)"
                      class="cursor-pointer chip-observacion"
                    >
                      <span class="text-caption">Ver obs. dateo</span>
                    </v-chip>
                  </template>

                  <!-- Tooltip/Preview rápido al pasar el cursor -->
                  <v-card class="pa-2 rounded-lg preview-card" elevation="6">
                    <div class="text-caption font-weight-bold mb-1 text-amber-darken-3">
                      📝 Vista rápida - Obs. Dateo
                    </div>
                    <div class="text-caption text-truncate-3-lines">
                      {{ turno.dateoObservacion }}
                    </div>
                    <div class="text-caption text-grey-darken-1 mt-1 text-center">
                      <v-icon size="x-small">mdi-information-outline</v-icon>
                      Click para ver detalles completos
                    </div>
                  </v-card>
                </v-menu>

                <!-- Observaciones del turno - HOVER + CLICK -->
                <v-menu
                  v-if="turno.observaciones"
                  open-on-hover
                  :open-delay="200"
                  :close-delay="100"
                  location="top"
                  max-width="350"
                >
                  <template #activator="{ props }">
                    <v-chip
                      v-bind="props"
                      color="blue-darken-2"
                      variant="elevated"
                      :size="$vuetify.display.xs ? 'x-small' : 'small'"
                      prepend-icon="mdi-note-text-outline"
                      @click="abrirObservacionesTurno(turno)"
                      class="cursor-pointer chip-observacion"
                    >
                      <span class="text-caption">Ver obs. turno</span>
                    </v-chip>
                  </template>

                  <!-- Tooltip/Preview rápido al pasar el cursor -->
                  <v-card class="pa-2 rounded-lg preview-card" elevation="6">
                    <div class="text-caption font-weight-bold mb-1 text-blue-darken-3">
                      📋 Vista rápida - Obs. Turno
                    </div>
                    <div class="text-caption text-truncate-3-lines">
                      {{ turno.observaciones }}
                    </div>
                    <div class="text-caption text-grey-darken-1 mt-1 text-center">
                      <v-icon size="x-small">mdi-information-outline</v-icon>
                      Click para ver detalles completos
                    </div>
                  </v-card>
                </v-menu>
              </div>
            </v-card-text>

            <v-card-actions class="justify-center pt-0 flex-column flex-sm-row">
              <v-btn
                color="button-text-light-warning"
                variant="text"
                prepend-icon="mdi-pencil"
                :size="$vuetify.display.xs ? 'small' : 'default'"
                @click="openConfirmDialog(turno, 'editar')"
              >
                Editar
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top right"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn color="white" variant="text" @click="snackbar.show = false">
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Diálogo confirmar acción -->
    <v-dialog v-model="confirmDialog.show" :max-width="$vuetify.display.xs ? '90%' : '500'">
      <v-card>
        <v-card-title class="text-subtitle-1 text-sm-h6 font-weight-bold">
          {{ confirmDialog.title }}
        </v-card-title>
        <v-card-text class="text-body-2 text-sm-body-1">
          {{ confirmDialog.message }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="confirmDialog.show = false">
            Cancelar
          </v-btn>
          <v-btn
            :color="confirmDialog.color"
            variant="elevated"
            @click="handleConfirmAction"
            class="bordered-dialog-button"
          >
            Confirmar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 👇 Modal para observaciones del dateo -->
    <v-dialog
      v-model="modalObservacionesDateo.show"
      :max-width="$vuetify.display.xs ? '95%' : '600'"
      :fullscreen="$vuetify.display.xs"
    >
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center justify-space-between pa-3 pa-sm-4 bg-amber-lighten-5">
          <div class="d-flex align-center" style="gap:8px">
            <v-icon color="amber-darken-2" :size="$vuetify.display.xs ? 20 : 24">
              mdi-comment-text-multiple-outline
            </v-icon>
            <span class="text-subtitle-1 text-sm-h6 font-weight-bold">
              Observaciones del Dateo
            </span>
          </div>
          <v-btn
            icon
            variant="text"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="modalObservacionesDateo.show = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-3 pa-sm-5">
          <!-- Info del turno -->
          <div class="mb-3 mb-sm-4">
            <div class="d-flex flex-wrap mb-2" style="gap:6px">
              <v-chip
                color="primary"
                variant="tonal"
                :size="$vuetify.display.xs ? 'x-small' : 'small'"
                prepend-icon="mdi-counter"
              >
                Turno: {{ modalObservacionesDateo.turnoNumero }}
              </v-chip>
              <v-chip
                color="indigo"
                variant="tonal"
                :size="$vuetify.display.xs ? 'x-small' : 'small'"
                prepend-icon="mdi-car"
              >
                {{ modalObservacionesDateo.placa }}
              </v-chip>
              <v-chip
                v-if="modalObservacionesDateo.dateoCanal"
                color="success"
                variant="tonal"
                :size="$vuetify.display.xs ? 'x-small' : 'small'"
                prepend-icon="mdi-source-branch"
              >
                Canal: {{ modalObservacionesDateo.dateoCanal }}
              </v-chip>
            </div>
          </div>

          <!-- Observaciones -->
          <v-card variant="tonal" class="pa-3 pa-sm-4 rounded-lg bg-amber-lighten-5">
            <div class="text-caption text-sm-body-2 font-weight-medium text-amber-darken-3 mb-2">
              📝 Observaciones del dateo:
            </div>
            <div class="text-body-2 text-sm-body-1" style="white-space: pre-wrap;">
              {{ modalObservacionesDateo.observacion || 'Sin observaciones' }}
            </div>
          </v-card>

          <!-- Imagen si existe -->
          <div v-if="modalObservacionesDateo.imagenUrl" class="mt-3 mt-sm-4">
            <div class="text-caption text-sm-body-2 font-weight-medium mb-2">
              📸 Evidencia fotográfica del dateo:
            </div>
            <v-img
              :src="modalObservacionesDateo.imagenUrl"
              :max-height="$vuetify.display.xs ? 250 : 400"
              class="rounded-lg"
              cover
            />
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="justify-end pa-3 pa-sm-4">
          <v-btn
            color="primary"
            variant="elevated"
            @click="modalObservacionesDateo.show = false"
            :size="$vuetify.display.xs ? 'small' : 'default'"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 👇 Modal para observaciones del turno -->
    <v-dialog
      v-model="modalObservacionesTurno.show"
      :max-width="$vuetify.display.xs ? '95%' : '600'"
      :fullscreen="$vuetify.display.xs"
    >
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center justify-space-between pa-3 pa-sm-4 bg-blue-lighten-5">
          <div class="d-flex align-center" style="gap:8px">
            <v-icon color="blue-darken-2" :size="$vuetify.display.xs ? 20 : 24">
              mdi-note-text-outline
            </v-icon>
            <span class="text-subtitle-1 text-sm-h6 font-weight-bold">
              Observaciones del Turno
            </span>
          </div>
          <v-btn
            icon
            variant="text"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            @click="modalObservacionesTurno.show = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-3 pa-sm-5">
          <!-- Info del turno -->
          <div class="mb-3 mb-sm-4">
            <div class="d-flex flex-wrap mb-2" style="gap:6px">
              <v-chip
                color="primary"
                variant="tonal"
                :size="$vuetify.display.xs ? 'x-small' : 'small'"
                prepend-icon="mdi-counter"
              >
                Turno: {{ modalObservacionesTurno.turnoNumero }}
              </v-chip>
              <v-chip
                color="indigo"
                variant="tonal"
                :size="$vuetify.display.xs ? 'x-small' : 'small'"
                prepend-icon="mdi-car"
              >
                {{ modalObservacionesTurno.placa }}
              </v-chip>
              <v-chip
                v-if="modalObservacionesTurno.servicio"
                color="success"
                variant="tonal"
                :size="$vuetify.display.xs ? 'x-small' : 'small'"
                prepend-icon="mdi-wrench"
              >
                {{ modalObservacionesTurno.servicio }}
              </v-chip>
              <v-chip
                v-if="modalObservacionesTurno.fecha"
                color="grey"
                variant="tonal"
                :size="$vuetify.display.xs ? 'x-small' : 'small'"
                prepend-icon="mdi-calendar"
              >
                {{ modalObservacionesTurno.fecha }}
              </v-chip>
            </div>
          </div>

          <!-- Observaciones -->
          <v-card variant="tonal" class="pa-3 pa-sm-4 rounded-lg bg-blue-lighten-5">
            <div class="text-caption text-sm-body-2 font-weight-medium text-blue-darken-3 mb-2">
              📋 Observaciones del turno:
            </div>
            <div class="text-body-2 text-sm-body-1" style="white-space: pre-wrap;">
              {{ modalObservacionesTurno.observacion || 'Sin observaciones' }}
            </div>
          </v-card>
        </v-card-text>

        <v-divider />

        <v-card-actions class="justify-end pa-3 pa-sm-4">
          <v-btn
            color="primary"
            variant="elevated"
            @click="modalObservacionesTurno.show = false"
            :size="$vuetify.display.xs ? 'small' : 'default'"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal estadísticas - Responsive -->
    <v-dialog
      v-model="showStatsModal"
      :max-width="$vuetify.display.xs ? '95%' : '1000'"
      :fullscreen="$vuetify.display.xs"
      scrollable
    >
      <v-card class="rounded-xl bg-white">
        <v-card-title class="text-h6 text-sm-h5 text-center text-primary font-weight-bold py-3 py-sm-4">
          📊 Estadísticas de Turnos (Hoy)
        </v-card-title>
        <v-card-text>
          <p class="text-subtitle-1 text-sm-h6 mb-1 text-center">
            Total de turnos visibles con el filtro actual:
            <strong>{{ turnosFiltrados.length }}</strong>
          </p>
          <p class="text-caption text-sm-body-2 text-center text-grey-darken-1">
            Incluye turnos en proceso, incompletos, finalizados y cancelados.
          </p>

          <v-row class="mt-4">
            <!-- Resumen por estado -->
            <v-col cols="12" md="4">
              <v-card variant="outlined" class="pa-3 pa-sm-4 h-100">
                <v-card-title class="text-subtitle-1 text-sm-h6 text-secondary">
                  Por Estado
                </v-card-title>
                <v-list density="compact">
                  <v-list-item>
                    <v-list-item-title class="text-caption text-sm-body-2">En proceso</v-list-item-title>
                    <template #append>
                      <v-chip color="light-blue-accent-3" label :size="$vuetify.display.xs ? 'small' : 'default'">
                        {{ conteoPorEstado.enProceso }}
                      </v-chip>
                    </template>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="text-caption text-sm-body-2">Incompletos</v-list-item-title>
                    <template #append>
                      <v-chip color="amber" label :size="$vuetify.display.xs ? 'small' : 'default'">
                        {{ conteoPorEstado.incompletos }}
                      </v-chip>
                    </template>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="text-caption text-sm-body-2">Finalizados</v-list-item-title>
                    <template #append>
                      <v-chip color="light-green-accent-4" label :size="$vuetify.display.xs ? 'small' : 'default'">
                        {{ conteoPorEstado.finalizados }}
                      </v-chip>
                    </template>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title class="text-caption text-sm-body-2">Cancelados</v-list-item-title>
                    <template #append>
                      <v-chip color="red-accent-2" label :size="$vuetify.display.xs ? 'small' : 'default'">
                        {{ conteoPorEstado.cancelados }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Resumen por servicio + tipo de vehículo -->
            <v-col cols="12" md="8">
              <v-card variant="outlined" class="pa-3 pa-sm-4">
                <v-card-title class="text-subtitle-1 text-sm-h6 text-secondary">
                  Por Servicio y Tipo de Vehículo
                </v-card-title>

                <div class="table-scroll-x">
                  <v-table density="compact" :class="$vuetify.display.xs ? 'text-caption' : ''">
                    <thead>
                      <tr>
                        <th>Servicio</th>
                        <th class="text-center">Total</th>
                        <th class="text-center" v-if="$vuetify.display.smAndUp">Liv. Particular</th>
                        <th class="text-center" v-if="$vuetify.display.smAndUp">Liv. Taxi</th>
                        <th class="text-center" v-if="$vuetify.display.smAndUp">Liv. Público</th>
                        <th class="text-center">Motocicleta</th>
                        <th class="text-center" v-if="$vuetify.display.mdAndUp">Desconocido</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(stats, servicioCodigo) in servicioStats"
                        :key="servicioCodigo"
                      >
                        <td><strong>{{ servicioCodigo }}</strong></td>
                        <td class="text-center">{{ stats.total }}</td>
                        <td class="text-center" v-if="$vuetify.display.smAndUp">{{ stats.porTipo['Liviano Particular'] }}</td>
                        <td class="text-center" v-if="$vuetify.display.smAndUp">{{ stats.porTipo['Liviano Taxi'] }}</td>
                        <td class="text-center" v-if="$vuetify.display.smAndUp">{{ stats.porTipo['Liviano Público'] }}</td>
                        <td class="text-center">{{ stats.porTipo['Motocicleta'] }}</td>
                        <td class="text-center" v-if="$vuetify.display.mdAndUp">{{ stats.porTipo['Desconocido'] }}</td>
                      </tr>
                      <tr v-if="Object.keys(servicioStats).length === 0">
                        <td :colspan="$vuetify.display.xs ? 3 : 7" class="text-center text-grey-darken-1">
                          No hay turnos para hoy.
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <v-row>
            <!-- Gráfico por tipo de vehículo -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-3 pa-sm-4">
                <v-card-title class="text-subtitle-1 text-sm-h6 text-secondary">
                  Por Tipo de Vehículo
                </v-card-title>
                <div :style="{ height: $vuetify.display.xs ? '200px' : '250px' }">
                  <BarChart :data="chartDataTipoVehiculo" :options="chartOptions" />
                </div>
              </v-card>
            </v-col>

            <!-- Conteo por canal de captación -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-3 pa-sm-4">
                <v-card-title class="text-subtitle-1 text-sm-h6 text-secondary">
                  Canal de captación (¿Cómo nos conoció?)
                </v-card-title>
                <v-list density="compact">
                  <v-list-item
                    v-for="(count, medio) in statsData.medioEntero"
                    :key="medio"
                  >
                    <v-list-item-title class="text-caption text-sm-body-2 font-weight-medium text-capitalize">
                      {{ medio }}:
                    </v-list-item-title>
                    <template #append>
                      <v-chip color="blue-grey" label :size="$vuetify.display.xs ? 'small' : 'default'">
                        {{ count }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end py-3 py-sm-4 flex-column flex-sm-row gap-2">
          <v-btn
            color="secondary"
            variant="outlined"
            prepend-icon="mdi-file-excel"
            @click="downloadExcelDia"
            :loading="isDownloadingExcel"
            :disabled="isDownloadingExcel"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            :block="$vuetify.display.xs"
          >
            <span v-if="$vuetify.display.smAndUp">Descargar Excel del día</span>
            <span v-else>Excel</span>
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="showStatsModal = false"
            :size="$vuetify.display.xs ? 'small' : 'default'"
            :block="$vuetify.display.xs"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<!-- ==================== FRAGMENTO 2: SCRIPT ==================== -->
<!-- Copia desde <script setup lang="ts"> hasta </script> -->

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import TurnosDelDiaService, { type EstadoVisual } from '@/services/turnosdeldiaService'
import { authSetStore } from '@/stores/AuthStore'

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  type TooltipItem,
} from 'chart.js'
import { Bar as BarChart } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement)

/* ===== Tipos ===== */
type TipoVehiculoFrontend =
  | 'Liviano Particular'
  | 'Liviano Taxi'
  | 'Liviano Público'
  | 'Motocicleta'

type TipoVehiculoStatsKey =
  | TipoVehiculoFrontend
  | 'Desconocido'

const TIPO_VEHICULO_KEYS: TipoVehiculoStatsKey[] = [
  'Liviano Particular',
  'Liviano Taxi',
  'Liviano Público',
  'Motocicleta',
  'Desconocido',
]

type MedioCaptacionLabel = 'Redes Sociales' | 'Call Center' | 'Fachada' | 'Asesor' | 'Otros'

interface ServicioEnTurno {
  id: number
  codigoServicio: string
  nombreServicio: string
}

interface TurnoConSnakeCase {
  turno_numero_servicio?: number | null
}

interface Turno {
  id: number
  fecha: string
  horaIngreso: string | null
  horaSalida: string | null
  tiempoServicio: string | null
  turnoNumero: number
  turnoNumeroServicio?: number | null
  turnoCodigo?: string
  placa: string
  tipoVehiculo: TipoVehiculoFrontend | null
  tieneCita: boolean
  convenio: string | null
  referidoInterno: string | null
  referidoExterno: string | null
  medioEntero: string | null
  observaciones: string | null
  funcionarioId: number
  estado: 'activo' | 'inactivo' | 'cancelado' | 'finalizado'

  servicioId?: number | null
  servicio?: ServicioEnTurno | null
  servicioCodigo?: 'RTM' | 'SOAT' | 'PREV' | 'PERI' | string
  servicioNombre?: string

  // ✅ Usuario que CREÓ el turno (etapa Puerta)
  usuario?: {
    id: number
    nombres: string
    apellidos: string
  }

  // ⚠️ Mantener por compatibilidad (puede que venga como "funcionario" del backend)
  funcionario?: {
    id: number
    nombres: string
    apellidos: string
  }

  createdAt: string
  updatedAt: string

  tieneFacturacion?: boolean | null
  horaFacturacion?: string | null

  dateoObservacion?: string | null
  dateoImagenUrl?: string | null
  dateoCanal?: string | null

  // ✅ Usuario que FACTURÓ el turno (etapa Facturación)
  facturacionFuncionario?: {
    id: number
    nombres: string
    apellidos: string
  } | null

  // ✅ Usuario que CERTIFICÓ el turno (etapa Certificación)
  certificacionFuncionario?: {
    id: number
    nombres: string
    apellidos: string
  } | null

  // ✅ Semáforo de etapas, calculado en backend (turno_etapas_service) —
  // única fuente de verdad. No recalcular esta cuenta en el frontend.
  etapasRequeridas?: number
  etapasCompletadas?: number
  estadoVisual?: EstadoVisual
}

interface Etapa {
  key: string
  name: string
  completed: boolean
  time: string | null
  funcionario?: string | null  //  AGREGAR ESTA LÍNEA
}

/* ===== Estado ===== */
const router = useRouter()

const turnos = ref<Turno[]>([])
const isLoading = ref(true)
const todayDate = ref('')
const todayDateISO = ref('')
const fechaSeleccionada = ref('')
const busquedaPlaca = ref('')

const snackbar = ref({
  show: false,
  message: '',
  color: '',
  timeout: 4000,
})

const showSnackbar = (message: string, color = 'info', timeout = 4000) => {
  snackbar.value = { show: true, message, color, timeout }
}

/* ===== Filtro por servicio ===== */
const servicioFiltro = ref<string>('TODOS')
const servicioFiltroItems = [
  { title: 'Todos los servicios', value: 'TODOS' },
  { title: 'RTM', value: 'RTM' },
  { title: 'SOAT', value: 'SOAT' },
  { title: 'Preventiva', value: 'PREV' },
  { title: 'Peritaje', value: 'PERI' },
]

const turnosFiltrados = computed(() => {
  return turnos.value.filter((t) => {
    const pasaServicio =
      servicioFiltro.value === 'TODOS' ||
      getServicioCodigo(t).toUpperCase() === servicioFiltro.value.toUpperCase()

    const pasaPlaca =
      !busquedaPlaca.value ||
      t.placa.toUpperCase().includes(busquedaPlaca.value.toUpperCase())

    return pasaServicio && pasaPlaca
  })
})

/**
 * Resumen del semáforo para el panel superior. A propósito cuenta sobre
 * `turnosFiltrados` (no sobre `turnos`) para reflejar exactamente los
 * turnos que el asesor tiene visibles según el filtro de servicio/placa que
 * tenga puesto — el modal "Estadísticas" histórico cuenta sobre `turnos`
 * sin filtrar, que es un bug conocido y separado de este panel.
 */
const resumenSemaforo = computed(() => {
  const res = {
    en_proceso: 0,
    incompleto: 0,
    finalizado: 0,
    cancelado: 0,
  }

  turnosFiltrados.value.forEach((t) => {
    res[getEstadoVisual(t)]++
  })

  return res
})

/* ===== Modal observaciones del dateo ===== */
const modalObservacionesDateo = ref({
  show: false,
  turnoNumero: '' as string | number,
  placa: '',
  observacion: '',
  imagenUrl: null as string | null,
  dateoCanal: null as string | null,
})

const abrirObservacionesDateo = (turno: Turno) => {
  modalObservacionesDateo.value = {
    show: true,
    turnoNumero: displayTurnoNumero(turno),
    placa: turno.placa,
    observacion: turno.dateoObservacion || '',
    imagenUrl: turno.dateoImagenUrl || null,
    dateoCanal: turno.dateoCanal || null,
  }
}

/* ===== Modal observaciones del turno ===== */
const modalObservacionesTurno = ref({
  show: false,
  turnoNumero: '' as string | number,
  placa: '',
  servicio: '',
  fecha: '',
  observacion: '',
})

const abrirObservacionesTurno = (turno: Turno) => {
  // Combinar fecha + hora de ingreso
  let fechaCompleta = ''
  if (turno.fecha && turno.horaIngreso) {
    const fecha = DateTime.fromISO(turno.fecha, { zone: 'America/Bogota' })
    if (fecha.isValid) {
      fechaCompleta = `${formatTime(turno.horaIngreso)} • ${fecha.toFormat('dd/MM/yyyy')}`
    }
  } else if (turno.fecha) {
    fechaCompleta = formatFechaModal(turno.fecha)
  }

  modalObservacionesTurno.value = {
    show: true,
    turnoNumero: displayTurnoNumero(turno),
    placa: turno.placa,
    servicio: getServicioCodigo(turno),
    fecha: fechaCompleta,
    observacion: turno.observaciones || '',
  }
}

/**
 * Conteo por estado para el modal "Estadísticas". Fuente de datos alineada
 * con el panel resumen de arriba: mismo array (turnosFiltrados, respeta el
 * filtro de servicio/placa activo) y mismo semáforo centralizado
 * (getEstadoVisual/estadoVisual del backend) en vez de turno.estado crudo,
 * para no repetir el bug de contar como "Finalizados" turnos que en
 * realidad saltaron una etapa.
 */
const conteoPorEstado = computed(() => {
  const res = {
    enProceso: 0,
    incompletos: 0,
    finalizados: 0,
    cancelados: 0,
  }

  turnosFiltrados.value.forEach((t) => {
    const ev = getEstadoVisual(t)
    if (ev === 'en_proceso') res.enProceso++
    else if (ev === 'incompleto') res.incompletos++
    else if (ev === 'finalizado') res.finalizados++
    else if (ev === 'cancelado') res.cancelados++
  })

  return res
})

/* ===== Stats por servicio y tipo vehiculo ===== */
const servicioStats = computed(() => {
  const base: Record<string, { total: number; porTipo: Record<TipoVehiculoStatsKey, number> }> = {}

  turnos.value.forEach((t) => {
    const servicio = getServicioCodigo(t) || 'SIN_SERVICIO'
    if (!base[servicio]) {
      const porTipoInit = {} as Record<TipoVehiculoStatsKey, number>
      TIPO_VEHICULO_KEYS.forEach((k) => (porTipoInit[k] = 0))
      base[servicio] = {
        total: 0,
        porTipo: porTipoInit,
      }
    }

    const tipoKey: TipoVehiculoStatsKey =
      t.tipoVehiculo && TIPO_VEHICULO_KEYS.includes(t.tipoVehiculo as TipoVehiculoStatsKey)
        ? (t.tipoVehiculo as TipoVehiculoStatsKey)
        : 'Desconocido'

    base[servicio].total++
    base[servicio].porTipo[tipoKey]++
  })

  return base
})

/* ===== Confirm dialog ===== */
const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  action: '',
  turno: null as Turno | null,
  color: 'primary',
})

const displayTurnoNumero = (turno: Turno) => {
  if (
    turno.estado === 'cancelado' ||
    turno.estado === 'inactivo' ||
    !turno.turnoNumero ||
    turno.turnoNumero <= 0
  ) {
    return '—'
  }
  return turno.turnoNumero
}

const displayTurnoServicio = (turno: Turno) => {
  const turnoConSnake = turno as Turno & TurnoConSnakeCase
  const n = turno.turnoNumeroServicio ?? turnoConSnake.turno_numero_servicio ?? null
  if (
    turno.estado === 'cancelado' ||
    turno.estado === 'inactivo' ||
    !n ||
    n <= 0
  ) {
    return '—'
  }
  return n
}

const openConfirmDialog = (turno: Turno, action: 'editar' | 'continuar') => {
  confirmDialog.value = {
    show: true,
    turno,
    action,
    title: action === 'editar' ? 'Editar Turno' : 'Continuar Turno',
    message: `¿Está seguro que desea ${
      action === 'editar' ? 'editar' : 'continuar con'
    } el turno ${displayTurnoNumero(turno)}?`,
    color: action === 'editar' ? 'warning' : 'secondary',
  }
}

const handleConfirmAction = () => {
  const { action, turno } = confirmDialog.value
  if (!turno) return

  confirmDialog.value.show = false

  if (action === 'editar') {
    router.push(`/rtm/editar-turno/${turno.id}`)
  } else if (action === 'continuar') {
    router.push(`/rtm/proximamente`)
  }
}

/* ===== Navegación ===== */
const goToFacturacion = (turno: Turno) => {
  router.push({
    path: '/facturacion/subir-ticket',
    query: { turnoId: String(turno.id) },
  })
}

const goToCertificacion = (turno: Turno) => {
  router.push({
    name: 'RtmCertificacion',
    params: { id: turno.id },
  })
}

/* ===== Helpers ===== */
const formatTime = (timeString: string | null): string => {
  if (!timeString) return ''
  let time: DateTime

  if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeString)) {
    time = DateTime.fromFormat(
      timeString,
      timeString.length === 5 ? 'HH:mm' : 'HH:mm:ss',
      { zone: 'America/Bogota' }
    )
  } else {
    time = DateTime.fromISO(timeString, { zone: 'America/Bogota' })
  }

  return time.isValid ? time.toFormat('hh:mm a') : timeString ?? ''
}

const getServicioCodigo = (t: Turno): string => {
  return t.servicio?.codigoServicio ?? t.servicioCodigo ?? '—'
}

/* ===== Formatear fecha para modales ===== */
const formatFechaModal = (fechaString: string | null): string => {
  if (!fechaString) return ''

  const fecha = DateTime.fromISO(fechaString, { zone: 'America/Bogota' })

  if (!fecha.isValid) {
    // Intentar parsear como date simple
    const fechaSimple = DateTime.fromFormat(fechaString, 'yyyy-MM-dd', { zone: 'America/Bogota' })
    if (fechaSimple.isValid) {
      return fechaSimple.toFormat('dd/MM/yyyy')
    }
    return fechaString
  }

  // Si tiene hora, mostrar fecha y hora
  if (fecha.hour !== 0 || fecha.minute !== 0) {
    return fecha.toFormat('HH:mm dd/MM/yyyy')
  }

  // Si no tiene hora, solo mostrar fecha
  return fecha.toFormat('dd/MM/yyyy')
}

/* ===== Colores ===== */
/**
 * Estado visual (semáforo) del turno. Viene calculado desde el backend
 * (turno_etapas_service → computeEtapasTurno) para que el conteo de etapas
 * completas/requeridas no se desincronice entre frontend y backend. Si por
 * algún motivo no llegara (respuesta vieja en caché, etc.) se asume
 * 'en_proceso' como valor seguro por defecto.
 */
const getEstadoVisual = (turno: Turno): EstadoVisual => turno.estadoVisual ?? 'en_proceso'

const cardColor = (turno: Turno) => {
  const ev = getEstadoVisual(turno)
  if (turno.estado === 'inactivo') return 'grey-darken-1'
  if (ev === 'finalizado') return 'success'
  if (ev === 'incompleto') return 'warning'
  if (ev === 'cancelado') return 'error'
  return 'primary'
}

const estadoChipLabel = (turno: Turno) => {
  const ev = getEstadoVisual(turno)
  if (turno.estado === 'inactivo') return 'Inactivo'
  if (ev === 'finalizado') return 'Finalizado'
  if (ev === 'incompleto') return 'Incompleto'
  if (ev === 'cancelado') return 'Cancelado'
  return 'En proceso'
}

const estadoChipColor = (turno: Turno) => {
  const ev = getEstadoVisual(turno)
  if (turno.estado === 'inactivo') return 'grey'
  if (ev === 'finalizado') return 'light-green-accent-3'
  if (ev === 'incompleto') return 'amber'
  if (ev === 'cancelado') return 'red-accent-2'
  return 'light-blue-accent-3'
}

const iconColor = (etapa: Etapa, turno: Turno) => {
  if (!etapa.completed) {
    return 'on-primary-text-light'
  }
  if (getEstadoVisual(turno) === 'finalizado') {
    return 'white'
  }
  return 'success'
}

/* ===== Cargar turnos ===== */
const loadTurnosHoy = async () => {
  isLoading.value = true
  try {
    const fechaISO = fechaSeleccionada.value

    const filters = { fecha: fechaISO }
    const data = (await TurnosDelDiaService.fetchTurnos(filters)) as unknown as Turno[]

    turnos.value = data.filter((turno) => {
      const turnoFechaNormalizada = turno.fecha
        ? new Date(turno.fecha).toISOString().slice(0, 10)
        : ''
      const esFechaSeleccionada = turnoFechaNormalizada === fechaISO
      const notInactivo = turno.estado !== 'inactivo'
      return esFechaSeleccionada && notInactivo
    })

    showSnackbar('Turnos cargados correctamente.', 'success')
  } catch (error: unknown) {
    console.error('Error al cargar turnos del día:', error)
    let message = 'Error al cargar los turnos del día. Intente recargar la página.'
    if (error instanceof Error) {
      message = error.message
      if (
        message.includes('Sesión expirada') ||
        message.includes('no autorizada')
      ) {
        const authStore = authSetStore()
        authStore.logout()
        router.push('/login')
      }
    }
    showSnackbar(message, 'error')
    turnos.value = []
  } finally {
    isLoading.value = false
  }
}

watch(fechaSeleccionada, () => loadTurnosHoy())

const getEtapas = (turno: Turno): Etapa[] => {
  // Fuente de verdad de cuántas etapas requiere el turno: turno.etapasRequeridas
  // (calculado en backend por turno_etapas_service). Si no llegara, se asume
  // 3 (Puerta+Facturación+Certificación) como caso general.
  const esSOAT = (turno.etapasRequeridas ?? 3) < 3

  const etapas: Etapa[] = [
    {
      key: `puerta-${turno.id}`,
      name: 'Puerta',
      completed: !!turno.horaIngreso,
      time: turno.horaIngreso,
      funcionario: turno.usuario  // ✅ CORRECTO
        ? `${turno.usuario.nombres} ${turno.usuario.apellidos}`
        : null
    },
    {
      key: `facturacion-${turno.id}`,
      name: 'Facturación',
      completed: !!turno.tieneFacturacion,
      time: turno.horaFacturacion ?? null,
      funcionario: turno.facturacionFuncionario
        ? `${turno.facturacionFuncionario.nombres} ${turno.facturacionFuncionario.apellidos}`
        : null
    },
  ]

  // Solo agregar certificación si NO es SOAT
  if (!esSOAT) {
    etapas.push({
      key: `certificacion-${turno.id}`,
      name: 'Certificación',
      completed: !!turno.horaSalida,
      time: turno.horaSalida,
      funcionario: turno.certificacionFuncionario
        ? `${turno.certificacionFuncionario.nombres} ${turno.certificacionFuncionario.apellidos}`
        : null
    })
  }

  if (turno.estado === 'cancelado' || turno.estado === 'inactivo') {
    etapas.forEach((etapa) => {
      etapa.completed = false
      etapa.funcionario = null  // 👈 AGREGAR ESTA LÍNEA
    })
  }

  return etapas
}
/* ===== Stats ===== */
const showStatsModal = ref(false)
const statsData = ref({
  tipoVehiculo: {} as Record<TipoVehiculoStatsKey, number>,
  medioEntero: {
    'Redes Sociales': 0,
    'Call Center': 0,
    Fachada: 0,
    Asesor: 0,
    Otros: 0,
  } as Record<MedioCaptacionLabel, number>,
})

const initTipoVehiculoStats = () => {
  const base: Record<TipoVehiculoStatsKey, number> = {} as Record<TipoVehiculoStatsKey, number>
  TIPO_VEHICULO_KEYS.forEach((k) => (base[k] = 0))
  statsData.value.tipoVehiculo = base
}

const mapMedioToCanalCaptacion = (
  medio: Turno['medioEntero']
): MedioCaptacionLabel => {
  if (!medio) return 'Otros'
  const m = medio.toString().toLowerCase()

  if (m.includes('redes')) return 'Redes Sociales'
  if (m.includes('call') || m.includes('tele')) return 'Call Center'
  if (m.includes('fachada')) return 'Fachada'
  if (m.includes('asesor')) return 'Asesor'
  if (m.includes('referido') || m.includes('convenio')) return 'Asesor'

  return 'Otros'
}

const calculateStats = () => {
  initTipoVehiculoStats()
  statsData.value.medioEntero = {
    'Redes Sociales': 0,
    'Call Center': 0,
    Fachada: 0,
    Asesor: 0,
    Otros: 0,
  }

  turnos.value.forEach((turno) => {
    const tipoKey: TipoVehiculoStatsKey =
      turno.tipoVehiculo && TIPO_VEHICULO_KEYS.includes(turno.tipoVehiculo as TipoVehiculoStatsKey)
        ? (turno.tipoVehiculo as TipoVehiculoStatsKey)
        : 'Desconocido'
    statsData.value.tipoVehiculo[tipoKey]++

    const canal = mapMedioToCanalCaptacion(turno.medioEntero)
    statsData.value.medioEntero[canal]++
  })
}

const openStatsModal = () => {
  calculateStats()
  showStatsModal.value = true
}

const isDownloadingExcel = ref(false)

/** Dispara la descarga de un Blob como archivo (mismo patrón que ContadorConvenios.vue). */
const triggerBlobDownload = (data: Blob, filename: string) => {
  const url = window.URL.createObjectURL(new Blob([data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const downloadExcelDia = async () => {
  isDownloadingExcel.value = true
  try {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Bogota',
    }
    const formatter = new Intl.DateTimeFormat('es-CO', options)
    const parts = formatter.formatToParts(today)
    const year = parts.find((p) => p.type === 'year')?.value
    const month = parts.find((p) => p.type === 'month')?.value
    const day = parts.find((p) => p.type === 'day')?.value
    const todayISO = `${year}-${month}-${day}`

    // 👇 Usa TurnosDelDiaService (fetch con Bearer token), NO window.open():
    // la API exige Authorization header y esta app no usa cookies de sesión,
    // así que abrir la URL directo en una pestaña nueva siempre devolvía 401.
    const { data, filename } = await TurnosDelDiaService.exportTurnosExcel({
      fechaInicio: todayISO,
      fechaFin: todayISO,
    })
    triggerBlobDownload(data, filename)
    showSnackbar('Excel del día descargado.', 'success')
  } catch (error) {
    console.error('Error al descargar Excel del día:', error)
    showSnackbar('No se pudo descargar el Excel del día.', 'error')
  } finally {
    isDownloadingExcel.value = false
  }
}

/* ===== Charts ===== */
const chartDataTipoVehiculo = computed(() => {
  const labels = TIPO_VEHICULO_KEYS
  const data = labels.map((k) => statsData.value.tipoVehiculo[k])
  const backgroundColors = ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#9E9E9E']

  return {
    labels,
    datasets: [
      {
        label: 'Cantidad de Turnos',
        backgroundColor: backgroundColors,
        data,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const },
    tooltip: {
      callbacks: {
        label: function (context: TooltipItem<'bar'>) {
          const label = context.label || ''
          const value = context.parsed.y
          return `${label}: ${value}`
        },
      },
    },
  },
}

/* ===== Mounted ===== */
onMounted(() => {
  const today = new Date()
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Bogota',
  }
  const formatter = new Intl.DateTimeFormat('es-CO', options)
  const parts = formatter.formatToParts(today)
  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  const iso = `${year}-${month}-${day}`

  todayDateISO.value = iso
  fechaSeleccionada.value = iso
  todayDate.value = today.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  initTipoVehiculoStats()
  loadTurnosHoy()
})
</script>
<!-- ==================== FRAGMENTO 3: STYLES ==================== -->
<!-- Copia desde <style scoped> hasta </style> -->

<style scoped>
.v-card {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08), 0 6px 6px rgba(0, 0, 0, 0.05);
  border-radius: 16px;
}

.title-full-bordered-container {
  padding: 0 !important;
}

.title-text-with-border {
  border: 2px solid black;
  padding: 6px 12px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
  display: inline-block;
  font-weight: bold;
  letter-spacing: 0.03em;
  color: var(--v-theme-primary);
  font-size: 0.9rem;
  line-height: 1.3;
}

@media (min-width: 600px) {
  .title-text-with-border {
    padding: 8px 16px;
    margin-bottom: 16px;
    font-size: 1.1rem;
    letter-spacing: 0.05em;
  }
}

@media (min-width: 960px) {
  .title-text-with-border {
    padding: 10px 20px;
    margin-bottom: 24px;
    font-size: 1.3rem;
  }
}

.title-text-with-border .text-secondary {
  display: inline;
  margin-left: 8px;
  color: #4caf50;
  font-size: 0.85em;
}

.bordered-button,
.bordered-button-info,
.bordered-button-success {
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 0 0 2px black !important;
}

.bordered-button:hover,
.bordered-button-info:hover,
.bordered-button-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 3px black !important;
}

.bordered-dialog-button {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 1px black !important;
}
.bordered-dialog-button:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), 0 0 0 2px black !important;
}

.turno-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  border-radius: 12px;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}
.turno-card:hover {
  transform: translateY(-7px);
  box-shadow: 0 18px 35px rgba(0, 0, 0, 0.3);
}

.estado-cancelado {
  border: 2px solid #fca5a5;
}
.estado-finalizado {
  border: 2px solid #4ade80;
}
.estado-en_proceso {
  border: 2px solid #38bdf8;
}
.estado-incompleto {
  border: 2px solid #fbbf24;
}

.text-on-primary-text {
  color: rgb(var(--v-theme-on-primary-text)) !important;
}
.text-on-primary-text-faded {
  color: rgb(var(--v-theme-on-primary-text-faded)) !important;
}

.etapa-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 4px;
}

.etapa-label {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.etapas-lista {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.etapa-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.etapa-icono {
  flex-shrink: 0;
  margin-top: 2px;
}

.etapa-contenido {
  flex: 1;
  min-width: 0;
}

.etapa-time {
  text-align: right;
  font-family: monospace;
  font-size: 0.72rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.etapa-icon-completed-finalizado {
  color: #ffffff !important;
}

.v-icon.on-primary-text-light {
  color: rgb(var(--v-theme-on-primary-text-light)) !important;
}
.v-list.bg-transparent {
  background-color: transparent !important;
}

.table-scroll-x {
  overflow-x: auto;
}

/* 👇 ESTILOS PARA CHIPS DE OBSERVACIONES */
.cursor-pointer {
  cursor: pointer;
}

.chip-observacion {
  transition: all 0.2s ease;
}

.chip-observacion:hover {
  opacity: 0.95;
  transform: translateY(-2px);
}

/* 👇 NUEVOS ESTILOS PARA HOVER + CLICK */
/* Vista previa al hacer hover */
.preview-card {
  max-width: 350px;
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* Truncar texto a 3 líneas */
.text-truncate-3-lines {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  max-height: calc(1.4em * 3);
}

@media (max-width: 600px) {
  .v-card-actions {
    gap: 4px;
  }
}

/* Estilo para mostrar el funcionario de cada etapa */
.etapa-funcionario {
  font-size: 0.68rem;
  display: flex;
  align-items: center;
  padding-left: 0;
  font-style: italic;
  opacity: 0.85;
  margin-top: 2px;
  line-height: 1.3;
}

@media (min-width: 600px) {
  .etapa-funcionario {
    font-size: 0.72rem;
  }
}
</style>
