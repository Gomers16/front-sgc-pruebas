<template>
  <v-container class="py-6">
    <v-sheet class="sticky-header d-flex align-center gap-2 px-2 py-2">
      <v-btn color="primary" variant="flat" size="large" prepend-icon="mdi-arrow-left"
             class="rounded-lg font-weight-bold" @click="goBack">
        Volver al listado
      </v-btn>
      <v-spacer />
      <v-btn color="success" variant="flat" size="large" prepend-icon="mdi-pencil"
             class="rounded-lg font-weight-bold" @click="irEditar">
        Editar
      </v-btn>
      <span class="text-medium-emphasis text-subtitle-2">Cliente #{{ id }}</span>
    </v-sheet>

    <v-card class="mt-3 rounded-xl" elevation="8">
      <v-card-title class="py-4">
        <div class="d-flex align-center justify-space-between w-100">
          <div class="text-h6 font-weight-bold">👤 Cliente #{{ id }}</div>
        </div>
      </v-card-title>

      <v-card-text>
        <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4">
          {{ errorMsg }}
        </v-alert>

        <div v-if="loading" class="d-flex align-center justify-center my-8">
          <v-progress-circular indeterminate />
        </div>

        <template v-else>
          <v-row v-if="detalle">
            <!-- Datos -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="rounded-lg">
                <v-card-title class="text-subtitle-1 font-weight-bold">Datos</v-card-title>
                <v-card-text>
                  <div class="mb-2"><strong>Nombre:</strong> {{ detalle.cliente.nombre ?? '—' }}</div>
                  <div class="mb-2"><strong>Teléfono:</strong> {{ detalle.cliente.telefono }}</div>
                  <div class="mb-2">
                    <strong>Documento:</strong>
                    <span v-if="detalle.cliente.docTipo || detalle.cliente.docNumero">
                      {{ detalle.cliente.docTipo ?? '—' }} {{ detalle.cliente.docNumero ?? '' }}
                    </span>
                    <span v-else>—</span>
                  </div>
                  <div class="mb-2"><strong>Email:</strong> {{ detalle.cliente.email ?? '—' }}</div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Resumen + Visitas recientes -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="rounded-lg">
                <v-card-title class="text-subtitle-1 font-weight-bold">Resumen</v-card-title>
                <v-card-text>
                  <div class="mb-2"><strong>Vehículos:</strong> {{ stats?.vehiculos_count ?? 0 }}</div>
                  <div class="mb-2"><strong>Visitas:</strong> {{ stats?.visitas_count ?? 0 }}</div>
                  <div class="mb-2">
                    <strong>Última visita:</strong> {{ formatDate(stats?.ultima_visita_at) }}
                  </div>
                  <div class="mb-2">
                    <strong>Días desde última visita:</strong> {{ stats?.dias_desde_ultima_visita ?? '—' }}
                  </div>

                  <v-divider class="my-3" />

                  <!-- Última visita por vehículo -->
                  <div v-if="detalle.ultimas_por_vehiculo?.length">
                    <div class="text-subtitle-2 font-weight-bold mb-2">Última visita por vehículo</div>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th class="text-left">Placa</th>
<th class="text-left">Fecha</th>
<th class="text-left">Servicio</th>
<th class="text-left">Sede</th>
<th class="text-left">Asesor / Convenio</th>
<th class="text-left">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="u in detalle.ultimas_por_vehiculo" :key="u.vehiculoId">
                          <td>{{ u.placa }}</td>
<td>{{ formatDate(u.fecha) }}</td>
<td>{{ u.servicioNombre ?? '—' }}</td>
<td>{{ u.sedeNombre ?? '—' }}</td>
<td>
  <v-chip v-if="(u as any).convenioNombre" size="x-small" color="green-darken-1" variant="tonal">
    {{ (u as any).convenioNombre }}
  </v-chip>
  <v-chip v-else-if="(u as any).asesorNombre" size="x-small" color="blue-darken-1" variant="tonal">
    {{ (u as any).asesorNombre }}
  </v-chip>
  <span v-else class="text-medium-emphasis">—</span>
</td>
<td>
  <v-chip
    v-if="u.estado"
    :color="u.estado === 'finalizado' ? 'success' : u.estado === 'cancelado' ? 'error' : 'warning'"
    size="small" label class="text-capitalize"
  >
    {{ u.estado }}
  </v-chip>
  <span v-else>—</span>
</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </div>

                  <v-divider class="my-3" />

                  <div class="text-subtitle-2 font-weight-bold mb-2">Visitas recientes</div>
                  <div v-if="visitas.length === 0" class="text-medium-emphasis">Sin visitas aún</div>

                  <v-list v-else density="compact" class="rounded-lg">
                    <v-list-item
                      v-for="row in visitas"
                      :key="row.id"
                      :title="`${formatDate(row.fecha)} — ${row.servicioNombre ?? '—'}`"
                      :subtitle="`Sede: ${row.sedeNombre ?? '—'} · Placa: ${row.placa}${row.asesorNombre ? ' · ' + row.asesorNombre : ''}${row.convenioNombre ? ' · ' + etiquetaConvenio({ nombre: row.convenioNombre, establecimiento: row.convenioEstablecimiento }) : ''}`"
                    >
                      <template #append>
  <div class="d-flex align-center gap-1">
    <v-chip
      v-if="row.esRecurrente === true"
      size="x-small" color="orange-darken-1" variant="flat" class="font-weight-600">
      Recurrente
    </v-chip>
    <v-chip
  v-else-if="row.asesorNombre || row.convenioNombre"
  size="x-small" color="blue-darken-1" variant="flat" class="font-weight-600">
  Continuidad
</v-chip>
<v-chip
  v-else-if="row.estado === 'finalizado'"
  size="x-small" color="grey-darken-1" variant="flat" class="font-weight-600">
  Fachada
</v-chip>
<v-chip
  :color="row.estado === 'finalizado' ? 'success' : row.estado === 'cancelado' ? 'error' : 'warning'"
      size="small" label class="text-capitalize">
      {{ row.estado }}
    </v-chip>
  </div>
</template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Vehículos -->
            <v-col cols="12">
              <v-card variant="outlined" class="rounded-lg">
                <v-card-title class="text-subtitle-1 font-weight-bold">Vehículos</v-card-title>
                <v-card-text>
                  <v-table density="comfortable">
                    <thead>
                      <tr>
                        <th class="text-left">ID</th>
                        <th class="text-left">Placa</th>
                        <th class="text-left">Marca</th>
                        <th class="text-left">Línea</th>
                        <th class="text-left">Modelo</th>
                        <th class="text-left">Color</th>
                        <th class="text-left">Matrícula</th>
                        <th class="text-left">Clase</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="v in detalle.vehiculos" :key="v.id">
                        <td>{{ v.id }}</td>
                        <td>{{ v.placa }}</td>
                        <td>{{ v.marca ?? '—' }}</td>
                        <td>{{ v.linea ?? '—' }}</td>
                        <td>{{ v.modelo ?? '—' }}</td>
                        <td>{{ getVehiculoProp(v, 'color') }}</td>
                        <td>{{ getVehiculoProp(v, 'matricula') }}</td>
                        <td>{{ v.clase?.nombre ?? '—' }}</td>
                      </tr>
                      <tr v-if="!detalle.vehiculos?.length">
                        <td colspan="8" class="text-medium-emphasis">Sin vehículos</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div v-else class="text-medium-emphasis my-6">
            No se encontró información del cliente.
          </div>
        </template>
      </v-card-text>
    </v-card>

    <v-btn class="fab-back d-md-none" icon="mdi-arrow-left" color="primary" size="large" @click="goBack"/>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClientesService, type ClienteDetalle, type ClienteHistorialItem } from '@/services/clientes_service'
import { etiquetaConvenio } from '@/services/conveniosService'

type UltimaVisitaPorVehiculo = {
  vehiculoId: number
  placa: string
  fecha: string | null
  servicioNombre: string | null
  estado: string | null
  sedeNombre: string | null
  asesorNombre?: string | null
  convenioNombre?: string | null
  convenioEstablecimiento?: string | null
  esRecurrente?: boolean | null
  esRecuperacion?: boolean | null
}

type VisitaReciente = {
  id: number
  fecha: string
  placa: string
  estado: string
  servicioNombre: string | null
  sedeNombre: string | null
  asesorNombre?: string | null
  convenioNombre?: string | null
  convenioEstablecimiento?: string | null
  esRecurrente?: boolean | null
  esRecuperacion?: boolean | null
}
type ClienteDetalleExtendido = ClienteDetalle & {
  ultimas_por_vehiculo?: UltimaVisitaPorVehiculo[]
  visitas_recientes?: VisitaReciente[]
  metricas?: Stats
  kpis?: Stats
}

type Stats = {
  vehiculos_count?: number
  visitas_count?: number
  ultima_visita_at?: string | null
  dias_desde_ultima_visita?: number | null
}

type VehiculoExtendido = ClienteDetalle['vehiculos'][number] & {
  color?: string | null
  matricula?: string | null
}

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const loading = ref(true)
const errorMsg = ref<string | null>(null)
const detalle = ref<ClienteDetalleExtendido | null>(null)
const visitas = ref<ClienteHistorialItem[]>([])

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'ClientesList' })
}

function irEditar() {
  router.push({ name: 'ClienteEditar', params: { id } }).catch(() => {})
}

/** dd/MM/yyyy zona Bogotá (string 'YYYY-MM-DD' o ISO) */
function formatDate(v?: string | null): string {
  if (!v) return '—'
  const iso = String(v).length <= 10 ? `${v}T00:00:00` : String(v)
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(d)
}

/** Helper para acceder a propiedades extendidas del vehículo */
function getVehiculoProp(vehiculo: ClienteDetalle['vehiculos'][number], prop: 'color' | 'matricula'): string {
  const vehiculoExt = vehiculo as VehiculoExtendido
  return vehiculoExt[prop] ?? '—'
}

/** métrica: usa metricas o kpis */
const stats = computed<Stats | null>(() => {
  if (!detalle.value) return null
  return detalle.value.metricas ?? detalle.value.kpis ?? null
})

async function load() {
  loading.value = true
  errorMsg.value = null
  try {
    const [det, hist] = await Promise.all([
      ClientesService.detalle(id),
      ClientesService.historial(id, { page: 1, perPage: 5 }),
    ])
    detalle.value = det as ClienteDetalleExtendido

    // Si el backend ya trae visitas_recientes, úsala; si no, usa historial (compatibilidad)
    const detalleExt = det as ClienteDetalleExtendido
    if (detalleExt.visitas_recientes?.length) {
      visitas.value = detalleExt.visitas_recientes as ClienteHistorialItem[]
    } else {
      visitas.value = hist.data
    }
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Error cargando detalle'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.text-medium-emphasis {
  opacity: 0.7;
}
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-radius: 12px;
}
.fab-back {
  position: fixed;
  left: 16px;
  bottom: 16px;
  z-index: 10;
}
.gap-2 {
  gap: 8px;
}
</style>
