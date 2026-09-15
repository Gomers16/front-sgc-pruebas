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
              Turnos certificados hoy, todavía sin llamar a un módulo
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
          <template #item.servicio="{ item }">
            {{ item.servicio?.codigoServicio ?? '—' }}
          </template>

          <template #item.horaSalida="{ item }">
            {{ item.horaSalida ?? '—' }}
          </template>

          <template #item.modulo="{ item }">
            <v-text-field
              v-model="modulosPorTurno[item.id]"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="Módulo"
              style="max-width: 200px"
            />
          </template>

          <template #item.acciones="{ item }">
            <v-btn
              color="primary"
              size="small"
              :disabled="!modulosPorTurno[item.id]?.trim()"
              :loading="llamando === item.id"
              @click="abrirConfirmacion(item)"
            >
              Llamar
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

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authSetStore } from '@/stores/AuthStore'
import TurnosDelDiaService from '@/services/turnosdeldiaService'

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
    // sigue siendo editable, no es de solo lectura.
    const preferido = resp?.ultimoModuloPreferido ?? ''
    const siguiente: Record<number, string> = {}
    for (const t of turnos.value) {
      siguiente[t.id] = modulosPorTurno.value[t.id] ?? preferido ?? ''
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
  } catch (err) {
    console.error('Error al llamar turno:', err)
    const message = err instanceof Error ? err.message : 'Error al llamar el turno.'
    showSnackbar(`❌ ${message}`, 'error')
  } finally {
    llamando.value = null
    turnoSeleccionado.value = null
  }
}

onMounted(cargarTurnos)
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
