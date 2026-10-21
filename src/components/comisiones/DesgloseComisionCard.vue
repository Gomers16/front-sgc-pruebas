<template>
  <v-card variant="outlined" class="pa-3 rounded-lg" data-test="desglose-comision">
    <div class="d-flex align-center flex-wrap mb-2" style="gap: 6px">
      <span class="text-subtitle-2 font-weight-bold">{{ titulo }}</span>
      <v-chip
        v-if="desglose.estimado"
        size="x-small"
        color="indigo"
        variant="flat"
        data-test="desglose-estimado"
      >
        ESTIMADO
      </v-chip>
      <v-chip v-else-if="!desglose.recalculado" size="x-small" color="grey" variant="tonal">
        Sin recalcular
      </v-chip>
      <v-spacer />
      <slot name="acciones" />
    </div>

    <div class="text-body-2 mb-1" data-test="desglose-caso">
      <strong>{{ desglose.casoTexto }}</strong>
      · {{ desglose.escenarioTexto }}
      <template v-if="desglose.tipoVehiculo">
        · {{ desglose.tipoVehiculo === 'MOTO' ? 'Moto' : 'Carro' }}
      </template>
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
        El dateo trae marca de avance
      </v-chip>
    </div>

    <v-table density="compact" class="desglose-tabla mb-2" data-test="desglose-beneficiarios">
      <thead>
        <tr>
          <th>Quién cobra</th>
          <th class="text-right">{{ desglose.estimado ? '' : 'Antes' }}</th>
          <th class="text-right">{{ desglose.estimado ? 'Estimado' : 'Después' }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in desglose.beneficiarios" :key="b.rol">
          <td>
            <div class="text-body-2">{{ b.nombre ?? '—' }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ ETIQUETA_ROL[b.rol] }}<template v-if="b.tipo"> · {{ b.tipo }}</template>
              <template v-if="b.cobraAsesorConvenio">
                · lo cobra {{ b.cobraAsesorConvenio.nombre }}
              </template>
            </div>
          </td>
          <td class="text-right">{{ b.antes === null ? '' : fmt(b.antes) }}</td>
          <td class="text-right">
            <strong :class="claseDiferencia(b)">{{ fmt(b.despues) }}</strong>
          </td>
        </tr>
      </tbody>
    </v-table>

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
      <strong :class="{ 'text-red-darken-2': v.usado && v.valor === 0 }">{{ fmt(v.valor) }}</strong>
      <span class="text-medium-emphasis">({{ origenValorConfig(v) }})</span>
      <v-chip v-if="!v.usado" size="x-small" variant="text" class="px-1">no interviene</v-chip>
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
  </v-card>
</template>

<script setup lang="ts">
import {
  ETIQUETA_ROL,
  diferenciaBeneficiario,
  origenValorConfig,
  type BeneficiarioComision,
  type DesgloseComision,
} from '@/services/desgloseComision'

withDefaults(defineProps<{ desglose: DesgloseComision; titulo?: string }>(), {
  titulo: 'Comisión según este descuento',
})

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)

function claseDiferencia(b: BeneficiarioComision) {
  const d = diferenciaBeneficiario(b)
  return d === null || d === 0 ? '' : d < 0 ? 'text-red-darken-2' : 'text-green-darken-2'
}
</script>

<style scoped>
.desglose-tabla :deep(th),
.desglose-tabla :deep(td) {
  padding-left: 6px !important;
  padding-right: 6px !important;
}
.regla {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  word-break: break-word;
}
</style>
