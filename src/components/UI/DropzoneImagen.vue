<!--
DropzoneImagen.vue — imagen única: arrastrar y soltar, clic para elegir,
pegar con Ctrl+V, vista previa y quitar. v-model = File | null.

Deuda: hay 5 copias propias de este patrón en otras vistas (DateoCreate,
facturación, etc.); no se migraron. Ver MAPA_DEL_SISTEMA_FRONTEND.md.

<DropzoneImagen v-model="archivo" label="Evidencia *" :max-mb="8" :error="err" />
-->
<template>
  <div>
    <div
      ref="zonaRef"
      class="dropzone rounded-lg pa-4 d-flex flex-column align-center justify-center text-center"
      :class="{ 'dropzone--activa': arrastrando, 'dropzone--error': !!mensajeError, 'dropzone--deshabilitada': disabled }"
      tabindex="0"
      role="button"
      :aria-label="label"
      @click="abrirSelector"
      @keydown.enter.prevent="abrirSelector"
      @keydown.space.prevent="abrirSelector"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <template v-if="previewUrl">
        <v-img :src="previewUrl" max-height="220" max-width="100%" contain class="rounded mb-2" />
        <div class="text-caption text-medium-emphasis">
          {{ modelValue?.name }} · {{ tamano }}
        </div>
        <v-btn
          size="small"
          variant="text"
          color="error"
          prepend-icon="mdi-close"
          class="mt-1"
          :disabled="disabled"
          @click.stop="quitar"
        >
          Quitar
        </v-btn>
      </template>
      <template v-else>
        <v-icon size="36" class="mb-1" color="primary">mdi-image-plus</v-icon>
        <div class="text-body-2 font-weight-medium">{{ label }}</div>
        <div class="text-caption text-medium-emphasis">
          Arrastra la imagen aquí, haz clic para elegirla o pégala con Ctrl+V
        </div>
        <div class="text-caption text-medium-emphasis">Máx. {{ maxMb }} MB · {{ extensionesTexto }}</div>
      </template>
      <input
        ref="inputRef"
        type="file"
        class="d-none"
        :accept="accept"
        @change="onInput"
      />
    </div>
    <div v-if="mensajeError" class="text-caption text-error mt-1">{{ mensajeError }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: File | null
    label?: string
    /** Extensiones permitidas (sin punto). */
    extensiones?: readonly string[]
    maxMb?: number
    disabled?: boolean
    /** Error externo (p. ej. "la evidencia es obligatoria"). */
    error?: string | null
    /** Escuchar Ctrl+V en toda la ventana mientras está montado (p. ej. dentro de un diálogo). */
    pegarGlobal?: boolean
  }>(),
  {
    label: 'Imagen',
    extensiones: () => ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
    maxMb: 8,
    disabled: false,
    error: null,
    pegarGlobal: true,
  },
)

const emit = defineEmits<{ 'update:modelValue': [File | null] }>()

const zonaRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const arrastrando = ref(false)
const errorLocal = ref<string | null>(null)
const previewUrl = ref<string | null>(null)
let profundidadDrag = 0

const accept = computed(() => props.extensiones.map((e) => `.${e}`).join(',') + ',image/*')
const extensionesTexto = computed(() => props.extensiones.map((e) => e.toUpperCase()).join(', '))
const mensajeError = computed(() => errorLocal.value || props.error || null)
const tamano = computed(() => {
  const b = props.modelValue?.size ?? 0
  return b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`
})

function revocar() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = null
}

watch(
  () => props.modelValue,
  (f) => {
    revocar()
    if (f) previewUrl.value = URL.createObjectURL(f)
  },
  { immediate: true },
)

function validar(f: File): string | null {
  const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
  const extOk = props.extensiones.includes(ext) || (!f.name.includes('.') && f.type.startsWith('image/'))
  if (!extOk) return `Formato no permitido. Usa ${extensionesTexto.value}.`
  if (f.size > props.maxMb * 1024 * 1024) return `La imagen supera ${props.maxMb} MB.`
  return null
}

function elegir(f: File | null | undefined) {
  if (props.disabled || !f) return
  // Imagen pegada sin nombre útil: le damos uno con su extensión.
  let archivo = f
  if (!f.name || f.name === 'image.png' || !f.name.includes('.')) {
    const ext = (f.type.split('/')[1] || 'png').replace('jpeg', 'jpg')
    archivo = new File([f], `pegada-${Date.now()}.${ext}`, { type: f.type })
  }
  const err = validar(archivo)
  errorLocal.value = err
  if (err) return
  emit('update:modelValue', archivo)
}

function abrirSelector() {
  if (props.disabled) return
  inputRef.value?.click()
}

function onInput(e: Event) {
  const input = e.target as HTMLInputElement
  elegir(input.files?.[0])
  input.value = ''
}

function onDragEnter() {
  profundidadDrag++
  arrastrando.value = true
}
function onDragLeave() {
  profundidadDrag = Math.max(0, profundidadDrag - 1)
  if (!profundidadDrag) arrastrando.value = false
}
function onDrop(e: DragEvent) {
  profundidadDrag = 0
  arrastrando.value = false
  elegir(e.dataTransfer?.files?.[0])
}

function onPaste(e: ClipboardEvent) {
  if (props.disabled) return
  const items = Array.from(e.clipboardData?.items ?? [])
  const img = items.find((i) => i.kind === 'file' && i.type.startsWith('image/'))
  if (!img) return
  e.preventDefault()
  elegir(img.getAsFile())
}

function quitar() {
  errorLocal.value = null
  emit('update:modelValue', null)
}

onMounted(() => {
  if (props.pegarGlobal) window.addEventListener('paste', onPaste)
  else zonaRef.value?.addEventListener('paste', onPaste)
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste)
  zonaRef.value?.removeEventListener('paste', onPaste)
  revocar()
})
</script>

<style scoped>
.dropzone {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.25);
  min-height: 140px;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
  outline: none;
}
.dropzone:focus-visible,
.dropzone--activa {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.06);
}
.dropzone--error {
  border-color: rgb(var(--v-theme-error));
}
.dropzone--deshabilitada {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
