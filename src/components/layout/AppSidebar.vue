<!-- src/components/layout/AppSidebar.vue -->
<template>
  <v-navigation-drawer
    v-model="drawer"
    :permanent="$vuetify.display.mdAndUp"
    :temporary="$vuetify.display.smAndDown"
    :expand-on-hover="$vuetify.display.mdAndUp"
    :rail="$vuetify.display.mdAndUp"
    app
    color="#0B3B82"
    style="margin-top: 56px"
    :width="280"
    :rail-width="64"
  >
    <v-list>
      <v-list-item :subtitle="auth.user?.correo" :title="auth.user?.nombres" class="user-info" />
    </v-list>

    <v-divider class="my-2" />

    <v-list density="compact" nav>
      <!-- Dashboard -->
      <v-list-item
        v-if="can.verDashboard()"
        prepend-icon="mdi-view-dashboard"
        title="Dashboard"
        :to="{ path: '/dashboard' }"
        link
        class="nav-item"
      />

      <!-- Mi Ficha Comercial -->
      <v-list-item
        v-if="can.verMiFichaComercial() && auth.currentAgenteId"
        prepend-icon="mdi-account-star"
        title="Mi Ficha Comercial"
        :to="{
          name: 'FichaComercialAsesor',
          params: { id: auth.currentAgenteId }
        }"
        link
        class="nav-item"
      />

      <!-- Turnos -->
      <v-list-group
        v-if="can.verTurnos()"
        value="rtm"
        prepend-icon="mdi-clipboard-list-outline"
        class="nav-item"
        color="#FACC15"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Turnos" />
        </template>

        <v-list-item
          v-if="can.crearTurno()"
          title="Crear turno"
          :to="{ path: '/rtm/crear-turno' }"
          link
        />
        <v-list-item title="Turnos del día" :to="{ path: '/rtm/turnos-dia' }" link />
        <v-list-item title="Estado turno" :to="{ path: '/rtm/estado-turnos' }" link />
      </v-list-group>

      <!-- Trámites -->
      <v-list-group
        v-if="can.verTramites()"
        value="tramites"
        prepend-icon="mdi-file-document-outline"
        class="nav-item"
        color="#FACC15"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Trámites" />
        </template>

        <v-list-item title="Turnos Trámites" :to="{ path: '/tramites/turnos-tramites' }" link />
      </v-list-group>

      <!-- Comercial -->
      <v-list-group
        v-if="can.verComercial()"
        value="comercial"
        prepend-icon="mdi-briefcase-variant-outline"
        class="nav-item"
        color="#FACC15"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Comercial" />
        </template>

        <!-- Asesores -->
        <v-list-group
          v-if="can.verListadoAgentes()"
          value="comercial-asesores"
          prepend-icon="mdi-account-tie"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Asesores" />
          </template>

          <v-list-item title="Listado / Convenios" :to="{ path: '/comercial/asesores' }" link />
        </v-list-group>

        <!-- Dateos -->
        <v-list-group
          v-if="can.verDateos()"
          value="comercial-dateos"
          prepend-icon="mdi-note-text-outline"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Dateos" />
          </template>

          <v-list-item title="Listado" :to="{ path: '/comercial/dateos' }" link />
          <v-list-item
            v-if="can.crearDateo()"
            title="Nuevo dateo"
            :to="{ path: '/comercial/dateos/nuevo' }"
            link
          />
        </v-list-group>

        <!-- Convenios -->
        <v-list-group
          v-if="can.verConvenios()"
          value="comercial-convenios"
          prepend-icon="mdi-handshake-outline"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Convenios" />
          </template>

          <v-list-item title="Listado" :to="{ path: '/comercial/convenios' }" link />
        </v-list-group>

        <!-- Prospectos -->
        <v-list-group
          v-if="can.verProspectos()"
          value="comercial-prospectos"
          prepend-icon="mdi-account-search-outline"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Prospectos" />
          </template>

          <v-list-item title="Listado" :to="{ path: '/comercial/prospectos' }" link />
          <v-list-item
            v-if="can.crearProspecto()"
            title="Nuevo prospecto"
            :to="{ path: '/comercial/prospectos/nuevo' }"
            link
          />
        </v-list-group>

        <!-- Clientes -->
        <v-list-group
          value="comercial-clientes"
          prepend-icon="mdi-account-multiple-outline"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Clientes" />
          </template>

          <v-list-item title="Listado" :to="{ path: '/clientes' }" link />
        </v-list-group>

        <!-- Comisiones -->
        <v-list-group
          v-if="can.verComisiones()"
          value="comercial-comisiones"
          prepend-icon="mdi-cash-multiple"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Comisiones" />
          </template>

          <v-list-item title="Resumen" :to="{ path: '/comercial/comisiones' }" link />
          <v-list-item
            v-if="can.configurarComisiones()"
            title="Configuración"
            :to="{ name: 'ComercialComisionesConfig' }"
            link
          />
        </v-list-group>

        <!-- 🧾 Comprobantes -->
        <v-list-group
          v-if="can.verComisiones()"
          value="comercial-comprobantes"
          prepend-icon="mdi-receipt-text-outline"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Comprobantes" />
          </template>

          <v-list-item
            title="Comprobantes de pago"
            :to="{ name: 'ComercialComprobantes' }"
            link
          />
        </v-list-group>

        <!-- 🆕 Descuentos -->
        <v-list-group
          v-if="can.verComisiones()"
          value="comercial-descuentos"
          prepend-icon="mdi-tag-multiple"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Descuentos" />
          </template>

          <v-list-item
            title="Descuentos"
            :to="{ name: 'ComercialDescuentos' }"
            link
          />
          <v-list-item
            title="Historial"
            :to="{ name: 'ComercialDescuentosHistorial' }"
            link
          />
          <v-list-item
            v-if="can.verHistoricoFacturacion()"
            title="Facturación"
            :to="{ path: '/facturacion/historico' }"
            link
          />
        </v-list-group>

      </v-list-group>

      <!-- Gestión Documental -->
      <v-list-group
        v-if="can.verGestionDocumental()"
        value="gestion-documental"
        prepend-icon="mdi-folder-file"
        class="nav-item"
        color="#FACC15"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Gestión Documental" />
        </template>

        <v-list-group
          value="razon-social"
          prepend-icon="mdi-domain"
          class="nav-item"
          color="#FACC15"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" title="Razón Social" />
          </template>

          <v-list-item
            title="CDA del Centro"
            :to="{ name: 'RazonSocialDetalle', params: { id: 1, nombre: 'CDA del Centro' } }"
            link
          />
          <v-list-item
            title="CDA Activa"
            :to="{ name: 'RazonSocialDetalle', params: { id: 2, nombre: 'Activautos' } }"
            link
          />
          <v-list-item
            title="JEF & CO"
            :to="{ name: 'RazonSocialDetalle', params: { id: 3, nombre: 'JEF & CO' } }"
            link
          />
          <v-list-item
            title="Activa Marketing"
            :to="{ name: 'RazonSocialDetalle', params: { id: 4, nombre: 'Activa Marketing' } }"
            link
          />
        </v-list-group>

        <v-list-item
          title="Usuarios"
          prepend-icon="mdi-account-group"
          :to="{ name: 'Usuarios' }"
          link
        />
        <v-list-item
          title="Crear contrato"
          prepend-icon="mdi-file-document-edit"
          :to="{ name: 'Contratos' }"
          link
        />
      </v-list-group>

      <!-- Reportes Administrativos -->
      <v-list-group
        v-if="can.verReportesAdmin()"
        value="reportes-admin"
        prepend-icon="mdi-chart-bar"
        class="nav-item"
        color="#FACC15"
      >
        <template #activator="{ props }">
          <v-list-item v-bind="props" title="Reportes Administrativos" />
        </template>

        <!-- Financieros -->
        <v-list-group value="reportes-financieros">
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-currency-usd-circle"
              title="Financieros"
              class="nav-item-sub"
            />
          </template>
          <v-list-item
            prepend-icon="mdi-chart-line"
            title="Ingresos por Canal"
            :to="{ name: 'ReporteIngresosCanal' }"
            link
            class="nav-item-child"
          />
          <v-list-item
            prepend-icon="mdi-account-group"
            title="Producción por Líder"
            :to="{ name: 'ReporteProduccionLider' }"
            link
            class="nav-item-child"
          />
          <v-list-item
            prepend-icon="mdi-car-wrench"
            title="Servicios"
            :to="{ name: 'ReporteServicios' }"
            link
            class="nav-item-child"
          />
          <v-list-item
            prepend-icon="mdi-target"
            title="Meta Mensual"
            :to="{ name: 'ReporteMetaMensual' }"
            link
            class="nav-item-child"
          />
        </v-list-group>

        <!-- Comercial -->
        <v-list-group value="reportes-comercial">
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-handshake"
              title="Comercial"
              class="nav-item-sub"
            />
          </template>
          <v-list-item
            prepend-icon="mdi-account-tie"
            title="Asesores"
            :to="{ name: 'ReporteAsesores' }"
            link
            class="nav-item-child"
          />
          <v-list-item
            prepend-icon="mdi-account-reactivate"
            title="Retención de Clientes"
            :to="{ name: 'ReporteRetencion' }"
            link
            class="nav-item-child"
          />
          <v-list-item
            prepend-icon="mdi-cash-multiple"
            title="Comisiones y Pagos"
            :to="{ name: 'ReporteComisiones' }"
            link
            class="nav-item-child"
          />
        </v-list-group>

        <!-- Gestión -->
        <v-list-group value="reportes-gestion">
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-cog-outline"
              title="Gestión"
              class="nav-item-sub"
            />
          </template>
          <v-list-item
            prepend-icon="mdi-tag-multiple"
            title="Descuentos"
            :to="{ name: 'ReporteDescuentos' }"
            link
            class="nav-item-child"
          />
          <v-list-item
            prepend-icon="mdi-currency-usd"
            title="Tarifas por Servicio"
            :to="{ name: 'TarifasServicios' }"
            link
            class="nav-item-child"
          />
        </v-list-group>
      </v-list-group>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/AuthStore'
import { usePermissions } from '@/composables/usePermissions'
import { useDrawer } from '@/composables/useDrawer'

const auth = useAuthStore()
const { can } = usePermissions()
const { drawer } = useDrawer()
</script>

<style scoped>
.v-navigation-drawer {
  background: linear-gradient(180deg, #0b3b82, #0057b7);
  color: #e5e7eb;
  z-index: 1000;
  border-right: 1px solid rgba(15, 23, 42, 0.18);
}

/* Ajustar margen top según tamaño de navbar */
@media (min-width: 600px) {
  .v-navigation-drawer {
    margin-top: 64px !important;
  }
}

.v-navigation-drawer.v-navigation-drawer--expand-on-hover:not(.v-navigation-drawer--rail) {
  width: 280px !important;
  min-width: 280px !important;
}

.nav-item-sub {
  padding-left: 16px !important;
}

.nav-item-child {
  padding-left: 32px !important;
}

.user-info {
  padding-top: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.35);
}

.user-info :deep(.v-list-item-title) {
  font-weight: 600;
  font-size: 0.9rem;
  color: #f9fafb;
}

.user-info :deep(.v-list-item-subtitle) {
  font-size: 0.78rem;
  color: #e5e7eb;
  opacity: 0.8;
}

.nav-item :deep(.v-list-item-title) {
  font-weight: 500;
  font-size: 0.86rem;
}

:deep(.v-list-item) {
  color: #e5e7eb !important;
}

:deep(.v-list-item .v-icon) {
  color: #e5e7eb !important;
}

:deep(.v-list-item:hover) {
  background-color: rgba(15, 23, 42, 0.35) !important;
}

:deep(.v-list-item--active) {
  background-color: rgba(250, 204, 21, 0.18) !important;
  color: #facc15 !important;
}

:deep(.v-list-item--active .v-list-item-title),
:deep(.v-list-item--active .v-list-item-subtitle),
:deep(.v-list-item--active .v-icon) {
  color: #facc15 !important;
}
</style>