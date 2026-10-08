<template>
  <div class="prueba-voz">
    <h1>Prueba de voz del Turnero</h1>
    <p class="prueba-voz__nota">
      Reproduce un llamado local (pitido + locución) con el mismo código de la pantalla
      /turnero. No llama al backend ni crea turnos.
    </p>

    <label>
      Placa
      <input v-model="placa" maxlength="12" />
    </label>
    <div class="prueba-voz__fila">
      <button v-for="ejemplo in PLACAS_EJEMPLO" :key="ejemplo" type="button" @click="placa = ejemplo">
        {{ ejemplo }}
      </button>
    </div>

    <label>
      Módulo
      <select v-model="modulo">
        <option v-for="opcion in MODULOS_TURNERO" :key="opcion" :value="opcion">{{ opcion }}</option>
        <option :value="MODULO_LIBRE">{{ MODULO_LIBRE }} (fuera de los 6 → respaldo)</option>
      </select>
    </label>

    <label>
      Tipo
      <select v-model="tipoLlamado">
        <option value="modulo">Llamado a módulo</option>
        <option value="pregunta">Pregunta</option>
      </select>
    </label>

    <label class="prueba-voz__check">
      <input v-model="simularSinSintesis" type="checkbox" />
      Simular navegador sin speechSynthesis (como el TV)
    </label>
    <label class="prueba-voz__check">
      <input v-model="simularSinClips" type="checkbox" />
      Simular clips ausentes (fuerza speechSynthesis)
    </label>

    <button type="button" class="prueba-voz__llamar" @click="llamar">Reproducir llamado de prueba</button>

    <dl class="prueba-voz__estado">
      <dt>Clips</dt>
      <dd>{{ clips ? clips.join(' · ') : 'no se puede armar con clips → speechSynthesis' }}</dd>
      <dt>Texto (respaldo)</dt>
      <dd>{{ textoAnuncio(turno) }}</dd>
      <dt>speechSynthesis en este navegador</dt>
      <dd>{{ sintesisInstalada ? 'sí' : 'no' }}</dd>
      <dt>Hablando</dt>
      <dd>{{ hablando ? 'sí' : 'no' }}</dd>
      <dt>Pitido bloqueado</dt>
      <dd>{{ audioBloqueado ? 'sí' : 'no' }}</dd>
      <dt>Sin sonido (clips y respaldo fallaron)</dt>
      <dd>{{ vozBloqueada ? 'sí' : 'no' }}</dd>
      <dt>Navegador</dt>
      <dd class="prueba-voz__ua">{{ userAgent }}</dd>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { MODULOS_TURNERO } from './config/constantes'
import { useAlarma } from './composables/useAlarma'
import { textoAnuncio, useVozTurno } from './composables/useVozTurno'
import { clipsAnuncio, type DatosAnuncio } from './composables/useClipsAnuncio'

const PLACAS_EJEMPLO = ['ABC123', 'ABC12D', 'XYZ-98 7', 'WQK 054']
const MODULO_LIBRE = 'Caja 2'

const placa = ref('ABC123')
const modulo = ref<string>(MODULOS_TURNERO[4])
const tipoLlamado = ref<DatosAnuncio['tipoLlamado']>('modulo')
const simularSinSintesis = ref(false)
const simularSinClips = ref(false)

const turno = computed<DatosAnuncio>(() => ({
  placa: placa.value,
  modulo: modulo.value,
  tipoLlamado: tipoLlamado.value,
}))
const clips = computed(() => (simularSinClips.value ? null : clipsAnuncio(turno.value)))

const sintesisInstalada = typeof window !== 'undefined' && 'speechSynthesis' in window
const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''

const { reproducir, audioBloqueado } = useAlarma()
const { anunciar, hablando, vozBloqueada } = useVozTurno({
  simularSinSintesis: () => simularSinSintesis.value,
  simularSinClips: () => simularSinClips.value,
})

// Mismo encadenamiento que useColaModales.ts: pitido y, al terminar, la voz.
function llamar() {
  const datos = { ...turno.value }
  reproducir(() => anunciar(datos))
}
</script>

<style scoped>
.prueba-voz {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 18px;
  color: #0a1b33;
  background: #fff;
  min-height: 100vh;
}
.prueba-voz h1 {
  font-size: 26px;
  margin: 0 0 8px;
}
.prueba-voz__nota {
  margin: 0 0 16px;
  color: rgba(10, 27, 51, 0.6);
}
.prueba-voz label {
  display: block;
  margin: 12px 0 4px;
}
.prueba-voz input:not([type='checkbox']),
.prueba-voz select {
  display: block;
  width: 100%;
  padding: 8px;
  font-size: 18px;
  border: 1px solid #a8b8c8;
  border-radius: 6px;
}
.prueba-voz__fila {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.prueba-voz button {
  padding: 8px 12px;
  font-size: 16px;
  border: 1px solid #0d6efd;
  border-radius: 6px;
  background: #fff;
  color: #0d6efd;
  cursor: pointer;
}
.prueba-voz__check {
  display: flex !important;
  gap: 8px;
  align-items: center;
}
.prueba-voz .prueba-voz__llamar {
  margin: 20px 0;
  padding: 14px 20px;
  font-size: 20px;
  background: #0d6efd;
  color: #fff;
}
.prueba-voz__estado {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 16px;
  margin: 0;
}
.prueba-voz__estado dt {
  font-weight: 600;
}
.prueba-voz__estado dd {
  margin: 0;
}
.prueba-voz__ua {
  font-size: 14px;
  word-break: break-all;
}
</style>
