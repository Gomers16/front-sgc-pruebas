<template>
  <v-container class="py-6">
    <!-- HEADER -->
    <v-card elevation="10" class="rounded-2xl mb-6">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap py-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-3" color="yellow-darken-3">
            <v-icon>mdi-receipt</v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">Facturación / Subir ticket</div>
          </div>
        </div>

        <div class="d-flex align-center flex-wrap" style="gap:10px">
          <!-- Loader OCR (solo si NO es servicio simplificado) -->
          <v-progress-circular
            v-if="!esServicioSimplificado && ocr.status==='running'"
            indeterminate
            color="info"
            :size="28"
            :width="3"
            aria-label="Procesando OCR"
          />
          <!-- Estado -->
          <v-chip v-else :color="estadoColor" variant="tonal" class="font-weight-bold">
            {{ estado }}
          </v-chip>

          <v-btn prepend-icon="mdi-plus" @click="resetAll" color="primary" variant="flat">Nueva carga</v-btn>
          <v-btn prepend-icon="mdi-history" variant="tonal" @click="$router.push({ path: '/facturacion/historico' })">
            Histórico
          </v-btn>
          <v-btn prepend-icon="mdi-help-circle-outline" variant="text" @click="dialogAyuda=true">
            Ayuda
          </v-btn>
        </div>
      </v-card-title>
    </v-card>

    <!-- ALERTA SERVICIO SIMPLIFICADO -->
    <v-alert v-if="esServicioSimplificado" type="info" variant="tonal" class="mb-4" prominent>
      <v-icon class="mr-2">mdi-information</v-icon>
      <strong>Servicio simplificado detectado ({{ turnoCard.servicioNombre }}):</strong> Solo se requiere subir la imagen de la factura. No es necesario llenar campos adicionales.
    </v-alert>

    <v-row>
      <!-- IZQUIERDA: Evidencia -->
      <v-col cols="12" md="6">
        <v-card elevation="8" class="rounded-xl mb-4">
          <v-card-title class="py-4">
            <v-icon class="mr-2">mdi-image-plus</v-icon>
            Evidencia (ticket)
          </v-card-title>
          <v-divider />
          <v-card-text>
            <!-- Dropzone -->
            <div
              class="dropzone rounded-lg mb-4"
              :class="{ 'dropzone--active': dragging }"
              @dragover.prevent="dragging = true"
              @dragleave.prevent="dragging = false"
              @drop.prevent="onDrop"
              @click="selectFile"
            >
              <div class="text-center">
                <div class="text-subtitle-1 font-weight-bold">Suelta el ticket o pega (Ctrl+V)</div>
                <div class="text-medium-emphasis">JPG o PNG (hasta 8 MB)</div>
                <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,.jfif" class="d-none" @change="onFileChange" />
              </div>
            </div>

            <!-- Preview -->
            <v-expand-transition>
              <div v-if="previewUrl" class="preview-wrapper">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center" style="gap:8px">
                    <v-btn size="small" variant="tonal" prepend-icon="mdi-magnify-minus" @click="zoomOut">Zoom -</v-btn>
                    <v-btn size="small" variant="tonal" prepend-icon="mdi-magnify-plus" @click="zoomIn">Zoom +</v-btn>
                    <v-btn size="small" variant="tonal" prepend-icon="mdi-rotate-right" @click="rotateRight">Rotar 90°</v-btn>
                    <v-btn size="small" variant="text" @click="fitWidth">Ajustar a ancho</v-btn>
                  </div>

                  <!-- OCR status (solo si NO es servicio simplificado) -->
                  <div v-if="!esServicioSimplificado" class="d-flex align-center" style="gap:10px">
                    <template v-if="ocr.status==='running'">
                      <v-progress-circular indeterminate color="info" :size="22" :width="2" />
                    </template>
                    <v-chip v-else-if="ocr.status==='done'" size="small" color="success" variant="tonal">OCR listo</v-chip>
                    <v-chip v-else size="small" color="grey" variant="tonal">OCR pendiente</v-chip>

                    <v-btn
                      size="small"
                      variant="outlined"
                      prepend-icon="mdi-reload"
                      :disabled="!previewBlob || ocr.status==='running'"
                      @click="retryOCR"
                    >Reintentar OCR</v-btn>
                  </div>
                </div>

                <div class="preview-canvas">
                  <img :src="previewUrl" :style="imgStyle" alt="Ticket" />
                </div>
              </div>
            </v-expand-transition>
          </v-card-text>
        </v-card>
      </v-col>
<!-- DERECHA: Turno asociado -->
      <v-col cols="12" md="6">
        <v-card elevation="8" class="rounded-xl mb-4">
          <v-card-title class="py-4 d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-clipboard-text</v-icon>
              Turno asociado
            </div>

            <!-- Chips de Global / Servicio y código -->
            <div class="d-flex align-center flex-wrap" style="gap:8px">
              <v-chip size="small" v-if="turnoCard.numeroGlobal" color="primary" variant="elevated" prepend-icon="mdi-counter">
                Global: {{ turnoCard.numeroGlobal }}
              </v-chip>
              <v-chip size="small" v-if="turnoCard.numeroServicio" color="deep-purple" variant="elevated" prepend-icon="mdi-counter">
                {{ turnoCard.servicioCodigo || 'SERV' }}: {{ turnoCard.numeroServicio }}
              </v-chip>
              <v-chip size="small" v-if="turnoCard.servicioCodigo" color="indigo" variant="tonal">
                {{ turnoCard.servicioCodigo }}
              </v-chip>
            </div>
          </v-card-title>

          <v-divider/>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <div class="label">Turno</div>
                <div class="value">#{{ turnoCard.numero ?? '—' }}</div>
              </v-col>
              <v-col cols="6">
                <div class="label">Placa</div>
                <div class="value">{{ turnoCard.placa || '—' }}</div>
              </v-col>

              <v-col cols="6">
                <div class="label">Servicio</div>
                <div class="value">{{ turnoCard.servicioNombre || '—' }}</div>
              </v-col>
              <v-col cols="6">
                <div class="label">Ingreso</div>
                <div class="value">{{ turnoCard.horaIngreso || '—' }}</div>
              </v-col>

              <v-col cols="6">
                <div class="label">Fecha</div>
                <div class="value">{{ turnoCard.fecha || '—' }}</div>
              </v-col>
              <v-col cols="6">
                <div class="label">Estado</div>
                <div class="value">
                  <v-chip size="small" :color="turnoCard.estadoColor" variant="tonal">{{ turnoCard.estado || '—' }}</v-chip>
                </div>
              </v-col>

              <v-col cols="6">
                <div class="label">Sede</div>
                <div class="value">{{ turnoCard.sede || '—' }}</div>
              </v-col>
              <v-col cols="6">
                <div class="label">Funcionario</div>
                <div class="value">{{ turnoCard.funcionario || '—' }}</div>
              </v-col>

              <v-col cols="12">
                <div class="label">Tipo de vehículo</div>
                <div class="value">{{ turnoCard.tipoVehiculo || '—' }}</div>
              </v-col>
            </v-row>

            <!-- Captación / Dateo (solo si NO es servicio simplificado) -->
            <template v-if="!esServicioSimplificado">
              <v-divider class="my-4" />
              <div class="text-subtitle-2 mb-2">Captación / Dateo</div>

              <!-- Asesor Comercial -->
              <div class="capt-line" v-if="turnoCard.agenteComercialNombre">
                <v-chip size="small" color="secondary" variant="tonal">Asesor comercial</v-chip>
                <span class="text-medium-emphasis">{{ turnoCard.agenteComercialNombre }}</span>
              </div>

              <!-- Asesor Convenio -->
              <div class="capt-line" v-if="turnoCard.asesorConvenioNombre">
                <v-chip size="small" color="teal" variant="tonal">Asesor convenio</v-chip>
                <span class="text-medium-emphasis">{{ turnoCard.asesorConvenioNombre }}</span>
              </div>

              <!-- Convenio -->
              <div class="capt-line" v-if="turnoCard.convenioNombre">
                <v-chip size="small" color="blue-grey" variant="tonal">Convenio</v-chip>
                <span class="text-medium-emphasis">{{ turnoCard.convenioNombre }}</span>
              </div>

              <!-- ++ AVANCE ++ -->
              <div class="capt-line mt-1" v-if="turnoMeta.esAvance">
                <v-chip size="small" color="warning" variant="flat" prepend-icon="mdi-cash-fast">
                  AVANCE
                </v-chip>
                <span class="text-medium-emphasis font-weight-medium">
                  El incentivo del convenio se aplica como descuento variable en caja.
                </span>
              </div>

              <!-- Descuento informativo pre-marcado desde el dateo -->
<div class="capt-line mt-1" v-if="turnoMeta.descuentoId">
  <v-chip size="small" color="orange-darken-2" variant="tonal" prepend-icon="mdi-tag-check">
    Descuento: {{ descuentoDelDateoNombre }}
  </v-chip>
  <v-tooltip text="El comercial pre-marcó este descuento al crear el dateo" location="top">
    <template #activator="{ props }">
      <v-icon v-bind="props" size="16" color="orange-darken-2">mdi-information-outline</v-icon>
    </template>
  </v-tooltip>
</div>

<!-- Observación del dateo (ej: "Avance de $15.000") -->
<div class="capt-line mt-1" v-if="turnoMeta.observacion">
  <v-icon size="16" color="blue-grey">mdi-note-text-outline</v-icon>
  <span class="text-caption font-weight-medium" style="color: rgba(0,0,0,0.7)">
    {{ turnoMeta.observacion }}
  </span>
</div>
            </template>

            <v-alert type="info" variant="tonal" class="mt-4">
              {{ esServicioSimplificado
                ? 'Para este servicio solo se requiere la imagen de la factura.'
                : 'Esta facturación quedará asociada al turno mostrado.'
              }}
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- Formulario derecha (datos detectados) - OCULTO SI ES SERVICIO SIMPLIFICADO -->
        <v-card v-if="!esServicioSimplificado" elevation="8" class="rounded-xl">
          <v-card-text>
            <div class="section-title">Datos detectados automáticamente</div>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.placa" label="Placa" clearable />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="totalDisplay"
                  label="Total (COP)"
                  prefix="$"
                  clearable
                  @focus="onTotalFocus"
                  @blur="onTotalBlur"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.fecha" type="date" label="Fecha del pago" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="hora12"
                  label="Hora del pago"
                  placeholder="hh:mm:ss AM/PM"
                  clearable
                  @blur="onHora12Blur"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.vendedor" label="Vendedor" clearable />
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.nit" label="NIT" clearable />
              </v-col>
              <v-col cols="12" md="6">
  <v-text-field
    v-model="form.pin"
    label="PIN"
    clearable
    :bg-color="pinAmbiguo ? 'yellow-lighten-4' : undefined"
    :hint="pinAmbiguo ? '⚠️ Verifique los dígitos 0 y 8 manualmente' : ''"
    persistent-hint
  />
</v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.marca" label="Marca" clearable />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.prefijo" label="Prefijo (FV/FE)" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.consecutivo" label="Consecutivo (número)" />
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <v-row>
              <v-col cols="12" md="4">
                <v-text-field v-model="subtotalDisplay" label="Subtotal" prefix="$"
                              @focus="subtotalFocus" @blur="subtotalBlur" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="ivaDisplay" label="IVA" prefix="$"
                              @focus="ivaFocus" @blur="ivaBlur" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="totalFacturaDisplay" label="Total factura" prefix="$"
                              @focus="totalFacturaFocus" @blur="totalFacturaBlur" />
              </v-col>
            </v-row>

            <v-divider class="my-6" />

            <div class="d-flex align-center justify-end" style="gap:10px">
              <v-btn variant="text" @click="resetAll">Limpiar</v-btn>
              <v-btn color="primary" :disabled="!requeridosOk" @click="openConfirm">
                Confirmar facturación
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Botón de confirmación para servicio simplificado -->
        <v-card v-else elevation="8" class="rounded-xl">
          <v-card-text>
            <div class="text-center">
              <v-icon size="64" color="primary" class="mb-3">mdi-file-document-check</v-icon>
              <div class="text-h6 mb-2">Servicio simplificado</div>
              <div class="text-body-2 text-medium-emphasis mb-4">
                Con la imagen de la factura es suficiente para proceder.
              </div>
              <v-btn
                color="primary"
                size="large"
                block
                :disabled="!requeridosOk"
                @click="openConfirm"
                prepend-icon="mdi-check-circle"
              >
                Confirmar facturación
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
<!-- Ayuda -->
    <v-dialog v-model="dialogAyuda" max-width="720">
      <v-card>
        <v-card-title>Ayuda rápida</v-card-title>
        <v-card-text>
          <ul class="mt-2">
            <li>Arrastra la imagen o pega con <b>Ctrl+V</b>.</li>
            <li v-if="!esServicioSimplificado">Si la foto está torcida, pulsa <b>Rotar 90°</b> y luego <b>Reintentar OCR</b>.</li>
            <li v-if="!esServicioSimplificado">El sistema detecta datos clave: <i>Placa</i>, <i>Total</i>, <i>Fecha</i> y <i>Hora</i>, además de NIT/PIN/Marca.</li>
            <li v-if="esServicioSimplificado"><b>Servicio simplificado:</b> Solo se requiere subir la imagen de la factura. No es necesario llenar campos.</li>
          </ul>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="dialogAyuda=false">Entendido</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL CONFIRMACIÓN -->
    <v-dialog v-model="dialogConfirm" max-width="780">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-shield-check</v-icon>
          Confirmar facturación{{ esServicioSimplificado ? ' simplificada' : '' }}
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div class="text-body-2 mb-3">
            {{ esServicioSimplificado
              ? 'Al confirmar se guardará la imagen de la factura asociada al turno mostrado.'
              : 'Revisa los datos. Al confirmar se guardará la facturación asociada al turno mostrado y se procesará la comisión automática si aplica.'
            }}
          </div>

          <v-row>
            <!-- Columna izquierda: Ticket (solo si NO es servicio simplificado) -->
            <v-col v-if="!esServicioSimplificado" cols="12" md="6">
              <div class="section-title">Ticket</div>
              <div class="label">Placa</div>
              <div class="value mb-2">{{ form.placa || '—' }}</div>

              <div class="label">Fecha y hora de pago</div>
              <div class="value mb-2">{{ form.fecha || '—' }} • {{ hora12 || '—' }}</div>

              <div class="label">Total</div>
              <div class="value mb-2">{{ totalFacturaDisplay || totalDisplay || '—' }}</div>

              <div class="label">Vendedor</div>
              <div class="value mb-2">{{ form.vendedor || '—' }}</div>

              <div class="label">Prefijo / Consecutivo</div>
              <div class="value mb-2">{{ form.prefijo || '—' }} {{ form.consecutivo || '' }}</div>

              <div class="label">NIT / PIN / Marca</div>
              <div class="value">{{ form.nit || '—' }} / {{ form.pin || '—' }} / {{ form.marca || '—' }}</div>
            </v-col>

            <!-- Columna derecha (o única si es servicio simplificado): Turno asociado -->
            <v-col cols="12" :md="esServicioSimplificado ? 12 : 6">
              <div class="section-title">Turno asociado</div>
              <div class="label">Turno / Servicio</div>
              <div class="value mb-2">#{{ turnoCard.numero ?? '—' }} • {{ turnoCard.servicioNombre || '—' }}</div>

              <div class="label">Placa (turno)</div>
              <div class="value mb-2">{{ turnoCard.placa || '—' }}</div>

              <div class="label">Sede / Funcionario</div>
              <div class="value mb-2">{{ turnoCard.sede || '—' }} • {{ turnoCard.funcionario || '—' }}</div>

              <template v-if="!esServicioSimplificado">
                <div class="label">Canal</div>
                <div class="value mb-2">
                  <v-chip v-if="turnoCard.captacionCanal" :color="canalChipColor(turnoCard.captacionCanal)" size="small" variant="tonal">
                    {{ humanCanal(turnoCard.captacionCanal) }}
                  </v-chip>
                  <span v-else>—</span>
                </div>

                <div class="label">Asesores / Convenio</div>
                <div class="value">
                  <div class="capt-line" v-if="turnoCard.agenteComercialNombre">
                    <v-chip size="x-small" color="secondary" variant="tonal">Comercial</v-chip>
                    <span class="text-medium-emphasis">{{ turnoCard.agenteComercialNombre }}</span>
                  </div>
                  <div class="capt-line" v-if="turnoCard.asesorConvenioNombre">
                    <v-chip size="x-small" color="teal" variant="tonal">Convenio</v-chip>
                    <span class="text-medium-emphasis">{{ turnoCard.asesorConvenioNombre }}</span>
                  </div>
                  <div class="capt-line" v-if="turnoCard.convenioNombre">
                    <v-chip size="x-small" color="blue-grey" variant="tonal">Convenio</v-chip>
                    <span class="text-medium-emphasis">{{ turnoCard.convenioNombre }}</span>
                  </div>
                  <!-- ++ AVANCE en modal de confirmación ++ -->
                  <div class="capt-line" v-if="turnoMeta.esAvance">
                    <v-chip size="x-small" color="warning" variant="flat" prepend-icon="mdi-cash-fast">AVANCE</v-chip>
                    <span class="text-medium-emphasis">Descuento variable aplicado en caja</span>
                  </div>
                  <div v-if="!turnoCard.agenteComercialNombre && !turnoCard.asesorConvenioNombre && !turnoCard.convenioNombre && !turnoMeta.esAvance">—</div>
                </div>
              </template>
            </v-col>
          </v-row>

          <!-- SECCIÓN DESCUENTO INFORMATIVO (solo tickets RTM, no simplificados) -->
          <template v-if="!esServicioSimplificado">
            <v-divider class="my-4" />
            <div class="section-title d-flex align-center" style="gap:8px">
              <v-icon color="orange-darken-2" size="20">mdi-tag-multiple</v-icon>
              Descuento
            </div>

            <!-- ── CASO A: pre-marcado desde dateo, sin override ── -->
            <template v-if="turnoMeta.descuentoId && !overrideDateoDescuento">

              <v-alert
                type="warning"
                variant="tonal"
                density="compact"
                color="orange-darken-2"
                class="mt-2"
                prepend-icon="mdi-tag-check"
              >
                <div class="d-flex align-center justify-space-between flex-wrap" style="gap:8px">
                  <div>
                    <strong>Pre-marcado desde el dateo:</strong> {{ descuentoDelDateoNombre }}
                    <div class="text-caption mt-1">
                      El comercial indicó este descuento al crear el dateo.
                      Se aplicará automáticamente — la comisión bajará del valor nuevo directo
                      al valor básico de dateo.
                    </div>
                  </div>
                  <v-btn
                    size="x-small"
                    variant="outlined"
                    color="orange-darken-2"
                    prepend-icon="mdi-swap-horizontal"
                    @click="overrideDateoDescuento = true; descuentoIdEnCaja = null; descuentoMontoAplicado = 0; resetDocPolicia()"
                  >
                    Cambiar descuento
                  </v-btn>
                </div>
              </v-alert>

              <!-- Monto descuento - CASO A dateo pre-marcado -->
              <v-card variant="tonal" color="orange-darken-2" class="mt-3 pa-3 rounded-lg">
                <div class="text-subtitle-2 font-weight-bold mb-1 d-flex align-center" style="gap:6px">
                  <v-icon size="16">mdi-currency-usd</v-icon>
                  Descuento aplicado
                  <v-chip size="x-small" color="blue" variant="flat" class="ms-1">
                    {{ esVehiculoMoto ? 'Moto' : 'Carro' }}
                  </v-chip>
                  <!-- chip Monto fijo cubre policía, empleado y avance propietario -->
                  <v-chip v-if="esDescuentoPolicia || esDescuentoEmpleado || esDescuentoAvancePropietario" size="x-small" color="blue-darken-3" variant="flat" class="ms-1">
                    Monto fijo
                  </v-chip>
                </div>

                <!-- INFORMATIVO_POLICIA / INFORMATIVO_EMPLEADO / AVANCE_PROPIETARIO: monto fijo, solo lectura -->
                <template v-if="esDescuentoPolicia || esDescuentoEmpleado || esDescuentoAvancePropietario">
                  <div class="text-caption text-medium-emphasis mb-2">
                    El descuento tiene monto fijo según configuración.
                  </div>
                  <div class="text-h6 font-weight-bold">
                    {{ formatCOP(descuentoMaximo) }}
                  </div>
                </template>

                <!-- Otros descuentos: slider editable -->
                <template v-else>
                  <div class="text-caption text-medium-emphasis mb-3">
                    Máximo: <strong>{{ formatCOP(descuentoMaximo) }}</strong> — puedes aplicar de $0 a {{ formatCOP(descuentoMaximo) }}
                  </div>
                  <v-row dense align="center">
                    <v-col cols="12" md="5">
                      <v-text-field
                        v-model.number="descuentoMontoAplicado"
                        label="Monto descuento ($)"
                        variant="outlined"
                        density="comfortable"
                        type="number"
                        prefix="$"
                        :min="0"
                        :max="descuentoMaximo"
                        hide-details
                        @blur="clampDescuentoMonto"
                      />
                    </v-col>
                    <v-col cols="12" md="7">
                      <v-slider
                        v-model="descuentoMontoAplicado"
                        :min="0"
                        :max="descuentoMaximo"
                        :step="1000"
                        color="orange-darken-2"
                        thumb-label
                        hide-details
                        class="mt-2"
                      >
                        <template #thumb-label="{ modelValue }">
                          ${{ Math.round(modelValue / 1000) }}k
                        </template>
                      </v-slider>
                    </v-col>
                  </v-row>
                  <div v-if="descuentoMontoAplicado === 0" class="text-caption text-medium-emphasis mt-2">
                    ℹ️ Con $0 se registra el descuento pero sin reducción de precio.
                  </div>
                </template>
              </v-card>
            </template>

            <!-- ── CASO A con override activado / CASO B: caja manual ── -->
            <template v-else>

              <!-- Aviso de override (solo cuando venía pre-marcado y la cajera eligió cambiar) -->
              <v-alert
                v-if="turnoMeta.descuentoId && overrideDateoDescuento"
                type="info"
                variant="tonal"
                density="compact"
                class="mt-2 mb-2"
                prepend-icon="mdi-information-outline"
              >
                <div class="d-flex align-center justify-space-between flex-wrap" style="gap:8px">
                  <span class="text-caption">
                    Estás reemplazando el descuento pre-marcado
                    <strong>({{ descuentoDelDateoNombre }})</strong>.
                    El nuevo descuento requiere autorización en caja.
                  </span>
                  <v-btn
                    size="x-small"
                    variant="text"
                    prepend-icon="mdi-undo"
                    @click="overrideDateoDescuento = false; descuentoIdEnCaja = null; descuentoMontoAplicado = 0; resetDocPolicia()"
                  >
                    Volver al pre-marcado
                  </v-btn>
                </div>
              </v-alert>

              <v-row dense class="mt-2">
                <v-col cols="12" md="6">
                  <v-select
                    v-model="descuentoIdEnCaja"
                    :items="descuentosActivos"
                    item-title="nombre"
                    item-value="id"
                    label="Aplicar descuento informativo (opcional)"
                    variant="outlined"
                    density="comfortable"
                    clearable
                    hide-details
                    prepend-inner-icon="mdi-tag-outline"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    v-model="autorizadoPorId"
                    :items="usuariosItems"
                    item-title="nombre"
                    item-value="id"
                    label="Autorizado por"
                    variant="outlined"
                    density="comfortable"
                    :disabled="!descuentoIdEnCaja"
                    hide-details
                    clearable
                    prepend-inner-icon="mdi-account-check"
                    placeholder="Usuario que autoriza el descuento"
                  />
                </v-col>
                <v-col cols="12" v-if="descuentoIdEnCaja">
                  <!-- Monto descuento - CASO B caja manual -->
                  <v-card variant="tonal" color="orange-darken-2" class="mt-2 pa-3 rounded-lg">
                    <div class="text-subtitle-2 font-weight-bold mb-1 d-flex align-center" style="gap:6px">
                      <v-icon size="16">mdi-currency-usd</v-icon>
                      Descuento aplicado
                      <v-chip size="x-small" color="blue" variant="flat" class="ms-1">
                        {{ esVehiculoMoto ? 'Moto' : 'Carro' }}
                      </v-chip>
                      <!-- chip Monto fijo cubre policía, empleado y avance propietario -->
                      <v-chip v-if="esDescuentoPolicia || esDescuentoEmpleado || esDescuentoAvancePropietario" size="x-small" color="blue-darken-3" variant="flat" class="ms-1">
                        Monto fijo
                      </v-chip>
                    </div>

                    <!-- INFORMATIVO_POLICIA / INFORMATIVO_EMPLEADO / AVANCE_PROPIETARIO: monto fijo, solo lectura -->
                <template v-if="esDescuentoPolicia || esDescuentoEmpleado || esDescuentoAvancePropietario">
                  <div class="text-caption text-medium-emphasis mb-1">
                    Monto fijo configurado para policía / militar:
                  </div>
                  <div class="text-h5 font-weight-bold text-orange-darken-2">
                    {{ formatCOP(descuentoMaximo) }}
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    {{ esVehiculoMoto ? 'Tarifa moto' : 'Tarifa carro' }} · No editable
                  </div>
                </template>

                    <!-- Otros descuentos: slider editable -->
                    <template v-else>
                      <div class="text-caption text-medium-emphasis mb-3">
                        Máximo: <strong>{{ formatCOP(descuentoMaximo) }}</strong> — puedes aplicar de $0 a {{ formatCOP(descuentoMaximo) }}
                      </div>
                      <v-row dense align="center">
                        <v-col cols="12" md="5">
                          <v-text-field
                            v-model.number="descuentoMontoAplicado"
                            label="Monto descuento ($)"
                            variant="outlined"
                            density="comfortable"
                            type="number"
                            prefix="$"
                            :min="0"
                            :max="descuentoMaximo"
                            hide-details
                            @blur="clampDescuentoMonto"
                          />
                        </v-col>
                        <v-col cols="12" md="7">
                          <v-slider
                            v-model="descuentoMontoAplicado"
                            :min="0"
                            :max="descuentoMaximo"
                            :step="1000"
                            color="orange-darken-2"
                            thumb-label
                            hide-details
                            class="mt-2"
                          >
                            <template #thumb-label="{ modelValue }">
                              ${{ Math.round(modelValue / 1000) }}k
                            </template>
                          </v-slider>
                        </v-col>
                      </v-row>
                      <div v-if="descuentoMontoAplicado === 0" class="text-caption text-medium-emphasis mt-2">
                        ℹ️ Con $0 se registra el descuento pero sin reducción de precio.
                      </div>
                    </template>
                  </v-card>

                  <v-alert type="warning" variant="tonal" density="compact" class="mt-1">
                    <strong>⚠️ Efecto en comisión:</strong>
                    La comisión bajará del valor nuevo directo al valor básico de dateo.
                    <div v-if="!autorizadoPorId" class="mt-1" style="color:#c62828">
                      Debes registrar quién autorizó el descuento antes de confirmar.
                    </div>
                  </v-alert>
                </v-col>

                <!-- 🆕 Observación opcional: solo cuando el dateo NO tenía
                     descuento pre-marcado (nada que comparar/override aquí,
                     es una aplicación nueva en caja) -->
                <v-col
                  cols="12"
                  v-if="descuentoIdEnCaja && turnoMeta.dateoId && !turnoMeta.descuentoId"
                >
                  <v-card variant="tonal" color="blue-grey" class="mt-2 pa-3 rounded-lg">
                    <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center" style="gap:6px">
                      <v-icon size="16">mdi-comment-text-outline</v-icon>
                      Observación (opcional)
                    </div>
                    <div class="text-caption text-medium-emphasis mb-2">
                      El asesor no dejó ningún descuento marcado en el dateo. Si quieres, deja una nota de por qué se aplica aquí.
                    </div>
                    <div class="d-flex flex-wrap mb-2" style="gap:8px">
                      <v-chip
                        v-for="razon in RAZONES_RAPIDAS_DESCUENTO"
                        :key="razon"
                        size="small"
                        variant="outlined"
                        color="blue-grey"
                        @click="descuentoObservacion = razon"
                      >
                        {{ razon }}
                      </v-chip>
                    </div>
                    <v-textarea
                      v-model="descuentoObservacion"
                      label="Observación"
                      variant="outlined"
                      density="comfortable"
                      rows="2"
                      auto-grow
                      hide-details
                      placeholder="Ej: el cliente lo pidió en el momento"
                    />
                  </v-card>
                </v-col>
              </v-row>
            </template>

            <!-- ===== DOCUMENTOS POLICIA (solo si descuento es INFORMATIVO_POLICIA) ===== -->
            <template v-if="esDescuentoPolicia">
              <v-divider class="my-3" />
              <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center" style="gap:6px">
                <v-icon size="18" color="blue-darken-3">mdi-shield-account</v-icon>
                Documentos requeridos — Policía / Militar
              </div>
              <div class="text-caption text-medium-emphasis mb-3">
                Sube los 3 documentos para habilitar el descuento. Se guardan directamente en el ticket.
              </div>

              <v-row dense>
                <v-col
                  v-for="tipo in (['carnet', 'tarjeta_propiedad', 'cedula'] as const)"
                  :key="tipo"
                  cols="12" md="4"
                >
                  <v-card
                    variant="outlined"
                    :color="docPoliciaEstado[tipo] === 'done' ? 'success'
                           : docPoliciaEstado[tipo] === 'error' ? 'error'
                           : docPoliciaEstado[tipo] === 'uploading' ? 'info'
                           : undefined"
                    class="pa-3 text-center rounded-lg"
                    style="cursor:pointer; min-height:120px"
                    @click="docPoliciaInputEls[tipo]?.click()"
                  >
                    <input
  :ref="(el) => setDocPoliciaRef(tipo, el)"
  type="file"
  accept="image/jpeg,image/png,.jfif"
  class="d-none"
  @change="onDocPoliciaFile(tipo, $event)"
/>

                    <!-- Preview si existe -->
                    <div v-if="docPoliciaPreview[tipo]" class="mb-1">
                      <v-img
                        :src="docPoliciaPreview[tipo]"
                        height="60"
                        contain
                        class="rounded"
                      />
                    </div>

                    <!-- Ícono de estado -->
                    <v-progress-circular
                      v-if="docPoliciaEstado[tipo] === 'uploading'"
                      indeterminate
                      size="24"
                      color="info"
                      class="mb-1"
                    />
                    <v-icon
                      v-else-if="docPoliciaEstado[tipo] === 'done'"
                      color="success"
                      size="28"
                      class="mb-1"
                    >mdi-check-circle</v-icon>
                    <v-icon
                      v-else-if="docPoliciaEstado[tipo] === 'error'"
                      color="error"
                      size="28"
                      class="mb-1"
                    >mdi-alert-circle</v-icon>
                    <v-icon v-else size="28" class="mb-1" color="grey">mdi-upload</v-icon>

                    <div class="text-caption font-weight-medium">
                      {{ DOC_POLICIA_LABELS[tipo] }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ docPoliciaEstado[tipo] === 'done' ? '✓ Cargado'
                       : docPoliciaEstado[tipo] === 'uploading' ? 'Subiendo...'
                       : docPoliciaEstado[tipo] === 'error' ? 'Reintentar'
                       : 'Toca para subir' }}
                    </div>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Impacto en comisión cuando viene aplicado en caja sin pre-marcado -->
              <v-alert
                v-if="impactoComisionPolicia"
                type="info"
                variant="tonal"
                density="compact"
                class="mt-3"
                prepend-icon="mdi-cash-check"
              >
                <div class="font-weight-bold mb-1">Efecto en comisiones con este descuento:</div>
                <div v-if="impactoComisionPolicia.comercial" class="text-caption">
                  <v-icon size="14" color="info">mdi-account-tie</v-icon>
                  <strong>{{ impactoComisionPolicia.comercial.nombre }}</strong>
                  → {{ impactoComisionPolicia.comercial.monto }}
                </div>
                <div v-if="impactoComisionPolicia.convenio" class="text-caption mt-1">
                  <v-icon size="14" color="info">mdi-handshake</v-icon>
                  <strong>{{ impactoComisionPolicia.convenio.nombre }}</strong>
                  → {{ impactoComisionPolicia.convenio.monto }}
                </div>
              </v-alert>

              <v-alert
                v-if="esDescuentoPolicia && !documentosPoliciaCompletos"
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-2"
              >
                Debes subir los 3 documentos para poder confirmar el descuento INFORMATIVO_POLICIA.
              </v-alert>
            </template>
            <!-- ===== FIN DOCUMENTOS POLICIA ===== -->

          </template>
          <!-- FIN SECCIÓN DESCUENTO INFORMATIVO -->

        </v-card-text>

        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogConfirm=false">Cancelar</v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="saving
              || (esDescuentoEnCajaActivo && !autorizadoPorId)
              || (esDescuentoPolicia && !documentosPoliciaCompletos)"
            @click="confirmarYGuardar"
          >
            Confirmar y guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL RESULTADO / DETALLE GUARDADO -->
    <v-dialog v-model="dialogResult" max-width="680">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="success">mdi-check-decagram</v-icon>
          Facturación registrada
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div class="mb-2">
            Se guardó la facturación correctamente.
          </div>
          <v-alert type="success" variant="tonal" class="mb-4" v-if="result?.folio || result?.id || result?.data?.id">
            <div class="d-flex flex-column">
              <span v-if="result?.folio"><b>Folio:</b> {{ result.folio }}</span>
              <span v-if="result?.id"><b>ID:</b> {{ result.id }}</span>
              <span v-if="result?.data?.id"><b>ID:</b> {{ result.data.id }}</span>
              <span v-if="result?.estado"><b>Estado:</b> {{ result.estado }}</span>
            </div>
          </v-alert>

          <!-- Trazabilidad descuento informativo -->
          <v-alert
            v-if="descuentoIdEfectivo"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
            prepend-icon="mdi-tag-check"
          >
            <div>
              <strong>Descuento informativo aplicado:</strong>
              {{ (turnoMeta.descuentoId && !overrideDateoDescuento)
                  ? descuentoDelDateoNombre
                  : (descuentosActivos.find(d => d.id === descuentoIdEnCaja)?.nombre ?? '—') }}
            </div>
            <div class="text-caption mt-1">
              <strong>Monto aplicado:</strong> {{ formatCOP(descuentoMontoAplicado) }}
            </div>
            <div class="text-caption mt-1">
              <template v-if="turnoMeta.descuentoId && !overrideDateoDescuento">
                <strong>Origen:</strong> Pre-marcado por el comercial en el dateo (automático).
              </template>
              <template v-else>
                <strong>Origen:</strong> Aplicado en caja.
                Autorizado por: <strong>{{ usuariosItems.find(u => u.id === autorizadoPorId)?.nombre ?? '—' }}</strong>.
              </template>
              La comisión fue ajustada al valor básico de dateo.
            </div>
          </v-alert>

          <div class="text-body-2" v-if="!esServicioSimplificado">
            <b>Placa:</b> {{ form.placa || '—' }} •
            <b>Fecha:</b> {{ form.fecha || '—' }} •
            <b>Hora:</b> {{ hora12 || '—' }}
          </div>
          <div class="mt-2" v-if="!esServicioSimplificado">
            <template v-if="descuentoIdEfectivo && descuentoMontoAplicado > 0">
              <div class="text-body-2">
                <b>Subtotal (sin descuento):</b>
                {{ formatCOP(form.totalFactura || form.total) }}
              </div>
              <div class="text-body-2 text-orange-darken-2">
                <b>Descuento aplicado:</b>
                - {{ formatCOP(descuentoMontoAplicado) }}
              </div>
              <div class="text-body-1 font-weight-bold">
                <b>Total con descuento:</b>
                {{ formatCOP(Math.max(0, (form.totalFactura || form.total || 0) - descuentoMontoAplicado)) }}
              </div>
            </template>
            <template v-else>
              <div class="text-body-2">
                <b>Total:</b> {{ totalFacturaDisplay || totalDisplay || '—' }}
              </div>
            </template>
          </div>
          <div class="text-body-2" v-else>
            <b>Servicio:</b> {{ turnoCard.servicioNombre }} •
            <b>Turno:</b> #{{ turnoCard.numero }} •
            <b>Placa:</b> {{ turnoCard.placa || '—' }}
          </div>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn color="primary" variant="flat" @click="closeResult">Cerrar</v-btn>
          <v-btn
            variant="tonal"
            prepend-icon="mdi-open-in-new"
            v-if="result?.id || result?.data?.id"
            @click="goToDetalle((result?.id || result?.data?.id) as number)"
          >
            Ver detalle
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>
<script setup lang="ts">
// ++ CAMBIO 1: agregar watch ++
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TurnosDelDiaService from '@/services/turnosdeldiaService'
import { FacturacionService } from '@/services/facturacion_service'
// ✅ FIX 1: descuentosService es default export → sin llaves, minúscula
import descuentosService from '@/services/descuentosService'
// ✅ FIX 2: obtenerUsuarios existe en UserService → no hace falta crear usuariosService
import { obtenerUsuarios } from '@/services/UserService'

/* ===================== Interfaces y tipos ===================== */
interface FacturacionResult {
  ok?: boolean
  folio?: string
  id?: number
  estado?: string
  data?: {
    id?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface CamposOCR {
  placa?: string
  nit?: string
  pin?: string
  marca?: string
  vendedor?: string
  prefijo?: string
  consecutivo?: string
  fechaHora?: string
  fecha?: string
  hora?: string
  subtotal?: number | string
  iva?: number | string
  totalFactura?: number | string
  total?: number | string
  [key: string]: unknown
}

interface OCRResponse {
  ok: boolean
  text?: string
  message?: string
  campos?: CamposOCR
}

interface TurnoResponse {
  data?: Record<string, unknown>
  [key: string]: unknown
}

// ++ CAMBIO 2: agregar valorCarro y valorMoto ++
interface DescuentoItem {
  id: number
  codigo: string
  nombre: string
  valorCarro: number
  valorMoto: number
}

interface UsuarioItem {
  id: number
  nombre: string
}

interface DescuentoRaw {
  id?: number
  codigo: string
  nombre: string
  valorCarro?: number
  valorMoto?: number
  valor_carro?: number
  valor_moto?: number
  descripcion?: string | null
  activo: boolean
}

/* ===================== Router / Query ===================== */
const route = useRoute()
const router = useRouter()

/* ===================== Estado UI ===================== */
const dragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const previewBlob = ref<File | null>(null)
const imageRotation = ref(0)
const imageScale = ref(1)
const dialogAyuda = ref(false)
const snack = reactive({ show: false, text: '' })

/* ====== Diálogos y guardado ====== */
const dialogConfirm = ref(false)
const dialogResult = ref(false)
const saving = ref(false)
const result = ref<FacturacionResult | null>(null)

/* ====== Ticket actual (id en backend) ====== */
const currentTicketId = ref<number | null>(null)

/* ===================== Descuento informativo ===================== */
const descuentosActivos = ref<DescuentoItem[]>([])
const usuariosItems = ref<UsuarioItem[]>([])
const descuentoIdEnCaja = ref<number | null>(null)
const autorizadoPorId = ref<number | null>(null)
const descuentoDelDateoNombre = ref<string>('')
// ++ override: permite a la cajera ignorar el descuento pre-marcado del dateo ++
const overrideDateoDescuento = ref(false)
// 🆕 Observación opcional cuando el dateo NO tenía descuento pre-marcado y
// la cajera aplica uno de todas formas — solo se muestra/envía en ese caso.
const descuentoObservacion = ref<string>('')
const RAZONES_RAPIDAS_DESCUENTO = [
  'Asesor no puso descuento',
  'Cliente pide en caja el descuento',
] as const

/* ===================== OCR (cliente y backend) ===================== */
type OCRStatus = 'idle' | 'running' | 'done'
const ocr = reactive({
  status: 'idle' as OCRStatus,
  progress: 0,
  text: '',
})
const pinAmbiguo = ref(false)

/* ===================== Formulario ===================== */
const form = reactive({
  placa: '',
  total: 0,
  fecha: '',   // YYYY-MM-DD
  hora: '',    // HH:mm:ss (24h, interno)
  vendedor: '',
  prefijo: '',
  consecutivo: '',
  nit: '',
  pin: '',
  marca: '',
  subtotal: 0,
  iva: 0,
  totalFactura: 0,
})
const totalDisplay = ref('')
const subtotalDisplay = ref('')
const ivaDisplay = ref('')
const totalFacturaDisplay = ref('')

/* ===== Hora en 12h para UI ===== */
const hora12 = ref('')
function to12h(hhmmss: string) {
  if (!hhmmss) return ''
  const [hh='00', mm='00', ss='00'] = hhmmss.split(':')
  let h = Number(hh)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12; if (h === 0) h = 12
  return `${String(h).padStart(2,'0')}:${mm.padStart(2,'0')}:${ss.padStart(2,'00')} ${ampm}`
}
function to24hFrom12(s: string) {
  if (!s) return ''
  const clean = s.trim().replace(/\./g, ':').toUpperCase()
  const m = clean.match(/^(\d{1,2}):?(\d{2})(?::?(\d{2}))?\s*(AM|PM)$/i)
  if (!m) return ''
  let h = Number(m[1]); const mm = m[2]; const ss = m[3] || '00'; const ap = (m[4] || 'AM').toUpperCase()
  if (ap === 'PM' && h < 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2,'0')}:${mm}:${ss}`
}
function onHora12Blur() {
  const h24 = to24hFrom12(hora12.value)
  if (h24) {
    form.hora = h24
    hora12.value = to12h(h24)
  } else {
    form.hora = ''
    hora12.value = ''
  }
}



/* ===================== Estado visual ===================== */
const requeridosOk = computed(() => {
  // Para servicios simplificados: solo requiere imagen
  if (esServicioSimplificado.value) {
    return !!previewUrl.value
  }
  // Para otros servicios: campos completos
  return !!form.placa && (form.total > 0 || form.totalFactura > 0) && !!form.fecha && !!form.hora
})

const estado = computed(() => {
  if (esServicioSimplificado.value) {
    return previewUrl.value ? 'Listo para confirmar' : 'Subir imagen'
  }
  if (ocr.status === 'running') return 'Procesando'
  if (ocr.status === 'done' && requeridosOk.value) return 'OCR listo'
  if (ocr.status === 'done') return 'OCR listo (completa los faltantes)'
  return 'Borrador'
})

const estadoColor = computed(() => {
  if (esServicioSimplificado.value) return previewUrl.value ? 'success' : 'grey'
  switch (estado.value) {
    case 'Procesando': return 'info'
    case 'OCR listo':
    case 'OCR listo (completa los faltantes)': return 'success'
    default: return 'grey'
  }
})

/* ===================== Controles de imagen ===================== */
function selectFile() { fileInput.value?.click() }
function zoomIn() { imageScale.value = Math.min(imageScale.value + 0.1, 3) }
function zoomOut() { imageScale.value = Math.max(imageScale.value - 0.1, 0.4) }
function rotateRight() { imageRotation.value = (imageRotation.value + 90) % 360 }
function fitWidth() { imageScale.value = 1 }

const imgStyle = computed(() => ({
  transform: `rotate(${imageRotation.value}deg) scale(${imageScale.value})`,
  transformOrigin: 'center center',
  maxWidth: '100%',
}))

/* ===================== Archivo ===================== */
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) handleFile(file)
  input.value = ''
}
function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}
function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        handleFile(file)
        e.preventDefault()
        break
      }
    }
  }
}

/* ===================== Formateo COP ===================== */
function onTotalFocus() { totalDisplay.value = form.total ? String(form.total) : '' }
function onTotalBlur() {
  const n = parseCOPToNumber(totalDisplay.value)
  form.total = n
  totalDisplay.value = n ? formatCOP(n) : ''
}
const subtotalFocus = () => { subtotalDisplay.value = form.subtotal ? String(form.subtotal) : '' }
const subtotalBlur = () => { form.subtotal = parseCOPToNumber(subtotalDisplay.value); subtotalDisplay.value = fmt(form.subtotal) }
const ivaFocus = () => { ivaDisplay.value = form.iva ? String(form.iva) : '' }
const ivaBlur = () => { form.iva = parseCOPToNumber(ivaDisplay.value); ivaDisplay.value = fmt(form.iva) }
const totalFacturaFocus = () => { totalFacturaDisplay.value = form.totalFactura ? String(form.totalFactura) : '' }
const totalFacturaBlur = () => { form.totalFactura = parseCOPToNumber(totalFacturaDisplay.value); totalFacturaDisplay.value = fmt(form.totalFactura) }

function formatCOP(n?: number | null) {
  return typeof n === 'number'
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
    : ''
}
const fmt = (n: number) => (n ? formatCOP(n) : '')
function parseCOPToNumber(s: string) {
  if (!s) return 0
  const clean = s.replace(/[^\d]/g, '')
  return Number(clean || 0)
}

/* ===================== Utilidades fecha ===================== */
function splitISO(iso: string) {
  const [fecha, horaRaw = ''] = iso.split('T')
  return { fecha, hora: normalizeHora(horaRaw) }
}

// 🔥 FUNCIÓN CORREGIDA: normalizeFecha
function normalizeFecha(s: string): string {
  if (!s) return ''

  // Si ya está en formato YYYY-MM-DD válido, retornar tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s
  }

  // Intentar parsear DD-MM-YYYY o DD/MM/YYYY
  const parts = s.replace(/-/g, '/').split('/')

  // Si tiene 3 partes, determinar el formato
  if (parts.length === 3) {
    const [first, second, third] = parts

    // Si el primer valor es > 31 o tiene 4 dígitos, es YYYY-MM-DD
    if (first.length === 4 || parseInt(first) > 31) {
      const yyyy = first.length === 2 ? `20${first}` : first
      const mm = second.padStart(2, '0')
      const dd = third.padStart(2, '0')

      // Validar rangos
      if (parseInt(mm) < 1 || parseInt(mm) > 12 || parseInt(dd) < 1 || parseInt(dd) > 31) {
        console.error(`Fecha inválida: ${yyyy}-${mm}-${dd}`)
        return ''
      }

      return `${yyyy}-${mm}-${dd}`
    } else {
      // Formato DD-MM-YYYY o DD/MM/YYYY
      const dd = first.padStart(2, '0')
      const mm = second.padStart(2, '0')
      const yyyy = third.length === 2 ? `20${third}` : third

      // Validar rangos
      if (parseInt(mm) < 1 || parseInt(mm) > 12 || parseInt(dd) < 1 || parseInt(dd) > 31) {
        console.error(`Fecha inválida: ${yyyy}-${mm}-${dd}`)
        return ''
      }

      return `${yyyy}-${mm}-${dd}`
    }
  }

  return ''
}

function normalizeHora(h: string): string {
  const t = h.replace(/\./g, ':').trim()
  const ampm = /(AM|PM)$/i.test(t)
  const [hh, mm = '00', ss = '00'] = t.replace(/\s?(AM|PM)$/i, '').split(':')
  let H = Number(hh)
  if (Number.isNaN(H)) return ''
  if (ampm) {
    const isPM = /PM$/i.test(t)
    if (isPM && H < 12) H += 12
    if (!isPM && H === 12) H = 0
  }
  return `${String(H).padStart(2, '00')}:${String(mm).padStart(2,'00')}:${String(ss).padStart(2,'00')}`
}

// 🔥 FUNCIÓN CORREGIDA: toLocalDateAndTime
function toLocalDateAndTime(fecha: string, hora: string) {
  const fechaNormalizada = normalizeFecha(fecha)
  const horaNormalizada = normalizeHora(hora)

  // Validar que la fecha normalizada sea válida
  if (fechaNormalizada && !/^\d{4}-\d{2}-\d{2}$/.test(fechaNormalizada)) {
    console.error('toLocalDateAndTime: fecha inválida después de normalizar:', fechaNormalizada)
    return { fecha: '', hora: horaNormalizada }
  }

  return { fecha: fechaNormalizada, hora: horaNormalizada }
}

/* ===================== Parser fallback local ===================== */
function pullNumber(s?: string | null) {
  if (!s) return 0
  return Number(String(s).replace(/[^\d]/g, '')) || 0
}

function parseTicket(txt: string) {
  const cleanLines = txt
    .replace(/\r/g, '')
    .replace(/[·•]/g, '.')
    .replace(/[""]/g, '"')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  const asOne = cleanLines.join(' ').replace(/\s{2,}/g, ' ')

  // PLACA
  let m = asOne.match(/PLACA[:\s]*([A-Z0-9]{5,7})/i)
  if (m) {
    form.placa = m[1].toUpperCase()
    syncPlacaWithTurno()
  }

  // NIT
  m = asOne.match(/\bNIT[:\s]*([0-9\.\- ]{7,})/i)
  if (m) form.nit = m[1].replace(/\s+/g, '').replace(/[^\d\-\.]/g, '')

  // PIN
  m = asOne.match(/\bPIN[:\s]*([A-Z0-9\- ]{4,})/i)
  if (m) form.pin = m[1].trim()

  // MARCA
  m = asOne.match(/\bMARCA[:\s]*([A-Z0-9 ]{2,})/i)
  if (m) form.marca = m[1].trim().replace(/\s{2,}/g, ' ')

  // VENDEDOR / VEN
  m = asOne.match(/\bVEN(?:DEDOR)?[:\s]*([A-ZÁÉÍÓÚÑ ]{2,})/i)
  if (m) form.vendedor = m[1].trim()

  // PREFIJO + CONSECUTIVO
  m = asOne.match(/\b(FV|FE)[\s\-:]*[A-Z]*\s*[-:]?\s*(\d{2,6})\b/i)
  if (m) {
    form.prefijo = m[1].toUpperCase()
    form.consecutivo = m[2]
  }

  // 🔥 FECHA y HORA CORREGIDO
  const mFechaHora = asOne.match(/FECHA[:\s]*([\d\/\-]{6,10}).{0,20}HORA[:\s]*([0-9:\. ]+[AP]?M?)/i)
  const mFecha = mFechaHora ? null : asOne.match(/FECHA[:\s]*([\d\/\-]{6,10})/i)
  const mHora  = mFechaHora ? null : asOne.match(/HORA[:\s]*([0-9:\. ]+[AP]?M?)/i)

  if (mFechaHora) {
    const { fecha, hora } = toLocalDateAndTime(mFechaHora[1], mFechaHora[2])
    if (fecha) {
      const fechaNormalizada = normalizeFecha(fecha)
      if (fechaNormalizada) form.fecha = fechaNormalizada
    }
    if (hora) {
      form.hora = hora
      hora12.value = to12h(hora)
    }
  } else {
    if (mFecha) {
      const fechaNormalizada = normalizeFecha(mFecha[1])
      if (fechaNormalizada) form.fecha = fechaNormalizada
    }
    if (mHora) {
      form.hora = normalizeHora(mHora[1])
      hora12.value = form.hora ? to12h(form.hora) : ''
    }
  }

  // SUBTOTAL / IVA / TOTAL
  const mSub = asOne.match(/\bSUB\s*TOTAL[:\s]*\$?\s*([\d\.,]+)/i) || asOne.match(/\bSUBTOTAL[:\s]*\$?\s*([\d\.,]+)/i)
  if (mSub) {
    form.subtotal = pullNumber(mSub[1])
    subtotalDisplay.value = fmt(form.subtotal)
  }
  const mIva = asOne.match(/\bIVA(?:\s*\(\d+%?\))?[:\s]*\$?\s*([\d\.,]+)/i)
  if (mIva) {
    form.iva = pullNumber(mIva[1])
    ivaDisplay.value = fmt(form.iva)
  }
  const mTotFac = asOne.match(/\bTOTAL\s*FACTURA[:\s]*\$?\s*([\d\.,]+)/i)
  const mTotGen = asOne.match(/\bTOTAL[:\s]*\$?\s*([\d\.,]+)/i)
  const totalVal = mTotFac ? pullNumber(mTotFac[1]) : (mTotGen ? pullNumber(mTotGen[1]) : 0)
  if (totalVal) {
    form.totalFactura = totalVal
    form.total = totalVal
    totalDisplay.value = fmt(totalVal)
    totalFacturaDisplay.value = fmt(totalVal)
  }
}

/* ===================== Helpers desde OCR backend ===================== */
function splitISOField(v?: string) {
  if (!v) return { fecha: '', hora: '' }
  const [f, hRaw] = v.split('T')
  return { fecha: f, hora: normalizeHora(hRaw || '') }
}
function fillFromCampos(c?: CamposOCR) {
  if (!c) return
  const setIf = (val: unknown, setter: (v: unknown) => void) => {
    if (val !== undefined && val !== null && val !== '') setter(val)
  }

  setIf(c.placa,        (v) => { form.placa = String(v).toUpperCase(); syncPlacaWithTurno() })
  setIf(c.nit,          (v) => form.nit = String(v))
  setIf(c.pin,          (v) => form.pin = String(v))
  setIf(c.marca,        (v) => form.marca = String(v))
  setIf(c.vendedor,     (v) => form.vendedor = String(v))
  setIf(c.prefijo,      (v) => form.prefijo = String(v))
  setIf(c.consecutivo,  (v) => form.consecutivo = String(v))

  if (c.fechaHora) {
    const { fecha, hora } = splitISOField(String(c.fechaHora))
    if (fecha) form.fecha = fecha
    if (hora) { form.hora = hora; hora12.value = to12h(hora) }
  } else {
    setIf(c.fecha, (v) => form.fecha = String(v))
    if (c.hora !== undefined) {
      const h24 = normalizeHora(String(c.hora)) || to24hFrom12(String(c.hora))
      form.hora = h24
      hora12.value = h24 ? to12h(h24) : ''
    }
  }

   pinAmbiguo.value = !!(c.pin && /[08]/.test(String(c.pin)))

  const sub = Number(c.subtotal || 0)
  const iva = Number(c.iva || 0)
  const tf  = Number(c.totalFactura || 0)
  const tt  = Number(c.total || 0)
  const tFinal = tf || tt
  if (sub) { form.subtotal = sub; subtotalDisplay.value = fmt(sub) }
  if (iva) { form.iva = iva; ivaDisplay.value = fmt(iva) }
  if (tFinal) {
    form.totalFactura = tFinal
    form.total = tFinal
    totalFacturaDisplay.value = fmt(tFinal)
    totalDisplay.value = fmt(tFinal)
  }
}
/* ===================== Turno asociado (tarjeta) ===================== */
type Canal =
  | 'ASESOR_COMERCIAL'
  | 'ASESOR'
  | 'TELEMERCADEO'
  | 'TELE'
  | 'REDES'
  | 'CONVENIO'
  | 'REFERIDO'
  | string

type Card = {
  numero?: number | null
  numeroGlobal?: number | null
  numeroServicio?: number | null
  placa?: string | null
  servicioCodigo?: string | null
  servicioNombre?: string | null
  tipoVehiculo?: string | null
  horaIngreso?: string | null
  fecha?: string | null
  estado?: string | null
  estadoColor?: string
  sede?: string | null
  funcionario?: string | null
  captacionCanal?: Canal | null
  agenteComercialNombre?: string | null
  asesorConvenioNombre?: string | null
  convenioNombre?: string | null
}
const turnoCard = reactive<Card>({})

/* === IDs crudos del turno para snapshots/asincronía === */
const turnoMeta = reactive<{
  servicioId: number | null
  sedeId: number | null
  dateoId: number | null
  agenteId: number | null
  descuentoId: number | null
  esAvance: boolean           // ++ AVANCE ++
  observacion: string | null

}>({
  servicioId: null,
  sedeId: null,
  dateoId: null,
  agenteId: null,
  descuentoId: null,
  esAvance: false,            // ++ AVANCE ++
  observacion: null,
})

const descuentoDelDateoDetalle = ref<DescuentoItem | null>(null)
const descuentoMontoAplicado = ref<number>(0)

/* ===================== DOCUMENTOS INFORMATIVO_POLICIA ===================== */
type DocPoliciaKey = 'carnet' | 'tarjeta_propiedad' | 'cedula'

const DOC_POLICIA_LABELS: Record<DocPoliciaKey, string> = {
  carnet:            'Carnet policial / militar',
  tarjeta_propiedad: 'Tarjeta de propiedad',
  cedula:            'Cédula del propietario',
}

const docPoliciaEstado = reactive<Record<DocPoliciaKey, 'idle' | 'uploading' | 'done' | 'error'>>({
  carnet:            'idle',
  tarjeta_propiedad: 'idle',
  cedula:            'idle',
})
const docPoliciaPreview = reactive<Record<DocPoliciaKey, string | null>>({
  carnet:            null,
  tarjeta_propiedad: null,
  cedula:            null,
})
const docPoliciaInputEls = reactive<Record<DocPoliciaKey, HTMLInputElement | null>>({
  carnet:            null,
  tarjeta_propiedad: null,
  cedula:            null,
})
function setDocPoliciaRef(tipo: DocPoliciaKey, el: unknown) {
  docPoliciaInputEls[tipo] = el as HTMLInputElement | null
}

/* ===================== Computeds descuento ===================== */

// ID efectivo: si override activo usa lo elegido en caja, si no usa el del dateo
const descuentoIdEfectivo = computed(() => {
  if (turnoMeta.descuentoId && !overrideDateoDescuento.value) return turnoMeta.descuentoId
  return descuentoIdEnCaja.value
})

const esDescuentoPolicia = computed(() => {
  if (!descuentoIdEfectivo.value) return false
  // Caso: dateo pre-marcado sin override
  if (turnoMeta.descuentoId && !overrideDateoDescuento.value && descuentoDelDateoDetalle.value) {
    return descuentoDelDateoDetalle.value.codigo === 'INFORMATIVO_POLICIA'
  }
  // Caso: caja manual o override
  const d = descuentosActivos.value.find(x => x.id === descuentoIdEfectivo.value)
  return d?.codigo === 'INFORMATIVO_POLICIA'
})

// Computed para INFORMATIVO_EMPLEADO (misma lógica que esDescuentoPolicia)
const esDescuentoEmpleado = computed(() => {
  if (!descuentoIdEfectivo.value) return false
  if (turnoMeta.descuentoId && !overrideDateoDescuento.value && descuentoDelDateoDetalle.value)
    return descuentoDelDateoDetalle.value.codigo === 'INFORMATIVO_EMPLEADO'
  const d = descuentosActivos.value.find(x => x.id === descuentoIdEfectivo.value)
  return d?.codigo === 'INFORMATIVO_EMPLEADO'
})

// Computed para AVANCE_PROPIETARIO
const esDescuentoAvancePropietario = computed(() => {
  if (!descuentoIdEfectivo.value) return false
  if (turnoMeta.descuentoId && !overrideDateoDescuento.value && descuentoDelDateoDetalle.value)
    return descuentoDelDateoDetalle.value.codigo === 'AVANCE_PROPIETARIO'
  const d = descuentosActivos.value.find(x => x.id === descuentoIdEfectivo.value)
  return d?.codigo === 'AVANCE_PROPIETARIO'
})

// ++ NUEVO: INFORMATIVO_OBSEQUIO — usa slider normal, NO monto fijo ++
const esDescuentoObsequio = computed(() => {
  if (!descuentoIdEfectivo.value) return false
  if (turnoMeta.descuentoId && !overrideDateoDescuento.value && descuentoDelDateoDetalle.value)
    return descuentoDelDateoDetalle.value.codigo === 'INFORMATIVO_OBSEQUIO'
  const d = descuentosActivos.value.find(x => x.id === descuentoIdEfectivo.value)
  return d?.codigo === 'INFORMATIVO_OBSEQUIO'
})

// Solo cuando INFORMATIVO_POLICIA se aplica en caja (sin pre-marcado de dateo, o con override)
const esInformativoPoliciaEnCaja = computed(() =>
  esDescuentoPolicia.value && (!turnoMeta.descuentoId || overrideDateoDescuento.value)
)

// true cuando el descuento activo fue elegido en caja y requiere autorizador
const esDescuentoEnCajaActivo = computed(() =>
  !!descuentoIdEnCaja.value && (!turnoMeta.descuentoId || overrideDateoDescuento.value)
)

// Resumen del impacto en comisión para mostrar en modal
const impactoComisionPolicia = computed(() => {
  if (!esInformativoPoliciaEnCaja.value || esDescuentoObsequio.value) return null
  const tieneConvenio = !!turnoCard.convenioNombre
  const tieneComercial = !!turnoCard.agenteComercialNombre
  if (tieneComercial && tieneConvenio) {
    // CASO 3: comercial datea con convenio
    return {
      comercial: { nombre: turnoCard.agenteComercialNombre!, monto: '$4.300 (baja de comisión estándar)' },
      convenio:  { nombre: turnoCard.convenioNombre!,       monto: '$0' },
    }
  }
  if (tieneConvenio && !tieneComercial) {
    // CASO 2: asesor convenio datea él mismo
    return {
      comercial: null,
      convenio:  { nombre: turnoCard.convenioNombre!, monto: '$0' },
    }
  }
  if (tieneComercial && !tieneConvenio) {
    // CASO 1: comercial sin convenio
    return {
      comercial: { nombre: turnoCard.agenteComercialNombre!, monto: '$4.300 (baja de comisión estándar)' },
      convenio:  null,
    }
  }
  return null
})

const documentosPoliciaCompletos = computed(() =>
  (Object.keys(docPoliciaEstado) as DocPoliciaKey[]).every(k => docPoliciaEstado[k] === 'done')
)

function resetDocPolicia() {
  const keys: DocPoliciaKey[] = ['carnet', 'tarjeta_propiedad', 'cedula']
  for (const k of keys) {
    docPoliciaEstado[k] = 'idle'
    if (docPoliciaPreview[k]) {
      URL.revokeObjectURL(docPoliciaPreview[k]!)
      docPoliciaPreview[k] = null
    }
  }
}

async function onDocPoliciaFile(tipo: DocPoliciaKey, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = ''

  const id = currentTicketId.value
  if (!id) {
    snack.text = '❌ Primero sube la imagen del ticket antes de cargar los documentos'
    snack.show = true
    return
  }

  // Preview inmediato
  if (docPoliciaPreview[tipo]) URL.revokeObjectURL(docPoliciaPreview[tipo]!)
  docPoliciaPreview[tipo] = URL.createObjectURL(file)
  docPoliciaEstado[tipo] = 'uploading'

  try {
    await FacturacionService.subirDocumentoPolicia(id, tipo, file)
    docPoliciaEstado[tipo] = 'done'
  } catch (err) {
    console.error(`Error subiendo documento ${tipo}:`, err)
    docPoliciaEstado[tipo] = 'error'
    snack.text = `❌ Error al subir ${DOC_POLICIA_LABELS[tipo]}`
    snack.show = true
  }
}
/* ===================== FIN DOCUMENTOS POLICIA ===================== */

const esVehiculoMoto = computed(() => {
  const tipo = (turnoCard.tipoVehiculo || '').toUpperCase()
  return tipo.includes('MOTO') || tipo.includes('MOTOCI')
})

/* ===================== DETECCIÓN SERVICIO SIMPLIFICADO ===================== */
const esServicioSimplificado = computed(() => {
  const codigo = (turnoCard.servicioCodigo || '').toUpperCase()
  const nombre = (turnoCard.servicioNombre || '').toUpperCase()

  // SOAT
  if (codigo.includes('SOAT') || nombre.includes('SOAT')) return true

  // PREVENTIVA
  if (codigo.includes('PREV') || nombre.includes('PREVENTIVA')) return true

  // PERITAJE
  if (codigo.includes('PERI') || nombre.includes('PERITAJE')) return true

  return false
})

const descuentoMaximo = computed((): number => {
  // Dateo pre-marcado sin override
  if (turnoMeta.descuentoId && !overrideDateoDescuento.value && descuentoDelDateoDetalle.value) {
    return esVehiculoMoto.value
      ? (descuentoDelDateoDetalle.value.valorMoto ?? 0)
      : (descuentoDelDateoDetalle.value.valorCarro ?? 0)
  }
  // Caja manual o override
  if (descuentoIdEnCaja.value) {
    const desc = descuentosActivos.value.find(d => d.id === descuentoIdEnCaja.value)
    if (desc) return esVehiculoMoto.value ? (desc.valorMoto ?? 0) : (desc.valorCarro ?? 0)
  }
  return 0
})

watch(descuentoIdEnCaja, () => {
  descuentoMontoAplicado.value = 0
  descuentoObservacion.value = ''
  resetDocPolicia()
})
watch(descuentoMaximo, (max) => {
  // monto fijo aplica para policía, empleado y avance propietario
  if (esDescuentoPolicia.value || esDescuentoEmpleado.value || esDescuentoAvancePropietario.value) {
    descuentoMontoAplicado.value = max
  } else if (descuentoMontoAplicado.value > max) {
    descuentoMontoAplicado.value = max
  }
})
// Watcher combinado: fija monto al máximo cuando se activa policía, empleado o avance propietario
watch([esDescuentoPolicia, esDescuentoEmpleado, esDescuentoAvancePropietario], ([esPolicia, esEmpleado, esAvance]) => {
  if (esPolicia || esEmpleado || esAvance) descuentoMontoAplicado.value = descuentoMaximo.value
})

function clampDescuentoMonto() {
  const max = descuentoMaximo.value
  if (descuentoMontoAplicado.value < 0) descuentoMontoAplicado.value = 0
  if (descuentoMontoAplicado.value > max) descuentoMontoAplicado.value = max
}

function mapClaseToTipo(clase?: { id?: number; codigo?: string; nombre?: string } | null): string | null {
  if (!clase) return null
  const code = String(clase.codigo || '').toUpperCase()
  const name = String(clase.nombre || '').toUpperCase()
  if (code.includes('MOTO') || name.includes('MOTO')) return 'Motocicleta'
  if (code.includes('LIV_TAXI') || name.includes('TAXI')) return 'Liviano Taxi'
  if (code.includes('LIV_PUBLICO') || name.includes('PÚBLIC') || name.includes('PUBLIC')) return 'Liviano Público'
  if (code.includes('LIV_PART') || name.includes('PARTIC') || name.includes('LIVIANO')) return 'Liviano Particular'
  return null
}
function humanCanal(c?: Canal | null) {
  const v = String(c || '').toUpperCase()
  if (!v) return ''
  const map: Record<string,string> = {
    'ASESOR_COMERCIAL': 'Asesor comercial',
    'ASESOR': 'Asesor comercial',
    'TELEMERCADEO': 'Call Center',
    'TELE': 'Call Center',
    'REDES': 'Redes',
    'CONVENIO': 'Convenio',
    'REFERIDO': 'Referido',
  }
  return map[v] || v.charAt(0) + v.slice(1).toLowerCase()
}
function canalChipColor(c?: Canal | null) {
  const v = String(c || '').toUpperCase()
  switch (v) {
    case 'ASESOR_COMERCIAL':
    case 'ASESOR': return 'purple'
    case 'TELEMERCADEO':
    case 'TELE': return 'indigo'
    case 'REDES': return 'cyan'
    case 'CONVENIO': return 'blue-grey'
    case 'REFERIDO': return 'green'
    default: return 'grey'
  }
}
function hydrateTurnoCard(turno: Record<string, unknown>) {
  turnoCard.numeroGlobal =
    (turno.turnoNumeroGlobal ?? turno.numeroGlobal ?? turno.global ?? turno.consecutivoGlobal ?? null) as number | null
  turnoCard.numeroServicio =
    (turno.turnoNumeroServicio ?? turno.numeroServicio ?? turno.consecutivoServicio ?? null) as number | null
  turnoCard.numero = (turno.turnoNumero ?? turno.numero ?? turno.id ?? null) as number | null

  const vehiculo = turno.vehiculo as Record<string, unknown> | undefined
  turnoCard.placa = (turno.placa ?? vehiculo?.placa ?? '').toString().toUpperCase() || null

  const servicio = turno.servicio as Record<string, unknown> | undefined
  const servCodigo = servicio?.codigoServicio ?? turno.servicioCodigo ?? servicio?.codigo ?? null
  const servNombre = servicio?.nombreServicio ?? turno.servicioNombre ?? servicio?.nombre ?? null
  turnoCard.servicioCodigo = servCodigo as string | null
  turnoCard.servicioNombre = servNombre as string | null

  const clase = vehiculo?.clase as { id?: number; codigo?: string; nombre?: string } | undefined
  turnoCard.tipoVehiculo = (turno.tipoVehiculo ?? mapClaseToTipo(clase ?? null) ?? null) as string | null

  const horaIng = turno.horaIngreso ?? turno.ingresoHora ?? null
  turnoCard.horaIngreso = horaIng ? to12h(normalizeHora(String(horaIng))) : null

  if (turno.fecha) {
    const f = String(turno.fecha)
    turnoCard.fecha = f.includes('T') ? splitISO(f).fecha : f
  } else if (turno.createdAt) {
    const f = String(turno.createdAt)
    turnoCard.fecha = f.includes('T') ? splitISO(f).fecha : f
  } else {
    turnoCard.fecha = null
  }

  const est = (turno.estado || '').toString().toLowerCase()
  turnoCard.estado = est ? est.charAt(0).toUpperCase() + est.slice(1) : null
  turnoCard.estadoColor =
    est === 'activo' ? 'success'
    : est === 'cancelado' ? 'error'
    : est === 'finalizado' ? 'blue-grey'
    : 'grey'

  const sede = turno.sede as Record<string, unknown> | undefined
  turnoCard.sede = (sede?.nombre ?? turno.sedeNombre ?? null) as string | null

  const usuario = turno.usuario as Record<string, unknown> | undefined
  const funcionario = turno.funcionario as Record<string, unknown> | undefined
  turnoCard.funcionario = (usuario?.nombres && usuario?.apellidos)
    ? `${usuario.nombres} ${usuario.apellidos}`
    : (funcionario?.nombres && funcionario?.apellidos)
      ? `${funcionario.nombres} ${funcionario.apellidos}`
      : (turno.funcionarioNombre ?? null) as string | null

  const dateo = (turno.captacionDateo ?? turno.captacion ?? turno.dateo ?? null) as Record<string, unknown> | null

  turnoCard.captacionCanal = (dateo?.canal ?? turno.canalAtribucion ?? null) as Canal | null

  const agenteCaptacion = turno.agenteCaptacion as Record<string, unknown> | undefined
  const agenteFromDateo = dateo?.agente as Record<string, unknown> | undefined
  const asesorComercial = turno.asesorComercial as Record<string, unknown> | undefined
  turnoCard.agenteComercialNombre =
    (agenteCaptacion?.nombre ?? agenteFromDateo?.nombre ?? asesorComercial?.nombre ?? null) as string | null

  const asesorConvenioFromDateo = dateo?.asesorConvenio as Record<string, unknown> | undefined
  const asesorConvenioFromTurno = turno.asesorConvenio as Record<string, unknown> | undefined
  const agenteConvenio = turno.agenteConvenio as Record<string, unknown> | undefined
  turnoCard.asesorConvenioNombre =
    (asesorConvenioFromDateo?.nombre ?? asesorConvenioFromTurno?.nombre ?? agenteConvenio?.nombre ?? null) as string | null

  const convenioFromDateo = dateo?.convenio as Record<string, unknown> | undefined
  const convenioFromTurno = turno.convenio as Record<string, unknown> | undefined
  turnoCard.convenioNombre =
    (convenioFromDateo?.nombre ?? convenioFromTurno?.nombre ?? turno.convenioNombre ?? null) as string | null

  if (form.placa && !esServicioSimplificado.value) syncPlacaWithTurno()

  turnoMeta.servicioId = (servicio?.id ?? turno.servicio_id ?? null) as number | null
  turnoMeta.sedeId     = (sede?.id     ?? turno.sede_id     ?? null) as number | null
  const _dateo = (turno.captacionDateo ?? turno.dateo ?? null) as Record<string, unknown> | null
  turnoMeta.dateoId    = (_dateo?.id ?? turno.dateo_id ?? null) as number | null
  turnoMeta.agenteId   = (agenteCaptacion?.id ?? turno.agente_id ?? null) as number | null
  turnoMeta.descuentoId = (_dateo?.descuentoId ?? _dateo?.descuento_id ?? null) as number | null
  turnoMeta.esAvance    = Boolean(_dateo?.esAvance ?? _dateo?.es_avance ?? false) // ++ AVANCE ++
  turnoMeta.observacion = (_dateo?.observacion ?? null) as string | null
}
/* ===================== Sincronización de PLACA (solo si NO es servicio simplificado) ===================== */
const RGX_CAR   = /^[A-Z]{3}\d{3}$/
const RGX_MOTO  = /^[A-Z]{3}\d{2}[A-Z]$/
const toLetter: Record<string,string> = { '0':'O','1':'I','2':'Z','3':'E','4':'A','5':'S','6':'G','7':'T','8':'B','9':'P' }
const toDigit:  Record<string,string> = { 'O':'0','I':'1','Z':'2','E':'3','A':'4','S':'5','G':'6','T':'7','B':'8','P':'9' }
function normalizePlate(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
}
function inferTipoByPattern(p: string): 'carro'|'moto'|'desconocido' {
  if (RGX_CAR.test(p)) return 'carro'
  if (RGX_MOTO.test(p)) return 'moto'
  return 'desconocido'
}
function correctByExpected(ocr: string, expected: 'carro'|'moto'|'desconocido'): string {
  let s = normalizePlate(ocr)

  if (expected === 'carro') {
    if (s.length >= 6) {
      const head = s.slice(0, 3).replace(/\d/g, ch => toLetter[ch] ?? ch)
      const tail = s.slice(3, 6).replace(/[A-Z]/g, ch => toDigit[ch] ?? ch)
      s = head + tail
    }
  } else if (expected === 'moto') {
    if (s.length >= 6) {
      const l1 = s.slice(0, 3).replace(/\d/g, ch => toLetter[ch] ?? ch)
      const d2 = s.slice(3, 5).replace(/[A-Z]/g, ch => toDigit[ch] ?? ch)
      const l3 = (toLetter[s[5]] ?? s[5] ?? '')
      s = l1 + d2 + l3
    }
  }

  return s
}

function hamming(a: string, b: string) {
  if (a.length !== b.length) return 99
  let k = 0
  for (let i=0;i<a.length;i++) if (a[i] !== b[i]) k++
  return k
}
function syncPlacaWithTurno() {
  if (!form.placa || esServicioSimplificado.value) return
  const turnPlate = (turnoCard.placa || '').toUpperCase()
  const fromOcr   = normalizePlate(form.placa)

  if (!turnPlate) {
    const tipoGuess = inferTipoByPattern(fromOcr)
    const corrected = correctByExpected(fromOcr, tipoGuess)
    if (corrected !== fromOcr) {
      form.placa = corrected
      snack.text = `Se ajustó la placa detectada a ${corrected} por formato.`
      snack.show = true
    }
    return
  }

  const expectedTipo = inferTipoByPattern(turnPlate)
  const corrected = correctByExpected(fromOcr, expectedTipo)

  if (corrected.length === turnPlate.length && hamming(corrected, turnPlate) <= 1) {
    if (form.placa !== turnPlate) {
      form.placa = turnPlate
      snack.text = `Placa ajustada automáticamente a la del turno: ${turnPlate}`
      snack.show = true
    }
    return
  }

  if (form.placa !== turnPlate) {
    form.placa = turnPlate
    snack.text = `Se priorizó la placa del turno (${turnPlate}).`
    snack.show = true
  }
}

/* ===================== ID del turno desde query ===================== */
function getTurnoIdFromQuery(): number | null {
  const q = route.query as Record<string, unknown>
  const keys = ['turnoId', 'turno', 'id', 'turnold']
  for (const k of keys) {
    const v = q[k]
    if (Array.isArray(v)) {
      const n = Number(v[0])
      if (!Number.isNaN(n)) return n
    } else if (v != null) {
      const n = Number(v)
      if (!Number.isNaN(n)) return n
    }
  }
  return null
}

/* ===================== Carga del turno asociado (hidratación tarjeta) ===================== */
async function fetchTurnoAndHydrate() {
  const turnoId = getTurnoIdFromQuery()
  if (!turnoId) {
    console.warn('No se encontró turnoId en la URL para Subir ticket')
    return
  }

  try {
    const resp = await TurnosDelDiaService.fetchTurnoById(turnoId) as unknown as TurnoResponse
    const turno = resp?.data ?? resp

    if (!turno) {
      console.warn('La respuesta de fetchTurnoById está vacía:', resp)
      return
    }

    hydrateTurnoCard(turno as Record<string, unknown>)

    // ++ CAMBIO 4: guardar detalle completo (nombre + valorCarro + valorMoto) ++
    if (turnoMeta.descuentoId) {
      try {
        const descResp = await descuentosService.getById(turnoMeta.descuentoId)
        const data = descResp?.data
        if (data && !Array.isArray(data)) {
          descuentoDelDateoNombre.value = data.nombre ?? `Descuento #${turnoMeta.descuentoId}`
          descuentoDelDateoDetalle.value = {
            id:         data.id!,
            codigo:     data.codigo,
            nombre:     data.nombre,
            valorCarro: Number(data.valorCarro ?? 0),
            valorMoto:  Number(data.valorMoto  ?? 0),
          }
        } else {
          descuentoDelDateoNombre.value = `Descuento #${turnoMeta.descuentoId}`
        }
      } catch {
        descuentoDelDateoNombre.value = `Descuento #${turnoMeta.descuentoId}`
      }
    }
  } catch (err) {
    console.error('Error cargando turno asociado:', err)
    snack.text = '❌ No se pudo cargar la información del turno'
    snack.show = true
  }
}

/* ===================== Catálogos para modal de descuento ===================== */
async function loadDescuentosYUsuarios() {
  try {
    const [descsResp, users] = await Promise.all([
      descuentosService.getActivos(),
      obtenerUsuarios(),
    ])

    const arr = Array.isArray(descsResp.data) ? descsResp.data : []
    // ++ CAMBIO 5: mapear también valorCarro y valorMoto ++
   descuentosActivos.value = (arr as DescuentoRaw[]).map(d => ({
      id: d.id!,
      codigo: d.codigo,
      nombre: d.nombre,
      valorCarro: Number(d.valorCarro ?? d.valor_carro ?? 0),
      valorMoto:  Number(d.valorMoto  ?? d.valor_moto  ?? 0),
    }))

    const CARGOS_AUTORIZADORES = new Set([
      'GERENCIA',
      'LIDER DE SEDE',
      'DIRECCION DE CALIDAD Y AUDITORÍA',
      'DIRECCION DE CALIDAD Y AUDITORIA',
      'DIRECCION ADMINISTRATIVA Y COMERCIAL',
      'LIDER DE INFORMES',
    ])

    usuariosItems.value = users
      .filter(u => {
        const cargo = (u.cargo?.nombre ?? '').toUpperCase().trim()
        const rol   = (u.rol?.nombre   ?? '').toUpperCase().trim()
        return CARGOS_AUTORIZADORES.has(cargo) || rol === 'GERENCIA'
      })
      .map(u => ({
        id: u.id,
        nombre: `${u.nombres} ${u.apellidos}`.trim(),
      }))
  } catch (err) {
    console.error('Error cargando descuentos/usuarios:', err)
  }
}

/* ===================== Utilidades de backend (evita duplicados) ===================== */
async function findExistingTicketByTurno(turnoId: number) {
  try {
    const resp = await FacturacionService.list({ turno_id: turnoId, page: 1, limit: 1 })
    return resp.data?.[0] || null
  } catch {
    return null
  }
}

async function ensureTicketForTurnoWithFile(file: File) {
  const turnoId = getTurnoIdFromQuery()
  if (!turnoId) return null

  const existing = await findExistingTicketByTurno(turnoId)
  if (existing) {
    currentTicketId.value = existing.id
    return existing
  }

  const created = await FacturacionService.createFromFile({
    file,
    turno_id: turnoId,
    dateo_id: turnoMeta.dateoId ?? undefined,
    sede_id: turnoMeta.sedeId ?? undefined,
    servicio_id: turnoMeta.servicioId ?? undefined,
    image_rotation: imageRotation.value || 0,
  })
  currentTicketId.value = created.id
  return created
}

/* ===================== OCR y manejo de archivo ===================== */
async function getRotatedBlob(file: File, deg: number): Promise<Blob> {
  if (!deg) return file
  const img = new Image()
  img.src = URL.createObjectURL(file)
  await new Promise((r) => (img.onload = () => r(null)))
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const w = img.width
  const h = img.height
  const rad = (deg % 360) * Math.PI / 180
  const swap = (deg % 180) !== 0
  canvas.width = swap ? h : w
  canvas.height = swap ? w : h
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rad)
  ctx.drawImage(img, -w / 2, -h / 2)
  return await new Promise((res) => canvas.toBlob((b) => res(b!), file.type || 'image/jpeg'))
}

async function handleFile(file: File) {
  // Normalizar JFIF → JPEG (WhatsApp guarda fotos como .jfif)
  let fileToProcess = file
  if (
    file.name.toLowerCase().endsWith('.jfif') ||
    file.type === 'image/jfif' ||
    file.type === ''
  ) {
    fileToProcess = new File(
      [file],
      file.name.replace(/\.jfif$/i, '.jpg'),
      { type: 'image/jpeg' }
    )
  }

  previewBlob.value = fileToProcess
  previewUrl.value = URL.createObjectURL(fileToProcess)
  imageRotation.value = 0
  imageScale.value = 1

  // Si es servicio simplificado: NO ejecutar OCR (ni cliente ni servidor)
  if (esServicioSimplificado.value) {
    snack.text = '📸 Imagen cargada - Servicio simplificado no requiere OCR'
    snack.show = true

    // Solo crear el ticket en backend (sin OCR)
    try {
      await ensureTicketForTurnoWithFile(fileToProcess)
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error'
      console.error('Error creando ticket simplificado:', err)
      snack.text = `❌ No se pudo crear el ticket: ${errorMsg}`
      snack.show = true
    }
    return
  }

  // Para otros servicios: ejecutar OCR normal
  await startLocalOCR(fileToProcess)

  try {
    const createdOrExisting = await ensureTicketForTurnoWithFile(fileToProcess)
    if (createdOrExisting?.id) {
      if (imageRotation.value) {
        await FacturacionService.update(createdOrExisting.id, { image_rotation: imageRotation.value })
      }
      await FacturacionService.reocr(createdOrExisting.id)
      snack.text = '✅ OCR del servidor ejecutado'
      snack.show = true
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error'
    console.error('Error creando/asegurando ticket:', err)
    snack.text = `❌ No se pudo crear el ticket: ${errorMsg}`
    snack.show = true
  }
}

async function startLocalOCR(file: File) {
  ocr.status = 'running'
  ocr.progress = 10
  ocr.text = ''
  try {
    const blob = await getRotatedBlob(file, imageRotation.value)
    const fd = new FormData()
    fd.append('archivo', blob, file.name || 'ticket.jpg')

    const resp = await fetch('/api/ocr/parse-ticket', { method: 'POST', body: fd })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const json = await resp.json() as OCRResponse
    if (!json?.ok || (!json.text && !json.campos)) throw new Error(json?.message || 'OCR vacío')

    ocr.status = 'done'
    ocr.progress = 100
    if (json.campos) fillFromCampos(json.campos)
    else if (json.text) parseTicket(json.text)
    if (form.placa && !esServicioSimplificado.value) syncPlacaWithTurno()
    snack.text = '✅ OCR completado'
    snack.show = true
  } catch (err) {
    console.error('❌ OCR local error:', err)
    ocr.status = 'idle'
    snack.text = '❌ Error al procesar OCR local'
    snack.show = true
  }
}

async function retryOCR() {
  if (!previewBlob.value || esServicioSimplificado.value) return
  if (currentTicketId.value) {
    try {
      await FacturacionService.update(currentTicketId.value, { image_rotation: imageRotation.value })
      await FacturacionService.reocr(currentTicketId.value)
      snack.text = '🔄 Reintento de OCR en servidor'
      snack.show = true
    } catch (e) {
      console.error('reocr server error', e)
    }
  }
  await startLocalOCR(previewBlob.value)
}

/* ===================== Reset ===================== */
function resetAll() {
  previewUrl.value = null
  previewBlob.value = null
  imageRotation.value = 0
  imageScale.value = 1
  ocr.status = 'idle'
  ocr.progress = 0
  ocr.text = ''
  currentTicketId.value = null

  form.placa = ''
  form.total = 0
  form.fecha = ''
  form.hora = ''
  form.vendedor = ''
  form.prefijo = ''
  form.consecutivo = ''
  form.nit = ''
  form.pin = ''
  form.marca = ''
  form.subtotal = 0
  form.iva = 0
  form.totalFactura = 0

  totalDisplay.value = ''
  subtotalDisplay.value = ''
  ivaDisplay.value = ''
  totalFacturaDisplay.value = ''
  hora12.value = ''

  descuentoIdEnCaja.value = null
  autorizadoPorId.value = null
  descuentoMontoAplicado.value = 0
  descuentoObservacion.value = ''
  pinAmbiguo.value = false
}

/* ===================== Confirmación y Guardado ===================== */
function openConfirm() {
  if (!requeridosOk.value) {
    if (esServicioSimplificado.value) {
      snack.text = 'Sube la imagen de la factura antes de confirmar.'
    } else {
      snack.text = 'Completa placa, total, fecha y hora antes de confirmar.'
    }
    snack.show = true
    return
  }
  dialogConfirm.value = true
  descuentoIdEnCaja.value = null
  autorizadoPorId.value = null
  descuentoMontoAplicado.value = 0
  descuentoObservacion.value = ''
  overrideDateoDescuento.value = false
  resetDocPolicia()
}

// 🔥 FUNCIÓN CORREGIDA: confirmarYGuardar
async function confirmarYGuardar() {
  if (saving.value) return
  saving.value = true
  try {
    if (!currentTicketId.value && previewBlob.value) {
      const ensured = await ensureTicketForTurnoWithFile(previewBlob.value)
      if (ensured?.id) currentTicketId.value = ensured.id
    }
    const id = currentTicketId.value
    if (!id) throw new Error('No hay ticket creado para este turno')

    // 🔥 OBTENER EL TICKET ACTUAL PARA GARANTIZAR QUE TENEMOS SEDE/AGENTE
    let ticketActual: Record<string, unknown> | null = null
    try {
      ticketActual = await FacturacionService.getById(id) as unknown as Record<string, unknown>
    } catch (err) {
      console.warn('No se pudo obtener ticket actual:', err)
    }

    // Si es servicio simplificado: payload mínimo (solo imagen + turno)
    if (esServicioSimplificado.value) {
      // 🔥 GARANTIZAR QUE SE ENVÍEN LOS IDs NECESARIOS
      const sedeIdFinal = turnoMeta.sedeId || (ticketActual?.sede_id as number) || (ticketActual?.sedeId as number) || undefined
      const agenteIdFinal = turnoMeta.agenteId || (ticketActual?.agente_id as number) || (ticketActual?.agenteId as number) || undefined
      const dateoIdFinal = turnoMeta.dateoId || (ticketActual?.dateo_id as number) || (ticketActual?.dateoId as number) || undefined
      const servicioIdFinal = turnoMeta.servicioId || (ticketActual?.servicio_id as number) || (ticketActual?.servicioId as number) || undefined

      await FacturacionService.update(id, {
        image_rotation: imageRotation.value || 0,
        turno_id: getTurnoIdFromQuery() ?? undefined,
        dateo_id: dateoIdFinal,
        sede_id: sedeIdFinal,
        agente_id: agenteIdFinal,
        servicio_id: servicioIdFinal,
      })
    } else {
      // 🔥 VALIDACIÓN DE FECHA ANTES DE CONSTRUIR ISO
      let fechaPagoISO: string | undefined = undefined

      if (form.fecha && form.hora) {
        // Validar formato de fecha (debe ser YYYY-MM-DD)
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!fechaRegex.test(form.fecha)) {
          throw new Error(`Formato de fecha inválido: ${form.fecha}. Debe ser YYYY-MM-DD`)
        }

        // Validar que la fecha sea válida (no mes 18, día 32, etc)
        const [year, month, day] = form.fecha.split('-').map(Number)
        const testDate = new Date(year, month - 1, day)

        if (
          testDate.getFullYear() !== year ||
          testDate.getMonth() !== month - 1 ||
          testDate.getDate() !== day
        ) {
          throw new Error(`Fecha inválida: año=${year}, mes=${month}, día=${day}`)
        }

        // Construir ISO solo si la fecha es válida
        fechaPagoISO = `${form.fecha}T${form.hora}-05:00`
      }

      // 🔥 GARANTIZAR QUE SEDE_ID O AGENTE_ID SE ENVÍEN
      const sedeIdFinal = turnoMeta.sedeId || (ticketActual?.sede_id as number) || (ticketActual?.sedeId as number) || undefined
      const agenteIdFinal = turnoMeta.agenteId || (ticketActual?.agente_id as number) || (ticketActual?.agenteId as number) || undefined
      const dateoIdFinal = turnoMeta.dateoId || (ticketActual?.dateo_id as number) || (ticketActual?.dateoId as number) || undefined
      const servicioIdFinal = turnoMeta.servicioId || (ticketActual?.servicio_id as number) || (ticketActual?.servicioId as number) || undefined

      const totalOriginal = form.totalFactura || form.total || 0
      const montoDesc = descuentoIdEfectivo.value ? (descuentoMontoAplicado.value || 0) : 0
      // El autorizador solo va si el descuento se originó en caja (no del dateo, o fue override)
      const esCajaOrigen = !turnoMeta.descuentoId || overrideDateoDescuento.value

      await FacturacionService.update(id, {
        placa: String(form.placa || '').toUpperCase(),
        fecha_pago: fechaPagoISO,
        total: totalOriginal,
        total_factura: totalOriginal || undefined,
        subtotal: form.subtotal || undefined,
        iva: form.iva || undefined,
        vendedor_text: form.vendedor || undefined,
        prefijo: form.prefijo || undefined,
        consecutivo: form.consecutivo || undefined,
        nit: form.nit || undefined,
        pin: form.pin || undefined,
        marca: form.marca || undefined,
        image_rotation: imageRotation.value || 0,
        turno_id: getTurnoIdFromQuery() ?? undefined,
        dateo_id: dateoIdFinal,
        sede_id: sedeIdFinal,
        agente_id: agenteIdFinal,
        servicio_id: servicioIdFinal,
        descuento_id: descuentoIdEfectivo.value ?? undefined,
        autorizado_por_id: esCajaOrigen ? (autorizadoPorId.value ?? undefined) : undefined,
        descuento_monto_aplicado: montoDesc > 0 ? montoDesc : undefined,
        // 🆕 Solo aplica cuando el dateo no tenía descuento pre-marcado (ver
        // condición del v-if del campo) — en cualquier otro caso queda vacío.
        descuento_observacion:
          descuentoIdEnCaja.value && turnoMeta.dateoId && !turnoMeta.descuentoId
            ? (descuentoObservacion.value.trim() || undefined)
            : undefined,
      })
    }

    const confirmed = await FacturacionService.confirmar(id) as unknown as FacturacionResult
    result.value = confirmed || { ok: true }

    dialogConfirm.value = false
    dialogResult.value = true

    snack.text = esServicioSimplificado.value
      ? '✅ Facturación simplificada guardada correctamente'
      : '✅ Facturación guardada y confirmada'
    snack.show = true
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('confirmarYGuardar error:', err)
    snack.text = `❌ No se pudo guardar: ${errorMsg}`
    snack.show = true
  } finally {
    saving.value = false
  }
}

/* ===================== Navegación post-resultado ===================== */
function closeResult() {
  dialogResult.value = false
  router.push('/rtm/turnos-dia')
}

function goToDetalle(id: number) {
  router.push({ path: `/facturacion/historico`, query: { ticketId: id } })
}

/* ===================== Listeners globales ===================== */
onMounted(async () => {
  window.addEventListener('paste', onPaste)
  await fetchTurnoAndHydrate()
  await loadDescuentosYUsuarios()

  const turnoId = getTurnoIdFromQuery()
  if (turnoId) {
    const existing = await findExistingTicketByTurno(turnoId)
    if (existing) currentTicketId.value = existing.id
  }

  if (form.placa && !esServicioSimplificado.value) syncPlacaWithTurno()
})
onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste)
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

.dropzone {
  border: 2px dashed rgba(0,0,0,.25);
  padding: 22px;
  cursor: pointer;
  background: #fffceb;
  transition: 0.3s;
  border-radius: 12px;
}

.dropzone--active {
  background: #fff4c0;
  border-color: #e3b505;
}

.preview-wrapper .preview-canvas {
  width: 100%;
  max-height: 60vh;
  overflow: auto;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 8px;
  text-align: center;
}

.preview-canvas img {
  max-width: 100%;
  transition: transform .2s ease;
}

.capt-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.text-medium-emphasis {
  color: rgba(0,0,0,.6);
}

.rounded-xl { border-radius: 16px; }
.rounded-2xl { border-radius: 20px; }

:deep(.v-dialog .v-card) {
  border-radius: 16px;
}
</style>
