<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">
      <v-card-title class="py-5 d-flex align-center justify-space-between flex-wrap">
        <div class="text-h5 font-weight-bold">
          ⚙️ Configuración de comisiones
        </div>
      </v-card-title>

      <v-card-subtitle class="px-6">
        Define los valores estándar de comisión por <strong>incentivo</strong> y por
        <strong>dateo</strong>, según el tipo de vehículo y opcionalmente por
        <strong>asesor o convenio</strong>. También puedes configurar las
        <strong>metas mensuales de RTM</strong> y las
        <strong>reglas de recurrencia</strong> para clientes que regresan.
      </v-card-subtitle>

      <v-divider class="my-3" />

      <!-- Toggle secciones (3 pestañas) -->
      <v-card-text class="pt-0 pb-0 px-4 px-sm-6">
        <v-row class="mb-2">
          <v-col cols="12">
            <v-btn-toggle
              v-model="activeSection"
              mandatory
              rounded="xl"
              divided
              style="width: 100%"
            >
              <v-btn value="REGLAS" size="small" style="flex: 1">
                <span class="d-none d-sm-inline">Reglas de comisión</span>
                <span class="d-sm-none">Reglas</span>
              </v-btn>
              <v-btn value="METAS" size="small" style="flex: 1">
                <span class="d-none d-sm-inline">Metas mensuales</span>
                <span class="d-sm-none">Metas</span>
              </v-btn>
              <v-btn value="RECURRENCIA" size="small" style="flex: 1">
                <span class="d-none d-sm-inline">🔄 Recurrencia</span>
                <span class="d-sm-none">🔄</span>
              </v-btn>
              <v-btn value="CONTINUIDAD" size="small" style="flex: 1">
                <span class="d-none d-sm-inline">🔗 Continuidad</span>
                <span class="d-sm-none">🔗</span>
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- ===================== SECCIÓN REGLAS DE COMISIÓN ===================== -->
      <v-card-text v-if="activeSection === 'REGLAS'" class="pt-4">
        <v-row class="mb-2" dense>
          <!-- Alcance -->
          <v-col cols="12" sm="6" md="3">
            <div class="mb-1 text-subtitle-2 text-medium-emphasis">
              Alcance
            </div>
            <v-btn-toggle
              v-model="scope"
              mandatory
              rounded="xl"
              divided
              style="width: 100%"
            >
              <v-btn value="GLOBAL" size="small" style="flex: 1">
                Global
              </v-btn>
              <v-btn value="ASESOR" size="small" style="flex: 1">
                <span class="d-none d-sm-inline">Por asesor</span>
                <span class="d-sm-none">Asesor</span>
              </v-btn>
            </v-btn-toggle>
          </v-col>

          <!-- Tipo asesor -->
          <v-col cols="6" sm="6" md="3">
            <v-select
              v-if="scope === 'ASESOR'"
              v-model="tipoAsesor"
              :items="tipoAsesorItems"
              item-title="label"
              item-value="value"
              label="Tipo de asesor"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>

          <!-- Asesor / Convenio -->
          <v-col cols="6" sm="6" md="3">
            <v-autocomplete
              v-if="scope === 'ASESOR'"
              v-model="form.asesorId"
              :items="asesoresFiltrados"
              item-title="nombre"
              item-value="id"
              label="Asesor"
              density="comfortable"
              variant="outlined"
              :loading="asesoresLoading"
              hide-details
              clearable
            />
          </v-col>

          <!-- Tipo de vehículo -->
          <v-col cols="12" md="3">
            <v-select
              v-model="form.tipoVehiculo"
              :items="tipoVehiculoItems"
              item-title="label"
              item-value="value"
              label="Tipo de vehículo"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>
        </v-row>

        <!-- Fila 1: incentivo base + específicos por tipo 🆕 -->
        <v-row dense>
          <!-- Incentivo base -->
<v-col cols="12" md="4">
  <v-text-field
    v-model="form.valorPlaca"
    label="💼 Incentivo base (fallback)"
    hint="Se usa si no hay valor específico"
    persistent-hint
    type="number"
    min="0"
    density="comfortable"
    variant="outlined"
    prefix="$"
  />
</v-col>

<!-- SOLO VEHÍCULO -->
<v-col cols="12" md="4" v-if="form.tipoVehiculo === 'VEHICULO' || form.tipoVehiculo === 'AMBOS'">
  <v-text-field
    v-model="form.valorPlacaVehiculo"
    label="💼 Incentivo específico vehículo"
    type="number"
    min="0"
    density="comfortable"
    variant="outlined"
    prefix="$"
    clearable
  />
</v-col>

<!-- SOLO MOTO -->
<v-col cols="12" md="4" v-if="form.tipoVehiculo === 'MOTO' || form.tipoVehiculo === 'AMBOS'">
  <v-text-field
    v-model="form.valorPlacaMoto"
    label="💼 Incentivo específico moto"
    type="number"
    min="0"
    density="comfortable"
    variant="outlined"
    prefix="$"
    clearable
  />
</v-col>
        </v-row>

        <!-- Fila 2: dateo nuevo + nuevo directo -->
        <v-row dense class="mt-2">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.valorDateo"
              label="📋 Comisión dateo (via convenio)"
hint="Comercial datea CON convenio — aplica siempre sin importar tipo de cliente"
              persistent-hint
              type="number"
              min="0"
              density="comfortable"
              variant="outlined"
              prefix="$"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.valorNuevoDirecto"
              label="🌟 Comisión cliente nuevo directo"
              hint="Comercial datea cliente nuevo SIN convenio"
              persistent-hint
              type="number"
              min="0"
              density="comfortable"
              variant="outlined"
              prefix="$"
            />
          </v-col>
        </v-row>

        <v-row dense class="mt-2">
          <v-col cols="12" class="d-flex align-end justify-end gap-2">
            <v-btn
              color="primary"
              :loading="saving"
              :disabled="!canSubmit"
              @click="submitForm"
            >
              {{ form.id ? 'Actualizar regla' : 'Guardar regla' }}
            </v-btn>

            <v-btn
              variant="text"
              :disabled="saving && !form.id"
              @click="resetForm"
            >
              Limpiar
            </v-btn>
          </v-col>
        </v-row>

        <!-- Alerta informativa -->
        <v-alert type="info" variant="tonal" class="mt-3 mb-2 text-caption">
          <strong>Recurrente / Recuperación:</strong> esos valores se configuran en la pestaña
          <strong>🔄 Recurrencia</strong> (aplican automáticamente cuando el RepGeneral los detecta).
        </v-alert>

        <v-row v-if="formPreview" class="mt-1" dense>
          <v-col cols="12">
            <v-chip variant="tonal" size="small" class="mr-2">
              Alcance:
              <strong class="ms-1">{{ formPreview.alcance }}</strong>
            </v-chip>
            <v-chip
              v-if="scope === 'ASESOR' && formPreview.asesorNombre"
              variant="tonal"
              size="small"
              class="mr-2"
            >
              Asesor / Convenio:
              <strong class="ms-1">{{ formPreview.asesorNombre }}</strong>
            </v-chip>
            <v-chip variant="tonal" size="small" class="mr-2">
              Tipo vehículo:
              <strong class="ms-1">{{ formPreview.tipoVehiculoLabel }}</strong>
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
<v-card-text
        v-if="activeSection === 'REGLAS'"
        class="pt-4"
      >
        <div class="d-flex justify-space-between align-center mb-3 flex-wrap gap-2">
          <div class="text-subtitle-1 font-weight-medium">
            Reglas configuradas
          </div>
          <div class="text-caption text-medium-emphasis">
            Total reglas:
            <strong>{{ configs.length }}</strong>
          </div>
        </div>

        <v-data-table
          :headers="headers"
          :items="configs"
          :loading="loading"
          item-key="id"
          density="comfortable"
        >
          <template #item.alcance="{ item }">
            <v-chip
              size="small"
              :color="item.asesor_id ? 'info' : 'primary'"
              variant="tonal"
            >
              {{ item.asesor_id ? 'Por asesor / convenio' : 'Global' }}
            </v-chip>
          </template>

          <template #item.asesor="{ item }">
            <span v-if="item.asesor_id">
              {{ findAsesorNombre(item.asesor_id) || `#${item.asesor_id}` }}
            </span>
            <span v-else class="text-medium-emphasis">— Todos —</span>
          </template>

          <template #item.tipo_vehiculo="{ item }">
            {{ tipoVehiculoLabel(item.tipo_vehiculo) }}
          </template>

          <template #item.valor_placa="{ item }">
            <span class="text-caption">💼 {{ formatCOP(item.valor_placa) }}</span>
          </template>

          <!-- 🆕 -->
          <template #item.valor_placa_vehiculo="{ item }">
            <span class="text-caption">
              {{ item.valor_placa_vehiculo != null ? '🚗 ' + formatCOP(item.valor_placa_vehiculo) : '—' }}
            </span>
          </template>

          <!-- 🆕 -->
          <template #item.valor_placa_moto="{ item }">
            <span class="text-caption">
              {{ item.valor_placa_moto != null ? '🏍️ ' + formatCOP(item.valor_placa_moto) : '—' }}
            </span>
          </template>

          <template #item.valor_dateo="{ item }">
            <span class="text-caption">📋 {{ formatCOP(item.valor_dateo) }}</span>
          </template>

          <template #item.valor_nuevo_directo="{ item }">
            <span class="text-caption">🌟 {{ formatCOP(item.valor_nuevo_directo) }}</span>
          </template>

          <template #item.fecha_calculo="{ item }">
            {{ formatDateTime(item.fecha_calculo) }}
          </template>

          <template #item.acciones="{ item }">
            <div class="d-flex gap-1">
              <v-btn
                size="small"
                variant="text"
                icon="mdi-pencil"
                @click="editConfig(item)"
              />
              <v-btn
                size="small"
                variant="text"
                color="error"
                icon="mdi-delete"
                @click="confirmDelete(item)"
              />
            </div>
          </template>

          <template #no-data>
            <div class="text-center py-6 text-medium-emphasis">
              No hay reglas configuradas todavía.
            </div>
          </template>
        </v-data-table>
      </v-card-text>

      <!-- ===================== SECCIÓN METAS MENSUALES ===================== -->
      <v-card-text
        v-else-if="activeSection === 'METAS'"
        class="pt-4"
      >
        <!-- Form metas -->
        <v-row class="mb-2" dense>
          <v-col cols="12" md="4">
            <v-autocomplete
              v-model="metaForm.asesorId"
              :items="asesoresComerciales"
              item-title="nombre"
              item-value="id"
              label="Asesor comercial"
              density="comfortable"
              variant="outlined"
              :loading="asesoresLoading"
              hide-details
              clearable
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="metaForm.metaMensual"
              label="Meta mensual RTM (cantidad)"
              type="number"
              min="0"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="metaForm.porcentajeExtra"
              label="% de comisión extra sobre facturación"
              type="number"
              min="0"
              max="100"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
              suffix="%"
            />
          </v-col>
        </v-row>

        <!-- Tipo de meta + valores RTM -->
        <v-row dense class="mt-1">
          <v-col cols="12" md="4">
            <v-select
              v-model="metaForm.tipoVehiculo"
              :items="metaTipoVehiculoItems"
              item-title="label"
              item-value="value"
              label="Tipo de meta"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="metaForm.valorRtmMoto"
              label="Valor RTM moto"
              type="number"
              min="0"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
              prefix="$"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="metaForm.valorRtmVehiculo"
              label="Valor RTM vehículo"
              type="number"
              min="0"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
              prefix="$"
            />
          </v-col>
        </v-row>

        <v-row dense class="mt-2">
          <v-col cols="12" class="d-flex justify-end gap-2">
            <v-btn
              color="primary"
              :loading="saving"
              :disabled="!canSubmitMeta"
              @click="submitMeta"
            >
              {{ metaForm.id ? 'Actualizar meta' : 'Guardar meta' }}
            </v-btn>
            <v-btn
              variant="text"
              :disabled="saving && !metaForm.id"
              @click="resetMetaForm"
            >
              Limpiar
            </v-btn>
          </v-col>
        </v-row>

        <!-- Tabla metas -->
        <div class="d-flex justify-space-between align-center mb-3 mt-4 flex-wrap gap-2">
          <div class="text-subtitle-1 font-weight-medium">
            Metas mensuales configuradas
          </div>
          <div class="text-caption text-medium-emphasis">
            Total metas:
            <strong>{{ metas.length }}</strong>
          </div>
        </div>

        <v-data-table
          :headers="metaHeaders"
          :items="metas"
          :loading="metasLoading"
          item-key="id"
          density="comfortable"
        >
          <template #item.asesor="{ item }">
            {{ findAsesorNombre(item.asesor_id) || `#${item.asesor_id}` }}
          </template>

          <template #item.tipo_vehiculo="{ item }">
            <span v-if="item.tipo_vehiculo === 'MOTO'">Solo motos</span>
            <span v-else-if="item.tipo_vehiculo === 'VEHICULO'">Solo vehículos</span>
            <span v-else>Global</span>
          </template>

          <template #item.meta_mensual="{ item }">
            {{ item.meta_mensual ?? 0 }} RTM
          </template>

          <template #item.valor_rtm_moto="{ item }">
            {{ item.valor_rtm_moto ? formatCOP(item.valor_rtm_moto) : '—' }}
          </template>

          <template #item.valor_rtm_vehiculo="{ item }">
            {{ item.valor_rtm_vehiculo ? formatCOP(item.valor_rtm_vehiculo) : '—' }}
          </template>

          <template #item.porcentaje_extra="{ item }">
            {{ (item.porcentaje_extra ?? 0) + '%' }}
          </template>

          <template #item.fecha_actualizacion="{ item }">
            {{ formatDateTime(item.fecha_actualizacion) }}
          </template>

          <template #item.acciones="{ item }">
            <div class="d-flex gap-1">
              <v-btn
                size="small"
                variant="text"
                icon="mdi-pencil"
                @click="editMeta(item)"
              />
              <v-btn
                size="small"
                variant="text"
                color="error"
                icon="mdi-delete"
                @click="confirmDeleteMeta(item)"
              />
            </div>
          </template>

          <template #no-data>
            <div class="text-center py-6 text-medium-emphasis">
              No hay metas mensuales configuradas todavía.
            </div>
          </template>
        </v-data-table>
      </v-card-text>

      <!-- ===================== SECCIÓN RECURRENCIA ===================== -->
      <v-card-text v-else-if="activeSection === 'RECURRENCIA'" class="pt-4">
        <!-- Configuración global -->
        <div class="mb-4">
          <div class="text-subtitle-1 font-weight-medium mb-3">
            🌐 Configuración global de recurrencia
          </div>

          <!-- Fila 1: meses + valores base (fallback) -->
          <v-row dense>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="recurrenciaGlobal.meses_minimos"
                label="Meses mínimos desde última visita"
                type="number"
                min="1"
                density="comfortable"
                variant="outlined"
                hide-details="auto"
                suffix="meses"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="recurrenciaGlobal.valor_dateo_recurrencia"
                label="🔄 Recurrente base (fallback)"
                hint="Se usa si no hay valor por tipo de vehículo"
                persistent-hint
                type="number"
                min="0"
                density="comfortable"
                variant="outlined"
                prefix="$"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="recurrenciaGlobal.valor_dateo_recuperacion"
                label="💛 Recuperación base (fallback)"
                hint="Se usa si no hay valor por tipo de vehículo"
                persistent-hint
                type="number"
                min="0"
                density="comfortable"
                variant="outlined"
                prefix="$"
              />
            </v-col>
          </v-row>

          <!-- Fila 2 — valores específicos por tipo de vehículo -->
          <v-row dense class="mt-3">
            <v-col cols="12" class="text-caption text-medium-emphasis mb-1">
              Valores específicos por tipo de vehículo (opcional — si están vacíos usa el valor base de arriba)
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="recurrenciaGlobal.valor_dateo_recurrencia_vehiculo"
                label="🔄 Recurrente 🚗 Vehículo"
                type="number"
                min="0"
                density="comfortable"
                variant="outlined"
                hide-details="auto"
                prefix="$"
                clearable
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="recurrenciaGlobal.valor_dateo_recurrencia_moto"
                label="🔄 Recurrente 🏍️ Moto"
                type="number"
                min="0"
                density="comfortable"
                variant="outlined"
                hide-details="auto"
                prefix="$"
                clearable
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="recurrenciaGlobal.valor_dateo_recuperacion_vehiculo"
                label="💛 Recuperación 🚗 Vehículo"
                type="number"
                min="0"
                density="comfortable"
                variant="outlined"
                hide-details="auto"
                prefix="$"
                clearable
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="recurrenciaGlobal.valor_dateo_recuperacion_moto"
                label="💛 Recuperación 🏍️ Moto"
                type="number"
                min="0"
                density="comfortable"
                variant="outlined"
                hide-details="auto"
                prefix="$"
                clearable
              />
            </v-col>
          </v-row>

          <v-row dense class="mt-2">
            <v-col cols="12" md="3" class="d-flex align-end">
              <v-btn
                color="primary"
                :loading="savingRecurrencia"
                @click="guardarRecurrenciaGlobal"
                block
              >
                Guardar configuración global
              </v-btn>
            </v-col>
          </v-row>

          <v-alert type="info" variant="tonal" class="mt-3">
            <strong>Nota:</strong>
            Si el cliente vino hace <strong>menos de {{ recurrenciaGlobal.meses_minimos }} meses</strong>
            → 🔄 <strong>Recurrente</strong>: dateo cobra <strong>{{ formatCOP(recurrenciaGlobal.valor_dateo_recurrencia) }}</strong>.
            Si vino hace <strong>más de {{ recurrenciaGlobal.meses_minimos }} meses</strong>
            → 💛 <strong>Recuperación</strong>: dateo cobra <strong>{{ formatCOP(recurrenciaGlobal.valor_dateo_recuperacion) }}</strong>.
            Si nunca ha venido → 🆕 <strong>Nuevo</strong>: comisión normal.
            Los valores específicos por tipo de vehículo tienen prioridad sobre el valor base si están configurados.
          </v-alert>
        </div>

        <v-divider class="my-5" />

        <!-- Configuración por asesor -->
        <div>
          <div class="text-subtitle-1 font-weight-medium mb-3">
            👤 Configuración por asesor
          </div>

          <!-- Form -->
          <v-row dense class="mb-3">
            <v-col cols="12" md="2">
              <v-select
                v-model="tipoAsesorRecurrencia"
                :items="tipoAsesorItems"
                item-title="label"
                item-value="value"
                label="Tipo de asesor"
                density="comfortable"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-autocomplete
                v-model="recurrenciaForm.asesorId"
                :items="asesoresFiltradosRecurrencia"
                item-title="nombre"
                item-value="id"
                label="Asesor"
                density="comfortable"
                variant="outlined"
                :loading="asesoresLoading"
                hide-details
                clearable
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-switch
                v-model="recurrenciaForm.habilitada"
                label="Habilitada"
                color="primary"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model="recurrenciaForm.mesesMinimos"
                label="Meses mínimos (opcional)"
                type="number"
                min="1"
                density="comfortable"
                variant="outlined"
                hide-details
                clearable
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model="recurrenciaForm.valorDateo"
                label="🔄 Dateo recurrente (opc.)"
                type="number"
                min="0"
                density="comfortable"
                variant="outlined"
                hide-details
                prefix="$"
                clearable
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model="recurrenciaForm.valorDateoRecuperacion"
                label="💛 Dateo recuperación (opc.)"
                type="number"
                min="0"
                density="comfortable"
                variant="outlined"
                hide-details
                prefix="$"
                clearable
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-select
                v-model="recurrenciaForm.tipoVehiculo"
                :items="recurrenciaTipoVehiculoItems"
                item-title="label"
                item-value="value"
                label="Tipo vehículo"
                density="comfortable"
                variant="outlined"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="1" class="d-flex align-center">
              <v-btn
                color="primary"
                :loading="savingRecurrencia"
                :disabled="!recurrenciaForm.asesorId"
                @click="guardarRecurrenciaAsesor"
                icon="mdi-content-save"
              />
            </v-col>
          </v-row>

          <!-- Tabla -->
          <v-data-table
            :headers="recurrenciaHeaders"
            :items="recurrenciasAsesores"
            :loading="loadingRecurrencia"
            item-key="id"
            density="comfortable"
          >
            <template #item.asesor="{ item }">
              {{ item.asesor_nombre || `#${item.asesor_id}` }}
            </template>

            <template #item.habilitada="{ item }">
              <v-chip
                size="small"
                :color="item.recurrencia_habilitada ? 'success' : 'error'"
                variant="flat"
              >
                {{ item.recurrencia_habilitada ? 'Sí' : 'No' }}
              </v-chip>
            </template>

            <template #item.meses_minimos="{ item }">
              <span v-if="item.meses_minimos">{{ item.meses_minimos }} meses</span>
              <span v-else class="text-medium-emphasis">Global ({{ recurrenciaGlobal.meses_minimos }})</span>
            </template>

            <template #item.valor_dateo_recurrencia="{ item }">
              <span v-if="item.valor_dateo_recurrencia">
                {{ formatCOP(item.valor_dateo_recurrencia) }}
              </span>
              <span v-else class="text-medium-emphasis text-caption">
                Global ({{ formatCOP(recurrenciaGlobal.valor_dateo_recurrencia) }})
              </span>
            </template>

            <template #item.valor_dateo_recuperacion="{ item }">
              <span v-if="item.valor_dateo_recuperacion">
                {{ formatCOP(item.valor_dateo_recuperacion) }}
              </span>
              <span v-else class="text-medium-emphasis text-caption">
                Global ({{ formatCOP(recurrenciaGlobal.valor_dateo_recuperacion) }})
              </span>
            </template>

            <template #item.tipo_vehiculo="{ item }">
              <span v-if="item.tipo_vehiculo === 'MOTO'">Solo motos</span>
              <span v-else-if="item.tipo_vehiculo === 'VEHICULO'">Solo vehículos</span>
              <span v-else>Ambos</span>
            </template>

            <template #item.acciones="{ item }">
              <div class="d-flex gap-1">
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-pencil"
                  @click="editarRecurrenciaAsesor(item)"
                />
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  icon="mdi-delete"
                  @click="confirmarEliminarRecurrencia(item)"
                />
              </div>
            </template>

            <template #no-data>
              <div class="text-center py-6 text-medium-emphasis">
                No hay configuraciones de recurrencia por asesor.
              </div>
            </template>
          </v-data-table>
        </div>
      </v-card-text>

      <!-- ===================== SECCIÓN CONTINUIDAD ===================== -->
      <v-card-text v-else-if="activeSection === 'CONTINUIDAD'" class="pt-4">
        <v-alert type="info" variant="tonal" density="compact" class="mb-4 text-caption">
          Úsala cuando haya una discusión puntual con un asesor convenio sobre si se le
          respetó o no la continuidad. Busca por placa o cédula, revisa el historial que ve
          el sistema y, si hace falta, fuerza el resultado manualmente.
        </v-alert>

        <v-row dense class="mb-2">
          <v-col cols="12" sm="4" md="3">
            <v-btn-toggle v-model="continuidadTipoBusqueda" mandatory rounded="xl" divided style="width: 100%">
              <v-btn value="placa" size="small" style="flex: 1">Placa</v-btn>
              <v-btn value="cedula" size="small" style="flex: 1">Cédula</v-btn>
            </v-btn-toggle>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="continuidadQuery"
              :label="continuidadTipoBusqueda === 'placa' ? 'Placa' : 'Cédula del cliente'"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @keyup.enter="buscarContinuidadUI"
            />
          </v-col>
          <v-col cols="12" sm="2" md="2">
            <v-btn
              color="primary"
              block
              :loading="continuidadLoading"
              :disabled="!continuidadQuery"
              @click="buscarContinuidadUI"
            >
              Buscar
            </v-btn>
          </v-col>
        </v-row>

        <v-alert v-if="continuidadError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ continuidadError }}
        </v-alert>

        <!-- Cédula con varias placas: hay que elegir una -->
        <div v-if="continuidadPlacasParaElegir.length > 0" class="mb-4">
          <div class="text-subtitle-2 mb-2">
            Esta cédula tiene {{ continuidadPlacasParaElegir.length }} placas asociadas — elige una:
          </div>
          <v-chip
            v-for="p in continuidadPlacasParaElegir"
            :key="p"
            class="mr-2 mb-2"
            color="primary"
            variant="outlined"
            @click="buscarPorPlacaDirecta(p)"
          >
            {{ p }}
          </v-chip>
        </div>

        <!-- Resultado: historial + override -->
        <div v-if="continuidadResultado?.placa">
          <div class="text-subtitle-1 font-weight-bold mb-2">
            Historial de {{ continuidadResultado.placa }}
          </div>

          <div class="mb-4" style="overflow-x: auto">
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Canal</th>
                  <th>Asesor / Convenio</th>
                  <th>Continuidad del turno</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!continuidadResultado.visitas?.length">
                  <td colspan="4" class="text-center text-medium-emphasis py-4">
                    Sin turnos registrados para esta placa.
                  </td>
                </tr>
                <tr v-for="v in continuidadResultado.visitas" :key="v.turnoId">
                  <td>{{ v.fecha }}</td>
                  <td>{{ v.canal || '— (fachada / walk-in)' }}</td>
                  <td>{{ v.asesorConvenioNombre || v.agenteNombre || v.convenioNombre || '—' }}</td>
                  <td>
                    <v-chip
                      v-if="v.estadoContinuidad"
                      size="small"
                      :color="continuidadChipColor(v.estadoContinuidad)"
                      variant="flat"
                    >
                      {{ continuidadChipLabel(v.estadoContinuidad) }}
                    </v-chip>
                    <span v-else class="text-medium-emphasis">—</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <v-divider class="mb-4" />

          <div class="text-subtitle-1 font-weight-bold mb-2">Overrides activos en esta placa</div>
          <div class="mb-4" style="overflow-x: auto">
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th>Asesor / Convenio</th>
                  <th>Estado</th>
                  <th>Motivo</th>
                  <th>Actualizado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!continuidadResultado.overrides?.length">
                  <td colspan="4" class="text-center text-medium-emphasis py-4">
                    Sin overrides — la continuidad se calcula automáticamente.
                  </td>
                </tr>
                <tr v-for="o in continuidadResultado.overrides" :key="o.id">
                  <td>{{ o.asesorConvenio?.nombre || o.convenio?.nombre || '—' }}</td>
                  <td>
                    <v-chip size="small" :color="overrideChipColor(o.estado)" variant="flat">
                      {{ o.estado }}
                    </v-chip>
                  </td>
                  <td>{{ o.motivo || '—' }}</td>
                  <td>{{ formatFechaCorta(o.updatedAt) }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <v-divider class="mb-4" />

          <div class="text-subtitle-1 font-weight-bold mb-3">Fijar override manual</div>
          <v-row dense>
            <v-col cols="12" sm="6" md="4">
              <v-select
                v-model="overrideForm.asesorConvenioId"
                :items="continuidadAsesoresDisponibles"
                item-title="nombre"
                item-value="id"
                label="Asesor convenio"
                variant="outlined"
                density="comfortable"
                clearable
                hint="A cuál asesor convenio le aplica el override"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="overrideForm.estado"
                :items="[
                  { title: 'Automático (decide el sistema)', value: 'AUTOMATICO' },
                  { title: 'Forzar continuidad SÍ', value: 'FORZAR_SI' },
                  { title: 'Forzar continuidad NO', value: 'FORZAR_NO' },
                ]"
                item-title="title"
                item-value="value"
                label="Estado"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="5">
              <v-text-field
                v-model="overrideForm.motivo"
                label="Motivo"
                :hint="overrideForm.estado !== 'AUTOMATICO' ? 'Obligatorio si no es Automático' : ''"
                persistent-hint
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
          <v-row dense class="mt-1">
            <v-col cols="12" class="d-flex justify-end">
              <v-btn
                color="primary"
                :loading="overrideSaving"
                :disabled="!overrideForm.asesorConvenioId"
                @click="guardarOverrideUI"
              >
                Guardar override
              </v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>

    <!-- Diálogo eliminar regla comisión -->
    <v-dialog v-model="deleteDialog.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">
          Eliminar regla de comisión
        </v-card-title>
        <v-card-text>
          ¿Seguro que deseas eliminar esta regla?
          <div v-if="deleteDialog.item" class="mt-3 text-body-2">
            <div>
              <strong>Alcance:</strong>
              {{ deleteDialog.item.asesor_id ? 'Por asesor / convenio' : 'Global' }}
            </div>
            <div>
              <strong>Tipo vehículo:</strong>
              {{ tipoVehiculoLabel(deleteDialog.item.tipo_vehiculo) }}
            </div>
            <div>
              <strong>Incentivo base:</strong>
              {{ formatCOP(deleteDialog.item.valor_placa) }}
            </div>
            <!-- 🆕 -->
            <div v-if="deleteDialog.item.valor_placa_vehiculo != null">
              <strong>Incentivo vehículo:</strong>
              {{ formatCOP(deleteDialog.item.valor_placa_vehiculo) }}
            </div>
            <!-- 🆕 -->
            <div v-if="deleteDialog.item.valor_placa_moto != null">
              <strong>Incentivo moto:</strong>
              {{ formatCOP(deleteDialog.item.valor_placa_moto) }}
            </div>
            <div>
              <strong>Dateo (via convenio):</strong>
              {{ formatCOP(deleteDialog.item.valor_dateo) }}
            </div>
            <div>
              <strong>Nuevo directo (sin convenio):</strong>
              {{ formatCOP(deleteDialog.item.valor_nuevo_directo) }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.visible = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="doDelete"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo eliminar meta mensual -->
    <v-dialog v-model="metaDeleteDialog.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">
          Eliminar meta mensual
        </v-card-title>
        <v-card-text>
          ¿Seguro que deseas eliminar esta meta mensual?
          <div v-if="metaDeleteDialog.item" class="mt-3 text-body-2">
            <div>
              <strong>Asesor:</strong>
              {{ findAsesorNombre(metaDeleteDialog.item.asesor_id) || ('#' + metaDeleteDialog.item.asesor_id) }}
            </div>
            <div>
              <strong>Tipo meta:</strong>
              <span v-if="metaDeleteDialog.item.tipo_vehiculo === 'MOTO'">Solo motos</span>
              <span v-else-if="metaDeleteDialog.item.tipo_vehiculo === 'VEHICULO'">Solo vehículos</span>
              <span v-else>Global</span>
            </div>
            <div>
              <strong>Meta mensual:</strong>
              {{ (metaDeleteDialog.item.meta_mensual ?? 0) + ' RTM' }}
            </div>
            <div>
              <strong>Valor RTM moto:</strong>
              {{ metaDeleteDialog.item.valor_rtm_moto ? formatCOP(metaDeleteDialog.item.valor_rtm_moto) : '—' }}
            </div>
            <div>
              <strong>Valor RTM vehículo:</strong>
              {{ metaDeleteDialog.item.valor_rtm_vehiculo ? formatCOP(metaDeleteDialog.item.valor_rtm_vehiculo) : '—' }}
            </div>
            <div>
              <strong>% extra:</strong>
              {{ (metaDeleteDialog.item.porcentaje_extra ?? 0) + '%' }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="metaDeleteDialog.visible = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="doDeleteMeta"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo eliminar recurrencia -->
    <v-dialog v-model="recurrenciaDeleteDialog.visible" max-width="420">
      <v-card>
        <v-card-title class="text-h6">
          Eliminar configuración de recurrencia
        </v-card-title>
        <v-card-text>
          ¿Seguro que deseas eliminar esta configuración?
          <div v-if="recurrenciaDeleteDialog.item" class="mt-3 text-body-2">
            <div>
              <strong>Asesor:</strong>
              {{ recurrenciaDeleteDialog.item.asesor_nombre || `#${recurrenciaDeleteDialog.item.asesor_id}` }}
            </div>
            <div>
              <strong>Habilitada:</strong>
              {{ recurrenciaDeleteDialog.item.recurrencia_habilitada ? 'Sí' : 'No' }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="recurrenciaDeleteDialog.visible = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="doDeleteRecurrencia"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  listConfigsComision,
  upsertConfigComision,
  updateConfigComision,
  deleteConfigComision,
  listAgentesCaptacion,
  formatCOP,
  listMetasMensuales,
  upsertMetaMensual,
  updateMetaMensual,
  deleteMetaMensual,
  getConfigRecurrenciaGlobal,
  updateConfigRecurrenciaGlobal,
  listConfigRecurrenciaAsesores,
  upsertConfigRecurrenciaAsesor,
  deleteConfigRecurrenciaAsesor,
  buscarContinuidad,
  guardarContinuidadOverride,
  type ComisionConfig,
  type ComisionConfigPayload,
  type TipoVehiculoComision,
  type AgenteLight,
  type ConfigRecurrenciaGlobal,
  type ConfigRecurrenciaAsesor,
  type ContinuidadBusqueda,
  type ContinuidadOverrideEstado,
} from '@/services/comisionesService'

type Scope = 'GLOBAL' | 'ASESOR'
type Section = 'REGLAS' | 'METAS' | 'RECURRENCIA' | 'CONTINUIDAD'

/** Metas mensuales (por asesor, opción global o por tipo de vehículo) */
type MetaMensualConfig = {
  id: number
  asesor_id: number
  tipo_vehiculo: TipoVehiculoComision | null
  meta_mensual: number
  porcentaje_extra: number
  valor_rtm_moto?: number | null
  valor_rtm_vehiculo?: number | null
  fecha_actualizacion?: string | null
}

type MetaMensualPayload = {
  asesor_id: number
  tipo_vehiculo: TipoVehiculoComision | null
  meta_mensual: number
  porcentaje_extra: number
  valor_rtm_moto?: number
  valor_rtm_vehiculo?: number
}

const DEFAULT_RTM_MOTO = 141339
const DEFAULT_RTM_VEHICULO = 233680

/* ===== Estado general ===== */
const activeSection = ref<Section>('REGLAS')

const configs = ref<ComisionConfig[]>([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const asesores = ref<AgenteLight[]>([])
const asesoresLoading = ref(false)

/* Metas mensuales */
const metas = ref<MetaMensualConfig[]>([])
const metasLoading = ref(false)

/* Recurrencias */
const recurrenciaGlobal = ref<ConfigRecurrenciaGlobal>({
  meses_minimos: 24,
  valor_dateo_recurrencia: 4300,
  valor_dateo_recuperacion: 8600,
  valor_dateo_recurrencia_vehiculo: null,
  valor_dateo_recurrencia_moto: null,
  valor_dateo_recuperacion_vehiculo: null,
  valor_dateo_recuperacion_moto: null,
})
const recurrenciasAsesores = ref<ConfigRecurrenciaAsesor[]>([])
const loadingRecurrencia = ref(false)
const savingRecurrencia = ref(false)

/* ===== Continuidad ===== */
const continuidadTipoBusqueda = ref<'placa' | 'cedula'>('placa')
const continuidadQuery = ref('')
const continuidadLoading = ref(false)
const continuidadError = ref('')
const continuidadResultado = ref<ContinuidadBusqueda | null>(null)
const continuidadPlacasParaElegir = ref<string[]>([])
const overrideSaving = ref(false)
const overrideForm = ref<{
  asesorConvenioId: number | null
  estado: ContinuidadOverrideEstado
  motivo: string
}>({
  asesorConvenioId: null,
  estado: 'AUTOMATICO',
  motivo: '',
})

const continuidadAsesoresDisponibles = computed(() => {
  const mapa = new Map<number, string>()
  for (const v of continuidadResultado.value?.visitas ?? []) {
    if (v.asesorConvenioId && v.asesorConvenioNombre) {
      mapa.set(v.asesorConvenioId, v.asesorConvenioNombre)
    }
  }
  for (const o of continuidadResultado.value?.overrides ?? []) {
    if (o.asesorConvenioId && o.asesorConvenio?.nombre) {
      mapa.set(o.asesorConvenioId, o.asesorConvenio.nombre)
    }
  }
  return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre }))
})

/* ===== Formulario reglas ===== */
const scope = ref<Scope>('GLOBAL')

const form = ref<{
  id: number | null
  asesorId: number | null
  tipoVehiculo: TipoVehiculoComision | 'AMBOS' | ''
  valorPlaca: string
  valorPlacaVehiculo: string   // 🆕
  valorPlacaMoto: string       // 🆕
  valorDateo: string
  valorNuevoDirecto: string
}>({
  id: null,
  asesorId: null,
  tipoVehiculo: '' as TipoVehiculoComision | 'AMBOS' | '',
  valorPlaca: '',
  valorPlacaVehiculo: '',      // 🆕
  valorPlacaMoto: '',          // 🆕
  valorDateo: '',
  valorNuevoDirecto: '',
})

/** filtro de tipo de asesor (para separar comerciales vs convenios) */
const tipoAsesor = ref<'' | 'COMERCIAL' | 'CONVENIO'>('')

const tipoAsesorItems = [
  { label: 'Todos', value: '' },
  { label: 'Comercial', value: 'COMERCIAL' },
  { label: 'Convenio', value: 'CONVENIO' },
]

const tipoVehiculoItems = [
  { label: 'Ambos (Moto + Vehículo)', value: 'AMBOS' },
  { label: 'Solo Moto', value: 'MOTO' as TipoVehiculoComision },
  { label: 'Solo Vehículo', value: 'VEHICULO' as TipoVehiculoComision },
]
const headers = [
  { title: 'Alcance', key: 'alcance', sortable: false },
  { title: 'Asesor / Convenio', key: 'asesor', sortable: false },
  { title: 'Tipo vehículo', key: 'tipo_vehiculo', sortable: false },
  { title: '💼 Incentivo base', key: 'valor_placa', sortable: true },
  { title: '🚗 Incentivo vehículo', key: 'valor_placa_vehiculo', sortable: false },  // 🆕
  { title: '🏍️ Incentivo moto', key: 'valor_placa_moto', sortable: false },          // 🆕
  { title: '📋 Dateo convenio', key: 'valor_dateo', sortable: true },
  { title: '🌟 Nuevo directo', key: 'valor_nuevo_directo', sortable: true },
  { title: 'Actualizado', key: 'fecha_calculo', sortable: true },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

/* Tabla metas mensuales */
const metaHeaders = [
  { title: 'Asesor', key: 'asesor', sortable: false },
  { title: 'Tipo meta', key: 'tipo_vehiculo', sortable: false },
  { title: 'Meta RTM (unid.)', key: 'meta_mensual', sortable: true },
  { title: 'RTM moto', key: 'valor_rtm_moto', sortable: false },
  { title: 'RTM vehículo', key: 'valor_rtm_vehiculo', sortable: false },
  { title: '% extra', key: 'porcentaje_extra', sortable: true },
  { title: 'Actualizado', key: 'fecha_actualizacion', sortable: true },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

const metaTipoVehiculoItems = [
  { label: 'Global (motos + vehículos)', value: '' },
  { label: 'Solo motos', value: 'MOTO' as TipoVehiculoComision },
  { label: 'Solo vehículos', value: 'VEHICULO' as TipoVehiculoComision },
]

/* Tabla recurrencias */
const recurrenciaHeaders = [
  { title: 'Asesor', key: 'asesor', sortable: false },
  { title: 'Habilitada', key: 'habilitada', sortable: false },
  { title: 'Meses mínimos', key: 'meses_minimos', sortable: false },
  { title: '🔄 Dateo recurrente', key: 'valor_dateo_recurrencia', sortable: false },
  { title: '💛 Dateo recuperación', key: 'valor_dateo_recuperacion', sortable: false },
  { title: 'Tipo vehículo', key: 'tipo_vehiculo', sortable: false },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

const recurrenciaTipoVehiculoItems = [
  { label: 'Ambos', value: 'AMBOS' },
  { label: 'Solo motos', value: 'MOTO' },
  { label: 'Solo vehículos', value: 'VEHICULO' },
]

/** filtro de tipo de asesor para recurrencias */
const tipoAsesorRecurrencia = ref<'' | 'COMERCIAL' | 'CONVENIO'>('')

/* Formulario recurrencia asesor */
const recurrenciaForm = ref<{
  id: number | null
  asesorId: number | null
  habilitada: boolean
  mesesMinimos: string
  valorDateo: string
  valorDateoRecuperacion: string
  tipoVehiculo: 'MOTO' | 'VEHICULO' | 'AMBOS'
}>({
  id: null,
  asesorId: null,
  habilitada: true,
  mesesMinimos: '',
  valorDateo: '',
  valorDateoRecuperacion: '',
  tipoVehiculo: 'AMBOS',
})

/* ===== Helpers ===== */

function normalizeTipo(value?: string | null) {
  return (value ?? '').toString().toUpperCase().trim()
}

function tipoVehiculoLabel(v?: string | null) {
  if (v === 'MOTO') return 'Moto'
  if (v === 'VEHICULO') return 'Vehículo'
  return '—'
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

/** Lista de asesores filtrada por tipo (Comercial / Convenio) para REGLAS */
const asesoresFiltrados = computed(() => {
  if (!tipoAsesor.value) return asesores.value
  const target = tipoAsesor.value
  return asesores.value.filter((a) => {
    const t = normalizeTipo(a.tipo)
    if (target === 'CONVENIO') return t.includes('CONVENIO')
    if (!t) return true
    return !t.includes('CONVENIO')
  })
})

/** Solo asesores comerciales para METAS mensuales */
const asesoresComerciales = computed(() =>
  asesores.value.filter((a) => {
    const t = normalizeTipo(a.tipo)
    if (!t) return true
    return !t.includes('CONVENIO')
  }),
)

/** Asesores filtrados por tipo para RECURRENCIAS */
const asesoresFiltradosRecurrencia = computed(() => {
  if (!tipoAsesorRecurrencia.value) return asesores.value
  const target = tipoAsesorRecurrencia.value
  return asesores.value.filter((a) => {
    const t = normalizeTipo(a.tipo)
    if (target === 'CONVENIO') return t.includes('CONVENIO')
    if (!t) return true
    return !t.includes('CONVENIO')
  })
})

function findAsesorNombre(id: number | null | undefined) {
  if (!id) return ''
  const a = asesores.value.find((x) => x.id === id)
  if (!a) return ''
  const t = normalizeTipo(a.tipo)
  let sufijo = ''
  if (t.includes('CONVENIO')) sufijo = ' (Convenio)'
  else if (t) sufijo = ' (Comercial)'
  return `${a.nombre}${sufijo}`
}

/* Preview pequeña de lo que se está configurando (reglas) */
const formPreview = computed(() => {
  if (!form.value.tipoVehiculo && !form.value.valorPlaca && !form.value.valorDateo && !form.value.valorNuevoDirecto) return null
  return {
    alcance: scope.value === 'GLOBAL' ? 'Global' : 'Por asesor / convenio',
    asesorNombre: scope.value === 'ASESOR' ? findAsesorNombre(form.value.asesorId) : null,
    tipoVehiculoLabel: tipoVehiculoLabel(form.value.tipoVehiculo),
  }
})

const canSubmit = computed(() => {
  if (!form.value.tipoVehiculo) return false
  const placa = Number(form.value.valorPlaca || 0)
  const dateo = Number(form.value.valorDateo || 0)
  const directo = Number(form.value.valorNuevoDirecto || 0)
  if (Number.isNaN(placa) || placa < 0) return false
  if (Number.isNaN(dateo) || dateo < 0) return false
  if (Number.isNaN(directo) || directo < 0) return false
  if (scope.value === 'ASESOR' && !form.value.asesorId) return false
  return true
})

/* ===== Formulario metas mensuales ===== */
const metaForm = ref<{
  id: number | null
  asesorId: number | null
  tipoVehiculo: '' | TipoVehiculoComision
  metaMensual: string
  porcentajeExtra: string
  valorRtmMoto: string
  valorRtmVehiculo: string
}>({
  id: null,
  asesorId: null,
  tipoVehiculo: '',
  metaMensual: '',
  porcentajeExtra: '',
  valorRtmMoto: String(DEFAULT_RTM_MOTO),
  valorRtmVehiculo: String(DEFAULT_RTM_VEHICULO),
})

const canSubmitMeta = computed(() => {
  if (!metaForm.value.asesorId) return false
  const meta = Number(metaForm.value.metaMensual || 0)
  const pct = Number(metaForm.value.porcentajeExtra || 0)
  const moto = Number(metaForm.value.valorRtmMoto || 0)
  const carro = Number(metaForm.value.valorRtmVehiculo || 0)
  if (Number.isNaN(meta) || meta < 0) return false
  if (Number.isNaN(pct) || pct < 0) return false
  if (Number.isNaN(moto) || moto < 0) return false
  if (Number.isNaN(carro) || carro < 0) return false
  return true
})
/* ===== Carga de datos ===== */

async function loadConfigs() {
  loading.value = true
  try {
    configs.value = await listConfigsComision()
  } finally {
    loading.value = false
  }
}

async function loadAsesores() {
  asesoresLoading.value = true
  try {
    asesores.value = await listAgentesCaptacion()
  } finally {
    asesoresLoading.value = false
  }
}

async function loadMetas() {
  metasLoading.value = true
  try {
    const rows = await listMetasMensuales()
    metas.value = rows as MetaMensualConfig[]
  } finally {
    metasLoading.value = false
  }
}

async function loadRecurrenciaGlobal() {
  try {
    const data = await getConfigRecurrenciaGlobal()
    recurrenciaGlobal.value = data
  } catch (err) {
    console.error('Error cargando config recurrencia global:', err)
  }
}

async function loadRecurrenciasAsesores() {
  loadingRecurrencia.value = true
  try {
    recurrenciasAsesores.value = await listConfigRecurrenciaAsesores()
  } finally {
    loadingRecurrencia.value = false
  }
}

/* ===== CRUD Reglas ===== */

function resetForm() {
  form.value = {
    id: null,
    asesorId: null,
    tipoVehiculo: '',
    valorPlaca: '',
    valorPlacaVehiculo: '',    // 🆕
    valorPlacaMoto: '',        // 🆕
    valorDateo: '',
    valorNuevoDirecto: '',
  }
  scope.value = 'GLOBAL'
  tipoAsesor.value = ''
}

function editConfig(cfg: ComisionConfig) {
  form.value.id = cfg.id
  form.value.asesorId = cfg.asesor_id
  form.value.tipoVehiculo = (cfg.tipo_vehiculo || '') as TipoVehiculoComision | ''
  form.value.valorPlaca = String(cfg.valor_placa ?? '')
  form.value.valorPlacaVehiculo = cfg.valor_placa_vehiculo != null ? String(cfg.valor_placa_vehiculo) : ''  // 🆕
  form.value.valorPlacaMoto = cfg.valor_placa_moto != null ? String(cfg.valor_placa_moto) : ''              // 🆕
  form.value.valorDateo = String(cfg.valor_dateo ?? '')
  form.value.valorNuevoDirecto = String(cfg.valor_nuevo_directo ?? '')
  scope.value = cfg.asesor_id ? 'ASESOR' : 'GLOBAL'

  if (cfg.asesor_id) {
    const a = asesores.value.find((x) => x.id === cfg.asesor_id)
    const t = normalizeTipo(a?.tipo)
    if (t.includes('CONVENIO')) tipoAsesor.value = 'CONVENIO'
    else tipoAsesor.value = 'COMERCIAL'
  } else {
    tipoAsesor.value = ''
  }
}

async function submitForm() {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const tipos: TipoVehiculoComision[] =
      form.value.tipoVehiculo === 'AMBOS'
        ? ['MOTO', 'VEHICULO']
        : [form.value.tipoVehiculo as TipoVehiculoComision]

    for (const tipo of tipos) {
      const payload: ComisionConfigPayload = {
        tipo_vehiculo: tipo,
        valor_placa: Number(form.value.valorPlaca || 0),
        valor_placa_vehiculo: form.value.valorPlacaVehiculo !== '' ? Number(form.value.valorPlacaVehiculo) : null,
        valor_placa_moto: form.value.valorPlacaMoto !== '' ? Number(form.value.valorPlacaMoto) : null,
        valor_dateo: Number(form.value.valorDateo || 0),
        valor_nuevo_directo: Number(form.value.valorNuevoDirecto || 0),
        asesor_id: scope.value === 'ASESOR' ? form.value.asesorId ?? null : null,
      }

      if (form.value.id && tipos.length === 1) {
        await updateConfigComision(form.value.id, payload)
      } else {
        await upsertConfigComision(payload)
      }
    }

    await loadConfigs()
    resetForm()
  } finally {
    saving.value = false
  }
}

/* ===== Eliminar Reglas ===== */
const deleteDialog = ref<{ visible: boolean; item: ComisionConfig | null }>({
  visible: false,
  item: null,
})

function confirmDelete(item: ComisionConfig) {
  deleteDialog.value = { visible: true, item }
}

async function doDelete() {
  const item = deleteDialog.value.item
  if (!item) return
  deleting.value = true
  try {
    await deleteConfigComision(item.id)
    await loadConfigs()
    deleteDialog.value.visible = false
    deleteDialog.value.item = null
  } finally {
    deleting.value = false
  }
}

/* ===== CRUD Metas Mensuales ===== */

function resetMetaForm() {
  metaForm.value = {
    id: null,
    asesorId: null,
    tipoVehiculo: '',
    metaMensual: '',
    porcentajeExtra: '',
    valorRtmMoto: String(DEFAULT_RTM_MOTO),
    valorRtmVehiculo: String(DEFAULT_RTM_VEHICULO),
  }
}

function editMeta(meta: MetaMensualConfig) {
  metaForm.value.id = meta.id
  metaForm.value.asesorId = meta.asesor_id
  metaForm.value.tipoVehiculo = (meta.tipo_vehiculo || '') as '' | TipoVehiculoComision
  metaForm.value.metaMensual = String(meta.meta_mensual ?? '')
  metaForm.value.porcentajeExtra = String(meta.porcentaje_extra ?? '')
  metaForm.value.valorRtmMoto = String(
    meta.valor_rtm_moto != null ? meta.valor_rtm_moto : DEFAULT_RTM_MOTO,
  )
  metaForm.value.valorRtmVehiculo = String(
    meta.valor_rtm_vehiculo != null ? meta.valor_rtm_vehiculo : DEFAULT_RTM_VEHICULO,
  )
}

async function submitMeta() {
  if (!canSubmitMeta.value) return
  saving.value = true
  try {
    const payload: MetaMensualPayload = {
      asesor_id: metaForm.value.asesorId!,
      tipo_vehiculo:
        metaForm.value.tipoVehiculo === ''
          ? null
          : (metaForm.value.tipoVehiculo as TipoVehiculoComision),
      meta_mensual: Number(metaForm.value.metaMensual || 0),
      porcentaje_extra: Number(metaForm.value.porcentajeExtra || 0),
      valor_rtm_moto: Number(metaForm.value.valorRtmMoto || 0),
      valor_rtm_vehiculo: Number(metaForm.value.valorRtmVehiculo || 0),
    }

    if (metaForm.value.id) {
      await updateMetaMensual(metaForm.value.id, payload)
    } else {
      await upsertMetaMensual(payload)
    }

    await loadMetas()
    resetMetaForm()
  } finally {
    saving.value = false
  }
}

/* Eliminar metas */
const metaDeleteDialog = ref<{ visible: boolean; item: MetaMensualConfig | null }>({
  visible: false,
  item: null,
})

function confirmDeleteMeta(item: MetaMensualConfig) {
  metaDeleteDialog.value = { visible: true, item }
}

async function doDeleteMeta() {
  const item = metaDeleteDialog.value.item
  if (!item) return
  deleting.value = true
  try {
    await deleteMetaMensual(item.id)
    await loadMetas()
    metaDeleteDialog.value.visible = false
    metaDeleteDialog.value.item = null
  } finally {
    deleting.value = false
  }
}

/* ===== CRUD Recurrencias ===== */

async function guardarRecurrenciaGlobal() {
  savingRecurrencia.value = true
  try {
    const data = await updateConfigRecurrenciaGlobal({
      meses_minimos: Number(recurrenciaGlobal.value.meses_minimos || 24),
      valor_dateo_recurrencia: Number(recurrenciaGlobal.value.valor_dateo_recurrencia || 4300),
      valor_dateo_recuperacion: Number(recurrenciaGlobal.value.valor_dateo_recuperacion || 8600),
      valor_dateo_recurrencia_vehiculo: recurrenciaGlobal.value.valor_dateo_recurrencia_vehiculo
        ? Number(recurrenciaGlobal.value.valor_dateo_recurrencia_vehiculo)
        : null,
      valor_dateo_recurrencia_moto: recurrenciaGlobal.value.valor_dateo_recurrencia_moto
        ? Number(recurrenciaGlobal.value.valor_dateo_recurrencia_moto)
        : null,
      valor_dateo_recuperacion_vehiculo: recurrenciaGlobal.value.valor_dateo_recuperacion_vehiculo
        ? Number(recurrenciaGlobal.value.valor_dateo_recuperacion_vehiculo)
        : null,
      valor_dateo_recuperacion_moto: recurrenciaGlobal.value.valor_dateo_recuperacion_moto
        ? Number(recurrenciaGlobal.value.valor_dateo_recuperacion_moto)
        : null,
    })
    recurrenciaGlobal.value = data
  } finally {
    savingRecurrencia.value = false
  }
}

function resetRecurrenciaForm() {
  recurrenciaForm.value = {
    id: null,
    asesorId: null,
    habilitada: true,
    mesesMinimos: '',
    valorDateo: '',
    valorDateoRecuperacion: '',
    tipoVehiculo: 'AMBOS',
  }
}

function editarRecurrenciaAsesor(item: ConfigRecurrenciaAsesor) {
  recurrenciaForm.value = {
    id: item.id,
    asesorId: item.asesor_id,
    habilitada: item.recurrencia_habilitada,
    mesesMinimos: item.meses_minimos ? String(item.meses_minimos) : '',
    valorDateo: item.valor_dateo_recurrencia ? String(item.valor_dateo_recurrencia) : '',
    valorDateoRecuperacion: item.valor_dateo_recuperacion ? String(item.valor_dateo_recuperacion) : '',
    tipoVehiculo: item.tipo_vehiculo,
  }
}

async function guardarRecurrenciaAsesor() {
  if (!recurrenciaForm.value.asesorId) return
  savingRecurrencia.value = true
  try {
    await upsertConfigRecurrenciaAsesor({
      asesor_id: recurrenciaForm.value.asesorId,
      recurrencia_habilitada: recurrenciaForm.value.habilitada,
      meses_minimos: recurrenciaForm.value.mesesMinimos
        ? Number(recurrenciaForm.value.mesesMinimos)
        : null,
      valor_dateo_recurrencia: recurrenciaForm.value.valorDateo
        ? Number(recurrenciaForm.value.valorDateo)
        : null,
      valor_dateo_recuperacion: recurrenciaForm.value.valorDateoRecuperacion
        ? Number(recurrenciaForm.value.valorDateoRecuperacion)
        : null,
      tipo_vehiculo: recurrenciaForm.value.tipoVehiculo,
    })
    await loadRecurrenciasAsesores()
    resetRecurrenciaForm()
  } finally {
    savingRecurrencia.value = false
  }
}

const recurrenciaDeleteDialog = ref<{ visible: boolean; item: ConfigRecurrenciaAsesor | null }>({
  visible: false,
  item: null,
})

function confirmarEliminarRecurrencia(item: ConfigRecurrenciaAsesor) {
  recurrenciaDeleteDialog.value = { visible: true, item }
}

async function doDeleteRecurrencia() {
  const item = recurrenciaDeleteDialog.value.item
  if (!item) return
  deleting.value = true
  try {
    await deleteConfigRecurrenciaAsesor(item.id)
    await loadRecurrenciasAsesores()
    recurrenciaDeleteDialog.value.visible = false
    recurrenciaDeleteDialog.value.item = null
  } finally {
    deleting.value = false
  }
}

/* ===== Continuidad ===== */
function resetOverrideForm() {
  overrideForm.value = { asesorConvenioId: null, estado: 'AUTOMATICO', motivo: '' }
}

async function ejecutarBusquedaContinuidad(params: { placa?: string; cedula?: string }) {
  continuidadLoading.value = true
  continuidadError.value = ''
  continuidadPlacasParaElegir.value = []
  continuidadResultado.value = null
  try {
    const data = await buscarContinuidad(params)
    if (data.placas && data.placas.length > 0) {
      continuidadPlacasParaElegir.value = data.placas
    } else if (data.placa) {
      continuidadResultado.value = data
      resetOverrideForm()
    } else {
      continuidadError.value = 'No se encontraron turnos para esta búsqueda.'
    }
  } catch (e) {
    continuidadError.value = e instanceof Error ? e.message : 'Error al buscar continuidad'
  } finally {
    continuidadLoading.value = false
  }
}

function buscarContinuidadUI() {
  const q = continuidadQuery.value.trim()
  if (!q) return
  if (continuidadTipoBusqueda.value === 'placa') {
    ejecutarBusquedaContinuidad({ placa: q })
  } else {
    ejecutarBusquedaContinuidad({ cedula: q })
  }
}

function buscarPorPlacaDirecta(placa: string) {
  continuidadPlacasParaElegir.value = []
  ejecutarBusquedaContinuidad({ placa })
}

async function guardarOverrideUI() {
  if (!continuidadResultado.value?.placa || !overrideForm.value.asesorConvenioId) return
  if (overrideForm.value.estado !== 'AUTOMATICO' && !overrideForm.value.motivo.trim()) {
    continuidadError.value = 'El motivo es obligatorio cuando el estado no es Automático.'
    return
  }
  overrideSaving.value = true
  continuidadError.value = ''
  try {
    await guardarContinuidadOverride({
      placa: continuidadResultado.value.placa,
      asesorConvenioId: overrideForm.value.asesorConvenioId,
      estado: overrideForm.value.estado,
      motivo: overrideForm.value.motivo.trim() || null,
    })
    await ejecutarBusquedaContinuidad({ placa: continuidadResultado.value.placa })
  } catch (e) {
    continuidadError.value = e instanceof Error ? e.message : 'Error al guardar el override'
  } finally {
    overrideSaving.value = false
  }
}

function continuidadChipColor(estado: string) {
  if (estado === 'CONTINUA') return 'success'
  if (estado === 'ROTA') return 'error'
  return 'warning'
}
function continuidadChipLabel(estado: string) {
  if (estado === 'CONTINUA') return 'Continua'
  if (estado === 'ROTA') return 'Rota'
  return 'Sin evidencia'
}
function overrideChipColor(estado: string) {
  if (estado === 'FORZAR_SI') return 'success'
  if (estado === 'FORZAR_NO') return 'error'
  return 'grey'
}
function formatFechaCorta(value?: string | null) {
  return formatDateTime(value)
}

/* Watch para cargar datos cuando cambias de pestaña */
watch(activeSection, (val) => {
  if (val === 'METAS' && metas.value.length === 0) {
    loadMetas()
  } else if (val === 'RECURRENCIA' && recurrenciasAsesores.value.length === 0) {
    loadRecurrenciaGlobal()
    loadRecurrenciasAsesores()
  }
})

/* Init */
onMounted(() => {
  loadConfigs()
  loadAsesores()
  loadMetas()
  loadRecurrenciaGlobal()
  loadRecurrenciasAsesores()
})
</script>

<style scoped>
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
</style>
