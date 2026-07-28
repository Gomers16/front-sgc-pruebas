<!-- src/views/reportes/SuperInforme.vue -->
<template>
  <v-container class="py-6">
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center py-4">
        <v-avatar size="40" class="mr-3" color="blue-darken-3">
          <v-icon>mdi-file-pdf-box</v-icon>
        </v-avatar>
        <div>
          <div class="text-h5 font-weight-bold">Súper Informe</div>
          <div class="text-medium-emphasis">
            Reporte consolidado en PDF: Meta Mensual, Servicios Global, Producción por Líder,
            Ingresos por Canal, Retención de Clientes, Descuentos y Meta Comercial por Asesor.
          </div>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-row align="center" dense>
          <v-col cols="6" sm="4" md="3">
            <v-text-field
              v-model="fechaDesde"
              label="Desde"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="4" md="3">
            <v-text-field
              v-model="fechaHasta"
              label="Hasta"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-btn
              color="primary"
              prepend-icon="mdi-file-pdf-box"
              :loading="loading"
              block
              @click="generarInforme"
            >
              Generar Súper Informe
            </v-btn>
          </v-col>
        </v-row>

        <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact" class="mt-4">
          {{ errorMsg }}
        </v-alert>

        <v-alert v-if="exitoMsg" type="success" variant="tonal" density="compact" class="mt-4">
          {{ exitoMsg }}
        </v-alert>

        <div class="text-caption text-medium-emphasis mt-4">
          El rango puede cruzar meses: para Meta Mensual y Meta Comercial por Asesor, si el rango
          toca el mes en curso, la proyección de cierre se calcula solo con el ritmo de ese tramo;
          si toca solo meses ya cerrados, se muestra el real acumulado sin proyección.
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { descargarSuperInformePdf } from '@/services/reportesAdminService'

function fechaISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function primerDiaMesActualISO() {
  const d = new Date()
  return fechaISO(new Date(d.getFullYear(), d.getMonth(), 1))
}

const fechaDesde = ref(primerDiaMesActualISO())
const fechaHasta = ref(fechaISO(new Date()))
const loading = ref(false)
const errorMsg = ref('')
const exitoMsg = ref('')

function descargarBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

async function generarInforme() {
  errorMsg.value = ''
  exitoMsg.value = ''
  if (!fechaDesde.value || !fechaHasta.value) {
    errorMsg.value = 'Selecciona ambas fechas.'
    return
  }
  loading.value = true
  try {
    const blob = await descargarSuperInformePdf(fechaDesde.value, fechaHasta.value)
    descargarBlob(blob, `Super_Informe_${fechaDesde.value}_${fechaHasta.value}.pdf`)
    exitoMsg.value = 'Súper Informe generado correctamente.'
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : 'No se pudo generar el Súper Informe.'
  } finally {
    loading.value = false
  }
}
</script>
