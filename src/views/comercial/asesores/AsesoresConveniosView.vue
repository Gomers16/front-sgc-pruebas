<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-4 px-4 px-sm-6">
        <div class="text-h5 font-weight-bold mb-4">👥 Asesores</div>
      </v-card-title>

      <v-card-text class="px-4 px-sm-6 pt-0">
        <v-row dense>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="filters.q"
              label="Buscar por nombre, tel o doc"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <v-select
              v-model="filters.tipo"
              :items="tipoItems"
              label="Tipo"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <v-select
              v-model="filters.activo"
              :items="estadoItems"
              label="Estado"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="4" md="1">
            <v-btn color="primary" :loading="loading" @click="reload" block>
              Aplicar
            </v-btn>
          </v-col>
          <v-col cols="6" sm="4" md="1">
            <v-btn variant="outlined" :disabled="loading" @click="resetFilters" block>
              Limpiar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-expand-transition>
        <v-alert
          v-if="globalError"
          type="error"
          variant="tonal"
          class="mx-6 mb-3"
          density="comfortable"
        >
          {{ globalError }}
        </v-alert>
      </v-expand-transition>

      <v-data-table-server
        class="px-4 pb-4"
        :headers="headers"
        :items="rows"
        :items-length="totalItems"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :loading="loading"
        :sort-by="sortBy"
        @update:options="loadItems"
        item-value="id"
      >
        <!-- 👇 NUEVO: Nombre clicable que abre la Ficha Comercial -->
        <template #item.nombre="{ item }">
          <RouterLink
            class="text-primary text-decoration-none font-weight-medium"
            :to="{ name: 'FichaComercialAsesor', params: { id: unwrap(item)?.id } }"
            :title="`Ver ficha comercial de ${unwrap(item)?.nombre || 'asesor'}`"
          >
            {{ unwrap(item)?.nombre || '—' }}
          </RouterLink>
        </template>

        <!-- Compatibilidad item/raw -->
        <template #item.tipo="{ item }">
          <v-chip size="small" variant="flat">{{ humanTipo(unwrap(item)?.tipo) }}</v-chip>
        </template>

        <!-- ✅ Solo pinta el booleano que manda el backend en row.activo -->
        <template #item.activo="{ item }">
          <v-chip :color="unwrap(item)?.activo ? 'success' : 'error'" size="small" variant="flat">
            {{ unwrap(item)?.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>

        <template #item.convenios="{ item }">
          <v-chip
            v-if="unwrap(item)"
            size="small"
            variant="tonal"
            class="cursor-pointer"
            @click="openVerConvenios(unwrap(item)!)"
          >
            {{ conveniosCount[unwrap(item)!.id] ?? '—' }}
          </v-chip>
        </template>

        <template #item.prospectos="{ item }">
          <v-chip
            v-if="unwrap(item)"
            size="small"
            variant="tonal"
            class="cursor-pointer"
            @click="openVerProspectos(unwrap(item)!)"
          >
            {{ prospectosCount[unwrap(item)!.id] ?? '—' }}
          </v-chip>
        </template>

        <template #item.acciones="{ item }">
          <div v-if="unwrap(item)" class="d-flex gap-1">
            <v-btn
              size="small"
              variant="text"
              icon="mdi-eye"
              :title="'Ver convenios'"
              @click="openVerConvenios(unwrap(item)!)"
            />
            <v-btn
              size="small"
              variant="text"
              icon="mdi-account-eye"
              :title="'Ver prospectos'"
              @click="openVerProspectos(unwrap(item)!)"
            />
            <v-divider vertical class="mx-1" />
            <v-btn
              size="small"
              variant="text"
              icon="mdi-account-plus"
              :title="'Asignar convenio'"
              @click="openAsignar(unwrap(item)!)"
            />
            <v-btn
              size="small"
              variant="text"
              icon="mdi-account-remove"
              color="error"
              :title="'Retirar convenio'"
              @click="openRetirar(unwrap(item)!)"
            />
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Modal: Ver convenios -->
    <v-dialog v-model="dlgVer.visible" max-width="560">
      <v-card>
        <v-card-title class="text-h6">
          Convenios de {{ dlgVer.asesor?.nombre || '—' }}
        </v-card-title>
        <v-card-text>
          <v-alert v-if="dlgVer.error" type="error" variant="tonal" class="mb-3">
            {{ dlgVer.error }}
          </v-alert>
          <v-list v-if="dlgVer.loading" density="comfortable">
            <v-list-item title="Cargando..." prepend-icon="mdi-progress-clock" />
          </v-list>
          <template v-else>
            <v-list v-if="dlgVer.convenios.length" density="comfortable">
              <v-list-item
                v-for="c in dlgVer.convenios"
                :key="c.id"
                :title="c.nombre"
                :subtitle="vigenciaText(c)"
              >
                <template #append>
                  <v-btn variant="text" size="small" color="error" @click="retirarConvenio(c.id)">
                    Retirar
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
            <div v-else class="text-medium-emphasis">No tiene convenios asignados.</div>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgVer.visible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal: Ver prospectos -->
    <v-dialog v-model="dlgPros.visible" max-width="820">
      <v-card>
        <v-card-title class="text-h6">
          Prospectos de {{ dlgPros.asesor?.nombre || '—' }}
        </v-card-title>
        <v-card-text>
          <v-alert v-if="dlgPros.error" type="error" variant="tonal" class="mb-3">
            {{ dlgPros.error }}
          </v-alert>
          <div v-if="dlgPros.loading" class="d-flex align-center">
            <v-progress-circular indeterminate class="mr-2" /> Cargando...
          </div>

          <template v-else>
            <v-list v-if="dlgPros.items.length" density="comfortable">
              <v-list-item
                v-for="p in dlgPros.items"
                :key="p.id"
                :title="p.nombre || `Prospecto #${p.id}`"
              >
                <template #subtitle>
                  <div class="d-flex flex-column">
                    <div class="text-medium-emphasis">
                      <span v-if="p.placa">🚗 {{ p.placa }}</span>
                      <span v-if="p.telefono" class="ml-4">📞 {{ p.telefono }}</span>
                    </div>
                    <div v-if="p.observaciones" class="text-medium-emphasis">📝 {{ p.observaciones }}</div>
                  </div>
                </template>

                <template #append>
                  <div class="d-flex align-center gap-2">
                    <v-chip size="x-small" :color="p.soatVigente ? 'success' : 'error'" variant="flat">
                      SOAT {{ p.soatVigente ? 'Vigente' : 'Vencido' }}
                    </v-chip>
                    <small class="text-medium-emphasis">{{ rangoVigencia(p.soatVencimiento) }}</small>

                    <v-chip size="x-small" :color="p.tecnoVigente ? 'success' : 'error'" variant="flat" class="ml-4">
                      Tecno {{ p.tecnoVigente ? 'Vigente' : 'Vencido' }}
                    </v-chip>
                    <small class="text-medium-emphasis">{{ rangoVigencia(p.tecnoVencimiento) }}</small>
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <div v-else class="text-medium-emphasis">No tiene prospectos.</div>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgPros.visible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal: Asignar convenio -->
    <v-dialog v-model="dlgAsignar.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6">
          Asignar convenio a {{ dlgAsignar.asesor?.nombre || '—' }}
        </v-card-title>
        <v-card-text>
          <v-alert v-if="dlgAsignar.error" type="error" variant="tonal" class="mb-3">
            {{ dlgAsignar.error }}
          </v-alert>
          <v-autocomplete
            v-model="dlgAsignar.convenioId"
            :items="conveniosOpciones"
            :item-title="etiquetaConvenio"
            :custom-filter="filtroConvenio"
            item-value="id"
            label="Convenio"
            :loading="conveniosOpcionesLoading"
            variant="outlined"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgAsignar.visible = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="dlgAsignar.loading" @click="confirmAsignar">Asignar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal: Retirar convenio -->
    <v-dialog v-model="dlgRetirar.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6">
          Retirar convenio de {{ dlgRetirar.asesor?.nombre || '—' }}
        </v-card-title>
        <v-card-text class="d-flex flex-column gap-2">
          <v-alert v-if="dlgRetirar.error" type="error" variant="tonal" class="mb-3">
            {{ dlgRetirar.error }}
          </v-alert>

          <v-autocomplete
            v-model="dlgRetirar.convenioId"
            :items="dlgRetirar.convenios"
            :item-title="etiquetaConvenio"
            :custom-filter="filtroConvenio"
            item-value="id"
            label="Convenio a retirar"
            variant="outlined"
            hide-details
          />
          <v-text-field v-model="dlgRetirar.motivo" label="Motivo (opcional)" variant="outlined" hide-details />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgRetirar.visible = false">Cancelar</v-btn>
          <v-btn color="error" :loading="dlgRetirar.loading" @click="confirmRetirar">Retirar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import asesoresApi, { type Agente } from '@/services/asesoresService'
import {
  listConveniosLight,
  asignarAsesorConvenio,
  retirarAsesorConvenio,
  etiquetaConvenio,
  filtroConvenio,
} from '@/services/conveniosService'
import { get } from '@/services/http'

const API = '/api'

// Tipado explícito de las funciones del servicio
interface AsesoresService {
  listAsesores: (params: ListAsesoresParams) => Promise<ListAsesoresResponse>
  listConveniosDelAsesor: (asesorId: number) => Promise<ConvenioLite[]>
}

interface ListAsesoresParams {
  page: number
  perPage: number
  q?: string
  tipo?: string
  activo?: boolean | 0 | 1
  sortBy?: string
  order?: 'asc' | 'desc'
}

interface ListAsesoresResponse {
  data: Agente[]
  total: number
}

const { listAsesores, listConveniosDelAsesor } = asesoresApi as unknown as AsesoresService

type ConvenioLite = {
  id: number
  nombre: string
  establecimiento?: string | null
  vigencia_desde?: string | null
  vigencia_hasta?: string | null
}

type ProspectoLite = {
  id: number
  nombre?: string | null
  placa?: string | null
  telefono?: string | null
  observaciones?: string | null
  soatVigente?: boolean | null
  soatVencimiento?: string | null
  tecnoVigente?: boolean | null
  tecnoVencimiento?: string | null
  created_at?: string
}

type ItemWrapper = {
  raw: Agente
}

interface APIProspectosResponse {
  data?: ProspectoLite[]
}


/* ===== Helpers ===== */
function humanTipo(t?: string | null) {
  const v = String(t || '').toUpperCase()
  if (v === 'ASESOR_COMERCIAL') return 'Asesor comercial'
  if (v === 'ASESOR_CONVENIO') return 'Asesor convenio'
  if (v === 'ASESOR_TELEMERCADEO') return 'Asesor telemercadeo'
  return t || '—'
}

/** Compatibilidad item/raw */
function unwrap(rowOrWrapper: Agente | ItemWrapper): Agente | undefined {
  if (!rowOrWrapper) return undefined
  if (typeof rowOrWrapper === 'object' && 'raw' in rowOrWrapper) {
    return rowOrWrapper.raw
  }
  return rowOrWrapper as Agente
}

const filters = ref<{ q: string; tipo: string | ''; activo: '' | 0 | 1 | boolean }>({
  q: '',
  tipo: '',
  activo: '',
})

const tipoItems = [
  { title: 'Asesor comercial', value: 'ASESOR_COMERCIAL' },
  { title: 'Asesor convenio', value: 'ASESOR_CONVENIO' },
  { title: 'Asesor telemercadeo', value: 'ASESOR_TELEMERCADEO' },
]

const estadoItems = [
  { title: 'Activos', value: 1 },
  { title: 'Inactivos', value: 0 },
]

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Tipo', key: 'tipo', sortable: true },
  { title: 'Estado', key: 'activo', sortable: true },
  { title: 'Convenios', key: 'convenios', sortable: false },
  { title: 'Prospectos', key: 'prospectos', sortable: false },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

const rows = ref<Agente[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<Array<{ key: string; order: 'asc' | 'desc' }>>([{ key: 'id', order: 'asc' }])
const loading = ref(false)
const globalError = ref<string | null>(null)

const conveniosCount = ref<Record<number, number>>({})
const prospectosCount = ref<Record<number, number>>({})

const dlgVer = ref({
  visible: false,
  asesor: null as Agente | null,
  convenios: [] as ConvenioLite[],
  loading: false,
  error: null as string | null,
})

const dlgPros = ref({
  visible: false,
  asesor: null as Agente | null,
  items: [] as ProspectoLite[],
  loading: false,
  error: null as string | null,
})

const dlgAsignar = ref({
  visible: false,
  asesor: null as Agente | null,
  convenioId: null as number | null,
  loading: false,
  error: null as string | null,
})

const conveniosOpciones = ref<ConvenioLite[]>([])
const conveniosOpcionesLoading = ref(false)

const dlgRetirar = ref({
  visible: false,
  asesor: null as Agente | null,
  convenioId: null as number | null,
  motivo: '',
  convenios: [] as ConvenioLite[],
  loading: false,
  error: null as string | null,
})

/* ===== util de UI ===== */
function vigenciaText(c: ConvenioLite) {
  const f = (s?: string | null) => (!s ? '—' : new Date(s).toLocaleDateString())
  return `${f(c.vigencia_desde)} – ${f(c.vigencia_hasta)}`
}

function fmtDate(d?: string | Date | null) {
  if (!d) return '—'
  if (typeof d === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d
  const dt = d instanceof Date ? d : new Date(d)
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString()
}

function desdeSegunVenc(venc?: string | null) {
  if (!venc) return null
  const d = new Date(venc)
  if (isNaN(d.getTime())) return null
  d.setFullYear(d.getFullYear() - 1)
  return d
}

function rangoVigencia(venc?: string | null) {
  if (!venc) return '—'
  const desde = desdeSegunVenc(venc)
  return `${fmtDate(desde)} → ${fmtDate(venc)}`
}

/* ===== carga ===== */
async function loadItems() {
  loading.value = true
  globalError.value = null
  try {
    const sort = Array.isArray(sortBy.value) && sortBy.value[0] ? sortBy.value[0] : { key: 'id', order: 'asc' as const }
    const res = await listAsesores({
      page: page.value,
      perPage: itemsPerPage.value,
      q: filters.value.q || undefined,
      tipo: (filters.value.tipo as string) || undefined,
      activo: filters.value.activo === '' ? undefined : filters.value.activo,
      sortBy: sort.key,
      order: sort.order,
    })
    rows.value = res.data
    totalItems.value = Number(res.total || 0)
    await Promise.all([cargarConteoConvenios(), cargarConteoProspectos()])
  } catch (e) {
    rows.value = []
    totalItems.value = 0
    const error = e as Error
    globalError.value = error?.message || 'No fue posible cargar los asesores'
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  loadItems()
}

function resetFilters() {
  filters.value = { q: '', tipo: '', activo: '' }
  reload()
}

async function cargarConteoConvenios() {
  const map: Record<number, number> = {}
  await Promise.all(
    rows.value.map(async (a) => {
      try {
        const lista = await listConveniosDelAsesor(a.id)
        map[a.id] = Array.isArray(lista) ? lista.length : 0
      } catch {
        map[a.id] = 0
      }
    }),
  )
  conveniosCount.value = map
}

async function fetchProspectosDelAsesor(asesorId: number): Promise<ProspectoLite[]> {
  try {
    const r = await get<APIProspectosResponse>(
      `${API}/agentes-captacion/${asesorId}/prospectos`,
      { params: { vigente: 1 } },
    )
    const arr = r?.data ?? (r as unknown as ProspectoLite[])
    if (Array.isArray(arr)) return arr
  } catch {}

  try {
    const r2 = await get<APIProspectosResponse>(
      `${API}/asesores/${asesorId}/prospectos`,
      { params: { vigente: 1 } },
    )
    const arr2 = r2?.data ?? (r2 as unknown as ProspectoLite[])
    if (Array.isArray(arr2)) return arr2
  } catch {}

  const r3 = await get<APIProspectosResponse>(
    `${API}/prospectos`,
    { params: { creadoPor: asesorId, perPage: 500 } },
  )
  const arr3 = r3?.data ?? (r3 as unknown as ProspectoLite[])
  return Array.isArray(arr3) ? arr3 : []
}

async function cargarConteoProspectos() {
  const map: Record<number, number> = {}
  await Promise.all(
    rows.value.map(async (a) => {
      try {
        const lista = await fetchProspectosDelAsesor(a.id)
        map[a.id] = Array.isArray(lista) ? lista.length : 0
      } catch {
        map[a.id] = 0
      }
    }),
  )
  prospectosCount.value = map
}

/* ===== acciones ===== */
function openVerConvenios(asesor: Agente) {
  dlgVer.value = { visible: true, asesor, convenios: [], loading: true, error: null }
  listConveniosDelAsesor(asesor.id)
    .then((list: ConvenioLite[]) => (dlgVer.value.convenios = list))
    .catch((e: unknown) => {
      const error = e as Error
      dlgVer.value.error = error?.message || 'No fue posible cargar los convenios'
    })
    .finally(() => (dlgVer.value.loading = false))
}

function openVerProspectos(asesor: Agente) {
  dlgPros.value = { visible: true, asesor, items: [], loading: true, error: null }
  fetchProspectosDelAsesor(asesor.id)
    .then((list) => (dlgPros.value.items = list))
    .catch((e: unknown) => {
      const error = e as Error
      dlgPros.value.error = error?.message || 'No fue posible cargar los prospectos'
    })
    .finally(() => (dlgPros.value.loading = false))
}

function openAsignar(asesor: Agente) {
  dlgAsignar.value = { visible: true, asesor, convenioId: null, loading: false, error: null }
  conveniosOpcionesLoading.value = true
  Promise.all([
    listConveniosDelAsesor(asesor.id),
    listConveniosLight(),
  ])
    .then(([asignados, catalogo]) => {
      const ya = new Set((asignados as ConvenioLite[]).map((c) => c.id))
      conveniosOpciones.value = (catalogo as ConvenioLite[]).filter((c) => !ya.has(c.id))
    })
    .catch((e: unknown) => {
      const error = e as Error
      dlgAsignar.value.error = error?.message || 'No fue posible cargar convenios'
      conveniosOpciones.value = []
    })
    .finally(() => (conveniosOpcionesLoading.value = false))
}

async function confirmAsignar() {
  if (!dlgAsignar.value.asesor || !dlgAsignar.value.convenioId) return
  dlgAsignar.value.loading = true
  dlgAsignar.value.error = null
  try {
    await asignarAsesorConvenio(dlgAsignar.value.convenioId, { asesor_id: dlgAsignar.value.asesor.id })
    dlgAsignar.value.visible = false
    if (dlgVer.value.visible && dlgVer.value.asesor?.id === dlgAsignar.value.asesor.id) {
      openVerConvenios(dlgAsignar.value.asesor)
    }
    await Promise.all([cargarConteoConvenios(), cargarConteoProspectos()])
  } catch (e) {
    const error = e as Error
    dlgAsignar.value.error = error?.message || 'No fue posible asignar el convenio'
  } finally {
    dlgAsignar.value.loading = false
  }
}

function openRetirar(asesor: Agente) {
  dlgRetirar.value = {
    visible: true,
    asesor,
    convenioId: null,
    motivo: '',
    convenios: [],
    loading: false,
    error: null,
  }
  listConveniosDelAsesor(asesor.id)
    .then((list) => (dlgRetirar.value.convenios = list))
    .catch((e: unknown) => {
      const error = e as Error
      dlgRetirar.value.error = error?.message || 'No fue posible cargar convenios'
      dlgRetirar.value.convenios = []
    })
}

async function confirmRetirar() {
  if (!dlgRetirar.value.asesor || !dlgRetirar.value.convenioId) return
  dlgRetirar.value.loading = true
  dlgRetirar.value.error = null
  try {
    await retirarAsesorConvenio(dlgRetirar.value.convenioId, {
      motivo: dlgRetirar.value.motivo || undefined,
    })
    dlgRetirar.value.visible = false
    if (dlgVer.value.visible && dlgVer.value.asesor?.id === dlgRetirar.value.asesor.id) {
      openVerConvenios(dlgRetirar.value.asesor)
    }
    await Promise.all([cargarConteoConvenios(), cargarConteoProspectos()])
  } catch (e) {
    const error = e as Error
    dlgRetirar.value.error = error?.message || 'No fue posible retirar el convenio'
  } finally {
    dlgRetirar.value.loading = false
  }
}

async function retirarConvenio(convenioId: number) {
  if (!dlgVer.value.asesor) return
  try {
    await retirarAsesorConvenio(convenioId, { motivo: 'Retiro manual' })
    openVerConvenios(dlgVer.value.asesor)
    await Promise.all([cargarConteoConvenios(), cargarConteoProspectos()])
  } catch {
    // Error silencioso
  }
}

loadItems()
</script>

<style scoped>
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
