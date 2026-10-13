<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
     <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">👤 Detalle del Prospecto</div>
        <div class="d-flex gap-2">
          <v-btn color="success" prepend-icon="mdi-pencil" @click="irEditar">Editar</v-btn>
          <v-btn color="primary" prepend-icon="mdi-arrow-left" @click="goBack">Volver</v-btn>
        </div>
      </v-card-title>

      <v-divider />

      <!-- Loading -->
      <v-card-text v-if="loading" class="py-12 text-center">
        <v-progress-circular indeterminate size="48" color="primary" />
        <div class="mt-4 text-subtitle-1">Cargando datos del prospecto...</div>
      </v-card-text>

      <!-- Contenido -->
      <v-card-text v-else-if="prospecto">
        <!-- Datos principales -->
        <v-row>
          <v-col cols="12" md="6">
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Nombre:</v-list-item-title>
                <v-list-item-subtitle>{{ prospecto.nombre || '—' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Teléfono:</v-list-item-title>
                <v-list-item-subtitle>{{ prospecto.telefono || '—' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Cédula:</v-list-item-title>
                <v-list-item-subtitle>{{ prospecto.cedula || '—' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Placa:</v-list-item-title>
                <v-list-item-subtitle>{{ prospecto.placa || '—' }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>

          <v-col cols="12" md="6">
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title class="font-weight-bold">Creado por:</v-list-item-title>
                <v-list-item-subtitle>
                  <template v-if="prospecto.asignacion_activa?.asesor">
                    {{ prospecto.asignacion_activa.asesor.nombre }}
                  </template>
                  <template v-else>—</template>
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title class="font-weight-bold">Origen:</v-list-item-title>
                <v-list-item-subtitle>{{ prospecto.origen || '—' }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title class="font-weight-bold">Fecha creación:</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(prospecto.created_at || prospecto.createdAt) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <v-list-item-title class="font-weight-bold">Última actualización:</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(prospecto.updated_at || prospecto.updatedAt) }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>

        <!-- Propietario + Convenio -->
        <v-row class="mt-1">
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="pa-4 rounded-lg">
              <div class="text-h6 mb-2">👥 Propietario del prospecto</div>
              <div>
                <strong>{{ prospecto.asignacion_activa?.asesor?.nombre || '—' }}</strong>
                <span v-if="prospecto.asignacion_activa?.fecha_asignacion" class="text-caption text-medium-emphasis">
                  · asignado el {{ formatDate(prospecto.asignacion_activa?.fecha_asignacion) }}
                </span>
              </div>
              <div class="mt-2">
                <v-chip
                  v-if="prospecto.asignacion_activa?.asesor?.tipo"
                  size="small"
                  variant="tonal"
                  prepend-icon="mdi-account-tie"
                >
                  {{ prettyTipo(prospecto.asignacion_activa?.asesor?.tipo) }}
                </v-chip>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card variant="outlined" class="pa-4 rounded-lg">
              <div class="text-h6 mb-2">📄 Convenio</div>
              <template v-if="convenioNombre || convenioCodigo">
                <v-chip size="small" color="deep-purple-accent-4" class="text-white" variant="elevated" prepend-icon="mdi-file-document-outline">
                  {{ convenioChip }}
                </v-chip>
              </template>
              <div v-else class="text-medium-emphasis">Sin convenio asociado.</div>
            </v-card>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <!-- Documentos -->
        <v-row>
          <v-col cols="12" md="6">
            <v-card outlined class="pa-4">
              <div class="text-h6 mb-2">🧾 SOAT</div>
              <v-chip :color="chipColor(soat.estado)" variant="flat" size="small">
                {{ chipText(soat.estado) }}
              </v-chip>
              <div class="mt-2 text-caption">
                Vencimiento: {{ soat.vencimiento || formatDate(prospecto.soat_vencimiento) || '—' }}
              </div>
              <div class="text-caption">
                Días restantes: <strong>{{ soat.dias_restantes ?? prospecto.diasSoatRestantes ?? '—' }}</strong>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card outlined class="pa-4">
              <div class="text-h6 mb-2">🛠️ RTM</div>
              <v-chip :color="chipColor(rtm.estado)" variant="flat" size="small">
                {{ chipText(rtm.estado) }}
              </v-chip>
              <div class="mt-2 text-caption">
                Vencimiento: {{ rtm.vencimiento || formatDate(prospecto.tecno_vencimiento) || '—' }}
              </div>
              <div class="text-caption">
                Días restantes: <strong>{{ rtm.dias_restantes ?? prospecto.diasTecnoRestantes ?? '—' }}</strong>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mt-2">
          <v-col cols="12" md="6">
            <v-card outlined class="pa-4">
              <div class="text-h6 mb-2">🧯 Preventiva</div>
              <v-chip :color="chipColor(preventiva.estado as EstadoVigencia)" variant="flat" size="small">
                {{ chipText(preventiva.estado as EstadoVigencia) }}
              </v-chip>
              <div class="mt-2 text-caption">
                Vencimiento: {{ preventiva.vencimiento || '—' }}
              </div>
              <div class="text-caption">
                Días restantes: <strong>{{ preventiva.dias_restantes ?? '—' }}</strong>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card outlined class="pa-4">
              <div class="text-h6 mb-2">🔍 Peritaje</div>
              <v-chip :color="peritaje.estado === 'registrado' ? 'success' : 'grey-darken-1'" variant="flat" size="small">
                {{ peritaje.estado === 'registrado' ? 'Registrado' : 'Sin datos' }}
              </v-chip>
              <div class="mt-2 text-caption">
                Último / Próximo: {{ peritaje.fecha || '—' }}
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <!-- Observaciones -->
        <v-card outlined class="pa-4">
          <div class="text-h6 mb-2">📝 Observaciones</div>
          <div>{{ prospecto.observaciones || 'Sin observaciones registradas.' }}</div>
        </v-card>

        <v-divider class="my-4" />

        <!-- Asesor asignado (detalle) -->
        <v-card outlined class="pa-4">
          <div class="text-h6 mb-2">👔 Asesor asignado</div>

          <template v-if="prospecto.asignacion_activa">
            <div class="mb-1">
              <strong>{{ prospecto.asignacion_activa.asesor?.nombre || '—' }}</strong>
              <span v-if="prospecto.asignacion_activa.asesor?.tipo" class="text-caption text-medium-emphasis">
                · {{ prettyTipo(prospecto.asignacion_activa.asesor?.tipo) }}
              </span>
            </div>
            <div class="text-caption text-medium-emphasis">
              Asignado el: {{ formatDate(prospecto.asignacion_activa.fecha_asignacion) }}
            </div>
          </template>

          <div v-else class="text-medium-emphasis">Sin asesor asignado.</div>
        </v-card>
      </v-card-text>

      <v-card-text v-else>
        <v-alert type="error" variant="tonal">❌ No se encontró información para este prospecto.</v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProspectoById, formatDate, type ProspectoDetail, type EstadoVigencia } from '@/services/prospectosService'
import { etiquetaConvenioConCodigo } from '@/services/conveniosService'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const prospecto = ref<ProspectoDetail | null>(null)

/* Chips helpers */
const badge = {
  vigente:   { text: 'Vigente',  color: 'success' },
  vencido:   { text: 'Vencido',  color: 'error' },
  sin_datos: { text: 'Sin datos', color: 'grey-darken-1' },
} as const
const chipColor = (e: EstadoVigencia) => badge[e]?.color || 'grey-darken-1'
const chipText  = (e: EstadoVigencia) => badge[e]?.text  || '—'

function prettyTipo(t?: string | null) {
  if (!t) return ''
  const map: Record<string, string> = {
    ASESOR_COMERCIAL: 'Asesor comercial',
    ASESOR_CONVENIO:  'Asesor convenio',
    TELEMERCADEO:     'Telemercadeo',
    SISTEMA:          'Sistema',
    USUARIO:          'Usuario',
  }
  return map[t] ?? t
}

/* Fallbacks si no llega resumenVigencias */
const soat = computed(() => {
  const rv = prospecto.value?.resumenVigencias?.soat
  if (rv) return rv
  const estado: EstadoVigencia =
    prospecto.value?.soat_vigente == null ? 'sin_datos' : (prospecto.value?.soat_vigente ? 'vigente' : 'vencido')
  return { estado, vencimiento: prospecto.value?.soat_vencimiento ?? null, dias_restantes: prospecto.value?.diasSoatRestantes ?? null }
})
const rtm = computed(() => {
  const rv = prospecto.value?.resumenVigencias?.rtm
  if (rv) return rv
  const estado: EstadoVigencia =
    prospecto.value?.tecno_vigente == null ? 'sin_datos' : (prospecto.value?.tecno_vigente ? 'vigente' : 'vencido')
  return { estado, vencimiento: prospecto.value?.tecno_vencimiento ?? null, dias_restantes: prospecto.value?.diasTecnoRestantes ?? null }
})
const preventiva = computed(() =>
  prospecto.value?.resumenVigencias?.preventiva ?? { estado: 'sin_datos' as const, vencimiento: null, dias_restantes: null }
)
const peritaje = computed(() =>
  prospecto.value?.resumenVigencias?.peritaje ?? { estado: 'sin_datos' as const, fecha: null }
)

/* Convenio chip (oculta SIN-COD) */
interface ConvenioData {
  convenio?: { nombre?: string; codigo?: string; establecimiento?: string | null } | null
  convenioNombre?: string | null
  convenioCodigo?: string | null
}

const convenioNombre = computed<string | null>(() => {
  const p = prospecto.value as ConvenioData | null
  return p?.convenio?.nombre ?? p?.convenioNombre ?? null
})
const convenioCodigo = computed<string | null>(() => {
  const p = prospecto.value as ConvenioData | null
  return p?.convenio?.codigo ?? p?.convenioCodigo ?? null
})
const convenioChip = computed<string>(() => {
  const p = prospecto.value as ConvenioData | null
  return etiquetaConvenioConCodigo({
    nombre: convenioNombre.value,
    establecimiento: p?.convenio?.establecimiento ?? null,
    codigo: convenioCodigo.value,
  })
})

async function fetchProspecto() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    prospecto.value = await getProspectoById(id)
  } catch (err) {
    console.error('❌ Error cargando prospecto:', err)
  } finally {
    loading.value = false
  }
}

function goBack() {
  const q = route.query.fromFicha ?? route.query.fromAsesor
  const fromFicha = q ? String(q) : null

  if (fromFicha) {
    router.push({
      name: 'FichaComercialAsesor',
      params: { id: String(fromFicha) }
    }).catch(() => {})
    return
  }

  router.push({ name: 'ComercialProspectos' }).catch(() => {})
}

function irEditar() {
  const id = Number(route.params.id)

  const q = route.query.fromFicha ?? route.query.fromAsesor
  const fromFicha = q ? String(q) : null

  router.push({
    name: 'ComercialProspectoEditar',
    params: { id },
    query: fromFicha ? { fromFicha: String(fromFicha) } : {}
  }).catch(() => {})
}

onMounted(fetchProspecto)
</script>

<style scoped>
.text-h5 { font-weight: bold; }
.rounded-lg { border-radius: 12px; }
.gap-2 { gap: 8px; }
</style>
