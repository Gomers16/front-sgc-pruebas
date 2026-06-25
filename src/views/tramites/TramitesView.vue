<template>
  <v-container class="mt-4 mt-sm-6" fluid>
    <!-- Header con stats -->
    <v-card elevation="8" class="pa-0 rounded-xl rounded-sm-2xl card-surface mb-4">
      <div class="card-header px-4 px-sm-6 py-3 py-sm-5">
        <div class="header-left">
          <div class="icon-pill d-none d-sm-inline-flex">
            <v-icon size="22">mdi-clipboard-list-outline</v-icon>
          </div>
          <div class="title-group">
            <h2 class="title text-h6 text-sm-h5">Cola de Trámites</h2>
            <p class="subtitle d-none d-sm-block">Gestión y categorización de trámites del día</p>
          </div>
        </div>

        <!-- Stats chips -->
        <div class="d-flex align-center flex-wrap" style="gap:8px">
          <v-chip :size="$vuetify.display.xs ? 'small' : 'default'" variant="tonal" color="grey-darken-1" prepend-icon="mdi-counter">
            Total: {{ paginationMeta?.total ?? tramites.length }}
          </v-chip>
          <v-chip :size="$vuetify.display.xs ? 'small' : 'default'" variant="tonal" color="warning" prepend-icon="mdi-clock-outline">
            Espera: {{ tramitesEnEspera }}
          </v-chip>
          <v-chip :size="$vuetify.display.xs ? 'small' : 'default'" variant="tonal" color="info" prepend-icon="mdi-account-clock">
            Atención: {{ tramitesEnAtencion }}
          </v-chip>
          <v-chip :size="$vuetify.display.xs ? 'small' : 'default'" variant="tonal" color="success" prepend-icon="mdi-check-circle">
            Completados: {{ tramitesCompletados }}
          </v-chip>
          <v-btn
            size="small"
            variant="tonal"
            color="green-darken-2"
            prepend-icon="mdi-cash-register"
            @click="$router.push({ name: 'ReporteCaja' })"
          >
            Reporte de Caja
          </v-btn>
        </div>
      </div>

      <v-divider class="mx-4 mx-sm-6 divider-muted" />

      <!-- Filtros -->
      <div class="pa-4 pa-sm-6">
        <v-row dense>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="fechaFiltro"
              label="Fecha"
              type="date"
              variant="outlined"
              :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
              prepend-inner-icon="mdi-calendar"
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filtroEstado"
              :items="estadosFilter"
              label="Filtrar por estado"
              variant="outlined"
              :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
              prepend-inner-icon="mdi-filter-variant"
              clearable
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-select
              v-model="filtroTipo"
              :items="tiposFilter"
              label="Filtrar por tipo"
              variant="outlined"
              :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
              prepend-inner-icon="mdi-tag-outline"
              clearable
            />
          </v-col>
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="busqueda"
              label="Buscar por nombre o cédula"
              variant="outlined"
              :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
              prepend-inner-icon="mdi-magnify"
              clearable
            />
          </v-col>
        </v-row>
      </div>
    </v-card>

    <!-- Lista de trámites -->
    <v-card elevation="8" class="rounded-xl rounded-sm-2xl card-surface">
      <v-data-table
        :headers="headers"
        :items="turnosAgrupados"
        :loading="cargando"
        :items-per-page="20"
        item-value="turnoNumero"
        show-expand
        class="tramites-table"
        :mobile-breakpoint="0"
      >
        <!-- Turno -->
        <template #item.turnoNumero="{ item }">
          <div class="font-weight-bold text-primary">
            #{{ item.turnoNumero }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ item.turnoCodigo }}
          </div>
        </template>

        <!-- Cliente -->
        <template #item.nombreCliente="{ item }">
          <div class="font-weight-medium">{{ item.nombreCliente }}</div>
          <div class="text-caption text-medium-emphasis">CC: {{ item.cedula }}</div>
        </template>

        <!-- Cantidad de trámites -->
        <template #item.cantidadTramites="{ item }">
          <span v-if="item.tramites.length === 1" class="text-caption">
            1 trámite
          </span>
          <v-chip
            v-else
            color="deep-purple"
            variant="tonal"
            size="small"
          >
            {{ item.tramites.length }} trámites
          </v-chip>
        </template>

        <!-- Hora -->
        <template #item.horaIngreso="{ item }">
          <span class="text-caption">{{ item.horaIngreso }}</span>
        </template>

        <!-- Fila expandida -->
        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="pa-0">
              <div class="pa-3" style="background: #f8f9fb">
                <v-btn
                  size="small"
                  color="deep-purple"
                  variant="tonal"
                  prepend-icon="mdi-plus"
                  class="mb-3"
                  @click="abrirAgregarTramite(item)"
                >
                  Agregar trámite
                </v-btn>
                <v-card
                  v-for="tramite in item.tramites"
                  :key="tramite.id"
                  variant="outlined"
                  class="mb-2 rounded-lg"
                >
                  <v-card-text class="pa-3">
                    <div class="d-flex align-center justify-space-between flex-wrap mb-2" style="gap: 8px">
                      <div class="d-flex align-center" style="gap: 10px">
                        <v-chip
                          v-if="tramite.tipoTramite"
                          size="small"
                          variant="tonal"
                          color="deep-purple"
                        >
                          {{ formatTipoTramite(tramite.tipoTramite) }}
                        </v-chip>
                        <span v-else class="text-caption text-medium-emphasis">Sin categorizar</span>
                      </div>
                      <v-chip
                        size="small"
                        :color="estadoConfig[tramite.estado].color"
                        :prepend-icon="estadoConfig[tramite.estado].icon"
                        variant="elevated"
                      >
                        {{ estadoConfig[tramite.estado].label }}
                      </v-chip>
                    </div>
                    <div class="d-flex align-center flex-wrap" style="gap: 6px">
                      <v-btn size="x-small" color="primary" variant="tonal" @click="abrirDetalle(tramite)">
                        <v-icon size="small">mdi-eye</v-icon> Ver
                      </v-btn>
                      <v-btn size="x-small" color="deep-purple" variant="tonal" @click="abrirFormularioDirecto(tramite)">
                        <v-icon size="small">mdi-file-document</v-icon> Formulario
                      </v-btn>
                      <v-btn size="x-small" color="teal" variant="tonal" @click="abrirChecklistDirecto(tramite)">
                        <v-icon size="small">mdi-checkbox-multiple-marked-outline</v-icon> Checklist
                      </v-btn>
                      <v-btn size="x-small" color="orange-darken-2" variant="tonal" @click="abrirLiquidacionDirecto(tramite)">
                        <v-icon size="small">mdi-calculator</v-icon> Liquidación
                      </v-btn>
                      <v-btn size="x-small" color="green-darken-2" variant="tonal" @click="abrirHistorialPagosDirecto(tramite)">
                        <v-icon size="small">mdi-cash-clock</v-icon> Pagos
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>

    <!-- Modal de detalle -->
    <v-dialog
      v-model="showDetalle"
      :max-width="$vuetify.display.xs ? '95%' : '900'"
      :fullscreen="$vuetify.display.xs"
      scrollable
    >
      <v-card v-if="tramiteSeleccionado" class="rounded-xl">
        <!-- Header del modal -->
        <v-card-title class="d-flex align-center justify-space-between pa-4 bg-deep-purple-lighten-5">
          <div class="d-flex align-center" style="gap:12px">
            <v-icon color="deep-purple" :size="$vuetify.display.xs ? 24 : 28">mdi-file-document-edit-outline</v-icon>
            <div>
              <div class="text-h6 font-weight-bold">Trámite #{{ tramiteSeleccionado.turnoNumero }}</div>
              <div class="text-caption text-medium-emphasis">{{ tramiteSeleccionado.turnoCodigo }}</div>
            </div>
          </div>
          <v-btn icon variant="text" @click="cerrarDetalle">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-4 pa-sm-6">
          <v-row dense>
            <!-- Datos del solicitante -->
            <v-col cols="12">
              <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
                <v-icon size="20" class="mr-2" color="primary">mdi-account</v-icon>
                Datos del Solicitante
              </div>
              <v-card variant="tonal" class="pa-3 rounded-lg">
                <v-row dense>
                  <v-col cols="12" sm="6">
                    <div class="text-caption text-medium-emphasis">Nombre completo</div>
                    <div class="font-weight-medium">{{ tramiteSeleccionado.nombreCliente }}</div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="text-caption text-medium-emphasis">Cédula</div>
                    <div class="font-weight-medium">{{ tramiteSeleccionado.cedula }}</div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="text-caption text-medium-emphasis">Teléfono</div>
                    <div class="font-weight-medium">{{ tramiteSeleccionado.telefono || 'No registrado' }}</div>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <div class="text-caption text-medium-emphasis">Email</div>
                    <div class="font-weight-medium">{{ tramiteSeleccionado.email || 'No registrado' }}</div>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <!-- Tipo de trámite -->
            <v-col cols="12">
              <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
                <v-icon size="20" class="mr-2" color="deep-purple">mdi-tag-outline</v-icon>
                Categorización
              </div>
              <v-select
                v-model="tramiteSeleccionado.tipoTramite"
                :items="tipoTramiteItems"
                label="Tipo de trámite"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-file-document-outline"
                @update:model-value="onTipoTramiteChange"
              />
              <v-select
                v-model="tramiteSeleccionado.tipoVehiculo"
                :items="[
                  { title: 'Vehículo (carro, camioneta, camión, bus...)', value: 'automovil' },
                  { title: 'Motocicleta', value: 'motocicleta' },
                ]"
                label="Tipo de vehículo"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                prepend-inner-icon="mdi-car-outline"
                clearable
                class="mt-2"
                @update:model-value="onTipoVehiculoChange"
              />
            </v-col>

            <!-- Estado -->
            <v-col cols="12">
              <div class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
                <v-icon size="20" class="mr-2" color="info">mdi-state-machine</v-icon>
                Gestión de Estado
              </div>
              <div class="d-flex flex-wrap" style="gap:8px">
                <v-btn
                  v-if="tramiteSeleccionado.estado === 'en_espera'"
                  color="info"
                  variant="elevated"
                  @click="cambiarEstado('en_atencion')"
                  :loading="guardando"
                >
                  <v-icon left>mdi-account-clock</v-icon>
                  Pasar a Atención
                </v-btn>
                <v-btn
                  v-if="tramiteSeleccionado.estado === 'en_atencion'"
                  color="success"
                  variant="elevated"
                  @click="cambiarEstado('completado')"
                  :loading="guardando"
                >
                  <v-icon left>mdi-check-circle</v-icon>
                  Completar
                </v-btn>
                <v-btn
                  v-if="tramiteSeleccionado.estado !== 'cancelado'"
                  color="error"
                  variant="outlined"
                  @click="showCancelConfirm = true"
                  :loading="guardando"
                >
                  <v-icon left>mdi-close-circle</v-icon>
                  Cancelar
                </v-btn>
              </div>
              <v-chip
                class="mt-3"
                :color="estadoConfig[tramiteSeleccionado.estado].color"
                :prepend-icon="estadoConfig[tramiteSeleccionado.estado].icon"
                variant="elevated"
              >
                Estado actual: {{ estadoConfig[tramiteSeleccionado.estado].label }}
              </v-chip>
            </v-col>

            <!-- Observaciones -->
            <v-col cols="12">
              <v-textarea
                v-model="tramiteSeleccionado.observaciones"
                label="Observaciones"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                rows="3"
                auto-grow
                prepend-inner-icon="mdi-comment-text-outline"
                @blur="guardarCambios"
              />
            </v-col>

            <!-- Resultado -->
            <v-col cols="12">
              <v-textarea
                v-model="tramiteSeleccionado.resultado"
                label="Resultado del trámite"
                variant="outlined"
                :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                rows="2"
                auto-grow
                prepend-inner-icon="mdi-file-check-outline"
                @blur="guardarCambios"
              />
            </v-col>

            <!-- Otros Datos del Traspaso -->
            <v-col cols="12" v-if="tramiteSeleccionado.tipoTramite === 'TRASPASO'">
              <div class="text-subtitle-1 font-weight-bold mb-3">
                <v-icon size="20" class="mr-2" color="green">mdi-cash</v-icon>
                Otros Datos del Traspaso
              </div>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="tramiteSeleccionado.valorVehiculo"
                    label="Valor del vehículo"
                    variant="outlined"
                    :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                    prepend-inner-icon="mdi-currency-usd"
                    type="number"
                    @blur="guardarCambios"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="tramiteSeleccionado.formaPago"
                    :items="['Efectivo', 'Transferencia', 'Cheque', 'Mixto']"
                    label="Forma de pago"
                    variant="outlined"
                    :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                    prepend-inner-icon="mdi-credit-card-outline"
                    clearable
                    @update:model-value="guardarCambios"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="tramiteSeleccionado.fechaEntrega"
                    label="Fecha de entrega"
                    variant="outlined"
                    :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                    prepend-inner-icon="mdi-calendar-check"
                    type="date"
                    @blur="guardarCambios"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="tramiteSeleccionado.destrate"
                    label="Destrate"
                    variant="outlined"
                    :density="$vuetify.display.xs ? 'compact' : 'comfortable'"
                    prepend-inner-icon="mdi-bank-outline"
                    type="number"
                    hint="Valor de deuda a cancelar"
                    persistent-hint
                    @blur="guardarCambios"
                  />
                </v-col>
              </v-row>
            </v-col>

            <!-- Tiempos -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-3 rounded-lg">
                <div class="text-caption font-weight-bold mb-2">⏱️ Registro de tiempos</div>
                <v-row dense>
                  <v-col cols="12" sm="4">
                    <div class="text-caption text-medium-emphasis">Hora Ingreso</div>
                    <div class="font-weight-medium">{{ formatHora(tramiteSeleccionado.horaIngreso) }}</div>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <div class="text-caption text-medium-emphasis">Hora Atención</div>
                    <div class="font-weight-medium">{{ formatHora(tramiteSeleccionado.horaAtencion) }}</div>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <div class="text-caption text-medium-emphasis">Hora Fin</div>
                    <div class="font-weight-medium">{{ formatHora(tramiteSeleccionado.horaFin) }}</div>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4 d-flex flex-wrap" style="gap: 8px">
          <v-spacer />
          <v-btn
            color="green-darken-2"
            variant="tonal"
            prepend-icon="mdi-cash-clock"
            @click="showHistorialPagos = true"
          >
            Pagos
          </v-btn>
          <v-btn
            color="teal"
            variant="tonal"
            prepend-icon="mdi-checkbox-multiple-marked-outline"
            @click="showChecklist = true"
          >
            Checklist
          </v-btn>
          <v-btn
            color="orange-darken-2"
            variant="tonal"
            prepend-icon="mdi-calculator"
            @click="showLiquidacion = true"
          >
            Liquidación
          </v-btn>
          <v-btn
            color="deep-purple"
            variant="tonal"
            prepend-icon="mdi-clipboard-list-outline"
            @click="showFormularioRunt = true"
          >
            Formulario RUNT
          </v-btn>
          <v-btn color="grey-darken-1" variant="outlined" @click="cerrarDetalle">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Formulario RUNT -->
    <FormularioRuntDialog
      v-if="tramiteSeleccionado"
      v-model="showFormularioRunt"
      :tramite-id="tramiteSeleccionado.id"
      :tramite-numero="tramiteSeleccionado.turnoNumero"
      :tipo-tramite="tramiteSeleccionado.tipoTramite"
      :incluye-compraventa="tramiteSeleccionado.incluyeCompraventa ?? false"
      @tramite-actualizado="onFormularioRuntActualizado"
    />

    <!-- Historial de Pagos -->
    <HistorialPagosTurnoDialog
      v-if="tramiteSeleccionado"
      v-model="showHistorialPagos"
      :sede-id="tramiteSeleccionado.sede?.id ?? 0"
      :fecha="tramiteSeleccionado.fecha"
      :turno-numero="tramiteSeleccionado.turnoNumero"
    />

    <!-- Checklist de Documentos -->
    <ChecklistTurnoDialog
      v-if="tramiteSeleccionado"
      v-model="showChecklist"
      :sede-id="tramiteSeleccionado.sede?.id ?? 0"
      :fecha="tramiteSeleccionado.fecha"
      :turno-numero="tramiteSeleccionado.turnoNumero"
    />

    <!-- Liquidación de Trámite -->
    <LiquidacionTramiteDialog
      v-if="tramiteSeleccionado"
      v-model="showLiquidacion"
      :tramite-id="tramiteSeleccionado.id"
      :placa="tramiteSeleccionado.placa"
      :turno-numero="tramiteSeleccionado.turnoNumero"
    />

    <!-- Agregar trámite al turno -->
    <AgregarTramiteDialog
      v-if="turnoParaAgregar"
      v-model="showAgregarTramite"
      :turno-numero="turnoParaAgregar.turnoNumero"
      :turno-ref="{
        nombreCliente: turnoParaAgregar.nombreCliente,
        cedula:        turnoParaAgregar.cedula,
        servicioId:    turnoParaAgregar.tramites[0]?.servicio?.id ?? 0,
      }"
      @tramite-agregado="onTramiteAgregado"
    />

    <!-- Confirmación cancelar trámite -->
    <ConfirmarDialogo
      v-model="showCancelConfirm"
      title="Cancelar trámite"
      message="¿Estás seguro de que deseas cancelar este trámite? Esta acción es irreversible y no puede deshacerse."
      confirm-text="Sí, cancelar"
      confirm-color="error"
      @confirm="cambiarEstado('cancelado')"
    />

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right">
      {{ snackbar.message }}
      <template #actions>
        <v-btn color="white" variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.card-surface {
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  border: 1px solid rgba(16,24,40,0.06);
}

.card-header {
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  background:
    radial-gradient(1200px 200px at 20% -50%, rgba(103,58,183,.08), transparent 60%),
    radial-gradient(900px 180px at 80% -60%, rgba(156,39,176,.10), transparent 60%),
    linear-gradient(180deg, #ffffff, #f7f9fc);
  border-top-left-radius:12px; border-top-right-radius:12px;
}

@media (min-width: 600px) {
  .card-header { gap:16px; border-top-left-radius:16px; border-top-right-radius:16px; }
}

.header-left { display:flex; align-items:center; gap:12px; }
.icon-pill {
  display:inline-flex; align-items:center; justify-content:center;
  height:40px; width:40px; border-radius:10px;
  border:1px solid rgba(16,24,40,0.08); background:#fff;
  box-shadow:0 1px 2px rgba(16,24,40,0.06);
}
.title-group .title { margin:0; font-weight:700; letter-spacing:.2px; line-height:1.2; color:#0f172a; }
.title-group .subtitle { margin:2px 0 0 0; font-size:.925rem; color:#475569; }

.divider-muted { border-color: rgba(16,24,40,0.08) !important; }

.tramites-table :deep(.v-data-table__th) {
  background: #f8f9fb !important;
  font-weight: 600 !important;
}

.tramites-table :deep(.v-data-table__tr:hover) {
  background: rgba(103,58,183,0.04) !important;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { TramitesService, TIPOS_TRAMITE_ITEMS, ESTADO_CONFIG } from '@/services/tramitesService'
import type { Tramite, EstadoTramite, PaginatedMeta } from '@/services/tramitesService'
import { authSetStore } from '@/stores/AuthStore'
import ConfirmarDialogo from '@/components/UI/ConfirmarDialogo.vue'
import FormularioRuntDialog from '@/components/tramites/FormularioRuntDialog.vue'
import ChecklistTurnoDialog from '@/components/tramites/ChecklistTurnoDialog.vue'
import LiquidacionTramiteDialog from '@/components/tramites/LiquidacionTramiteDialog.vue'
import HistorialPagosTurnoDialog from '@/components/tramites/HistorialPagosTurnoDialog.vue'
import AgregarTramiteDialog from '@/components/tramites/AgregarTramiteDialog.vue'

const authStore = authSetStore()
const cargando = ref(false)
const guardando = ref(false)
const tramites = ref<Tramite[]>([])
const paginationMeta = ref<PaginatedMeta | null>(null)
const tramiteSeleccionado = ref<Tramite | null>(null)
const showDetalle = ref(false)
const tramiteOriginalSnapshot = ref<{ tipoTramite: Tramite['tipoTramite']; observaciones: Tramite['observaciones']; resultado: Tramite['resultado'] } | null>(null)
const showCancelConfirm = ref(false)
const showFormularioRunt   = ref(false)
const showChecklist        = ref(false)
const showLiquidacion      = ref(false)
const showHistorialPagos   = ref(false)
const showAgregarTramite   = ref(false)
const turnoParaAgregar     = ref<TurnoAgrupado | null>(null)

const cargandoTarifa = ref(false)

// Filtros
const fechaFiltro = ref(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }))
const filtroEstado = ref<EstadoTramite | null>(null)
const filtroTipo = ref<string | null>(null)
const busqueda = ref('')

const tipoTramiteItems = TIPOS_TRAMITE_ITEMS
const estadoConfig = ESTADO_CONFIG

const estadosFilter = [
  { title: 'En espera', value: 'en_espera' },
  { title: 'En atención', value: 'en_atencion' },
  { title: 'Completado', value: 'completado' },
  { title: 'Cancelado', value: 'cancelado' },
]

const tiposFilter = computed(() => 
  TIPOS_TRAMITE_ITEMS.map(t => ({ title: t.title, value: t.value }))
)

const headers = [
  { title: '', key: 'data-table-expand', width: '40px' },
  { title: 'Turno',    key: 'turnoNumero',      sortable: true },
  { title: 'Cliente',  key: 'nombreCliente',     sortable: true },
  { title: 'Trámites', key: 'cantidadTramites',  sortable: false },
  { title: 'Hora',     key: 'horaIngreso',       sortable: true },
]

// Stats
const tramitesEnEspera = computed(() => 
  tramites.value.filter(t => t.estado === 'en_espera').length
)
const tramitesEnAtencion = computed(() => 
  tramites.value.filter(t => t.estado === 'en_atencion').length
)
const tramitesCompletados = computed(() =>
  tramites.value.filter(t => t.estado === 'completado').length
)

const isDirty = computed(() => {
  if (!tramiteSeleccionado.value || !tramiteOriginalSnapshot.value) return false
  const t = tramiteSeleccionado.value
  const s = tramiteOriginalSnapshot.value
  return t.tipoTramite !== s.tipoTramite ||
    t.observaciones !== s.observaciones ||
    t.resultado !== s.resultado
})

// Filtrado
const tramitesFiltrados = computed(() => {
  let resultado = [...tramites.value]

  if (filtroEstado.value) {
    resultado = resultado.filter(t => t.estado === filtroEstado.value)
  }

  if (filtroTipo.value) {
    resultado = resultado.filter(t => t.tipoTramite === filtroTipo.value)
  }

  if (busqueda.value) {
    const term = busqueda.value.toLowerCase()
    resultado = resultado.filter(t => 
      t.nombreCliente.toLowerCase().includes(term) ||
      t.cedula.includes(term)
    )
  }

  return resultado
})

interface TurnoAgrupado {
  turnoNumero:   number
  turnoCodigo:   string
  nombreCliente: string
  cedula:        string
  horaIngreso:   string
  fecha:         string
  sede:          { id: number; nombre: string } | undefined
  tramites:      Tramite[]
}

const turnosAgrupados = computed((): TurnoAgrupado[] => {
  const map = new Map<number, TurnoAgrupado>()
  for (const t of tramitesFiltrados.value) {
    if (!map.has(t.turnoNumero)) {
      map.set(t.turnoNumero, {
        turnoNumero:   t.turnoNumero,
        turnoCodigo:   t.turnoCodigo,
        nombreCliente: t.nombreCliente,
        cedula:        t.cedula,
        horaIngreso:   t.horaIngreso,
        fecha:         t.fecha,
        sede:          t.sede,
        tramites:      [],
      })
    }
    map.get(t.turnoNumero)!.tramites.push(t)
  }
  return [...map.values()]
})

// Snackbar
const snackbar = ref({ show: false, message: '', color: '', timeout: 4000 })
function showSnackbar(message: string, color = 'info', timeout = 4000) {
  snackbar.value = { show: true, message, color, timeout }
}

// Funciones
function formatHora(hora: string | null): string {
  if (!hora) return '—'
  const [hStr, mStr = '00'] = hora.split(':')
  const h = parseInt(hStr, 10)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${mStr} ${suffix}`
}

function formatTipoTramite(tipo: string) {
  const item = TIPOS_TRAMITE_ITEMS.find(t => t.value === tipo)
  return item ? item.title : tipo
}

async function cargarTramites() {
  cargando.value = true
  try {
    const response = await TramitesService.getAll({ fecha: fechaFiltro.value })
    tramites.value = response.data
    paginationMeta.value = response.meta
  } catch (err) {
    console.error('Error al cargar trámites:', err)
    showSnackbar('Error al cargar trámites', 'error')
  } finally {
    cargando.value = false
  }
}

watch(fechaFiltro, () => cargarTramites())

function abrirDetalle(tramite: Tramite) {
  tramiteSeleccionado.value = { ...tramite }
  if (tramiteSeleccionado.value.valorLiquidado !== null)
    tramiteSeleccionado.value.valorLiquidado = Math.round(tramiteSeleccionado.value.valorLiquidado)
  tramiteOriginalSnapshot.value = {
    tipoTramite: tramite.tipoTramite,
    observaciones: tramite.observaciones,
    resultado: tramite.resultado,
  }
  showDetalle.value = true
  cargarTarifa()
}

async function abrirChecklistDirecto(tramite: Tramite) {
  tramiteSeleccionado.value = { ...tramite }
  await nextTick()
  showChecklist.value = true
}

async function abrirLiquidacionDirecto(tramite: Tramite) {
  tramiteSeleccionado.value = { ...tramite }
  await nextTick()
  showLiquidacion.value = true
}

async function abrirFormularioDirecto(tramite: Tramite) {
  tramiteSeleccionado.value = { ...tramite }
  tramiteOriginalSnapshot.value = {
    tipoTramite: tramite.tipoTramite,
    observaciones: tramite.observaciones,
    resultado: tramite.resultado,
  }
  await nextTick()
  showFormularioRunt.value = true
}

function onFormularioRuntActualizado(incluyeCompraventa: boolean) {
  if (!tramiteSeleccionado.value) return
  tramiteSeleccionado.value.incluyeCompraventa = incluyeCompraventa
  const idx = tramites.value.findIndex((t) => t.id === tramiteSeleccionado.value!.id)
  if (idx !== -1) tramites.value[idx] = { ...tramites.value[idx], incluyeCompraventa }
}

async function abrirHistorialPagosDirecto(tramite: Tramite) {
  tramiteSeleccionado.value = { ...tramite }
  await nextTick()
  showHistorialPagos.value = true
}

watch(showFormularioRunt, (val) => {
  if (!val && !showDetalle.value) {
    tramiteSeleccionado.value = null
    tramiteOriginalSnapshot.value = null
  }
})

function cerrarDetalle() {
  showDetalle.value = false
  showFormularioRunt.value = false
  tramiteSeleccionado.value = null
  tramiteOriginalSnapshot.value = null
}

async function guardarCambios(): Promise<boolean> {
  if (!tramiteSeleccionado.value) return true

  guardando.value = true
  try {
    const userUnknown: unknown = authStore.user
    const userId = ((): number | null => {
      if (typeof userUnknown === 'object' && userUnknown !== null) {
        const maybe = userUnknown as Record<string, unknown>
        return typeof maybe.id === 'number' ? maybe.id : null
      }
      return null
    })()
    if (!userId) throw new Error('Usuario no autenticado')

    await TramitesService.update(tramiteSeleccionado.value.id, {
      usuarioId: userId,
      tipoTramite: tramiteSeleccionado.value.tipoTramite,
      tipoVehiculo: tramiteSeleccionado.value.tipoVehiculo ?? undefined,
      observaciones: tramiteSeleccionado.value.observaciones || undefined,
      resultado: tramiteSeleccionado.value.resultado || undefined,
      valorVehiculo: tramiteSeleccionado.value.valorVehiculo ?? undefined,
      formaPago: tramiteSeleccionado.value.formaPago ?? undefined,
      fechaEntrega: tramiteSeleccionado.value.fechaEntrega ?? undefined,
      destrate: tramiteSeleccionado.value.destrate ?? undefined,
      valorLiquidado: tramiteSeleccionado.value.valorLiquidado ?? undefined,
    })

    tramiteOriginalSnapshot.value = {
      tipoTramite: tramiteSeleccionado.value.tipoTramite,
      observaciones: tramiteSeleccionado.value.observaciones,
      resultado: tramiteSeleccionado.value.resultado,
    }

    const idx = tramites.value.findIndex(t => t.id === tramiteSeleccionado.value!.id)
    if (idx !== -1) tramites.value[idx] = { ...tramiteSeleccionado.value }

    showSnackbar('Cambios guardados', 'success')
    return true
  } catch (err) {
    console.error('Error al guardar:', err)
    showSnackbar('Error al guardar cambios', 'error')
    return false
  } finally {
    guardando.value = false
  }
}

async function recalcularTarifa() {
  if (!tramiteSeleccionado.value?.tipoTramite) return
  cargandoTarifa.value = true
  try {
    const resp = await TramitesService.getTarifa(
      tramiteSeleccionado.value.tipoTramite,
      tramiteSeleccionado.value.tipoVehiculo ?? undefined,
    )
    if (tramiteSeleccionado.value) tramiteSeleccionado.value.valorLiquidado = Math.round(resp.valor ?? 0)
  } catch { /* tarifa no configurada, no es error crítico */ } finally {
    cargandoTarifa.value = false
  }
}

async function cargarTarifa() {
  if (tramiteSeleccionado.value?.valorLiquidado !== null) return
  await recalcularTarifa()
}

async function onTipoTramiteChange() {
  await guardarCambios()
  if (tramiteSeleccionado.value) tramiteSeleccionado.value.valorLiquidado = null
  await recalcularTarifa()
}

async function onTipoVehiculoChange() {
  await guardarCambios()
  await recalcularTarifa()
}

async function cambiarEstado(nuevoEstado: EstadoTramite) {
  if (!tramiteSeleccionado.value) return

  if (isDirty.value) {
    const saved = await guardarCambios()
    if (!saved) return
  }

  guardando.value = true
  try {
    const userUnknown: unknown = authStore.user
    const userId = ((): number | null => {
      if (typeof userUnknown === 'object' && userUnknown !== null) {
        const maybe = userUnknown as Record<string, unknown>
        return typeof maybe.id === 'number' ? maybe.id : null
      }
      return null
    })()
    if (!userId) throw new Error('Usuario no autenticado')

    const actualizado = await TramitesService.update(tramiteSeleccionado.value.id, {
      usuarioId: userId,
      estado: nuevoEstado,
    })

    tramiteSeleccionado.value = actualizado
    const idx = tramites.value.findIndex(t => t.id === actualizado.id)
    if (idx !== -1) tramites.value[idx] = actualizado

    showSnackbar(`Estado actualizado a: ${estadoConfig[nuevoEstado].label}`, 'success')
  } catch (err) {
    console.error('Error al cambiar estado:', err)
    showSnackbar('Error al cambiar estado', 'error')
  } finally {
    guardando.value = false
  }
}

function abrirAgregarTramite(turno: TurnoAgrupado) {
  turnoParaAgregar.value = turno
  showAgregarTramite.value = true
}

function onTramiteAgregado(nuevo: Tramite) {
  tramites.value.push(nuevo)
}

onMounted(async () => {
  await cargarTramites()
})
</script>