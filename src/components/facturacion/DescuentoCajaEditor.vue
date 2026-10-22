<template>
  <!-- Avisos del padre (pre-marcado del dateo, reemplazo, etc.) -->
  <slot name="encabezado" />

  <!-- ── Pre-marcado desde el dateo: solo el monto ── -->
  <template v-if="modo === 'premarcado'">
    <DescuentoMontoEditor
      v-if="!ocultarMonto"
      class="mt-3"
      variante="premarcado"
      :model-value="monto"
      :maximo="maximo"
      :monto-fijo="montoFijo"
      :es-moto="esMoto"
      @update:model-value="fijarMonto"
    />
  </template>

  <!-- ── Elegido en caja ── -->
  <template v-else>
    <v-row dense class="mt-2">
      <v-col cols="12" md="6">
        <v-select
          :model-value="descuentoId"
          :items="descuentos"
          item-title="nombre"
          item-value="id"
          :label="etiquetaSelector"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
          prepend-inner-icon="mdi-tag-outline"
          data-test="descuento-selector"
          @update:model-value="(v: number | null) => emit('update:descuentoId', v ?? null)"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-autocomplete
          :model-value="autorizadoPorId"
          :items="usuarios"
          item-title="nombre"
          item-value="id"
          label="Autorizado por"
          variant="outlined"
          density="comfortable"
          :disabled="!descuentoId"
          hide-details
          clearable
          prepend-inner-icon="mdi-account-check"
          placeholder="Usuario que autoriza el descuento"
          @update:model-value="(v: number | null) => emit('update:autorizadoPorId', v ?? null)"
        />
      </v-col>
      <v-col v-if="descuentoId" cols="12">
        <DescuentoMontoEditor
          class="mt-2"
          variante="caja"
          :model-value="monto"
          :maximo="maximo"
          :monto-fijo="montoFijo"
          :es-moto="esMoto"
          @update:model-value="fijarMonto"
        />

        <v-alert
          v-if="mostrarEfectoComision"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-1"
        >
          <strong>⚠️ Efecto en comisión:</strong>
          {{ avisoConvenio ?? TEXTO_EFECTO_DESCUENTO }}
          <div v-if="!autorizadoPorId" class="mt-1" style="color: #c62828">
            Debes registrar quién autorizó el descuento antes de confirmar.
          </div>
        </v-alert>
        <v-alert
          v-else-if="requiereAutorizador && !autorizadoPorId"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-1"
        >
          Debes registrar quién autorizó el descuento.
        </v-alert>
      </v-col>
      <!-- Convenio cuando el aviso general no se ve (descuento quitado o edición) -->
      <v-col v-if="avisoConvenio && (!descuentoId || !mostrarEfectoComision)" cols="12">
        <v-alert type="info" variant="tonal" density="compact" data-test="aviso-convenio">
          {{ avisoConvenio }}
        </v-alert>
      </v-col>

      <!-- Observación opcional (en el modal: solo si el dateo no traía descuento pre-marcado) -->
      <v-col v-if="descuentoId && mostrarObservacion" cols="12">
        <v-card variant="tonal" color="blue-grey" class="mt-2 pa-3 rounded-lg">
          <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center" style="gap: 6px">
            <v-icon size="16">mdi-comment-text-outline</v-icon>
            Observación (opcional)
          </div>
          <div class="text-caption text-medium-emphasis mb-2">
            <slot name="observacion-ayuda">
              El asesor no dejó ningún descuento marcado en el dateo. Si quieres, deja una nota de
              por qué se aplica aquí.
            </slot>
          </div>
          <div class="d-flex flex-wrap mb-2" style="gap: 8px">
            <v-chip
              v-for="razon in RAZONES_RAPIDAS_DESCUENTO"
              :key="razon"
              size="small"
              variant="outlined"
              color="blue-grey"
              @click="emit('update:observacion', razon)"
            >
              {{ razon }}
            </v-chip>
          </div>
          <v-textarea
            :model-value="observacion"
            label="Observación"
            variant="outlined"
            density="comfortable"
            rows="2"
            auto-grow
            hide-details
            placeholder="Ej: el cliente lo pidió en el momento"
            @update:model-value="(v: string) => emit('update:observacion', v)"
          />
        </v-card>
      </v-col>
    </v-row>
  </template>

  <!-- Consecutivo del descuento: obligatorio con descuento en uso. Lo digita
       caja y no se puede repetir entre tickets confirmados. -->
  <v-row v-if="idEfectivo" dense class="mt-2">
    <v-col cols="12" md="6">
      <ConsecutivoDescuentoCampo
        :model-value="consecutivo"
        :ticket-id="ticketId"
        @update:model-value="(v) => emit('update:consecutivo', v)"
        @update:bloqueado="(b) => emit('update:consecutivoBloqueado', b)"
      />
    </v-col>
  </v-row>

  <!-- Documentos (solo si el descuento es INFORMATIVO_POLICIA) -->
  <DocumentosPoliciaCarga
    v-if="esPolicia"
    ref="docsRef"
    :ticket-id="ticketId"
    :cargados="documentosCargados"
    @update:completos="(v) => emit('update:documentosCompletos', v)"
    @aviso="(t) => emit('aviso', t)"
  >
    <slot name="policia" />
  </DocumentosPoliciaCarga>
</template>

<script setup lang="ts">
// Bloque de descuento de caja, compartido por el modal "Confirmar facturación"
// (FacturacionSubirTicket.vue) y la edición del descuento de un ticket
// CONFIRMADA (FacturacionHistorico.vue): selector, monto fijo o deslizador
// con el máximo por tipo de vehículo, "Autorizado por", observación,
// consecutivo con verificación en vivo y documentos de Policía. El estado lo
// guarda el padre (v-model); aquí van las reglas del monto.
import { computed, ref, watch } from 'vue'
import DescuentoMontoEditor from './DescuentoMontoEditor.vue'
import ConsecutivoDescuentoCampo from './ConsecutivoDescuentoCampo.vue'
import DocumentosPoliciaCarga, { type DocPoliciaKey } from './DocumentosPoliciaCarga.vue'
import {
  esMontoFijo,
  montoMaximo,
  type DescuentoDetalle,
} from '@/views/facturacion/descuentoFacturacion'
import {
  TEXTO_EFECTO_DESCUENTO,
  textoDescuentoConvenio,
  type CasoComision,
} from '@/services/desgloseComision'

const props = withDefaults(
  defineProps<{
    /** premarcado: el descuento viene del dateo (sin selector); caja: se elige aquí. */
    modo: 'premarcado' | 'caja'
    descuentos: DescuentoDetalle[]
    usuarios: { id: number; nombre: string }[]
    /** Id del pre-marcado: aunque su detalle no cargue, el consecutivo se pide igual. */
    descuentoPremarcadoId?: number | null
    descuentoPremarcado?: DescuentoDetalle | null
    /** Pre-marcado sin detalle: el padre muestra el aviso en lugar del monto. */
    ocultarMonto?: boolean
    esMoto: boolean
    ticketId: number | null
    mostrarObservacion?: boolean
    mostrarEfectoComision?: boolean
    requiereAutorizador?: boolean
    etiquetaSelector?: string
    documentosCargados?: DocPoliciaKey[]
    descuentoId: number | null
    monto: number
    autorizadoPorId: number | null
    observacion: string
    consecutivo: string
    /** Caso de la comisión del turno (null = sin dateo o desconocido): aviso del convenio. */
    casoComision?: CasoComision | null
    /** El dateo (caja) o la factura (edición) traía descuento. */
    traiaDescuento?: 'DATEO' | 'FACTURA' | null
  }>(),
  {
    casoComision: null,
    traiaDescuento: null,
    descuentoPremarcadoId: null,
    descuentoPremarcado: null,
    ocultarMonto: false,
    mostrarObservacion: false,
    mostrarEfectoComision: true,
    requiereAutorizador: false,
    etiquetaSelector: 'Aplicar descuento informativo (opcional)',
    documentosCargados: () => [],
  },
)
const emit = defineEmits<{
  'update:descuentoId': [id: number | null]
  'update:monto': [monto: number]
  'update:autorizadoPorId': [id: number | null]
  'update:observacion': [texto: string]
  'update:consecutivo': [valor: string]
  'update:consecutivoBloqueado': [bloqueado: boolean]
  'update:documentosCompletos': [completos: boolean]
  aviso: [texto: string]
}>()

const RAZONES_RAPIDAS_DESCUENTO = [
  'Asesor no puso descuento',
  'Cliente pide en caja el descuento',
] as const

const detalle = computed((): DescuentoDetalle | null =>
  props.modo === 'premarcado'
    ? props.descuentoPremarcado
    : (props.descuentos.find((d) => d.id === props.descuentoId) ?? null),
)
const idEfectivo = computed(() =>
  props.modo === 'premarcado' ? props.descuentoPremarcadoId : props.descuentoId,
)
const esPolicia = computed(
  () => !!idEfectivo.value && detalle.value?.codigo === 'INFORMATIVO_POLICIA',
)
// Monto fijo según configuración: policía, empleado y avance propietario.
const montoFijo = computed(() => !!idEfectivo.value && esMontoFijo(detalle.value?.codigo))
const maximo = computed(() => montoMaximo(detalle.value, props.esMoto))
// Con convenio, cualquier descuento final deja al convenio en cero (o
// vuelve a cobrar si se quita), según el caso del turno.
const avisoConvenio = computed(() =>
  textoDescuentoConvenio({
    caso: props.casoComision,
    hayDescuento: !!idEfectivo.value,
    traiaDescuento: props.traiaDescuento,
  }),
)

const docsRef = ref<InstanceType<typeof DocumentosPoliciaCarga> | null>(null)
function resetDocPolicia() {
  docsRef.value?.reset()
}

// Monto ya emitido: el padre lo recibe al instante, pero la prop llega en el
// siguiente render y los watchers de abajo corren en el mismo ciclo.
let montoActual = props.monto
watch(
  () => props.monto,
  (v) => {
    montoActual = v
  },
)
function fijarMonto(v: number) {
  montoActual = v
  emit('update:monto', v)
}

// Otro descuento en caja: monto, observación y documentos empiezan de cero.
watch(
  () => props.descuentoId,
  () => {
    fijarMonto(0)
    emit('update:observacion', '')
    resetDocPolicia()
  },
)
watch(maximo, (max) => {
  // monto fijo aplica para policía, empleado y avance propietario
  if (montoFijo.value) fijarMonto(max)
  else if (montoActual > max) fijarMonto(max)
})
// Fija el monto al máximo cuando se activa un descuento de monto fijo.
watch(
  () => (montoFijo.value ? detalle.value?.codigo : null),
  (codigo) => {
    if (codigo) fijarMonto(maximo.value)
  },
)

defineExpose({ resetDocPolicia })
</script>
