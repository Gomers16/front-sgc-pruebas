<!-- src/views/facturacion/FacturacionHistorico.vue -->
<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="blue-darken-3">
            <v-icon>mdi-history</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Facturación / Historial</div>
            <div class="text-medium-emphasis">Listado de tickets y detalle</div>
          </div>
        </div>

        <div class="d-flex align-center flex-wrap" style="gap:10px">
          <v-btn prepend-icon="mdi-reload" :loading="loading" @click="refresh">Actualizar</v-btn>
        </div>
      </v-card-title>
    </v-card>

    <!-- 🆕 FILTROS (en la URL: se conservan al recargar o volver) -->
    <v-card elevation="8" class="rounded-xl mb-4" data-test="filtros-historial">
      <v-card-text class="px-4 px-sm-6 pt-4">
        <v-row dense>
          <v-col cols="6" sm="4" md="2">
            <v-text-field
              v-model="filtros.fecha_desde"
              type="date"
              label="Fecha pago desde"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field
              v-model="filtros.fecha_hasta"
              type="date"
              label="Fecha pago hasta"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field
              v-model="placaInput"
              label="Placa"
              placeholder="Parte de la placa"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="6" md="3">
            <v-text-field
              v-model="vendedorInput"
              label="Vendedor"
              placeholder="Parte del nombre"
              variant="outlined"
              density="compact"
              hide-details="auto"
              clearable
              :hint="vendedorCorto ? `Escribe al menos ${VENDEDOR_MIN} letras` : ''"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filtros.descuento"
              :items="descuentoItems"
              label="Descuento"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <div class="d-flex align-center" style="gap:8px">
              <v-text-field
                v-model="consecutivoInput"
                label="Consecutivo del descuento"
                variant="outlined"
                density="compact"
                hide-details
                clearable
              />
              <v-checkbox
                v-model="filtros.consecutivo_exacto"
                label="Exacto"
                density="compact"
                hide-details
                class="flex-grow-0"
              />
            </div>
          </v-col>
          <v-col cols="6" sm="3" md="2">
            <v-select
              v-model="filtros.estado"
              :items="estadoItems"
              label="Estado"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="3" md="3">
            <v-select
              v-model="filtros.servicio_id"
              :items="servicioItems"
              label="Servicio"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
        </v-row>

        <div class="d-flex align-center flex-wrap mt-3" style="gap:8px">
          <v-chip
            v-for="chip in chips"
            :key="chip.clave"
            size="small"
            closable
            color="primary"
            variant="tonal"
            @click:close="quitar(chip.clave)"
          >
            {{ chip.texto }}
          </v-chip>
          <v-btn
            v-if="chips.length"
            size="small"
            variant="text"
            prepend-icon="mdi-filter-remove"
            @click="limpiar"
          >
            Limpiar
          </v-btn>
          <v-spacer />
          <v-btn
            size="small"
            color="success"
            variant="tonal"
            prepend-icon="mdi-microsoft-excel"
            :loading="exportando"
            @click="exportar"
          >
            Exportar a Excel
          </v-btn>
        </div>

        <div
          v-if="resumen"
          class="d-flex align-center flex-wrap mt-3 text-body-2"
          style="gap:6px 16px"
          data-test="resumen-historial"
        >
          <span><strong>{{ resumen.cantidad.toLocaleString('es-CO') }}</strong> {{ resumen.cantidad === 1 ? 'resultado' : 'resultados' }}</span>
          <span>Total facturado: <strong>{{ fmtCOP(resumen.total_facturado) }}</strong></span>
          <span>Descuento aplicado: <strong class="text-orange-darken-2">{{ fmtCOP(resumen.total_descuento) }}</strong></span>
          <span v-if="!filtros.estado" class="text-caption text-medium-emphasis">(todos los estados)</span>
        </div>
      </v-card-text>
    </v-card>

    <!-- TABLA -->
    <v-card elevation="8" class="rounded-xl">
      <v-data-table-server
        :headers="headers"
        :items="rows"
        :items-length="total"
        :loading="loading"
        :items-per-page="pagination.itemsPerPage"
        :page="pagination.page"
        item-key="id"
        hover
        @update:options="onUpdateOptions"
      >
        <template #item.estado="{ item }">
          <v-chip :color="estadoColor(item.estado)" size="small" variant="tonal" class="font-weight-bold">
            {{ item.estado }}
          </v-chip>
        </template>

        <template #item.fecha_pago="{ item }">
          <span v-if="firstFecha(item)">{{ asDate(firstFecha(item)) }}</span>
          <span v-else>—</span>
        </template>

        <template #item.total="{ item }">
          <div>
            <div class="font-weight-bold">{{ fmtCOP(pickTotal(item)) }}</div>
            <div v-if="(item.descuento_monto_aplicado ?? 0) > 0" class="text-caption text-orange-darken-2">
  <v-icon size="12">mdi-tag</v-icon>
  Desc: -{{ fmtCOP(item.descuento_monto_aplicado ?? 0) }}
</div>
          </div>
        </template>

        <template #item.servicioNombre="{ item }">
          {{ getServicioNombre(item) }}
        </template>

        <template #item.sedeNombre="{ item }">
          {{ getSedeNombre(item) }}
        </template>

        <template #item.vendedor_text="{ item }">
          {{ item?.vendedor_text ?? '—' }}
        </template>

        <!-- 🆕 Consecutivo del descuento (lo digita caja) -->
        <template #item.consecutivo_descuento="{ item }">
          <span v-if="item.consecutivo_descuento" class="font-weight-medium">{{ item.consecutivo_descuento }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <template #item.acciones="{ item }">
          <div class="d-flex" style="gap:6px">
            <v-btn size="small" variant="tonal" prepend-icon="mdi-eye" @click.stop="openDetailById(item.id)">
              Ver
            </v-btn>
            <!-- 🆕 Editar el descuento de un ticket confirmado (solo SUPER_ADMIN/GERENCIA) -->
            <v-btn
              v-if="puedeEditarDescuento && item.estado === 'CONFIRMADA'"
              size="small"
              variant="tonal"
              color="orange-darken-2"
              prepend-icon="mdi-tag-edit"
              data-test="editar-descuento"
              @click.stop="abrirEdicionDescuento(item.id)"
            >
              Editar
            </v-btn>
          </div>
        </template>

        <template #body.append>
          <tr>
            <td :colspan="headers.length">
              <div class="d-flex align-center justify-space-between flex-wrap py-3">
                <div class="text-medium-emphasis">
                  Mostrando {{ rows.length }} de {{ total }} registros
                </div>
                <div class="d-flex align-center" style="gap:10px">
                  <v-select
                    :model-value="pagination.itemsPerPage"
                    :items="POR_PAGINA"
                    density="compact"
                    style="max-width:120px"
                    label="Por página"
                    @update:model-value="cambiarPorPagina"
                  />
                  <v-pagination
                    :model-value="pagination.page"
                    :length="pages"
                    :total-visible="7"
                    @update:model-value="sincronizarUrl"
                  />
                </div>
              </div>
            </td>
          </tr>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- DIALOG DETALLE CON IMAGEN -->
    <v-dialog v-model="dialog.open" max-width="1200">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon class="mr-2">mdi-shield-check</v-icon>
            Detalle del ticket
            <span v-if="dialog.item?.id" class="ml-2 text-medium-emphasis">#{{ dialog.item.id }}</span>
          </div>
          <div class="d-flex align-center" style="gap:8px">
            <v-chip
              v-if="dialog.item?.estado"
              :color="estadoColor(dialog.item.estado)"
              size="small"
              variant="tonal"
            >
              {{ dialog.item.estado }}
            </v-chip>
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-row>
            <!-- COLUMNA IZQUIERDA: IMAGEN DEL TICKET -->
            <v-col cols="12" md="5">
              <div class="section-title mb-3">
                <v-icon class="mr-2">mdi-image</v-icon>
                Evidencia (Ticket)
              </div>

              <div v-if="imageBlobUrl || dialog.item?.filePath || dialog.item?.file_path" class="image-preview-wrapper">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center" style="gap:6px">
                    <v-btn size="x-small" variant="text" icon="mdi-magnify-minus" @click="zoomOut" />
                    <v-btn size="x-small" variant="text" icon="mdi-magnify-plus" @click="zoomIn" />
                    <v-btn size="x-small" variant="text" @click="resetZoom">
                      {{ Math.round(imageScale * 100) }}%
                    </v-btn>
                  </div>
                  <v-btn
                    v-if="imageBlobUrl"
                    size="x-small"
                    variant="text"
                    prepend-icon="mdi-download"
                    tag="a"
                    :href="imageBlobUrl"
                    download="ticket.jpg"
                  >
                    Descargar
                  </v-btn>
                </div>

                <div class="preview-canvas">
                  <img
                    v-if="imageBlobUrl"
                    :src="imageBlobUrl"
                    :style="imgStyle"
                    alt="Ticket"
                    @error="onImageError"
                  />
                  <div v-else-if="!imageError" class="text-center py-4">
                    <v-progress-circular indeterminate color="primary" />
                    <div class="text-caption mt-2">Cargando imagen...</div>
                  </div>
                </div>

                <div v-if="imageError" class="text-center mt-2 text-error">
                  <v-icon>mdi-alert-circle</v-icon>
                  No se pudo cargar la imagen
                </div>
              </div>

              <v-alert v-else type="info" variant="tonal" class="text-center">
                <v-icon size="48" class="mb-2">mdi-image-off</v-icon>
                <div>No hay imagen disponible para este ticket</div>
              </v-alert>
            </v-col>

            <!-- COLUMNA DERECHA: DATOS -->
            <v-col cols="12" md="7">
              <v-row>
                <!-- Datos del Ticket -->
                <v-col cols="12" md="6">
                  <div class="section-title">Ticket</div>

                  <div class="label">Placa</div>
                  <div class="value mb-2">{{ dialog.item?.placa || '—' }}</div>

                  <div class="label">Fecha y hora de pago</div>
                  <div class="value mb-2">
                    <span v-if="fechaPagoIso">
                      {{ asDate(fechaPagoIso) }} • {{ asTime(fechaPagoIso) }}
                    </span>
                    <span v-else>—</span>
                  </div>

                  <!-- TOTALES CON DESGLOSE DE DESCUENTO -->
                  <template v-if="tieneDescuento">
                    <div class="label">Subtotal (sin descuento)</div>
                    <div class="value mb-1">{{ fmtCOP(totalSinDescuento) }}</div>

                    <div class="label text-orange-darken-2">Descuento aplicado</div>
                    <div class="value mb-1 text-orange-darken-2">
                      - {{ fmtCOP(dialog.item?.descuentoAplicado?.montoAplicado ?? dialog.item?.descuento_monto_aplicado ?? 0) }}
                    </div>

                    <div class="label">Total con descuento</div>
                    <div class="value mb-2 text-success font-weight-bold" style="font-size:1.1rem">
                      {{ fmtCOP(pickTotal(dialog.item)) }}
                    </div>
                  </template>
                  <template v-else>
                    <div class="label">Total</div>
                    <div class="value mb-2">{{ fmtCOP(pickTotal(dialog.item)) }}</div>
                  </template>

                  <div class="label">Vendedor</div>
                  <div class="value mb-2">{{ dialog.item?.vendedorText || dialog.item?.vendedor_text || '—' }}</div>

                  <div class="label">Prefijo / Consecutivo</div>
                  <div class="value mb-2">
                    {{ dialog.item?.prefijo || '—' }}
                    <span v-if="dialog.item?.consecutivo"> {{ dialog.item.consecutivo }}</span>
                  </div>

                  <div class="label">NIT / PIN / Marca</div>
                  <div class="value">
                    {{ dialog.item?.nit || '—' }} /
                    {{ dialog.item?.pin || '—' }} /
                    {{ dialog.item?.marca || '—' }}
                  </div>
                </v-col>

                <!-- Turno asociado -->
                <v-col cols="12" md="6">
                  <div class="section-title">Turno asociado</div>

                  <div class="label">Turno / Servicio</div>
                  <div class="value mb-2">
                    #{{ dialog.item?.turno?.turnoNumero ?? dialog.item?.turnoGlobal ?? '—' }}
                    •
                    {{ getServicioNombre(dialog.item) }}
                  </div>

                  <div class="label">Placa (turno)</div>
                  <div class="value mb-2">{{ dialog.item?.placaTurno || dialog.item?.turno?.placa || '—' }}</div>

                  <div class="label">Sede / Funcionario</div>
                  <div class="value mb-2">
                    {{ getSedeNombre(dialog.item) }} • {{ dialog.item?.funcionarioNombre || '—' }}
                  </div>

                  <div class="label">Canal</div>
                  <div class="value mb-2">
                    <v-chip
                      v-if="dialog.item?.canalAtribucion"
                      :color="canalChipColor(dialog.item?.canalAtribucion)"
                      size="small"
                      variant="tonal"
                    >
                      {{ humanCanal(dialog.item?.canalAtribucion) }}
                    </v-chip>
                    <span v-else>—</span>
                  </div>

                  <div class="label">Asesores / Convenio</div>
                  <div class="value">
                    <div class="capt-line" v-if="dialog.item?.dateo?.agente?.nombre">
                      <v-chip size="x-small" color="secondary" variant="tonal">Comercial</v-chip>
                      <span class="text-medium-emphasis">{{ dialog.item?.dateo?.agente?.nombre }}</span>
                    </div>
                    <div class="capt-line" v-if="dialog.item?.dateo?.asesorConvenio?.nombre">
                      <v-chip size="x-small" color="teal" variant="tonal">Convenio</v-chip>
                      <span class="text-medium-emphasis">{{ dialog.item?.dateo?.asesorConvenio?.nombre }}</span>
                    </div>
                    <div class="capt-line" v-if="dialog.item?.dateo?.convenio?.nombre">
                      <v-chip size="x-small" color="blue-grey" variant="tonal">Convenio</v-chip>
                      <span class="text-medium-emphasis">{{ etiquetaConvenio(dialog.item?.dateo?.convenio) }}</span>
                    </div>
                    <div v-if="!dialog.item?.dateo?.agente && !dialog.item?.dateo?.asesorConvenio && !dialog.item?.dateo?.convenio">
                      —
                    </div>
                  </div>
                </v-col>
              </v-row>

              <!-- ======================== SECCIÓN DESCUENTO ======================== -->
              <template v-if="tieneDescuento">
                <v-divider class="my-4" />

                <v-card variant="tonal" color="orange-darken-2" class="pa-4 rounded-lg">
                  <div class="d-flex align-center mb-3" style="gap:8px">
                    <v-icon color="orange-darken-2" size="20">mdi-tag-multiple</v-icon>
                    <span class="text-subtitle-2 font-weight-bold">Descuento Informativo Aplicado</span>
                    <v-chip
                      size="x-small"
                      :color="origenDescuento === 'dateo' ? 'blue' : 'purple'"
                      variant="flat"
                      class="ml-1"
                    >
                      {{ origenDescuento === 'dateo' ? 'Pre-marcado (dateo)' : 'Aplicado en caja' }}
                    </v-chip>
                  </div>

                  <v-row dense>
                    <!-- Nombre del descuento -->
                    <v-col cols="12" md="6">
                      <div class="label-desc">Descuento</div>
                      <div class="value-desc">
                        {{ dialog.item?.descuentoAplicado?.nombre ?? nombreDescuentoFallback ?? '—' }}
                        <span v-if="dialog.item?.descuentoAplicado?.codigo" class="text-caption text-medium-emphasis ml-1">
                          ({{ dialog.item.descuentoAplicado.codigo }})
                        </span>
                      </div>
                    </v-col>

                    <!-- Monto descontado -->
<v-col cols="12" md="6">
  <div class="label-desc">Monto descontado</div>
  <div class="value-desc text-orange-darken-2 font-weight-bold d-flex align-center" style="gap:8px">
    - {{ fmtCOP(dialog.item?.descuentoAplicado?.montoAplicado ?? dialog.item?.descuento_monto_aplicado ?? 0) }}
    <v-btn
      size="x-small"
      icon="mdi-pencil"
      variant="text"
      color="orange-darken-2"
      :loading="editingDescuento"
      @click="openEditDescuento"
    />
  </div>
</v-col>

                    <!-- 🆕 Consecutivo del descuento -->
                    <v-col cols="12" md="6">
                      <div class="label-desc">Consecutivo del descuento</div>
                      <div class="value-desc d-flex align-center" style="gap:8px">
                        {{ consecutivoDescuentoDetalle ?? '—' }}
                        <v-btn
                          v-if="puedeCorregirConsecutivo"
                          size="x-small"
                          icon="mdi-pencil"
                          variant="text"
                          color="orange-darken-2"
                          title="Corregir consecutivo (queda registro)"
                          @click="openCorregirConsecutivo"
                        />
                      </div>
                    </v-col>

                    <!-- Total original -->
                    <v-col cols="12" md="6">
                      <div class="label-desc">Total sin descuento</div>
                      <div class="value-desc">{{ fmtCOP(totalSinDescuento) }}</div>
                    </v-col>

                    <!-- Total final -->
                    <v-col cols="12" md="6">
                      <div class="label-desc">Total final (con descuento)</div>
                      <div class="value-desc text-success font-weight-bold">
                        {{ fmtCOP(pickTotal(dialog.item)) }}
                      </div>
                    </v-col>

                    <!-- Autorizado por (solo si fue en caja) -->
                    <v-col cols="12" md="6" v-if="origenDescuento === 'caja'">
                      <div class="label-desc">Autorizado por</div>
                      <div class="value-desc">
                        <v-icon size="14" class="mr-1">mdi-account-check</v-icon>
                        {{ dialog.item?.descuentoAplicado?.autorizadoPor?.nombre ?? '—' }}
                      </div>
                    </v-col>

                    <!-- Confirmado por (cajero) -->
                    <v-col cols="12" md="6">
                      <div class="label-desc">Confirmado por</div>
                      <div class="value-desc">
                        <v-icon size="14" class="mr-1">mdi-account</v-icon>
                        {{ nombreConfirmadoPor }}
                      </div>
                    </v-col>

                    <!-- Fecha de confirmación -->
                    <v-col cols="12" md="6">
                      <div class="label-desc">Fecha de aplicación</div>
                      <div class="value-desc">
                        <v-icon size="14" class="mr-1">mdi-calendar-check</v-icon>
                        <span v-if="dialog.item?.confirmadoAt || dialog.item?.confirmado_at">
                          {{ asDate(dialog.item?.confirmadoAt ?? dialog.item?.confirmado_at) }}
                          •
                          {{ asTime(dialog.item?.confirmadoAt ?? dialog.item?.confirmado_at) }}
                        </span>
                        <span v-else>—</span>
                      </div>
                    </v-col>
                  </v-row>

                  <!-- Nota efecto en comisión -->
                  <v-alert
                    type="warning"
                    variant="tonal"
                    density="compact"
                    class="mt-3"
                    prepend-icon="mdi-information-outline"
                  >
                    <span class="text-caption">
                      Efecto en la comisión: {{ TEXTO_EFECTO_DESCUENTO }} El cálculo exacto de este
                      ticket se ve en «Editar descuento».
                    </span>
                  </v-alert>
                </v-card>
              </template>
              <!-- ======================== FIN SECCIÓN DESCUENTO ======================== -->

            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIALOG EDITAR MONTO DESCUENTO -->
<v-dialog v-model="editDescuentoDialog" max-width="420" persistent>
  <v-card>
    <v-card-title class="d-flex align-center" style="gap:8px">
      <v-icon color="orange-darken-2">mdi-pencil</v-icon>
      Editar monto de descuento
    </v-card-title>
    <v-divider />
    <v-card-text>
      <div class="text-body-2 text-medium-emphasis mb-3">
        Ticket #{{ dialog.item?.id }} — {{ dialog.item?.placa }}
      </div>
      <v-text-field
        v-model.number="editDescuentoMonto"
        label="Nuevo monto de descuento (COP)"
        type="number"
        min="0"
        prefix="$"
        variant="outlined"
        density="compact"
        autofocus
        hint="El total de la factura se recalculará automáticamente"
        persistent-hint
      />
      <v-alert
        v-if="editDescuentoMonto > 0"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-3"
      >
        Total original: <strong>{{ fmtCOP(dialog.item?.totalSinDescuento ?? dialog.item?.total_sin_descuento ?? 0) }}</strong>
        → Nuevo total: <strong>{{ fmtCOP(Math.max(0, (dialog.item?.totalSinDescuento ?? dialog.item?.total_sin_descuento ?? 0) - editDescuentoMonto)) }}</strong>
      </v-alert>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="editDescuentoDialog = false">Cancelar</v-btn>
      <v-btn
        color="orange-darken-2"
        variant="tonal"
        :loading="editingDescuento"
        :disabled="editDescuentoMonto < 0"
        @click="saveDescuentoMonto"
      >
        Guardar
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

    <!-- 🆕 DIALOG CORREGIR CONSECUTIVO DEL DESCUENTO (SUPER_ADMIN / GERENCIA) -->
<v-dialog v-model="corregirConsecutivo.open" max-width="440" persistent>
  <v-card>
    <v-card-title class="d-flex align-center" style="gap:8px">
      <v-icon color="orange-darken-2">mdi-pound</v-icon>
      Corregir consecutivo del descuento
    </v-card-title>
    <v-divider />
    <v-card-text>
      <div class="text-body-2 text-medium-emphasis mb-3">
        Ticket #{{ dialog.item?.id }} — {{ dialog.item?.placa }} · actual:
        <strong>{{ consecutivoDescuentoDetalle ?? 'sin consecutivo' }}</strong>
      </div>
      <v-text-field
        :model-value="corregirConsecutivo.valor"
        label="Nuevo consecutivo"
        variant="outlined"
        density="compact"
        maxlength="30"
        autocomplete="off"
        autofocus
        :error-messages="corregirConsecutivoError"
        @update:model-value="(v: string | null) => corregirConsecutivo.valor = String(v ?? '').toUpperCase().replace(/\s+/g, '')"
      />
      <v-text-field
        v-model="corregirConsecutivo.motivo"
        label="Motivo (opcional)"
        variant="outlined"
        density="compact"
        maxlength="255"
        hint="Queda registrado quién y cuándo hizo la corrección"
        persistent-hint
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="corregirConsecutivo.open = false">Cancelar</v-btn>
      <v-btn
        color="orange-darken-2"
        variant="tonal"
        :loading="corregirConsecutivo.saving"
        :disabled="!!corregirConsecutivoError || !corregirConsecutivo.valor"
        @click="saveCorregirConsecutivo"
      >
        Guardar
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

<!-- 🆕 DIALOG EDITAR DESCUENTO (ticket CONFIRMADA) -->
<v-dialog v-model="edicion.open" max-width="780" persistent scrollable>
  <v-card data-test="dialogo-editar-descuento">
    <v-card-title class="d-flex align-center flex-wrap" style="gap:8px">
      <v-icon color="orange-darken-2">mdi-tag-edit</v-icon>
      Editar descuento
      <span v-if="edicion.ticket" class="text-body-2 text-medium-emphasis">
        Ticket #{{ edicion.ticket.id }} — {{ edicion.ticket.placa ?? '—' }}
      </span>
    </v-card-title>
    <v-divider />
    <v-card-text>
      <div v-if="edicion.cargando" class="d-flex justify-center py-8">
        <v-progress-circular indeterminate color="orange-darken-2" />
      </div>
      <template v-else-if="edicion.ticket">
        <v-alert type="info" variant="tonal" density="compact" class="mb-2" prepend-icon="mdi-tag-outline">
          <strong>Descuento actual:</strong>
          {{ nombreDescuentoInicial }}
          <template v-if="edicion.inicial.descuentoId">
            · {{ fmtCOP(edicion.inicial.monto) }} · consecutivo {{ edicion.inicial.consecutivo || '—' }}
          </template>
        </v-alert>

        <DescuentoCajaEditor
          v-model:descuento-id="edicion.form.descuentoId"
          v-model:monto="edicion.form.monto"
          v-model:autorizado-por-id="edicion.form.autorizadoPorId"
          v-model:observacion="edicion.form.observacion"
          v-model:consecutivo="edicion.form.consecutivo"
          modo="caja"
          etiqueta-selector="Descuento (vacío = sin descuento)"
          :descuentos="descuentosEdicion"
          :usuarios="autorizadoresEdicion"
          :es-moto="edicionEsMoto"
          :ticket-id="edicion.ticket.id"
          :documentos-cargados="edicionDocumentosCargados"
          :requiere-autorizador="edicionRequiereAutorizador"
          :mostrar-efecto-comision="false"
          mostrar-observacion
          @update:consecutivo-bloqueado="(b: boolean) => (edicion.consecutivoBloqueado = b)"
          @update:documentos-completos="(v: boolean) => (edicion.documentosCompletos = v)"
          @aviso="avisoSnack"
        >
          <template #observacion-ayuda>Nota de por qué se aplica o cambia el descuento.</template>
        </DescuentoCajaEditor>

        <v-alert v-if="edicionMontoCero" type="warning" variant="tonal" density="compact" class="mt-2">
          El descuento va en $0: se registrará sin reducir el precio.
        </v-alert>

        <v-row dense class="mt-3">
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="pa-3 rounded-lg h-100" data-test="edicion-total">
              <div class="label-desc">Total del ticket</div>
              <div class="d-flex align-center flex-wrap" style="gap:8px">
                <span class="text-body-1">{{ fmtCOP(edicionTotales.antes) }}</span>
                <v-icon size="18">mdi-arrow-right</v-icon>
                <span
                  class="text-h6 font-weight-bold"
                  :class="{ 'text-orange-darken-2': edicionTotales.despues !== edicionTotales.antes }"
                >
                  {{ fmtCOP(edicionTotales.despues) }}
                </span>
              </div>
              <div class="text-caption text-medium-emphasis mt-1">
                Antes → después. Se recalcula desde el total sin descuento.
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="pa-3 rounded-lg h-100" data-test="edicion-comision">
              <div class="label-desc">Comisión del dateo</div>
              <div v-if="edicion.previaCargando" class="text-caption text-medium-emphasis">
                <v-progress-circular indeterminate size="14" width="2" class="mr-1" /> Calculando…
              </div>
              <template v-else-if="edicion.previa">
                <div v-if="edicion.previa.comision.comisionId" class="d-flex align-center flex-wrap mb-1" style="gap:6px">
                  <span class="text-body-2">#{{ edicion.previa.comision.comisionId }}</span>
                  <v-chip size="x-small" variant="flat" :color="estadoComisionColor(edicion.previa.comision.estado)">
                    {{ edicion.previa.comision.estado }}
                  </v-chip>
                  <v-chip
                    v-if="edicion.previa.comision.enLiquidacion"
                    size="x-small"
                    variant="tonal"
                    color="red-darken-2"
                    prepend-icon="mdi-file-document-check-outline"
                  >
                    En liquidación #{{ edicion.previa.comision.liquidacionIds.join(', #') }}
                  </v-chip>
                </div>
                <template v-if="comisionRecalculada">
                  <div class="text-body-2">
                    Asesor: {{ fmtCOP(comisionRecalculada.antes.montoAsesor) }}
                    → <strong>{{ fmtCOP(comisionRecalculada.despues.montoAsesor) }}</strong>
                  </div>
                  <div
                    v-if="comisionRecalculada.antes.montoConvenio || comisionRecalculada.despues.montoConvenio"
                    class="text-body-2"
                  >
                    Convenio: {{ fmtCOP(comisionRecalculada.antes.montoConvenio) }}
                    → <strong>{{ fmtCOP(comisionRecalculada.despues.montoConvenio) }}</strong>
                  </div>
                  <div class="text-body-2" data-test="edicion-diferencia">
                    Diferencia:
                    <strong :class="comisionRecalculada.diferencia < 0 ? 'text-red-darken-2' : comisionRecalculada.diferencia > 0 ? 'text-green-darken-2' : ''">
                      {{ comisionRecalculada.diferencia > 0 ? '+' : comisionRecalculada.diferencia < 0 ? '−' : '' }}{{ fmtCOP(Math.abs(comisionRecalculada.diferencia)) }}
                    </strong>
                  </div>
                </template>
                <v-alert
                  v-if="avisoComisionEdicion"
                  :type="avisoComisionEdicion.tipo"
                  variant="tonal"
                  density="compact"
                  class="mt-2 text-caption"
                  data-test="edicion-aviso-comision"
                >
                  {{ avisoComisionEdicion.texto }}
                </v-alert>
                <div v-if="!edicionHayCambio" class="text-caption text-medium-emphasis mt-1">
                  Así está hoy. Cambia el descuento para ver el efecto.
                </div>
              </template>
              <div v-else-if="!edicion.error" class="text-caption text-medium-emphasis">
                Digita el consecutivo del descuento para ver el efecto en la comisión.
              </div>
            </v-card>
          </v-col>
        </v-row>

        <DesgloseComisionCard
          v-if="edicion.previa?.comision.desglose && !edicion.previaCargando"
          :desglose="edicion.previa.comision.desglose"
          class="mt-3"
        >
          <template #acciones>
            <v-btn
              v-if="edicion.previa.comision.comisionId"
              size="x-small"
              variant="text"
              color="primary"
              prepend-icon="mdi-open-in-new"
              :href="rutaComision(edicion.previa.comision.comisionId)"
              target="_blank"
              data-test="edicion-corregir-manual"
            >
              Corregir manualmente en Comisiones
            </v-btn>
          </template>
        </DesgloseComisionCard>

        <v-alert v-if="edicion.error" type="error" variant="tonal" density="compact" class="mt-3" data-test="edicion-error">
          {{ edicion.error }}
        </v-alert>
        <v-alert v-else-if="!edicionHayCambio" type="info" variant="tonal" density="compact" class="mt-3">
          El descuento no cambia: no hay nada que guardar.
        </v-alert>

        <v-textarea
          v-model="edicion.motivo"
          class="mt-3"
          label="Motivo de la edición *"
          variant="outlined"
          density="comfortable"
          rows="2"
          auto-grow
          counter
          maxlength="255"
          data-test="edicion-motivo"
          :error-messages="edicionMotivoError"
          hint="Obligatorio. Queda registrado quién, cuándo y el antes y después."
          persistent-hint
        />
      </template>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" :disabled="edicion.guardando" @click="edicion.open = false">Cancelar</v-btn>
      <v-btn
        color="orange-darken-2"
        variant="flat"
        data-test="edicion-guardar"
        :loading="edicion.guardando"
        :disabled="!edicionPuedeGuardar"
        @click="solicitarGuardarEdicion"
      >
        Guardar
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

<!-- 🆕 Aviso antes de guardar cuando cambia la comisión -->
<v-dialog v-model="confirmarComision.open" max-width="520" persistent>
  <v-card v-if="modalComisionEdicion" data-test="modal-comision">
    <v-card-title class="d-flex align-center" style="gap:8px">
      <v-icon :color="modalComisionEdicion.tipo === 'pagada' ? 'red-darken-2' : 'orange-darken-2'">
        {{ modalComisionEdicion.tipo === 'pagada' ? 'mdi-alert-octagon' : 'mdi-cash-sync' }}
      </v-icon>
      {{ modalComisionEdicion.titulo }}
    </v-card-title>
    <v-divider />
    <v-card-text>
      <v-alert
        :type="modalComisionEdicion.tipo === 'pagada' ? 'error' : 'warning'"
        :variant="modalComisionEdicion.tipo === 'pagada' ? 'flat' : 'tonal'"
        density="comfortable"
        data-test="modal-comision-texto"
      >
        {{ modalComisionEdicion.texto }}
      </v-alert>
      <div v-if="comisionRecalculada" class="text-body-2 mt-3">
        Asesor: {{ fmtCOP(comisionRecalculada.antes.montoAsesor) }} → <strong>{{ fmtCOP(comisionRecalculada.despues.montoAsesor) }}</strong>
        <template v-if="comisionRecalculada.antes.montoConvenio || comisionRecalculada.despues.montoConvenio">
          · Convenio: {{ fmtCOP(comisionRecalculada.antes.montoConvenio) }} → <strong>{{ fmtCOP(comisionRecalculada.despues.montoConvenio) }}</strong>
        </template>
      </div>
      <v-checkbox
        v-if="modalComisionEdicion.requiereCasilla"
        v-model="confirmarComision.entiendo"
        class="mt-2"
        color="red-darken-2"
        hide-details
        label="Entiendo que ya se pagó"
        data-test="modal-comision-entiendo"
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" :disabled="edicion.guardando" @click="confirmarComision.open = false">Volver</v-btn>
      <v-btn
        :color="modalComisionEdicion.tipo === 'pagada' ? 'red-darken-2' : 'orange-darken-2'"
        variant="flat"
        data-test="modal-comision-confirmar"
        :loading="edicion.guardando"
        :disabled="modalComisionEdicion.requiereCasilla && !confirmarComision.entiendo"
        @click="guardarEdicionDescuento(modalComisionEdicion.requiereCasilla)"
      >
        {{ modalComisionEdicion.requiereCasilla ? 'Guardar' : 'Confirmar' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

<v-snackbar v-model="snack.show" :timeout="4000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  FacturacionService,
  type FacturacionTicket,
  type ResumenHistorial,
} from '@/services/facturacion_service'
import descuentosService from '@/services/descuentosService'
import TurnosDelDiaService from '@/services/turnosdeldiaService'
import { HttpError } from '@/services/http'
import {
  chipsFiltros,
  ETIQUETAS_ESTADO,
  filtrosAParams,
  filtrosAQuery,
  filtrosDesdeQuery,
  filtrosVacios,
  nombreExcel,
  normalizarCodigo,
  POR_PAGINA,
  quitarFiltro,
  VENDEDOR_MIN,
  type ClaveChip,
  type FiltrosHistorial,
} from './filtrosHistorico'
import { etiquetaConvenio } from '@/services/conveniosService'
import { authSetStore } from '@/stores/AuthStore'
import { obtenerUsuarios } from '@/services/UserService'
import DescuentoCajaEditor from '@/components/facturacion/DescuentoCajaEditor.vue'
import DesgloseComisionCard from '@/components/comisiones/DesgloseComisionCard.vue'
import { TEXTO_EFECTO_DESCUENTO } from '@/services/desgloseComision'
import type { DocPoliciaKey } from '@/components/facturacion/DocumentosPoliciaCarga.vue'
import {
  autorizadoresDescuento,
  mapearDescuentosActivos,
  montoMaximo,
  pideConfirmarMontoCero,
  type DescuentoDetalle,
  type DescuentoRaw,
} from './descuentoFacturacion'
import {
  avisoComision,
  bodyEdicion,
  modalComision,
  formInicialEdicion,
  hayCambioEdicion,
  motivoEdicionValido,
  MOTIVO_EDICION_MIN,
  requiereAutorizador,
  ROLES_EDICION_DESCUENTO,
  totalesEdicion,
  type FormEdicionDescuento,
  type TicketParaEditar,
} from './edicionDescuento'
import type { ResultadoEdicionDescuento } from '@/services/facturacion_service'

const route = useRoute()
const router = useRouter()

// Tipo extendido que coincide con la estructura real del backend
interface DescuentoAplicadoDTO {
  id: number
  codigo: string
  nombre: string
  montoAplicado: number
  autorizadoPor: { id: number; nombre: string } | null
  consecutivoDescuento?: string | null
}

interface ExtendedFacturacionTicket {
  id?: number
  hash?: string
  estado?: string | null

  file_path?: string | null
  filePath?: string | null
  file_mime?: string | null
  fileMime?: string | null
  file_size?: number | null
  fileSize?: number | null
  image_rotation?: number | null
  imageRotation?: number | null

  placa?: string | null
  fecha_pago?: string | null
  fechaPago?: string | null
  confirmado_at?: string | null
  confirmadoAt?: string | null
  created_at?: string | null
  createdAt?: string | null

  // Totales
  total?: number | null
  totalFactura?: number | null
  total_factura?: number | null
  subtotal?: number | null
  iva?: number | null

  // 🆕 Total original antes del descuento
  total_sin_descuento?: number | null
  totalSinDescuento?: number | null

  vendedor_text?: string | null
  vendedorText?: string | null
  prefijo?: string | null
  consecutivo?: string | null
  nit?: string | null
  pin?: string | null
  marca?: string | null

  turnoId?: number | null
  turno_id?: number | null
  servicioId?: number | null
  servicio_id?: number | null
  sedeId?: number | null
  sede_id?: number | null
  agenteId?: number | null
  agente_id?: number | null
  dateoId?: number | null
  dateo_id?: number | null

  servicio_nombre?: string | null
  servicioNombre?: string | null
  sede_nombre?: string | null
  sedeNombre?: string | null
  turnoGlobal?: string | number | null
  placaTurno?: string | null
  funcionarioNombre?: string | null
  canalAtribucion?: string | null

  // 🆕 Descuento informativo
  descuento_id?: number | null
  descuentoId?: number | null
  descuento_monto_aplicado?: number | null
  descuentoMontoAplicado?: number | null
  autorizado_por_id?: number | null
  autorizadoPorId?: number | null
  descuentoAplicado?: DescuentoAplicadoDTO | null
  // 🆕 Consecutivo del descuento
  consecutivoDescuento?: string | null
  consecutivo_descuento?: string | null

  // Confirmación
  confirmedById?: number | null
  confirmed_by_id?: number | null
  confirmedBy?: { id: number; nombres?: string | null; apellidos?: string | null } | null
  autorizadoPor?: { id: number; nombres?: string | null; apellidos?: string | null } | null

  servicio?: { nombreServicio?: string | null } | null
  sede?: { nombre?: string | null } | null
  turno?: { turnoNumero?: string | number | null; placa?: string | null } | null
  dateo?: {
    agente?: { nombre?: string | null } | null
    asesorConvenio?: { nombre?: string | null } | null
    convenio?: { nombre?: string | null } | null
  } | null
}

/* ===== Filtros: la URL es la fuente de verdad (filtros y página) ===== */
const inicial = filtrosDesdeQuery(route.query)
const filtros = ref<FiltrosHistorial>(inicial.filtros)

// Placa, vendedor y consecutivo se escriben a mano: se aplican con una pausa corta.
const placaInput = ref(filtros.value.placa)
const vendedorInput = ref(filtros.value.vendedor)
const consecutivoInput = ref(filtros.value.consecutivo)
const vendedorCorto = computed(() => {
  const n = (vendedorInput.value ?? '').trim().length
  return n > 0 && n < VENDEDOR_MIN
})
let pausa: ReturnType<typeof setTimeout> | null = null
watch([placaInput, vendedorInput, consecutivoInput], () => {
  if (pausa) clearTimeout(pausa)
  pausa = setTimeout(() => {
    filtros.value = {
      ...filtros.value,
      placa: normalizarCodigo(placaInput.value),
      vendedor: (vendedorInput.value ?? '').trim(),
      consecutivo: normalizarCodigo(consecutivoInput.value),
    }
  }, 400)
})

function sincronizarUrl(nuevaPagina = pagination.value.page) {
  // Conserva ?focus (deep link al detalle) si todavía está en la URL.
  const q: Record<string, string> = filtrosAQuery(filtros.value, nuevaPagina, pagination.value.itemsPerPage)
  const focus = route.query?.focus
  if (typeof focus === 'string') q.focus = focus
  router.replace({ query: q }).catch(() => {})
}
function cambiarPorPagina(n: number) {
  pagination.value.itemsPerPage = n
  sincronizarUrl(1)
}

// Cambió un filtro → primera página.
watch(
  filtros,
  () => sincronizarUrl(1),
  { deep: true },
)

// La URL cambió (filtros, página o por página) → recargar.
watch(
  () => route.fullPath,
  () => {
    if (route.name !== 'FacturacionHistorico') return
    const leido = filtrosDesdeQuery(route.query)
    pagination.value.page = leido.page
    pagination.value.itemsPerPage = leido.perPage
    fetchList()
  },
)

/* Catálogos de los desplegables */
const descuentosCatalogo = ref<{ id: number; nombre: string }[]>([])
const serviciosCatalogo = ref<{ id: number; nombre: string }[]>([])
const descuentoItems = computed(() => [
  { title: 'Sin descuento', value: 'ninguno' as const },
  ...descuentosCatalogo.value.map((d) => ({ title: d.nombre, value: d.id })),
])
const servicioItems = computed(() => serviciosCatalogo.value.map((s) => ({ title: s.nombre, value: s.id })))
const estadoItems = (Object.keys(ETIQUETAS_ESTADO) as Array<keyof typeof ETIQUETAS_ESTADO>).map((value) => ({
  title: ETIQUETAS_ESTADO[value],
  value,
}))
async function cargarCatalogos() {
  const [desc, serv] = await Promise.allSettled([
    descuentosService.getActivos(),
    TurnosDelDiaService.obtenerServicios(),
  ])
  if (desc.status === 'fulfilled') {
    const arr = Array.isArray(desc.value?.data) ? desc.value.data : []
    descuentosCatalogo.value = arr
      .filter((d) => typeof d.id === 'number')
      .map((d) => ({ id: d.id as number, nombre: d.nombre }))
    descuentosEdicion.value = mapearDescuentosActivos(
      arr.filter((d) => typeof d.id === 'number') as DescuentoRaw[],
    )
  }
  if (serv.status === 'fulfilled' && Array.isArray(serv.value)) {
    serviciosCatalogo.value = serv.value.map((s) => ({ id: s.id, nombre: s.nombre }))
  }
}

const chips = computed(() =>
  chipsFiltros(filtros.value, {
    descuento: (id) => descuentosCatalogo.value.find((d) => d.id === id)?.nombre,
    servicio: (id) => serviciosCatalogo.value.find((s) => s.id === id)?.nombre,
  }),
)
function quitar(clave: ClaveChip) {
  filtros.value = quitarFiltro(filtros.value, clave)
  if (clave === 'placa') placaInput.value = ''
  if (clave === 'vendedor') vendedorInput.value = ''
  if (clave === 'consecutivo') consecutivoInput.value = ''
}
function limpiar() {
  if (pausa) clearTimeout(pausa)
  placaInput.value = ''
  vendedorInput.value = ''
  consecutivoInput.value = ''
  filtros.value = filtrosVacios()
}

/* Exportar con los filtros activos (download() lleva el Bearer) */
const exportando = ref(false)
async function exportar() {
  exportando.value = true
  try {
    const blob = await FacturacionService.exportarExcel(filtrosAParams(filtros.value))
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreExcel(filtros.value)
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    snack.text = err instanceof HttpError ? `❌ No se pudo exportar: ${err.message}` : '❌ No se pudo exportar'
    snack.show = true
  } finally {
    exportando.value = false
  }
}

/* ===== Tabla (server) ===== */
const loading = ref(false)
const rows = ref<FacturacionTicket[]>([])
const total = ref(0)
const resumen = ref<ResumenHistorial | null>(null)
const pagination = ref({
  page: inicial.page,
  itemsPerPage: inicial.perPage,
  sortBy: [] as Array<{ key: string; order?: 'asc'|'desc' }>
})
const pages = computed(() => Math.max(1, Math.ceil(total.value / pagination.value.itemsPerPage)))

const headers = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Estado', key: 'estado', width: 140 },
  { title: 'Placa', key: 'placa', width: 120 },
  { title: 'Fecha pago', key: 'fecha_pago', width: 160 },
  { title: 'Total factura', key: 'total', width: 160 },
  { title: 'Servicio', key: 'servicioNombre', width: 240 },
  { title: 'Sede', key: 'sedeNombre', width: 200 },
  { title: 'Vendedor', key: 'vendedor_text', width: 220 },
  { title: 'Consec. descuento', key: 'consecutivo_descuento', width: 160 },
  { title: 'Acciones', key: 'acciones', width: 200 },
]

let consulta = 0
async function fetchList() {
  const actual = ++consulta
  loading.value = true
  try {
    const resp = await FacturacionService.list({
      page: pagination.value.page,
      limit: pagination.value.itemsPerPage,
      ...filtrosAParams(filtros.value),
    })
    // Si llegó una respuesta vieja (filtros cambiados entre medias), se descarta.
    if (actual !== consulta) return
    rows.value = resp.data || []
    total.value = resp.meta?.total ?? rows.value.length
    resumen.value = resp.resumen ?? null
  } catch (err) {
    console.error('Error cargando histórico:', err)
    snack.text = '❌ Error cargando histórico'
    snack.show = true
  } finally {
    loading.value = false
  }
}
function refresh() { fetchList() }
// La tabla solo pagina por la URL (el watch de la ruta recarga).
function onUpdateOptions(opts: { page?: number; itemsPerPage?: number; sortBy?: Array<{ key: string; order?: 'asc'|'desc' }>}) {
  if (opts.sortBy) pagination.value.sortBy = opts.sortBy
  if (typeof opts.itemsPerPage === 'number' && opts.itemsPerPage !== pagination.value.itemsPerPage) {
    cambiarPorPagina(opts.itemsPerPage)
  } else if (typeof opts.page === 'number' && opts.page !== pagination.value.page) {
    sincronizarUrl(opts.page)
  }
}

/* ===== Fecha pago fallback chain ===== */
function firstFecha(it: ExtendedFacturacionTicket): string | null {
  return (
    it?.fecha_pago ||
    it?.fechaPago ||
    it?.confirmado_at ||
    it?.confirmadoAt ||
    it?.created_at ||
    it?.createdAt ||
    null
  )
}

/* ===== Detalle ===== */
const dialog = reactive<{ open: boolean; item: ExtendedFacturacionTicket | null }>({ open: false, item: null })

const fechaPagoIso = computed(() => {
  const i = dialog.item
  return i?.fechaPago || i?.fecha_pago || i?.confirmadoAt || i?.confirmado_at || i?.createdAt || i?.created_at || null
})

/* ===== Computed descuento ===== */
const tieneDescuento = computed(() => {
  const i = dialog.item
  if (!i) return false
  const tieneId = !!(i.descuentoId ?? i.descuento_id ?? i.descuentoAplicado?.id)
  const tieneMonto = (i.descuentoAplicado?.montoAplicado ?? i.descuentoMontoAplicado ?? i.descuento_monto_aplicado ?? 0) > 0
  return tieneId && tieneMonto
})

const origenDescuento = computed<'dateo' | 'caja'>(() => {
  const i = dialog.item
  if (!i) return 'dateo'
  // Prioridad 1: descuentoAplicado.autorizadoPor (viene del DTO enriquecido del getById)
  if (i.descuentoAplicado?.autorizadoPor) return 'caja'
  // Prioridad 2: campos planos
  if (i.autorizadoPorId ?? i.autorizado_por_id) return 'caja'
  return 'dateo'
})

const totalSinDescuento = computed(() => {
  const i = dialog.item
  if (!i) return 0
  const sinDesc = i.totalSinDescuento ?? i.total_sin_descuento
  if (sinDesc && sinDesc > 0) return sinDesc
  // Fallback: total actual + monto descuento
  const monto = i.descuentoAplicado?.montoAplicado ?? i.descuentoMontoAplicado ?? i.descuento_monto_aplicado ?? 0
  const totalActual = pickTotal(i)
  return totalActual + (monto || 0)
})

const nombreDescuentoFallback = computed(() => {
  const i = dialog.item
  if (!i) return null
  return i.descuentoAplicado?.nombre ?? null
})

const nombreConfirmadoPor = computed(() => {
  const i = dialog.item
  if (!i) return '—'
  const cb = i.confirmedBy
  if (cb) return [cb.nombres, cb.apellidos].filter(Boolean).join(' ') || '—'
  return '—'
})

/* ===== Controles de imagen ===== */
const imageScale = ref(1)
const imageError = ref(false)
const imageBlobUrl = ref<string | null>(null)

const imgStyle = computed(() => {
  const rotation = dialog.item?.imageRotation ?? dialog.item?.image_rotation ?? 0
  return {
    transform: `rotate(${rotation}deg) scale(${imageScale.value})`,
    transformOrigin: 'center center',
    maxWidth: '100%',
    transition: 'transform 0.2s ease',
  }
})

function zoomIn() { imageScale.value = Math.min(imageScale.value + 0.2, 3) }
function zoomOut() { imageScale.value = Math.max(imageScale.value - 0.2, 0.5) }
function resetZoom() { imageScale.value = 1 }
function onImageError() { imageError.value = true }

async function loadImageBlob(ticketId: number) {
  try {
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('auth_token') ||
      sessionStorage.getItem('token')

    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(`/api/facturacion/tickets/${ticketId}/imagen`, {
      headers,
      credentials: 'include'
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const blob = await response.blob()
    if (imageBlobUrl.value) URL.revokeObjectURL(imageBlobUrl.value)
    imageBlobUrl.value = URL.createObjectURL(blob)
    imageError.value = false
  } catch (err) {
    console.error('Error cargando imagen:', err)
    imageError.value = true
    imageBlobUrl.value = null
  }
}

function closeDialog() {
  dialog.open = false
  if (imageBlobUrl.value) {
    URL.revokeObjectURL(imageBlobUrl.value)
    imageBlobUrl.value = null
  }
  setTimeout(() => {
    imageScale.value = 1
    imageError.value = false
  }, 300)
}

async function openDetailById(id: number | string) {
  try {
    const full = await FacturacionService.getById(id)
    dialog.item = full as ExtendedFacturacionTicket
    dialog.open = true
    imageError.value = false
    imageScale.value = 1
    if (full.id) await loadImageBlob(Number(full.id))
  } catch (err) {
    console.error('Error cargando detalle:', err)
    snack.text = '❌ No se pudo cargar el detalle'
    snack.show = true
  }
}

/* Deep link ?focus=ID */
async function openFocusIfAny() {
  const focus = route.query?.focus
  const n = Number(Array.isArray(focus) ? focus[0] : focus)
  if (!Number.isFinite(n) || !n) return
  await openDetailById(n)
  const q = { ...route.query }; delete (q as Record<string, unknown>).focus
  router.replace({ query: q })
}

/* ===== Helpers UI ===== */
function fmtCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)
}
function asDate(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const yyyy = d.getFullYear(), mm = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0')
  return `${yyyy}-${mm}-${dd}`
}
function asTime(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0'), ss = String(d.getSeconds()).padStart(2,'0')
  return `${hh}:${mm}:${ss}`
}
function estadoColor(s?: string | null) {
  switch ((s || '').toUpperCase()) {
    case 'BORRADOR': return 'grey'
    case 'OCR_LISTO': return 'info'
    case 'LISTA_CONFIRMAR': return 'warning'
    case 'CONFIRMADA': return 'success'
    case 'REVERTIDA': return 'error'
    default: return 'grey'
  }
}
function humanCanal(c?: string | null) {
  const v = String(c || '').toUpperCase()
  if (!v) return ''
  const map: Record<string,string> = {
    'ASESOR_COMERCIAL': 'Asesor comercial',
    'ASESOR': 'Asesor comercial',
    'TELEMERCADEO': 'Call Center',
    'TELE': 'Call Center',
    'REDES': 'Redes',
    'GOOGLE_ADS': 'Google ADS',
    'CONVENIO': 'Convenio',
    'REFERIDO': 'Referido',
  }
  return map[v] || v.charAt(0) + v.slice(1).toLowerCase()
}
function canalChipColor(c?: string | null) {
  const v = String(c || '').toUpperCase()
  switch (v) {
    case 'ASESOR_COMERCIAL':
    case 'ASESOR': return 'purple'
    case 'TELEMERCADEO':
    case 'TELE': return 'indigo'
    case 'REDES': return 'cyan'
    case 'GOOGLE_ADS': return 'teal'
    case 'CONVENIO': return 'blue-grey'
    case 'REFERIDO': return 'green'
    default: return 'grey'
  }
}

function pickTotal(it: ExtendedFacturacionTicket | null) {
  if (!it) return 0
  const a = it?.totalFactura
  if (a != null) return a
  const b = it?.total_factura
  if (b != null) return b
  const c = it?.total
  return c != null ? c : 0
}

function getServicioNombre(it: ExtendedFacturacionTicket | null) {
  if (!it) return '—'
  return it?.servicio_nombre ?? it?.servicioNombre ?? it?.servicio?.nombreServicio ?? '—'
}
function getSedeNombre(it: ExtendedFacturacionTicket | null) {
  if (!it) return '—'
  return it?.sede_nombre ?? it?.sedeNombre ?? it?.sede?.nombre ?? '—'
}

/* ===== Edición de monto de descuento ===== */
const editDescuentoDialog = ref(false)
const editDescuentoMonto = ref(0)
const editingDescuento = ref(false)

function openEditDescuento() {
  editDescuentoMonto.value = Number(
    dialog.item?.descuentoAplicado?.montoAplicado ??
    dialog.item?.descuento_monto_aplicado ?? 0
  )
  editDescuentoDialog.value = true
}

async function saveDescuentoMonto() {
  if (!dialog.item?.id) return
  editingDescuento.value = true
  try {
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('auth_token') ||
      sessionStorage.getItem('token')

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const montoAnterior = Number(
      dialog.item?.descuentoAplicado?.montoAplicado ??
      dialog.item?.descuento_monto_aplicado ?? 0
    )
    const totalActual = Number(
      dialog.item?.totalFactura ?? dialog.item?.total_factura ?? dialog.item?.total ?? 0
    )
    const totalSinDesc = Number(
      dialog.item?.totalSinDescuento ??
      dialog.item?.total_sin_descuento ??
      (totalActual + montoAnterior)
    )

    const resp = await fetch(`/api/facturacion/tickets/${dialog.item.id}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        descuento_monto_aplicado: editDescuentoMonto.value,
        total_sin_descuento: totalSinDesc,
      }),
    })

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

    editDescuentoDialog.value = false
    snack.text = '✅ Monto de descuento actualizado'
    snack.show = true

    const updated = await FacturacionService.getById(dialog.item.id)
    dialog.item = updated as ExtendedFacturacionTicket
    await fetchList()
  } catch (err) {
    console.error('Error actualizando descuento:', err)
    snack.text = '❌ No se pudo actualizar el monto'
    snack.show = true
  } finally {
    editingDescuento.value = false
  }
}

/* ===== 🆕 Consecutivo del descuento ===== */
const authStore = authSetStore()
const CONSECUTIVO_DESCUENTO_RE = /^[A-Z0-9-]{1,30}$/

const consecutivoDescuentoDetalle = computed((): string | null => {
  const i = dialog.item
  if (!i) return null
  return i.consecutivoDescuento ?? i.consecutivo_descuento ?? i.descuentoAplicado?.consecutivoDescuento ?? null
})

// Tras confirmar, solo SUPER_ADMIN/GERENCIA lo corrige (el backend registra el cambio).
const puedeCorregirConsecutivo = computed(() =>
  authStore.hasAnyRole(['SUPER_ADMIN', 'GERENCIA']) && dialog.item?.estado === 'CONFIRMADA'
)

const corregirConsecutivo = reactive({ open: false, valor: '', motivo: '', saving: false })
const corregirConsecutivoError = computed((): string => {
  const v = corregirConsecutivo.valor
  if (v && !CONSECUTIVO_DESCUENTO_RE.test(v)) return 'Solo letras, números y guion (-), máximo 30.'
  if (v && v === consecutivoDescuentoDetalle.value) return 'Es el mismo consecutivo actual.'
  return ''
})

function openCorregirConsecutivo() {
  Object.assign(corregirConsecutivo, {
    open: true, valor: consecutivoDescuentoDetalle.value ?? '', motivo: '', saving: false,
  })
}

async function saveCorregirConsecutivo() {
  if (!dialog.item?.id) return
  corregirConsecutivo.saving = true
  try {
    await FacturacionService.corregirConsecutivoDescuento(
      dialog.item.id, corregirConsecutivo.valor, corregirConsecutivo.motivo.trim()
    )
    corregirConsecutivo.open = false
    snack.text = '✅ Consecutivo del descuento corregido'
    snack.show = true
    const updated = await FacturacionService.getById(dialog.item.id)
    dialog.item = updated as ExtendedFacturacionTicket
    await fetchList()
  } catch (err) {
    console.error('Error corrigiendo consecutivo del descuento:', err)
    snack.text = `❌ ${err instanceof Error ? err.message : 'No se pudo corregir el consecutivo'}`
    snack.show = true
  } finally {
    corregirConsecutivo.saving = false
  }
}

/* ===== 🆕 Editar el descuento de un ticket CONFIRMADA ===== */
// Mismo bloque del modal de confirmación (DescuentoCajaEditor). El backend
// recalcula total y comisión (PENDIENTE) y deja registro; el diálogo muestra
// el antes y el después con solo_previsualizar antes de guardar.
type TicketEdicion = TicketParaEditar & {
  placa?: string | null
  tipoVehiculoSnapshot?: string | null
  documentosPoliciaFaltantes?: DocPoliciaKey[]
  descuentoAplicado?: { autorizadoPor?: { id: number; nombre: string } | null } | null
  turno?: { tipoVehiculo?: string | null } | null
}

const puedeEditarDescuento = computed(() => authStore.hasAnyRole([...ROLES_EDICION_DESCUENTO]))
const descuentosEdicion = ref<DescuentoDetalle[]>([])
const autorizadoresEdicion = ref<{ id: number; nombre: string }[]>([])

const formVacio = (): FormEdicionDescuento => ({
  descuentoId: null, monto: 0, autorizadoPorId: null, observacion: '', consecutivo: '',
})
const edicion = reactive({
  open: false,
  cargando: false,
  guardando: false,
  ticket: null as TicketEdicion | null,
  inicial: formVacio(),
  form: formVacio(),
  motivo: '',
  consecutivoBloqueado: true,
  documentosCompletos: false,
  previa: null as ResultadoEdicionDescuento | null,
  previaCargando: false,
  error: '',
})

async function cargarAutorizadores(ticket: TicketEdicion) {
  if (!autorizadoresEdicion.value.length) {
    try {
      autorizadoresEdicion.value = autorizadoresDescuento(await obtenerUsuarios())
    } catch (err) {
      console.error('Error cargando autorizadores:', err)
    }
  }
  // El que ya autorizó el descuento aparece aunque hoy no esté en la lista.
  const actual = ticket.descuentoAplicado?.autorizadoPor
  if (actual && !autorizadoresEdicion.value.some((u) => u.id === actual.id)) {
    autorizadoresEdicion.value = [...autorizadoresEdicion.value, actual]
  }
}

async function abrirEdicionDescuento(id: number) {
  Object.assign(edicion, {
    open: true, cargando: true, guardando: false, ticket: null, motivo: '',
    previa: null, previaCargando: false, error: '',
  })
  try {
    const t = (await FacturacionService.getById(id)) as unknown as TicketEdicion
    await cargarAutorizadores(t)
    edicion.inicial = formInicialEdicion(t)
    edicion.form = { ...edicion.inicial }
    edicion.ticket = t
  } catch (err) {
    console.error('Error cargando el ticket para editar:', err)
    snack.text = '❌ No se pudo cargar el ticket'
    snack.show = true
    edicion.open = false
  } finally {
    edicion.cargando = false
  }
}

const nombreDescuentoInicial = computed(() => {
  const id = edicion.inicial.descuentoId
  if (!id) return 'sin descuento'
  return descuentosEdicion.value.find((d) => d.id === id)?.nombre ?? `Descuento #${id}`
})
const edicionEsMoto = computed(() => {
  const tipo = (edicion.ticket?.tipoVehiculoSnapshot ?? edicion.ticket?.turno?.tipoVehiculo ?? '').toUpperCase()
  return tipo.includes('MOTO')
})
const edicionDocumentosCargados = computed((): DocPoliciaKey[] => {
  const faltan = edicion.ticket?.documentosPoliciaFaltantes ?? ['carnet', 'tarjeta_propiedad', 'cedula']
  return (['carnet', 'tarjeta_propiedad', 'cedula'] as const).filter((k) => !faltan.includes(k))
})
const edicionDetalle = computed(() =>
  descuentosEdicion.value.find((d) => d.id === edicion.form.descuentoId) ?? null,
)
const edicionHayCambio = computed(() => hayCambioEdicion(edicion.inicial, edicion.form))
const edicionRequiereAutorizador = computed(() => requiereAutorizador(edicion.inicial, edicion.form))
const edicionMontoCero = computed(() =>
  !!edicion.form.descuentoId &&
  pideConfirmarMontoCero(
    edicionDetalle.value?.codigo,
    edicion.form.monto,
    montoMaximo(edicionDetalle.value, edicionEsMoto.value),
  ),
)
const edicionTotales = computed(() =>
  edicion.ticket ? totalesEdicion(edicion.ticket, edicion.form) : { antes: 0, despues: 0 },
)
const edicionMotivoError = computed(() =>
  edicion.motivo && !motivoEdicionValido(edicion.motivo)
    ? `Mínimo ${MOTIVO_EDICION_MIN} caracteres.`
    : '',
)
const avisoComisionEdicion = computed(() =>
  edicion.previa ? avisoComision(edicion.previa.comision) : null,
)
const comisionRecalculada = computed(() => {
  const c = edicion.previa?.comision
  const recalcula = c?.accion === 'RECALCULADA' || c?.accion === 'AJUSTADA_TRAS_PAGO'
  return recalcula && c.antes && c.despues
    ? { antes: c.antes, despues: c.despues, diferencia: c.diferencia.total }
    : null
})
const modalComisionEdicion = computed(() =>
  edicion.previa ? modalComision(edicion.previa.comision, fmtCOP) : null,
)
const confirmarComision = reactive({ open: false, entiendo: false })
// Abre la comisión en otra pestaña (el diálogo sigue abierto); allí se
// corrige a mano con el bloqueo de "sin comisión" que ya existe.
function rutaComision(id: number) {
  return router.resolve(`/comercial/comisiones/${id}`).href
}
function estadoComisionColor(estado: string | null) {
  return estado === 'PAGADA' ? 'red-darken-2'
    : estado === 'APROBADA' ? 'blue'
    : estado === 'ANULADA' ? 'grey'
    : 'orange-darken-2'
}

// Si la comisión cambia, primero el modal (con casilla si ya se pagó).
function solicitarGuardarEdicion() {
  if (!edicionPuedeGuardar.value) return
  if (modalComisionEdicion.value) {
    Object.assign(confirmarComision, { open: true, entiendo: false })
    return
  }
  void guardarEdicionDescuento(false)
}
const edicionPuedeGuardar = computed(() => {
  const f = edicion.form
  if (edicion.guardando || edicion.cargando || !edicionHayCambio.value) return false
  if (!motivoEdicionValido(edicion.motivo) || edicion.error || edicion.previaCargando) return false
  // Sin la previsualización no se sabe qué le pasa a la comisión.
  if (!edicion.previa) return false
  if (f.descuentoId && edicion.consecutivoBloqueado) return false
  if (edicionDetalle.value?.codigo === 'INFORMATIVO_POLICIA' && !edicion.documentosCompletos) return false
  if (edicionRequiereAutorizador.value && !f.autorizadoPorId) return false
  return true
})

// Antes y después (total y comisión) desde el backend, sin guardar nada.
let previaTimer: ReturnType<typeof setTimeout> | null = null
let previaConsulta = 0
watch(
  () => [edicion.open, edicion.ticket?.id, { ...edicion.form }] as const,
  () => {
    if (previaTimer) clearTimeout(previaTimer)
    edicion.error = ''
    edicion.previa = null
    const ticket = edicion.ticket
    // Con descuento y sin consecutivo válido el backend respondería 422: se espera.
    const consecutivoListo = !edicion.form.descuentoId || CONSECUTIVO_DESCUENTO_RE.test(edicion.form.consecutivo)
    // Sin cambios también se pide: el diálogo muestra la comisión al abrir.
    if (!edicion.open || !ticket || !consecutivoListo) {
      edicion.previaCargando = false
      return
    }
    edicion.previaCargando = true
    const consulta = ++previaConsulta
    previaTimer = setTimeout(async () => {
      try {
        const r = await FacturacionService.previsualizarEdicionDescuento(
          ticket.id, bodyEdicion(edicion.form, ''),
        )
        if (consulta === previaConsulta) edicion.previa = r
      } catch (err) {
        if (consulta === previaConsulta) {
          edicion.error = err instanceof Error ? err.message : 'No se pudo calcular el efecto.'
        }
      } finally {
        if (consulta === previaConsulta) edicion.previaCargando = false
      }
    }, 500)
  },
  { deep: true },
)

async function guardarEdicionDescuento(confirmarPagada: boolean) {
  const ticket = edicion.ticket
  if (!ticket || !edicionPuedeGuardar.value) return
  edicion.guardando = true
  edicion.error = ''
  try {
    const r = await FacturacionService.editarDescuentoConfirmado(
      ticket.id, bodyEdicion(edicion.form, edicion.motivo, confirmarPagada),
    )
    confirmarComision.open = false
    edicion.open = false
    const aviso = avisoComision(r.comision)
    snack.text = aviso.tipo === 'warning'
      ? `✅ Descuento actualizado. ${aviso.texto}`
      : '✅ Descuento actualizado'
    snack.show = true
    if (dialog.item?.id === ticket.id) {
      dialog.item = (await FacturacionService.getById(ticket.id)) as ExtendedFacturacionTicket
    }
    await fetchList()
  } catch (err) {
    console.error('Error editando el descuento:', err)
    confirmarComision.open = false
    edicion.error = err instanceof Error ? err.message : 'No se pudo guardar.'
  } finally {
    edicion.guardando = false
  }
}

function avisoSnack(texto: string) {
  snack.text = texto
  snack.show = true
}

/* ===== Snack ===== */
const snack = reactive({ show: false, text: '' })

/* ===== Lifecycle ===== */
onMounted(async () => {
  void cargarCatalogos()
  await fetchList()
  await openFocusIfAny()
})

onBeforeUnmount(() => {
  if (imageBlobUrl.value) URL.revokeObjectURL(imageBlobUrl.value)
})
</script>

<style scoped>
.v-card {
  box-shadow: 0 10px 20px rgba(0,0,0,0.08), 0 6px 6px rgba(0,0,0,0.05);
  border-radius: 16px;
}

.section-title {
  font-weight: 700;
  margin-bottom: 10px;
  font-size: 0.95rem;
  letter-spacing: .3px;
}

.label {
  font-size: .75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.value {
  font-weight: 600;
}

/* Labels y values dentro de la tarjeta de descuento */
.label-desc {
  font-size: .72rem;
  color: rgba(0,0,0,.55);
  text-transform: uppercase;
  letter-spacing: .04em;
  margin-bottom: 2px;
}
.value-desc {
  font-weight: 600;
  font-size: .92rem;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.rounded-xl { border-radius: 16px; }
.rounded-2xl { border-radius: 20px; }
.text-medium-emphasis { color: rgba(0,0,0,.6); }

.capt-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

/* Preview de imagen */
.image-preview-wrapper {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
  background: #fafafa;
}

.preview-canvas {
  width: 100%;
  max-height: 500px;
  overflow: auto;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
}

.preview-canvas img {
  max-width: 100%;
  display: block;
  margin: 0 auto;
  border-radius: 6px;
}

.preview-canvas::-webkit-scrollbar { width: 8px; height: 8px; }
.preview-canvas::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
.preview-canvas::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
.preview-canvas::-webkit-scrollbar-thumb:hover { background: #555; }
</style>
