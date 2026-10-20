<template>
  <v-text-field
    :model-value="modelValue"
    label="Consecutivo del descuento *"
    variant="outlined"
    density="comfortable"
    prepend-inner-icon="mdi-pound"
    placeholder="Ej: D-000123"
    maxlength="30"
    autocomplete="off"
    persistent-hint
    data-test="consecutivo-descuento"
    :loading="check.loading"
    :error-messages="error"
    :hint="hint"
    @update:model-value="onInput"
  />
</template>

<script setup lang="ts">
// Consecutivo del descuento: lo digita caja; mayúsculas, solo [A-Z0-9-],
// máx. 30. El backend lo exige con descuento en uso y rechaza (409) uno ya
// registrado en otro ticket CONFIRMADA. Verificación en vivo con debounce
// (excluye el ticket en curso); `bloqueado` avisa al padre si no se puede guardar.
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import {
  FacturacionService,
  type VerificacionConsecutivoDescuento,
} from '@/services/facturacion_service'

const props = defineProps<{
  modelValue: string
  /** Ticket en curso: no cuenta como repetido. */
  ticketId: number | null
}>()
const emit = defineEmits<{
  'update:modelValue': [valor: string]
  /** true si no es válido o ya está en otro ticket CONFIRMADA. */
  'update:bloqueado': [bloqueado: boolean]
}>()

const CONSECUTIVO_DESCUENTO_RE = /^[A-Z0-9-]{1,30}$/
const check = reactive({
  loading: false,
  /** Valor al que corresponde el resultado (descarta respuestas viejas) */
  verificado: '',
  exists: false,
  bloqueante: false,
  tickets: [] as VerificacionConsecutivoDescuento['tickets'],
})
let timer: ReturnType<typeof setTimeout> | null = null

function onInput(v: string | null) {
  emit(
    'update:modelValue',
    String(v ?? '')
      .toUpperCase()
      .replace(/\s+/g, ''),
  )
}

// Cada valor nuevo (digitado, precargado o reseteado por el padre) se verifica.
watch(
  () => props.modelValue,
  (valor) => {
    if (timer) clearTimeout(timer)
    Object.assign(check, {
      loading: false,
      verificado: '',
      exists: false,
      bloqueante: false,
      tickets: [],
    })
    if (!CONSECUTIVO_DESCUENTO_RE.test(valor)) return

    check.loading = true
    timer = setTimeout(async () => {
      try {
        const r = await FacturacionService.verificarConsecutivoDescuento(valor, props.ticketId)
        if (props.modelValue !== valor) return
        Object.assign(check, {
          verificado: valor,
          exists: r.exists,
          bloqueante: r.bloqueante,
          tickets: r.tickets,
        })
      } catch (err) {
        console.warn('No se pudo verificar el consecutivo del descuento:', err)
      } finally {
        if (props.modelValue === valor) check.loading = false
      }
    }, 400)
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

const valido = computed(() => CONSECUTIVO_DESCUENTO_RE.test(props.modelValue))
const verificado = computed(() => check.verificado === props.modelValue)

const error = computed((): string => {
  const v = props.modelValue
  if (v && !valido.value) return 'Solo letras, números y guion (-), máximo 30.'
  if (verificado.value && check.bloqueante) {
    const t = check.tickets.find((x) => x.estado === 'CONFIRMADA')
    return `Ya registrado en el ticket #${t?.id ?? '—'}${t?.placa ? ` (placa ${t.placa})` : ''}, confirmado.`
  }
  return ''
})

const hint = computed((): string => {
  if (!props.modelValue) return 'Obligatorio cuando hay descuento. No se puede repetir.'
  if (check.loading) return 'Verificando…'
  if (!verificado.value) return ''
  if (check.exists) {
    const t = check.tickets[0]
    return `⚠️ Aparece en el ticket #${t?.id ?? '—'} (${t?.estado ?? '—'}, sin confirmar). Revisa antes de seguir.`
  }
  return '✓ Disponible'
})

watch(
  () => !valido.value || (verificado.value && check.bloqueante),
  (b) => emit('update:bloqueado', b),
  { immediate: true },
)
</script>
