<!--
"Mi gestión" — asesor ASESOR_TELEMERCADEO: metas del mes (avance y ritmo),
pendientes de seguimiento, historial y registro de gestiones.
-->
<template>
  <v-container fluid class="pa-4 tele-mi-gestion">
    <div class="d-flex align-center flex-wrap ga-2 mb-4">
      <v-icon size="28" class="mr-1">mdi-headset</v-icon>
      <div>
        <h2 class="text-h6 font-weight-bold mb-0">Mi gestión · Telemercadeo</h2>
        <div class="text-caption text-medium-emphasis">
          {{ resumen?.agente.nombre || '' }}
          <template v-if="resumen"> · {{ resumen.gestiones_hoy }} gestión(es) hoy</template>
        </div>
      </div>
      <v-spacer />
      <v-select
        v-model="mesSel"
        :items="mesesItems"
        label="Mes"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 200px"
        @update:model-value="cargarResumen"
      />
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-phone-log"
        @click="abrirRegistro()"
      >
        Registrar gestión
      </v-btn>
    </div>

    <v-alert v-if="errorResumen" type="error" variant="tonal" class="mb-4" closable @click:close="errorResumen = ''">
      {{ errorResumen }}
    </v-alert>

    <!-- Metas del mes -->
    <v-row class="mb-2">
      <v-col v-for="m in METRICAS" :key="m.key" cols="12" md="4">
        <v-skeleton-loader v-if="cargandoResumen && !resumen" type="card" />
        <MetaTarjeta v-else :titulo="m.titulo" :icono="m.icono" :meta="resumen?.metas[m.key]" />
      </v-col>
    </v-row>

    <!-- Pendientes de seguimiento -->
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="warning">mdi-bell-ring-outline</v-icon>
        Pendientes de seguimiento
        <v-chip size="small" class="ml-2" variant="tonal">{{ pendientesTotal }}</v-chip>
        <v-spacer />
        <v-btn size="small" variant="text" icon="mdi-refresh" :loading="cargandoPendientes" @click="cargarPendientes" />
      </v-card-title>
      <v-card-subtitle class="pb-2">
        Última gestión de un ciclo abierto con resultado “Sin respuesta”, “Volver a llamar” o
        “Interesado” y próximo contacto vencido o sin fecha.
      </v-card-subtitle>
      <v-data-table-server
        :headers="headersPendientes"
        :items="pendientes"
        :items-length="pendientesTotal"
        :loading="cargandoPendientes"
        :items-per-page="pendientesPag.itemsPerPage"
        :page="pendientesPag.page"
        :items-per-page-options="[5, 10, 25]"
        item-value="id"
        density="compact"
        @update:options="onPendientesOptions"
      >
        <template #item.placa="{ item }">
          <strong>{{ item.placa }}</strong>
          <div class="text-caption text-medium-emphasis">{{ item.cliente_nombre || 'Sin cliente' }}</div>
        </template>
        <template #item.resultado="{ item }">
          <v-chip size="x-small" :color="colorResultado(item.resultado)" variant="tonal">
            {{ etiquetaResultado(item.resultado) }}
          </v-chip>
          <div class="text-caption text-medium-emphasis">{{ fmtFechaHora(item.created_at) }}</div>
        </template>
        <template #item.proximo_contacto_at="{ item }">
          {{ item.proximo_contacto_at ? fmtFecha(item.proximo_contacto_at) : 'Sin fecha' }}
        </template>
        <template #item.seguimiento="{ item }">
          {{ textoSeguimiento(item.seguimiento.numero_en_ciclo, item.seguimiento.limite) }}
        </template>
        <template #item.acciones="{ item }">
          <div class="d-flex ga-1 justify-end">
            <v-btn
              size="small"
              variant="tonal"
              prepend-icon="mdi-phone-log"
              :disabled="seguimientoAgotado(item.seguimiento.numero_en_ciclo, item.seguimiento.limite)"
              @click="abrirRegistro(item.placa, item.telefono)"
            >
              Nueva gestión
            </v-btn>
            <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-note-plus-outline" @click="datear(item)">
              Datear
            </v-btn>
          </div>
        </template>
        <template #no-data>
          <div class="py-4 text-center text-medium-emphasis">No tienes seguimientos pendientes.</div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Historial -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-history</v-icon>
        Historial de mis gestiones
      </v-card-title>
      <GestionesTabla ref="tablaRef" modo="asesor" @datear="datear" />
    </v-card>

    <RegistrarGestionDialog
      v-model="registroAbierto"
      :placa-inicial="registroPlaca"
      :telefono-inicial="registroTelefono"
      @registrada="onRegistrada"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { HttpError } from '@/services/http'
import {
  getMiResumen,
  listGestiones,
  type Gestion,
  type MetricaMeta,
  type MiResumen,
  type RegistrarGestionResp,
} from '@/services/telemercadeoService'
import {
  colorResultado,
  etiquetaResultado,
  fmtFecha,
  fmtFechaHora,
  mesActualBogota,
  mesAnterior,
  nombreMes,
  seguimientoAgotado,
  textoSeguimiento,
} from './telemercadeoHelpers'
import GestionesTabla from './components/GestionesTabla.vue'
import MetaTarjeta from './components/MetaTarjeta.vue'
import RegistrarGestionDialog from './components/RegistrarGestionDialog.vue'

const router = useRouter()

const METRICAS: { key: MetricaMeta; titulo: string; icono: string }[] = [
  { key: 'gestiones', titulo: 'Gestiones', icono: 'mdi-phone-log' },
  { key: 'dateos', titulo: 'Dateos', icono: 'mdi-note-plus-outline' },
  { key: 'exitosos', titulo: 'Dateos exitosos', icono: 'mdi-check-decagram' },
]

/* ── Mes (Bogotá) ── */
const actual = mesActualBogota()
const mesesItems = (() => {
  const items: { title: string; value: string }[] = []
  let m = actual
  for (let i = 0; i < 6; i++) {
    items.push({ title: nombreMes(m.mes, m.anio), value: `${m.anio}-${m.mes}` })
    m = mesAnterior(m)
  }
  return items
})()
const mesSel = ref(`${actual.anio}-${actual.mes}`)

/* ── Resumen ── */
const resumen = ref<MiResumen | null>(null)
const cargandoResumen = ref(false)
const errorResumen = ref('')

async function cargarResumen() {
  const [anio, mes] = mesSel.value.split('-').map(Number)
  cargandoResumen.value = true
  errorResumen.value = ''
  try {
    resumen.value = await getMiResumen(mes, anio)
  } catch (e) {
    errorResumen.value =
      e instanceof HttpError && e.status === 403
        ? 'Tu usuario no tiene un agente de Telemercadeo asociado.'
        : 'No se pudo cargar tu resumen del mes.'
  } finally {
    cargandoResumen.value = false
  }
}

/* ── Pendientes ── */
const pendientes = ref<Gestion[]>([])
const pendientesTotal = ref(0)
const cargandoPendientes = ref(false)
const pendientesPag = ref({ page: 1, itemsPerPage: 5 })
const headersPendientes = [
  { title: 'Placa', key: 'placa', sortable: false },
  { title: 'Teléfono', key: 'telefono', sortable: false },
  { title: 'Último resultado', key: 'resultado', sortable: false },
  { title: 'Próximo contacto', key: 'proximo_contacto_at', sortable: false },
  { title: 'Seguimiento', key: 'seguimiento', sortable: false },
  { title: '', key: 'acciones', sortable: false, align: 'end' as const },
]
let ctrlPend: AbortController | null = null

async function cargarPendientes() {
  ctrlPend?.abort()
  ctrlPend = new AbortController()
  cargandoPendientes.value = true
  try {
    const r = await listGestiones(
      { pendientes: true, page: pendientesPag.value.page, per_page: pendientesPag.value.itemsPerPage },
      ctrlPend.signal,
    )
    pendientes.value = r.data
    pendientesTotal.value = r.meta.total
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    pendientes.value = []
    pendientesTotal.value = 0
  } finally {
    cargandoPendientes.value = false
  }
}

function onPendientesOptions(o: { page: number; itemsPerPage: number }) {
  pendientesPag.value = { page: o.page, itemsPerPage: o.itemsPerPage }
  cargarPendientes()
}

/* ── Registro ── */
const registroAbierto = ref(false)
const registroPlaca = ref<string | null>(null)
const registroTelefono = ref<string | null>(null)
const tablaRef = ref<InstanceType<typeof GestionesTabla> | null>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

function abrirRegistro(placa: string | null = null, telefono: string | null = null) {
  registroPlaca.value = placa
  registroTelefono.value = telefono
  registroAbierto.value = true
}

function onRegistrada(r: RegistrarGestionResp) {
  snackbar.value = r.repetida
    ? { show: true, color: 'info', text: 'Esa gestión ya estaba registrada; no se duplicó.' }
    : {
        show: true,
        color: 'success',
        text: `Gestión registrada · ${textoSeguimiento(r.seguimiento.n, r.seguimiento.limite)}`,
      }
  tablaRef.value?.recargar()
  cargarPendientes()
  cargarResumen()
}

function datear(g: Gestion) {
  router.push({
    name: 'ComercialDateosNuevo',
    query: {
      placa: g.placa,
      ...(g.telefono ? { telefono: g.telefono } : {}),
      gestion_id: String(g.id),
    },
  })
}

onMounted(cargarResumen)
onBeforeUnmount(() => ctrlPend?.abort())
</script>

<style scoped>
.tele-mi-gestion {
  align-self: flex-start;
}
</style>
