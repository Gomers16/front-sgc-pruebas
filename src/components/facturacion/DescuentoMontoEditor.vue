<template>
  <v-card variant="tonal" color="orange-darken-2" class="pa-3 rounded-lg">
    <div class="text-subtitle-2 font-weight-bold mb-1 d-flex align-center" style="gap: 6px">
      <v-icon size="16">mdi-currency-usd</v-icon>
      Descuento aplicado
      <v-chip size="x-small" color="blue" variant="flat" class="ms-1">
        {{ esMoto ? 'Moto' : 'Carro' }}
      </v-chip>
      <!-- chip Monto fijo cubre policía, empleado y avance propietario -->
      <v-chip v-if="montoFijo" size="x-small" color="blue-darken-3" variant="flat" class="ms-1">
        Monto fijo
      </v-chip>
    </div>

    <!-- INFORMATIVO_POLICIA / INFORMATIVO_EMPLEADO / AVANCE_PROPIETARIO: monto fijo, solo lectura -->
    <template v-if="montoFijo && variante === 'premarcado'">
      <div class="text-caption text-medium-emphasis mb-2">
        El descuento tiene monto fijo según configuración.
      </div>
      <div class="text-h6 font-weight-bold">
        {{ formatCOP(maximo) }}
      </div>
    </template>
    <template v-else-if="montoFijo">
      <div class="text-caption text-medium-emphasis mb-1">
        Monto fijo configurado para policía / militar:
      </div>
      <div class="text-h5 font-weight-bold text-orange-darken-2">
        {{ formatCOP(maximo) }}
      </div>
      <div class="text-caption text-medium-emphasis mt-1">
        {{ esMoto ? 'Tarifa moto' : 'Tarifa carro' }} · No editable
      </div>
    </template>

    <!-- Otros descuentos: slider editable -->
    <template v-else>
      <div class="text-caption text-medium-emphasis mb-3">
        Máximo: <strong>{{ formatCOP(maximo) }}</strong> — puedes aplicar de $0 a
        {{ formatCOP(maximo) }}
      </div>
      <v-row dense align="center">
        <v-col cols="12" md="5">
          <v-text-field
            :model-value="montoTexto"
            label="Monto descuento ($)"
            variant="outlined"
            density="comfortable"
            inputmode="decimal"
            prefix="$"
            hide-details
            data-test="descuento-monto-texto"
            @update:model-value="onMontoTexto"
            @blur="onMontoBlur"
          />
        </v-col>
        <v-col cols="12" md="7">
          <v-slider
            :model-value="modelValue"
            :min="0"
            :max="maximo"
            :step="1000"
            color="orange-darken-2"
            thumb-label
            hide-details
            class="mt-2"
            @update:model-value="(v: number) => emit('update:modelValue', v)"
          >
            <template #thumb-label="{ modelValue: v }"> ${{ Math.round(v / 1000) }}k </template>
          </v-slider>
        </v-col>
      </v-row>
      <div v-if="modelValue === 0" class="text-caption text-medium-emphasis mt-2">
        ℹ️ Con $0 se registra el descuento pero sin reducción de precio.
      </div>
    </template>
  </v-card>
</template>

<script setup lang="ts">
// Monto del descuento en caja (modal de confirmación y edición en el Historial):
// monto fijo de solo lectura, o campo de texto + deslizador hasta el máximo.
import { ref, watch } from 'vue'
import { parseMontoCOP } from '@/views/facturacion/descuentoFacturacion'

const props = defineProps<{
  modelValue: number
  maximo: number
  montoFijo: boolean
  esMoto: boolean
  /** Solo cambia los textos del monto fijo (dateo pre-marcado vs. elegido en caja). */
  variante: 'premarcado' | 'caja'
}>()
const emit = defineEmits<{ 'update:modelValue': [monto: number] }>()

// Texto del campo "Monto descuento": se interpreta con parseMontoCOP para
// aceptar "8.000" / "8,000" (con type=number el navegador los leía como 8 o vacío).
const montoTexto = ref<string>(String(props.modelValue))

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n || 0)
}

function clamp(n: number) {
  if (n < 0) return 0
  if (n > props.maximo) return props.maximo
  return n
}

// Escribiendo: si el texto ya es un monto, mueve el deslizador en vivo.
function onMontoTexto(v: string) {
  montoTexto.value = v
  const n = parseMontoCOP(v)
  if (n !== null) emit('update:modelValue', n)
}
// Al salir del campo: quita separadores, limita al máximo y normaliza el texto.
function onMontoBlur() {
  const n = clamp(parseMontoCOP(montoTexto.value) ?? 0)
  emit('update:modelValue', n)
  montoTexto.value = String(n)
}
// Deslizador o reset → texto del campo (sin pisar lo que se está escribiendo).
watch(
  () => props.modelValue,
  (v) => {
    if (parseMontoCOP(montoTexto.value) !== v) montoTexto.value = String(v)
  },
)
</script>
