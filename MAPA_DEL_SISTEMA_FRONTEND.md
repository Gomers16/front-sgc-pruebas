# Mapa del Sistema — Frontend (front-sgc-pruebas)

Vue 3 + Vuetify 3 + TypeScript + Pinia + vue-router. Backend Adonis (Node), API en `/api/*`, auth Bearer token.

Este documento es una referencia completa del frontend, organizada por **módulo de negocio**, para que futuras conversaciones no tengan que re-explorar el código. Generado leyendo `src/views/`, `src/services/`, `src/components/`, `src/router/index.ts` y `src/components/layout/AppSidebar.vue` completos.

> Actualizado: 2026-08-11 (dateo persistente por servicio con alerta de desajuste, auto-búsqueda de placa a 6 caracteres, RTM por defecto, filtros de estado en Turnos del Día, cancelación con motivo obligatorio, fix de comprobante de avance y campos sensibles editables en Dateos).
> Actualizado: 2026-08-12 (documentos de descuento informativo visibles en la ficha del dateo, fix del modal "Estadísticas" de Turnos del Día para que respete el filtro de servicio/placa activo, ventana del chip de vigencia RTM/SOAT ajustada a 16 días y filtrada por servicio+estado).
> Actualizado: 2026-08-19 (sistema de re-dateo con evidencia y trazabilidad: pestaña NEW-DATEOS en la ficha del asesor, chip+modal de re-datear en 3 lugares, historial de re-dateos en el detalle del dateo, configuración del límite global/por-asesor en Dateos, permiso `configurarRedateos()`, fix de countdown de exclusividad usando `redateado_at`).
> Actualizado: 2026-08-23 (modal Liquidación RTM v2 en `ComisionesList.vue`: drill-down de placas por sección con lazy-load, buscador de placa/nombre, filtro por estado de comisión, selección transversal a las 5 secciones y exportación a Excel enriquecida vía `reportesAdminService.ts` — 5 funciones nuevas; fix de `tipo_periodo` que dejaba pasar `'PERSONALIZADO'` sin normalizar hacia el backend en `pagarMasivo`).
> Actualizado: 2026-08-24 (documentación de `descuento_observacion` en Facturación, sección 3 — campo ya existía en el código desde antes, este es un gap de documentación preexistente que se cierra ahora aprovechando la sincronización pruebas→producción local, no una feature nueva de esta fecha).
> Actualizado: 2026-08-25 (`DateoCreate.vue`, sección 4.2: nuevo modal de excepción para el 409 `DATEO_ACTIVO_EXCEPCION_DISPONIBLE` — SUPER_ADMIN/GERENCIA pueden confirmar la creación de un dateo aunque exista uno activo/consumido dentro de su ventana de bloqueo. Mismo patrón que el modal ya existente de `RTM_VIGENTE_EXCEPCION_DISPONIBLE` — **gap de documentación detectado de paso:** ese modal RTM_VIGENTE nunca había tenido su propia entrada en este mapa, no se documenta retroactivamente aquí, solo se señala. Complementa el fix de backend de la misma sesión — cadencia de bloqueo por servicio (60 días PREV/PERI), ver módulo Captación Comercial del mapa de backend. Caso real: placa WTP333).
> Actualizado: 2026-08-27 (nueva sección 9, **Tickets Internos**: bandeja `/tickets`, creación/detalle del tipo `EXCEPCION_DATEO` — ventana de 40 minutos para vincular un dateo a un turno ya en sede, con evidencia fotográfica y aprobación/rechazo con % de penalización — y su integración con `DateoCreate.vue` sección 4.2 [modal `VENTANA_DATEO_VENCIDA`] y la nueva pestaña "Penalizaciones" de `FichaComercialAsesor.vue`. Sección "Patrones establecidos" renumerada de 9 a 10, subsecciones 9.x → 10.x, para dejarle el número 9 al módulo nuevo).
> **CORRECCIÓN 2026-08-27 (misma sesión de backend, ver `MAPA_DEL_SISTEMA_BACKEND.md`):** la entrada de arriba ya quedó desactualizada por un cambio de backend posterior el mismo día — se corrige en sitio en la sección 9 en vez de agregar otra nota que conviva con la vieja. El modal `VENTANA_DATEO_VENCIDA` de `DateoCreate.vue` **ya no existe**: fue reemplazado por `REQUIERE_TICKET_DATEO`, que dispara siempre (sin ventana fija que deje pasar el dateo normal) y solo cambia de tono según `dentroVentana`, con un único botón que siempre lleva a crear el ticket. La "ventana de 40 minutos" ahora es configurable (global + override por asesor) desde una sección nueva en `TicketsList.vue`, gateada por el permiso `configurarVentanaTicket()` — ver sección 9 para el detalle completo y verificado contra el código real.
> **CORRECCIÓN 2026-08-28 (sistema de saldo/% de penalización eliminado por completo, ver `MAPA_DEL_SISTEMA_BACKEND.md`):** de nuevo la sección 9 quedó desactualizada por un cambio de backend — corregida en sitio otra vez, mismo criterio que la corrección de arriba. `TicketExcepcionDateoDetail.vue` ya no tiene campo "% de penalización": fuera de ventana ahora son 3 botones (**Aprobar con comisión** / **Aprobar sin comisión** / **Rechazar**), dentro de ventana sigue siendo un único botón sin elegir nada. La pestaña "Penalizaciones" de `FichaComercialAsesor.vue` (saldo, movimientos, modal "Cobrar saldo") **fue eliminada por completo** — el KPI "Saldo" que sigue en la cabecera de la ficha es otra cosa, no se tocó. `ticketsService.ts` perdió `getSaldoPenalizaciones`/`cobrarSaldoPenalizaciones` y ganó `con_comision` en `aprobarTicketExcepcionDateo()`. Ver sección 9 para el detalle completo, verificado contra el código real.
> Actualizado: 2026-09-08 (`FacturacionSubirTicket.vue`, sección 3 — Facturación: el Set `CARGOS_AUTORIZADORES` agrega `'LIDER NACIONAL'` junto a `GERENCIA`/`LIDER DE SEDE`/`DIRECCION DE CALIDAD Y AUDITORÍA`(/`AUDITORIA`)/`DIRECCION ADMINISTRATIVA Y COMERCIAL`/`LIDER DE INFORMES` — este cargo ahora puede aparecer como opción de "Autorizado por" al aplicar/cambiar manualmente un descuento en caja. Cambio de frontend puro (una línea), sin lógica nueva — el filtro sigue siendo `CARGOS_AUTORIZADORES.has(cargo) || rol === 'GERENCIA'`. Complementa el cargo nuevo del catálogo `cargos` del backend — ver `MAPA_DEL_SISTEMA_BACKEND.md`. Sincronizado a producción local — ver commits `a39762d` (pruebas) / `9bb38e8` (producción local)).

## Índice

1. [RTM / Turnos](#1-rtm--turnos)
2. [Trámites](#2-trámites)
3. [Facturación](#3-facturación)
4. [Comercial](#4-comercial) (Asesores, Dateos, Convenios, Prospectos, Clientes, Comisiones, Comprobantes, Descuentos)
5. [Gestión Documental](#5-gestión-documental) (Usuarios, Contratos, Razón Social)
6. [Reportes Administrativos](#6-reportes-administrativos)
7. [Dashboard](#7-dashboard)
8. [Autenticación / Login](#8-autenticación--login)
9. [Tickets Internos](#9-tickets-internos)
10. [Archivos sin usar / fuera del router](#archivos-sin-usar--fuera-del-router)
11. [Patrones establecidos del proyecto](#10-patrones-establecidos-del-proyecto)

Roles del sistema (ver `src/stores/AuthStore.ts` y `src/composables/usePermissions.ts`): `SUPER_ADMIN`, `GERENCIA`, `OPERATIVO_TURNOS`, `TRAMITADOR`, `CONTABILIDAD`, `COMERCIAL`, `TALENTO_HUMANO`.

---

## 1. RTM / Turnos

Gestiona el flujo completo de un vehículo por el CDA: creación del turno en Puerta, seguimiento por etapas (Puerta → Facturación → Certificación), edición/cancelación, histórico y certificación final (evidencia FLUR). Es el núcleo operativo del negocio — RTM, Preventiva, Peritaje y SOAT son los 4 servicios que puede llevar un turno.

### Vistas principales

- **`views/RtmView.vue`** — `/rtm` (route `RTM`) — pantalla de bienvenida estática, solo muestra las etapas del proceso (Puerta, Registro, Facturación, Revisión, Certificación). No tiene lógica.
- **`views/rtm/CrearTurno.vue`** — `/rtm/crear-turno` (route `CrearTurno`) — formulario de creación de turno: selecciona servicio (RTM/SOAT/PREV/PERI o "TRÁMITES", que cambia el formulario a modo trámite; **🆕** el dropdown queda preseleccionado en RTM por defecto —buscado por `codigo`, no por id, para no depender de que RTM sea el id=1 en cada ambiente— en vez de caer en el primero alfabético del catálogo que devuelve el backend, que era Peritaje), busca por placa/teléfono en tiempo real (`BusquedasService.unificada`) contra `/api/buscar` para autocompletar vehículo/cliente/dateo reciente/convenio/asesor asignado/última visita, detecta automáticamente el canal de captación (Fachada/Asesor/Call Center/Redes) y muestra alertas de ventana de renovación para RTM/SOAT. **🆕** La ventana pasó de 5 a **16 días** antes del vencimiento (`DIAS_VENTANA_PRE_VENCIMIENTO`) y ya no se calcula sobre `resp.ultimaVisita` de la búsqueda unificada (que no filtraba por servicio ni estado y podía ocultar/confundir la alerta) — ahora `refreshAlertaVentanaServicio()` consulta el último turno **finalizado** de la placa para el **mismo `servicioId`** que se está creando, mismo criterio que `bloqueoMesesPorServicio()` en `turnos_rtms_controller.ts::store()` (backend). Se recalcula al buscar y también al cambiar el dropdown de Servicio. **🆕** El dateo encontrado (con asesor/convenio/captación sugerida) ya **no desaparece** al cambiar el dropdown de Servicio — antes un `watch` lo limpiaba sin volver a buscar; ahora permanece visible sin importar el servicio, y se muestra una alerta permanente y reactiva ("Este dateo fue registrado para X") cuando el servicio seleccionado no coincide con el `servicioId` del dateo (dato que ahora sí viaja en la respuesta de `/api/buscar`). **🆕** La búsqueda automática mientras se escribe la placa ya no dispara a los 5 caracteres (un regex distinto, `PLACA_COMPLETA_AUTO_REGEX`, exige el patrón completo de 6 — el de 5 solo aplicaba a un formato de moto y coincidía como prefijo de cualquier placa de carro de 6, interrumpiendo antes de tiempo); la búsqueda manual (botón "Buscar") sigue aceptando 5 o 6 vía el `PLACA_REGEX` original, sin cambios. Muestra contador de turno global y por-servicio. Al confirmar llama `TurnosDelDiaService.createTurno()` o, si el servicio es "TRÁMITES", `TramitesService.create()`.
- **`views/rtm/TurnosDelDia.vue`** — `/rtm/turnos-dia` (route `TurnosDelDia`) — tablero de tarjetas de los turnos del día (filtrable por servicio/fecha/placa), cada tarjeta muestra las etapas (Puerta/Facturación/Certificación) con check visual, quién y a qué hora completó cada una, chips de observaciones del turno/dateo con vista previa en hover, botón "Editar", modal de estadísticas (por estado/servicio/tipo de vehículo/canal, con gráfico de barras Chart.js — `conteoPorEstado` ya contaba sobre `turnosParaContadores` (respeta servicio/placa, no estado); **🆕 Fix:** `servicioStats` y `calculateStats` (desglose por servicio/tipo de vehículo y por canal de captación) contaban en cambio sobre `turnos` sin filtrar — ahora usan el mismo `turnosParaContadores`, así que si el operador tiene un servicio o placa filtrados en la grilla principal, el modal ya no mezcla turnos de otros servicios/placas en esos dos desgloses) y botón para descargar Excel del día (`window.open` a `/api/turnos-rtm/reporte/excel`). **🆕** Los 4 contadores de la leyenda (En proceso/Incompletos/Finalizados/Cancelados) son clicables y filtran las tarjetas por `estadoVisual`, con resaltado visual del filtro activo y toggle (clic de nuevo lo desactiva); cuando el filtro activo es "Incompleto" aparecen 2 sub-filtros ("Falta facturación"/"Falta certificación"). Los contadores se calculan sobre un conjunto separado (`turnosParaContadores`, aplica servicio+placa pero NO el filtro de estado) para que nunca colapsen a 0 al filtrar las tarjetas — mismo patrón que ya usaba el filtro de servicio existente, documentado explícitamente para no repetir la confusión. **🆕 Fix:** en tarjetas de turnos `cancelado`/`inactivo`, `getEtapas()` ya no fuerza `completed=false`/`funcionario=null` en todas las etapas — antes esto ocultaba el responsable real (asesor/facturador/certificador) de un turno cancelado que sí había avanzado etapas antes de cancelarse.
- **`views/rtm/EditarTurno.vue`** — `/rtm/editar-turno/:id` (route `TurnoRtmEdit`) — edita datos del turno (placa, tipo vehículo, medio de captación, observaciones, horas, estado), muestra datos de solo-lectura de vehículo/cliente/dateo asociado, y permite **cancelar el turno** (conserva sus números de turno) vía `TurnosDelDiaService.cancelarTurno()`. **🆕** El diálogo de cancelar ahora exige un motivo (mínimo 5 caracteres, valida antes de habilitar el botón) — el backend lo rechaza con 400 si falta, ya no es opcional — y muestra una advertencia reforzada si el turno ya tiene facturación o certificación registrada (antes solo un mensaje genérico).
- **`views/rtm/EstadoDeTurnos.vue`** — `/rtm/estado-turnos` (route `EstadoDeTurnos`) — es el **histórico/buscador general** de turnos (a diferencia de "Turnos del Día" que solo muestra el día actual): tabla paginada con filtros por placa, turno #, fecha, servicio (chips rápidos), accesos "Hoy"/"Mes", modal de detalle con tabs (reutiliza `TurnoDetalleDialog.vue`, compartido con Comisiones), modal de historial de visitas de una placa, y modal para **importar RepGeneral** (CSV/XLSX del CDA) vía `repGeneralService.importarRepGeneral()` — actualiza clientes/vehículos/conductores y clasifica visitas en nuevas/recurrentes/recuperación.
- **`views/rtm/ContadorConvenios.vue`** — `/rtm/contador-captacion` (route `ContadorCaptacion`) — reporte de medios de captación: resumen por medio de ingreso y por servicio en un rango de fechas, exportación a Excel general, por selección múltiple (servicios + medios) o exportación rápida por fila individual (`TurnosDelDiaService.exportTurnosExcel/exportTurnosExcelMultiple/exportTurnosByServicio/exportTurnosByMedio`), y modal de detalle de turnos por categoría.
- **`views/rtm/CertificacionTurnoView.vue`** — `/rtm/certificacion/:id` (route `RtmCertificacion`, título "Certificación / Evidencia") — el **"pantallazo FLUR"**: pantalla para subir la evidencia fotográfica (screenshot del sistema FLUR de RUNT/tránsito) que certifica que el trámite se completó en el organismo externo. Soporta drag&drop, pegar con Ctrl+V, zoom/rotar la imagen antes de subir. Al confirmar (`CertificacionService.subirEvidencia`) el turno queda **finalizado** con hora de salida automática. Si ya existe una certificación, la muestra en modo solo-lectura.

### Servicios

- **`turnosdeldiaService.ts`** (clase `TurnosDelDiaService`, base `/api/turnos-rtm`): `obtenerServicios/getServicios` → `GET /api/servicios`; `fetchNextTurnNumber` → `GET /api/turnos-rtm/siguiente-turno`; `fetchTurnos(filters)` → `GET /api/turnos-rtm`; `fetchTurnoById` → `GET /api/turnos-rtm/:id`; `createTurno` → `POST /api/turnos-rtm`; `updateTurno` → `PUT /api/turnos-rtm/:id`; `registrarSalida` → `PUT /api/turnos-rtm/:id/salida`; `activarTurno` → `PATCH /api/turnos-rtm/:id/activar`; `cancelarTurno` → `PATCH /api/turnos-rtm/:id/cancelar`; `inhabilitarTurno` → `PATCH /api/turnos-rtm/:id/inhabilitar`; `exportTurnosExcel/exportTurnosExcelMultiple/exportTurnosByServicio/exportTurnosByMedio` → `GET /api/turnos-rtm/export-excel` (blob, con distintos params).
- **`certificacion_service.ts`**: `subirEvidencia(turnoId, file, obs)` → `POST /api/certificaciones` (FormData: `turno_id`, `imagen`, `observaciones`); `getByTurno(turnoId)` → `GET /api/certificaciones/turno/:turnoId`.
- **`captacionCanalesService.ts`**: CRUD de catálogo de canales de captación (admin) → `GET/POST/PUT/DELETE /api/captacion-canales`, `list/listActivos/getSelectItems/getById/create/update/remove/restore`. Motor HTTP propio (no usa `http.ts`), añade Bearer manualmente.
- **`captacion_service.ts`** (nombre de archivo real: exporta `AgentesCaptacionService` pero con comentario legacy sobre búsqueda) — en realidad es el service de **agentes de captación**: `list/getById/create/update/remove` → `/api/agentes-captacion` (CRUD de asesores internos/externos/telemercadeo).
- **`clases_vehiculos_service.ts`**: CRUD catálogo clases de vehículo → `/api/clases-vehiculo`.
- **`vehiculos_service.ts`**: CRUD vehículos → `/api/vehiculos` (filtra por placa/clase/teléfono cliente).
- **`Servicios_service.ts`**: `getActivos()` → `GET /api/servicios`. Nota: pese a estar listado aquí por temática, en el código solo lo importa `views/comercial/dateos/DateoCreate.vue` (dropdown de servicios al crear un dateo) — ninguna vista de RTM lo usa hoy.
- **`busquedas_service.ts`** (`BusquedasService`): `byPlaca/byTelefono/unificada` → `GET /api/buscar` — endpoint central usado en CrearTurno para autocompletar todo (vehículo, cliente, dateo reciente, reserva, captación sugerida, última visita).
- **`buscarService.ts`**: funciones sueltas `buscar()` (mismo endpoint `/api/buscar`), `getProspectoByPlaca`, `crearDateoAutoPorConvenio`, `getAsesorResumen`, `getConveniosByAsesor`, `getProspectosByCreador` — usadas desde vistas Comerciales (asesor/convenios/prospectos), no solo RTM.
- **`repGeneralService.ts`**: `importarRepGeneral(file)` → `POST /api/rtm/rep-general/import` (FormData) — importación masiva de datos del reporte oficial del organismo de tránsito.

### Componentes reutilizables

- **`components/rtm/TurnoDetalleDialog.vue`** — modal de detalle de turno con tabs "Detalles"/"Tarjeta Visual", extraído de `EstadoDeTurnos.vue` para reutilizarse también en Comisiones (tabla general y panel por asesor). Recibe el turno ya cargado, no hace fetch propio.

### Roles

- `verTurnos` (ver menú Turnos) → `SUPER_ADMIN, GERENCIA, OPERATIVO_TURNOS`.
- `crearTurno` → `SUPER_ADMIN, OPERATIVO_TURNOS, GERENCIA, TRAMITADOR`.
- `editarTurno` / `cerrarTurno` → `SUPER_ADMIN, GERENCIA, OPERATIVO_TURNOS`.
- `crearCertificacion` / `verCertificaciones` → `SUPER_ADMIN, GERENCIA, OPERATIVO_TURNOS`.
- `importarRepGeneral` → `SUPER_ADMIN, GERENCIA, OPERATIVO_TURNOS`.
- Nota: las rutas de RTM **no** tienen `meta.roles` en el router — el control es solo visual vía `can.xxx()` en `AppSidebar.vue`; la URL sigue siendo navegable directamente.

---

## 2. Trámites

Cola de gestión de trámites de tránsito (matrículas, traspasos, cambios de placa, etc.) que se cobran aparte de RTM. Un turno con servicio "TRÁMITES" (creado desde `CrearTurno.vue`) puede llevar **varios trámites** agrupados bajo el mismo número de turno (ej: traspaso + duplicado de placas del mismo cliente).

### Vistas principales

- **`views/tramites/TramitesView.vue`** — `/tramites/turnos-tramites` (route `TurnosTramites`) — cola del día: tabla agrupada por turno (`v-data-table` con `show-expand`), cada fila expandida muestra los trámites de ese turno con botones directos a Formulario RUNT / Checklist / Liquidación / Historial de Pagos. Modal de detalle permite categorizar el tipo de trámite (18 tipos: Matrícula, Traspaso, Cambio de Placas, etc.), cambiar tipo de vehículo, gestionar estado (`en_espera → en_atencion → completado`, o `cancelado` con confirmación), capturar datos específicos de Traspaso (valor vehículo, forma de pago, fecha entrega, destrate), y calcular tarifa automática (`TramitesService.getTarifa`) según tipo+clase de vehículo.
- **`views/tramites/ReporteCajaView.vue`** — `/tramites/reporte-caja` (route `ReporteCaja`) — reporte de caja de trámites: total ingresado por rango de fechas, desglose por forma de pago (Efectivo/Transferencia/Datáfono), lista de liquidaciones con expansión para ver los pagos individuales del período y visor de evidencia de pago.

### Servicios

- **`tramitesService.ts`** (`TramitesService`, base `/api/tramites`): `getAll(filters)` → `GET /api/tramites` (paginado); `getById` → `GET /api/tramites/:id`; `create` → `POST /api/tramites`; `update` → `PUT /api/tramites/:id`; `siguienteNumero` → `GET /api/tramites/siguiente-numero`; `getTarifa(tipo, clase)` → `GET /api/tarifas/tramite`; `registrarPago` → `POST /api/tramites/:id/pago` (FormData); `agregarATurno` → `POST /api/tramites/:turnoNumero/agregar`. Exporta `TIPOS_TRAMITE_ITEMS` (18 tipos) y `ESTADO_CONFIG` (colores/iconos por estado).
- **`tramiteChecklistService.ts`**: `getByTurno(sedeId, fecha, turnoNumero)` → `GET /api/tramites/checklist`; `upsert` → `PUT /api/tramites/checklist`. Checklist de 14 documentos requeridos (tarjeta de propiedad, SOAT, cédulas, RUNT vendedor/comprador, antecedentes, prendas, cámara de comercio, etc.).
- **`tramiteLiquidacionService.ts`**: `getByTramite` → `GET /api/tramites/:id/liquidacion`; `upsert` → `PUT /api/tramites/:id/liquidacion`; `exportPdf` → `GET /api/tramites/:id/liquidacion/export-pdf` (blob). Liquidación desglosa: retención, derechos de traspaso, paz y salvo, levantamiento/inscripción de prenda, papelería, honorarios, impuestos (año actual y vencidos).
- **`liquidacionPagoService.ts`**: `getHistorialTurno` → `GET /api/tramites/liquidacion-historial`; `registrarPago` → `POST /api/tramites/liquidacion/:id/pago` (FormData); `getPagoPdf` → `GET /api/tramites/liquidacion-pago/:id/pdf` (blob).
- **`reporteCajaService.ts`**: `getReporteCaja(fechaInicio, fechaFin)` → `GET /api/tramites/reporte-caja`.
- **`formulariosRuntService.ts`**: `getByTramite` → `GET /api/tramites/:id/formulario-runt`; `upsert` → `PUT /api/tramites/:id/formulario-runt`; `exportExcel/exportMandatoExcel/exportPaqueteCompleto` → descargas blob del formulario RUNT completo (datos de vehículo, propietario, comprador, mandatario, alertas de hurto/embargo/limitación, datos de importación).

### Componentes reutilizables (todos en `components/tramites/`, patrón dialog con `v-model`)

- **`FormularioRuntDialog.vue`** — formulario completo del formato oficial RUNT (traspaso de propiedad): datos del vehículo, propietario, comprador, mandatario, alertas, importación.
- **`ChecklistTurnoDialog.vue`** — checklist de los 14 documentos requeridos por trámite.
- **`LiquidacionTramiteDialog.vue`** — captura de los rubros de la liquidación (retención, derechos, prenda, honorarios, impuestos) con cálculo de total.
- **`HistorialPagosTurnoDialog.vue`** — historial de abonos/pagos registrados para el turno completo (todos sus trámites).
- **`AgregarTramiteDialog.vue`** — agrega un trámite adicional a un turno ya existente (mismo cliente, otro tipo de gestión).

### Roles

- `verTramites` → `SUPER_ADMIN, GERENCIA, TRAMITADOR`.
- Rutas **sí** tienen `meta.roles` en el router: `['SUPER_ADMIN','GERENCIA','OPERATIVO_TURNOS','TRAMITADOR']` para ambas rutas de Trámites.
- ⚠️ **Inconsistencia:** `usePermissions.ts::verTramites()` (usado para mostrar/ocultar el link en `AppSidebar.vue`) **no incluye** `OPERATIVO_TURNOS`, pero el `meta.roles` de la ruta sí — un usuario con ese rol no ve el link en el menú pero, si el guard de rutas se activa alguna vez (hoy no existe, ver 9.9), sí podría entrar por URL directa. Revisar cuál de las dos listas es la intención real antes de tocar este módulo.

### Patrones específicos de RTM/Trámites (adicionales a los generales, ver sección 10)

- **Captura de evidencia por cámara/portapapeles**: patrón repetido en `CertificacionTurnoView.vue` y `FacturacionSubirTicket.vue` — dropzone con `@dragover/@drop`, listener global `window.addEventListener('paste', onPaste)` para Ctrl+V, controles de zoom/rotación con CSS `transform`, y `URL.createObjectURL(file)` para preview antes de subir.
- **Autocompletado por búsqueda unificada**: `CrearTurno.vue` dispara `BusquedasService.unificada()` con debounce implícito (`watch` sobre placa/teléfono validados por regex) y cancela requests en vuelo con `AbortController` — patrón a reutilizar para cualquier futuro autocompletado por placa/teléfono.
- **Descarga de Excel vía navegación directa**: `TurnosDelDia.vue.downloadExcelDia()` usa `window.open(url, '_blank')` en lugar de `download()` de `http.ts` — funciona porque el endpoint no requiere manejo de blob en el cliente (el navegador maneja la descarga), pero es inconsistente con el patrón de `services/http.ts::download()` usado en el resto del proyecto.
- **Agrupación de turno con múltiples trámites**: en `TramitesView.vue`, la tabla no lista trámites planos sino turnos agrupados (`Map<turnoNumero, {tramites: Tramite[]}>`) — patrón a replicar si otro módulo necesita "N items hijos bajo un mismo turno".

---

## 3. Facturación

Registra el cobro (ticket/factura) de un turno ya certificado o en proceso. Un turno de servicio simple (ej. algunos servicios "simplificados") solo requiere la imagen del ticket; los demás requieren OCR + datos estructurados (placa, total, NIT, PIN, prefijo/consecutivo) y pueden llevar un **descuento informativo** pre-marcado desde el dateo comercial o aplicado manualmente en caja (con autorización).

### Vistas principales

- **`views/facturacion/FacturacionSubirTicket.vue`** — `/facturacion/subir-ticket` (route `FacturacionSubirTicket`) — pantalla de caja: sube foto del ticket (dropzone/paste/zoom/rotar), ejecuta OCR automático (`reocr`) que rellena placa/total/fecha/hora/NIT/PIN/marca/prefijo/consecutivo, permite editar manualmente, y al confirmar corre el flujo `crear → reocr → update → confirmar`. Si el turno viene con un descuento pre-marcado desde el dateo (`turnoMeta.descuentoId`), lo aplica automáticamente mostrando el nombre y permitiendo un slider de monto (0 a máximo configurado); si la cajera decide cambiarlo, exige seleccionar "Autorizado por" (usuario). Descuentos tipo `INFORMATIVO_POLICIA`/`INFORMATIVO_EMPLEADO`/`AVANCE_PROPIETARIO` tienen **monto fijo** (no editable) y el primero exige subir 3 documentos (carnet, tarjeta de propiedad, cédula) antes de poder confirmar. Cuando el turno tiene dateo vinculado (`turnoMeta.dateoId`) pero **sin** descuento pre-marcado (`!turnoMeta.descuentoId`) y la cajera igual selecciona uno manualmente en caja (`descuentoIdEnCaja`), aparece un bloque opcional "Observación" (chips de razones rápidas — `RAZONES_RAPIDAS_DESCUENTO`: "Asesor no puso descuento", "Cliente pide en caja el descuento" — + textarea libre) cuyo texto se envía como `descuento_observacion` al confirmar; se resetea junto con el resto del descuento (`watch(descuentoIdEnCaja, ...)` y los distintos `reset*`).
- **`views/facturacion/FacturacionHistorico.vue`** — `/facturacion/historico` (route `FacturacionHistorico`) — histórico paginado server-side (`v-data-table-server`) de tickets con estado (BORRADOR/OCR_LISTO/LISTA_CONFIRMAR/CONFIRMADA/REVERTIDA), modal de detalle con imagen del ticket (fetch autenticado a blob, no `<img src>` directo porque requiere Bearer), desglose de descuento aplicado (origen dateo vs. caja, quién autorizó/confirmó) y edición del monto de descuento post-confirmación (`PATCH` directo con `fetch`, no pasa por `FacturacionService`).

### Servicios

- **`facturacion_service.ts`** (`FacturacionService`, base `/api/facturacion/tickets`): `list(filtros)` → `GET` paginado; `getById` → `GET /:id`; `hashExists` → detección de duplicado por hash de archivo; `checkDuplicados` → detección por contenido (placa+total+fecha ±1h); `createFromFile`/`createFromFormData` → `POST` (FormData); `reocr(id)` → `POST /:id/reocr`; `update(id, patch)` → `PATCH /:id`; `confirmar(id, forzar?)` → `POST /:id/confirmar`; `flujoCaja()` — azúcar que encadena crear→reocr→update→confirmar en una sola llamada; `subirDocumentoPolicia`/`getDocumentoPoliciaBlob` → gestión de los 3 documentos del descuento por policía/militar.
- **`uploadsService.ts`**: `uploadImage(file)` → `POST /api/media/upload` (genérico, usado por otros módulos como Comprobantes/Dateos para subir imágenes sueltas); `getImageMetaByFilename`/`deleteImageByFilename`.
- **`repGeneralService.ts`**: ver sección RTM — el botón "Importar RepGeneral" vive en `EstadoDeTurnos.vue` (RTM), no en Facturación, aunque el nombre sugiera relación directa con facturación. Es una importación de datos maestros (clientes/vehículos/conductores), no de facturas.

### Componentes

No usa componentes propios de `@/components` — todo el flujo (dropzone, modal confirmación, modal resultado, edición de descuento) está inline en las dos vistas.

### Roles

- `verHistoricoFacturacion` → `SUPER_ADMIN, GERENCIA, CONTABILIDAD, OPERATIVO_TURNOS`.
- `crearFacturacion` → `SUPER_ADMIN, GERENCIA, OPERATIVO_TURNOS`.
- `confirmarFacturacion` → `SUPER_ADMIN, GERENCIA, CONTABILIDAD`.
- Rutas del router **no** tienen `meta.roles`; el sidebar solo expone el link "Facturación" (histórico) dentro de Comercial→Descuentos, condicionado a `can.verHistoricoFacturacion()`. El link a "Subir ticket" no aparece en el sidebar — se llega ahí por navegación directa desde `TurnosDelDia.vue` (botón "Facturación" en la etapa del turno, con `query.turnoId`).

### Patrones específicos de Facturación

- **Flujo de caja encadenado**: `FacturacionService.flujoCaja()` combina 4 llamadas HTTP en una función — patrón útil si otro módulo necesita un flujo "crear→procesar→confirmar" similar.
- **Imagen protegida vía blob autenticado**: como el endpoint de imagen requiere `Authorization: Bearer`, no se puede usar `<img :src="url">` directo; se hace `fetch()` manual con headers + `URL.createObjectURL(blob)` (ver `loadImageBlob()` en `FacturacionHistorico.vue`). Mismo patrón que en Certificación y Contratos para archivos protegidos.
- **Detección de duplicados**: por hash de archivo (`hashExists`) y por contenido (`checkDuplicados`: placa+total+fecha±1h) antes de confirmar — con flag `forzar` para que el usuario decida continuar pese al aviso.
- **Descuento informativo con dos orígenes**: "pre-marcado desde dateo" (automático, sin autorización) vs. "aplicado en caja" (manual, requiere `autorizado_por_id`) — mismo patrón de trazabilidad se repite en Comisiones y Reportes de Descuentos.

---

## 4. Comercial

Gestiona todo el ciclo comercial: asesores/agentes de captación, dateos (leads calientes con reserva de exclusividad), convenios (talleres/parqueaderos que refieren clientes), prospectos (leads fríos importados o de campo), clientes finales, comisiones generadas por cada venta, comprobantes de pago a asesores/convenios y descuentos informativos aplicables en caja.

### 4.1 Asesores

**Vistas:**
- `views/comercial/asesores/AsesoresConveniosView.vue` — `/comercial/asesores` (route `ComercialAsesores`) — listado filtrable de agentes (nombre/tel/doc, tipo: Comercial/Convenio/Telemercadeo, estado activo/inactivo).
- `views/comercial/asesores/FichaComercialAsesor.vue` — `/comercial/asesores/:id/ficha` (route `FichaComercialAsesor`) — ficha individual con filtros de periodo (rangos rápidos), resumen de convenios/prospectos, y tabla de dateos con comisión ya calculada. Es la pantalla a la que redirige el login si el rol es `COMERCIAL` (ve **su propia** ficha vía `/api/agentes-captacion/me`). **🆕** Pestaña **"NEW-DATEOS"** (junto a la pestaña "DATEOS" existente) — muestra solo los dateos del asesor con `resultado==='RE_DATEAR'` (`dateosParaRedatear`, con contador "N dateo(s) para re-datear"), cada fila con el mismo chip clickeable (`redatear-chip`) + ícono de historial que la pestaña "DATEOS" (ambas pestañas comparten el mismo `abrirRedatearModal(item)` y el mismo modal `redatearDialog`, no hay dos modales distintos). El modal (`v-dialog v-model="redatearDialog.visible"`) tiene 3 estados: **(a)** pendiente y bajo el límite → dropzone de evidencia (drag&drop/click) + observación + contador "Re-dateado X de Y" + botón "Confirmar"; **(b)** pendiente pero `limite_alcanzado` → mensaje + botón "Crear dateo nuevo" (`irACrearDateoDesdeRedatear`, navega a `DateoCreate.vue` con placa/teléfono en query); **(b')** ya no está en `RE_DATEAR` → modo solo lectura mostrando el historial (`redatearHistorial`, vía `CaptacionDateosService.getRedateos()`). Confirmar el re-dateo pasa por un `ConfirmarDialogo` (`redatearConfirmVisible`) antes de ejecutar `ejecutarRedatear()`.

**Servicio:** `asesoresService.ts` — `listAsesores` → `GET /api/agentes-captacion`; `getAsesorById` → `GET /api/agentes-captacion/:id`; `getMiFicha` → `GET /api/agentes-captacion/me`; `getResumenAsesor` → `GET /api/agentes-captacion/:id/resumen`; `listProspectosDelAsesor` → `GET /api/agentes-captacion/:id/prospectos`; `listConveniosDelAsesor` → `GET /api/agentes-captacion/:id/convenios`. Normaliza tipos legacy (`ASESOR_INTERNO`→`ASESOR_COMERCIAL`, `ASESOR_EXTERNO`→`ASESOR_CONVENIO`).

### 4.2 Dateos

Un "dateo" es un lead caliente (cliente detectado por placa/teléfono con intención de compra) capturado por un asesor, con **exclusividad temporal** (config `horas_exclusividad`, ya no 72h hardcodeadas) para que otro asesor no se lo dispute; si pasa ese tiempo en `PENDIENTE` sin convertirse en turno, el backend lo revierte automáticamente a `RE_DATEAR` (no a `NO_EXITOSO`) — y desde ahí el asesor dueño (o SUPER_ADMIN/GERENCIA) puede **re-datearlo con evidencia** hasta un límite configurable de veces, o el sistema lo cierra como `REEMPLAZADO` si llega un dateo nuevo para la misma placa/teléfono antes de que se re-datee.

**Countdown de exclusividad:** `composables/useReservaCountdown.ts` (`calcularReservaCountdown()`) — compartido por `DateosList.vue` y `FichaComercialAsesor.vue`, calcula el texto/estado del chip de tiempo restante. **🆕** La base ya no es siempre `created_at`: usa `redateado_at ?? created_at`, mismo criterio que `buildReserva()` en el backend, para que el countdown del frontend y la ventana real del backend nunca se desincronicen. **🆕** Dateos con `resultado==='REEMPLAZADO'` devuelven "no aplica" (historia muerta, la ventana ya no es relevante).

**Vistas:**
- `views/comercial/dateos/DateosList.vue` — `/comercial/dateos` (route `ComercialDateos`) — listado con filtros (placa, teléfono, canal, agente, convenio, resultado, consumido, rango de fechas) y control de horas de exclusividad configurable. **🆕** Chip clickeable "RE_DATEAR" (`redatear-chip`) por fila + ícono de historial (tooltip "Ver historial de re-dateos (N)") que abren un modal compartido (`redatearDialog`) de re-datear/ver historial (mismo componente inline replicado en `FichaComercialAsesor.vue`, ver 4.1): dropzone de evidencia (drag&drop + click), campo de observación, contador "Re-dateado X de Y veces permitidas", y si `limite_alcanzado` un botón "Crear dateo nuevo" que navega a `DateoCreate.vue` con la placa/teléfono precargados. **🆕** Panel de configuración (visible solo si `puedeConfigurarRedateos` = `can.configurarRedateos()`, junto al control de horas de exclusividad): campo + botón "Guardar" para el **límite global** de re-dateos (`maxRedateosGlobal`, `GET/POST /captacion-dateos/config/max-redateos`), y una tabla de **overrides por asesor** (`maxRedateosAsesorOverrides`) con formulario para crear/actualizar (`POST /captacion-dateos/config/max-redateos/asesores`) y eliminar uno.
- `views/comercial/dateos/DateoCreate.vue` — `/comercial/dateos/nuevo` (route `ComercialDateosNuevo`) — crear dateo manual (canal, tipo de asesor, agente, convenio, placa/teléfono, **servicio a datear** — dropdown que carga de `Servicios_service.getActivos()`, precarga RTM —, descuento, observación, imagen de evidencia obligatoria, comprobante de avance si aplica). **🆕** Si se llega con `?placa=&telefono=` en la query (desde el modal de re-datear cuando un dateo alcanzó el límite de re-dateos, "crear dateo nuevo" — ver `DateosList.vue`/`FichaComercialAsesor.vue`), precarga esos dos campos (`onMounted`, placa normalizada a mayúsculas). **🆕 (2026-08-25)** Modal de excepción para el 409 `DATEO_ACTIVO_EXCEPCION_DISPONIBLE` (`showExcepcionDateoActivoDialog`/`excepcionDateoActivoMensaje`): si el backend responde ese código y el usuario es privilegiado (`esPrivilegiado`), muestra el mensaje que ya arma el backend (servicio + fecha) y, al confirmar (`confirmarExcepcionDateoActivo()`), reenvía el mismo payload con `confirmar_excepcion: true` — mismo flag y mismo `excepcionAprobada` del diálogo de éxito genérico que ya usaba el modal de `RTM_VIGENTE_EXCEPCION_DISPONIBLE` (código `code === 'RTM_VIGENTE_EXCEPCION_DISPONIBLE'` capturado en el mismo `catch` de `handleSubmit()`) — no duplica lógica de envío, solo agrega la rama de detección del código nuevo.
- `views/comercial/dateos/DateoDetail.vue` — `/comercial/dateos/:id` (route `ComercialDateoDetalle`) — detalle/edición con historial de estado, gestión de "avance" (adelanto de dinero al propietario, requiere comprobante si el agente es COMERCIAL). **🆕 Fix:** el campo de comprobante (`debeSubirComprobante`) ahora depende de `dateo.value.es_avance` (el campo real del dateo, el mismo que valida `toggleAvance()` en el backend) en vez de `esAvanceSeleccionado`/`descuento_id` (una señal secundaria derivada del dropdown de Descuento, que podía estar desincronizada — un dateo con `es_avance=true` pero sin un descuento "AVANCE" seleccionado nunca mostraba el campo). Se agregó además un guard (`cargaInicialCompleta`) al watcher que sincroniza `es_avance` con el descuento seleccionado, para que no lo pise a `false` justo al cargar la pantalla antes de que el operador toque nada; sigue reaccionando normal ante cambios genuinos posteriores del dropdown. **🆕** El botón "Editar" ahora respeta `can.gestionarDateos()` (antes lo veía cualquier rol con acceso a la ficha —incluido CONTABILIDAD/COMERCIAL—, aunque el backend ya rechazaba el `PUT` para esos roles; el operador solo se enteraba al presionar "Guardar"). **🆕** Campos nuevos: **tipo de asesor** (texto informativo, no editable — se corrige cambiando el agente); **agente/convenio/servicio a datear** ahora editables (`v-autocomplete`, mismos catálogos que `DateoCreate.vue`) pero solo si `can.gestionarDateos()` es `true`; para el resto de roles quedan de solo lectura como antes. **🆕** Nueva sección "Documentos de descuento informativo" (visible solo si `dateo.documentosInformativos` trae al menos un ticket, campo nuevo del `GET /captacion-dateos/:id` del backend): por cada ticket de Facturación vinculado muestra las miniaturas de carnet/tarjeta de propiedad/cédula subidas para descuentos tipo `INFORMATIVO*` (ej. `INFORMATIVO_POLICIA`), cargadas como blob autenticado vía `FacturacionService.getDocumentoPoliciaBlob()` (mismo patrón de `FacturacionHistorico.vue`, no `<img src>` directo). Antes esta evidencia solo era visible desde el ticket de Facturación, no desde la ficha del dateo. **🆕** Nueva sección "Historial de re-dateos" (solo si `numero_redateos_usados > 0`, vía `CaptacionDateosService.getRedateos()`) — de solo lectura, sin chip/modal: grilla de tarjetas por cada re-dateo (miniatura de evidencia, número, fecha, quién lo hizo, observación, link "Ver" a la imagen completa).

**Servicios:** `captacion_dateos_service.ts` (`CaptacionDateosService`) y `dateosService.ts` — ambos apuntan a `/api/captacion-dateos` con funciones muy similares (parecen dos capas que coexisten: uno más "raw", otro con normalización de shapes de respuesta). Endpoints: `list/getById/create/update/consume/clearConsumption/remove` estándar CRUD; `verificarVencidos()` → `POST /api/captacion-dateos/verificar-vencidos` (revierte dateos vencidos, se llama automáticamente antes de cargar prospectos); `toggleAvance` → `PATCH /api/captacion-dateos/:id/avance`; `getExclusividadConfig/updateExclusividadConfig` → `/api/captacion-dateos/config/exclusividad`; `previewHistoricoRtm`/`importarHistoricoRtm` → importación masiva histórica de RTM (`/api/historico-rtm/preview` y `/importar`, con `dry_run`); `verificarPlacaRtm` → `GET /api/captacion-dateos/verificar-placa` (chequea vigencia RTM antes de datear). **🆕** Todo lo de re-dateo vive solo en `captacion_dateos_service.ts` (no en `dateosService.ts`, que solo agregó los tipos `ResultadoDateo='REEMPLAZADO'`/`numero_redateos_usados`/`redateado_at`/`limite_alcanzado` a su interfaz `Dateo`): `redatear(id, {evidencia_url, observacion?})` → `POST /:id/redatear`; `getRedateos(id)` → `GET /:id/redateos`; `getMaxRedateosGlobal()`/`setMaxRedateosGlobal(n)` → `GET/POST /config/max-redateos`; `getMaxRedateosAsesores(asesorId?)`/`setMaxRedateosAsesor(asesorId, n|null)`/`deleteMaxRedateosAsesor(id)` → `GET/POST /config/max-redateos/asesores` + `DELETE /config/max-redateos/asesores/:id`.

### 4.3 Convenios

Empresas/talleres/parqueaderos/personas que tienen un acuerdo comercial y refieren clientes; cada convenio puede tener un **asesor activo** asignado (quien recibe comisión por los referidos del convenio).

**Vistas:**
- `views/comercial/convenios/ConveniosList.vue` — `/comercial/convenios` (route `ComercialConvenios`) — listado filtrable (texto, activo, estado, ruta).
- `views/comercial/convenios/ConvenioDetail.vue` — `/comercial/convenios/:id` (route `ComercialConvenioDetalle`) — ficha completa: datos de contacto, método de pago, ruta/periodicidad de visita, asesor asignado (asignar/retirar), estado (ACTIVO/INACTIVO/PROSPECTO).

**Servicio:** `conveniosService.ts` — `listConvenios/getConvenio/updateConvenio` → `/api/convenios`; `listAgentesCaptacion` → `/api/agentes-captacion/light`; `getAsesorActivo/asignarAsesorConvenio/retirarAsesorConvenio` → `/api/convenios/:id/asesor-activo`, `/asignar`, `/retirar`; `crearDateoAutoPorConvenio` → crea un dateo automático atribuido a un convenio (usado cuando el sistema detecta que una placa pertenece a un convenio); `listConveniosAsignados` → convenios de un asesor específico.

### 4.4 Prospectos

Leads fríos (importados masivamente o capturados en campo) con datos de vigencia de SOAT/RTM/Preventiva; un asesor puede "datear" un prospecto (convertirlo en dateo formal), lo que archiva todos los prospectos duplicados con esa placa.

**Vistas:**
- `views/comercial/prospectos/ProspectosList.vue` — `/comercial/prospectos` (route `ComercialProspectos`) — listado con filtros extensos (placa, teléfono, nombre, cédula, convenio, asesor, vigencia).
- `views/comercial/prospectos/ProspectoCreate.vue` — `/comercial/prospectos/nuevo` (route `ComercialProspectoNuevo`).
- `views/comercial/prospectos/ProspectoEdit.vue` — `/comercial/prospectos/:id/editar` (route `ComercialProspectoEditar`).
- `views/comercial/prospectos/ProspectoDetail.vue` — `/comercial/prospectos/:id` (route `ComercialProspectoDetalle`, solo numérico vía regex `(\d+)`) — muestra asignación activa/histórico de asesores y resumen de vigencias (SOAT/RTM/Preventiva/Peritaje) con estado vigente/vencido/sin_datos.

**Servicio:** `prospectosService.ts` — implementación **propia** de fetch (no usa `services/http.ts`), con su propio `buildUrl`/`buildQuery`/manejo de token. `listProspectos` (llama automáticamente `verificar-vencidos` de dateos antes de listar), `getProspecto/createProspecto/patchProspecto`, `asignarAsesor/retirarAsesor` → `/prospectos/:id/asignar|retirar`, `datearProspecto` → `POST /prospectos/:id/datear` (crea dateo + archiva duplicados), `listAgentesCaptacion/listConveniosLight` (catálogos).

### 4.5 Clientes

Ficha 360° del cliente final: sus vehículos y su historial completo de visitas/turnos (trazabilidad).

**Vistas:**
- `views/comercial/clientes/ClientesList.vue` — `/clientes` (route `ClientesList`) — búsqueda por nombre/teléfono/documento/placa.
- `views/comercial/clientes/ClienteDetail.vue` — `/clientes/:id(\d+)` (route `ClienteDetalle`) — datos, vehículos asociados, métricas (# visitas, última visita, servicios top) e historial paginado.
- `views/comercial/clientes/ClienteEdit.vue` — `/clientes/:id(\d+)/editar` (route `ClienteEditar`).

**Servicio:** `clientes_service.ts` (`ClientesService`) → `/api/clientes`: `list/getById/create/update/remove` CRUD estándar; `detalle(id)` → `GET /:id/detalle` (métricas + vehículos); `historial(id, filtros)` → `GET /:id/historial` paginado (por servicio, sede, placa, rango de fechas, estado).

### 4.6 Comisiones

El corazón financiero del módulo comercial: cada venta atribuida a un asesor o convenio genera una comisión calculada según reglas configurables (por tipo de vehículo, si hay convenio, si es cliente nuevo/recurrente/recuperación, si hubo descuento).

**Vistas:**
- `views/comercial/comisiones/ComisionesList.vue` — `/comercial/comisiones` (route `ComercialComisiones`) — tabla con filtros extensos (fecha, asesor, convenio, estado, tipo vehículo, placa, tipo de asesor, tipo de captación), resumen agregado por tipo de captación/estado, crear comisión manual, liquidación (pago masivo).
- `views/comercial/comisiones/ComisionesDetail.vue` — `/comercial/comisiones/:id` (route `ComercialComisionDetalle`) — detalle con trazabilidad completa (quién aplicó/autorizó el descuento, fechas de aprobación/pago/anulación).
- `views/comercial/comisiones/ComisionesConfig.vue` — `/comercial/comisiones/config` (route `ComercialComisionesConfig`) — 3 pestañas: **Reglas de comisión** (valor por placa/dateo por asesor y tipo de vehículo), **Metas mensuales** (meta de RTM y % de comisión extra por cumplimiento), **Recurrencia** (config global y por asesor de cuánto vale un dateo de cliente recurrente/recuperado, con meses mínimos de definición).

**Servicio:** `comisionesService.ts` (el más extenso del proyecto, ~1400 líneas) — implementación propia de fetch. Funciones clave: `listComisiones/getResumenComisiones/getComision/patchValores/aprobarComision/pagarComision/anularComision/pagarMasivoComisiones` (`/api/comisiones*`); `getResumenPorAsesor` (`/comisiones/resumen-por-asesor`); config: `listConfigsComision/upsertConfigComision/updateConfigComision/deleteConfigComision` (`/comisiones/config`); `listMetasMensuales/upsertMetaMensual/updateMetaMensual/deleteMetaMensual` (`/comisiones/metas` y `/comisiones/metas-mensuales`); recurrencia: `getConfigRecurrenciaGlobal/updateConfigRecurrenciaGlobal/listConfigRecurrenciaAsesores/upsertConfigRecurrenciaAsesor/deleteConfigRecurrenciaAsesor`; simulador dry-run: `simularComision` (`POST /comisiones/simular`, no crea nada, útil para preview de reglas); continuidad (evidencia de continuidad de servicio para asesor de convenio): `buscarContinuidad/guardarContinuidadOverride`; `createComision/patchComisionEditar` (edición manual con reasignación de asesor/convenio); `buscarTurnosParaComision`.

### 4.7 Comprobantes de pago

Genera un comprobante consolidado de pago a un asesor o convenio, agrupando varias comisiones en un solo pago con evidencia.

**Vistas:** `views/comercial/comprobantes/ComprobantesPago.vue` — `/comercial/comprobantes` (route `ComercialComprobantes`); `ComprobanteDetalle.vue` — `/comercial/comprobantes/:id` (route `ComercialComprobanteDetalle`).

**Servicio:** `comprobantesService.ts` — `createComprobantes` → `POST /api/comprobantes-pago` (crea uno por cada grupo de beneficiario, recibe `comision_ids` y totales por moto/vehículo/dateo/incentivo); `listComprobantes/getComprobante` → `GET`; `subirEvidencia/eliminarEvidencia` → `PATCH/DELETE /:id/evidencia`; `uploadImagen` → `POST /api/uploads/images`.

### 4.8 Descuentos

Catálogo de descuentos informativos que se pueden aplicar en Facturación (ver sección 3), con valor diferenciado por tipo de vehículo (carro/moto).

**Vistas:** `views/comercial/descuentos/Descuentos.vue` — `/comercial/descuentos` (route `ComercialDescuentos`) — CRUD del catálogo; `Descuentoshistorial.vue` — `/comercial/descuentos/historial` (route `ComercialDescuentosHistorial`) — historial de aplicaciones filtrable por tipo y rango de fechas.

**Servicio:** `descuentosService.ts` — `getAll/getActivos/getById/create/update/delete` → `/api/descuentos*`.

### Roles (Comercial, todos)

- `verComercial` (menú padre) → `SUPER_ADMIN, GERENCIA, CONTABILIDAD`.
- `verMiFichaComercial` → solo `COMERCIAL` (ve su propia ficha).
- `verListadoAgentes` → `SUPER_ADMIN, GERENCIA, CONTABILIDAD`; `verFichaAsesor` agrega `COMERCIAL`; `gestionarAgentes` → `SUPER_ADMIN, GERENCIA`.
- `verProspectos` → `SUPER_ADMIN, GERENCIA, CONTABILIDAD, COMERCIAL`; `crearProspecto` → `SUPER_ADMIN, GERENCIA, COMERCIAL` (CONTABILIDAD no puede crear).
- `verDateos` → `SUPER_ADMIN, GERENCIA, CONTABILIDAD, COMERCIAL`; `crearDateo` → `SUPER_ADMIN, GERENCIA, COMERCIAL`; `gestionarDateos` (editar/eliminar) → `SUPER_ADMIN, GERENCIA`. **🆕** `configurarRedateos` (límite global/overrides por asesor de re-dateos, en `DateosList.vue`) → `SUPER_ADMIN, GERENCIA`.
- `verConvenios/crearConvenio/editarConvenio` → `SUPER_ADMIN, GERENCIA, CONTABILIDAD`.
- `verComisiones` → `SUPER_ADMIN, GERENCIA, CONTABILIDAD, COMERCIAL`; `gestionarComisiones/aprobarComisiones/pagarComisiones` → `SUPER_ADMIN, GERENCIA, CONTABILIDAD`; `configurarComisiones` → solo `SUPER_ADMIN, GERENCIA`.
- Comprobantes y Descuentos comparten el gate `can.verComisiones()` en el sidebar (sin permiso propio en `usePermissions.ts`).
- Clientes no tiene gate propio — visible para cualquiera que vea el grupo Comercial.

---

## 5. Gestión Documental

Ciclo de vida de empleados/asesores: datos personales, roles, contratos laborales (con pasos, eventos, afiliaciones EPS/ARL/AFP/AFC/CCF, recomendaciones médicas) y su trazabilidad histórica.

### Vistas principales

- **`views/usuarios/UsuariosView.vue`** — `/gestion-documental/usuarios` (route `Usuarios`) — formulario CRUD de usuarios (crear/editar/deshabilitar) + tabla filtrable/ordenable client-side.
- **`views/usuarios/UserProfileView.vue`** — `/usuarios/:id` (route `UserProfile`) — ficha completa del empleado: contacto, seguridad social (certificados adjuntos por EPS/ARL/AFP/AFC/CCF), contratos en acordeón con tabs Detalles/Eventos/Fin/Historial, timeline de eventos y cambios, subir foto de perfil, finalizar contrato con archivo adjunto.
- **`views/gestion-documental/ContratosView.vue`** — `/gestion-documental/contratos` (route `Contratos`) — pantalla central para crear/editar contratos: filtra por razón social→usuario, formulario de contrato (salario, EPS/ARL/AFP/AFC/CCF, recomendación médica), pasos de inicio según tipo de contrato (prestación/temporal/laboral/aprendizaje), anexar PDF del contrato físico, historial del usuario. Es la pantalla a la que redirige el login para rol `TALENTO_HUMANO`.
- **`views/gestion-documental/RazonSocialView.vue`** — `/gestion-documental/razon-social/:id` (route `RazonSocialDetalle`) — lista usuarios de una razón social (4 hardcodeadas en el sidebar: CDA del Centro, Activautos, JEF & CO, Activa Marketing), modal de contratos con tabs igual que UserProfile, descarga de archivos vía blob.

### Servicios

- **`UserService.ts`**: `GET /api/usuarios` (con filtro `razon_social_id`), `GET /api/usuarios/:id`, `POST /api/usuarios` (con header `X-Idempotency-Key` + abort de duplicados en vuelo), `PUT /api/usuarios/:id`, `DELETE /api/usuarios/:id`, `POST /api/usuarios/:id/upload-photo`, `GET /api/roles`, `GET /api/razones-sociales`, `GET /api/sedes`, `GET /api/cargos`, `GET /api/entidades-saluds`; afiliaciones: `POST/GET/DELETE /api/usuarios/:id/afiliacion/:tipo/archivo`; recomendación médica: `PUT /api/usuarios/:id/recomendacion-medica`, `POST/DELETE .../recomendacion-medica/archivo`; historial: `GET/POST /api/contratos/:id/historial-estados`, `GET/POST /api/contratos/:id/historial-cambios`.
- **`contratoService.ts`** (el más grande de Gestión Documental): CRUD `POST/PATCH/DELETE/GET /api/contratos`, `GET /api/usuarios/:id/contratos`; anexar físico `POST /api/contratos/anexar-fisico` (FormData con campos duplicados camelCase/snake_case por compatibilidad); salarios `POST /api/contratos/:id/salarios`; recomendación médica por contrato `GET/POST/DELETE /api/contratos/:id/recomendacion/archivo` + descarga; archivo físico `GET meta/archivo`, `DELETE`, `download`; afiliaciones por contrato `GET/POST/DELETE /api/contratos/:id/afiliacion/:tipo/archivo`. Usa helper `getActorId()` (lee de localStorage/sessionStorage) para header `x-actor-id` o campo `actorId` en casi todas las llamadas (auditoría).
- **`contratoCambiosService.ts`**: `GET/POST /api/contratos/:id/cambios`.
- **`contratoEventosService.ts`**: `GET/POST/PUT/DELETE /api/contratos/:id/eventos[/:eventId]` (soporta FormData con documento adjunto: incapacidad, suspensión, licencia, permiso, vacaciones, cesantías, disciplinario, terminación).
- **`contratoHistorialEstadosService.ts`**: `GET/POST /api/contratos/:id/historial-estados`.
- **`contratosPasosService.ts`**: `GET /api/contratos/:id/pasos` (filtro `?fase=`), `POST/PUT/DELETE /api/contratos/:id/pasos[/:pasoId]` (FormData con archivo opcional).
- **`razonSocialService.ts`**: `GET /api/razones-sociales`, `GET /api/razones-sociales/:id`, `GET /api/razones-sociales/:id/usuarios`.
- **`AuthService.ts`**: ver sección 8.

### Componentes reutilizables

`contratos/FiltrosContratos.vue` (selects razón social/usuario/tipo), `FormularioContrato.vue` (formulario grande con v-model múltiples), `PasosContrato.vue` (checklist de pasos con archivo), `AnexoContrato.vue` (subir/reemplazar PDF del contrato), `HistorialContratos.vue` (tabla histórica del usuario), `DialogoCertificado.vue`/`DialogoRecomendacion.vue` (modales genéricos de subir/ver/eliminar archivo, reutilizados para las 5 afiliaciones), `UI/ConfirmarDialogo.vue` (ver patrones, sección 10).

### Roles

- `verGestionDocumental`/`verUsuarios`/`verContratos`/`crearContrato`/`editarContrato`/`eliminarContrato`/`crearUsuario`/`editarUsuario` → `SUPER_ADMIN, GERENCIA, TALENTO_HUMANO`.
- `eliminarUsuario` → solo `SUPER_ADMIN, GERENCIA`.

---

## 6. Reportes Administrativos

Suite de reportes gerenciales/financieros sobre todo el negocio: ingresos, producción, comisiones, retención, descuentos, metas. La mayoría comparte el mismo service (`reportesAdminService.ts`, ~1350 líneas) que centraliza todos los endpoints `/api/reportes-admin/*`.

### Vistas principales (todas bajo `/reportes-admin/*`, layout `MainLayout`)

- **`ReporteIngresosCanal.vue`** — `/reportes-admin/ingresos-canal` — ingresos totales por canal de captación (Fachada/Asesor/Tele/Redes) en un rango: cantidad, bruto, neto, ticket promedio.
- **`ReporteProduccionLider.vue`** — `/reportes-admin/produccion-lider` — producción por sede/líder: vehículos, bruto/neto, desglose por servicio (RTM/SOAT/PREV/PERI).
- **`ReporteAsesores.vue`** — `/reportes-admin/asesores` — ranking de asesores (directos vs. convenio) y resumen por convenio, con drill-down a detalle de tickets por asesor o canal.
- **`ReporteDescuentos.vue`** — `/reportes-admin/descuentos` — descuentos por tipo/canal/autorizador con drill-down a detalle (placa, monto, quién autorizó).
- **`ReporteRetencion.vue`** — `/reportes-admin/retencion` — clientes nuevos vs. recurrentes vs. recuperados (usa `meses_minimos` configurado en Comisiones→Recurrencia), por canal y por mes, con drill-down.
- **`ReporteComisiones.vue`** — `/reportes-admin/comisiones` — resumen de comisiones por estado (Pendiente/Aprobada/Pagada/Anulada) y desglosado en 3 vistas: comerciales directos, asesores de convenio, convenios — con **Liquidación RTM** e **Historial de Liquidaciones** paginado. **🆕 Modal Liquidación RTM (`ComisionesList.vue`, componente compartido, ver 4.6):** 5 secciones con acordeón (Canal, Descuentos, Comerciales, Asesores Convenio, Convenios), drill-down de placas lazy-loaded por grupo, buscador de placa/nombre (resuelto en memoria sobre lo ya cargado, con fallback a `getLiquidacionRtmBuscarPlaca` si no matchea local), filtro por estado de comisión, selección transversal a las 5 secciones + botón "Exportar placas seleccionadas" (Excel enriquecido generado 100% en backend, ver `reportesAdminService.ts` abajo). Columnas del drill-down en pantalla: Clasificación (Nuevo directo/Recurrente/Recuperación), Convenio (Comerciales), Continuidad (Asesores Convenio), ícono+tooltip de método de pago del convenio (sin columna nueva, reutiliza el patrón ya usado para "Regla aplicada" en Descuentos).
- **`ReporteServicios.vue`** — `/reportes-admin/servicios` — turnos/ingresos por servicio y tipo de vehículo, con **Costo Base RTM** (referencia de costo usando la config global de comisiones, no ajustada por overrides individuales).
- **`ReporteMetaMensual.vue`** — `/reportes-admin/meta-mensual` — configuración y seguimiento de la meta global del CDA (livianos/motos) con vistas diaria, semanal, proyectada y por rango; semáforo verde/amarillo/rojo.
- **`ReporteMetaComercialAsesor.vue`** — `/reportes-admin/meta-comercial` — meta individual por asesor (config de meta en pesos y en vehículos), con vistas diaria/semanal/proyectada, semáforo, y detalle de **Ingreso RTM Generado** (distinto de la comisión ganada — es lo que el asesor generó en facturación real, que es contra lo que se mide la meta) desglosado por dateo con evidencia de descuentos aplicados.
- **`SuperInforme.vue`** — `/reportes-admin/super-informe` (icono destacado en el sidebar) — reporte consolidado descargable en **PDF** (generado en backend con pdfkit) que combina Meta Mensual + Meta Comercial + Ingresos por Canal + Servicios + Retención + Descuentos + Producción por Líder, con selector de periodo (Día/Semana/Mes/Personalizado) y vista previa en pantalla antes de descargar (`SuperInformePreview.vue` como sub-componente/vista de apoyo).
- **`configuracion/TarifasServiciosView.vue`** — `/configuracion/tarifas-servicios` — configuración de tarifas por servicio y tipo de vehículo (valor base + valor total), tabla editable sin paginación.

### Servicios

- **`reportesAdminService.ts`** — implementación propia de fetch (no usa `http.ts`), con `apiFetch` (JSON) y `apiFetchBlob` (descargas). Cubre: `getIngresosPorCanal`, `getProduccionPorLider`, `getReconciliacionRtm`, `getReporteAsesores`/`getDetalleAsesor`/`getDetalleCanal`, `getRetencionClientes`/`getDetalleRetencion`, `getReporteServicios`, `getDescuentosPorTipo`/`PorCanal`/`PorAutorizador`/`getDetalleDescuentos`, `getReporteComisiones`/`getDetalleComisiones`/`getDetalleComisionesPorConvenio`, `getLiquidacionRtm` + `descargarLiquidacionRtmExcel`, **🆕 `getLiquidacionRtmDetallePlacas`/`getLiquidacionRtmDetallePlacasCanal`/`getLiquidacionRtmDetallePlacasDescuento`** (drill-down de placas por grupo del modal Liquidación RTM, lazy por sección), **🆕 `getLiquidacionRtmBuscarPlaca`** (fallback del buscador cuando la placa/nombre no está entre las filas ya cargadas en memoria), **🆕 `exportarLiquidacionRtmPlacas`** (POST con los IDs de comisión/descuento seleccionados transversalmente en las 5 secciones → Excel con tablas RESUMEN+DETALLE separadas por sección, generado en backend), `getHistorialLiquidaciones`/`getHistorialLiquidacionDetalle` + `descargarHistorialLiquidacionesExcel`, `getTrazabilidadRtm` + `descargarTrazabilidadRtmExcel`, `descargarSuperInformePdf`, `getSuperInformeMetaMensual`/`getSuperInformeMetaComercial` (usan rango libre, distintos de los endpoints `/resumen` que exigen mes/año calendario completo), toda la familia `getMetaMensual*` (`config/resumen/diario/semanal/proyectado/rango`) y `getMetaComercial*` (`resumen/config/diario/semanal/proyectado/detalle-vehiculo/ingreso-real-dateo`).
- **`tarifasServiciosService.ts`**: `getTarifasServicios` → `GET /api/tarifas-servicios`; `upsertTarifaServicio` → `POST`; `updateTarifaServicio` → `PUT /:id`.

### Componentes reutilizables

No hay componentes compartidos propios de `@/components` para este módulo; cada vista de reporte es autocontenida con su propia tabla de detalle y modal drill-down inline.

### Roles

- `verReportesAdmin` → `SUPER_ADMIN, GERENCIA, CONTABILIDAD`.
- Estas rutas **sí** tienen `meta.roles` explícito en el router (a diferencia de RTM/Comercial): todas `['SUPER_ADMIN','GERENCIA','CONTABILIDAD']`, excepto `TarifasServicios` que es `['SUPER_ADMIN','GERENCIA']` (sin CONTABILIDAD).

---

## 7. Dashboard

Panel de inicio con KPIs operativos del día (turnos en proceso/finalizados por servicio: RTM, Preventiva, Peritaje, SOAT) y accesos rápidos a Turnos.

**Vista:** `views/dashboard/DashboardView.vue` — `/dashboard` (route `Dashboard`) — usa composable `useDashboardDatos()` que envuelve `dashboardService.fetchDashboard`; muestra tarjetas de indicadores y botones de acceso rápido (crear turno, ver turnos del día, ver histórico).

**Servicio:** `dashboardService.ts` — no llama un endpoint propio; agrega datos combinando `turnosdeldiaService.fetchTurnos({fecha})` y `fetchNextTurnNumber(usuarioId)` para calcular contadores en el cliente (en proceso = activo sin `horaSalida`; finalizado = `estado==='finalizado'` o activo con `horaSalida`), agrupando por código de servicio.

**Componentes:** `dashboard/DashboardIndicador.vue` y `DashboardIndicadorMini.vue` (tarjetas KPI con loading), `DashboardAcciones.vue` (botonera de accesos rápidos), `AvisoFlotante.vue` (snackbar flotante del composable `useAvisos`), `ServiciosKpiCards.vue`.

**Roles:** `verDashboard` → `SUPER_ADMIN, GERENCIA, OPERATIVO_TURNOS, TRAMITADOR`.

---

## 8. Autenticación / Login

Login por correo/contraseña contra backend con JWT bearer; sin registro de usuarios desde el front (los usuarios se crean en Gestión Documental).

**Vista:** `views/LoginView.vue` — `/login` (route `Login`, layout `AuthLayout`) — envuelve `components/login/LoginForm.vue`, que llama `authStore.login({email, password})`.

**Servicio:** `AuthService.ts` — `POST /api/login` (body `{correo, password}`, `credentials:'omit'`); `GET /api/auth/me` (requiere token en `localStorage`).

**AuthStore** (`src/stores/AuthStore.ts`, Pinia): guarda `token` y `user` (con `rol.nombre`, `agenteId`, `razonSocialId`, etc.) en `state`, persistidos en `localStorage`. Getters: `isAuthenticated`, `hasRole(role)`, `hasAnyRole(roles[])`, `isSuperAdmin/isGerencia/isComercial/...`. `login()` → `AuthService.login` → guarda token → `checkAuth()` → `GET /api/auth/me` para hidratar `user` completo y **redirige según rol** si venía de `/login`: `COMERCIAL`→`FichaComercialAsesor` (con `agenteId` o `id` como asesorId), `TALENTO_HUMANO`→`Contratos`, `CONTABILIDAD`→`FacturacionHistorico`, resto→`/dashboard`. `logout()` limpia todo y redirige a `/login`.

**Roles:** ruta pública (no requiere auth); la redirección post-login depende del rol (arriba). No hay `router.beforeEach` — el control de acceso a rutas protegidas es solo por ocultamiento visual en `AppSidebar.vue` (`v-if="can.xxx()"`), salvo las rutas que sí declaran `meta.roles` (Trámites, Reportes Admin, Tarifas Servicios).

---

## 9. Tickets Internos

Bandeja general de tickets internos, abierta a todos los roles autenticados (el backend filtra qué ve/crea/resuelve cada uno server-side, no el frontend). Hoy solo existe un tipo sembrado en el catálogo `tipos_ticket` — `EXCEPCION_DATEO` (migración `1787000000006_insert_tipo_ticket_excepcion_dateo.ts`) — pero el modelo está pensado para más tipos futuros: la bandeja deriva sus pestañas de `GET /tipos-ticket`, no de un enum hardcodeado.

### Vistas principales

- **`views/tickets/TicketsList.vue`** — `/tickets` (route `TicketsList`) — bandeja general: lista de tickets visibles para el usuario, con pestañas por tipo (derivadas de `GET /tipos-ticket` — los tipos que el usuario puede *crear* — no de los tickets ya cargados, así un tipo con cero tickets todavía aparece si el usuario tiene permiso de crearlo), contador por pestaña, filtro por estado (Pendiente/Aprobado/Rechazado/Resuelto/Cerrado), y botón "Nuevo ticket" (si solo hay un tipo disponible navega directo a su vista de creación vía un mapeo `codigo → nombre de ruta` hardcodeado en el propio componente — cada tipo nuevo de todos modos va a necesitar su propia vista Vue; si hubiera más de un tipo disponible abriría un menú, hoy nunca ocurre). Visible en el sidebar (ícono `mdi-ticket-confirmation-outline`) para todos los roles autenticados, sin gating por rol. **🆕 Sección de configuración** (expansion panel "⚙️ Ventana de ticket sin penalización (Excepción de Dateo)", visible solo si `can.configurarVentanaTicket()` — mismo patrón visual que la config de límite de re-dateos en `DateosList.vue`): campo numérico + botón guardar para la ventana global (`getVentanaTicketGlobal`/`setVentanaTicketGlobal`, `PUT /api/tickets/config/ventana`), y un formulario + tabla debajo para overrides por asesor (autocomplete de asesor + minutos → `setVentanaTicketAsesor`, `PUT /api/tickets/config/ventana/asesores`; tabla lista los overrides existentes vía `getVentanaTicketAsesores`, cada fila con botón eliminar → `deleteVentanaTicketAsesor`, `DELETE .../asesores/:id`, con diálogo de confirmación). Sin overrides, la tabla muestra "Sin overrides por asesor. Todos usan la ventana global."
- **`views/tickets/TicketExcepcionDateoCreate.vue`** — `/tickets/excepcion-dateo/nuevo` (route `TicketExcepcionDateoCreate`, roles `COMERCIAL, SUPER_ADMIN, GERENCIA`) — formulario de creación del único tipo hoy disponible. Se llega acá desde el modal `REQUIERE_TICKET_DATEO` de `DateoCreate.vue` (ver más abajo e Integración con Comercial → Dateos), que precarga `turno_id` y `placa` por query string. Pide observación obligatoria y 4 slots de evidencia fotográfica (captura del chat con el cliente, captura del grupo de WhatsApp, captura del bloqueo/excepción — los 3 obligatorios — y evidencia de calamidad, opcional), cada uno con dropzone drag&drop + pegar Ctrl+V (mientras el slot esté enfocado) + click, mismo patrón de captura que `CertificacionTurnoView.vue`/`FacturacionSubirTicket.vue` (ver patrones, sección 10.8). SUPER_ADMIN/GERENCIA ven un selector adicional "a nombre de qué comercial se registra este ticket" (autocomplete combinando `listAgentesCaptacion('ASESOR_COMERCIAL')` + `listAgentesCaptacion('ASESOR_CONVENIO')`, ordenados alfabéticamente); COMERCIAL no ve ese campo — el backend infiere el `comercial_id` de su propia sesión y rechaza si el creador es SUPER_ADMIN/GERENCIA sin `comercial_id` explícito en el body (`tickets_excepcion_dateo_controller.ts::crear()`). Al enviar sube las evidencias con `uploadsService.uploadImage` y llama `crearTicketExcepcionDateo`, luego navega al detalle del ticket recién creado.
- **`views/tickets/TicketExcepcionDateoDetail.vue`** — `/tickets/:id` (route `TicketDetalle`, cualquier autenticado, `props: true`) — detalle del ticket: placa/turno/comercial, ventana de tiempo (hora de ingreso del turno, hora del intento de dateo, minutos transcurridos — en rojo con "min de exceso" si `!detalle.dentroVentana`), un `v-alert` fijo "Dentro de ventana — comisión completa" (verde) / "Fuera de ventana — requiere decisión de gerencia" (naranja) según `detalle.dentroVentana` — visible **sea cual sea el estado del ticket**, no solo mientras está pendiente — (texto actualizado el 2026-08-28 junto con el resto de la vista, ya no menciona "penalización"), observación, y las 3-4 evidencias como miniaturas (click abre la imagen original en pestaña nueva). Si el ticket ya está `APROBADO` o `RECHAZADO` es de **solo lectura para todos los roles sin excepción** — ni quien lo creó ni quien lo resolvió ven acciones — y el backend además rechaza con 400 cualquier `PATCH /aprobar` o `/rechazar` sobre un ticket que no esté `PENDIENTE`, así que no depende solo de ocultar los botones en el frontend. Si está `PENDIENTE` y el usuario tiene alguno de los `rolesResuelve` del tipo de ticket (hoy `SUPER_ADMIN, GERENCIA`), aparecen las acciones de resolución — **rediseñadas por completo el 2026-08-28, ya no existe el campo "% de penalización"**: dentro de ventana, un único botón **Aprobar** (sin elegir nada, comisión siempre completa, mismo diálogo de confirmación de siempre); fuera de ventana, **3 botones** — **Aprobar con comisión** (comisión completa normal), **Aprobar sin comisión** (comisión igual, pero `monto_asesor` queda en $0 — convenio, si aplica, cobra su parte normal) y **Rechazar** (exige motivo) — cada uno de los 2 "Aprobar" con su propio `v-dialog` de confirmación explicando qué va a pasar (`confirmarAprobar`/`confirmarAprobarConComision`/`confirmarAprobarSinComision`, tres refs booleanos separados). El ticket ya resuelto muestra "Aprobado con/sin comisión" (o "Comisión completa (dentro de ventana)" si `detalle.conComision` es `null`) en vez del % aplicado. Cualquier usuario con acceso al ticket puede agregar comentarios (`POST /api/tickets/comentarios`), visibles también para quien luego lo revise.

### Servicio

- **`services/ticketsService.ts`**: `listTiposTicket()` → `GET /api/tipos-ticket` (catálogo ya filtrado server-side por `roles_creador` del rol autenticado — el frontend no vuelve a filtrar); `listTickets(params)` → `GET /api/tickets` (bandeja, filtrable por `tipo_ticket_id`/`estado`/`creado_por_id`); `getTicket(id)` → `GET /api/tickets/:id`; `agregarComentario(ticketId, mensaje)` → `POST /api/tickets/comentarios`; `crearTicketExcepcionDateo(payload)` → `POST /api/tickets-excepcion-dateo`; `aprobarTicketExcepcionDateo(id, conComision?: boolean)` → `PATCH /api/tickets-excepcion-dateo/:id/aprobar` con body `{ con_comision }` (🆕 2026-08-28, reemplaza el `porcentajePenalizacion` viejo — se omite/ignora cuando el ticket está dentro de ventana); `rechazarTicketExcepcionDateo(id, motivo)` → `PATCH /api/tickets-excepcion-dateo/:id/rechazar`. **Ya no existen** `getSaldoPenalizaciones`/`cobrarSaldoPenalizaciones` ni sus tipos (`MovimientoPenalizacion`, `SaldoPenalizacionesResponse`, etc.) — eliminados junto con todo el sistema de saldo de penalizaciones (ver changelog 2026-08-28 y módulo Backend).

### Integración con Comercial → Dateos y Ficha del Asesor

- **`DateoCreate.vue`** (ver sección 4.2): **todo** turno walk-in de hoy sin dateo vinculado rechaza con 409 `code: 'REQUIERE_TICKET_DATEO'` — ya no existe una ventana de minutos que deje pasar el dateo normal (ese comportamiento, con el código `VENTANA_DATEO_VENCIDA`, fue retirado). A diferencia de los demás modales 409 (`DATEO_ACTIVO_EXCEPCION_DISPONIBLE`, `RTM_VIGENTE_EXCEPCION_DISPONIBLE`) **no** ofrece ninguna vía de excepción in-place — nunca hubo ni hay "continuar sin ticket". El modal cambia solo de tono según `dentroVentana` (booleano que manda el backend, calculado con la ventana configurable — ver la sección de configuración en `TicketsList.vue` más abajo): ícono/color `info`+"Debes registrar un ticket, pero no tendrá penalización" si `dentroVentana`, o `error`+minutos de exceso en rojo si no — pero en **ambos** casos el único botón ("Crear ticket de excepción", `irACrearTicketExcepcionDateo()`) navega a `TicketExcepcionDateoCreate` con `turno_id` y `placa` precargados por query string. El aviso legacy `turnoVinculadoRetroactivo` (dateo normal vinculado en silencio dentro de la ventana vieja) fue eliminado junto con el código muerto — ya no puede ocurrir.
- **`FichaComercialAsesor.vue`**: la pestaña "Penalizaciones" que existía acá (saldo del asesor, tabla de movimientos CARGO/ABONO, modal "Cobrar saldo" vía `COMISION`/`NOMINA`) **fue eliminada por completo el 2026-08-28** — tab, contenido, modal y todas las funciones/imports relacionados (`cargarPenalizaciones`, `abrirCobrarSaldo`, `verificarCumplimientoMeta`, `confirmarCobro`, `cobrarDialog`, etc.), junto con el resto del sistema de saldo de penalizaciones (ver changelog y módulo Backend). El KPI "💰 Saldo" que sigue visible en la cabecera de la ficha (`saldoEstimado = kpi.montoGenerado - kpi.comisionesPagadas`) es una métrica completamente distinta — no tiene relación con esto, no se tocó.

### Roles

- Bandeja `/tickets` y detalle `/tickets/:id`: cualquier rol autenticado — el backend filtra server-side qué tickets ve cada uno (`tickets_controller.ts::index()`).
- Crear ticket Excepción de Dateo (`/tickets/excepcion-dateo/nuevo`): `COMERCIAL, SUPER_ADMIN, GERENCIA` (`meta.roles` en el router, además reforzado server-side).
- Aprobar/Rechazar Excepción de Dateo: `SUPER_ADMIN, GERENCIA` (`rolesResuelve` del tipo de ticket, sembrado en la migración `...0006_insert_tipo_ticket_excepcion_dateo.ts`; sin `meta.roles` propio en el router porque la ruta `/tickets/:id` es compartida por cualquier tipo de ticket futuro — el gating de las acciones de resolución es dentro del componente).
- **🆕 Configurar ventana de ticket (global + overrides por asesor)** en `TicketsList.vue`: `usePermissions.ts::configurarVentanaTicket()` → `SUPER_ADMIN, GERENCIA` (`auth.hasAnyRole(['SUPER_ADMIN', 'GERENCIA'])`). Gating puramente visual (`v-if` sobre el expansion panel), como el resto de permisos de este composable — reforzado server-side en los 5 endpoints `/api/tickets/config/ventana*`.

---

## Archivos sin usar / fuera del router

- **`views/Vistadesarrollo.vue`** — pantalla genérica "🚧 ¡Estamos Mejorando! 🚧" (placeholder de módulo en construcción, con botón "Volver"). **No está registrada en `src/router/index.ts`** ni referenciada desde ningún otro archivo (`grep` de `Vistadesarrollo` no arroja resultados fuera de sí misma) — parece un componente huérfano de una funcionalidad retirada o pendiente de enlazar. No borrar sin confirmar con el equipo si estaba pensado para algo específico.
- **`views/reportes/SuperInformePreview.vue`** — no tiene ruta propia, pero **no está huérfano**: es importado directamente como componente hijo por `SuperInforme.vue` para renderizar la previsualización antes de generar el PDF.

---

## 10. Patrones establecidos del proyecto

Reutilizar estos patrones en cualquier feature nueva en vez de inventar de nuevo.

### 10.1 Motor HTTP

`src/services/http.ts` es el motor central: `get/post/put/patch/del/upload/download`. Autoinyecta `Authorization: Bearer <token>` leyendo `sessionStorage` **o** `localStorage` (en ese orden). Content-Type automático (`application/json` salvo `FormData`). Errores no-2xx lanzan `HttpError(status, message, data)`. **Nuevos servicios deben usar este motor**, no reinventar `fetch()` propio — varios servicios más antiguos (`comisionesService.ts`, `prospectosService.ts`, `comprobantesService.ts`, `reportesAdminService.ts`, `captacionCanalesService.ts`) tienen su propio `apiFetch` duplicado; es deuda técnica, no un patrón a copiar.

### 10.2 Descarga de archivos (Excel/PDF/imágenes)

Cuatro variantes conviven — elegir según de dónde sale el archivo:

1. **Excel generado 100% en el cliente con la librería `xlsx`** — el patrón **dominante en Reportes Administrativos** (`ReporteIngresosCanal`, `ReporteProduccionLider`, `ReporteAsesores`, `ReporteDescuentos`, `ReporteServicios`, etc.): la vista ya tiene los datos en JSON (los pidió para pintar la tabla), arma `encabezados`/`filas` a mano y una función local `exportarExcel(nombreBase, encabezados, filas)` (duplicada en cada vista, candidata a extraerse a un composable) hace `XLSX.utils.aoa_to_sheet` → negrita en la fila de headers → `XLSX.utils.book_new()` + `book_append_sheet` → `XLSX.writeFile(wb, '<Nombre>_<inicio>_<fin>.xlsx')`. No pasa por `http.ts` ni por el backend — úsalo cuando el archivo es solo una re-presentación de datos que el frontend ya tiene.
2. **`download()` de `http.ts`** (`expectJson:false`, devuelve `Blob`) — para cuando el **backend genera el archivo** (PDF con formato fijo, Excel con cálculos que solo existen en el servidor). Ejemplo: `reportesAdminService.descargarSuperInformePdf`, `tramiteLiquidacionService.exportPdf`, `turnosdeldiaService.exportTurnosExcel`, `descargarLiquidacionRtmExcel`/`descargarTrazabilidadRtmExcel`/`descargarHistorialLiquidacionesExcel`. Patrón de materialización del blob: `URL.createObjectURL(blob)` → `<a download>` creado por JS → `.click()` → `removeChild` → `revokeObjectURL`.
3. **Link directo** `:href="url" target="_blank" download` cuando el backend sirve el archivo como estático público (contratos, recomendaciones médicas, certificados de afiliación) — el navegador maneja la descarga.
4. **Fetch + blob manual** cuando se necesita mostrar la imagen en un `<img>` con autenticación (el endpoint no es público): `fetch(url, {headers:{Authorization}})` → `blob()` → `URL.createObjectURL()` → asignar a `src`, y **siempre** `URL.revokeObjectURL()` en `onBeforeUnmount`/al cerrar el diálogo para no filtrar memoria. Ver `FacturacionHistorico.loadImageBlob()`, `RazonSocialView.downloadFile()`, `FacturacionService.getDocumentoPoliciaBlob()`, `Descuentoshistorial.vue` (evidencia de avance y documentos de policía, usando `get`/`download` de `http.ts` directo sin pasar por `descuentosService.ts`).

Evitar `window.open(url, '_blank')` directo a un endpoint API (usado solo en `TurnosDelDia.downloadExcelDia()`) — no funciona si el endpoint requiere Bearer token, porque el navegador no manda el header.

**Impresión (caso especial, sin librería PDF):** `ComprobanteDetalle.vue` (Comercial → Comprobantes) genera un string HTML completo con estilos inline, lo escribe en `window.open('', '_blank')` y dispara `window.print()` en el `onload` de esa ventana — no usa `jspdf` ni pide un PDF al backend.

### 10.3 Feedback de acciones

- **`v-snackbar`** con `ref({show, message/text, color})` y función `showSnackbar()`/`notify()` (éxito/error/warning, timeout 3000-4000ms) — en absolutamente todas las vistas.
- **`components/UI/ConfirmarDialogo.vue`** — dialog de confirmación genérico reutilizado en todo el proyecto: `v-model` boolean, props `title/message/confirmText/confirmColor`, emite `confirm`/`cancel`. Patrón estándar: armar `confirmDialogTitle/Message/ConfirmText/ConfirmColor` + una variable `currentAction` (string) antes de abrir el diálogo, y un único `handleConfirmAction()` con `switch`/`if` sobre `currentAction` ejecuta la mutación real tras confirmar. Ejemplo canónico: `UsuariosView.vue`, `TramitesView.vue` (usa el mismo componente pero renombrado `ConfirmarDialogo`).
- **Locks anti-doble-click**: `isProcessing`/`isSaving` ref + objeto `inFlight = {create, update, delete, ...}` para deshabilitar botones y evitar llamadas duplicadas mientras una request está en vuelo.
- **Errores HTTP específicos**: inspeccionar `status` (409 = duplicado, 422 = validación con `data.errors[]`) para mensajes de error más útiles que el genérico.

### 10.4 Paginación

**No hay un patrón único** — depende de si el volumen de datos lo justifica:
- **Client-side** (`v-data-table` con todos los datos en memoria, filtrado/ordenado por `computed`): usado en la mayoría de listados medianos (Usuarios, Turnos del Día, Comisiones simples). No manda `page`/`limit` al backend.
- **Server-side** (`v-data-table-server` con `@update:options`, `items-length`, `page`/`itemsPerPage` en el request): usado donde el volumen puede ser grande — `FacturacionHistorico.vue` es el ejemplo canónico (`onUpdateOptions` sincroniza `pagination.value` y vuelve a pedir al backend).
- Los servicios que sí paginan devuelven formas de respuesta inconsistentes entre sí (`{data, total, page, perPage}`, `{data, meta:{total, current_page, per_page}}`, `{items}`, `{rows}`) — casi todos los servicios nuevos incluyen un **normalizador de shape** propio (`normalizeListShape`) para tolerar esto. Si se agrega un endpoint paginado nuevo, preferir devolver `{data, meta:{total, current_page, per_page, last_page}}` (el shape más común) y usar/copiar un `normalizeListShape` existente en el cliente.

### 10.5 Normalización de respuestas

Helper `toArray<T>(data)` (o `normalizeListShape`) repetido en casi cada servicio para tolerar que el backend devuelva array plano, `{data:[]}`, `{rows:[]}`, o `{items:[]}` indistintamente. **Copiar este patrón** en servicios nuevos evita romper la UI si el backend cambia el envoltorio de respuesta sin avisar.

### 10.6 Trazabilidad / auditoría ("quién hizo qué")

- **Header `x-actor-id`** o campo `actorId`/`autorizado_por_id`/`confirmado_por_id` inyectado automáticamente vía helper `getActorId()` (busca en `localStorage`/`sessionStorage` bajo varias claves posibles: `actorId`, `userId`, `user`, etc.) en los servicios de Contratos y en el flujo de descuentos de Facturación/Comisiones.
- **Origen dual de una acción** (patrón "pre-marcado vs. manual"): se repite en Descuentos (`origen: 'dateo' | 'caja'`), Liquidaciones (`tipo_origen: 'MODAL_LIQUIDAR' | 'TABLA_GENERAL' | 'PANEL_ASESOR'`) — siempre guardando quién y cuándo confirmó/autorizó, no solo el resultado final.

### 10.7 Formularios grandes / multi-sección

Contratos y Facturación (subir ticket) comparten el patrón de **formulario largo con validación condicional dinámica** (`vee-validate` con `useForm`/`useField`, reglas que cambian según otro campo — ej. `terminoContrato` obligatorio solo si `tipoContrato==='prestacion'`). Para formularios grandes nuevos, preferir extraer el formulario a un componente propio (`FormularioContrato.vue`) en vez de dejarlo inline en la vista, y usar composables (`useContratosFilters`, `useMaestrosRRHH`, `useContratoTermOptions`) para separar la carga de catálogos del estado del formulario.

### 10.8 Captura de evidencia (imagen)

Dropzone + paste (Ctrl+V) + zoom/rotación es un patrón exacto repetido en 3 lugares (`CertificacionTurnoView.vue`, `FacturacionSubirTicket.vue`, y parcialmente en Dateos): `@dragover.prevent`/`@drop.prevent`, `window.addEventListener('paste', ...)` en `onMounted`/removido en `onBeforeUnmount`, `URL.createObjectURL(file)` para preview, `imageRotation`/`imageScale` refs aplicados vía CSS `transform: rotate() scale()`. Vale la pena extraerlo a un composable/componente compartido si se necesita una cuarta vez.

### 10.9 Guard de rutas

**No existe** `router.beforeEach` en `src/router/index.ts`. El control de acceso es:
1. Visual: `v-if="can.xxx()"` en `AppSidebar.vue` oculta el link si el rol no aplica, pero la URL sigue siendo navegable directamente si se conoce.
2. Declarativo parcial: rutas nuevas (Trámites, Reportes Admin, Tarifas Servicios) sí declaran `meta.roles: string[]` — pero **nada en el router actual lee ese meta** para bloquear la navegación (no hay guard); solo queda como metadato disponible para quien quiera implementar el guard después.
3. El redirect post-login por rol vive en `AuthStore.checkAuth()`, no en el router.

Si se necesita proteger de verdad por URL, sería necesario agregar un `router.beforeEach` que lea `to.meta.roles` y compare contra `authStore.hasAnyRole()` — hoy no existe.
