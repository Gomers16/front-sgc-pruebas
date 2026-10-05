<!-- DashboardView.vue -->
<template>
  <v-container class="dashboard-shell py-8">
    <v-card class="welcome-card" elevation="6" variant="outlined">
      <!-- Franja superior corporativa azul → amarillo -->
      <div class="welcome-card__accent"></div>

      <!-- Encabezado -->
      <v-card-title
        class="card-header d-flex flex-column flex-sm-row justify-space-between align-center"
      >
        <div class="card-header__left d-flex align-center">
          <div class="card-header__icon mr-3">
            <v-icon size="26">mdi-view-dashboard-outline</v-icon>
          </div>

          <div>
            <div class="card-header__title">
              Panel de operación diaria
            </div>
            <div class="card-header__subtitle">
              <span class="brand-name">ACTIVAUTOS CDA DEL CENTRO IBAGUÉ</span>
            </div>
          </div>
        </div>

        <div class="card-header__right d-flex flex-column align-end">
          <div class="card-header__date-pill">
            <v-icon size="18" class="mr-1">mdi-calendar-outline</v-icon>
            {{ todayDate }}
          </div>
          <span class="card-header__date-helper mt-1">Jornada actual</span>
        </div>
      </v-card-title>

      <v-card-text class="card-header__description mb-4">
        Resumen general de los turnos y servicios del día.
      </v-card-text>

      <v-divider class="my-4" />

      <!-- Resumen del día -->
      <div class="section-header mb-3">
        <div class="section-header__bar"></div>
        <h3 class="section-header__title">Resumen del día</h3>
      </div>

      <v-row justify="center" class="mb-6">
        <v-col cols="12" sm="6" md="4">
          <DashboardIndicador
            icon="mdi-car-multiple"
            :valor="turnosEnProceso"
            :titulo="tituloConSegundaVez('Turnos en proceso', turnosEnProcesoSegundaVez)"
            :loading="isLoadingKpis"
            color-card="grey-lighten-4"
            color-icon="blue-darken-2"
          />
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <DashboardIndicador
            icon="mdi-check-circle-outline"
            :valor="turnosFinalizados"
            :titulo="tituloConSegundaVez('Turnos finalizados', turnosFinalizadosSegundaVez)"
            :loading="isLoadingKpis"
            color-card="grey-lighten-4"
            color-icon="blue-darken-2"
          />
        </v-col>

        <v-col cols="12" sm="6" md="4">
          <DashboardIndicador
            icon="mdi-numeric"
            :valor="siguienteTurno"
            titulo="Siguiente turno"
            :loading="isLoadingKpis"
            color-card="grey-lighten-4"
            color-icon="amber-darken-2"
          />
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <!-- Turnos en proceso por servicio -->
      <div class="section-header mb-3">
        <div class="section-header__bar"></div>
        <h3 class="section-header__title">Turnos en proceso por servicio (hoy)</h3>
      </div>

      <v-row dense align="stretch" class="mb-4">
        <!-- RTM -->
        <v-col cols="12" sm="6" md="3" class="d-flex flex-column">
          <DashboardIndicador
            class="flex-grow-1 indicador-card"
            icon="mdi-car-wrench"
            :valor="kpiServicios.rtm"
            titulo="RTM"
            :loading="isLoadingKpis"
            color-card="grey-lighten-4"
            color-icon="blue-darken-2"
          />
          <div class="mt-2 indicador-mini">
            <DashboardIndicadorMini
              icon="mdi-format-list-numbered"
              titulo="Total hoy"
              :valor="kpiServiciosTotal.rtm"
              :loading="isLoadingKpis"
              color-card="grey-lighten-5"
              color-icon="grey-darken-2"
            />
          </div>
        </v-col>

        <!-- Preventiva -->
        <v-col cols="12" sm="6" md="3" class="d-flex flex-column">
          <DashboardIndicador
            class="flex-grow-1 indicador-card"
            icon="mdi-shield-check-outline"
            :valor="kpiServicios.preventiva"
            titulo="Preventiva"
            :loading="isLoadingKpis"
            color-card="grey-lighten-4"
            color-icon="blue-darken-2"
          />
          <div class="mt-2 indicador-mini">
            <DashboardIndicadorMini
              icon="mdi-format-list-numbered"
              titulo="Total hoy"
              :valor="kpiServiciosTotal.preventiva"
              :loading="isLoadingKpis"
              color-card="grey-lighten-5"
              color-icon="grey-darken-2"
            />
          </div>
        </v-col>

        <!-- Peritaje -->
        <v-col cols="12" sm="6" md="3" class="d-flex flex-column">
          <DashboardIndicador
            class="flex-grow-1 indicador-card"
            icon="mdi-clipboard-text-search-outline"
            :valor="kpiServicios.peritaje"
            titulo="Peritaje"
            :loading="isLoadingKpis"
            color-card="grey-lighten-4"
            color-icon="blue-darken-2"
          />
          <div class="mt-2 indicador-mini">
            <DashboardIndicadorMini
              icon="mdi-format-list-numbered"
              titulo="Total hoy"
              :valor="kpiServiciosTotal.peritaje"
              :loading="isLoadingKpis"
              color-card="grey-lighten-5"
              color-icon="grey-darken-2"
            />
          </div>
        </v-col>

        <!-- SOAT -->
        <v-col cols="12" sm="6" md="3" class="d-flex flex-column">
          <DashboardIndicador
            class="flex-grow-1 indicador-card"
            icon="mdi-file-certificate-outline"
            :valor="kpiServicios.soat"
            titulo="SOAT"
            :loading="isLoadingKpis"
            color-card="grey-lighten-4"
            color-icon="amber-darken-2"
          />
          <div class="mt-2 indicador-mini">
            <DashboardIndicadorMini
              icon="mdi-format-list-numbered"
              titulo="Total hoy"
              :valor="kpiServiciosTotal.soat"
              :loading="isLoadingKpis"
              color-card="grey-lighten-5"
              color-icon="grey-darken-2"
            />
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <!-- Acciones rápidas -->
      <div class="section-header mb-3">
        <div class="section-header__bar"></div>
        <h3 class="section-header__title">Acciones rápidas</h3>
      </div>

      <DashboardAcciones
        @crear-turno="goCrearTurno"
        @ver-turnos-proceso="goTurnosDia"
        @ver-historico="goHistorico"
      />
    </v-card>

    <AvisoFlotante v-model="snackbar" />
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDashboardDatos } from '@/composables/dashboard/useDashboardDatos'
import { useAvisos } from '@/composables/dashboard/useAvisos'

import DashboardIndicador from '@/components/dashboard/DashboardIndicador.vue'
import DashboardIndicadorMini from '@/components/dashboard/DashboardIndicadorMini.vue'
import DashboardAcciones from '@/components/dashboard/DashboardAcciones.vue'
import AvisoFlotante from '@/components/dashboard/AvisoFlotante.vue'

const router = useRouter()
const { snackbar, mostrarAviso } = useAvisos()
const {
  turnosEnProceso,
  turnosFinalizados,
  turnosEnProcesoSegundaVez,
  turnosFinalizadosSegundaVez,
  siguienteTurno,
  kpiServicios,
  kpiServiciosTotal,
  isLoadingKpis,
  todayDate,
  cargarDashboard,
} = useDashboardDatos()

// Operativo: las segundas veces se incluyen en el conteo, con la marca "2ª vez".
const tituloConSegundaVez = (titulo: string, n: number) =>
  n > 0 ? `${titulo} (incl. ${n} 2ª vez)` : titulo

function goCrearTurno() { router.push('/rtm/crear-turno') }
function goTurnosDia()  { router.push('/rtm/turnos-dia') }
function goHistorico()  { router.push('/rtm/estado-turnos') }

cargarDashboard().catch((e) => {
  const msg = e?.message || 'No fue posible cargar el dashboard.'
  mostrarAviso(msg, 'error')
})
</script>

<style scoped>
.dashboard-shell {
  max-width: 1200px;
  margin: 0 auto;
  --brand-blue: #0057b7;
  --brand-blue-soft: #e3ecff;
  --brand-yellow: #ffc800;
  --brand-yellow-soft: #fff6cc;
}

.welcome-card {
  width: 100%;
  padding: 16px 16px 24px;
  border-radius: 16px;
  text-align: left;
  background: radial-gradient(circle at top left, #ffffff 0, #f3f4f6 55%, #e5e7eb 100%);
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.10);
  border: 1px solid rgba(148, 163, 184, 0.35);
  position: relative;
  overflow: hidden;
}

.welcome-card__accent {
  position: absolute;
  inset: 0 0 auto 0;
  height: 5px;
  background: linear-gradient(90deg, var(--brand-blue), #2563eb, var(--brand-yellow));
}

.card-header {
  padding-top: 20px;
  padding-bottom: 4px;
  gap: 8px;
}

.card-header__icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: var(--brand-blue-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-blue);
  flex-shrink: 0;
}

.card-header__title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
  word-break: break-word;
}

@media (min-width: 600px) {
  .card-header__title {
    font-size: 1.35rem;
  }
}

.card-header__subtitle {
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: 3px;
}

@media (min-width: 600px) {
  .card-header__subtitle {
    font-size: 0.78rem;
    letter-spacing: 0.18em;
  }
}

.brand-name {
  color: var(--brand-blue);
}

.card-header__date-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--brand-yellow-soft);
  color: #92400e;
  font-size: 0.72rem;
  font-weight: 600;
  border: 1px solid var(--brand-yellow);
}

@media (min-width: 600px) {
  .card-header__date-pill {
    padding: 4px 12px;
    font-size: 0.78rem;
  }
}

.card-header__date-helper {
  font-size: 0.7rem;
  color: #6b7280;
}

.card-header__description {
  font-size: 0.9rem;
  color: #4b5563;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header__bar {
  width: 4px;
  height: 20px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--brand-blue), var(--brand-yellow));
  flex-shrink: 0;
}

.section-header__title {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #374151;
  line-height: 1.3;
}

@media (min-width: 600px) {
  .section-header__title {
    font-size: 0.9rem;
    letter-spacing: 0.12em;
    white-space: nowrap;
  }
}

.mb-3 { margin-bottom: 12px !important; }
.mb-4 { margin-bottom: 16px !important; }
.mb-6 { margin-bottom: 24px !important; }
.mt-1 { margin-top: 4px !important; }
.mt-2 { margin-top: 8px !important; }

.indicador-card :deep(.v-card) {
  min-width: 0;
  width: 100%;
  background: #f3f4f6 !important;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.06);
}

.indicador-mini :deep(.v-card) {
  min-width: 0;
  background: #f9fafb !important;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: none;
}

@media (max-width: 599px) {
  .welcome-card {
    padding: 12px 12px 20px;
  }

  .dashboard-shell {
    padding-top: 16px !important;
    padding-bottom: 16px !important;
  }
}
</style>
