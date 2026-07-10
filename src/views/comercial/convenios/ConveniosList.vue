<template>
  <v-container class="py-6">
    <v-card elevation="8" class="rounded-xl">

      <!-- ══════════════════════════════════
           HEADER + FILTROS
      ═══════════════════════════════════ -->
      <v-card-title class="py-4 px-4 px-sm-6">
        <div class="text-h5 font-weight-bold mb-4">🤝 Convenios</div>
      </v-card-title>

      <v-card-text class="px-4 px-sm-6 pt-0">
        <v-row dense>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="filters.texto"
              label="Buscar por nombre, doc, email…"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @keyup.enter="reload"
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-select
              v-model="filters.activo"
              :items="estadoItems"
              item-title="label"
              item-value="value"
              label="Activo"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-select
              v-model="filters.estado"
              :items="estadoDetalladoItems"
              label="Estado"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-select
              v-model="filters.ruta"
              :items="rutasItems"
              label="Ruta"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="3" md="1">
            <v-btn color="primary" :loading="loading" @click="reload" block>
              Aplicar
            </v-btn>
          </v-col>
          <v-col cols="6" sm="3" md="1">
            <v-btn variant="outlined" :disabled="loading" @click="resetFilters" block>
              Limpiar
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- ══════════════════════════════════
           TABLA
      ═══════════════════════════════════ -->
      <v-data-table-server
        class="px-4 pb-4"
        :headers="headers"
        :items="rows"
        :items-length="totalItems"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :loading="loading"
        :sort-by="sortBy"
        @update:options="loadItems"
        item-value="id"
        :items-per-page-options="[
          { value: 10, title: '10' },
          { value: 25, title: '25' },
          { value: 50, title: '50' },
          { value: 100, title: '100' },
        ]"
      >
        <!-- Estado activo/inactivo -->
        <template #item.activo="{ item }">
          <v-chip :color="item.activo ? 'success' : 'error'" size="small" variant="flat">
            {{ item.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>

        <!-- Estado detallado -->
        <template #item.estado="{ item }">
          <v-chip
            v-if="item.estado"
            :color="chipEstado(item.estado).color"
            size="small"
            variant="tonal"
          >
            {{ item.estado }}
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <!-- Contacto -->
        <template #item.contacto="{ item }">
          <div class="d-flex flex-column py-1">
            <span v-if="item.telefono" class="text-body-2">
              <v-icon size="13" class="mr-1">mdi-phone</v-icon>{{ item.telefono }}
            </span>
            <span v-if="item.whatsapp" class="text-body-2">
              <v-icon size="13" class="mr-1">mdi-whatsapp</v-icon>{{ item.whatsapp }}
            </span>
            <span v-if="item.email" class="text-caption text-medium-emphasis">{{ item.email }}</span>
            <span v-if="!item.telefono && !item.whatsapp && !item.email" class="text-medium-emphasis">—</span>
          </div>
        </template>

        <!-- Establecimiento -->
        <template #item.establecimiento="{ item }">
          <span v-if="item.establecimiento">{{ item.establecimiento }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <!-- Ruta + Sub-ruta -->
        <template #item.ruta="{ item }">
          <div class="d-flex flex-column gap-1 py-1">
            <v-chip v-if="item.ruta" color="primary" variant="tonal" size="x-small">
              {{ item.ruta }}
            </v-chip>
            <v-chip v-if="item.subRuta" color="secondary" variant="tonal" size="x-small">
              {{ item.subRuta }}
            </v-chip>
            <span v-if="!item.ruta && !item.subRuta" class="text-medium-emphasis">—</span>
          </div>
        </template>

        <!-- Periodicidad -->
        <template #item.periodicidad="{ item }">
          <v-chip
            v-if="item.periodicidad"
            :color="chipPeriodicidad(item.periodicidad).color"
            variant="tonal"
            size="x-small"
          >
            <v-icon start size="11">{{ chipPeriodicidad(item.periodicidad).icon }}</v-icon>
            {{ item.periodicidad }}
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <!-- Método de pago -->
        <template #item.metodoPago="{ item }">
          <div class="d-flex flex-column py-1">
            <span v-if="item.metodoPago">
              <strong>{{ item.metodoPago }}</strong>
            </span>
            <span
              v-if="item.metodoPago && item.metodoPago !== 'EFECTIVO' && item.numeroMetodoPago"
              class="text-caption text-medium-emphasis"
            >
              {{ item.numeroMetodoPago }}
            </span>
            <span v-if="!item.metodoPago" class="text-medium-emphasis">—</span>
          </div>
        </template>

        <!-- Asesor activo -->
        <template #item.asesor="{ item }">
          <span v-if="asesorActivoMap[item.id]?.asesor">
            {{ asesorActivoMap[item.id].asesor?.nombre }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <!-- Acciones -->
        <template #item.acciones="{ item }">
          <div class="d-flex gap-1 justify-end">
            <v-btn
              size="small"
              variant="text"
              icon="mdi-eye"
              @click="verDetalle(item.id)"
              title="Ver detalle"
            />
            <v-btn
              size="small"
              variant="text"
              icon="mdi-pencil"
              color="primary"
              @click="openEditar(item.id)"
              title="Editar convenio"
            />
            <v-btn
              size="small"
              variant="text"
              icon="mdi-account-plus"
              @click="openAsignar(item.id)"
              title="Asignar asesor"
            />
            <v-btn
              size="small"
              variant="text"
              icon="mdi-account-remove"
              color="error"
              @click="openRetirar(item.id)"
              title="Retirar asesor"
            />
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- ══════════════════════════════════
         MODAL: Ver detalle (solo lectura)
    ═══════════════════════════════════ -->
    <v-dialog v-model="dlgDetalle.visible" max-width="700">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between px-6 pt-5">
          <span class="text-h6">Detalle del convenio</span>
          <div class="d-flex gap-2" v-if="dlgDetalle.item">
            <v-chip
              v-if="dlgDetalle.item.estado"
              :color="chipEstado(dlgDetalle.item.estado).color"
              size="small"
              variant="flat"
            >
              {{ dlgDetalle.item.estado }}
            </v-chip>
            <v-chip
              :color="dlgDetalle.item.activo ? 'success' : 'error'"
              size="small"
              variant="flat"
            >
              {{ dlgDetalle.item.activo ? 'Activo' : 'Inactivo' }}
            </v-chip>
          </div>
        </v-card-title>
        <v-divider />

        <v-card-text class="px-6 py-4">
          <v-skeleton-loader v-if="dlgDetalle.loading" type="article" />

          <div v-else-if="dlgDetalle.item">
            <!-- Sección: Datos básicos -->
            <div class="text-overline text-medium-emphasis mb-2">Datos básicos</div>
            <v-row dense class="mb-3">
              <v-col cols="12" sm="8">
                <div class="text-caption text-medium-emphasis">Nombre</div>
                <div class="text-body-2 font-weight-medium">{{ dlgDetalle.item.nombre || '—' }}</div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-caption text-medium-emphasis">Tipo</div>
                <div class="text-body-2">{{ dlgDetalle.item.tipo || '—' }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="text-caption text-medium-emphasis">Establecimiento</div>
                <div class="text-body-2">{{ dlgDetalle.item.establecimiento || '—' }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="text-caption text-medium-emphasis">Documento</div>
                <div class="text-body-2">
                  <span v-if="dlgDetalle.item.docTipo || dlgDetalle.item.docNumero">
                    {{ dlgDetalle.item.docTipo }} {{ dlgDetalle.item.docNumero }}
                  </span>
                  <span v-else>—</span>
                </div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="text-caption text-medium-emphasis">Fecha de apertura</div>
                <div class="text-body-2">{{ dlgDetalle.item.fechaApertura || '—' }}</div>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="text-caption text-medium-emphasis">Dirección</div>
                <div class="text-body-2">{{ dlgDetalle.item.direccion || '—' }}</div>
              </v-col>
            </v-row>

            <v-divider class="mb-3" />

            <!-- Sección: Contacto -->
            <div class="text-overline text-medium-emphasis mb-2">Contacto</div>
            <v-row dense class="mb-3">
              <v-col cols="12" sm="4">
                <div class="text-caption text-medium-emphasis">Teléfono</div>
                <div class="text-body-2">{{ dlgDetalle.item.telefono || '—' }}</div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-caption text-medium-emphasis">WhatsApp</div>
                <div class="text-body-2">{{ dlgDetalle.item.whatsapp || '—' }}</div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-caption text-medium-emphasis">Email</div>
                <div class="text-body-2">{{ dlgDetalle.item.email || '—' }}</div>
              </v-col>
            </v-row>

            <v-divider class="mb-3" />

            <!-- Sección: Pago -->
            <div class="text-overline text-medium-emphasis mb-2">Método de pago</div>
            <v-row dense class="mb-3">
              <v-col cols="12" sm="6">
                <div class="text-caption text-medium-emphasis">Método</div>
                <div class="text-body-2">{{ dlgDetalle.item.metodoPago || '—' }}</div>
              </v-col>
              <v-col
                cols="12"
                sm="6"
                v-if="dlgDetalle.item.metodoPago && dlgDetalle.item.metodoPago !== 'EFECTIVO'"
              >
                <div class="text-caption text-medium-emphasis">Número / Cuenta</div>
                <div class="text-body-2">{{ dlgDetalle.item.numeroMetodoPago || '—' }}</div>
              </v-col>
            </v-row>

            <v-divider class="mb-3" />

            <!-- Sección: Ruta y gestión (NUEVOS) -->
            <div class="text-overline text-medium-emphasis mb-2">Ruta y gestión</div>
            <v-row dense>
              <v-col cols="6" sm="3">
                <div class="text-caption text-medium-emphasis">Ruta</div>
                <v-chip v-if="dlgDetalle.item.ruta" color="primary" variant="tonal" size="small">
                  {{ dlgDetalle.item.ruta }}
                </v-chip>
                <span v-else class="text-body-2 text-medium-emphasis">—</span>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-caption text-medium-emphasis">Sub-ruta</div>
                <v-chip v-if="dlgDetalle.item.subRuta" color="secondary" variant="tonal" size="small">
                  {{ dlgDetalle.item.subRuta }}
                </v-chip>
                <span v-else class="text-body-2 text-medium-emphasis">—</span>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-caption text-medium-emphasis">Periodicidad</div>
                <v-chip
                  v-if="dlgDetalle.item.periodicidad"
                  :color="chipPeriodicidad(dlgDetalle.item.periodicidad).color"
                  variant="tonal"
                  size="small"
                >
                  {{ dlgDetalle.item.periodicidad }}
                </v-chip>
                <span v-else class="text-body-2 text-medium-emphasis">—</span>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-caption text-medium-emphasis">Reporta</div>
                <div class="text-body-2">{{ dlgDetalle.item.reporta || '—' }}</div>
              </v-col>
            </v-row>
          </div>

          <div v-else class="text-medium-emphasis text-body-2">
            No se pudo cargar la información del convenio.
          </div>
        </v-card-text>

        <v-divider />
        <v-card-actions class="px-6 py-3">
          <v-spacer />
          <v-btn color="primary" @click="dlgDetalle.visible = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════════════════════════
         MODAL: Editar convenio
    ═══════════════════════════════════ -->
    <v-dialog v-model="dlgEditar.visible" max-width="860" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between px-6 pt-5">
          <span class="text-h6">Editar Convenio #{{ dlgEditar.item?.id }}</span>
          <v-chip :color="dlgEditar.form.activo ? 'success' : 'error'" size="small">
            {{ dlgEditar.form.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </v-card-title>
        <v-divider />

        <v-card-text style="max-height: 70vh">
          <v-skeleton-loader v-if="dlgEditar.loading" type="article, article" />

          <v-form v-else ref="formEditar">

            <!-- ── Sección: Datos básicos ── -->
            <div class="text-overline text-medium-emphasis mt-2 mb-1">Datos básicos</div>
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="dlgEditar.form.nombre"
                  label="Nombre *"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'El nombre es requerido']"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="dlgEditar.form.tipo"
                  :items="tiposConvenio"
                  label="Tipo"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dlgEditar.form.codigo"
                  label="Código"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dlgEditar.form.establecimiento"
                  label="Establecimiento"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-select
                  v-model="dlgEditar.form.docTipo"
                  :items="tiposDocumento"
                  label="Tipo Doc."
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="dlgEditar.form.docNumero"
                  label="Número Documento"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dlgEditar.form.fechaApertura"
                  label="Fecha de Apertura"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar"
                />
              </v-col>
              <v-col cols="12" md="6">
                <!-- Estado detallado -->
                <v-select
                  v-model="dlgEditar.form.estado"
                  :items="estadoDetalladoItems"
                  label="Estado"
                  variant="outlined"
                  density="comfortable"
                  clearable
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="dlgEditar.form.direccion"
                  label="Dirección"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <v-divider class="my-3" />

            <!-- ── Sección: Contacto ── -->
            <div class="text-overline text-medium-emphasis mb-1">Contacto</div>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="dlgEditar.form.telefono"
                  label="Teléfono"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="dlgEditar.form.whatsapp"
                  label="WhatsApp / Corporativo"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="dlgEditar.form.email"
                  label="Email"
                  type="email"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
            </v-row>

            <v-divider class="my-3" />

            <!-- ── Sección: Método de pago ── -->
            <div class="text-overline text-medium-emphasis mb-1">Método de pago</div>
            <v-row>
              <v-col cols="12" md="5">
                <v-select
                  v-model="dlgEditar.form.metodoPago"
                  :items="metodosPago"
                  label="Método de Pago"
                  variant="outlined"
                  density="comfortable"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="7">
                <v-text-field
                  v-model="dlgEditar.form.numeroMetodoPago"
                  label="Número / Cuenta"
                  variant="outlined"
                  density="comfortable"
                  :disabled="!dlgEditar.form.metodoPago || dlgEditar.form.metodoPago === 'EFECTIVO'"
                  :hint="
                    dlgEditar.form.metodoPago && dlgEditar.form.metodoPago !== 'EFECTIVO'
                      ? 'Requerido para este método'
                      : ''
                  "
                  persistent-hint
                />
              </v-col>
            </v-row>

            <v-divider class="my-3" />

            <!-- ── Sección: Ruta y gestión (NUEVOS) ── -->
            <div class="text-overline text-medium-emphasis mb-1">Ruta y gestión</div>
            <v-row>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="dlgEditar.form.ruta"
                  label="Ruta"
                  variant="outlined"
                  density="comfortable"
                  hint="Ej: 1, 2, CDA, INT"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="dlgEditar.form.subRuta"
                  label="Sub-ruta"
                  variant="outlined"
                  density="comfortable"
                  hint="Ej: 1.2, 1.15"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="dlgEditar.form.periodicidad"
                  :items="periodicidadItems"
                  label="Periodicidad"
                  variant="outlined"
                  density="comfortable"
                  clearable
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="dlgEditar.form.reporta"
                  label="Reporta"
                  variant="outlined"
                  density="comfortable"
                  hint="Iniciales o nombre del asesor"
                  persistent-hint
                />
              </v-col>
            </v-row>

            <v-divider class="my-3" />

            <!-- ── Notas + Activo ── -->
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="dlgEditar.form.notas"
                  label="Notas"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  auto-grow
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="dlgEditar.form.activo"
                  label="Convenio Activo"
                  color="success"
                  hide-details
                />
              </v-col>
            </v-row>

          </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions class="px-6 py-3">
          <v-spacer />
          <v-btn variant="text" @click="dlgEditar.visible = false" :disabled="dlgEditar.saving">
            Cancelar
          </v-btn>
          <v-btn color="primary" :loading="dlgEditar.saving" @click="guardarEdicion">
            Guardar Cambios
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════════════════════════
         MODAL: Documento duplicado
    ═══════════════════════════════════ -->
    <v-dialog v-model="dlgErrorDuplicado.visible" max-width="560" persistent>
      <v-card>
        <v-card-title class="d-flex align-center py-4 px-6 bg-error">
          <v-icon size="28" class="mr-2 text-white">mdi-alert-circle-outline</v-icon>
          <span class="text-h6 text-white font-weight-bold">Documento Duplicado</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <v-alert type="error" variant="tonal" prominent border="start" class="mb-4">
            <div class="text-subtitle-1 font-weight-bold mb-1">⚠️ No se puede guardar</div>
            <div>El documento ya está asociado a otro convenio.</div>
          </v-alert>

          <v-card variant="outlined" class="mb-4 pa-3">
            <div class="text-caption text-medium-emphasis mb-1">Documento intentado</div>
            <v-chip color="error" variant="flat" class="font-weight-bold">
              {{ dlgErrorDuplicado.cedula }}
            </v-chip>
          </v-card>

          <div class="text-body-2 text-medium-emphasis">
            Verifica el número, busca el convenio existente o corrígelo antes de continuar.
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-6 py-3">
          <v-btn variant="outlined" color="info" prepend-icon="mdi-magnify" @click="buscarConvenioDuplicado">
            Buscar convenio
          </v-btn>
          <v-spacer />
          <v-btn color="primary" variant="elevated" @click="dlgErrorDuplicado.visible = false">
            Entendido
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════════════════════════
         MODAL: Asignar asesor
    ═══════════════════════════════════ -->
    <v-dialog v-model="dlgAsignar.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6 px-6 pt-5">Asignar asesor</v-card-title>
        <v-divider />
        <v-card-text class="px-6 py-4">
          <v-autocomplete
            v-model="dlgAsignar.asesorId"
            :items="asesoresItems"
            item-title="nombre"
            item-value="id"
            label="Asesor"
            :loading="asesoresLoading"
            variant="outlined"
            hide-details
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-6 py-3">
          <v-spacer />
          <v-btn variant="text" @click="dlgAsignar.visible = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="dlgAsignar.loading" @click="confirmAsignar">Asignar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ══════════════════════════════════
         MODAL: Retirar asesor
    ═══════════════════════════════════ -->
    <v-dialog v-model="dlgRetirar.visible" max-width="520">
      <v-card>
        <v-card-title class="text-h6 px-6 pt-5">Retirar asesor</v-card-title>
        <v-divider />
        <v-card-text class="px-6 py-4">
          <v-text-field
            v-model="dlgRetirar.motivo"
            label="Motivo (opcional)"
            variant="outlined"
            hide-details
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-6 py-3">
          <v-spacer />
          <v-btn variant="text" @click="dlgRetirar.visible = false">Cancelar</v-btn>
          <v-btn color="error" :loading="dlgRetirar.loading" @click="confirmRetirar">Retirar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { VForm } from 'vuetify/components'
import {
  listConvenios,
  getConvenio,
  updateConvenio,
  getAsesorActivo,
  asignarAsesorConvenio,
  retirarAsesorConvenio,
  listAgentesCaptacion,
} from '@/services/conveniosService'

/* ─── Tipos locales ─── */
type ConvenioLite = {
  id: number
  nombre: string
  activo: boolean | 0 | 1
  tipo?: string | null
  codigo?: string | null
  establecimiento?: string | null
  docTipo?: string | null
  docNumero?: string | null
  telefono?: string | null
  whatsapp?: string | null
  email?: string | null
  direccion?: string | null
  notas?: string | null
  metodoPago?: string | null
  numeroMetodoPago?: string | null
  fechaApertura?: string | null
  // 🆕
  ruta?: string | null
  subRuta?: string | null
  periodicidad?: 'DIARIA' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | null
  reporta?: string | null
  estado?: 'ACTIVO' | 'INACTIVO' | 'PROSPECTO' | null
}

type AsesorActivoLite = {
  asesor?: { id: number; nombre: string; tipo?: string } | null
}

/* ─── Opciones de selects ─── */
const tiposConvenio = ['PERSONA', 'TALLER', 'PARQUEADERO', 'LAVADERO']
const tiposDocumento = ['CC', 'NIT', 'CE', 'PASAPORTE', 'RUT']
const metodosPago = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE']
const periodicidadItems = ['DIARIA', 'SEMANAL', 'QUINCENAL', 'MENSUAL']
const estadoDetalladoItems = ['ACTIVO', 'INACTIVO', 'PROSPECTO']
const estadoItems = [
  { label: 'Activos', value: 1 },
  { label: 'Inactivos', value: 0 },
]
// Rutas disponibles (ajustar según los valores reales del Excel)
const rutasItems = ['1', '2', '3', '4', 'CDA', 'INT', 'RICAURTE', 'SALADO']

/* ─── Helpers de chips ─── */
function chipEstado(estado: string) {
  const map: Record<string, { color: string }> = {
    ACTIVO: { color: 'success' },
    INACTIVO: { color: 'error' },
    PROSPECTO: { color: 'warning' },
  }
  return map[estado] ?? { color: 'default' }
}

function chipPeriodicidad(p: string) {
  const map: Record<string, { color: string; icon: string }> = {
    DIARIA: { color: 'error', icon: 'mdi-calendar-today' },
    SEMANAL: { color: 'warning', icon: 'mdi-calendar-week' },
    QUINCENAL: { color: 'info', icon: 'mdi-calendar-multiselect' },
    MENSUAL: { color: 'success', icon: 'mdi-calendar-month' },
  }
  return map[p] ?? { color: 'default', icon: 'mdi-calendar' }
}

/* ─── Filtros ─── */
const filters = ref<{
  texto: string
  activo: '' | 0 | 1 | boolean
  estado: string
  ruta: string
}>({
  texto: '',
  activo: '',
  estado: '',
  ruta: '',
})

/* ─── Tabla ─── */
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Activo', key: 'activo', sortable: true },
  { title: 'Estado', key: 'estado', sortable: false },
  { title: 'Contacto', key: 'contacto', sortable: false },
  { title: 'Establecimiento', key: 'establecimiento', sortable: true },
  { title: 'Ruta', key: 'ruta', sortable: false },
  { title: 'Periodicidad', key: 'periodicidad', sortable: false },
  { title: 'Método Pago', key: 'metodoPago', sortable: false },
  { title: 'Asesor activo', key: 'asesor', sortable: false },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' as const },
]

const rows = ref<ConvenioLite[]>([])
const totalItems = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<Array<{ key: string; order: 'asc' | 'desc' }>>([{ key: 'id', order: 'desc' }])
const loading = ref(false)

const asesorActivoMap = ref<Record<number, AsesorActivoLite>>({})

/* ─── Asesores catálogo ─── */
const asesoresItems = ref<{ id: number; nombre: string; tipo: string }[]>([])
const asesoresLoading = ref(false)

async function loadAsesores() {
  if (asesoresItems.value.length) return
  asesoresLoading.value = true
  try {
    asesoresItems.value = await listAgentesCaptacion('ASESOR_COMERCIAL')
  } finally {
    asesoresLoading.value = false
  }
}

/* ─── Carga de datos ─── */
async function loadItems() {
  loading.value = true
  try {
    const sort =
      Array.isArray(sortBy.value) && sortBy.value[0]
        ? sortBy.value[0]
        : { key: 'id', order: 'desc' as const }

    const perPageSeguro = itemsPerPage.value > 0 ? itemsPerPage.value : 10

    const res = await listConvenios({
      page: page.value,
      perPage: perPageSeguro,
      texto: filters.value.texto || undefined,
      activo: filters.value.activo === '' ? undefined : filters.value.activo,
      estado: filters.value.estado || undefined,
      ruta: filters.value.ruta || undefined,
      sortBy: sort.key,
      order: sort.order,
    })

    rows.value = res.data as ConvenioLite[]
    totalItems.value = Number(res.total || 0)

    // Asesor activo (lazy, en paralelo)
    asesorActivoMap.value = {}
    await Promise.allSettled(
      rows.value.map(async (c) => {
        try {
          const info = await getAsesorActivo(c.id)
          asesorActivoMap.value[c.id] = info as AsesorActivoLite
        } catch {
          // ignora fallos individuales
        }
      })
    )
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  loadItems()
}

function resetFilters() {
  filters.value = { texto: '', activo: '', estado: '', ruta: '' }
  reload()
}

/* ─── Dialog: Ver detalle ─── */
const dlgDetalle = ref<{ visible: boolean; loading: boolean; item: ConvenioLite | null }>({
  visible: false,
  loading: false,
  item: null,
})

async function verDetalle(id: number) {
  dlgDetalle.value = { visible: true, loading: true, item: null }
  try {
    dlgDetalle.value.item = (await getConvenio(id)) as ConvenioLite
  } finally {
    dlgDetalle.value.loading = false
  }
}

/* ─── Dialog: Editar ─── */
const formEditar = ref<VForm | null>(null)

type FormEditar = {
  nombre: string
  tipo: 'PERSONA' | 'TALLER' | 'PARQUEADERO' | 'LAVADERO'
  codigo: string
  establecimiento: string
  docTipo: string
  docNumero: string
  telefono: string
  whatsapp: string
  email: string
  direccion: string
  notas: string
  metodoPago: string
  numeroMetodoPago: string
  fechaApertura: string
  activo: boolean
  // 🆕
  ruta: string
  subRuta: string
  periodicidad: string
  reporta: string
  estado: string
}

const dlgEditar = ref<{
  visible: boolean
  loading: boolean
  saving: boolean
  item: ConvenioLite | null
  form: FormEditar
}>({
  visible: false,
  loading: false,
  saving: false,
  item: null,
  form: {
    nombre: '',
    tipo: 'PERSONA',
    codigo: '',
    establecimiento: '',
    docTipo: '',
    docNumero: '',
    telefono: '',
    whatsapp: '',
    email: '',
    direccion: '',
    notas: '',
    metodoPago: '',
    numeroMetodoPago: '',
    fechaApertura: '',
    activo: true,
    ruta: '',
    subRuta: '',
    periodicidad: '',
    reporta: '',
    estado: '',
  },
})

async function openEditar(id: number) {
  dlgEditar.value.visible = true
  dlgEditar.value.loading = true
  dlgEditar.value.item = null
  try {
    const conv = (await getConvenio(id)) as ConvenioLite
    dlgEditar.value.item = conv
    dlgEditar.value.form = {
      nombre: conv.nombre || '',
      tipo: (conv.tipo as FormEditar['tipo']) || 'PERSONA',
      codigo: conv.codigo || '',
      establecimiento: conv.establecimiento || '',
      docTipo: conv.docTipo || '',
      docNumero: conv.docNumero || '',
      telefono: conv.telefono || '',
      whatsapp: conv.whatsapp || '',
      email: conv.email || '',
      direccion: conv.direccion || '',
      notas: conv.notas || '',
      metodoPago: conv.metodoPago || '',
      numeroMetodoPago: conv.numeroMetodoPago || '',
      fechaApertura: conv.fechaApertura ? conv.fechaApertura.split('T')[0].split(' ')[0] : '',
      activo: !!conv.activo,
      // 🆕
      ruta: conv.ruta || '',
      subRuta: conv.subRuta || '',
      periodicidad: conv.periodicidad || '',
      reporta: conv.reporta || '',
      estado: conv.estado || '',
    }
  } finally {
    dlgEditar.value.loading = false
  }
}

async function guardarEdicion() {
  if (!dlgEditar.value.item) return

  const valid = await formEditar.value?.validate()
  if (!valid?.valid) return

  if (
    dlgEditar.value.form.metodoPago &&
    dlgEditar.value.form.metodoPago !== 'EFECTIVO' &&
    !dlgEditar.value.form.numeroMetodoPago
  ) {
    alert('Se requiere número de método de pago para métodos distintos a EFECTIVO')
    return
  }

  dlgEditar.value.saving = true
  try {
    await updateConvenio(dlgEditar.value.item.id, {
      nombre: dlgEditar.value.form.nombre,
      tipo: dlgEditar.value.form.tipo,
      codigo: dlgEditar.value.form.codigo || null,
      establecimiento: dlgEditar.value.form.establecimiento || null,
      doc_tipo: dlgEditar.value.form.docTipo || null,
      doc_numero: dlgEditar.value.form.docNumero || null,
      telefono: dlgEditar.value.form.telefono || null,
      whatsapp: dlgEditar.value.form.whatsapp || null,
      email: dlgEditar.value.form.email || null,
      direccion: dlgEditar.value.form.direccion || null,
      notas: dlgEditar.value.form.notas || null,
      metodo_pago: (dlgEditar.value.form.metodoPago as any) || null,
      numero_metodo_pago: dlgEditar.value.form.numeroMetodoPago || null,
      fecha_apertura: dlgEditar.value.form.fechaApertura || null,
      activo: dlgEditar.value.form.activo,
      // 🆕
      ruta: dlgEditar.value.form.ruta || null,
      sub_ruta: dlgEditar.value.form.subRuta || null,
      periodicidad: (dlgEditar.value.form.periodicidad as any) || null,
      reporta: dlgEditar.value.form.reporta || null,
      estado: (dlgEditar.value.form.estado as any) || null,
    })

    dlgEditar.value.visible = false
    await loadItems()
  } catch (error: any) {
    const msg = error?.response?.data?.message || error?.message || ''
    const isDuplicado =
      error?.response?.status === 409 ||
      msg.includes('Duplicate entry') ||
      msg.toLowerCase().includes('duplicado') ||
      msg.toLowerCase().includes('ya está en uso') ||
      msg.includes('convenios_doc_tipo_doc_numero_unique')

    if (isDuplicado) {
      dlgErrorDuplicado.value = {
        visible: true,
        cedula: `${dlgEditar.value.form.docTipo || ''} ${dlgEditar.value.form.docNumero || 'N/A'}`.trim(),
      }
    } else {
      alert(`Error al guardar: ${msg}`)
    }
  } finally {
    dlgEditar.value.saving = false
  }
}

/* ─── Dialog: Duplicado ─── */
const dlgErrorDuplicado = ref<{ visible: boolean; cedula: string }>({
  visible: false,
  cedula: '',
})

function buscarConvenioDuplicado() {
  dlgEditar.value.visible = false
  dlgErrorDuplicado.value.visible = false
  filters.value.texto = dlgErrorDuplicado.value.cedula.replace(/[^0-9]/g, '')
  reload()
}

/* ─── Dialog: Asignar ─── */
const dlgAsignar = ref<{
  visible: boolean
  convenioId: number | null
  asesorId: number | null
  loading: boolean
}>({ visible: false, convenioId: null, asesorId: null, loading: false })

function openAsignar(convenioId: number) {
  dlgAsignar.value = { visible: true, convenioId, asesorId: null, loading: false }
  loadAsesores()
}

async function confirmAsignar() {
  if (!dlgAsignar.value.convenioId || !dlgAsignar.value.asesorId) return
  dlgAsignar.value.loading = true
  try {
    await asignarAsesorConvenio(dlgAsignar.value.convenioId, {
      asesor_id: dlgAsignar.value.asesorId,
    })
    const info = await getAsesorActivo(dlgAsignar.value.convenioId)
    asesorActivoMap.value[dlgAsignar.value.convenioId] = info as AsesorActivoLite
    dlgAsignar.value.visible = false
  } finally {
    dlgAsignar.value.loading = false
  }
}

/* ─── Dialog: Retirar ─── */
const dlgRetirar = ref<{
  visible: boolean
  convenioId: number | null
  motivo: string
  loading: boolean
}>({ visible: false, convenioId: null, motivo: '', loading: false })

function openRetirar(convenioId: number) {
  dlgRetirar.value = { visible: true, convenioId, motivo: '', loading: false }
}

async function confirmRetirar() {
  if (!dlgRetirar.value.convenioId) return
  dlgRetirar.value.loading = true
  try {
    await retirarAsesorConvenio(dlgRetirar.value.convenioId, {
      motivo: dlgRetirar.value.motivo || undefined,
    })
    const info = await getAsesorActivo(dlgRetirar.value.convenioId)
    asesorActivoMap.value[dlgRetirar.value.convenioId] = info as AsesorActivoLite
    dlgRetirar.value.visible = false
  } finally {
    dlgRetirar.value.loading = false
  }
}

/* ─── Init ─── */
loadAsesores()
loadItems()
</script>

<style scoped>
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
