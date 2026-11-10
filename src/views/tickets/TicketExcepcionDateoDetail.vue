<!-- src/views/tickets/TicketExcepcionDateoDetail.vue -->
<template>
  <v-container class="py-6" style="max-width: 860px">
    <v-btn
      variant="text"
      color="primary"
      prepend-icon="mdi-arrow-left"
      class="mb-2 px-1"
      data-test="volver-bandeja"
      @click="volverABandeja"
    >
      Volver a la bandeja
    </v-btn>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <template v-if="ticket && detalle">
      <v-card elevation="8" class="rounded-xl mb-4">
        <v-card-title
          class="py-4 px-4 px-sm-6 d-flex align-center justify-space-between flex-wrap gap-2"
        >
          <div class="text-h5 font-weight-bold titulo">🎫 {{ ticket.titulo }}</div>
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
              <div class="font-weight-600">{{ turno.principal }}</div>
              <div class="text-caption text-medium-emphasis">
                <template v-if="turno.secundario">{{ turno.secundario }} · </template>id interno #{{
                  detalle.turnoId
                }}
              </div>
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
                {{
                  textoConvenioCorregido(
                    detalle.convenioIdOriginal ?? null,
                    nombresConvenio,
                    corregidoDespuesDeAprobar,
                  )
                }}
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

          <!-- Fuera de ventana: aviso visible. Dentro: solo el chip junto a los minutos. -->
          <v-alert
            v-if="!dentroVentana"
            type="warning"
            variant="tonal"
            icon="mdi-clock-alert-outline"
            density="compact"
            class="mb-3"
            data-test="aviso-tarde"
          >
            <strong>Fuera de ventana: llegó {{ detalle.minutosExceso }} min tarde</strong>
          </v-alert>

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
              <div class="d-flex align-center flex-wrap ga-2">
                <span class="font-weight-600">
                  {{ detalle.minutosTotales }} min
                  <template v-if="!dentroVentana"
                    >({{ detalle.minutosExceso }} min de exceso)</template
                  >
                </span>
                <!-- Solo informa: la decisión de comisión se toma dentro y fuera de ventana. -->
                <v-chip
                  v-if="dentroVentana"
                  size="x-small"
                  variant="tonal"
                  color="success"
                  prepend-icon="mdi-clock-check-outline"
                  data-test="chip-ventana"
                >
                  Dentro de ventana
                </v-chip>
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
              Aprobado por {{ nombreUsuario(detalle.aprobadoPor) }} el
              {{ formatDateTime(detalle.aprobadoAt) }} · <strong>{{ textoDecision }}</strong>
            </v-alert>
            <!-- Corrección posterior del convenio: solo con la comisión PENDIENTE -->
            <div
              v-if="esResolutor && ticket.caso_comision !== 'CONVENIO_SELF'"
              class="d-flex align-center flex-wrap ga-2 mt-3"
              data-test="corregir-convenio"
            >
              <v-btn
                size="small"
                variant="outlined"
                color="primary"
                prepend-icon="mdi-swap-horizontal"
                :disabled="!correccionPermitida.puede"
                @click="abrirCorreccion"
              >
                Corregir convenio
              </v-btn>
              <span v-if="!correccionPermitida.puede" class="text-caption text-medium-emphasis">
                {{ correccionPermitida.motivo }}
              </span>
            </div>
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

            <!-- Convenio con el que se aprueba: visible y editable (el asesor convenio queda con el suyo) -->
            <div class="mb-3" data-test="convenio-aprobar">
              <div class="text-subtitle-2 font-weight-bold mb-2">Convenio</div>
              <v-alert
                v-if="ticket.caso_comision === 'CONVENIO_SELF'"
                type="info"
                variant="outlined"
                density="compact"
              >
                Asesor convenio: se aprueba con su propio convenio.
              </v-alert>
              <template v-else>
                <v-autocomplete
                  v-model="convenioSel"
                  v-model:search="busquedaConvenio"
                  :items="opcionesConvenio"
                  :item-title="etiquetaOpcionConvenio"
                  item-value="id"
                  return-object
                  no-filter
                  label="Convenio con el que se aprueba"
                  placeholder="Busca por nombre o negocio"
                  variant="outlined"
                  density="compact"
                  :loading="cargandoConvenios"
                  :disabled="sinConvenioMarcado"
                  clearable
                  hint="Primero los asignados al asesor. Si lo cambias, el original queda registrado."
                  persistent-hint
                />
                <v-checkbox
                  v-model="sinConvenioMarcado"
                  :label="
                    sinConvenioDecidido(detalle.sinConvenioExplicito)
                      ? 'Sin convenio (directo)'
                      : 'Confirmo: sin convenio (directo)'
                  "
                  color="primary"
                  density="compact"
                  hide-details
                  data-test="sin-convenio-aprobar"
                />
                <v-alert
                  v-if="avisoObservacion"
                  type="warning"
                  variant="tonal"
                  density="compact"
                  class="mt-2"
                  data-test="aviso-observacion-convenio"
                >
                  La observación menciona un convenio y el ticket está sin convenio. Revisa
                  la observación antes de aprobar.
                </v-alert>
                <v-alert
                  v-if="convenioSel?.asignado === false"
                  type="warning"
                  variant="tonal"
                  density="compact"
                  class="mt-2"
                  data-test="aviso-no-asignado"
                >
                  Este convenio no está asignado al asesor. Se permite y queda registrado en el
                  historial.
                </v-alert>
                <div v-if="camposConvenio === null" class="text-caption text-error mt-1">
                  Elige el convenio o marca "Sin convenio (directo)".
                </div>
              </template>
            </div>

            <v-card
              variant="outlined"
              class="decision pa-3 pa-sm-4 mb-3"
              data-test="decision-comision"
            >
              <div class="text-subtitle-2 font-weight-bold">Decisión de comisión</div>
              <div
                v-if="casoEfectivo === 'CONVENIO_SELF'"
                class="text-caption text-medium-emphasis mt-1"
              >
                El asesor convenio y el convenio son la misma persona: esta decisión aplica a ambos.
              </div>
              <div
                v-else-if="casoEfectivo === 'SIN_CONVENIO'"
                class="text-caption text-medium-emphasis mt-1"
              >
                Sin convenio: solo se decide la comisión del asesor.
              </div>
              <div
                v-if="textoReglaDescuentoConvenio(casoEfectivo)"
                class="text-caption text-medium-emphasis mt-1"
                data-test="regla-descuento-convenio"
              >
                {{ textoReglaDescuentoConvenio(casoEfectivo) }}
              </div>

              <div class="mt-3">
                <div v-for="i in interruptores" :key="i.clave" class="interruptor">
                  <span class="text-body-2 font-weight-medium">{{ i.etiqueta }}</span>
                  <v-btn-toggle
                    :model-value="i.cobra ? 'cobra' : 'no'"
                    mandatory
                    divided
                    density="compact"
                    variant="outlined"
                    rounded="lg"
                    :color="i.cobra ? 'success' : 'error'"
                    :data-test="`interruptor-${i.clave}`"
                    @update:model-value="(v: string) => i.cambiar(v === 'cobra')"
                  >
                    <v-btn value="cobra" prepend-icon="mdi-check" size="small">Cobra</v-btn>
                    <v-btn value="no" prepend-icon="mdi-close" size="small">No cobra</v-btn>
                  </v-btn-toggle>
                </div>
              </div>

              <v-alert
                :color="COLOR_NIVEL[decision.nivel]"
                :icon="
                  decision.nivel === 'todos' ? 'mdi-account-check-outline' : 'mdi-alert-outline'
                "
                variant="tonal"
                density="compact"
                class="mt-3"
                data-test="resumen-decision"
              >
                {{ decision.resumen }}
              </v-alert>
            </v-card>

            <div class="acciones">
              <v-btn
                color="error"
                variant="outlined"
                :loading="rechazando"
                :disabled="aprobando"
                @click="mostrarRechazo = true"
              >
                Rechazar
              </v-btn>
              <v-btn
                color="success"
                variant="flat"
                prepend-icon="mdi-check"
                :loading="aprobando"
                :disabled="camposConvenio === null"
                data-test="btn-aprobar"
                @click="confirmando = true"
              >
                Aprobar
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
      <v-card>
        <v-card-title class="text-subtitle-1 font-weight-bold">{{ decision.titulo }}</v-card-title>
        <v-card-text>
          {{ decision.mensaje }}
          <div v-if="camposConvenio && 'convenio_id' in camposConvenio" class="mt-2">
            <strong>Convenio:</strong> {{ etiquetaConvenioElegido }} (el original queda
            registrado).
          </div>
          <div v-else-if="camposConvenio?.confirmar_sin_convenio" class="mt-2">
            <strong>Convenio:</strong> sin convenio (directo), confirmado ahora.
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="confirmando = false">Cancelar</v-btn>
          <v-btn
            :color="decision.nivel === 'todos' ? 'success' : COLOR_NIVEL[decision.nivel]"
            variant="flat"
            :loading="aprobando"
            @click="aprobar"
            >Confirmar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Corregir el convenio de un ticket aprobado (vista previa con el mismo cálculo) -->
    <v-dialog v-model="corrigiendo" max-width="600" scrollable>
      <v-card v-if="ticket && detalle" data-test="dialogo-corregir-convenio">
        <v-card-title class="text-subtitle-1 font-weight-bold titulo"
          >Corregir el convenio de un ticket aprobado</v-card-title
        >
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-3">
            Actual:
            <strong>{{
              detalle.convenio ? etiquetaConvenio(detalle.convenio) : 'sin convenio (directo)'
            }}</strong>
            · {{ etiquetaCaso(ticket.caso_comision ?? null) }}
          </div>
          <v-autocomplete
            v-model="corrSel"
            v-model:search="corrBusqueda"
            :items="corrOpciones"
            :item-title="etiquetaOpcionConvenio"
            item-value="id"
            return-object
            no-filter
            label="Convenio correcto"
            placeholder="Busca por nombre o negocio"
            variant="outlined"
            density="compact"
            :loading="corrCargando"
            :disabled="corrSinConvenio"
            clearable
            hint="Primero los asignados al asesor."
            persistent-hint
          />
          <v-checkbox
            v-model="corrSinConvenio"
            label="Sin convenio (directo)"
            color="primary"
            density="compact"
            hide-details
          />
          <v-alert
            v-if="corrElegido !== undefined && !corrCambia"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            Es el convenio que ya tiene el ticket.
          </v-alert>
          <v-alert
            v-if="corrSel?.asignado === false"
            type="warning"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            Este convenio no está asignado al asesor. Se permite y queda registrado en el
            historial.
          </v-alert>

          <template v-if="casoCorr">
            <div class="text-subtitle-2 font-weight-bold mt-4">Decisión de comisión</div>
            <div class="text-caption text-medium-emphasis">
              La que se tomó al aprobar; puedes cambiarla para el caso nuevo.
            </div>
            <div class="mt-2">
              <div v-for="i in interruptoresCorr" :key="i.clave" class="interruptor">
                <span class="text-body-2 font-weight-medium">{{ i.etiqueta }}</span>
                <v-btn-toggle
                  :model-value="i.cobra ? 'cobra' : 'no'"
                  mandatory
                  divided
                  density="compact"
                  variant="outlined"
                  rounded="lg"
                  :color="i.cobra ? 'success' : 'error'"
                  @update:model-value="(v: string) => i.cambiar(v === 'cobra')"
                >
                  <v-btn value="cobra" prepend-icon="mdi-check" size="small">Cobra</v-btn>
                  <v-btn value="no" prepend-icon="mdi-close" size="small">No cobra</v-btn>
                </v-btn-toggle>
              </div>
            </div>
            <div
              v-if="textoReglaDescuentoConvenio(casoCorr)"
              class="text-caption text-medium-emphasis mt-1"
            >
              {{ textoReglaDescuentoConvenio(casoCorr) }}
            </div>
          </template>

          <!-- Vista previa: POST /convenio/simular (mismo motor, sin guardar) -->
          <div v-if="bodyCorr" class="mt-4" data-test="vista-previa-correccion">
            <div class="text-subtitle-2 font-weight-bold mb-1">Qué cambia</div>
            <v-progress-linear v-if="simulando" indeterminate color="primary" class="mb-2" />
            <v-alert v-if="errorVista" type="error" variant="tonal" density="compact">
              {{ errorVista }}
            </v-alert>
            <template v-else-if="vista">
              <div class="text-caption mb-1">
                {{ etiquetaCaso(vista.caso_anterior) }} → <strong>{{ etiquetaCaso(vista.caso_nuevo) }}</strong>
              </div>
              <v-table v-if="vista.montos_antes && vista.montos_despues" density="compact">
                <thead>
                  <tr>
                    <th></th>
                    <th class="text-right">Antes</th>
                    <th class="text-right">Después</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Asesor</td>
                    <td class="text-right">{{ formatCOP(vista.montos_antes.monto_asesor) }}</td>
                    <td class="text-right">{{ formatCOP(vista.montos_despues.monto_asesor) }}</td>
                  </tr>
                  <tr>
                    <td>Convenio</td>
                    <td class="text-right">{{ formatCOP(vista.montos_antes.monto_convenio) }}</td>
                    <td class="text-right">{{ formatCOP(vista.montos_despues.monto_convenio) }}</td>
                  </tr>
                </tbody>
              </v-table>
              <div v-if="vista.montos_despues" class="text-caption text-medium-emphasis mt-1">
                {{ vista.montos_despues.regla_aplicada }}
              </div>
              <v-alert
                v-if="vista.comision_id === null"
                type="info"
                variant="tonal"
                density="compact"
                class="mt-2"
              >
                Todavía no hay comisión: se calculará con este convenio cuando se confirme la
                factura.
              </v-alert>
              <v-alert
                v-if="vista.convenio_en_cero_por_descuento"
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-2"
                data-test="aviso-convenio-cero-descuento"
              >
                La factura tiene un descuento: por la regla del motor la comisión del convenio
                queda en $0.
              </v-alert>
            </template>
          </div>

          <v-textarea
            v-model="corrMotivo"
            label="Motivo de la corrección"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            class="mt-4"
            hide-details="auto"
          />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="corrigiendo = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="guardandoCorreccion"
            :disabled="!bodyCorr || !corrMotivo.trim() || simulando || !!errorVista"
            data-test="btn-guardar-correccion"
            @click="guardarCorreccion"
          >
            Guardar corrección
          </v-btn>
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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore'
import {
  getTicket,
  agregarComentario,
  aprobarTicketExcepcionDateo,
  rechazarTicketExcepcionDateo,
  corregirConvenioTicket,
  simularCorreccionConvenio,
  type CorreccionConvenioResponse,
  type CorregirConvenioBody,
  type CasoComision,
  type EventoTicket,
  type Ticket,
  type TicketDetalleExcepcionDateo,
  type TicketEstado,
  type TipoEventoTicket,
  type UsuarioLight,
} from '@/services/ticketsService'
import { formatDateTime } from '@/services/dateosService'
import { formatCOP } from '@/services/comisionesService'
import { etiquetaConvenio, getConvenio, listConveniosLight } from '@/services/conveniosService'
import { HttpError } from '@/services/http'
import { usePermissions } from '@/composables/usePermissions'
import { useTicketsPendientes } from '@/composables/useTicketsPendientes'
import { resolucionComision, textoResolucion } from './resolucionTicket'
import { turnoVisible } from './turnoVisible'
import { vieneDeLaBandeja } from './filtrosTickets'
import {
  idsConvenioPorNombrar,
  textoConvenioCorregido,
  textoEventoConvenioCorregido,
} from './convenioTicket'
import {
  casoConConvenioCorregido,
  COLOR_NIVEL,
  decisionAprobacion,
  mensajeErrorResolucion,
} from './decisionComision'
import {
  avisoConvenioEnObservacion,
  camposConvenioAprobar,
  casoTrasCorreccion,
  cobraGuardado,
  convenioElegido,
  etiquetaOpcionConvenio,
  puedeCorregirConvenio,
  sinConvenioDecidido,
  textoReglaDescuentoConvenio,
} from './decisionConvenio'
import { useBuscadorConvenios } from './useBuscadorConvenios'

const props = defineProps<{ id: string | number }>()
const router = useRouter()

/**
 * Vuelve a la bandeja tal como estaba (la URL guarda filtros, pestaña y
 * página): si se llegó desde /tickets, atrás en el historial; si el ticket se
 * abrió directo (enlace, otra pantalla), a la bandeja sin filtros.
 */
function volverABandeja() {
  const anterior = (window.history.state as { back?: string | null } | null)?.back
  if (vieneDeLaBandeja(anterior)) router.back()
  else router.push({ name: 'TicketsList', query: { vista: 'bandeja' } })
}
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
}
const ESTADO_COLOR: Record<TicketEstado, string> = {
  PENDIENTE: 'warning',
  APROBADO: 'success',
  RECHAZADO: 'error',
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

// Número visible del turno (el del día) con su servicio; el id interno va aparte.
const turno = computed(() => {
  const t = detalle.value?.turno
  return turnoVisible({
    turnoId: detalle.value?.turnoId ?? null,
    turnoNumero: t?.turnoNumero ?? null,
    servicioCodigo: t?.servicio?.codigoServicio ?? null,
    fecha: t?.fecha ? String(t.fecha).slice(0, 10) : null,
  })
})

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

const corregidoDespuesDeAprobar = computed(
  () =>
    ticket.value?.eventos?.some(
      (e) => e.tipo === 'CONVENIO_CORREGIDO' && e.datos?.momento === 'POST_APROBACION',
    ) ?? false,
)

const textoDecision = computed(() => {
  const d = detalle.value
  if (!d) return ''
  return textoResolucion(resolucionComision(d), ticket.value?.caso_comision ?? null)
})

/* ═══════════ Convenio al aprobar: visible, editable y obligatorio de decidir ═══════════ */
// Solo resolutores (SUPER_ADMIN/GERENCIA): ven también los no asignados.
const comercialDelTicketId = computed(() =>
  ticket.value?.estado === 'PENDIENTE' && esResolutor.value
    ? (detalle.value?.comercialId ?? null)
    : null,
)
const {
  seleccionado: convenioSel,
  busqueda: busquedaConvenio,
  items: opcionesConvenio,
  cargando: cargandoConvenios,
} = useBuscadorConvenios(comercialDelTicketId, ref(true))
const sinConvenioMarcado = ref(false)
watch(sinConvenioMarcado, (v) => {
  if (v) convenioSel.value = null
})
watch(convenioSel, (v) => {
  if (v) sinConvenioMarcado.value = false
})

/** Al cargar: el convenio actual elegido; sin convenio decidido al crear, marcado. */
function iniciarConvenioAprobar() {
  const d = detalle.value
  convenioSel.value = d?.convenio
    ? {
        id: d.convenio.id,
        nombre: d.convenio.nombre,
        establecimiento: d.convenio.establecimiento ?? null,
        asignado: ticket.value?.convenio_asignado !== false,
      }
    : null
  sinConvenioMarcado.value = !d?.convenio && sinConvenioDecidido(d?.sinConvenioExplicito)
}

const elegido = computed(() => convenioElegido(convenioSel.value?.id, sinConvenioMarcado.value))
const convenioActual = computed(() => detalle.value?.convenioId ?? null)
// null = falta decidir (no se puede aprobar).
const camposConvenio = computed(() =>
  camposConvenioAprobar({
    caso: ticket.value?.caso_comision ?? null,
    convenioActual: convenioActual.value,
    elegido: elegido.value,
    sinConvenioExplicito: detalle.value?.sinConvenioExplicito,
  }),
)
const avisoObservacion = computed(() =>
  avisoConvenioEnObservacion(Boolean(ticket.value?.observacion_menciona_convenio), elegido.value),
)
const etiquetaConvenioElegido = computed(() =>
  convenioSel.value ? etiquetaOpcionConvenio(convenioSel.value) : 'sin convenio (directo)',
)

// El caso cambia si gerencia cambia el convenio (casoConConvenioCorregido).
const casoEfectivo = computed<CasoComision | null>(() =>
  casoConConvenioCorregido(
    ticket.value?.caso_comision ?? null,
    elegido.value !== undefined && elegido.value !== convenioActual.value ? elegido.value : undefined,
  ),
)

/* ═══════════ Decisión de comisión: interruptores Cobra / No cobra ═══════════ */
const cobraAsesor = ref(true)
const cobraConvenio = ref(true)
// Si cambia el caso (p. ej. al corregir el convenio), se vuelve a "Cobra".
watch(casoEfectivo, () => {
  cobraAsesor.value = true
  cobraConvenio.value = true
})
const decision = computed(() =>
  decisionAprobacion(casoEfectivo.value, cobraAsesor.value, cobraConvenio.value),
)
const interruptores = computed(() => {
  const caso = casoEfectivo.value
  const lista = [
    {
      clave: 'asesor',
      etiqueta: caso === 'CONVENIO_SELF' ? 'Comisión del asesor convenio' : 'Comisión del asesor',
      cobra: cobraAsesor.value,
      cambiar: (v: boolean) => (cobraAsesor.value = v),
    },
  ]
  if (caso === 'CONVENIO_COMERCIAL') {
    lista.push({
      clave: 'convenio',
      etiqueta: 'Comisión del convenio',
      cobra: cobraConvenio.value,
      cambiar: (v: boolean) => (cobraConvenio.value = v),
    })
  }
  return lista
})

/* ═══════════ Corrección del convenio después de aprobar ═══════════ */
const correccionPermitida = computed(() => puedeCorregirConvenio(ticket.value?.comision_ticket))
const corrigiendo = ref(false)
const guardandoCorreccion = ref(false)
const asesorCorreccionId = computed(() =>
  corrigiendo.value ? (detalle.value?.comercialId ?? null) : null,
)
const {
  seleccionado: corrSel,
  busqueda: corrBusqueda,
  items: corrOpciones,
  cargando: corrCargando,
} = useBuscadorConvenios(asesorCorreccionId, ref(true))
const corrSinConvenio = ref(false)
watch(corrSinConvenio, (v) => {
  if (v) corrSel.value = null
})
watch(corrSel, (v) => {
  if (v) corrSinConvenio.value = false
})
const corrCobraAsesor = ref(true)
const corrCobraConvenio = ref(true)
const corrMotivo = ref('')
const corrElegido = computed(() => convenioElegido(corrSel.value?.id, corrSinConvenio.value))
const corrCambia = computed(
  () => corrElegido.value !== undefined && corrElegido.value !== (detalle.value?.convenioId ?? null),
)
const casoCorr = computed(() => (corrCambia.value ? casoTrasCorreccion(corrElegido.value) : null))
const interruptoresCorr = computed(() => {
  const lista = [
    {
      clave: 'asesor',
      etiqueta: 'Comisión del asesor',
      cobra: corrCobraAsesor.value,
      cambiar: (v: boolean) => (corrCobraAsesor.value = v),
    },
  ]
  if (casoCorr.value === 'CONVENIO_COMERCIAL') {
    lista.push({
      clave: 'convenio',
      etiqueta: 'Comisión del convenio',
      cobra: corrCobraConvenio.value,
      cambiar: (v: boolean) => (corrCobraConvenio.value = v),
    })
  }
  return lista
})
// null = nada que corregir todavía. Flags explícitos: los interruptores.
const bodyCorr = computed<CorregirConvenioBody | null>(() => {
  if (!corrCambia.value) return null
  const flags = decisionAprobacion(
    casoCorr.value,
    corrCobraAsesor.value,
    corrCobraConvenio.value,
  ).body
  return { convenio_id: corrElegido.value as number | null, ...flags }
})

function abrirCorreccion() {
  corrSel.value = null
  corrSinConvenio.value = false
  corrMotivo.value = ''
  vista.value = null
  errorVista.value = null
  corrCobraAsesor.value = cobraGuardado(detalle.value?.conComisionAsesor)
  corrCobraConvenio.value = cobraGuardado(detalle.value?.conComisionConvenio)
  corrigiendo.value = true
}

function mensajeError(err: unknown, porDefecto: string): string {
  const data = err instanceof HttpError ? (err.data as { message?: string } | undefined) : undefined
  return data?.message || porDefecto
}

// Vista previa: el mismo cálculo del backend, sin guardar.
const vista = ref<CorreccionConvenioResponse | null>(null)
const errorVista = ref<string | null>(null)
const simulando = ref(false)
let pedidoVista = 0
watch(bodyCorr, async (body) => {
  vista.value = null
  errorVista.value = null
  const id = ticket.value?.id
  if (!body || !id) return
  const mio = ++pedidoVista
  simulando.value = true
  try {
    const r = await simularCorreccionConvenio(id, body)
    if (mio === pedidoVista) vista.value = r
  } catch (err) {
    if (mio === pedidoVista) errorVista.value = mensajeError(err, 'No se pudo calcular la corrección.')
  } finally {
    if (mio === pedidoVista) simulando.value = false
  }
})

async function guardarCorreccion() {
  if (!ticket.value || !bodyCorr.value || !corrMotivo.value.trim()) return
  guardandoCorreccion.value = true
  try {
    await corregirConvenioTicket(ticket.value.id, {
      ...bodyCorr.value,
      motivo: corrMotivo.value.trim(),
    })
    corrigiendo.value = false
    snackbar.value = { show: true, color: 'success', text: 'Convenio corregido.' }
    await cargar()
  } catch (err) {
    snackbar.value = {
      show: true,
      color: 'error',
      text: mensajeError(err, 'No se pudo corregir el convenio.'),
    }
    if (err instanceof HttpError && err.status === 409) {
      corrigiendo.value = false
      await cargar()
    }
  } finally {
    guardandoCorreccion.value = false
  }
}

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
    return textoEventoConvenioCorregido(d.convenio_anterior_id, d.convenio_nuevo_id, nombresConvenio.value, {
      momento: d.momento,
      motivo: d.motivo,
    })
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

/* ═══════════ Nombres de los convenios del ticket (original y corrección) ═══════════ */
const nombresConvenio = ref<Map<number, string>>(new Map())
async function cargarNombresConvenio() {
  const d = detalle.value
  const nombres = new Map<number, string>()
  if (d?.convenio) nombres.set(d.convenio.id, etiquetaConvenio(d.convenio))
  const faltan = idsConvenioPorNombrar(
    d?.convenioIdOriginal ?? null,
    ticket.value?.eventos ?? [],
  ).filter((id) => !nombres.has(id))
  if (faltan.length) {
    // GET /convenios/:id trae también los inactivos (gerencia/contabilidad); si no
    // hay permiso, la lista de activos; si tampoco está, queda "convenio #id".
    let activos: Awaited<ReturnType<typeof listConveniosLight>> | null = null
    for (const id of faltan) {
      try {
        nombres.set(id, etiquetaConvenio(await getConvenio(id)))
      } catch {
        activos ??= await listConveniosLight().catch(() => [])
        const c = activos.find((x) => x.id === id)
        if (c) nombres.set(id, etiquetaConvenio(c))
      }
    }
  }
  nombresConvenio.value = nombres
}

async function cargar() {
  loading.value = true
  errorCarga.value = null
  try {
    const data = await getTicket(Number(props.id))
    ticket.value = data
    detalle.value = data.detalle ?? null
    iniciarConvenioAprobar()
    cargarNombresConvenio()
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

async function aprobar() {
  if (!ticket.value) return
  aprobando.value = true
  try {
    if (camposConvenio.value === null) return
    const body = { ...decision.value.body, ...camposConvenio.value }
    await aprobarTicketExcepcionDateo(ticket.value.id, body)
    confirmando.value = false
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
.decision {
  border-radius: 12px;
}
.interruptor {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 6px 0;
}
.interruptor + .interruptor {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
/* Móvil: el interruptor bajo su etiqueta y a lo ancho; botones a lo ancho, Aprobar arriba. */
@media (max-width: 599px) {
  .interruptor .v-btn-toggle {
    width: 100%;
  }
  .interruptor .v-btn-toggle .v-btn {
    flex: 1 1 0;
  }
  .acciones {
    flex-direction: column-reverse;
  }
  .acciones .v-btn {
    width: 100%;
  }
}
.titulo {
  white-space: normal;
  word-break: break-word;
}
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
