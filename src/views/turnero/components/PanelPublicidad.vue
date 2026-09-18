<template>
  <section ref="contenedorRef" class="panel-publicidad">
    <template v-if="itemActual">
      <!-- Fondo: no es un segundo reproductor/una segunda imagen — es un
           espejo en canvas de la MISMA fuente que se ve nítida abajo (ver
           dibujarCoverEnCanvas en el script). Eso es lo que garantiza
           sincronía perfecta para video, y consistencia visual para imagen. -->
      <canvas ref="canvasFondoRef" class="panel-publicidad__fondo" aria-hidden="true"></canvas>
      <div class="panel-publicidad__fondo-oscurecedor" aria-hidden="true"></div>

      <video
        v-if="itemActual.tipo === 'video'"
        ref="videoRef"
        class="panel-publicidad__video"
        :src="toPublicUrl(itemActual.url) ?? ''"
        muted
        playsinline
        @ended="avanzar"
      />
      <img
        v-else
        ref="imgRef"
        class="panel-publicidad__video"
        :src="toPublicUrl(itemActual.url) ?? ''"
        alt=""
        @load="alCargarImagen"
      />
    </template>

    <v-sheet v-else class="panel-publicidad__reposo" color="transparent">
      <p class="panel-publicidad__marca-agua" aria-hidden="true">CDA</p>
      <!-- espacio reservado para el logo del CDA -->
      <div class="panel-publicidad__contenido">
        <p class="panel-publicidad__nombre">Centro de<br />Diagnóstico Automotor</p>
        <div class="panel-publicidad__acento">
          <span></span><span></span><span></span>
        </div>
      </div>
    </v-sheet>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { get } from '@/services/http'
import {
  DURACION_IMAGEN_DEFECTO_SEGUNDOS,
  INTERVALO_POLL_MULTIMEDIA_MS,
} from '../config/constantes'
import './PanelPublicidad.css'

interface MultimediaTurnero {
  id: number
  tipo: 'imagen' | 'video'
  url: string
  duracionSegundos: number | null
  orden: number
  activo: boolean
}

interface MultimediaResponse {
  success?: boolean
  data?: MultimediaTurnero[]
}

/** Convierte una ruta relativa del backend a URL absoluta pública, igual que
 * el helper equivalente en contratoService.ts. */
function toPublicUrl(maybePathOrUrl?: string | null): string | null {
  if (!maybePathOrUrl) return null
  if (/^https?:\/\//i.test(maybePathOrUrl)) return maybePathOrUrl
  const base =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}${maybePathOrUrl.startsWith('/') ? '' : '/'}${maybePathOrUrl}`
}

/* ==================== catálogo + rotación ==================== */

const itemsActivos = ref<MultimediaTurnero[]>([])
const indiceActual = ref(0)

const itemActual = computed<MultimediaTurnero | null>(() => itemsActivos.value[indiceActual.value] ?? null)
// Identidad primitiva del ítem mostrado: sirve para detectar un cambio REAL
// de contenido (por avance o por catálogo) sin reaccionar a que el polling
// trajo un array nuevo con el mismo ítem adentro (ver refrescarCatalogo).
const itemActualId = computed(() => itemActual.value?.id ?? null)

function avanzar() {
  limpiarTimeoutImagen()
  if (itemsActivos.value.length === 0) return
  indiceActual.value = (indiceActual.value + 1) % itemsActivos.value.length
}

let timeoutImagenId: ReturnType<typeof setTimeout> | null = null
function limpiarTimeoutImagen() {
  if (timeoutImagenId !== null) clearTimeout(timeoutImagenId)
  timeoutImagenId = null
}

async function cargarCatalogo() {
  try {
    const resp = await get<MultimediaResponse>('/api/turnero/multimedia')
    const nuevos = (resp.data ?? [])
      .filter((item) => item.activo)
      .sort((a, b) => a.orden - b.orden)

    // No interrumpe lo que se está reproduciendo: si el ítem actual sigue
    // activo en el catálogo nuevo, solo se ajusta el índice a su nueva
    // posición (por si el orden cambió); si ya no existe/no está activo, se
    // salta al primero disponible. La lista vacía cae al estado de reposo.
    const idPrevio = itemActual.value?.id ?? null
    itemsActivos.value = nuevos

    if (nuevos.length === 0) {
      indiceActual.value = 0
      return
    }

    const posicion = idPrevio !== null ? nuevos.findIndex((item) => item.id === idPrevio) : -1
    indiceActual.value = posicion >= 0 ? posicion : 0
  } catch (error) {
    console.error('[PanelPublicidad] Error al consultar /turnero/multimedia:', error)
  }
}

let intervaloPoll: ReturnType<typeof setInterval> | null = null

/* ==================== espejo de fondo (canvas) ==================== */

const contenedorRef = ref<HTMLElement | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)
const canvasFondoRef = ref<HTMLCanvasElement | null>(null)

// Factor de reducción de la resolución interna del canvas de fondo: como
// después se le aplica un blur fuerte, dibujar a resolución completa es
// trabajo desperdiciado — nadie va a notar la diferencia bajo el desenfoque,
// y esto es una pantalla que corre 24/7 en un mini-PC de kiosco.
const REDUCCION_CANVAS_FONDO = 6
const ANCHO_MINIMO_CANVAS_FONDO = 48

let resizeObserver: ResizeObserver | null = null
let rafId: number | null = null
let usaCallbackDeFrameDeVideo = false
let videoFrameCallbackId: number | null = null

function ajustarResolucionCanvas() {
  const canvas = canvasFondoRef.value
  const contenedor = contenedorRef.value
  if (!canvas || !contenedor) return

  const { clientWidth, clientHeight } = contenedor
  canvas.width = Math.max(ANCHO_MINIMO_CANVAS_FONDO, Math.round(clientWidth / REDUCCION_CANVAS_FONDO))
  canvas.height = Math.max(
    Math.round(ANCHO_MINIMO_CANVAS_FONDO * (clientHeight / Math.max(clientWidth, 1))),
    Math.round(clientHeight / REDUCCION_CANVAS_FONDO)
  )
}

// Encuadre manual tipo "cover", compartido por video (por frame) e imagen
// (una sola vez): el canvas no tiene object-fit, así que el centrado +
// recorte para llenar todo el rectángulo sin dejar huecos se calcula a
// mano — sirve igual para una fuente vertical que una horizontal.
function dibujarCoverEnCanvas(fuente: CanvasImageSource, anchoNatural: number, altoNatural: number) {
  const canvas = canvasFondoRef.value
  if (!canvas || anchoNatural <= 0 || altoNatural <= 0) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const escala = Math.max(canvas.width / anchoNatural, canvas.height / altoNatural)
  const anchoDestino = anchoNatural * escala
  const altoDestino = altoNatural * escala
  const x = (canvas.width - anchoDestino) / 2
  const y = (canvas.height - altoDestino) / 2
  ctx.drawImage(fuente, x, y, anchoDestino, altoDestino)
}

function dibujarFrameDeVideo() {
  const el = videoRef.value
  if (el && el.readyState >= 2 && el.videoWidth > 0 && el.videoHeight > 0) {
    dibujarCoverEnCanvas(el, el.videoWidth, el.videoHeight)
  }
  programarSiguienteFrameDeVideo()
}

function programarSiguienteFrameDeVideo() {
  const el = videoRef.value
  if (!el) return

  // requestVideoFrameCallback (cuando existe) dibuja exactamente una vez por
  // frame nuevo decodificado — más preciso y más liviano que un rAF a ciegas.
  const elConCallback = el as HTMLVideoElement & {
    requestVideoFrameCallback?: (cb: () => void) => number
    cancelVideoFrameCallback?: (id: number) => void
  }

  if (typeof elConCallback.requestVideoFrameCallback === 'function') {
    usaCallbackDeFrameDeVideo = true
    videoFrameCallbackId = elConCallback.requestVideoFrameCallback(dibujarFrameDeVideo)
  } else {
    usaCallbackDeFrameDeVideo = false
    rafId = requestAnimationFrame(dibujarFrameDeVideo)
  }
}

function detenerDibujoDeVideo() {
  const el = videoRef.value
  if (usaCallbackDeFrameDeVideo && videoFrameCallbackId !== null && el) {
    const elConCallback = el as HTMLVideoElement & { cancelVideoFrameCallback?: (id: number) => void }
    elConCallback.cancelVideoFrameCallback?.(videoFrameCallbackId)
  }
  if (rafId !== null) cancelAnimationFrame(rafId)
  videoFrameCallbackId = null
  rafId = null
}

function alCargarImagen() {
  const el = imgRef.value
  if (!el) return
  ajustarResolucionCanvas()
  dibujarCoverEnCanvas(el, el.naturalWidth, el.naturalHeight)
}

/* ==================== orquestación por cambio de ítem ==================== */

async function manejarCambioDeItem() {
  detenerDibujoDeVideo()
  limpiarTimeoutImagen()

  const item = itemActual.value
  if (!item) return

  // El watcher corre antes de que Vue parchee el DOM con el <video>/<img>
  // del nuevo ítem (v-if recién se resuelve en este render) — sin esto,
  // videoRef/imgRef todavía apuntarían al elemento anterior (o a null en el
  // primer ítem, viniendo del estado de reposo).
  await nextTick()
  if (itemActual.value?.id !== item.id) return // cambió de nuevo mientras esperábamos

  ajustarResolucionCanvas()

  if (item.tipo === 'video') {
    // El <video> es el mismo nodo del DOM entre un video y el siguiente (no
    // se recrea): se fuerza recarga + play explícitos en vez de confiar en
    // que el cambio de :src re-dispare el autoplay por sí solo en todos los
    // navegadores.
    const el = videoRef.value
    if (el) {
      el.load()
      try {
        await el.play()
      } catch (error) {
        console.warn('[PanelPublicidad] No se pudo reproducir el video automáticamente:', error)
      }
      programarSiguienteFrameDeVideo()
    }
  } else {
    const segundos = item.duracionSegundos && item.duracionSegundos > 0
      ? item.duracionSegundos
      : DURACION_IMAGEN_DEFECTO_SEGUNDOS
    timeoutImagenId = setTimeout(avanzar, segundos * 1000)
    // Si la imagen ya estaba cacheada por el navegador, @load no vuelve a
    // disparar — se dibuja también acá por si acaso.
    if (imgRef.value?.complete) alCargarImagen()
  }
}

watch(itemActualId, () => {
  manejarCambioDeItem()
})

onMounted(() => {
  if (contenedorRef.value) {
    resizeObserver = new ResizeObserver(() => {
      ajustarResolucionCanvas()
      if (itemActual.value?.tipo === 'imagen') alCargarImagen()
    })
    resizeObserver.observe(contenedorRef.value)
  }

  cargarCatalogo()
  intervaloPoll = setInterval(cargarCatalogo, INTERVALO_POLL_MULTIMEDIA_MS)
})

onBeforeUnmount(() => {
  detenerDibujoDeVideo()
  limpiarTimeoutImagen()
  if (intervaloPoll !== null) clearInterval(intervaloPoll)
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>
