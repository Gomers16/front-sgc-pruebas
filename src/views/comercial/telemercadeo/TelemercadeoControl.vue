<!--
Control de Telemercadeo (SUPER_ADMIN / GERENCIA): Resumen, Gestiones y
ciclos (autorizar seguimiento extra) y Metas y configuración.
-->
<template>
  <v-container fluid class="pa-4 tele-control">
    <div class="d-flex align-center flex-wrap ga-2 mb-4">
      <v-icon size="28" class="mr-1">mdi-chart-box-outline</v-icon>
      <div>
        <h2 class="text-h6 font-weight-bold mb-0">Control de Telemercadeo</h2>
        <div class="text-caption text-medium-emphasis">
          Gestiones, procedencia, metas por asesor y seguimientos por ciclo.
        </div>
      </div>
    </div>

    <v-alert v-if="errorAsesores" type="warning" variant="tonal" class="mb-3">{{ errorAsesores }}</v-alert>

    <v-card>
      <v-tabs v-model="tab" color="primary" show-arrows>
        <v-tab value="resumen" prepend-icon="mdi-chart-bar">Resumen</v-tab>
        <v-tab value="gestiones" prepend-icon="mdi-format-list-bulleted">Gestiones y ciclos</v-tab>
        <v-tab v-if="can.configurarSeguimientosTele()" value="metas" prepend-icon="mdi-target">
          Metas y configuración
        </v-tab>
      </v-tabs>
      <v-divider />
      <v-window v-model="tab">
        <v-window-item value="resumen">
          <ControlResumen :asesores="asesores" @ver-historial="verHistorial" />
        </v-window-item>
        <v-window-item value="gestiones">
          <GestionesTabla
            ref="tablaRef"
            modo="control"
            :asesores="asesores"
            :agente-id-inicial="drill.agenteId"
            :desde-inicial="drill.desde"
            :hasta-inicial="drill.hasta"
            @autorizar="abrirAutorizar"
          />
        </v-window-item>
        <v-window-item v-if="can.configurarSeguimientosTele()" value="metas">
          <ControlMetasConfig :asesores="asesores" />
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Autorizar seguimiento extra (motivo obligatorio) -->
    <v-dialog :model-value="autorizar !== null" max-width="520" persistent>
      <v-card v-if="autorizar">
        <v-card-title>Autorizar seguimiento extra</v-card-title>
        <v-card-text>
          <div class="text-body-2 mb-3">
            <strong>{{ autorizar.placa }}</strong> ({{ autorizar.cliente_nombre || 'sin cliente' }}) ya tiene
            {{ autorizar.seguimiento.numero_en_ciclo }} de {{ autorizar.seguimiento.limite }} seguimientos en el
            ciclo. Al autorizar, el límite del ciclo sube a {{ autorizar.seguimiento.limite + 1 }}. Queda
            registrado quién y cuándo.
          </div>
          <v-textarea
            v-model="motivo"
            label="Motivo *"
            variant="outlined"
            rows="3"
            counter="500"
            maxlength="500"
            :error-messages="motivoError"
            :disabled="autorizando"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="autorizando" @click="autorizar = null">Cancelar</v-btn>
          <v-btn color="warning" variant="flat" :loading="autorizando" :disabled="autorizando" @click="confirmarAutorizar">
            Autorizar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">{{ snackbar.text }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { usePermissions } from '@/composables/usePermissions'
import { HttpError } from '@/services/http'
import {
  autorizarSeguimientoExtra,
  listAsesoresTele,
  type AsesorTele,
  type Gestion,
} from '@/services/telemercadeoService'
import ControlMetasConfig from './components/ControlMetasConfig.vue'
import ControlResumen from './components/ControlResumen.vue'
import GestionesTabla from './components/GestionesTabla.vue'

const { can } = usePermissions()

const tab = ref<'resumen' | 'gestiones' | 'metas'>('resumen')
const asesores = ref<AsesorTele[]>([])
const errorAsesores = ref('')
const drill = reactive({ agenteId: null as number | null, desde: null as string | null, hasta: null as string | null })
const tablaRef = ref<InstanceType<typeof GestionesTabla> | null>(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

function verHistorial(p: { agenteId: number; desde: string; hasta: string }) {
  drill.agenteId = p.agenteId
  drill.desde = p.desde
  drill.hasta = p.hasta
  tab.value = 'gestiones'
}

/* ── Autorizar extra ── */
const autorizar = ref<Gestion | null>(null)
const motivo = ref('')
const motivoError = ref('')
const autorizando = ref(false)

function abrirAutorizar(g: Gestion) {
  autorizar.value = g
  motivo.value = ''
  motivoError.value = ''
}

async function confirmarAutorizar() {
  if (autorizando.value || !autorizar.value) return
  const m = motivo.value.trim()
  if (m.length < 5) {
    motivoError.value = 'Escribe el motivo (mínimo 5 caracteres).'
    return
  }
  autorizando.value = true
  try {
    const r = await autorizarSeguimientoExtra(autorizar.value.seguimiento.ciclo_id, m)
    snackbar.value = {
      show: true,
      color: 'success',
      text: `Autorizado: el ciclo de ${autorizar.value.placa} admite un seguimiento más (${r.extras_autorizados} extra(s) autorizado(s) en total).`,
    }
    autorizar.value = null
    tablaRef.value?.recargar()
  } catch (e) {
    const code = e instanceof HttpError ? (e.data as { code?: string } | undefined)?.code : undefined
    motivoError.value =
      code === 'CICLO_CERRADO'
        ? 'El ciclo ya se cerró (dateado, turno o vencido); no se puede autorizar.'
        : e instanceof HttpError
          ? e.message
          : 'No se pudo autorizar.'
  } finally {
    autorizando.value = false
  }
}

onMounted(async () => {
  try {
    asesores.value = await listAsesoresTele()
  } catch {
    errorAsesores.value = 'No se pudo cargar la lista de asesores de Telemercadeo.'
  }
})
</script>

<style scoped>
.tele-control {
  align-self: flex-start;
}
</style>
