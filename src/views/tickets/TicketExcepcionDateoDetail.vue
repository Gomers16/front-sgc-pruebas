<!-- src/views/tickets/TicketExcepcionDateoDetail.vue -->
<template>
  <v-container class="py-6" style="max-width: 860px">
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <template v-if="ticket && detalle">
      <v-card elevation="8" class="rounded-xl mb-4">
        <v-card-title
          class="py-4 px-4 px-sm-6 d-flex align-center justify-space-between flex-wrap gap-2"
        >
          <div class="text-h5 font-weight-bold">🎫 {{ ticket.titulo }}</div>
          <v-chip
            :color="colorPorEstado(ticket.estado)"
            variant="flat"
            size="small"
            class="font-weight-600"
          >
            {{ estadoLabel(ticket.estado) }}
          </v-chip>
        </v-card-title>

        <v-card-text class="px-4 px-sm-6">
          <div class="text-caption text-medium-emphasis mb-4">
            Creado por {{ nombreUsuario(ticket.creadoPor) }} el
            {{ formatDateTime(ticket.createdAt) }}
          </div>

          <v-row dense class="mb-2">
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Placa</div>
              <div class="font-weight-600">{{ detalle.placa }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Turno</div>
              <div class="font-weight-600">#{{ detalle.turnoId }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Asesor</div>
              <div class="font-weight-600">
                {{ detalle.comercial?.nombre ?? '—' }}
                <span v-if="detalle.comercial?.tipo" class="text-caption text-medium-emphasis">
                  ({{
                    detalle.comercial.tipo === 'ASESOR_CONVENIO'
                      ? 'asesor convenio'
                      : 'asesor comercial'
                  }})
                </span>
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Convenio</div>
              <div class="font-weight-600">
                <template v-if="detalle.convenio">{{
                  etiquetaConvenio(detalle.convenio)
                }}</template>
                <template v-else>Sin convenio (nuevo directo)</template>
              </div>
              <div v-if="convenioFueCorregido" class="text-caption text-warning">
                Corregido por gerencia al aprobar (se pidió con el convenio #{{
                  detalle.convenioIdOriginal ?? '—'
                }}).
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">Caso de comisión</div>
              <v-chip size="small" variant="tonal" color="primary">{{
                etiquetaCaso(casoEfectivo)
              }}</v-chip>
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
              <div class="text-caption text-medium-emphasis">Minutos transcurridos</div>
              <div class="font-weight-600" :class="dentroVentana ? '' : 'text-error'">
                {{ detalle.minutosTotales }} min
                <template v-if="!dentroVentana"
                  >({{ detalle.minutosExceso }} min de exceso)</template
                >
              </div>
            </v-col>
          </v-row>

          <v-alert
            :type="dentroVentana ? 'success' : 'warning'"
            :icon="dentroVentana ? 'mdi-clock-check-outline' : 'mdi-clock-alert-outline'"
            variant="tonal"
            density="compact"
            class="mb-2"
          >
            <strong>
              <template v-if="dentroVentana">Dentro de ventana — comisión completa</template>
              <template v-else-if="ticket.estado === 'PENDIENTE'"
                >Fuera de ventana — requiere decisión de gerencia</template
              >
              <template v-else>Fuera de ventana</template>
            </strong>
          </v-alert>

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
              Aprobado por {{ nombreUsuario(detalle.aprobadoPor) }} el
              {{ formatDateTime(detalle.aprobadoAt) }} · <strong>{{ textoDecision }}</strong>
            </v-alert>
          </template>
          <template v-else-if="ticket.estado === 'RECHAZADO'">
            <v-alert type="error" variant="tonal" density="compact">
              Rechazado por {{ nombreUsuario(detalle.rechazadoPor) }} el
              {{ formatDateTime(detalle.rechazadoAt) }}
              <div class="mt-1"><strong>Motivo:</strong> {{ detalle.motivoRechazo }}</div>
            </v-alert>
          </template>

          <!-- Pendiente + rol resolutor: acciones según el caso -->
          <template v-else-if="ticket.estado === 'PENDIENTE' && esResolutor">
            <div class="text-subtitle-2 font-weight-bold mb-2">Resolver ticket</div>

            <!-- Corregir el convenio (solo comercial: el asesor convenio queda con el suyo) -->
            <div v-if="ticket.caso_comision !== 'CONVENIO_SELF'" class="mb-3">
              <v-switch
                v-model="corregirConvenio"
                color="primary"
                density="compact"
                hide-details
                label="Corregir el convenio antes de aprobar"
              />
              <v-autocomplete
                v-if="corregirConvenio"
                v-model="convenioCorregidoId"
                :items="opcionesConvenio"
                :item-title="(c: OpcionConvenio) => c.etiqueta"
                item-value="id"
                label="Convenio con el que se aprueba"
                variant="outlined"
                density="compact"
                class="mt-2"
                :loading="cargandoConvenios"
                hint="Solo los convenios asignados al asesor. El original queda registrado."
                persistent-hint
              />
            </div>

            <div class="text-caption text-medium-emphasis mb-3">
              <template v-if="dentroVentana">
                Dentro de ventana: se aprueba con comisión completa, sin decisión de gerencia.
              </template>
              <template v-else-if="casoEfectivo === 'CONVENIO_COMERCIAL'">
                Fuera de ventana: decide si cobran el asesor y/o el convenio.
              </template>
              <template v-else-if="casoEfectivo === 'CONVENIO_SELF'">
                Fuera de ventana: el asesor convenio es el convenio, así que es con o sin comisión.
              </template>
              <template v-else
                >Fuera de ventana: decide si el asesor cobra (no hay convenio).</template
              >
            </div>
            <div class="d-flex gap-2 flex-wrap">
              <v-btn
                v-for="op in opciones"
                :key="op.clave"
                :color="op.color"
                :loading="aprobando"
                :disabled="corregirConvenio && convenioCorregidoId === undefined"
                @click="pedirConfirmacion(op)"
              >
                {{ op.texto }}
              </v-btn>
              <v-btn
                color="error"
                variant="tonal"
                :loading="rechazando"
                @click="mostrarRechazo = true"
              >
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

      <!-- Línea de tiempo -->
      <v-card elevation="4" class="rounded-xl mb-4">
        <v-card-title class="py-3 px-4 px-sm-6 text-subtitle-1 font-weight-bold"
          >Historial</v-card-title
        >
        <v-card-text class="px-4 px-sm-6">
          <v-timeline
            v-if="ticket.eventos?.length"
            density="compact"
            side="end"
            truncate-line="both"
          >
            <v-timeline-item
              v-for="(e, i) in ticket.eventos"
              :key="e.id ?? `s${i}`"
              :dot-color="EVENTO[e.tipo].color"
              :icon="EVENTO[e.tipo].icono"
              size="small"
            >
              <div class="text-body-2 font-weight-600">
                {{ EVENTO[e.tipo].texto }}
                <v-chip v-if="e.sintetico" size="x-small" variant="outlined" class="ml-1">
                  reconstruido
                </v-chip>
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ e.usuarioNombre ?? 'Sin usuario' }} · {{ formatDateTime(e.fecha) }}
              </div>
              <div v-if="detalleEvento(e)" class="text-caption">{{ detalleEvento(e) }}</div>
            </v-timeline-item>
          </v-timeline>
          <div v-else class="text-caption text-medium-emphasis">Sin eventos.</div>
          <div
            v-if="ticket.eventos?.some((e) => e.sintetico)"
            class="text-caption text-medium-emphasis mt-2"
          >
            "Reconstruido" = no quedó registrado como evento (p. ej. se resolvió desde otra
            instalación); se armó con los datos del ticket.
          </div>
        </v-card-text>
      </v-card>

      <!-- Comentarios -->
      <v-card elevation="4" class="rounded-xl">
        <v-card-title class="py-3 px-4 px-sm-6 text-subtitle-1 font-weight-bold"
          >Comentarios</v-card-title
        >
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
      {{ errorCarga ?? 'No se pudo cargar el ticket.' }}
    </v-alert>

    <!-- Confirmar aprobación (un solo diálogo; el texto dice quién pierde la comisión) -->
    <v-dialog v-model="confirmando" max-width="460">
      <v-card v-if="opcionElegida">
        <v-card-title class="text-subtitle-1 font-weight-bold">{{
          opcionElegida.titulo
        }}</v-card-title>
        <v-card-text>
          {{ opcionElegida.mensaje }}
          <div v-if="corregirConvenio" class="mt-2">
            <strong>Convenio:</strong> {{ etiquetaConvenioCorregido }} (el original queda
            registrado).
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="confirmando = false">Cancelar</v-btn>
          <v-btn :color="opcionElegida.color" :loading="aprobando" @click="aprobar"
            >Confirmar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Rechazar -->
    <v-dialog v-model="mostrarRechazo" max-width="480">
      <v-card>
        <v-card-title class="text-subtitle-1 font-weight-bold">Rechazar ticket</v-card-title>
        <v-card-text>
          No se crea el dateo ni la comisión.
          <v-textarea
            v-model="motivoRechazo"
            label="Motivo del rechazo"
            variant="outlined"
            density="compact"
            rows="3"
            auto-grow
            required
            class="mt-2"
          />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="mostrarRechazo = false">Cancelar</v-btn>
          <v-btn
            color="error"
            :loading="rechazando"
            :disabled="!motivoRechazo.trim()"
            @click="rechazar"
          >
            Rechazar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="5000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/AuthStore'
import {
  getTicket,
  agregarComentario,
  aprobarTicketExcepcionDateo,
  rechazarTicketExcepcionDateo,
  type CasoComision,
  type EventoTicket,
  type Ticket,
  type TicketDetalleExcepcionDateo,
  type TicketEstado,
  type TipoEventoTicket,
  type UsuarioLight,
} from '@/services/ticketsService'
import { formatDateTime } from '@/services/dateosService'
import { etiquetaConvenio, listConveniosAsignados } from '@/services/conveniosService'
import { HttpError } from '@/services/http'
import { usePermissions } from '@/composables/usePermissions'
import { useTicketsPendientes } from '@/composables/useTicketsPendientes'
import { resolucionComision, textoResolucion } from './resolucionTicket'
import {
  casoConConvenioCorregido,
  mensajeErrorResolucion,
  opcionesAprobacion,
  type OpcionAprobacion,
} from './decisionComision'

const props = defineProps<{ id: string | number }>()
const auth = useAuthStore()
const { can } = usePermissions()
const { refrescarPendientes } = useTicketsPendientes()

const ticket = ref<Ticket | null>(null)
const detalle = ref<TicketDetalleExcepcionDateo | null>(null)
const loading = ref(false)
const errorCarga = ref<string | null>(null)

const aprobando = ref(false)
const rechazando = ref(false)
const confirmando = ref(false)
const opcionElegida = ref<OpcionAprobacion | null>(null)
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

const ETIQUETA_CASO: Record<CasoComision, string> = {
  SIN_CONVENIO: 'Caso 1 · sin convenio',
  CONVENIO_SELF: 'Caso 2 · asesor convenio (asesor y convenio son la misma persona)',
  CONVENIO_COMERCIAL: 'Caso 3 · comercial con convenio',
}
function etiquetaCaso(c: CasoComision | null) {
  return c ? ETIQUETA_CASO[c] : '—'
}

// TINYINT(1): 0/1 → Boolean(), nunca === true.
const dentroVentana = computed(() => Boolean(detalle.value?.dentroVentana))

// Resolutor: roles_resuelve del tipo o SUPER_ADMIN/GERENCIA (mismo criterio que
// el backend). El backend además rechaza aprobar/rechazar fuera de PENDIENTE.
const esResolutor = computed(() => {
  const roles = ticket.value?.tipoTicket?.rolesResuelve ?? []
  return can.verEstadisticasTickets() || (roles.length > 0 && auth.hasAnyRole(roles))
})

const convenioFueCorregido = computed(() => {
  const d = detalle.value
  if (!d || ticket.value?.estado !== 'APROBADO' || d.canal === null) return false
  return (d.convenioIdOriginal ?? null) !== (d.convenioId ?? null)
})

const textoDecision = computed(() => {
  const d = detalle.value
  if (!d) return ''
  return textoResolucion(resolucionComision(d), ticket.value?.caso_comision ?? null)
})

/* ═══════════ Corrección de convenio al aprobar ═══════════ */
interface OpcionConvenio {
  id: number | null
  etiqueta: string
}
const corregirConvenio = ref(false)
// undefined = todavía no eligió; null = sin convenio.
const convenioCorregidoId = ref<number | null | undefined>(undefined)
const opcionesConvenio = ref<OpcionConvenio[]>([])
const cargandoConvenios = ref(false)

watch(corregirConvenio, async (activo) => {
  convenioCorregidoId.value = undefined
  if (!activo || !detalle.value || opcionesConvenio.value.length) return
  cargandoConvenios.value = true
  try {
    const asignados = await listConveniosAsignados(detalle.value.comercialId)
    opcionesConvenio.value = [
      { id: null, etiqueta: 'Sin convenio (nuevo directo)' },
      ...asignados.map((c) => ({ id: c.id, etiqueta: etiquetaConvenio(c) })),
    ]
  } finally {
    cargandoConvenios.value = false
  }
})

const etiquetaConvenioCorregido = computed(
  () => opcionesConvenio.value.find((c) => c.id === convenioCorregidoId.value)?.etiqueta ?? '—',
)

// El caso cambia si gerencia corrige el convenio (casoConConvenioCorregido).
const casoEfectivo = computed<CasoComision | null>(() =>
  casoConConvenioCorregido(
    ticket.value?.caso_comision ?? null,
    corregirConvenio.value ? convenioCorregidoId.value : undefined,
  ),
)
const opciones = computed(() => opcionesAprobacion(casoEfectivo.value, dentroVentana.value))

/* ═══════════ Línea de tiempo ═══════════ */
const EVENTO: Record<TipoEventoTicket, { texto: string; icono: string; color: string }> = {
  CREADO: { texto: 'Ticket creado', icono: 'mdi-plus', color: 'primary' },
  COMENTARIO: { texto: 'Comentario', icono: 'mdi-comment-text-outline', color: 'grey' },
  CONVENIO_CORREGIDO: {
    texto: 'Convenio corregido',
    icono: 'mdi-swap-horizontal',
    color: 'warning',
  },
  APROBADO: { texto: 'Aprobado', icono: 'mdi-check', color: 'success' },
  RECHAZADO: { texto: 'Rechazado', icono: 'mdi-close', color: 'error' },
}

function detalleEvento(e: EventoTicket): string {
  const d = e.datos ?? {}
  if (e.tipo === 'APROBADO') {
    const r = resolucionComision({
      conComision: d.con_comision_asesor as number | boolean | null,
      conComisionAsesor: d.con_comision_asesor as number | boolean | null,
      conComisionConvenio: d.con_comision_convenio as number | boolean | null,
      dentroVentana: d.dentro_ventana as boolean | null,
      convenioId: d.caso === 'SIN_CONVENIO' ? null : detalle.value?.convenioId,
    })
    return textoResolucion(r, (d.caso as CasoComision) ?? ticket.value?.caso_comision ?? null)
  }
  if (e.tipo === 'RECHAZADO') return d.motivo ? `Motivo: ${d.motivo}` : ''
  if (e.tipo === 'CONVENIO_CORREGIDO') {
    const nombre = (id: unknown) => (id ? `#${id}` : 'sin convenio')
    return `De ${nombre(d.convenio_anterior_id)} a ${nombre(d.convenio_nuevo_id)}`
  }
  if (e.tipo === 'COMENTARIO') {
    const c = ticket.value?.comentarios?.find((x) => x.id === Number(d.comentario_id))
    return c ? `“${c.mensaje}”` : ''
  }
  return ''
}

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
  errorCarga.value = null
  try {
    const data = await getTicket(Number(props.id))
    ticket.value = data
    detalle.value = data.detalle ?? null
  } catch (err) {
    ticket.value = null
    errorCarga.value =
      err instanceof HttpError && err.status === 403
        ? 'No tienes acceso a este ticket.'
        : err instanceof HttpError && err.status === 404
          ? 'El ticket no existe.'
          : 'No se pudo cargar el ticket.'
  } finally {
    loading.value = false
  }
}

function pedirConfirmacion(op: OpcionAprobacion) {
  opcionElegida.value = op
  confirmando.value = true
}

async function aprobar() {
  if (!ticket.value || !opcionElegida.value) return
  aprobando.value = true
  try {
    const body = { ...opcionElegida.value.body }
    if (corregirConvenio.value && convenioCorregidoId.value !== undefined) {
      body.convenio_id = convenioCorregidoId.value
    }
    await aprobarTicketExcepcionDateo(ticket.value.id, body)
    confirmando.value = false
    corregirConvenio.value = false
    snackbar.value = { show: true, color: 'success', text: 'Ticket aprobado correctamente.' }
    await cargar()
    refrescarPendientes()
  } catch (err) {
    const status = err instanceof HttpError ? err.status : undefined
    const data = err instanceof HttpError ? err.data : undefined
    snackbar.value = {
      show: true,
      color: 'error',
      text: mensajeErrorResolucion(status, data, 'No se pudo aprobar el ticket.'),
    }
    confirmando.value = false
    if (status === 409) await cargar()
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
    refrescarPendientes()
  } catch (err) {
    const status = err instanceof HttpError ? err.status : undefined
    const data = err instanceof HttpError ? err.data : undefined
    snackbar.value = {
      show: true,
      color: 'error',
      text: mensajeErrorResolucion(status, data, 'No se pudo rechazar el ticket.'),
    }
    mostrarRechazo.value = false
    if (status === 409) await cargar()
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
