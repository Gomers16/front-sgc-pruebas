<!-- src/views/tickets/TicketExcepcionDateoDetail.vue -->
<template>
  <v-container class="py-6" style="max-width: 820px">
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <template v-if="ticket && detalle">
      <v-card elevation="8" class="rounded-xl mb-4">
        <v-card-title class="py-4 px-4 px-sm-6 d-flex align-center justify-space-between flex-wrap gap-2">
          <div class="text-h5 font-weight-bold">🎫 {{ ticket.titulo }}</div>
          <v-chip :color="colorPorEstado(ticket.estado)" variant="flat" size="small" class="font-weight-600">
            {{ estadoLabel(ticket.estado) }}
          </v-chip>
        </v-card-title>

        <v-card-text class="px-4 px-sm-6">
          <div class="text-caption text-medium-emphasis mb-4">
            Creado por {{ nombreUsuario(ticket.creadoPor) }} el {{ formatDateTime(ticket.createdAt) }}
          </div>

          <v-row dense class="mb-2">
            <v-col cols="6" sm="4">
              <div class="text-caption text-medium-emphasis">Placa</div>
              <div class="font-weight-600">{{ detalle.placa }}</div>
            </v-col>
            <v-col cols="6" sm="4">
              <div class="text-caption text-medium-emphasis">Turno</div>
              <div class="font-weight-600">#{{ detalle.turnoId }}</div>
            </v-col>
            <v-col cols="6" sm="4">
              <div class="text-caption text-medium-emphasis">Comercial</div>
              <div class="font-weight-600">{{ detalle.comercial?.nombre ?? '—' }}</div>
            </v-col>
          </v-row>

          <v-divider class="my-3" />

          <div class="text-subtitle-2 font-weight-bold mb-2">Ventana de tiempo</div>
          <v-row dense class="mb-2">
            <v-col cols="12" sm="4">
              <div class="text-caption text-medium-emphasis">Hora de ingreso del turno</div>
              <div class="font-weight-600">{{ detalle.horaIngreso }}</div>
            </v-col>
            <v-col cols="12" sm="4">
              <div class="text-caption text-medium-emphasis">Hora del intento de dateo</div>
              <div class="font-weight-600">{{ formatDateTime(detalle.horaIntentoDateo) }}</div>
            </v-col>
            <v-col cols="12" sm="4">
              <div class="text-caption text-medium-emphasis">Exceso sobre el límite (40 min)</div>
              <div class="font-weight-600 text-error">
                {{ detalle.minutosExceso }} min ({{ detalle.minutosTotales }} min en total)
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-3" />

          <div class="text-subtitle-2 font-weight-bold mb-1">Observación</div>
          <div class="text-body-2 mb-3">{{ detalle.observacion }}</div>

          <div class="text-subtitle-2 font-weight-bold mb-2">Evidencias</div>
          <div class="d-flex flex-wrap gap-3 mb-2">
            <a
              v-for="ev in evidenciasList"
              :key="ev.label"
              :href="ev.url"
              target="_blank"
              rel="noopener"
              class="evidencia-thumb"
            >
              <img :src="ev.url" :alt="ev.label" />
              <div class="text-caption text-center mt-1">{{ ev.label }}</div>
            </a>
          </div>

          <v-divider class="my-3" />

          <!-- Ya resuelto: solo lectura para TODOS los roles, sin excepción -->
          <template v-if="ticket.estado === 'APROBADO'">
            <v-alert type="success" variant="tonal" density="compact">
              Aprobado por {{ nombreUsuario(detalle.aprobadoPor) }} el {{ formatDateTime(detalle.aprobadoAt) }}
              · Penalización aplicada: <strong>{{ detalle.porcentajePenalizacion }}%</strong>
            </v-alert>
          </template>
          <template v-else-if="ticket.estado === 'RECHAZADO'">
            <v-alert type="error" variant="tonal" density="compact">
              Rechazado por {{ nombreUsuario(detalle.rechazadoPor) }} el {{ formatDateTime(detalle.rechazadoAt) }}
              <div class="mt-1"><strong>Motivo:</strong> {{ detalle.motivoRechazo }}</div>
            </v-alert>
          </template>

          <!-- Pendiente + rol resolutor: acciones -->
          <template v-else-if="ticket.estado === 'PENDIENTE' && esResolutor">
            <div class="text-subtitle-2 font-weight-bold mb-2">Resolver ticket</div>

            <v-text-field
              v-model.number="porcentaje"
              label="% de penalización"
              type="number"
              min="0"
              max="100"
              variant="outlined"
              density="compact"
              style="max-width: 220px"
              class="mb-3"
            />

            <div class="d-flex gap-2 flex-wrap">
              <v-btn
                color="success"
                :loading="aprobando"
                :disabled="!porcentajeValido"
                @click="confirmarAprobar = true"
              >
                Aprobar
              </v-btn>
              <v-btn color="error" variant="tonal" :loading="rechazando" @click="mostrarRechazo = true">
                Rechazar
              </v-btn>
            </div>
          </template>
          <template v-else-if="ticket.estado === 'PENDIENTE'">
            <v-alert type="info" variant="tonal" density="compact">
              Este ticket está pendiente de revisión por gerencia.
            </v-alert>
          </template>
        </v-card-text>
      </v-card>

      <!-- Comentarios -->
      <v-card elevation="4" class="rounded-xl">
        <v-card-title class="py-3 px-4 px-sm-6 text-subtitle-1 font-weight-bold">Comentarios</v-card-title>
        <v-card-text class="px-4 px-sm-6">
          <div v-if="!ticket.comentarios?.length" class="text-caption text-medium-emphasis mb-3">
            Sin comentarios todavía.
          </div>
          <div v-for="c in ticket.comentarios" :key="c.id" class="mb-3">
            <div class="text-caption font-weight-600">
              {{ nombreUsuario(c.usuario) }} · {{ formatDateTime(c.createdAt) }}
            </div>
            <div class="text-body-2">{{ c.mensaje }}</div>
          </div>

          <v-textarea
            v-model="nuevoComentario"
            label="Agregar comentario"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
          />
          <div class="d-flex justify-end">
            <v-btn
              size="small"
              color="primary"
              :loading="enviandoComentario"
              :disabled="!nuevoComentario.trim()"
              @click="enviarComentario"
            >
              Comentar
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </template>

    <v-alert v-else-if="!loading" type="error" variant="tonal">
      No se pudo cargar el ticket.
    </v-alert>

    <!-- Confirmar aprobar -->
    <v-dialog v-model="confirmarAprobar" max-width="420">
      <v-card>
        <v-card-title class="text-subtitle-1 font-weight-bold">Confirmar aprobación</v-card-title>
        <v-card-text>
          Esto crea/vincula el dateo, puede generar comisión y registra un CARGO de
          <strong>{{ porcentaje }}%</strong> en el saldo de penalizaciones del comercial. No se puede
          deshacer. ¿Continuar?
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="confirmarAprobar = false">Cancelar</v-btn>
          <v-btn color="success" :loading="aprobando" @click="aprobar">Confirmar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Rechazar -->
    <v-dialog v-model="mostrarRechazo" max-width="480">
      <v-card>
        <v-card-title class="text-subtitle-1 font-weight-bold">Rechazar ticket</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="motivoRechazo"
            label="Motivo del rechazo"
            variant="outlined"
            density="compact"
            rows="3"
            auto-grow
            required
          />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="mostrarRechazo = false">Cancelar</v-btn>
          <v-btn color="error" :loading="rechazando" :disabled="!motivoRechazo.trim()" @click="rechazar">
            Rechazar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'
import {
  getTicket,
  agregarComentario,
  aprobarTicketExcepcionDateo,
  rechazarTicketExcepcionDateo,
  type Ticket,
  type TicketDetalleExcepcionDateo,
  type TicketEstado,
  type UsuarioLight,
} from '@/services/ticketsService'
import { formatDateTime } from '@/services/dateosService'
import { HttpError } from '@/services/http'

const props = defineProps<{ id: string | number }>()
const auth = useAuthStore()

const ticket = ref<Ticket | null>(null)
const detalle = ref<TicketDetalleExcepcionDateo | null>(null)
const loading = ref(false)

const porcentaje = ref<number | null>(null)
const aprobando = ref(false)
const rechazando = ref(false)
const confirmarAprobar = ref(false)
const mostrarRechazo = ref(false)
const motivoRechazo = ref('')

const nuevoComentario = ref('')
const enviandoComentario = ref(false)

const snackbar = ref<{ show: boolean; text: string; color: 'success' | 'error' }>({
  show: false,
  text: '',
  color: 'success',
})

const ESTADO_LABEL: Record<TicketEstado, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
}
const ESTADO_COLOR: Record<TicketEstado, string> = {
  PENDIENTE: 'warning',
  APROBADO: 'success',
  RECHAZADO: 'error',
  RESUELTO: 'info',
  CERRADO: 'grey',
}
function estadoLabel(e: TicketEstado) {
  return ESTADO_LABEL[e] ?? e
}
function colorPorEstado(e: TicketEstado) {
  return ESTADO_COLOR[e] ?? 'grey'
}

function nombreUsuario(u?: UsuarioLight | null) {
  if (!u) return '—'
  return [u.nombres, u.apellidos].filter(Boolean).join(' ') || u.correo || `#${u.id}`
}

// Ticket ya resuelto (APROBADO/RECHAZADO) → nunca se muestran acciones, para
// NINGÚN rol, ni siquiera quien lo creó o quien lo resolvió — el backend
// además rechaza con 400 cualquier PATCH /aprobar o /rechazar sobre un
// ticket que no esté en PENDIENTE (ver tickets_excepcion_dateo_controller.ts),
// así que esto no depende solo de ocultar los botones acá.
const esResolutor = computed(() => {
  const roles = ticket.value?.tipoTicket?.rolesResuelve
  if (!roles?.length) return false
  return auth.hasAnyRole(roles)
})

const porcentajeValido = computed(
  () => porcentaje.value !== null && porcentaje.value >= 0 && porcentaje.value <= 100
)

const evidenciasList = computed(() => {
  if (!detalle.value) return []
  const d = detalle.value
  const list = [
    { label: 'Chat', url: d.evidenciaChatUrl },
    { label: 'Grupo WhatsApp', url: d.evidenciaGrupoWhatsappUrl },
    { label: 'Bloqueo', url: d.evidenciaBloqueoUrl },
  ]
  if (d.evidenciaCalamidadUrl) list.push({ label: 'Calamidad', url: d.evidenciaCalamidadUrl })
  return list
})

async function cargar() {
  loading.value = true
  try {
    const data = await getTicket(Number(props.id))
    ticket.value = data
    detalle.value = data.detalle ?? null
  } catch (err) {
    console.error('Error cargando ticket:', err)
    ticket.value = null
  } finally {
    loading.value = false
  }
}

async function aprobar() {
  if (!ticket.value || !porcentajeValido.value || porcentaje.value === null) return
  aprobando.value = true
  try {
    await aprobarTicketExcepcionDateo(ticket.value.id, porcentaje.value)
    confirmarAprobar.value = false
    snackbar.value = { show: true, color: 'success', text: 'Ticket aprobado correctamente.' }
    await cargar()
  } catch (err) {
    const data = err instanceof HttpError ? (err.data as { message?: string } | undefined) : undefined
    snackbar.value = {
      show: true,
      color: 'error',
      text: data?.message || 'No se pudo aprobar el ticket.',
    }
  } finally {
    aprobando.value = false
  }
}

async function rechazar() {
  if (!ticket.value || !motivoRechazo.value.trim()) return
  rechazando.value = true
  try {
    await rechazarTicketExcepcionDateo(ticket.value.id, motivoRechazo.value.trim())
    mostrarRechazo.value = false
    snackbar.value = { show: true, color: 'success', text: 'Ticket rechazado.' }
    await cargar()
  } catch (err) {
    const data = err instanceof HttpError ? (err.data as { message?: string } | undefined) : undefined
    snackbar.value = {
      show: true,
      color: 'error',
      text: data?.message || 'No se pudo rechazar el ticket.',
    }
  } finally {
    rechazando.value = false
  }
}

async function enviarComentario() {
  if (!ticket.value || !nuevoComentario.value.trim()) return
  enviandoComentario.value = true
  try {
    await agregarComentario(ticket.value.id, nuevoComentario.value.trim())
    nuevoComentario.value = ''
    await cargar()
  } catch (err) {
    console.error('Error agregando comentario:', err)
    snackbar.value = { show: true, color: 'error', text: 'No se pudo agregar el comentario.' }
  } finally {
    enviandoComentario.value = false
  }
}

onMounted(cargar)
</script>

<style scoped>
.evidencia-thumb {
  display: block;
  width: 140px;
  text-decoration: none;
  color: inherit;
}
.evidencia-thumb img {
  width: 140px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
