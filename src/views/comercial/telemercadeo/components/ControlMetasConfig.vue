<!--
Control de Telemercadeo · Metas y configuración.
- Metas por asesor y mes (meta_gestiones, meta_dateos, meta_exitosos,
  opcionales; vacío = sin meta), guardado por lote y "Copiar del mes anterior".
- Máximo de seguimientos y vigencia del ciclo (global) y máximo por asesor
  (overrides), mismo patrón visual que el límite de re-dateos de DateosList.vue.
  El backend solo admite la vigencia del ciclo global (no por asesor).
-->
<template>
  <div class="pa-4">
    <!-- ───── Metas ───── -->
    <div class="d-flex align-center flex-wrap ga-2 mb-2">
      <div class="text-subtitle-1 font-weight-bold">Metas del mes</div>
      <v-spacer />
      <v-select
        v-model="mesSel"
        :items="mesesItems"
        label="Mes"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 200px"
        :disabled="guardandoMetas || copiando"
        @update:model-value="cargarMetas"
      />
      <v-checkbox
        v-model="sobrescribir"
        label="Sobrescribir las que ya existan"
        density="compact"
        hide-details
        :disabled="copiando"
      />
      <v-btn
        variant="tonal"
        prepend-icon="mdi-content-copy"
        :loading="copiando"
        :disabled="copiando || guardandoMetas"
        @click="confirmarCopia = true"
      >
        Copiar del mes anterior
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-content-save"
        :loading="guardandoMetas"
        :disabled="!metasCambiadas || guardandoMetas || !metasValidas"
        @click="guardarMetas"
      >
        Guardar metas
      </v-btn>
    </div>
    <div class="text-caption text-medium-emphasis mb-2">
      Deja un campo vacío para “sin meta” (no se muestra semáforo). Una fila con las tres
      vacías borra la meta del asesor ese mes.
    </div>

    <v-data-table
      :headers="headersMetas"
      :items="metas"
      :loading="cargandoMetas"
      item-value="asesor_id"
      density="compact"
      :items-per-page="-1"
      hide-default-footer
    >
      <template #item.nombre="{ item }">
        {{ item.nombre }}
        <v-chip v-if="!item.activo" size="x-small" class="ml-1">Inactivo</v-chip>
      </template>
      <template v-for="c in CAMPOS" :key="c" #[`item.${c}`]="{ item }">
        <v-text-field
          :model-value="item[c] ?? ''"
          type="number"
          min="0"
          density="compact"
          variant="outlined"
          hide-details="auto"
          placeholder="Sin meta"
          style="max-width: 140px"
          :rules="[reglaMeta]"
          :disabled="guardandoMetas"
          @update:model-value="(v: string) => (item[c] = aMeta(v))"
        />
      </template>
      <template #no-data>
        <div class="py-4 text-center text-medium-emphasis">No hay asesores de Telemercadeo.</div>
      </template>
    </v-data-table>

    <v-divider class="my-6" />

    <!-- ───── Configuración de seguimientos ───── -->
    <div class="text-subtitle-1 font-weight-bold mb-2">Seguimientos por ciclo</div>
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <v-text-field
        v-model.number="cfg.max"
        label="Máximo global de seguimientos"
        type="number"
        min="1"
        max="50"
        variant="outlined"
        density="compact"
        hide-details
        style="width: 240px"
        :loading="cfg.cargando"
      />
      <v-text-field
        v-model.number="cfg.dias"
        label="Vigencia del ciclo (días)"
        type="number"
        min="1"
        max="365"
        variant="outlined"
        density="compact"
        hide-details
        style="width: 220px"
        :loading="cfg.cargando"
      />
      <v-btn
        color="primary"
        variant="tonal"
        prepend-icon="mdi-content-save"
        :disabled="!cfgCambiada || cfg.guardando"
        :loading="cfg.guardando"
        @click="guardarConfig"
      >
        Guardar
      </v-btn>
    </div>
    <div class="text-caption text-medium-emphasis mb-3">
      El ciclo de un cliente (placa + servicio) se cierra al datearlo, cuando hace turno o
      tras los días de vigencia sin gestiones. Un 4º seguimiento solo con autorización de gerencia.
    </div>

    <v-expansion-panels variant="accordion">
      <v-expansion-panel title="⚙️ Máximo de seguimientos por asesor (overrides)">
        <v-expansion-panel-text>
          <v-row dense class="mb-3">
            <v-col cols="12" sm="6" md="4">
              <v-autocomplete
                v-model="ovForm.asesorId"
                :items="asesores"
                item-title="nombre"
                item-value="id"
                label="Asesor"
                density="comfortable"
                variant="outlined"
                hide-details
                clearable
              />
            </v-col>
            <v-col cols="8" sm="4" md="3">
              <v-text-field
                v-model.number="ovForm.max"
                label="Máx. seguimientos"
                type="number"
                min="1"
                max="50"
                density="comfortable"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="4" sm="2" md="1" class="d-flex align-center">
              <v-btn
                color="primary"
                icon="mdi-content-save"
                :loading="ovForm.guardando"
                :disabled="!ovForm.asesorId || !ovForm.max || ovForm.guardando"
                @click="guardarOverride"
              />
            </v-col>
          </v-row>
          <v-data-table
            :headers="headersOverrides"
            :items="overrides"
            :loading="cargandoOverrides"
            item-value="id"
            density="comfortable"
          >
            <template #item.asesor="{ item }">{{ item.asesor_nombre || `#${item.asesor_id}` }}</template>
            <template #item.max_seguimientos="{ item }">
              {{ item.max_seguimientos ?? `Global (${cfg.maxOriginal ?? '—'})` }}
            </template>
            <template #item.acciones="{ item }">
              <v-btn size="small" variant="text" color="error" icon="mdi-delete" @click="borrarOverride = item" />
            </template>
            <template #no-data>
              <div class="text-center py-4 text-medium-emphasis">
                Sin overrides por asesor. Todos usan el máximo global.
              </div>
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <ConfirmarDialogo
      v-model="confirmarCopia"
      title="Copiar metas del mes anterior"
      :message="`Se copiarán las metas de ${nombreMes(anterior.mes, anterior.anio)} a ${nombreMes(seleccion.mes, seleccion.anio)}. ${sobrescribir ? 'Las metas que ya existan se SOBRESCRIBIRÁN.' : 'Las metas que ya existan se respetan.'} Los cambios sin guardar de la tabla se perderán.`"
      confirm-text="Copiar"
      @confirm="copiarMesAnterior"
    />
    <ConfirmarDialogo
      :model-value="borrarOverride !== null"
      title="Quitar override"
      :message="`${borrarOverride?.asesor_nombre || 'El asesor'} volverá a usar el máximo global de seguimientos.`"
      confirm-text="Quitar"
      confirm-color="error"
      @update:model-value="(v: boolean) => !v && (borrarOverride = null)"
      @confirm="eliminarOverride"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import ConfirmarDialogo from '@/components/UI/ConfirmarDialogo.vue'
import { HttpError } from '@/services/http'
import {
  copiarMetasTele,
  eliminarConfigSeguimientoAsesor,
  getConfigSeguimientoTele,
  getMetasTele,
  guardarConfigSeguimientoAsesor,
  guardarConfigSeguimientoTele,
  guardarMetasTele,
  listConfigSeguimientoAsesores,
  type AsesorTele,
  type ConfigSeguimientoAsesor,
  type MetaAsesorFila,
} from '@/services/telemercadeoService'
import { mesActualBogota, mesAnterior, nombreMes } from '../telemercadeoHelpers'

defineProps<{ asesores: AsesorTele[] }>()

type CampoMeta = 'meta_gestiones' | 'meta_dateos' | 'meta_exitosos'
const CAMPOS: CampoMeta[] = ['meta_gestiones', 'meta_dateos', 'meta_exitosos']

const snackbar = ref({ show: false, text: '', color: 'success' })
const avisar = (text: string, color = 'success') => (snackbar.value = { show: true, text, color })
const msg = (e: unknown, fb: string) => (e instanceof HttpError ? e.message : fb)

/* ── Mes ── */
const actual = mesActualBogota()
const mesesItems = (() => {
  // Mes siguiente, actual y 4 anteriores.
  const sig = actual.mes === 12 ? { mes: 1, anio: actual.anio + 1 } : { mes: actual.mes + 1, anio: actual.anio }
  const items = [{ title: nombreMes(sig.mes, sig.anio), value: `${sig.anio}-${sig.mes}` }]
  let m = actual
  for (let i = 0; i < 5; i++) {
    items.push({ title: nombreMes(m.mes, m.anio), value: `${m.anio}-${m.mes}` })
    m = mesAnterior(m)
  }
  return items
})()
const mesSel = ref(`${actual.anio}-${actual.mes}`)
const seleccion = computed(() => {
  const [anio, mes] = mesSel.value.split('-').map(Number)
  return { mes, anio }
})
const anterior = computed(() => mesAnterior(seleccion.value))

/* ── Metas ── */
const metas = ref<MetaAsesorFila[]>([])
let original = ''
const cargandoMetas = ref(false)
const guardandoMetas = ref(false)
const copiando = ref(false)
const confirmarCopia = ref(false)
const sobrescribir = ref(false)

const headersMetas = [
  { title: 'Asesor', key: 'nombre', sortable: false },
  { title: 'Meta gestiones', key: 'meta_gestiones', sortable: false },
  { title: 'Meta dateos', key: 'meta_dateos', sortable: false },
  { title: 'Meta exitosos', key: 'meta_exitosos', sortable: false },
]

const firma = (rows: MetaAsesorFila[]) =>
  JSON.stringify(rows.map((r) => [r.asesor_id, r.meta_gestiones, r.meta_dateos, r.meta_exitosos]))
const metasCambiadas = computed(() => firma(metas.value) !== original)
const esMetaValida = (v: number | null) => v === null || (Number.isInteger(v) && v >= 0 && v <= 1_000_000)
const metasValidas = computed(() => metas.value.every((r) => CAMPOS.every((c) => esMetaValida(r[c]))))
const reglaMeta = (v: unknown) =>
  v === '' || v === null || v === undefined || esMetaValida(Number(v)) || 'Entero ≥ 0 o vacío'
const aMeta = (v: string | number | null): number | null =>
  v === '' || v === null || v === undefined ? null : Number(v)

function ponerMetas(rows: MetaAsesorFila[]) {
  metas.value = rows.map((r) => ({ ...r }))
  original = firma(metas.value)
}

async function cargarMetas() {
  cargandoMetas.value = true
  try {
    const r = await getMetasTele(seleccion.value.mes, seleccion.value.anio)
    ponerMetas(r.data)
  } catch (e) {
    metas.value = []
    avisar(msg(e, 'No se pudieron cargar las metas.'), 'error')
  } finally {
    cargandoMetas.value = false
  }
}

async function guardarMetas() {
  if (guardandoMetas.value || !metasValidas.value) return
  guardandoMetas.value = true
  try {
    const r = await guardarMetasTele(
      seleccion.value.mes,
      seleccion.value.anio,
      metas.value.map((m) => ({
        asesor_id: m.asesor_id,
        meta_gestiones: m.meta_gestiones,
        meta_dateos: m.meta_dateos,
        meta_exitosos: m.meta_exitosos,
      })),
    )
    ponerMetas(r.data)
    avisar('Metas guardadas.')
  } catch (e) {
    avisar(msg(e, 'No se pudieron guardar las metas.'), 'error')
  } finally {
    guardandoMetas.value = false
  }
}

async function copiarMesAnterior() {
  if (copiando.value) return
  copiando.value = true
  try {
    const r = await copiarMetasTele({
      desde_mes: anterior.value.mes,
      desde_anio: anterior.value.anio,
      hacia_mes: seleccion.value.mes,
      hacia_anio: seleccion.value.anio,
      sobrescribir: sobrescribir.value,
    })
    ponerMetas(r.data)
    avisar(`Copiadas ${r.copiadas}; omitidas ${r.omitidas} (ya tenían meta).`)
  } catch (e) {
    avisar(msg(e, 'No se pudieron copiar las metas.'), 'error')
  } finally {
    copiando.value = false
  }
}

/* ── Configuración global ── */
const cfg = reactive({
  max: null as number | null,
  dias: null as number | null,
  maxOriginal: null as number | null,
  diasOriginal: null as number | null,
  cargando: false,
  guardando: false,
})
const cfgCambiada = computed(
  () =>
    (cfg.max !== cfg.maxOriginal || cfg.dias !== cfg.diasOriginal) &&
    !!cfg.max &&
    !!cfg.dias,
)

async function cargarConfig() {
  cfg.cargando = true
  try {
    const r = await getConfigSeguimientoTele()
    cfg.max = cfg.maxOriginal = r.max_seguimientos
    cfg.dias = cfg.diasOriginal = r.dias_vigencia_ciclo
  } catch (e) {
    avisar(msg(e, 'No se pudo cargar la configuración.'), 'error')
  } finally {
    cfg.cargando = false
  }
}

async function guardarConfig() {
  if (cfg.guardando || !cfgCambiada.value) return
  cfg.guardando = true
  try {
    const r = await guardarConfigSeguimientoTele({
      max_seguimientos: cfg.max ?? undefined,
      dias_vigencia_ciclo: cfg.dias ?? undefined,
    })
    cfg.max = cfg.maxOriginal = r.max_seguimientos
    cfg.dias = cfg.diasOriginal = r.dias_vigencia_ciclo
    avisar('Configuración guardada.')
  } catch (e) {
    avisar(msg(e, 'No se pudo guardar la configuración.'), 'error')
  } finally {
    cfg.guardando = false
  }
}

/* ── Overrides por asesor ── */
const overrides = ref<ConfigSeguimientoAsesor[]>([])
const cargandoOverrides = ref(false)
const ovForm = reactive({ asesorId: null as number | null, max: null as number | null, guardando: false })
const borrarOverride = ref<ConfigSeguimientoAsesor | null>(null)
const headersOverrides = [
  { title: 'Asesor', key: 'asesor', sortable: false },
  { title: 'Máx. seguimientos', key: 'max_seguimientos', sortable: false },
  { title: '', key: 'acciones', sortable: false, align: 'end' as const },
]

async function cargarOverrides() {
  cargandoOverrides.value = true
  try {
    overrides.value = await listConfigSeguimientoAsesores()
  } catch {
    overrides.value = []
  } finally {
    cargandoOverrides.value = false
  }
}

async function guardarOverride() {
  if (ovForm.guardando || !ovForm.asesorId || !ovForm.max) return
  ovForm.guardando = true
  try {
    await guardarConfigSeguimientoAsesor(ovForm.asesorId, ovForm.max)
    ovForm.asesorId = null
    ovForm.max = null
    avisar('Override guardado.')
    await cargarOverrides()
  } catch (e) {
    avisar(msg(e, 'No se pudo guardar el override.'), 'error')
  } finally {
    ovForm.guardando = false
  }
}

async function eliminarOverride() {
  const item = borrarOverride.value
  borrarOverride.value = null
  if (!item) return
  try {
    await eliminarConfigSeguimientoAsesor(item.id)
    avisar('Override eliminado.')
    await cargarOverrides()
  } catch (e) {
    avisar(msg(e, 'No se pudo eliminar el override.'), 'error')
  }
}

onMounted(() => {
  cargarMetas()
  cargarConfig()
  cargarOverrides()
})
</script>
