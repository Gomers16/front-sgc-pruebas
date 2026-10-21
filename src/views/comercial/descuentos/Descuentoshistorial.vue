<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">

      <!-- ── Título + Filtros ── -->
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">🏷️ Historial de Descuentos</div>
        <div class="d-flex gap-2 flex-wrap align-center">

          <!-- Rango fechas -->
          <v-text-field
            v-model="filters.fechaDesde"
            label="Desde"
            type="date"
            density="comfortable"
            variant="outlined"
            hide-details
            style="min-width: 160px"
          />
          <v-text-field
            v-model="filters.fechaHasta"
            label="Hasta"
            type="date"
            density="comfortable"
            variant="outlined"
            hide-details
            style="min-width: 160px"
          />

          <!-- Tipo de descuento -->
          <v-autocomplete
            v-model="filters.descuentoId"
            :items="descuentosItems"
            item-title="nombre"
            item-value="id"
            label="Tipo de descuento"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            :loading="catalogLoading"
            style="min-width: 200px"
          />

          <!-- Origen -->
          <v-select
            v-model="filters.origen"
            :items="origenItems"
            item-title="label"
            item-value="value"
            label="Origen"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            style="min-width: 180px"
          />

          <!-- Asesor comercial -->
          <v-autocomplete
            v-model="filters.asesorId"
            :items="asesoresItems"
            item-title="nombre"
            item-value="id"
            label="Asesor comercial"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            :loading="catalogLoading"
            style="min-width: 200px"
          />

          <!-- Autorizador -->
          <v-text-field
            v-model="filters.autorizador"
            label="Autorizador"
            density="comfortable"
            variant="outlined"
            hide-details
            clearable
            style="min-width: 180px"
            @keyup.enter="reload"
          />

          <v-btn color="primary" :loading="loading" @click="reload" prepend-icon="mdi-magnify">
            Buscar
          </v-btn>
          <v-btn variant="text" :disabled="loading" @click="resetFilters" prepend-icon="mdi-filter-remove">
            Limpiar
          </v-btn>
        </div>
      </v-card-title>

      <v-divider />

      <!-- ── Chips resumen ── -->
      <v-card-text class="pt-4 pb-2">
        <div class="d-flex flex-wrap gap-3 align-center">
          <v-chip variant="tonal" size="large">
            Total registros: <strong class="ms-1">{{ totalItems }}</strong>
          </v-chip>
          <v-chip variant="tonal" size="large" color="blue">
            Pre-marcados dateo:
            <strong class="ms-1">{{ conteoOrigen('dateo') }}</strong>
          </v-chip>
          <v-chip variant="tonal" size="large" color="purple">
            Aplicados en caja:
            <strong class="ms-1">{{ conteoOrigen('caja') }}</strong>
          </v-chip>
        </div>
      </v-card-text>

      <!-- ── Tabla ── -->
      <v-data-table-server
        class="px-4 pb-4"
        :headers="headers"
        :items="rows"
        :items-length="totalItems"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :loading="loading"
        @update:options="onTableOptions"
        item-value="ticket_id"
        no-data-text="No hay descuentos aplicados en el rango seleccionado"
      >

        <!-- Fecha -->
        <template #item.confirmado_at="{ item }">
          <span class="text-body-2">{{ formatDateTime(item.confirmado_at) }}</span>
        </template>

        <!-- Placa / Turno -->
        <template #item.placa="{ item }">
          <div class="d-flex flex-column">
            <span class="font-weight-medium">{{ item.placa || '—' }}</span>
            <span class="text-caption text-medium-emphasis">
              {{ item.servicio_codigo || '' }}
              <span v-if="item.turno_global">#G{{ item.turno_global }}</span>
              <span v-if="item.tipo_vehiculo"> · {{ item.tipo_vehiculo }}</span>
            </span>
          </div>
        </template>

        <!-- Descuento -->
        <template #item.descuento="{ item }">
          <v-chip
            v-if="item.descuento"
            size="small"
            color="orange-darken-2"
            variant="tonal"
            prepend-icon="mdi-tag-check"
          >
            {{ item.descuento.nombre }}
          </v-chip>
          <span v-else class="text-caption text-medium-emphasis">—</span>
          <div v-if="item.descuento" class="text-caption text-medium-emphasis mt-1">
            Código: {{ item.descuento.codigo }}
          </div>
          <!-- 🆕 Consecutivo del descuento (lo digita caja; "—" en tickets anteriores) -->
          <div v-if="item.descuento" class="text-caption text-medium-emphasis">
            Consecutivo: {{ item.consecutivo_descuento ?? '—' }}
          </div>
        </template>

        <!-- Origen -->
        <template #item.origen="{ item }">
          <v-chip
            size="small"
            :color="item.origen === 'dateo' ? 'blue' : 'purple'"
            variant="flat"
          >
            <v-icon start size="14">
              {{ item.origen === 'dateo' ? 'mdi-calendar-check' : 'mdi-cash-register' }}
            </v-icon>
            {{ item.origen === 'dateo' ? 'Pre-marcado dateo' : 'Aplicado en caja' }}
          </v-chip>
        </template>

        <!-- Comercial del dateo -->
        <template #item.comercial="{ item }">
          <div v-if="item.comercial" class="d-flex flex-column">
            <span class="text-body-2 font-weight-medium">{{ item.comercial.nombre }}</span>
            <span class="text-caption text-medium-emphasis">{{ item.comercial.tipo || 'Comercial' }}</span>
          </div>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <!-- Cajero -->
        <template #item.cajero="{ item }">
          <span v-if="item.cajero" class="text-body-2">{{ item.cajero.nombre }}</span>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <!-- Autorizado por -->
        <template #item.autorizado_por="{ item }">
          <div v-if="item.autorizado_por">
            <v-chip size="x-small" color="deep-purple" variant="tonal" prepend-icon="mdi-shield-check">
              {{ item.autorizado_por.nombre }}
            </v-chip>
          </div>
          <span v-else class="text-caption text-medium-emphasis">
            {{ item.origen === 'dateo' ? 'N/A (pre-marcado)' : '—' }}
          </span>
        </template>

        <!-- Monto -->
        <template #item.descuento_monto_aplicado="{ item }">
          <span v-if="item.descuento_monto_aplicado != null" class="font-weight-medium text-orange-darken-2">
            {{ formatCOP(item.descuento_monto_aplicado) }}
          </span>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <!-- Acciones -->
        <template #item.acciones="{ item }">
          <v-btn
            size="small"
            variant="text"
            icon="mdi-eye"
            @click="verDetalle(item)"
          />
        </template>

      </v-data-table-server>
    </v-card>

    <!-- ── Modal detalle ── -->
    <v-dialog v-model="detailDialog.visible" max-width="720" scrollable>
      <v-card v-if="detailDialog.item">
        <v-card-title class="text-h6 d-flex align-center justify-space-between">
          <span>Detalle descuento — Ticket #{{ detailDialog.item.ticket_id }}</span>
          <v-chip
            size="small"
            :color="detailDialog.item.origen === 'dateo' ? 'blue' : 'purple'"
            variant="flat"
          >
            {{ detailDialog.item.origen === 'dateo' ? 'Pre-marcado dateo' : 'Aplicado en caja' }}
          </v-chip>
        </v-card-title>
        <v-divider />

        <v-card-text class="pt-4">
          <v-row dense>

            <!-- Fecha -->
            <v-col cols="12" md="6">
              <div class="text-body-2">
                <strong>Fecha confirmación:</strong><br />
                {{ formatDateTime(detailDialog.item.confirmado_at) }}
              </div>
            </v-col>

            <!-- Placa / Vehículo -->
            <v-col cols="12" md="6">
              <div class="text-body-2">
                <strong>Placa:</strong><br />
                <span class="font-weight-medium text-h6">{{ detailDialog.item.placa || '—' }}</span>
                <span v-if="detailDialog.item.tipo_vehiculo" class="text-caption ms-1 text-medium-emphasis">
                  ({{ detailDialog.item.tipo_vehiculo }})
                </span>
              </div>
            </v-col>

            <!-- Turno -->
            <v-col cols="12" md="6">
              <div class="text-body-2">
                <strong>Turno:</strong><br />
                <span v-if="detailDialog.item.turno_global">#Global {{ detailDialog.item.turno_global }}</span>
                <span v-if="detailDialog.item.turno_servicio"> · #Serv {{ detailDialog.item.turno_servicio }}</span>
                <span v-if="!detailDialog.item.turno_global && !detailDialog.item.turno_servicio">—</span>
              </div>
            </v-col>

            <!-- Servicio -->
            <v-col cols="12" md="6">
              <div class="text-body-2">
                <strong>Servicio:</strong><br />
                {{ detailDialog.item.servicio_nombre || detailDialog.item.servicio_codigo || '—' }}
              </div>
            </v-col>

            <v-col cols="12"><v-divider class="my-2" /></v-col>

            <!-- Descuento -->
            <v-col cols="12">
              <v-card variant="tonal" color="orange-darken-2" class="mb-3">
                <v-card-text>
                  <div class="d-flex align-center gap-2 mb-2">
                    <v-icon color="orange-darken-2">mdi-tag-check</v-icon>
                    <span class="font-weight-bold text-body-1">{{ detailDialog.item.descuento?.nombre }}</span>
                    <span class="text-caption text-medium-emphasis">({{ detailDialog.item.descuento?.codigo }})</span>
                  </div>
                  <div v-if="detailDialog.item.descuento_monto_aplicado != null" class="text-body-2">
                    <strong>Monto descontado:</strong>
                    {{ formatCOP(detailDialog.item.descuento_monto_aplicado) }}
                  </div>
                  <div class="text-body-2">
                    <strong>Consecutivo del descuento:</strong>
                    {{ detailDialog.item.consecutivo_descuento ?? '—' }}
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    🏷️ Efecto en la comisión: {{ TEXTO_EFECTO_DESCUENTO }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Comercial -->
            <v-col cols="12" md="6">
              <div class="text-body-2">
                <strong>Comercial (dateo):</strong><br />
                <span v-if="detailDialog.item.comercial">
                  {{ detailDialog.item.comercial.nombre }}
                  <span class="text-caption text-medium-emphasis ms-1">
                    ({{ detailDialog.item.comercial.tipo || 'Comercial' }})
                  </span>
                </span>
                <span v-else class="text-medium-emphasis">—</span>
              </div>
            </v-col>

            <!-- Cajero -->
            <v-col cols="12" md="6">
              <div class="text-body-2">
                <strong>Confirmado por (cajero):</strong><br />
                {{ detailDialog.item.cajero?.nombre || '—' }}
              </div>
            </v-col>

            <!-- Autorizador -->
            <v-col cols="12" v-if="detailDialog.item.origen === 'caja'">
              <div class="text-body-2">
                <strong>Autorizado por:</strong><br />
                <v-chip
                  v-if="detailDialog.item.autorizado_por"
                  color="deep-purple"
                  variant="tonal"
                  prepend-icon="mdi-shield-check"
                  size="small"
                >
                  {{ detailDialog.item.autorizado_por.nombre }}
                </v-chip>
                <span v-else class="text-medium-emphasis">Sin registro de autorizador</span>
              </div>
            </v-col>

            <v-col cols="12" v-else>
              <div class="text-caption text-medium-emphasis">
                ℹ️ Pre-marcado por el comercial al crear el dateo. No requiere autorizador en caja.
              </div>
            </v-col>

            <!-- ── Documentos INFORMATIVO_POLICIA ── -->
            <template v-if="detailDialog.item.descuento?.codigo === 'INFORMATIVO_POLICIA'">
              <v-col cols="12">
                <v-divider class="my-3" />
                <div class="text-body-2 font-weight-bold mb-3 d-flex align-center" style="gap:6px">
                  <v-icon size="18" color="blue-darken-3">mdi-shield-account</v-icon>
                  Documentos presentados (Policía / Militar)
                </div>

                <v-row dense>
                  <v-col
                    v-for="tipo in (['carnet', 'tarjeta_propiedad', 'cedula'] as const)"
                    :key="tipo"
                    cols="12" md="4"
                  >
                    <div class="text-caption font-weight-medium mb-1 text-medium-emphasis">
                      {{ DOC_POLICIA_LABELS[tipo] }}
                    </div>

                    <!-- Cargando -->
                    <div
                      v-if="docPoliciaState[tipo] === 'loading'"
                      class="d-flex align-center justify-center bg-grey-lighten-4 rounded pa-4"
                      style="min-height:120px"
                    >
                      <v-progress-circular indeterminate color="blue-darken-3" size="28" />
                    </div>

                    <!-- Imagen cargada -->
                    <v-img
                      v-else-if="docPoliciaState[tipo] === 'loaded' && docPoliciaBlobs[tipo]"
                      :src="docPoliciaBlobs[tipo]"
                      max-height="200"
                      contain
                      class="rounded border bg-grey-lighten-5"
                    >
                      <template #placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                          <v-progress-circular indeterminate color="grey-lighten-3" />
                        </div>
                      </template>
                    </v-img>

                    <!-- No disponible / error -->
                    <div
                      v-else-if="docPoliciaState[tipo] === 'error'"
                      class="d-flex align-center justify-center bg-grey-lighten-4 rounded pa-4 text-center"
                      style="min-height:120px"
                    >
                      <div>
                        <v-icon color="grey" size="32">mdi-image-off</v-icon>
                        <div class="text-caption text-medium-emphasis mt-1">No disponible</div>
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </v-col>
            </template>
            <!-- ── Fin documentos INFORMATIVO_POLICIA ── -->

            <!-- Comprobante de avance -->
            <v-col
              cols="12"
              v-if="detailDialog.item.es_avance && detailDialog.item.comprobante_avance_url"
            >
              <v-divider class="my-3" />
              <div class="text-body-2 font-weight-bold mb-2 d-flex align-center gap-1">
                <v-icon size="18" color="green">mdi-whatsapp</v-icon>
                Comprobante del avance
              </div>

              <!-- Cargando -->
              <div
                v-if="comprobanteState === 'loading'"
                class="d-flex align-center justify-center bg-grey-lighten-4 rounded pa-6"
              >
                <v-progress-circular indeterminate color="orange" size="32" />
                <span class="ms-3 text-caption text-medium-emphasis">Cargando comprobante...</span>
              </div>

              <!-- Imagen cargada como blob -->
              <v-img
                v-else-if="comprobanteState === 'loaded' && comprobanteBlobUrl"
                :src="comprobanteBlobUrl"
                max-height="340"
                contain
                class="rounded border bg-grey-lighten-4"
              />

              <!-- Error -->
              <v-alert
                v-else-if="comprobanteState === 'error'"
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-1"
              >
                No se pudo cargar la imagen del comprobante.
              </v-alert>

              <div class="text-caption text-medium-emphasis mt-2">
                Evidencia WhatsApp subida por el comercial al crear el dateo.
              </div>
            </v-col>

          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog.visible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onUnmounted, onMounted } from 'vue'
import { get, download } from '@/services/http'
import { formatCOP, listAgentesCaptacion } from '@/services/comisionesService'
import { TEXTO_EFECTO_DESCUENTO } from '@/services/desgloseComision'

/* ── Tipos ── */
interface DescuentoLight {
  id: number
  codigo: string
  nombre: string
}

interface PersonaLight {
  id: number
  nombre: string
  tipo?: string | null
}

interface HistorialRow {
  ticket_id:                number
  confirmado_at:            string | null
  placa:                    string | null
  turno_id:                 number | null
  turno_global:             number | null
  turno_servicio:           number | null
  servicio_nombre:          string | null
  servicio_codigo:          string | null
  tipo_vehiculo:            string | null
  descuento:                DescuentoLight | null
  descuento_monto_aplicado: number | null
  consecutivo_descuento?:   string | null
  origen:                   'dateo' | 'caja'
  comercial:                PersonaLight | null
  dateo_id:                 number | null
  cajero:                   PersonaLight | null
  autorizado_por:           PersonaLight | null
  es_avance:                boolean
  comprobante_avance_url:   string | null
}

interface HistorialMeta {
  total:       number
  page:        number
  per_page:    number
  last_page:   number
  fecha_desde: string
  fecha_hasta: string
}

/* ── Estado ── */
const rows           = ref<HistorialRow[]>([])
const totalItems     = ref(0)
const page           = ref(1)
const itemsPerPage   = ref(50)
const loading        = ref(false)
const catalogLoading = ref(false)

/* ── Comprobante avance ── */
type ComprobanteState = 'idle' | 'loading' | 'loaded' | 'error'
const comprobanteState   = ref<ComprobanteState>('idle')
const comprobanteBlobUrl = ref<string | null>(null)

async function cargarComprobante(url: string) {
  if (comprobanteBlobUrl.value) {
    URL.revokeObjectURL(comprobanteBlobUrl.value)
    comprobanteBlobUrl.value = null
  }
  comprobanteState.value = 'loading'
  try {
    const blob = await download(url)
    comprobanteBlobUrl.value = URL.createObjectURL(blob)
    comprobanteState.value = 'loaded'
  } catch (err) {
    console.error('Error cargando comprobante avance:', err)
    comprobanteState.value = 'error'
  }
}

/* ── Documentos INFORMATIVO_POLICIA ── */
type DocPoliciaKey = 'carnet' | 'tarjeta_propiedad' | 'cedula'
type DocBlobState  = 'idle' | 'loading' | 'loaded' | 'error'

const DOC_POLICIA_LABELS: Record<DocPoliciaKey, string> = {
  carnet:            'Carnet policial / militar',
  tarjeta_propiedad: 'Tarjeta de propiedad',
  cedula:            'Cédula del propietario',
}

const docPoliciaBlobs = reactive<Record<DocPoliciaKey, string | null>>({
  carnet:            null,
  tarjeta_propiedad: null,
  cedula:            null,
})
const docPoliciaState = reactive<Record<DocPoliciaKey, DocBlobState>>({
  carnet:            'idle',
  tarjeta_propiedad: 'idle',
  cedula:            'idle',
})

function limpiarDocsPolicia() {
  const keys: DocPoliciaKey[] = ['carnet', 'tarjeta_propiedad', 'cedula']
  for (const k of keys) {
    if (docPoliciaBlobs[k]) {
      URL.revokeObjectURL(docPoliciaBlobs[k]!)
      docPoliciaBlobs[k] = null
    }
    docPoliciaState[k] = 'idle'
  }
}

async function cargarDocPolicia(ticketId: number, tipo: DocPoliciaKey) {
  docPoliciaState[tipo] = 'loading'
  try {
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token')      ||
      sessionStorage.getItem('auth_token') ||
      sessionStorage.getItem('token')
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const resp = await fetch(
      `/api/facturacion/tickets/${ticketId}/documentos-policia/${tipo}`,
      { headers, credentials: 'include' }
    )
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const blob = await resp.blob()
    if (docPoliciaBlobs[tipo]) URL.revokeObjectURL(docPoliciaBlobs[tipo]!)
    docPoliciaBlobs[tipo] = URL.createObjectURL(blob)
    docPoliciaState[tipo] = 'loaded'
  } catch {
    docPoliciaState[tipo] = 'error'
  }
}

/* ── Catálogos ── */
const descuentosItems = ref<{ id: number; nombre: string; codigo: string }[]>([])
const asesoresItems   = ref<{ id: number; nombre: string }[]>([])

/* ── Helper fecha local ── */
function hoy() {
  const d = new Date()
  const year  = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day   = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/* ── Filtros ── */
const filters = ref({
  fechaDesde:  hoy(),
  fechaHasta:  hoy(),
  descuentoId: null as number | null,
  origen:      null as 'dateo' | 'caja' | null,
  asesorId:    null as number | null,
  autorizador: '',
})

const origenItems = [
  { label: '🗓️ Pre-marcado en dateo', value: 'dateo' },
  { label: '🏧 Aplicado en caja',     value: 'caja'  },
]

/* ── Headers tabla ── */
const headers = [
  { title: 'Fecha',          key: 'confirmado_at',            sortable: false },
  { title: 'Placa / Turno',  key: 'placa',                    sortable: false },
  { title: 'Descuento',      key: 'descuento',                sortable: false },
  { title: 'Origen',         key: 'origen',                   sortable: false },
  { title: 'Comercial',      key: 'comercial',                sortable: false },
  { title: 'Cajero',         key: 'cajero',                   sortable: false },
  { title: 'Autorizado por', key: 'autorizado_por',           sortable: false },
  { title: 'Monto desc.',    key: 'descuento_monto_aplicado', sortable: false },
  { title: '',               key: 'acciones',                 sortable: false, align: 'end' as const },
]

/* ── Helpers ── */
function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(d)
}

function conteoOrigen(origen: 'dateo' | 'caja') {
  return rows.value.filter(r => r.origen === origen).length
}

/* ── Carga catálogos ── */
async function loadCatalogos() {
  catalogLoading.value = true
  try {
    const [descs, asesores] = await Promise.all([
      get<{ success: boolean; data: { id: number; codigo: string; nombre: string }[] }>(
        '/api/descuentos/activos'
      ),
      listAgentesCaptacion(),
    ])
    descuentosItems.value = Array.isArray(descs.data) ? descs.data : []
    asesoresItems.value   = asesores
  } catch (err) {
    console.error('Error cargando catálogos:', err)
  } finally {
    catalogLoading.value = false
  }
}

/* ── Carga datos ── */
async function loadHistorial() {
  loading.value = true
  try {
    const params: Record<string, string> = {
      fecha_desde: filters.value.fechaDesde || hoy(),
      fecha_hasta: filters.value.fechaHasta || hoy(),
      page:        String(page.value),
      per_page:    String(itemsPerPage.value),
    }
    if (filters.value.descuentoId) params.descuento_id = String(filters.value.descuentoId)
    if (filters.value.origen)      params.origen       = filters.value.origen
    if (filters.value.asesorId)    params.asesor_id    = String(filters.value.asesorId)

    const qs  = new URLSearchParams(params).toString()
    const res = await get<{ success: boolean; meta: HistorialMeta; data: HistorialRow[] }>(
      `/api/descuentos/historial?${qs}`
    )

    let data = res.data ?? []

    // Filtro local de autorizador (el backend no filtra texto libre)
    if (filters.value.autorizador.trim()) {
      const q = filters.value.autorizador.trim().toLowerCase()
      data = data.filter(r =>
        r.autorizado_por?.nombre?.toLowerCase().includes(q)
      )
    }

    rows.value       = data
    totalItems.value = res.meta?.total ?? data.length
  } catch (err) {
    console.error('Error cargando historial:', err)
    rows.value       = []
    totalItems.value = 0
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  loadHistorial()
}

function resetFilters() {
  filters.value = {
    fechaDesde:  hoy(),
    fechaHasta:  hoy(),
    descuentoId: null,
    origen:      null,
    asesorId:    null,
    autorizador: '',
  }
  reload()
}

function onTableOptions(opts: { page: number; itemsPerPage: number }) {
  page.value         = opts.page
  itemsPerPage.value = opts.itemsPerPage
  loadHistorial()
}

/* ── Modal detalle ── */
const detailDialog = ref<{ visible: boolean; item: HistorialRow | null }>({
  visible: false,
  item:    null,
})

function verDetalle(item: HistorialRow) {
  // Limpiar estado anterior
  comprobanteState.value = 'idle'
  if (comprobanteBlobUrl.value) {
    URL.revokeObjectURL(comprobanteBlobUrl.value)
    comprobanteBlobUrl.value = null
  }
  limpiarDocsPolicia()

  detailDialog.value = { visible: true, item }

  if (item.es_avance && item.comprobante_avance_url) {
    cargarComprobante(item.comprobante_avance_url)
  }

  // Cargar las 3 fotos si el descuento es INFORMATIVO_POLICIA
  if (item.descuento?.codigo === 'INFORMATIVO_POLICIA') {
    const keys: DocPoliciaKey[] = ['carnet', 'tarjeta_propiedad', 'cedula']
    for (const tipo of keys) {
      cargarDocPolicia(item.ticket_id, tipo)
    }
  }
}

// Limpiar blobs al cerrar modal
watch(() => detailDialog.value.visible, (visible) => {
  if (!visible) {
    if (comprobanteBlobUrl.value) {
      URL.revokeObjectURL(comprobanteBlobUrl.value)
      comprobanteBlobUrl.value = null
      comprobanteState.value = 'idle'
    }
    limpiarDocsPolicia()
  }
})

// Limpiar al desmontar
onUnmounted(() => {
  if (comprobanteBlobUrl.value) URL.revokeObjectURL(comprobanteBlobUrl.value)
  limpiarDocsPolicia()
})

/* ── Init ── */
onMounted(() => {
  loadCatalogos()
  loadHistorial()
})
</script>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
