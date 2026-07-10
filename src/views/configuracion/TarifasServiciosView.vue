<!-- src/views/configuracion/TarifasServiciosView.vue -->
<template>
  <v-container class="py-6">
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-currency-usd</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Tarifas por Servicio</div>
            <div class="text-medium-emphasis">
              Configura el valor base y total de cada servicio según tipo de vehículo
            </div>
          </div>
        </div>
      </v-card-title>
    </v-card>

    <v-card elevation="8" class="rounded-xl">
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="tarifas"
          :loading="loading"
          item-key="id"
          hover
          hide-default-footer
        >
          <template #item.servicio_codigo="{ item }">
            <v-chip size="small" :color="colorServicio(item.servicio_codigo)" variant="flat">
              {{ item.servicio_codigo }}
            </v-chip>
            <span class="ml-2">{{ item.servicio_nombre }}</span>
          </template>

          <template #item.tipo_vehiculo="{ item }">
            {{ tipoVehiculoLabel(item.tipo_vehiculo) }}
          </template>

          <template #item.valor_base="{ item }">
            <span :class="{ 'text-error': !item.valor_base }">
              {{ formatCOP(item.valor_base) }}
            </span>
          </template>

          <template #item.valor_total="{ item }">
            <span :class="{ 'text-error': !item.valor_total }">
              {{ formatCOP(item.valor_total) }}
            </span>
          </template>

          <template #item.descripcion="{ item }">
            {{ item.descripcion || '—' }}
          </template>

          <template #item.vigencia_desde="{ item }">
            {{ item.vigencia_desde ? soloFecha(item.vigencia_desde) : '—' }}
          </template>

          <template #item.activo="{ item }">
            <v-chip size="small" :color="item.activo ? 'success' : 'grey'" variant="tonal">
              {{ item.activo ? 'Sí' : 'No' }}
            </v-chip>
          </template>

          <template #item.acciones="{ item }">
            <v-btn size="small" variant="text" icon="mdi-pencil" @click="abrirEdicion(item)" />
          </template>

          <template #no-data>
            <div class="text-center py-6 text-medium-emphasis">
              No hay tarifas configuradas todavía.
            </div>
          </template>
        </v-data-table>

        <v-alert type="warning" variant="tonal" density="compact" class="mt-4">
          Los valores con $0 aún no han sido configurados. Edítalos antes de generar reportes de ese servicio.
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- DIALOG DE EDICIÓN -->
    <v-dialog v-model="editDialog.open" max-width="480" persistent>
      <v-card v-if="editDialog.item">
        <v-card-title class="d-flex align-center" style="gap:8px">
          <v-chip size="small" :color="colorServicio(editDialog.item.servicio_codigo)" variant="flat">
            {{ editDialog.item.servicio_codigo }}
          </v-chip>
          <span>{{ editDialog.item.servicio_nombre }} — {{ tipoVehiculoLabel(editDialog.item.tipo_vehiculo) }}</span>
        </v-card-title>

        <v-divider />

        <v-card-text class="pt-4">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editForm.valor_base"
                label="Valor base (neto CDA)"
                type="number"
                min="0"
                density="comfortable"
                variant="outlined"
                prefix="$"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editForm.valor_total"
                label="Valor total (cliente paga)"
                type="number"
                min="0"
                density="comfortable"
                variant="outlined"
                prefix="$"
                hide-details
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="editForm.descripcion"
                label="Descripción"
                density="comfortable"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editForm.vigencia_desde"
                label="Vigencia desde"
                type="date"
                density="comfortable"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6" class="d-flex align-center">
              <v-switch
                v-model="editForm.activo"
                label="Activo"
                color="success"
                density="comfortable"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="cerrarEdicion">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" @click="guardarEdicion">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  getTarifasServicios,
  updateTarifaServicio,
  type TarifaServicio,
  type TarifaServicioPayload,
} from '@/services/tarifasServiciosService'

const tarifas = ref<TarifaServicio[]>([])
const loading = ref(false)
const saving = ref(false)
const snack = reactive({ show: false, text: '' })

const headers = [
  { title: 'Servicio', key: 'servicio_codigo' },
  { title: 'Tipo', key: 'tipo_vehiculo' },
  { title: 'Valor Base (neto CDA)', key: 'valor_base' },
  { title: 'Valor Total (cliente paga)', key: 'valor_total' },
  { title: 'Descripción', key: 'descripcion' },
  { title: 'Vigencia desde', key: 'vigencia_desde' },
  { title: 'Activo', key: 'activo' },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

const SERVICIO_COLORS: Record<string, string> = {
  RTM: 'blue',
  SOAT: 'green',
  PREV: 'orange',
  PERI: 'purple',
}
function colorServicio(codigo: string) {
  return SERVICIO_COLORS[codigo] ?? 'grey'
}

function tipoVehiculoLabel(t: string) {
  return t === 'MOTO' ? 'Moto' : 'Vehículo'
}

function soloFecha(fecha: string) {
  return String(fecha).slice(0, 10)
}

function formatCOP(value: number | string) {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

async function cargarTarifas() {
  loading.value = true
  try {
    tarifas.value = await getTarifasServicios()
  } catch (err) {
    console.error('Error cargando tarifas de servicios:', err)
    snack.text = '❌ Error al cargar las tarifas'
    snack.show = true
  } finally {
    loading.value = false
  }
}

/* ===== Edición ===== */
const editDialog = reactive<{ open: boolean; item: TarifaServicio | null }>({
  open: false,
  item: null,
})

const editForm = reactive({
  valor_base: '',
  valor_total: '',
  descripcion: '',
  vigencia_desde: '',
  activo: true,
})

function abrirEdicion(item: TarifaServicio) {
  editDialog.item = item
  editForm.valor_base = String(item.valor_base ?? '')
  editForm.valor_total = String(item.valor_total ?? '')
  editForm.descripcion = item.descripcion ?? ''
  editForm.vigencia_desde = item.vigencia_desde ? soloFecha(item.vigencia_desde) : ''
  editForm.activo = item.activo
  editDialog.open = true
}

function cerrarEdicion() {
  editDialog.open = false
  editDialog.item = null
}

async function guardarEdicion() {
  if (!editDialog.item) return
  saving.value = true
  try {
    const payload: Partial<TarifaServicioPayload> = {
      valor_base: Number(editForm.valor_base || 0),
      valor_total: Number(editForm.valor_total || 0),
      descripcion: editForm.descripcion || undefined,
      vigencia_desde: editForm.vigencia_desde || undefined,
      activo: editForm.activo,
    }
    await updateTarifaServicio(editDialog.item.id, payload)
    await cargarTarifas()
    cerrarEdicion()
    snack.text = '✅ Tarifa actualizada'
    snack.show = true
  } catch (err) {
    console.error('Error actualizando tarifa:', err)
    snack.text = '❌ Error al actualizar la tarifa'
    snack.show = true
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  cargarTarifas()
})
</script>

<style scoped>
.rounded-xl { border-radius: 16px; }
.rounded-2xl { border-radius: 20px; }
.text-medium-emphasis { color: rgba(0,0,0,.6); }
</style>
