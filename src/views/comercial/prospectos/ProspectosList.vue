<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-4 px-4 px-sm-6">
        <div class="text-h5 font-weight-bold mb-4">👤 Prospectos</div>
      </v-card-title>

      <v-card-text class="px-4 px-sm-6 pt-0">
        <v-row dense>
          <v-col cols="6" sm="4" md="2">
            <v-text-field v-model="filters.placa" label="Placa" variant="outlined" density="compact" hide-details clearable />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field v-model="filters.telefono" label="Teléfono" variant="outlined" density="compact" hide-details clearable />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field v-model="filters.nombre" label="Nombre" variant="outlined" density="compact" hide-details clearable />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field v-model="filters.cedula" label="Cédula" variant="outlined" density="compact" hide-details clearable />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-autocomplete
              v-model="filters.convenioId"
              :items="conveniosItems"
              :item-title="etiquetaConvenio"
              :custom-filter="filtroConvenio"
              item-value="id"
              label="Convenio"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              :loading="conveniosLoading"
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-autocomplete
              v-model="filters.asesorId"
              :items="asesoresItems"
              item-title="nombre"
              item-value="id"
              label="Asesor comercial"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              :loading="asesoresLoading"
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field v-model="filters.desde" type="date" label="Desde" variant="outlined" density="compact" hide-details />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field v-model="filters.hasta" type="date" label="Hasta" variant="outlined" density="compact" hide-details />
          </v-col>

          <!-- Botones -->
          <v-col cols="12" sm="9" md="3" class="d-flex gap-2">
            <v-btn color="primary" :loading="loading" @click="reload" style="flex:1">
              Aplicar
            </v-btn>
            <v-btn variant="outlined" :disabled="loading" @click="resetFilters" style="flex:1">
              Limpiar
            </v-btn>
            <v-btn color="secondary" icon="mdi-plus" @click="irCrear" />
          </v-col>
        </v-row>
      </v-card-text>

      <!-- 📋 TABLA -->
      <v-data-table-server
        class="px-4 pb-4"
        :headers="headers"
        :items="rows"
        :items-length="totalItems"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :loading="loading"
        :sort-by="sortBy"
        @update:options="onUpdateOptions"
        item-value="id"
      >
        <!-- Asesor -->
        <template #item.asesor="{ item }">
          <div v-if="item.asignacion_activa" class="asesor-cell">
            <span class="asesor-nombre">
              {{ item.asignacion_activa.asesor?.nombre }}
            </span>
            <v-chip
              v-if="item.asignacion_activa.asesor?.tipo"
              size="x-small"
              label
              :color="asesorTipoColor(item.asignacion_activa.asesor?.tipo)"
              variant="outlined"
              class="px-2 text-caption"
            >
              {{ humanTipoAsesor(item.asignacion_activa.asesor?.tipo) }}
            </v-chip>
          </div>
          <span v-else>Sin asignar</span>
        </template>

        <!-- SOAT -->
        <template #item.soat="{ item }">
          <div class="doc-cell">
            <v-chip :color="docColor(item.soat_vigente)" size="small" variant="flat" label>
              {{ docText(item.soat_vigente) }}
            </v-chip>
            <span class="doc-date">{{ formatDate(item.soat_vencimiento) }}</span>
          </div>
        </template>

        <!-- RTM -->
        <template #item.tecno="{ item }">
          <div class="doc-cell">
            <v-chip :color="docColor(item.tecno_vigente)" size="small" variant="flat" label>
              {{ docText(item.tecno_vigente) }}
            </v-chip>
            <span class="doc-date">{{ formatDate(item.tecno_vencimiento) }}</span>
          </div>
        </template>

        <!-- Preventiva -->
        <template #item.preventiva="{ item }">
          <div class="doc-cell">
            <v-chip :color="docColor(item.preventiva_vigente)" size="small" variant="flat" label>
              {{ docText(item.preventiva_vigente) }}
            </v-chip>
            <span class="doc-date">{{ formatDate(item.preventiva_vencimiento) }}</span>
          </div>
        </template>

        <!-- Peritaje -->
        <template #item.peritaje="{ item }">
          <div class="doc-cell">
            <v-chip
              :color="item.peritaje_ultima_fecha ? 'success' : 'grey-darken-1'"
              size="small"
              variant="flat"
              label
            >
              {{ item.peritaje_ultima_fecha ? 'Registrado' : 'Sin datos' }}
            </v-chip>
            <span class="doc-date">{{ formatDate(item.peritaje_ultima_fecha) }}</span>
          </div>
        </template>

        <!-- Acciones -->
        <template #item.acciones="{ item }">
          <div class="d-flex gap-1">
            <v-btn size="small" variant="text" icon="mdi-eye" @click="verDetalle(item.id)" />
            <v-btn size="small" variant="text" icon="mdi-account-plus" @click="openAsignar(item.id)" />
            <v-btn
              size="small"
              variant="text"
              icon="mdi-account-remove"
              color="error"
              @click="openRetirar(item.id)"
            />
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- 📌 Asignar asesor -->
    <v-dialog v-model="dlgAsignar.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6">Asignar asesor</v-card-title>
        <v-card-text>
          <v-autocomplete
            v-model="dlgAsignar.asesorId"
            :items="asesoresItems"
            item-title="nombre"
            item-value="id"
            label="Asesor comercial"
            variant="outlined"
            :loading="asesoresLoading"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgAsignar.visible = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="dlgAsignar.loading" @click="confirmAsignar">
            Asignar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 📌 Retirar asesor -->
    <v-dialog v-model="dlgRetirar.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6">Retirar asesor</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="dlgRetirar.motivo"
            label="Motivo (opcional)"
            variant="outlined"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgRetirar.visible = false">Cancelar</v-btn>
          <v-btn color="error" :loading="dlgRetirar.loading" @click="confirmRetirar">
            Retirar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 📌 Confirmar DATEAR prospecto -->
    <v-dialog v-model="dlgDatear.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6">Datear prospecto</v-card-title>
        <v-card-text>
          ¿Seguro que quieres datear el prospecto
          <strong>{{ dlgDatear.nombre || 'seleccionado' }}</strong>?
          <br />
          Dejará de aparecer en esta lista y pasará a <strong>Dateos</strong>.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="dlgDatear.loading" @click="dlgDatear.visible = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" :loading="dlgDatear.loading" @click="confirmDatear">
            Datear
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  listProspectos,
  asignarAsesor,
  retirarAsesor,
  listAgentesCaptacion,
  listConveniosLight,
  datearProspecto,
  formatDate,
  type ProspectoDetail as Prospecto,
  type ConvenioLight,
} from '@/services/prospectosService'
import { etiquetaConvenio, filtroConvenio } from '@/services/conveniosService'

const router = useRouter()

/* ============================
   FILTROS
============================ */
const filters = ref({
  placa: '',
  telefono: '',
  nombre: '',
  cedula: '',
  convenioId: null as number | null,
  asesorId: null as number | null,
  vigente: '' as '' | 0 | 1 | boolean,
  desde: '',
  hasta: '',
})

/* ============================
   TABLA
============================ */
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Teléfono', key: 'telefono', sortable: true },
  { title: 'Placa', key: 'placa', sortable: true },
  { title: 'Asesor', key: 'asesor', sortable: false },
  { title: 'SOAT', key: 'soat', sortable: false },
  { title: 'RTM', key: 'tecno', sortable: false },
  { title: 'Preventiva', key: 'preventiva', sortable: false },
  { title: 'Peritaje', key: 'peritaje', sortable: false },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
] as const

const rows = ref<Prospecto[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'id', order: 'desc' }])
const loading = ref(false)
const dateandoId = ref<number | null>(null)

/* ============================
   CATÁLOGOS
============================ */
const asesoresItems = ref<{ id: number; nombre: string; tipo?: string }[]>([])
const asesoresLoading = ref(false)
const conveniosItems = ref<ConvenioLight[]>([])
const conveniosLoading = ref(false)

async function loadAsesores() {
  asesoresLoading.value = true
  try {
    const all = await listAgentesCaptacion()
    asesoresItems.value = all.filter((a) => a.tipo === 'ASESOR_COMERCIAL')
  } finally {
    asesoresLoading.value = false
  }
}
async function loadConvenios() {
  conveniosLoading.value = true
  try {
    conveniosItems.value = await listConveniosLight()
  } finally {
    conveniosLoading.value = false
  }
}

/* ============================
   HELPERS UI
============================ */
function docColor(v?: boolean | null) {
  if (v === true) return 'success'
  if (v === false) return 'error'
  return 'grey-darken-1'
}
function docText(v?: boolean | null) {
  if (v === true) return 'Vigente'
  if (v === false) return 'Vencido'
  return 'Sin datos'
}

function humanTipoAsesor(tipo?: string | null) {
  if (!tipo) return '—'
  if (tipo === 'ASESOR_COMERCIAL') return 'Comercial'
  if (tipo === 'ASESOR_CONVENIO') return 'Convenio'
  if (tipo === 'TELEMERCADEO') return 'Telemercadeo'
  return tipo
}

function asesorTipoColor(tipo?: string | null) {
  if (tipo === 'ASESOR_COMERCIAL') return 'indigo'
  if (tipo === 'ASESOR_CONVENIO') return 'purple'
  if (tipo === 'TELEMERCADEO') return 'deep-orange'
  return 'grey'
}

/** Calcula vigente desde una fecha si falta el flag */
function computeVigenteFromDate(flag: unknown, venc: unknown): boolean | null {
  if (flag === true || flag === false) return flag as boolean
  if (!venc) return null
  const d = new Date(typeof venc === 'string' ? venc : String(venc))
  if (isNaN(d.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d.getTime() >= today.getTime()
}

/** Normaliza claves y completa flags desde vencimientos */
function normalizeRow(p: Record<string, unknown>) {
  const soat_venc = (p.soat_vencimiento ?? p.soatVencimiento ?? null) as string | null
  const tecno_venc = (p.tecno_vencimiento ?? p.tecnoVencimiento ?? null) as string | null
  const soat_flag = computeVigenteFromDate(p.soat_vigente ?? p.soatVigente, soat_venc)
  const tecno_flag = computeVigenteFromDate(p.tecno_vigente ?? p.tecnoVigente, tecno_venc)

  const prev_venc =
    (p.preventiva_vencimiento ?? p.preventivaVencimiento ?? null) as string | null
  const prev_flag = computeVigenteFromDate(
    p.preventiva_vigente ?? p.preventivaVigente,
    prev_venc,
  )

  const peri_fecha =
    (p.peritaje_ultima_fecha ?? p.peritajeUltimaFecha ?? null) as string | null

  return {
    ...p,
    soat_vigente: soat_flag,
    tecno_vigente: tecno_flag,
    soat_vencimiento: soat_venc,
    tecno_vencimiento: tecno_venc,
    preventiva_vigente: prev_flag,
    preventiva_vencimiento: prev_venc,
    peritaje_ultima_fecha: peri_fecha,
    created_at: (p.created_at ?? p.createdAt ?? null) as string | null,
    updated_at: (p.updated_at ?? p.updatedAt ?? null) as string | null,
  }
}

/* ============================
   CRUD
============================ */
interface UpdateOptions {
  page?: number
  itemsPerPage?: number
  sortBy?: { key: string; order: 'asc' | 'desc' }[]
}

function onUpdateOptions(opts: UpdateOptions) {
  if (opts?.page !== undefined) page.value = opts.page
  if (opts?.itemsPerPage !== undefined) itemsPerPage.value = opts.itemsPerPage
  if (opts?.sortBy !== undefined) sortBy.value = opts.sortBy
  loadItems()
}

async function loadItems() {
  loading.value = true
  try {
    const sort =
      Array.isArray(sortBy.value) && sortBy.value[0]
        ? sortBy.value[0]
        : { key: 'id', order: 'desc' as const }

    const res = await listProspectos({
      page: page.value,
      perPage: itemsPerPage.value,
      placa: filters.value.placa || undefined,
      telefono: filters.value.telefono || undefined,
      nombre: filters.value.nombre || undefined,
      cedula: filters.value.cedula || undefined,
      convenioId: filters.value.convenioId || undefined,
      asesorId: filters.value.asesorId || undefined,
      vigente: '',
      desde: filters.value.desde || undefined,
      hasta: filters.value.hasta || undefined,
      sortBy: sort.key,
      order: sort.order,
    })

    rows.value = (res.data as unknown as Record<string, unknown>[]).map(
      normalizeRow,
    ) as unknown as Prospecto[]
    totalItems.value = res.total
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  loadItems()
}
function resetFilters() {
  filters.value = {
    placa: '',
    telefono: '',
    nombre: '',
    cedula: '',
    convenioId: null,
    asesorId: null,
    vigente: '',
    desde: '',
    hasta: '',
  }
  reload()
}

/* ============================
   NAVEGACIÓN
============================ */
function irCrear() {
  router.push({ name: 'ComercialProspectoNuevo' }).catch(() => {})
}
function verDetalle(id: number) {
  router.push({ name: 'ComercialProspectoDetalle', params: { id } }).catch(() => {})
}

/* ============================
   DATEAR PROSPECTO
============================ */
const dlgDatear = ref({
  visible: false,
  id: null as number | null,
  nombre: '' as string,
  loading: false,
})

async function confirmDatear() {
  const id = dlgDatear.value.id
  if (!id) return
  dlgDatear.value.loading = true
  dateandoId.value = id
  try {
    await datearProspecto(id)
    dlgDatear.value.visible = false
    await loadItems()
  } catch (e) {
    console.error(e)
    alert('No se pudo datear el prospecto.')
  } finally {
    dlgDatear.value.loading = false
    dateandoId.value = null
  }
}

/* ============================
   DIÁLOGOS ASIGNAR / RETIRAR
============================ */
const dlgAsignar = ref({
  visible: false,
  id: null as number | null,
  asesorId: null as number | null,
  loading: false,
})
function openAsignar(id: number) {
  dlgAsignar.value = { visible: true, id, asesorId: null, loading: false }
  if (!asesoresItems.value.length) loadAsesores()
}
async function confirmAsignar() {
  if (!dlgAsignar.value.id || !dlgAsignar.value.asesorId) return
  dlgAsignar.value.loading = true
  try {
    await asignarAsesor(dlgAsignar.value.id, { asesor_id: dlgAsignar.value.asesorId })
    dlgAsignar.value.visible = false
    loadItems()
  } finally {
    dlgAsignar.value.loading = false
  }
}

const dlgRetirar = ref({
  visible: false,
  id: null as number | null,
  motivo: '',
  loading: false,
})
function openRetirar(id: number) {
  dlgRetirar.value = { visible: true, id, motivo: '', loading: false }
}
async function confirmRetirar() {
  if (!dlgRetirar.value.id) return
  dlgRetirar.value.loading = true
  try {
    await retirarAsesor(dlgRetirar.value.id, {
      motivo: dlgRetirar.value.motivo || undefined,
    })
    dlgRetirar.value.visible = false
    loadItems()
  } finally {
    dlgRetirar.value.loading = false
  }
}

/* ============================
   INIT
============================ */
loadAsesores()
loadConvenios()
loadItems()
</script>

<style scoped>
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
.text-h5 {
  font-weight: bold;
}

/* Celda de asesor: nombre + chip en la misma fila */
.asesor-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.asesor-nombre {
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Layout consistente: chip arriba, fecha abajo */
.doc-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
}
.doc-date {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 2px;
}

/* Evitar columnas demasiado estrechas */
:deep(th[data-key='soat']),
:deep(td[data-key='soat']),
:deep(th[data-key='tecno']),
:deep(td[data-key='tecno']),
:deep(th[data-key='preventiva']),
:deep(td[data-key='preventiva']),
:deep(th[data-key='peritaje']),
:deep(td[data-key='peritaje']) {
  min-width: 132px;
}
</style>
