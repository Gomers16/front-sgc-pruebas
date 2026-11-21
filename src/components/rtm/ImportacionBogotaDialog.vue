<!-- src/components/rtm/ImportacionBogotaDialog.vue -->
<!--
  Importación Bogotá: base histórica de una sede distinta de Ibagué.
  1) Vista previa (no guarda nada) → 2) Importar por lotes con avance.
  Escribe en la sede activa (la del encabezado para SUPER_ADMIN/GERENCIA).
  Si se corta, "Reintentar" sigue desde el lote que falló (no duplica).
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  importarLoteBogota,
  vistaPreviaBogota,
  type AvisoImportacion,
  type VistaPreviaBogota,
} from '@/services/importacionBogotaService'
import { nombreSedeActiva } from '@/services/sedeActiva'

const abierto = defineModel<boolean>({ default: false })
const emit = defineEmits<{ terminado: [] }>()

type Paso = 'archivo' | 'previa' | 'importando' | 'listo'
const paso = ref<Paso>('archivo')
const archivo = ref<File | File[] | null>(null)
const cargando = ref(false)
const error = ref<string | null>(null)
const previa = ref<VistaPreviaBogota | null>(null)
const loteActual = ref(0)
const totales = ref({
  turnosCreados: 0,
  turnosYaExistian: 0,
  clientesCreados: 0,
  clientesReutilizados: 0,
  vehiculosCreados: 0,
  vehiculosReutilizados: 0,
  conductoresCreados: 0,
  conductoresReutilizados: 0,
})
const avisos = ref<AvisoImportacion[]>([])
const avisosTotal = ref(0)

const sedeNombre = computed(() => nombreSedeActiva() ?? '—')
const progreso = computed(() =>
  previa.value ? Math.round((loteActual.value / previa.value.lotes.total) * 100) : 0
)
const unArchivo = computed<File | null>(() =>
  Array.isArray(archivo.value) ? (archivo.value[0] ?? null) : archivo.value
)
const n = (v: number) => v.toLocaleString('es-CO')

function reiniciar() {
  paso.value = 'archivo'
  archivo.value = null
  error.value = null
  previa.value = null
  loteActual.value = 0
  avisos.value = []
  avisosTotal.value = 0
  for (const k of Object.keys(totales.value) as (keyof typeof totales.value)[]) totales.value[k] = 0
}
watch(abierto, (v) => {
  if (v && paso.value !== 'importando') reiniciar()
})

async function verPrevia() {
  if (!unArchivo.value) return
  cargando.value = true
  error.value = null
  try {
    previa.value = await vistaPreviaBogota(unArchivo.value)
    paso.value = 'previa'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo leer el archivo.'
  } finally {
    cargando.value = false
  }
}

async function importar() {
  if (!previa.value) return
  paso.value = 'importando'
  error.value = null
  try {
    while (loteActual.value < previa.value.lotes.total) {
      const r = await importarLoteBogota(previa.value.token, loteActual.value)
      for (const k of Object.keys(totales.value) as (keyof typeof totales.value)[]) {
        totales.value[k] += r[k]
      }
      if (avisos.value.length < 200) avisos.value.push(...r.avisos.slice(0, 200 - avisos.value.length))
      avisosTotal.value += r.avisosTotal
      loteActual.value++
    }
    paso.value = 'listo'
    emit('terminado')
  } catch (e) {
    error.value =
      (e instanceof Error ? e.message : 'Error en la importación.') +
      ` (lote ${loteActual.value + 1} de ${previa.value.lotes.total}). Lo ya importado quedó guardado; "Reintentar" continúa sin duplicar.`
  }
}
</script>

<template>
  <v-dialog v-model="abierto" max-width="900" :persistent="paso === 'importando'" scrollable>
    <v-card data-test="importacion-bogota">
      <v-card-title class="text-h6 font-weight-bold pa-4">
        <v-icon class="mr-2" color="teal">mdi-database-import</v-icon>
        Importación Bogotá
        <v-chip size="small" class="ml-2" color="teal" variant="tonal" data-test="impbog-sede">
          Sede: {{ sedeNombre }}
        </v-chip>
      </v-card-title>

      <v-card-text class="pa-4">
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" data-test="impbog-error">
          {{ error }}
        </v-alert>

        <!-- 1) Archivo -->
        <template v-if="paso === 'archivo'">
          <p class="text-body-2 mb-3">
            Carga la base histórica de una sede <strong>distinta de Ibagué</strong> con el archivo
            de Tecnoingeniería en formato de Bogotá (42 columnas, A–AP; con o sin fila de títulos).
            Los turnos quedan en la sede activa del encabezado. Primero verás una vista previa:
            nada se guarda hasta que confirmes.
          </p>
          <v-file-input
            v-model="archivo"
            label="Archivo Excel (.xls o .xlsx)"
            accept=".xls,.xlsx"
            prepend-icon="mdi-file-excel"
            variant="outlined"
            density="comfortable"
            show-size
            data-test="impbog-archivo"
          />
        </template>

        <!-- 2) Vista previa -->
        <template v-else-if="previa && paso === 'previa'">
          <p class="text-body-2 mb-3">
            <strong>{{ previa.archivo }}</strong> · {{ n(previa.filasLeidas) }} filas
            ({{ previa.rango.desde }} a {{ previa.rango.hasta }}){{
              previa.conTitulos ? ' · con fila de títulos' : ''
            }}
            · responsable de los turnos: {{ previa.responsable.nombre }}
          </p>
          <v-table density="compact" class="mb-4" data-test="impbog-conteos">
            <thead>
              <tr>
                <th></th>
                <th class="text-right">A crear</th>
                <th class="text-right">Ya existen</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Turnos (visitas)</td>
                <td class="text-right font-weight-bold" data-test="impbog-turnos-crear">
                  {{ n(previa.turnos.aCrear) }}
                </td>
                <td class="text-right">{{ n(previa.turnos.yaExisten) }}</td>
                <td class="text-caption">
                  {{ n(previa.turnos.aprobadas) }} aprobadas · {{ n(previa.turnos.rechazadas) }}
                  rechazadas · {{ n(previa.turnos.preventivas) }} preventivas
                </td>
              </tr>
              <tr>
                <td>Vehículos</td>
                <td class="text-right">{{ n(previa.vehiculos.aCrear) }}</td>
                <td class="text-right">{{ n(previa.vehiculos.existentes) }}</td>
                <td class="text-caption">
                  {{ n(previa.vehiculos.conHistorialEnOtraSede) }} con historial en otra sede (no
                  cambian de dueño ni de clase)
                </td>
              </tr>
              <tr>
                <td>Clientes</td>
                <td class="text-right">{{ n(previa.clientes.aCrear) }}</td>
                <td class="text-right">{{ n(previa.clientes.existentes) }}</td>
                <td class="text-caption">
                  {{ n(previa.clientes.existentesSinHistorial) }} existentes sin historial (pasarán
                  a verse solo en esta sede)
                </td>
              </tr>
              <tr>
                <td>Conductores</td>
                <td class="text-right">{{ n(previa.conductores.aCrear) }}</td>
                <td class="text-right">{{ n(previa.conductores.existentes) }}</td>
                <td class="text-caption">
                  {{ n(previa.telefonosDescartados) }} teléfonos de relleno descartados (0, 2000000…)
                </td>
              </tr>
            </tbody>
          </v-table>

          <div class="text-subtitle-2 mb-2">Filas que no generan un turno propio</div>
          <v-alert
            v-if="!previa.descartes.length"
            type="success"
            variant="tonal"
            density="compact"
            class="mb-2"
          >
            Ninguna: todas las filas generan un turno.
          </v-alert>
          <v-expansion-panels v-else variant="accordion" data-test="impbog-descartes">
            <v-expansion-panel v-for="d in previa.descartes" :key="d.motivo">
              <v-expansion-panel-title>
                {{ d.texto }} — <strong class="ml-1">{{ n(d.filas) }} filas</strong>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Fila</th>
                      <th>Placa</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="e in d.ejemplos" :key="e.fila">
                      <td>{{ e.fila }}</td>
                      <td>{{ e.placa ?? '—' }}</td>
                      <td>{{ e.detalle ?? '—' }}</td>
                    </tr>
                  </tbody>
                </v-table>
                <div v-if="d.filas > d.ejemplos.length" class="text-caption mt-1">
                  Primeras {{ d.ejemplos.length }} de {{ n(d.filas) }}.
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </template>

        <!-- 3) Importando / listo -->
        <template v-else-if="previa">
          <v-progress-linear
            :model-value="progreso"
            height="22"
            color="teal"
            rounded
            class="mb-3"
            data-test="impbog-progreso"
          >
            <strong>{{ loteActual }} / {{ previa.lotes.total }} lotes</strong>
          </v-progress-linear>
          <v-alert
            v-if="paso === 'listo'"
            type="success"
            variant="tonal"
            class="mb-3"
            data-test="impbog-listo"
          >
            Importación terminada en la sede {{ previa.sede.nombre }}.
          </v-alert>
          <v-table density="compact" data-test="impbog-resultado">
            <tbody>
              <tr>
                <td>Turnos creados</td>
                <td class="text-right font-weight-bold">{{ n(totales.turnosCreados) }}</td>
                <td>Ya existían (no se duplican)</td>
                <td class="text-right">{{ n(totales.turnosYaExistian) }}</td>
              </tr>
              <tr>
                <td>Clientes creados</td>
                <td class="text-right">{{ n(totales.clientesCreados) }}</td>
                <td>Clientes reutilizados</td>
                <td class="text-right">{{ n(totales.clientesReutilizados) }}</td>
              </tr>
              <tr>
                <td>Vehículos creados</td>
                <td class="text-right">{{ n(totales.vehiculosCreados) }}</td>
                <td>Vehículos reutilizados</td>
                <td class="text-right">{{ n(totales.vehiculosReutilizados) }}</td>
              </tr>
              <tr>
                <td>Conductores creados</td>
                <td class="text-right">{{ n(totales.conductoresCreados) }}</td>
                <td>Conductores reutilizados</td>
                <td class="text-right">{{ n(totales.conductoresReutilizados) }}</td>
              </tr>
            </tbody>
          </v-table>
          <div v-if="avisosTotal" class="mt-4">
            <div class="text-subtitle-2 mb-1">
              Avisos ({{ n(avisosTotal) }}): vehículos de otra sede que no se modificaron
            </div>
            <v-table density="compact">
              <tbody>
                <tr v-for="(a, i) in avisos" :key="i">
                  <td>{{ a.fila }}</td>
                  <td>{{ a.placa }}</td>
                  <td>{{ a.aviso }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </template>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          v-if="paso !== 'importando' || error"
          variant="text"
          @click="abierto = false"
          data-test="impbog-cerrar"
        >
          Cerrar
        </v-btn>
        <v-btn
          v-if="paso === 'archivo'"
          color="teal"
          variant="elevated"
          :loading="cargando"
          :disabled="!unArchivo"
          @click="verPrevia"
          data-test="impbog-previa"
        >
          Ver vista previa
        </v-btn>
        <v-btn v-if="paso === 'previa'" variant="text" @click="reiniciar">Otro archivo</v-btn>
        <v-btn
          v-if="paso === 'previa' && previa"
          color="teal"
          variant="elevated"
          :disabled="!previa.turnos.aCrear"
          @click="importar"
          data-test="impbog-importar"
        >
          Importar {{ n(previa.turnos.aCrear) }} turnos
        </v-btn>
        <v-btn
          v-if="paso === 'importando' && error"
          color="teal"
          variant="elevated"
          @click="importar"
          data-test="impbog-reintentar"
        >
          Reintentar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
