<template>
  <v-container class="mt-4 mt-sm-6">
    <!-- ==================== MULTIMEDIA ==================== -->
    <v-card elevation="8" class="pa-0 rounded-xl rounded-sm-2xl card-surface mb-6">
      <div class="card-header px-4 px-sm-6 py-3 py-sm-5">
        <div class="header-left">
          <div class="icon-pill d-none d-sm-inline-flex">
            <v-icon size="22">mdi-image-multiple-outline</v-icon>
          </div>
          <div class="title-group">
            <h2 class="title text-h6 text-sm-h5">Multimedia del Turnero</h2>
            <p class="subtitle d-none d-sm-block">
              Imágenes y videos que rotan en el panel central de la pantalla de exhibición
            </p>
          </div>
        </div>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-refresh"
          :loading="cargandoMultimedia"
          @click="cargarMultimedia"
        >
          Actualizar
        </v-btn>
      </div>

      <v-divider class="mx-4 mx-sm-6 divider-muted" />

      <div class="pa-4 pa-sm-6">
        <!-- Formulario de subida -->
        <v-row class="mb-2" align="center">
          <v-col cols="12" md="6">
            <v-file-input
              v-model="archivoSeleccionado"
              label="Subir imagen o video"
              variant="outlined"
              density="compact"
              accept="image/*,video/*"
              prepend-icon="mdi-upload"
              show-size
              hide-details
            />
          </v-col>
          <v-col v-if="tipoDetectado === 'imagen'" cols="12" md="3">
            <v-text-field
              v-model.number="duracionSegundosForm"
              type="number"
              min="1"
              label="Duración (segundos)"
              variant="outlined"
              density="compact"
              hide-details
            />
          </v-col>
          <v-col v-else-if="tipoDetectado === 'video'" cols="12" md="3">
            <p class="text-caption text-medium-emphasis mt-2">
              Usa su duración natural — se reproduce completo, no se corta.
            </p>
          </v-col>
          <v-col cols="12" md="3">
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-cloud-upload-outline"
              :disabled="!archivoSeleccionado"
              :loading="subiendo"
              @click="subirMultimedia"
            >
              Subir
            </v-btn>
          </v-col>
        </v-row>

        <v-data-table
          :headers="headersMultimedia"
          :items="multimedia"
          :loading="cargandoMultimedia"
          item-value="id"
          no-data-text="No hay multimedia registrada."
        >
          <template #item.vista="{ item }">
            <img
              v-if="item.tipo === 'imagen'"
              :src="toPublicUrl(item.url) ?? ''"
              class="vista-previa"
              alt=""
            />
            <div v-else class="vista-previa vista-previa--video">
              <v-icon>mdi-play-circle-outline</v-icon>
            </div>
          </template>

          <template #item.tipo="{ item }">
            <v-chip size="small" :color="item.tipo === 'video' ? 'indigo' : 'teal'" variant="tonal">
              {{ item.tipo === 'video' ? 'Video' : 'Imagen' }}
            </v-chip>
          </template>

          <template #item.duracionSegundos="{ item }">
            {{ item.tipo === 'imagen' ? `${item.duracionSegundos ?? '—'} s` : 'Duración natural' }}
          </template>

          <template #item.activo="{ item }">
            <v-chip :color="item.activo ? 'success' : 'error'" size="small" variant="tonal">
              {{ item.activo ? 'Activo' : 'Inactivo' }}
            </v-chip>
          </template>

          <template #item.acciones="{ item, index }">
            <v-tooltip text="Mover arriba" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-arrow-up"
                  size="small"
                  variant="text"
                  :disabled="index === 0"
                  @click="moverMultimedia(item, index, -1)"
                />
              </template>
            </v-tooltip>
            <v-tooltip text="Mover abajo" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-arrow-down"
                  size="small"
                  variant="text"
                  :disabled="index === multimedia.length - 1"
                  @click="moverMultimedia(item, index, 1)"
                />
              </template>
            </v-tooltip>
            <v-tooltip :text="item.activo ? 'Desactivar' : 'Activar'" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  :icon="item.activo ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off'"
                  size="small"
                  variant="text"
                  :color="item.activo ? 'success' : 'error'"
                  @click="toggleActivoMultimedia(item)"
                />
              </template>
            </v-tooltip>
            <v-tooltip text="Eliminar" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete-outline"
                  size="small"
                  variant="text"
                  color="error"
                  @click="pedirEliminarMultimedia(item)"
                />
              </template>
            </v-tooltip>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <!-- ==================== TICKER ==================== -->
    <v-card elevation="8" class="pa-0 rounded-xl rounded-sm-2xl card-surface">
      <div class="card-header px-4 px-sm-6 py-3 py-sm-5">
        <div class="header-left">
          <div class="icon-pill d-none d-sm-inline-flex">
            <v-icon size="22">mdi-message-text-outline</v-icon>
          </div>
          <div class="title-group">
            <h2 class="title text-h6 text-sm-h5">Mensajes de la cinta</h2>
            <p class="subtitle d-none d-sm-block">
              Franja de texto que se desplaza en la columna "Llamando ahora"
            </p>
          </div>
        </div>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-refresh"
          :loading="cargandoTicker"
          @click="cargarTicker"
        >
          Actualizar
        </v-btn>
      </div>

      <v-divider class="mx-4 mx-sm-6 divider-muted" />

      <div class="pa-4 pa-sm-6">
        <v-row class="mb-2" align="center">
          <v-col cols="12" md="9">
            <v-text-field
              v-model="textoNuevoMensaje"
              label="Nuevo mensaje"
              variant="outlined"
              density="compact"
              hide-details
              @keyup.enter="agregarMensaje"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-plus"
              :disabled="!textoNuevoMensaje.trim()"
              :loading="agregandoMensaje"
              @click="agregarMensaje"
            >
              Agregar
            </v-btn>
          </v-col>
        </v-row>

        <v-data-table
          :headers="headersTicker"
          :items="mensajesTicker"
          :loading="cargandoTicker"
          item-value="id"
          no-data-text="No hay mensajes registrados."
        >
          <template #item.activo="{ item }">
            <v-chip :color="item.activo ? 'success' : 'error'" size="small" variant="tonal">
              {{ item.activo ? 'Activo' : 'Inactivo' }}
            </v-chip>
          </template>

          <template #item.acciones="{ item, index }">
            <v-tooltip text="Mover arriba" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-arrow-up"
                  size="small"
                  variant="text"
                  :disabled="index === 0"
                  @click="moverMensaje(item, index, -1)"
                />
              </template>
            </v-tooltip>
            <v-tooltip text="Mover abajo" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-arrow-down"
                  size="small"
                  variant="text"
                  :disabled="index === mensajesTicker.length - 1"
                  @click="moverMensaje(item, index, 1)"
                />
              </template>
            </v-tooltip>
            <v-tooltip :text="item.activo ? 'Desactivar' : 'Activar'" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  :icon="item.activo ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off'"
                  size="small"
                  variant="text"
                  :color="item.activo ? 'success' : 'error'"
                  @click="toggleActivoMensaje(item)"
                />
              </template>
            </v-tooltip>
            <v-tooltip text="Eliminar" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete-outline"
                  size="small"
                  variant="text"
                  color="error"
                  @click="pedirEliminarMensaje(item)"
                />
              </template>
            </v-tooltip>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <ConfirmarDialogo
      v-model="showConfirmEliminar"
      title="Confirmar eliminación"
      :message="mensajeConfirmacion"
      confirm-text="Eliminar"
      confirm-color="error"
      @confirm="confirmarEliminar"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout" location="top right">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ConfirmarDialogo from '@/components/UI/ConfirmarDialogo.vue'
import { uploadImage } from '@/services/uploadsService'
import turneroMultimediaService, {
  type TurneroMultimediaItem,
} from '@/services/turneroMultimediaService'
import turneroTickerService, {
  type TurneroMensajeTicker,
} from '@/services/turneroTickerService'

/** Convierte una ruta relativa del backend a URL absoluta pública, igual que
 * el helper equivalente en contratoService.ts. */
function toPublicUrl(maybePathOrUrl?: string | null): string | null {
  if (!maybePathOrUrl) return null
  if (/^https?:\/\//i.test(maybePathOrUrl)) return maybePathOrUrl
  const base =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}${maybePathOrUrl.startsWith('/') ? '' : '/'}${maybePathOrUrl}`
}

const snackbar = ref({ show: false, message: '', color: '', timeout: 4000 })
function showSnackbar(message: string, color = 'info', timeout = 4000) {
  snackbar.value = { show: true, message, color, timeout }
}

/* ==================== MULTIMEDIA ==================== */

const headersMultimedia = [
  { title: 'Vista previa', key: 'vista', sortable: false },
  { title: 'Tipo', key: 'tipo' },
  { title: 'Duración', key: 'duracionSegundos', sortable: false },
  { title: 'Orden', key: 'orden' },
  { title: 'Estado', key: 'activo' },
  { title: '', key: 'acciones', sortable: false },
]

const multimedia = ref<TurneroMultimediaItem[]>([])
const cargandoMultimedia = ref(false)

async function cargarMultimedia() {
  cargandoMultimedia.value = true
  try {
    const resp = await turneroMultimediaService.getAll()
    multimedia.value = ((resp?.data as TurneroMultimediaItem[]) ?? []).slice().sort((a, b) => a.orden - b.orden)
  } catch (err) {
    console.error('Error al cargar multimedia del turnero:', err)
    showSnackbar('No se pudo cargar la multimedia del turnero.', 'error')
  } finally {
    cargandoMultimedia.value = false
  }
}

const archivoSeleccionado = ref<File | File[] | null>(null)
const duracionSegundosForm = ref<number>(8)
const subiendo = ref(false)

const archivoActual = computed<File | null>(() => {
  const v = archivoSeleccionado.value
  return Array.isArray(v) ? (v[0] ?? null) : v
})

const tipoDetectado = computed<'imagen' | 'video' | null>(() => {
  const f = archivoActual.value
  if (!f) return null
  return f.type.startsWith('video/') ? 'video' : 'imagen'
})

async function subirMultimedia() {
  const file = archivoActual.value
  if (!file) return

  subiendo.value = true
  try {
    const tipo = tipoDetectado.value ?? 'imagen'
    const data = await uploadImage(file)
    if (!data.url) throw new Error('El servidor no devolvió una URL')

    await turneroMultimediaService.create({
      tipo,
      url: data.url,
      duracionSegundos: tipo === 'imagen' ? (duracionSegundosForm.value || 8) : undefined,
    })

    archivoSeleccionado.value = null
    duracionSegundosForm.value = 8
    await cargarMultimedia()
    showSnackbar('Multimedia subida correctamente.', 'success')
  } catch (err) {
    console.error('Error al subir multimedia:', err)
    const message = err instanceof Error ? err.message : 'Error al subir el archivo.'
    showSnackbar(message, 'error')
  } finally {
    subiendo.value = false
  }
}

async function moverMultimedia(item: TurneroMultimediaItem, index: number, direccion: -1 | 1) {
  const vecino = multimedia.value[index + direccion]
  if (!vecino) return
  try {
    await Promise.all([
      turneroMultimediaService.update(item.id, { orden: vecino.orden }),
      turneroMultimediaService.update(vecino.id, { orden: item.orden }),
    ])
    await cargarMultimedia()
  } catch (err) {
    console.error('Error al reordenar multimedia:', err)
    showSnackbar('No se pudo reordenar.', 'error')
  }
}

async function toggleActivoMultimedia(item: TurneroMultimediaItem) {
  try {
    await turneroMultimediaService.update(item.id, { activo: !item.activo })
    await cargarMultimedia()
  } catch (err) {
    console.error('Error al cambiar estado de multimedia:', err)
    showSnackbar('No se pudo cambiar el estado.', 'error')
  }
}

/* ==================== TICKER ==================== */

const headersTicker = [
  { title: 'Mensaje', key: 'texto' },
  { title: 'Orden', key: 'orden' },
  { title: 'Estado', key: 'activo' },
  { title: '', key: 'acciones', sortable: false },
]

const mensajesTicker = ref<TurneroMensajeTicker[]>([])
const cargandoTicker = ref(false)

async function cargarTicker() {
  cargandoTicker.value = true
  try {
    const resp = await turneroTickerService.getAll()
    mensajesTicker.value = ((resp?.data as TurneroMensajeTicker[]) ?? [])
      .slice()
      .sort((a, b) => a.orden - b.orden)
  } catch (err) {
    console.error('Error al cargar mensajes del ticker:', err)
    showSnackbar('No se pudieron cargar los mensajes de la cinta.', 'error')
  } finally {
    cargandoTicker.value = false
  }
}

const textoNuevoMensaje = ref('')
const agregandoMensaje = ref(false)

async function agregarMensaje() {
  const texto = textoNuevoMensaje.value.trim()
  if (!texto) return
  agregandoMensaje.value = true
  try {
    await turneroTickerService.create(texto)
    textoNuevoMensaje.value = ''
    await cargarTicker()
    showSnackbar('Mensaje agregado.', 'success')
  } catch (err) {
    console.error('Error al agregar mensaje del ticker:', err)
    showSnackbar('No se pudo agregar el mensaje.', 'error')
  } finally {
    agregandoMensaje.value = false
  }
}

async function moverMensaje(item: TurneroMensajeTicker, index: number, direccion: -1 | 1) {
  const vecino = mensajesTicker.value[index + direccion]
  if (!vecino) return
  try {
    await Promise.all([
      turneroTickerService.update(item.id, { orden: vecino.orden }),
      turneroTickerService.update(vecino.id, { orden: item.orden }),
    ])
    await cargarTicker()
  } catch (err) {
    console.error('Error al reordenar mensajes del ticker:', err)
    showSnackbar('No se pudo reordenar.', 'error')
  }
}

async function toggleActivoMensaje(item: TurneroMensajeTicker) {
  try {
    await turneroTickerService.update(item.id, { activo: !item.activo })
    await cargarTicker()
  } catch (err) {
    console.error('Error al cambiar estado del mensaje:', err)
    showSnackbar('No se pudo cambiar el estado.', 'error')
  }
}

/* ==================== ELIMINAR (compartido) ==================== */

const showConfirmEliminar = ref(false)
const mensajeConfirmacion = ref('')
const itemAEliminar = ref<{ tipo: 'multimedia' | 'ticker'; id: number } | null>(null)

function pedirEliminarMultimedia(item: TurneroMultimediaItem) {
  itemAEliminar.value = { tipo: 'multimedia', id: item.id }
  mensajeConfirmacion.value = `¿Eliminar este ${item.tipo === 'video' ? 'video' : 'imagen'} de la rotación?`
  showConfirmEliminar.value = true
}

function pedirEliminarMensaje(item: TurneroMensajeTicker) {
  itemAEliminar.value = { tipo: 'ticker', id: item.id }
  mensajeConfirmacion.value = `¿Eliminar el mensaje "${item.texto}"?`
  showConfirmEliminar.value = true
}

async function confirmarEliminar() {
  const objetivo = itemAEliminar.value
  if (!objetivo) return
  try {
    if (objetivo.tipo === 'multimedia') {
      await turneroMultimediaService.delete(objetivo.id)
      await cargarMultimedia()
    } else {
      await turneroTickerService.delete(objetivo.id)
      await cargarTicker()
    }
    showSnackbar('Eliminado correctamente.', 'success')
  } catch (err) {
    console.error('Error al eliminar:', err)
    showSnackbar('No se pudo eliminar.', 'error')
  } finally {
    itemAEliminar.value = null
  }
}

cargarMultimedia()
cargarTicker()
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
  flex-wrap: wrap;
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
.vista-previa {
  width: 64px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
  background: #eef1f5;
}
.vista-previa--video {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}
</style>
