<template>
  <v-card variant="outlined" class="pa-3 rounded-lg" data-test="desglose-comision">
    <div class="d-flex align-center flex-wrap mb-1" style="gap: 6px">
      <span class="text-subtitle-2 font-weight-bold">{{ titulo }}</span>
      <v-chip
        size="x-small"
        variant="flat"
        :color="colorEstadoComision(estadoChip)"
        data-test="desglose-estado"
      >
        {{ estadoChip }}
      </v-chip>
      <v-spacer />
      <slot name="acciones" />
    </div>

    <v-table density="compact" class="desglose-tabla" data-test="desglose-beneficiarios">
      <tbody>
        <tr v-for="b in desglose.beneficiarios" :key="b.rol">
          <td>
            <div class="text-body-2">{{ b.nombre ?? '—' }}</div>
            <div class="text-caption text-medium-emphasis">{{ ETIQUETA_ROL[b.rol] }}</div>
          </td>
          <!-- Cada monto no se parte; en pantallas angostas el "después" baja de línea. -->
          <td class="text-right">
            <span v-if="b.antes !== null" class="monto text-medium-emphasis"
              >{{ fmt(b.antes) }} →</span
            >
            {{ ' ' }}
            <strong class="monto" :class="claseDiferencia(diferenciaBeneficiario(b))">{{
              fmt(b.despues)
            }}</strong>
          </td>
        </tr>
      </tbody>
    </v-table>

    <div class="text-body-2 mt-1" data-test="desglose-diferencia">
      <template v-if="diferencia === null">
        Estimado: <strong>{{ fmt(totalDespues(desglose)) }}</strong>
      </template>
      <template v-else-if="diferencia === 0">Sin cambio</template>
      <template v-else>
        Diferencia:
        <strong :class="claseDiferencia(diferencia)">
          {{ diferencia > 0 ? '+' : '−' }}{{ fmt(Math.abs(diferencia)) }}
        </strong>
      </template>
    </div>

    <v-alert
      v-for="a in avisos"
      :key="a.codigo"
      :type="a.tipo"
      variant="tonal"
      density="compact"
      class="mt-1 text-caption"
      :data-test="`desglose-aviso-${a.codigo}`"
    >
      {{ a.texto }}
    </v-alert>

    <v-expansion-panels variant="accordion" flat class="mt-2" data-test="desglose-panel">
      <v-expansion-panel>
        <v-expansion-panel-title class="px-2 py-1 text-body-2" style="min-height: 36px">
          Ver cómo se calculó
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="text-body-2 mb-1" data-test="desglose-caso">
            <strong>{{ desglose.casoTexto }}</strong>
            · {{ desglose.escenarioTexto }}
            <template v-if="desglose.tipoVehiculo">
              · {{ desglose.tipoVehiculo === 'MOTO' ? 'Moto' : 'Carro' }}
            </template>
            <v-chip
              v-if="!desglose.estimado && !desglose.recalculado"
              size="x-small"
              color="grey"
              variant="tonal"
              class="ml-1"
            >
              Sin recalcular
            </v-chip>
          </div>
          <div v-if="desglose.continuidad.aplica" class="text-caption mb-1">
            <strong>Continuidad:</strong> {{ desglose.continuidad.texto }}
          </div>
          <div class="text-caption mb-2" data-test="desglose-descuento">
            <strong>Descuento:</strong> {{ desglose.descuento.codigo ?? 'ninguno' }} ·
            {{ desglose.descuento.origenTexto }}
            <v-chip
              v-if="desglose.descuento.esAvance"
              size="x-small"
              color="orange-darken-2"
              variant="tonal"
              class="ml-1"
            >
              Cuenta como Avance: el convenio cobró en la factura
            </v-chip>
          </div>

          <div class="mb-2" data-test="desglose-regla">
            <div class="text-body-2">{{ desglose.explicacion }}</div>
            <div v-if="desglose.regla" class="text-caption text-medium-emphasis regla">
              Regla: {{ desglose.regla }}
            </div>
            <div
              v-if="desglose.reglaGuardada && desglose.reglaGuardada !== desglose.regla"
              class="text-caption text-medium-emphasis regla"
            >
              Regla guardada hoy: {{ desglose.reglaGuardada }}
            </div>
          </div>

          <div class="text-caption mb-1"><strong>Configuración que usó</strong></div>
          <div
            v-for="v in desglose.configuracion"
            :key="v.campo"
            class="text-caption d-flex flex-wrap align-center"
            style="gap: 4px"
            data-test="desglose-config"
          >
            <span :class="{ 'text-medium-emphasis': !v.usado }">{{ v.etiqueta }}:</span>
            <strong :class="{ 'text-red-darken-2': v.usado && v.valor === 0 }">{{
              fmt(v.valor)
            }}</strong>
            <span class="text-medium-emphasis">({{ origenValorConfig(v) }})</span>
            <v-chip v-if="!v.usado" size="x-small" variant="text" class="px-1"
              >no interviene</v-chip
            >
          </div>

          <v-alert
            v-for="a in desglose.alertas"
            :key="a.codigo + a.mensaje"
            :type="a.tipo"
            variant="tonal"
            density="compact"
            class="mt-2 text-caption"
            :data-test="`desglose-alerta-${a.codigo}`"
          >
            {{ a.mensaje }}
          </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script setup lang="ts">
// Desglose de la comisión: por defecto solo quién cobra (antes → después),
// la diferencia, el estado y los avisos que importan; el caso, el descuento,
// la regla, la configuración y la explicación quedan en "Ver cómo se calculó".
import { computed } from 'vue'
import {
  ETIQUETA_ROL,
  avisosVisibles,
  colorEstadoComision,
  diferenciaBeneficiario,
  diferenciaTotal,
  estadoVisible,
  origenValorConfig,
  totalDespues,
  type DesgloseComision,
} from '@/services/desgloseComision'

const props = withDefaults(
  defineProps<{
    desglose: DesgloseComision
    titulo?: string
    /** Estado de la comisión guardada (null o estimado → ESTIMADO). */
    estado?: string | null
    enLiquidacion?: boolean
  }>(),
  { titulo: 'Comisión según este descuento', estado: null, enLiquidacion: false },
)

const estadoChip = computed(() => estadoVisible(props.desglose, props.estado))
const diferencia = computed(() => diferenciaTotal(props.desglose))
const avisos = computed(() => avisosVisibles(props.desglose, props.estado, props.enLiquidacion))

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)

function claseDiferencia(d: number | null) {
  return d === null || d === 0 ? '' : d < 0 ? 'text-red-darken-2' : 'text-green-darken-2'
}
</script>

<style scoped>
.desglose-tabla :deep(td) {
  padding-left: 6px !important;
  padding-right: 6px !important;
}
.monto {
  white-space: nowrap;
}
.regla {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  word-break: break-word;
}
</style>
