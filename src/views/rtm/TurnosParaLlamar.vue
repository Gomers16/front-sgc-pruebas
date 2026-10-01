<template>
  <v-container class="mt-4 mt-sm-6">
    <v-card elevation="8" class="pa-0 rounded-xl rounded-sm-2xl card-surface">
      <div class="card-header px-4 px-sm-6 py-3 py-sm-5">
        <div class="header-left">
          <div class="icon-pill d-none d-sm-inline-flex">
            <v-icon size="22">mdi-bullhorn-outline</v-icon>
          </div>
          <div class="title-group">
            <h2 class="title text-h6 text-sm-h5">Turnos para Llamar</h2>
            <p class="subtitle d-none d-sm-block">
              Turnos certificados hoy, todavía sin llamar a un módulo (o que no se presentaron)
            </p>
          </div>
        </div>
        <v-btn variant="outlined" prepend-icon="mdi-refresh" :loading="cargando" @click="cargarTurnos">
          Actualizar
        </v-btn>
      </div>

      <v-divider class="mx-4 mx-sm-6 divider-muted" />

      <div class="pa-4 pa-sm-6">
        <v-data-table
          :headers="headers"
          :items="turnos"
          :loading="cargando"
          item-value="id"
          no-data-text="No hay turnos certificados pendientes de llamar."
        >
          <!-- "No se presentó": ya se le llamó una vez y volvió a esta lista
               para llamarlo de nuevo (eligiendo módulo otra vez).
               "Pregunta enviada": se le hizo "Preguntar" pero todavía no
               tuvo un LLAMAR real — sigue acá hasta entonces. -->
          <template #item.placa="{ item }">
            {{ item.placa }}
            <v-chip v-if="item.noPresentadoPrevio" color="warning" size="small" variant="tonal" class="ml-2">
              No se presentó
            </v-chip>
            <v-chip v-if="item.preguntaEnviada" color="info" size="small" variant="tonal" class="ml-2">
              Pregunta enviada
            </v-chip>
          </template>

          <template #item.servicio="{ item }">
            {{ item.servicio?.codigoServicio ?? '—' }}
          </template>

          <template #item.horaSalida="{ item }">
            {{ item.horaSalida ?? '—' }}
          </template>

          <template #item.modulo="{ item }">
            <v-select
              v-model="modulosPorTurno[item.id]"
              :items="MODULOS_TURNERO_LISTA"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="Módulo"
              style="max-width: 220px"
            />
          </template>

          <template #item.acciones="{ item }">
            <v-btn
              color="primary"
              size="small"
              class="mr-2"
              :disabled="!modulosPorTurno[item.id]?.trim()"
              :loading="llamando === item.id"
              @click="abrirConfirmacion(item)"
            >
              Llamar
            </v-btn>
            <!-- Usa el mismo módulo seleccionado que "Llamar", pero el turno
                 NO sale de esta tabla (ver preguntarDesdeArriba()). -->
            <v-btn
              color="primary"
              variant="outlined"
              size="small"
              :disabled="!modulosPorTurno[item.id]?.trim()"
              :loading="preguntando === item.id"
              @click="preguntarDesdeArriba(item)"
            >
              Preguntar
            </v-btn>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <!-- ==================== En módulo, pendientes de entrega ==================== -->
    <v-card elevation="8" class="pa-0 rounded-xl rounded-sm-2xl card-surface mt-6">
      <div class="card-header px-4 px-sm-6 py-3 py-sm-5">
        <div class="header-left">
          <div class="icon-pill d-none d-sm-inline-flex">
            <v-icon size="22">mdi-account-clock-outline</v-icon>
          </div>
          <div class="title-group">
            <h2 class="title text-h6 text-sm-h5">En módulo, pendientes de entrega</h2>
            <p class="subtitle d-none d-sm-block">
              Turnos ya llamados a un módulo que todavía no han sido entregados
            </p>
          </div>
        </div>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-refresh"
          :loading="cargandoEntrega"
          @click="cargarPendientesEntrega"
        >
          Actualizar
        </v-btn>
      </div>

      <v-divider class="mx-4 mx-sm-6 divider-muted" />

      <div class="pa-4 pa-sm-6">
        <v-data-table
          :headers="headersEntrega"
          :items="turnosEntrega"
          :loading="cargandoEntrega"
          item-value="turnoId"
          no-data-text="No hay turnos en módulo pendientes de entrega."
        >
          <template #item.servicio="{ item }">
            {{ item.servicio?.codigoServicio ?? '—' }}
          </template>

          <template #item.acciones="{ item }">
            <v-btn
              color="success"
              size="small"
              class="mr-2"
              :loading="entregando === item.turnoId"
              @click="entregar(item)"
            >
              Entregar
            </v-btn>
            <v-btn
              color="primary"
              variant="outlined"
              size="small"
              class="mr-2"
              :loading="volviendoALlamar === item.turnoId"
              @click="volverALlamar(item)"
            >
              Volver a llamar
            </v-btn>
            <v-btn
              color="primary"
              variant="outlined"
              size="small"
              class="mr-2"
              :loading="llamandoPregunta === item.turnoId"
              @click="llamarParaPregunta(item)"
            >
              Preguntar
            </v-btn>
            <v-btn
              color="warning"
              variant="outlined"
              size="small"
              :loading="marcandoNoPresentado === item.turnoId"
              @click="abrirConfirmacionNoPresentado(item)"
            >
              No se presentó
            </v-btn>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <ConfirmarDialogo
      v-model="showConfirm"
      title="Confirmar llamado"
      :message="mensajeConfirmacion"
      confirm-text="Llamar"
      confirm-color="primary"
      @confirm="confirmarLlamado"
    />

    <!-- "No se presentó" ya no se puede revertir con el mismo botón: saca el
         turno de esta tabla y de "Llamando ahora" — por eso se confirma. -->
    <ConfirmarDialogo
      v-model="showConfirmNoPresentado"
      title="Confirmar no presentado"
      :message="mensajeConfirmacionNoPresentado"
      confirm-text="No se presentó"
      confirm-color="warning"
      @confirm="confirmarNoPresentado"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authSetStore } from '@/stores/AuthStore'
import TurnosDelDiaService, { type TurnoPendienteEntrega } from '@/services/turnosdeldiaService'
import ConfirmarDialogo from '@/components/UI/ConfirmarDialogo.vue'
import { MODULOS_TURNERO, MODULO_TURNERO_DEFECTO } from '@/views/turnero/config/constantes'

// modulosPorTurno es Record<number, string> (no el tipo literal ModuloTurnero)
// porque viene de/hacia el backend como texto plano — este array widened evita
// que v-select le imponga a v-model el tipo unión literal de MODULOS_TURNERO.
const MODULOS_TURNERO_LISTA: string[] = [...MODULOS_TURNERO]

interface ServicioLite {
  id: number
  codigoServicio: string
  nombreServicio: string
}

interface TurnoPendiente {
  id: number
  placa: string
  horaSalida: string | null
  servicio?: ServicioLite | null
  // Ya se le llamó una vez y no se presentó (volvió a esta lista)
  noPresentadoPrevio?: boolean
  // Se le hizo "Preguntar" sin llamarlo todavía (sigue en esta lista)
  preguntaEnviada?: boolean
}

const authStore = authSetStore()

const headers = [
  { title: 'Placa', key: 'placa' },
  { title: 'Servicio', key: 'servicio' },
  { title: 'Hora certificación', key: 'horaSalida' },
  { title: 'Módulo', key: 'modulo', sortable: false },
  { title: '', key: 'acciones', sortable: false },
]

const turnos = ref<TurnoPendiente[]>([])
const modulosPorTurno = ref<Record<number, string>>({})
const cargando = ref(false)
const llamando = ref<number | null>(null)
const preguntando = ref<number | null>(null)

const showConfirm = ref(false)
const turnoSeleccionado = ref<TurnoPendiente | null>(null)
const mensajeConfirmacion = ref('')

const snackbar = ref({ show: false, message: '', color: '', timeout: 4000 })
function showSnackbar(message: string, color = 'info', timeout = 4000) {
  snackbar.value = { show: true, message, color, timeout }
}

function usuarioId(): number {
  const user = authStore.user as { id?: number } | null
  return typeof user?.id === 'number' ? user.id : 0
}

async function cargarTurnos() {
  cargando.value = true
  try {
    const resp = await TurnosDelDiaService.fetchTurnosPendientesLlamar(usuarioId())
    turnos.value = (resp?.turnos ?? []) as unknown as TurnoPendiente[]

    // Precarga cada select con el último módulo preferido del usuario —
    // sigue siendo editable, no es de solo lectura. Si el valor guardado no
    // coincide con ninguna de las 6 opciones fijas (datos de prueba viejos
    // con texto libre tipo "Caja 2"), cae al primero de la lista en vez de
    // dejar el select con un valor inválido.
    const preferidoCrudo = resp?.ultimoModuloPreferido ?? ''
    const preferido = MODULOS_TURNERO.includes(preferidoCrudo as (typeof MODULOS_TURNERO)[number])
      ? preferidoCrudo
      : MODULO_TURNERO_DEFECTO
    const siguiente: Record<number, string> = {}
    for (const t of turnos.value) {
      siguiente[t.id] = modulosPorTurno.value[t.id] ?? preferido
    }
    modulosPorTurno.value = siguiente
  } catch (err) {
    console.error('Error al cargar turnos pendientes de llamar:', err)
    showSnackbar('No se pudieron cargar los turnos pendientes de llamar.', 'error')
  } finally {
    cargando.value = false
  }
}

function abrirConfirmacion(turno: TurnoPendiente) {
  const modulo = modulosPorTurno.value[turno.id]?.trim()
  if (!modulo) return
  turnoSeleccionado.value = turno
  mensajeConfirmacion.value = `¿Llamar la placa ${turno.placa} al módulo "${modulo}"?`
  showConfirm.value = true
}

async function confirmarLlamado() {
  const turno = turnoSeleccionado.value
  if (!turno) return
  const modulo = modulosPorTurno.value[turno.id]?.trim()
  if (!modulo) return

  llamando.value = turno.id
  try {
    await TurnosDelDiaService.llamarTurno(turno.id, modulo, usuarioId())
    showSnackbar(`✅ Turno ${turno.placa} llamado a ${modulo}.`, 'success')
    turnos.value = turnos.value.filter((t) => t.id !== turno.id)
    // El turno recién llamado ya debería aparecer en "pendientes de entrega".
    cargarPendientesEntrega()
  } catch (err) {
    console.error('Error al llamar turno:', err)
    const message = err instanceof Error ? err.message : 'Error al llamar el turno.'
    showSnackbar(`❌ ${message}`, 'error')
  } finally {
    llamando.value = null
    turnoSeleccionado.value = null
  }
}

// "Preguntar" desde esta tabla: la pantalla anuncia "…por favor acérquese
// al {módulo seleccionado}", pero el turno sigue acá (con el chip "Pregunta
// enviada") y en la cola hasta que alguien presione "Llamar". Sin
// confirmación, igual que "Volver a llamar": no mueve el turno de lugar.
async function preguntarDesdeArriba(turno: TurnoPendiente) {
  const modulo = modulosPorTurno.value[turno.id]?.trim()
  if (!modulo) return

  preguntando.value = turno.id
  try {
    await TurnosDelDiaService.preguntarTurno(turno.id, modulo, usuarioId())
    showSnackbar(`✅ Pregunta enviada a ${turno.placa} (${modulo}).`, 'success')
    cargarTurnos()
  } catch (err) {
    console.error('Error al preguntar:', err)
    const message = err instanceof Error ? err.message : 'Error al enviar la pregunta.'
    showSnackbar(`❌ ${message}`, 'error')
  } finally {
    preguntando.value = null
  }
}

/* ==================== En módulo, pendientes de entrega ==================== */

const headersEntrega = [
  { title: 'Placa', key: 'placa' },
  { title: 'Servicio', key: 'servicio' },
  { title: 'Módulo', key: 'modulo' },
  { title: '', key: 'acciones', sortable: false },
]

const turnosEntrega = ref<TurnoPendienteEntrega[]>([])
const cargandoEntrega = ref(false)
const entregando = ref<number | null>(null)
const marcandoNoPresentado = ref<number | null>(null)
const volviendoALlamar = ref<number | null>(null)
const llamandoPregunta = ref<number | null>(null)

const showConfirmNoPresentado = ref(false)
const turnoNoPresentado = ref<TurnoPendienteEntrega | null>(null)
const mensajeConfirmacionNoPresentado = ref('')

async function cargarPendientesEntrega() {
  cargandoEntrega.value = true
  try {
    const resp = await TurnosDelDiaService.fetchPendientesEntrega()
    turnosEntrega.value = resp?.turnos ?? []
  } catch (err) {
    console.error('Error al cargar pendientes de entrega:', err)
    showSnackbar('No se pudieron cargar los turnos pendientes de entrega.', 'error')
  } finally {
    cargandoEntrega.value = false
  }
}

async function entregar(turno: TurnoPendienteEntrega) {
  entregando.value = turno.turnoId
  try {
    await TurnosDelDiaService.entregarTurno(turno.turnoId)
    showSnackbar(`✅ Turno ${turno.placa} entregado.`, 'success')
    turnosEntrega.value = turnosEntrega.value.filter((t) => t.turnoId !== turno.turnoId)
  } catch (err) {
    console.error('Error al marcar entregado:', err)
    const message = err instanceof Error ? err.message : 'Error al marcar el turno como entregado.'
    showSnackbar(`❌ ${message}`, 'error')
  } finally {
    entregando.value = null
  }
}

async function volverALlamar(turno: TurnoPendienteEntrega) {
  volviendoALlamar.value = turno.turnoId
  try {
    await TurnosDelDiaService.volverALlamarTurno(turno.turnoId)
    showSnackbar(`✅ Turno ${turno.placa} llamado de nuevo.`, 'success')
    // llamado_at cambió — se recarga la lista completa en vez de mutar a
    // mano, así el orden (llamado_at asc) queda consistente con la base real.
    cargarPendientesEntrega()
  } catch (err) {
    console.error('Error al volver a llamar:', err)
    const message = err instanceof Error ? err.message : 'Error al volver a llamar el turno.'
    showSnackbar(`❌ ${message}`, 'error')
  } finally {
    volviendoALlamar.value = null
  }
}

// "Preguntar" desde esta tabla (turno ya llamado): mismo mecanismo que
// "Volver a llamar" (la pantalla lo anuncia con modal + pitido + voz), con
// "…por favor acérquese al {módulo}" y el módulo que ya tenía.
async function llamarParaPregunta(turno: TurnoPendienteEntrega) {
  llamandoPregunta.value = turno.turnoId
  try {
    await TurnosDelDiaService.llamarParaPregunta(turno.turnoId)
    showSnackbar(`✅ Pregunta enviada a ${turno.placa} (${turno.modulo}).`, 'success')
    cargarPendientesEntrega()
  } catch (err) {
    console.error('Error al llamar para pregunta:', err)
    const message = err instanceof Error ? err.message : 'Error al llamar el turno para pregunta.'
    showSnackbar(`❌ ${message}`, 'error')
  } finally {
    llamandoPregunta.value = null
  }
}

function abrirConfirmacionNoPresentado(turno: TurnoPendienteEntrega) {
  turnoNoPresentado.value = turno
  mensajeConfirmacionNoPresentado.value =
    `¿Marcar la placa ${turno.placa} como no presentada? Sale de "Llamando ahora" ` +
    'y vuelve a "Turnos para Llamar" para llamarla de nuevo.'
  showConfirmNoPresentado.value = true
}

// Una sola vía (ya no es toggle): el turno sale de esta tabla y de
// "Llamando ahora", y vuelve a "Turnos para Llamar" (con el chip "No se
// presentó") — por eso se recargan las dos listas.
async function confirmarNoPresentado() {
  const turno = turnoNoPresentado.value
  if (!turno) return

  marcandoNoPresentado.value = turno.turnoId
  try {
    await TurnosDelDiaService.marcarNoPresentado(turno.turnoId)
    showSnackbar(`Turno ${turno.placa} marcado como no presentado. Volvió a "Turnos para Llamar".`, 'warning')
    turnosEntrega.value = turnosEntrega.value.filter((t) => t.turnoId !== turno.turnoId)
    cargarTurnos()
  } catch (err) {
    console.error('Error al marcar no presentado:', err)
    const message = err instanceof Error ? err.message : 'Error al marcar el turno como no presentado.'
    showSnackbar(`❌ ${message}`, 'error')
  } finally {
    marcandoNoPresentado.value = null
    turnoNoPresentado.value = null
  }
}

onMounted(() => {
  cargarTurnos()
  cargarPendientesEntrega()
})
</script>

<style scoped>
.card-surface {
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%);
  border: 1px solid rgba(16, 24, 40, 0.06);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.icon-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
  border-radius: 10px;
  border: 1px solid rgba(16, 24, 40, 0.08);
  background: #fff;
}
.title-group .title {
  margin: 0;
  font-weight: 700;
}
.title-group .subtitle {
  margin: 2px 0 0 0;
  font-size: 0.925rem;
  color: #475569;
}
.divider-muted {
  border-color: rgba(16, 24, 40, 0.08) !important;
}
</style>
