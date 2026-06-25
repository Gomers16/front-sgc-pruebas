<template>
  <v-container class="mt-4 mt-sm-6" fluid>

    <!-- Header -->
    <v-card elevation="8" class="pa-0 rounded-xl rounded-sm-2xl mb-4">
      <div class="px-4 px-sm-6 py-3 py-sm-5 d-flex align-center" style="gap:12px">
        <v-btn icon="mdi-arrow-left" variant="text" @click="$router.back()" />
        <div>
          <h2 class="text-h6 text-sm-h5 font-weight-bold">Reporte de Caja</h2>
          <p class="text-caption text-medium-emphasis d-none d-sm-block">Ingresos por rango de fechas</p>
        </div>
      </div>

      <v-divider class="mx-4 mx-sm-6" />

      <!-- Filtros -->
      <div class="pa-4 pa-sm-6">
        <!-- Botones rápidos -->
        <div class="d-flex flex-wrap mb-4" style="gap:8px">
          <v-btn
            v-for="acc in accionesRapidas"
            :key="acc.label"
            size="small"
            variant="tonal"
            color="primary"
            @click="aplicarRango(acc)"
          >
            {{ acc.label }}
          </v-btn>
        </div>

        <!-- Rango personalizado + Consultar -->
        <v-row dense align="center">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="fechaInicio"
              label="Desde"
              type="date"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-calendar-start"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="fechaFin"
              label="Hasta"
              type="date"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-calendar-end"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-btn
              color="primary"
              variant="elevated"
              block
              :loading="cargando"
              :disabled="!fechaInicio || !fechaFin"
              prepend-icon="mdi-magnify"
              @click="consultar"
            >
              Consultar
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </v-card>

    <!-- Estado vacío inicial -->
    <div v-if="!reporte && !cargando && !error" class="text-center text-medium-emphasis py-12">
      <v-icon size="48" class="mb-3">mdi-cash-register</v-icon>
      <div>Selecciona un rango de fechas y pulsa Consultar</div>
    </div>

    <!-- Error -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <template v-if="reporte">

      <!-- Nivel 1: Métricas -->
      <v-row dense class="mb-4">
        <v-col cols="12" sm="6" md="3">
          <v-card elevation="4" class="rounded-xl pa-4 h-100" color="primary" variant="tonal">
            <div class="text-caption text-medium-emphasis mb-1">TOTAL INGRESADO</div>
            <div class="text-h5 font-weight-bold">{{ formatPeso(reporte.totalIngresado) }}</div>
            <div class="text-caption mt-1">{{ reporte.liquidaciones.length }} liquidación(es)</div>
          </v-card>
        </v-col>
        <v-col
          v-for="(valor, forma) in reporte.porFormaPago"
          :key="forma"
          cols="12" sm="6" md="3"
        >
          <v-card elevation="4" class="rounded-xl pa-4 h-100" :color="colorForma(String(forma))" variant="tonal">
            <div class="text-caption text-medium-emphasis mb-1">{{ String(forma).toUpperCase() }}</div>
            <div class="text-h5 font-weight-bold">{{ formatPeso(valor) }}</div>
            <div class="text-caption mt-1">{{ pctFormaPago(valor) }}% del total</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Sin resultados -->
      <div v-if="reporte.liquidaciones.length === 0" class="text-center text-medium-emphasis py-10">
        <v-icon size="40" class="mb-2">mdi-inbox-outline</v-icon>
        <div>No hay pagos registrados en este período</div>
      </div>

      <!-- Nivel 2 + 3: Liquidaciones -->
      <v-card
        v-for="liq in reporte.liquidaciones"
        :key="liq.tramiteLiquidacionId"
        elevation="4"
        class="rounded-xl mb-3"
      >
        <v-card-text class="pa-4">
          <div class="d-flex align-center justify-space-between flex-wrap" style="gap:8px">

            <!-- Info -->
            <div>
              <div class="d-flex align-center flex-wrap" style="gap:8px">
                <v-chip size="x-small" variant="tonal" color="indigo">Turno #{{ liq.turnoNumero }}</v-chip>
                <span class="text-body-1 font-weight-bold">{{ liq.placa ?? '—' }}</span>
                <v-chip size="x-small" variant="tonal" color="grey">{{ liq.tipoTramite ?? '—' }}</v-chip>
                <v-chip size="small" variant="tonal" :color="estadoColor[liq.estado]">
                  {{ estadoLabel[liq.estado] }}
                </v-chip>
              </div>
              <div class="text-body-2 text-medium-emphasis mt-1">{{ liq.nombreCliente ?? '—' }}</div>
            </div>

            <!-- Montos + toggle -->
            <div class="d-flex align-center flex-wrap" style="gap:12px">
              <div class="text-right">
                <div class="text-caption text-medium-emphasis">Abonado en período</div>
                <div class="text-body-1 font-weight-bold text-primary">{{ formatPeso(liq.abonadoEnPeriodo) }}</div>
              </div>
              <div class="text-right">
                <div class="text-caption text-medium-emphasis">Saldo actual</div>
                <div
                  class="text-body-2 font-weight-bold"
                  :class="liq.saldoPendienteActual > 0 ? 'text-orange-darken-3' : 'text-green-darken-2'"
                >
                  {{ liq.saldoPendienteActual > 0 ? formatPeso(liq.saldoPendienteActual) : 'Pagado' }}
                </div>
              </div>
              <v-btn
                :icon="expandido.has(liq.tramiteLiquidacionId) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                variant="text"
                size="small"
                @click="toggleExpand(liq.tramiteLiquidacionId)"
              />
            </div>
          </div>

          <!-- Nivel 3: Pagos del período -->
          <v-expand-transition>
            <div v-if="expandido.has(liq.tramiteLiquidacionId)" class="mt-3">
              <v-divider class="mb-3" />
              <div class="text-caption text-medium-emphasis mb-2">Pagos en el período</div>
              <v-table density="compact" class="rounded-lg">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Forma de pago</th>
                    <th>Referencia</th>
                    <th>Evidencia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="pago in liq.pagosEnPeriodo" :key="pago.id">
                    <td>{{ pago.fecha ?? '—' }}</td>
                    <td class="font-weight-bold">{{ formatPeso(pago.monto) }}</td>
                    <td>{{ pago.formaPago ?? '—' }}</td>
                    <td class="text-medium-emphasis">{{ pago.referenciaPago ?? '—' }}</td>
                    <td>
                      <v-btn
                        v-if="pago.evidenciaUrl"
                        icon="mdi-image-outline"
                        size="x-small"
                        variant="tonal"
                        color="teal"
                        @click="abrirEvidencia(pago.evidenciaUrl)"
                      />
                      <span v-else class="text-medium-emphasis">—</span>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-expand-transition>

        </v-card-text>
      </v-card>

    </template>

    <!-- Dialog evidencia -->
    <v-dialog v-model="dialogEvidencia" max-width="800">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <span class="text-subtitle-1 font-weight-bold">Evidencia de pago</span>
          <v-btn icon="mdi-close" variant="text" @click="dialogEvidencia = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-img
            :src="evidenciaActiva ?? ''"
            max-height="600"
            contain
          />
        </v-card-text>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ReporteCajaService, type ReporteCaja } from '@/services/reporteCajaService'

const dialogEvidencia = ref(false)
const evidenciaActiva = ref<string | null>(null)

function abrirEvidencia(url: string | null) {
  evidenciaActiva.value = url
  dialogEvidencia.value = true
}

// ── Constantes ────────────────────────────────────────────────────────────────

const estadoColor: Record<string, string> = {
  pendiente: 'orange',
  parcial:   'yellow-darken-3',
  pagado:    'green',
}

const estadoLabel: Record<string, string> = {
  pendiente: 'Pendiente',
  parcial:   'Parcial',
  pagado:    'Pagado',
}

const FORMA_COLORES: Record<string, string> = {
  Efectivo:      'green',
  Transferencia: 'blue',
  'Datáfono':    'purple',
}

// ── Estado ────────────────────────────────────────────────────────────────────

const fechaInicio = ref(hoy())
const fechaFin    = ref(hoy())
const cargando    = ref(false)
const error       = ref('')
const reporte     = ref<ReporteCaja | null>(null)
const expandido   = reactive(new Set<number>())

// ── Helpers de fecha ──────────────────────────────────────────────────────────

function hoy(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

const accionesRapidas = [
  {
    label: 'Hoy',
    calc: () => ({ inicio: hoy(), fin: hoy() }),
  },
  {
    label: 'Esta semana',
    calc: () => {
      const d   = new Date()
      const day = d.getDay() || 7
      const lun = new Date(d)
      lun.setDate(d.getDate() - day + 1)
      return { inicio: lun.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }), fin: hoy() }
    },
  },
  {
    label: 'Este mes',
    calc: () => {
      const inicio = hoy().slice(0, 7) + '-01'
      return { inicio, fin: hoy() }
    },
  },
]

function aplicarRango(acc: { calc: () => { inicio: string; fin: string } }) {
  const { inicio, fin } = acc.calc()
  fechaInicio.value = inicio
  fechaFin.value    = fin
}

// ── Consulta ──────────────────────────────────────────────────────────────────

async function consultar() {
  if (!fechaInicio.value || !fechaFin.value) return
  cargando.value = true
  error.value    = ''
  expandido.clear()
  try {
    reporte.value = await ReporteCajaService.getReporteCaja(fechaInicio.value, fechaFin.value)
  } catch (err) {
    error.value   = err instanceof Error ? err.message : 'Error al obtener el reporte'
    reporte.value = null
  } finally {
    cargando.value = false
  }
}

// ── Helpers de presentación ───────────────────────────────────────────────────

function formatPeso(valor: number): string {
  return `$ ${new Intl.NumberFormat('es-CO').format(Math.round(valor ?? 0))}`
}

function colorForma(forma: string): string {
  return FORMA_COLORES[forma] ?? 'secondary'
}

function pctFormaPago(valor: number): string {
  if (!reporte.value || reporte.value.totalIngresado === 0) return '0'
  return ((valor / reporte.value.totalIngresado) * 100).toFixed(1)
}

function toggleExpand(id: number) {
  if (expandido.has(id)) expandido.delete(id)
  else expandido.add(id)
}
</script>
