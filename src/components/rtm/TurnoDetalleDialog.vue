<!-- src/components/rtm/TurnoDetalleDialog.vue -->
<!--
  Modal de detalle de turno ("Turno #X", tabs Detalles + Tarjeta Visual),
  extraído de EstadoDeTurnos.vue para reutilizarlo también desde Comisiones
  (tabla general y panel por asesor). Recibe el objeto turno YA CARGADO
  (con sus preloads/campos derivados) — no hace fetch propio.
-->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :max-width="$vuetify.display.xs ? '95%' : '900'"
    :max-height="$vuetify.display.xs ? '88vh' : undefined"
    scrollable
  >
    <v-card v-if="turno">
      <v-card-title class="text-subtitle-1 text-sm-h6 font-weight-bold pa-3 pa-sm-4 d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-card-text</v-icon>
        Turno #{{ turno.turnoNumero }}
        <v-spacer />
        <v-btn
          icon
          variant="text"
          :size="$vuetify.display.xs ? 'small' : 'default'"
          @click="$emit('update:modelValue', false)"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- 👇 TABS -->
      <v-tabs
        v-model="currentTab"
        bg-color="grey-lighten-4"
        grow
        style="flex-shrink: 0; position: sticky; top: 0; z-index: 1;"
      >
        <v-tab value="detalles">
          <v-icon start size="18">mdi-text-box-outline</v-icon>
          <span class="text-caption text-sm-body-2">Detalles</span>
        </v-tab>
        <v-tab value="tarjeta">
          <v-icon start size="18">mdi-card-account-details-outline</v-icon>
          <span class="text-caption text-sm-body-2">Tarjeta Visual</span>
        </v-tab>
      </v-tabs>

      <v-window v-model="currentTab">
        <!-- TAB 1: DETALLES -->
        <v-window-item value="detalles">
          <v-card-text class="pa-3 pa-sm-4">
            <v-row>
              <v-col cols="12" md="6">
                <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2">
                  📅 Datos generales
                </h4>
                <p class="text-caption text-sm-body-2">
                  <strong>Fecha:</strong> {{ formatDate(turno.fecha) }}
                </p>
                <p class="text-caption text-sm-body-2">
                  <strong>Hora ingreso:</strong>
                  {{ formatTime(turno.horaIngreso) }}
                </p>
                <p class="text-caption text-sm-body-2">
                  <strong>Hora salida:</strong>
                  <span :class="turno.horaSalida ? 'font-weight-bold text-success' : 'text-grey'">
                    {{ turno.horaSalida ? formatTime(turno.horaSalida) : 'Pendiente' }}
                  </span>
                </p>
                <p class="text-caption text-sm-body-2">
                  <strong>Tiempo servicio:</strong>
                  <v-chip
                    v-if="turno.tiempoServicio"
                    color="blue-grey"
                    size="x-small"
                    variant="tonal"
                    prepend-icon="mdi-timer-outline"
                    class="ml-1"
                  >
                    {{ turno.tiempoServicio }}
                  </v-chip>
                  <span v-else class="text-grey">—</span>
                </p>
                <p class="text-caption text-sm-body-2">
                  <strong>Estado:</strong>
                  <v-chip
                    :color="getTurnoStatusColor(turno.estado)"
                    size="x-small"
                    class="ml-1"
                  >
                    {{ getTurnoStatusText(turno.estado) }}
                  </v-chip>
                </p>
              </v-col>

              <v-col cols="12" md="6">
                <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2">
                  🚗 Vehículo y servicio
                </h4>
                <p class="text-caption text-sm-body-2">
                  <strong>Placa:</strong> {{ turno.placa }}
                </p>
                <p class="text-caption text-sm-body-2">
                  <strong>Color:</strong> {{ getVehiculoColor(turno) }}
                </p>
                <p class="text-caption text-sm-body-2">
                  <strong>Tarjeta de propiedad:</strong>
                  {{ getVehiculoMatricula(turno) }}
                </p>
                <p class="text-caption text-sm-body-2">
                  <strong>Tipo vehículo:</strong> {{ turno.tipoVehiculo || '—' }}
                </p>
                <p class="text-caption text-sm-body-2">
                  <strong>Servicio:</strong>
                  {{ getServicioCodigo(turno) || '—' }}
                </p>
              </v-col>
            </v-row>

            <v-divider class="my-3" />

            <v-row>
              <v-col cols="12" md="6">
                <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2">
                  👤 Cliente (propietario)
                </h4>
                <p class="text-caption text-sm-body-2">
                  <strong>Nombre:</strong> {{ getClienteNombre(turno) }}
                </p>
                <p class="text-caption text-sm-body-2">
                  <strong>Teléfono:</strong> {{ getClienteTelefono(turno) }}
                </p>

                <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2 mt-4">
                  🚕 Conductor
                </h4>
                <p class="text-caption text-sm-body-2">
                  <strong>Nombre:</strong> {{ getConductorNombre(turno) }}
                </p>
                <p class="text-caption text-sm-body-2">
                  <strong>Teléfono:</strong> {{ getConductorTelefono(turno) }}
                </p>
              </v-col>

              <v-col cols="12" md="6">
                <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2">
                  📢 Captación
                </h4>
                <p class="text-caption text-sm-body-2">
                  <strong>Canal:</strong>
                  {{ prettifyCanal(turno.canalAtribucion) }}
                </p>
                <p class="text-caption text-sm-body-2">
                  <strong>Agente:</strong>
                  <span v-if="turno.agenteCaptacion?.id">
                    {{ turno.agenteCaptacion.nombre }}
                    ({{ prettifyAgenteTipo(turno.agenteCaptacion.tipo) }})
                  </span>
                  <span v-else>—</span>
                </p>
              </v-col>
            </v-row>

            <v-divider class="my-3" />

            <v-row>
              <v-col cols="12" md="6">
                <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2">
                  🔄 Historial de visitas
                </h4>
                <p class="text-caption text-sm-body-2">
                  <strong>Visita:</strong>
                  {{ turno.visitaVehiculoTexto || '—' }}
                </p>
              </v-col>

              <v-col cols="12" md="6">
                <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2">
                  ⚙️ Operación
                </h4>
                <p class="text-caption text-sm-body-2">
                  <strong>Usuario:</strong> {{ getUsuarioNombre(turno) }}
                </p>
                <p class="text-caption text-sm-body-2">
                  <strong>Sede:</strong> {{ turno.sede?.nombre ?? '—' }}
                </p>

                <h4 class="text-body-2 text-sm-subtitle-1 font-weight-bold mb-2 mt-4">
                  📝 Observaciones
                </h4>
                <p class="text-caption text-sm-body-2">
                  {{ turno.observaciones || '—' }}
                </p>
              </v-col>
            </v-row>
          </v-card-text>
        </v-window-item>

        <!-- TAB 2: TARJETA VISUAL -->
        <v-window-item value="tarjeta">
          <v-card-text class="pa-3 pa-sm-5">
            <!-- Tarjeta estilo "Turnos del Día" -->
            <v-card
              class="turno-card-historico pa-3 pa-sm-4 rounded-lg elevation-4"
              :color="cardColor(turno.estado)"
              :class="`estado-${turno.estado}`"
            >
              <v-card-title class="text-subtitle-1 text-sm-h6 font-weight-bold pb-1 text-on-primary-text">
                🔢 Turno: {{ displayTurnoNumero(turno) }}
              </v-card-title>

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
                  :color="estadoChipColor(turno.estado)"
                  variant="elevated"
                  label
                >
                  {{ estadoChipLabel(turno.estado) }}
                </v-chip>

                <div
                  v-if="turno.reasignadoDeTurnoId"
                  class="d-flex align-center mb-2"
                >
                  <v-icon size="x-small" color="amber-darken-2" class="mr-1">mdi-recycle</v-icon>
                  <span class="text-caption font-weight-medium" style="color: #f59e0b;">
                    Reasignado — turno cancelado anteriormente
                  </span>
                </div>

                <p class="text-caption text-sm-subtitle-1 text-on-primary-text mb-1">
                  📅 Fecha: <span class="font-weight-medium">{{ formatDate(turno.fecha) }}</span>
                </p>
                <p class="text-caption text-sm-subtitle-1 text-on-primary-text mb-1">
                  🛠 Servicio: <span class="font-weight-medium">{{ getServicioCodigo(turno) }}</span>
                </p>
                <p class="text-caption text-sm-subtitle-1 text-on-primary-text mb-1">
                  🚗 Tipo Vehículo: <span class="font-weight-medium">{{ turno.tipoVehiculo || 'Desconocido' }}</span>
                </p>
                <p class="text-caption text-sm-subtitle-1 text-on-primary-text mb-1">
                  🚗 Placa: <span class="font-weight-medium">{{ turno.placa }}</span>
                </p>
                <p class="text-caption text-sm-subtitle-1 text-on-primary-text mb-2">
                  ⏰ Ingreso: <span class="font-weight-medium">{{ formatTime(turno.horaIngreso) }}</span>
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
                          <span
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
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-window-item>
      </v-window>

      <v-divider />

      <v-card-actions class="pa-3 pa-sm-4">
        <v-spacer />
        <v-btn
          variant="text"
          :size="$vuetify.display.xs ? 'small' : 'default'"
          @click="$emit('update:modelValue', false)"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { DateTime } from 'luxon'

/* ── Tipos (mismo shape que EstadoDeTurnos.vue, duplicado a propósito para
   no acoplar este componente compartido al script de esa vista) ── */
export interface ServicioEnTurno {
  id: number
  codigoServicio: string
  nombreServicio: string
}
export interface UsuarioMin {
  id: number
  nombres?: string
  apellidos?: string
}
export interface SedeMin {
  id: number
  nombre: string
}
export interface VehiculoMin {
  id: number
  placa?: string
  color?: string | null
  matricula?: string | null
}
export interface ClienteMin {
  id: number
  nombres?: string
  apellidos?: string
  nombre?: string
  nombreCompleto?: string
  razonSocial?: string
  telefono?: string
  celular?: string
}
export interface ConductorMin {
  id: number
  nombre: string
  telefono?: string | null
}
export interface AgenteCaptacionMin {
  id: number
  nombre: string
  tipo: string
}
export interface CaptacionDateoMin {
  id: number
  canal: string
  consumidoAt?: string | null
}

export type EstadoTurno = 'activo' | 'inactivo' | 'cancelado' | 'finalizado'
export type CanalAtrib = 'FACHADA' | 'ASESOR' | 'TELE' | 'REDES' | string

export interface HistVisit {
  id: number
  fechaStr: string
  clienteNombre: string | null
  servicioCodigo?: string | null
}

export interface Turno {
  id: number
  turnoNumero: number
  turnoNumeroServicio?: number | null
  fecha: string
  horaIngreso: string | null
  horaSalida: string | null
  tiempoServicio: string | null
  placa: string
  tipoVehiculo: string
  medioEntero?: string | null
  observaciones: string | null
  funcionarioId: number
  estado: EstadoTurno

  servicioId?: number | null
  servicio?: ServicioEnTurno | null
  vehiculoId?: number | null
  vehiculo?: VehiculoMin | null
  clienteId?: number | null
  cliente?: ClienteMin | null
  usuario?: UsuarioMin | null
  sede?: SedeMin | null

  conductorId?: number | null
  conductor?: ConductorMin | null

  canalAtribucion?: CanalAtrib
  agenteCaptacionId?: number | null
  agenteCaptacion?: AgenteCaptacionMin | null
  captacionDateoId?: number | null
  captacionDateo?: CaptacionDateoMin | null

  visitaVehiculoNumero?: number | null
  visitaVehiculoTexto?: string | null
  visitaVehiculoUltimasFechas?: string[]
  visitasVehiculoDetalle?: HistVisit[]

  // 👇 Para la tarjeta visual de etapas
  tieneFacturacion?: boolean | null
  horaFacturacion?: string | null
  facturacionFuncionario?: {
    id: number
    nombres: string
    apellidos: string
  } | null
  certificacionFuncionario?: {
    id: number
    nombres: string
    apellidos: string
  } | null

  reasignadoDeTurnoId?: number | null

  createdAt: string
  updatedAt: string
}

export interface Etapa {
  key: string
  name: string
  completed: boolean
  time: string | null
  funcionario?: string | null
}

const props = defineProps<{
  modelValue: boolean
  turno: Turno | null
}>()
defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const currentTab = ref('detalles')

// Cada vez que se abre el modal (con un turno nuevo o reabierto), vuelve
// siempre a la pestaña "Detalles" — mismo comportamiento que openDetails()
// en EstadoDeTurnos.vue.
watch(
  () => props.modelValue,
  (open) => {
    if (open) currentTab.value = 'detalles'
  }
)

/* ── Funciones de la Tarjeta Visual (idénticas a EstadoDeTurnos.vue) ── */
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
  const n = turno.turnoNumeroServicio ?? null
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

const cardColor = (estado: Turno['estado']) => {
  if (estado === 'finalizado') return 'green-darken-1'
  if (estado === 'cancelado') return 'red-darken-1'
  if (estado === 'inactivo') return 'grey-darken-2'
  return 'blue-darken-1'
}

const estadoChipLabel = (estado: Turno['estado']) => {
  if (estado === 'finalizado') return 'Finalizado'
  if (estado === 'cancelado') return 'Cancelado'
  if (estado === 'inactivo') return 'Inactivo'
  return 'En proceso'
}

const estadoChipColor = (estado: Turno['estado']) => {
  if (estado === 'finalizado') return 'light-green-accent-3'
  if (estado === 'cancelado') return 'red-accent-2'
  if (estado === 'inactivo') return 'grey'
  return 'amber'
}

const iconColor = (etapa: Etapa, turno: Turno) => {
  if (!etapa.completed) {
    return 'on-primary-text-light'
  }
  if (turno.estado === 'finalizado') {
    return 'white'
  }
  return 'success'
}

const getEtapas = (turno: Turno): Etapa[] => {
  const esSOAT = getServicioCodigo(turno).toUpperCase() === 'SOAT'

  const etapas: Etapa[] = [
    {
      key: `puerta-${turno.id}`,
      name: 'Puerta',
      completed: !!turno.horaIngreso,
      time: turno.horaIngreso,
      funcionario: turno.usuario
        ? `${turno.usuario.nombres} ${turno.usuario.apellidos}`
        : null,
    },
    {
      key: `facturacion-${turno.id}`,
      name: 'Facturación',
      completed: !!turno.tieneFacturacion,
      time: turno.horaFacturacion ?? null,
      funcionario: turno.facturacionFuncionario
        ? `${turno.facturacionFuncionario.nombres} ${turno.facturacionFuncionario.apellidos}`
        : null,
    },
  ]

  if (!esSOAT) {
    etapas.push({
      key: `certificacion-${turno.id}`,
      name: 'Certificación',
      completed: !!turno.horaSalida,
      time: turno.horaSalida,
      funcionario: turno.certificacionFuncionario
        ? `${turno.certificacionFuncionario.nombres} ${turno.certificacionFuncionario.apellidos}`
        : null,
    })
  }

  if (turno.estado === 'cancelado' || turno.estado === 'inactivo') {
    etapas.forEach((etapa) => {
      etapa.completed = false
      etapa.funcionario = null
    })
  }

  return etapas
}

const getTurnoStatusText = (estado: EstadoTurno): string => {
  switch (estado) {
    case 'activo':
      return 'Activo'
    case 'inactivo':
      return 'Inactivo'
    case 'cancelado':
      return 'Cancelado'
    case 'finalizado':
      return 'Finalizado'
    default:
      return 'Desconocido'
  }
}

const getTurnoStatusColor = (estado: EstadoTurno): string => {
  switch (estado) {
    case 'activo':
      return 'success'
    case 'inactivo':
      return 'grey'
    case 'cancelado':
      return 'error'
    case 'finalizado':
      return 'info'
    default:
      return 'grey-lighten-1'
  }
}

const getServicioCodigo = (t: Turno): string => {
  const s = t.servicio
  if (!s) return '—'
  return s.codigoServicio
}

const prettifyCanal = (canal?: CanalAtrib): string => {
  switch ((canal || '').toUpperCase()) {
    case 'FACHADA':
      return 'Fachada'
    case 'ASESOR':
      return 'Asesor Comercial'
    case 'TELE':
      return 'Call Center'
    case 'REDES':
      return 'Redes Sociales'
    default:
      return canal || '—'
  }
}

const prettifyAgenteTipo = (tipo?: string): string => {
  const t = (tipo || '').toUpperCase()
  switch (t) {
    case 'ASESOR_INTERNO':
      return 'Asesor Interno'
    case 'ASESOR_EXTERNO':
      return 'Asesor Externo'
    case 'ASESOR_COMERCIAL':
    case 'ASESOR_CONVENIO':
      return 'Asesor Comercial'
    case 'TELEMERCADEO':
      return 'Telemercadeo'
    default:
      return tipo || '—'
  }
}

const getClienteNombre = (t: Turno): string => {
  const c = t.cliente
  if (!c) return '—'
  if (c.nombreCompleto) return c.nombreCompleto
  if (c.nombre) return c.nombre
  const byParts = [c.nombres, c.apellidos].filter(Boolean).join(' ').trim()
  return byParts || c.razonSocial || '—'
}

const getClienteTelefono = (t: Turno): string =>
  t.cliente?.telefono || t.cliente?.celular || '—'

const getVehiculoColor = (t: Turno): string => t.vehiculo?.color || '—'

const getVehiculoMatricula = (t: Turno): string => t.vehiculo?.matricula || '—'

const getConductorNombre = (t: Turno): string => {
  const c = t.conductor
  if (!c) return '—'
  return c.nombre || '—'
}

const getConductorTelefono = (t: Turno): string => t.conductor?.telefono || '—'

const getUsuarioNombre = (t: Turno): string => {
  const u = t.usuario
  if (!u) return '—'
  const nombre = [u.nombres, u.apellidos].filter(Boolean).join(' ').trim()
  return nombre || `Usuario #${u.id}`
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const parts = dateString.split('T')
  return parts.length > 0 ? parts[0] : dateString
}

const formatTime = (timeString: string | null): string => {
  if (!timeString) return ''
  let time = DateTime.fromFormat(timeString, 'HH:mm:ss', { zone: 'America/Bogota' })
  if (!time.isValid) {
    time = DateTime.fromFormat(timeString, 'HH:mm', { zone: 'America/Bogota' })
  }
  return time.isValid ? time.toFormat('hh:mm a') : timeString
}
</script>

<style scoped>
/* 👇 ESTILOS PARA LA TARJETA VISUAL (copiados de EstadoDeTurnos.vue) */
.turno-card-historico {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  border-radius: 12px;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}

.estado-cancelado {
  border: 3px solid #ef5350 !important;
  background: linear-gradient(135deg, #e53935 0%, #c62828 100%) !important;
}

.estado-finalizado {
  border: 3px solid #66bb6a !important;
  background: linear-gradient(135deg, #43a047 0%, #2e7d32 100%) !important;
}

.estado-activo {
  border: 3px solid #42a5f5 !important;
  background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%) !important;
}

.estado-inactivo {
  border: 3px solid #757575 !important;
  background: linear-gradient(135deg, #616161 0%, #424242 100%) !important;
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

.etapa-funcionario {
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  padding-left: 28px;
  font-style: italic;
}

@media (min-width: 600px) {
  .etapa-funcionario {
    font-size: 0.75rem;
  }
}
</style>
