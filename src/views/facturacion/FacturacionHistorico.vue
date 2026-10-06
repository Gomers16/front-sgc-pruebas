<!-- src/views/facturacion/FacturacionHistorico.vue -->
<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-history</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Facturación / Historial</div>
            <div class="text-medium-emphasis">Listado de tickets y detalle</div>
          </div>
        </div>

        <div class="d-flex align-center flex-wrap" style="gap:10px">
          <v-btn prepend-icon="mdi-reload" :loading="loading" @click="refresh">Actualizar</v-btn>
        </div>
      </v-card-title>
    </v-card>

    <!-- TABLA -->
    <v-card elevation="8" class="rounded-xl">
      <v-data-table-server
        :headers="headers"
        :items="rows"
        :items-length="total"
        :loading="loading"
        :items-per-page="pagination.itemsPerPage"
        :page="pagination.page"
        item-key="id"
        hover
        @update:options="onUpdateOptions"
      >
        <template #item.estado="{ item }">
          <v-chip :color="estadoColor(item.estado)" size="small" variant="tonal" class="font-weight-bold">
            {{ item.estado }}
          </v-chip>
        </template>

        <template #item.fecha_pago="{ item }">
          <span v-if="firstFecha(item)">{{ asDate(firstFecha(item)) }}</span>
          <span v-else>—</span>
        </template>

        <template #item.total="{ item }">
          <div>
            <div class="font-weight-bold">{{ fmtCOP(pickTotal(item)) }}</div>
            <div v-if="(item.descuento_monto_aplicado ?? 0) > 0" class="text-caption text-orange-darken-2">
  <v-icon size="12">mdi-tag</v-icon>
  Desc: -{{ fmtCOP(item.descuento_monto_aplicado ?? 0) }}
</div>
          </div>
        </template>

        <template #item.servicioNombre="{ item }">
          {{ getServicioNombre(item) }}
        </template>

        <template #item.sedeNombre="{ item }">
          {{ getSedeNombre(item) }}
        </template>

        <template #item.vendedor_text="{ item }">
          {{ item?.vendedor_text ?? '—' }}
        </template>

        <template #item.acciones="{ item }">
          <v-btn size="small" variant="tonal" prepend-icon="mdi-eye" @click.stop="openDetailById(item.id)">
            Ver
          </v-btn>
        </template>

        <template #body.append>
          <tr>
            <td :colspan="headers.length">
              <div class="d-flex align-center justify-space-between flex-wrap py-3">
                <div class="text-medium-emphasis">
                  Mostrando {{ rows.length }} de {{ total }} registros
                </div>
                <div class="d-flex align-center" style="gap:10px">
                  <v-select
                    v-model="pagination.itemsPerPage"
                    :items="[10,20,50,100]"
                    density="compact"
                    style="max-width:120px"
                    label="Por página"
                    @update:model-value="refresh"
                  />
                  <v-pagination
                    v-model="pagination.page"
                    :length="pages"
                    :total-visible="7"
                    @update:model-value="refresh"
                  />
                </div>
              </div>
            </td>
          </tr>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- DIALOG DETALLE CON IMAGEN -->
    <v-dialog v-model="dialog.open" max-width="1200">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-shield-check</v-icon>
            Detalle del ticket
            <span v-if="dialog.item?.id" class="ml-2 text-medium-emphasis">#{{ dialog.item.id }}</span>
          </div>
          <div class="d-flex align-center" style="gap:8px">
            <v-chip
              v-if="dialog.item?.estado"
              :color="estadoColor(dialog.item.estado)"
              size="small"
              variant="tonal"
            >
              {{ dialog.item.estado }}
            </v-chip>
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-row>
            <!-- COLUMNA IZQUIERDA: IMAGEN DEL TICKET -->
            <v-col cols="12" md="5">
              <div class="section-title mb-3">
                <v-icon class="mr-2">mdi-image</v-icon>
                Evidencia (Ticket)
              </div>

              <div v-if="imageBlobUrl || dialog.item?.filePath || dialog.item?.file_path" class="image-preview-wrapper">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center" style="gap:6px">
                    <v-btn size="x-small" variant="text" icon="mdi-magnify-minus" @click="zoomOut" />
                    <v-btn size="x-small" variant="text" icon="mdi-magnify-plus" @click="zoomIn" />
                    <v-btn size="x-small" variant="text" @click="resetZoom">
                      {{ Math.round(imageScale * 100) }}%
                    </v-btn>
                  </div>
                  <v-btn
                    v-if="imageBlobUrl"
                    size="x-small"
                    variant="text"
                    prepend-icon="mdi-download"
                    tag="a"
                    :href="imageBlobUrl"
                    download="ticket.jpg"
                  >
                    Descargar
                  </v-btn>
                </div>

                <div class="preview-canvas">
                  <img
                    v-if="imageBlobUrl"
                    :src="imageBlobUrl"
                    :style="imgStyle"
                    alt="Ticket"
                    @error="onImageError"
                  />
                  <div v-else-if="!imageError" class="text-center py-4">
                    <v-progress-circular indeterminate color="primary" />
                    <div class="text-caption mt-2">Cargando imagen...</div>
                  </div>
                </div>

                <div v-if="imageError" class="text-center mt-2 text-error">
                  <v-icon>mdi-alert-circle</v-icon>
                  No se pudo cargar la imagen
                </div>
              </div>

              <v-alert v-else type="info" variant="tonal" class="text-center">
                <v-icon size="48" class="mb-2">mdi-image-off</v-icon>
                <div>No hay imagen disponible para este ticket</div>
              </v-alert>
            </v-col>

            <!-- COLUMNA DERECHA: DATOS -->
            <v-col cols="12" md="7">
              <v-row>
                <!-- Datos del Ticket -->
                <v-col cols="12" md="6">
                  <div class="section-title">Ticket</div>

                  <div class="label">Placa</div>
                  <div class="value mb-2">{{ dialog.item?.placa || '—' }}</div>

                  <div class="label">Fecha y hora de pago</div>
                  <div class="value mb-2">
                    <span v-if="fechaPagoIso">
                      {{ asDate(fechaPagoIso) }} • {{ asTime(fechaPagoIso) }}
                    </span>
                    <span v-else>—</span>
                  </div>

                  <!-- TOTALES CON DESGLOSE DE DESCUENTO -->
                  <template v-if="tieneDescuento">
                    <div class="label">Subtotal (sin descuento)</div>
                    <div class="value mb-1">{{ fmtCOP(totalSinDescuento) }}</div>

                    <div class="label text-orange-darken-2">Descuento aplicado</div>
                    <div class="value mb-1 text-orange-darken-2">
                      - {{ fmtCOP(dialog.item?.descuentoAplicado?.montoAplicado ?? dialog.item?.descuento_monto_aplicado ?? 0) }}
                    </div>

                    <div class="label">Total con descuento</div>
                    <div class="value mb-2 text-success font-weight-bold" style="font-size:1.1rem">
                      {{ fmtCOP(pickTotal(dialog.item)) }}
                    </div>
                  </template>
                  <template v-else>
                    <div class="label">Total</div>
                    <div class="value mb-2">{{ fmtCOP(pickTotal(dialog.item)) }}</div>
                  </template>

                  <div class="label">Vendedor</div>
                  <div class="value mb-2">{{ dialog.item?.vendedorText || dialog.item?.vendedor_text || '—' }}</div>

                  <div class="label">Prefijo / Consecutivo</div>
                  <div class="value mb-2">
                    {{ dialog.item?.prefijo || '—' }}
                    <span v-if="dialog.item?.consecutivo"> {{ dialog.item.consecutivo }}</span>
                  </div>

                  <div class="label">NIT / PIN / Marca</div>
                  <div class="value">
                    {{ dialog.item?.nit || '—' }} /
                    {{ dialog.item?.pin || '—' }} /
                    {{ dialog.item?.marca || '—' }}
                  </div>
                </v-col>

                <!-- Turno asociado -->
                <v-col cols="12" md="6">
                  <div class="section-title">Turno asociado</div>

                  <div class="label">Turno / Servicio</div>
                  <div class="value mb-2">
                    #{{ dialog.item?.turno?.turnoNumero ?? dialog.item?.turnoGlobal ?? '—' }}
                    •
                    {{ getServicioNombre(dialog.item) }}
                  </div>

                  <div class="label">Placa (turno)</div>
                  <div class="value mb-2">{{ dialog.item?.placaTurno || dialog.item?.turno?.placa || '—' }}</div>

                  <div class="label">Sede / Funcionario</div>
                  <div class="value mb-2">
                    {{ getSedeNombre(dialog.item) }} • {{ dialog.item?.funcionarioNombre || '—' }}
                  </div>

                  <div class="label">Canal</div>
                  <div class="value mb-2">
                    <v-chip
                      v-if="dialog.item?.canalAtribucion"
                      :color="canalChipColor(dialog.item?.canalAtribucion)"
                      size="small"
                      variant="tonal"
                    >
                      {{ humanCanal(dialog.item?.canalAtribucion) }}
                    </v-chip>
                    <span v-else>—</span>
                  </div>

                  <div class="label">Asesores / Convenio</div>
                  <div class="value">
                    <div class="capt-line" v-if="dialog.item?.dateo?.agente?.nombre">
                      <v-chip size="x-small" color="secondary" variant="tonal">Comercial</v-chip>
                      <span class="text-medium-emphasis">{{ dialog.item?.dateo?.agente?.nombre }}</span>
                    </div>
                    <div class="capt-line" v-if="dialog.item?.dateo?.asesorConvenio?.nombre">
                      <v-chip size="x-small" color="teal" variant="tonal">Convenio</v-chip>
                      <span class="text-medium-emphasis">{{ dialog.item?.dateo?.asesorConvenio?.nombre }}</span>
                    </div>
                    <div class="capt-line" v-if="dialog.item?.dateo?.convenio?.nombre">
                      <v-chip size="x-small" color="blue-grey" variant="tonal">Convenio</v-chip>
                      <span class="text-medium-emphasis">{{ dialog.item?.dateo?.convenio?.nombre }}</span>
                    </div>
                    <div v-if="!dialog.item?.dateo?.agente && !dialog.item?.dateo?.asesorConvenio && !dialog.item?.dateo?.convenio">
                      —
                    </div>
                  </div>
                </v-col>
              </v-row>

              <!-- ======================== SECCIÓN DESCUENTO ======================== -->
              <template v-if="tieneDescuento">
                <v-divider class="my-4" />

                <v-card variant="tonal" color="orange-darken-2" class="pa-4 rounded-lg">
                  <div class="d-flex align-center mb-3" style="gap:8px">
                    <v-icon color="orange-darken-2" size="20">mdi-tag-multiple</v-icon>
                    <span class="text-subtitle-2 font-weight-bold">Descuento Informativo Aplicado</span>
                    <v-chip
                      size="x-small"
                      :color="origenDescuento === 'dateo' ? 'blue' : 'purple'"
                      variant="flat"
                      class="ml-1"
                    >
                      {{ origenDescuento === 'dateo' ? 'Pre-marcado (dateo)' : 'Aplicado en caja' }}
                    </v-chip>
                  </div>

                  <v-row dense>
                    <!-- Nombre del descuento -->
                    <v-col cols="12" md="6">
                      <div class="label-desc">Descuento</div>
                      <div class="value-desc">
                        {{ dialog.item?.descuentoAplicado?.nombre ?? nombreDescuentoFallback ?? '—' }}
                        <span v-if="dialog.item?.descuentoAplicado?.codigo" class="text-caption text-medium-emphasis ml-1">
                          ({{ dialog.item.descuentoAplicado.codigo }})
                        </span>
                      </div>
                    </v-col>

                    <!-- Monto descontado -->
<v-col cols="12" md="6">
  <div class="label-desc">Monto descontado</div>
  <div class="value-desc text-orange-darken-2 font-weight-bold d-flex align-center" style="gap:8px">
    - {{ fmtCOP(dialog.item?.descuentoAplicado?.montoAplicado ?? dialog.item?.descuento_monto_aplicado ?? 0) }}
    <v-btn
      size="x-small"
      icon="mdi-pencil"
      variant="text"
      color="orange-darken-2"
      :loading="editingDescuento"
      @click="openEditDescuento"
    />
  </div>
</v-col>

                    <!-- Total original -->
                    <v-col cols="12" md="6">
                      <div class="label-desc">Total sin descuento</div>
                      <div class="value-desc">{{ fmtCOP(totalSinDescuento) }}</div>
                    </v-col>

                    <!-- Total final -->
                    <v-col cols="12" md="6">
                      <div class="label-desc">Total final (con descuento)</div>
                      <div class="value-desc text-success font-weight-bold">
                        {{ fmtCOP(pickTotal(dialog.item)) }}
                      </div>
                    </v-col>

                    <!-- Autorizado por (solo si fue en caja) -->
                    <v-col cols="12" md="6" v-if="origenDescuento === 'caja'">
                      <div class="label-desc">Autorizado por</div>
                      <div class="value-desc">
                        <v-icon size="14" class="mr-1">mdi-account-check</v-icon>
                        {{ dialog.item?.descuentoAplicado?.autorizadoPor?.nombre ?? '—' }}
                      </div>
                    </v-col>

                    <!-- Confirmado por (cajero) -->
                    <v-col cols="12" md="6">
                      <div class="label-desc">Confirmado por</div>
                      <div class="value-desc">
                        <v-icon size="14" class="mr-1">mdi-account</v-icon>
                        {{ nombreConfirmadoPor }}
                      </div>
                    </v-col>

                    <!-- Fecha de confirmación -->
                    <v-col cols="12" md="6">
                      <div class="label-desc">Fecha de aplicación</div>
                      <div class="value-desc">
                        <v-icon size="14" class="mr-1">mdi-calendar-check</v-icon>
                        <span v-if="dialog.item?.confirmadoAt || dialog.item?.confirmado_at">
                          {{ asDate(dialog.item?.confirmadoAt ?? dialog.item?.confirmado_at) }}
                          •
                          {{ asTime(dialog.item?.confirmadoAt ?? dialog.item?.confirmado_at) }}
                        </span>
                        <span v-else>—</span>
                      </div>
                    </v-col>
                  </v-row>

                  <!-- Nota efecto en comisión -->
                  <v-alert
                    type="warning"
                    variant="tonal"
                    density="compact"
                    class="mt-3"
                    prepend-icon="mdi-information-outline"
                  >
                    <span class="text-caption">
                      La comisión del comercial fue ajustada al valor básico de dateo por aplicación de descuento informativo.
                    </span>
                  </v-alert>
                </v-card>
              </template>
              <!-- ======================== FIN SECCIÓN DESCUENTO ======================== -->

            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG EDITAR MONTO DESCUENTO -->
<v-dialog v-model="editDescuentoDialog" max-width="420" persistent>
  <v-card>
    <v-card-title class="d-flex align-center" style="gap:8px">
      <v-icon color="orange-darken-2">mdi-pencil</v-icon>
      Editar monto de descuento
    </v-card-title>
    <v-divider />
    <v-card-text>
      <div class="text-body-2 text-medium-emphasis mb-3">
        Ticket #{{ dialog.item?.id }} — {{ dialog.item?.placa }}
      </div>
      <v-text-field
        v-model.number="editDescuentoMonto"
        label="Nuevo monto de descuento (COP)"
        type="number"
        min="0"
        prefix="$"
        variant="outlined"
        density="compact"
        autofocus
        hint="El total de la factura se recalculará automáticamente"
        persistent-hint
      />
      <v-alert
        v-if="editDescuentoMonto > 0"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        Total original: <strong>{{ fmtCOP(dialog.item?.totalSinDescuento ?? dialog.item?.total_sin_descuento ?? 0) }}</strong>
        → Nuevo total: <strong>{{ fmtCOP(Math.max(0, (dialog.item?.totalSinDescuento ?? dialog.item?.total_sin_descuento ?? 0) - editDescuentoMonto)) }}</strong>
      </v-alert>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="editDescuentoDialog = false">Cancelar</v-btn>
      <v-btn
        color="orange-darken-2"
        variant="tonal"
        :loading="editingDescuento"
        :disabled="editDescuentoMonto < 0"
        @click="saveDescuentoMonto"
      >
        Guardar
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

<v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FacturacionService, type FacturacionTicket, type Paginated } from '@/services/facturacion_service'

const route = useRoute()
const router = useRouter()

// Tipo extendido que coincide con la estructura real del backend
interface DescuentoAplicadoDTO {
  id: number
  codigo: string
  nombre: string
  montoAplicado: number
  autorizadoPor: { id: number; nombre: string } | null
}

interface ExtendedFacturacionTicket {
  id?: number
  hash?: string
  estado?: string | null

  file_path?: string | null
  filePath?: string | null
  file_mime?: string | null
  fileMime?: string | null
  file_size?: number | null
  fileSize?: number | null
  image_rotation?: number | null
  imageRotation?: number | null

  placa?: string | null
  fecha_pago?: string | null
  fechaPago?: string | null
  confirmado_at?: string | null
  confirmadoAt?: string | null
  created_at?: string | null
  createdAt?: string | null

  // Totales
  total?: number | null
  totalFactura?: number | null
  total_factura?: number | null
  subtotal?: number | null
  iva?: number | null

  // 🆕 Total original antes del descuento
  total_sin_descuento?: number | null
  totalSinDescuento?: number | null

  vendedor_text?: string | null
  vendedorText?: string | null
  prefijo?: string | null
  consecutivo?: string | null
  nit?: string | null
  pin?: string | null
  marca?: string | null

  turnoId?: number | null
  turno_id?: number | null
  servicioId?: number | null
  servicio_id?: number | null
  sedeId?: number | null
  sede_id?: number | null
  agenteId?: number | null
  agente_id?: number | null
  dateoId?: number | null
  dateo_id?: number | null

  servicio_nombre?: string | null
  servicioNombre?: string | null
  sede_nombre?: string | null
  sedeNombre?: string | null
  turnoGlobal?: string | number | null
  placaTurno?: string | null
  funcionarioNombre?: string | null
  canalAtribucion?: string | null

  // 🆕 Descuento informativo
  descuento_id?: number | null
  descuentoId?: number | null
  descuento_monto_aplicado?: number | null
  descuentoMontoAplicado?: number | null
  autorizado_por_id?: number | null
  autorizadoPorId?: number | null
  descuentoAplicado?: DescuentoAplicadoDTO | null

  // Confirmación
  confirmedById?: number | null
  confirmed_by_id?: number | null
  confirmedBy?: { id: number; nombres?: string | null; apellidos?: string | null } | null
  autorizadoPor?: { id: number; nombres?: string | null; apellidos?: string | null } | null

  servicio?: { nombreServicio?: string | null } | null
  sede?: { nombre?: string | null } | null
  turno?: { turnoNumero?: string | number | null; placa?: string | null } | null
  dateo?: {
    agente?: { nombre?: string | null } | null
    asesorConvenio?: { nombre?: string | null } | null
    convenio?: { nombre?: string | null } | null
  } | null
}

/* ===== Tabla (server) ===== */
const loading = ref(false)
const rows = ref<FacturacionTicket[]>([])
const total = ref(0)
const pagination = ref({
  page: 1,
  itemsPerPage: 20,
  sortBy: [] as Array<{ key: string; order?: 'asc'|'desc' }>
})
const pages = computed(() => Math.max(1, Math.ceil(total.value / pagination.value.itemsPerPage)))

const headers = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Estado', key: 'estado', width: 140 },
  { title: 'Placa', key: 'placa', width: 120 },
  { title: 'Fecha pago', key: 'fecha_pago', width: 160 },
  { title: 'Total factura', key: 'total', width: 160 },
  { title: 'Servicio', key: 'servicioNombre', width: 240 },
  { title: 'Sede', key: 'sedeNombre', width: 200 },
  { title: 'Vendedor', key: 'vendedor_text', width: 220 },
  { title: 'Acciones', key: 'acciones', width: 120 },
]

async function fetchList() {
  loading.value = true
  try {
    const resp = await FacturacionService.list({
      page: pagination.value.page,
      limit: pagination.value.itemsPerPage,
    }) as unknown as Paginated<FacturacionTicket>
    rows.value = resp.data || []
    total.value = resp.meta?.total ?? rows.value.length
  } catch (err) {
    console.error('Error cargando histórico:', err)
    snack.text = '❌ Error cargando histórico'
    snack.show = true
  } finally {
    loading.value = false
  }
}
function refresh() { fetchList() }
function onUpdateOptions(opts: { page?: number; itemsPerPage?: number; sortBy?: Array<{ key: string; order?: 'asc'|'desc' }>}) {
  if (typeof opts.page === 'number') pagination.value.page = opts.page
  if (typeof opts.itemsPerPage === 'number') pagination.value.itemsPerPage = opts.itemsPerPage
  if (opts.sortBy) pagination.value.sortBy = opts.sortBy
  refresh()
}

/* ===== Fecha pago fallback chain ===== */
function firstFecha(it: ExtendedFacturacionTicket): string | null {
  return (
    it?.fecha_pago ||
    it?.fechaPago ||
    it?.confirmado_at ||
    it?.confirmadoAt ||
    it?.created_at ||
    it?.createdAt ||
    null
  )
}

/* ===== Detalle ===== */
const dialog = reactive<{ open: boolean; item: ExtendedFacturacionTicket | null }>({ open: false, item: null })

const fechaPagoIso = computed(() => {
  const i = dialog.item
  return i?.fechaPago || i?.fecha_pago || i?.confirmadoAt || i?.confirmado_at || i?.createdAt || i?.created_at || null
})

/* ===== Computed descuento ===== */
const tieneDescuento = computed(() => {
  const i = dialog.item
  if (!i) return false
  const tieneId = !!(i.descuentoId ?? i.descuento_id ?? i.descuentoAplicado?.id)
  const tieneMonto = (i.descuentoAplicado?.montoAplicado ?? i.descuentoMontoAplicado ?? i.descuento_monto_aplicado ?? 0) > 0
  return tieneId && tieneMonto
})

const origenDescuento = computed<'dateo' | 'caja'>(() => {
  const i = dialog.item
  if (!i) return 'dateo'
  // Prioridad 1: descuentoAplicado.autorizadoPor (viene del DTO enriquecido del getById)
  if (i.descuentoAplicado?.autorizadoPor) return 'caja'
  // Prioridad 2: campos planos
  if (i.autorizadoPorId ?? i.autorizado_por_id) return 'caja'
  return 'dateo'
})

const totalSinDescuento = computed(() => {
  const i = dialog.item
  if (!i) return 0
  const sinDesc = i.totalSinDescuento ?? i.total_sin_descuento
  if (sinDesc && sinDesc > 0) return sinDesc
  // Fallback: total actual + monto descuento
  const monto = i.descuentoAplicado?.montoAplicado ?? i.descuentoMontoAplicado ?? i.descuento_monto_aplicado ?? 0
  const totalActual = pickTotal(i)
  return totalActual + (monto || 0)
})

const nombreDescuentoFallback = computed(() => {
  const i = dialog.item
  if (!i) return null
  return i.descuentoAplicado?.nombre ?? null
})

const nombreConfirmadoPor = computed(() => {
  const i = dialog.item
  if (!i) return '—'
  const cb = i.confirmedBy
  if (cb) return [cb.nombres, cb.apellidos].filter(Boolean).join(' ') || '—'
  return '—'
})

/* ===== Controles de imagen ===== */
const imageScale = ref(1)
const imageError = ref(false)
const imageBlobUrl = ref<string | null>(null)

const imgStyle = computed(() => {
  const rotation = dialog.item?.imageRotation ?? dialog.item?.image_rotation ?? 0
  return {
    transform: `rotate(${rotation}deg) scale(${imageScale.value})`,
    transformOrigin: 'center center',
    maxWidth: '100%',
    transition: 'transform 0.2s ease',
  }
})

function zoomIn() { imageScale.value = Math.min(imageScale.value + 0.2, 3) }
function zoomOut() { imageScale.value = Math.max(imageScale.value - 0.2, 0.5) }
function resetZoom() { imageScale.value = 1 }
function onImageError() { imageError.value = true }

async function loadImageBlob(ticketId: number) {
  try {
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('auth_token') ||
      sessionStorage.getItem('token')

    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(`/api/facturacion/tickets/${ticketId}/imagen`, {
      headers,
      credentials: 'include'
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const blob = await response.blob()
    if (imageBlobUrl.value) URL.revokeObjectURL(imageBlobUrl.value)
    imageBlobUrl.value = URL.createObjectURL(blob)
    imageError.value = false
  } catch (err) {
    console.error('Error cargando imagen:', err)
    imageError.value = true
    imageBlobUrl.value = null
  }
}

function closeDialog() {
  dialog.open = false
  if (imageBlobUrl.value) {
    URL.revokeObjectURL(imageBlobUrl.value)
    imageBlobUrl.value = null
  }
  setTimeout(() => {
    imageScale.value = 1
    imageError.value = false
  }, 300)
}

async function openDetailById(id: number | string) {
  try {
    const full = await FacturacionService.getById(id)
    dialog.item = full as ExtendedFacturacionTicket
    dialog.open = true
    imageError.value = false
    imageScale.value = 1
    if (full.id) await loadImageBlob(Number(full.id))
  } catch (err) {
    console.error('Error cargando detalle:', err)
    snack.text = '❌ No se pudo cargar el detalle'
    snack.show = true
  }
}

/* Deep link ?focus=ID */
async function openFocusIfAny() {
  const focus = route.query?.focus
  const n = Number(Array.isArray(focus) ? focus[0] : focus)
  if (!Number.isFinite(n) || !n) return
  await openDetailById(n)
  const q = { ...route.query }; delete (q as Record<string, unknown>).focus
  router.replace({ query: q })
}

/* ===== Helpers UI ===== */
function fmtCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)
}
function asDate(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const yyyy = d.getFullYear(), mm = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0')
  return `${yyyy}-${mm}-${dd}`
}
function asTime(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0'), ss = String(d.getSeconds()).padStart(2,'0')
  return `${hh}:${mm}:${ss}`
}
function estadoColor(s?: string | null) {
  switch ((s || '').toUpperCase()) {
    case 'BORRADOR': return 'grey'
    case 'OCR_LISTO': return 'info'
    case 'LISTA_CONFIRMAR': return 'warning'
    case 'CONFIRMADA': return 'success'
    case 'REVERTIDA': return 'error'
    default: return 'grey'
  }
}
function humanCanal(c?: string | null) {
  const v = String(c || '').toUpperCase()
  if (!v) return ''
  const map: Record<string,string> = {
    'ASESOR_COMERCIAL': 'Asesor comercial',
    'ASESOR': 'Asesor comercial',
    'TELEMERCADEO': 'Call Center',
    'TELE': 'Call Center',
    'REDES': 'Redes',
    'GOOGLE_ADS': 'Google ADS',
    'CONVENIO': 'Convenio',
    'REFERIDO': 'Referido',
  }
  return map[v] || v.charAt(0) + v.slice(1).toLowerCase()
}
function canalChipColor(c?: string | null) {
  const v = String(c || '').toUpperCase()
  switch (v) {
    case 'ASESOR_COMERCIAL':
    case 'ASESOR': return 'purple'
    case 'TELEMERCADEO':
    case 'TELE': return 'indigo'
    case 'REDES': return 'cyan'
    case 'GOOGLE_ADS': return 'teal'
    case 'CONVENIO': return 'blue-grey'
    case 'REFERIDO': return 'green'
    default: return 'grey'
  }
}

function pickTotal(it: ExtendedFacturacionTicket | null) {
  if (!it) return 0
  const a = it?.totalFactura
  if (a != null) return a
  const b = it?.total_factura
  if (b != null) return b
  const c = it?.total
  return c != null ? c : 0
}

function getServicioNombre(it: ExtendedFacturacionTicket | null) {
  if (!it) return '—'
  return it?.servicio_nombre ?? it?.servicioNombre ?? it?.servicio?.nombreServicio ?? '—'
}
function getSedeNombre(it: ExtendedFacturacionTicket | null) {
  if (!it) return '—'
  return it?.sede_nombre ?? it?.sedeNombre ?? it?.sede?.nombre ?? '—'
}

/* ===== Edición de monto de descuento ===== */
const editDescuentoDialog = ref(false)
const editDescuentoMonto = ref(0)
const editingDescuento = ref(false)

function openEditDescuento() {
  editDescuentoMonto.value = Number(
    dialog.item?.descuentoAplicado?.montoAplicado ??
    dialog.item?.descuento_monto_aplicado ?? 0
  )
  editDescuentoDialog.value = true
}

async function saveDescuentoMonto() {
  if (!dialog.item?.id) return
  editingDescuento.value = true
  try {
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('auth_token') ||
      sessionStorage.getItem('token')

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const montoAnterior = Number(
      dialog.item?.descuentoAplicado?.montoAplicado ??
      dialog.item?.descuento_monto_aplicado ?? 0
    )
    const totalActual = Number(
      dialog.item?.totalFactura ?? dialog.item?.total_factura ?? dialog.item?.total ?? 0
    )
    const totalSinDesc = Number(
      dialog.item?.totalSinDescuento ??
      dialog.item?.total_sin_descuento ??
      (totalActual + montoAnterior)
    )

    const resp = await fetch(`/api/facturacion/tickets/${dialog.item.id}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        descuento_monto_aplicado: editDescuentoMonto.value,
        total_sin_descuento: totalSinDesc,
      }),
    })

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

    editDescuentoDialog.value = false
    snack.text = '✅ Monto de descuento actualizado'
    snack.show = true

    const updated = await FacturacionService.getById(dialog.item.id)
    dialog.item = updated as ExtendedFacturacionTicket
    await fetchList()
  } catch (err) {
    console.error('Error actualizando descuento:', err)
    snack.text = '❌ No se pudo actualizar el monto'
    snack.show = true
  } finally {
    editingDescuento.value = false
  }
}

/* ===== Snack ===== */
const snack = reactive({ show: false, text: '' })

/* ===== Lifecycle ===== */
onMounted(async () => {
  await fetchList()
  await openFocusIfAny()
})

onBeforeUnmount(() => {
  if (imageBlobUrl.value) URL.revokeObjectURL(imageBlobUrl.value)
})
</script>

<style scoped>
.v-card {
  box-shadow: 0 10px 20px rgba(0,0,0,0.08), 0 6px 6px rgba(0,0,0,0.05);
  border-radius: 16px;
}

.section-title {
  font-weight: 700;
  margin-bottom: 10px;
  font-size: 0.95rem;
  letter-spacing: .3px;
}

.label {
  font-size: .75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.value {
  font-weight: 600;
}

/* Labels y values dentro de la tarjeta de descuento */
.label-desc {
  font-size: .72rem;
  color: rgba(0,0,0,.55);
  text-transform: uppercase;
  letter-spacing: .04em;
  margin-bottom: 2px;
}
.value-desc {
  font-weight: 600;
  font-size: .92rem;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.rounded-xl { border-radius: 16px; }
.rounded-2xl { border-radius: 20px; }
.text-medium-emphasis { color: rgba(0,0,0,.6); }

.capt-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

/* Preview de imagen */
.image-preview-wrapper {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
  background: #fafafa;
}

.preview-canvas {
  width: 100%;
  max-height: 500px;
  overflow: auto;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}

.preview-canvas img {
  max-width: 100%;
  display: block;
  margin: 0 auto;
  border-radius: 6px;
}

.preview-canvas::-webkit-scrollbar { width: 8px; height: 8px; }
.preview-canvas::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
.preview-canvas::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
.preview-canvas::-webkit-scrollbar-thumb:hover { background: #555; }
</style>
