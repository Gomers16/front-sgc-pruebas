// Todos los tiempos, cantidades y catálogos configurables de la pantalla del
// Turnero salen de aquí. Nada de valores incrustados en componentes o
// composables: si hay que cambiar un número, se cambia en una sola línea de
// este archivo, nunca buscando dónde quedó escrito.

// Cuántos turnos finalizados se muestran en "Llamando ahora", del más reciente
// al más antiguo. El primero (el más reciente) es el llamado activo y domina
// la columna; el resto es historial compacto. Si el back entrega más, el
// front solo pinta los primeros N tal como vienen (ver PanelEntrega.vue).
export const CANTIDAD_ULTIMOS_LLAMADOS = 5

// Duración que permanece abierto el modal de llamado, en milisegundos. Con
// la locución por clips (pitido + "turno con placa" + placa letra por letra +
// instrucción + módulo) el anuncio dura ~8 s; 12 s le dan margen a un TV
// lento cargando clips sin que el siguiente llamado lo corte.
export const DURACION_MODAL_MS = 12000

// Margen entre el cierre de un modal y la apertura del siguiente en la cola,
// para que el cambio se perciba como dos llamados distintos y no como un
// parpadeo.
export const PAUSA_ENTRE_MODALES_MS = 400

// Ruta del sonido que suena al abrir cada modal (ver useAlarma.ts). Calculada
// con `new URL(...)` para que Vite resuelva el archivo con el hash correcto
// en el build de producción.
export const RUTA_SONIDO_LLAMADO = new URL('../assets/sonidos/llamado.wav', import.meta.url).href

// Si el pitido no dispara 'ended' (pasa en navegadores de TV viejos), la
// locución arranca igual pasado este tiempo. El pitido dura ~0.35 s.
export const PITIDO_TIMEOUT_MS = 3000

// Cada cuánto se refresca la cola contra el backend, en milisegundos.
export const INTERVALO_POLL_MS = 8000

// Cada cuánto se refresca el catálogo de multimedia y de mensajes del ticker
// contra el backend — cambian poco (los edita un admin desde
// ConfiguracionTurnero.vue), así que no hace falta el mismo ritmo que la cola
// de turnos. Un refresco de catálogo NUNCA interrumpe lo que se está
// reproduciendo — ver PanelPublicidad.vue.
export const INTERVALO_POLL_MULTIMEDIA_MS = 30000
export const INTERVALO_POLL_TICKER_MS = 30000

// Cuánto se muestra una imagen en el panel de publicidad cuando su
// duracionSegundos viene nula o en cero (no debería pasar vía el formulario
// de ConfiguracionTurnero.vue, pero es el respaldo si igual ocurre).
export const DURACION_IMAGEN_DEFECTO_SEGUNDOS = 8

// Velocidad de lectura de la cinta de mensajes (ver CintaMensajes.vue), en
// caracteres por segundo: la duración de la animación se deriva de ella
// para que la velocidad se sienta constante sin importar cuántos mensajes
// estén activos, en vez de una duración fija que haría un mensaje corto
// pasar volando y uno largo arrastrarse. CintaMensajes.vue la convierte a
// px/s con el ancho real medido del texto (cada copia de la cinta mide al
// menos el ancho de la pantalla); useMensajesTicker.ts calcula además una
// duración solo por caracteres, que queda como respaldo hasta tener esa
// medición. MIN/MAX acotan la duración de una vuelta en ambos casos.
export const TICKER_CARACTERES_POR_SEGUNDO = 12
export const TICKER_DURACION_MIN_S = 10
export const TICKER_DURACION_MAX_S = 90

// Masthead informativo (ciudad + fecha + hora en vivo, ver MastheadInfo.vue).
// Ciudad en su propia constante para que instalar el turnero en otro CDA sea
// cambiar una sola línea acá, no tocar el componente.
export const CIUDAD_TURNERO = 'Ibagué'

// Fija a Colombia a propósito: el reloj y la fecha deben leerse en esta zona
// horaria sin importar cómo esté configurado el sistema operativo del PC del
// kiosco (evita que un reloj de Windows mal configurado descuadre la hora
// mostrada en la sala de espera).
export const ZONA_HORARIA_TURNERO = 'America/Bogota'
export const LOCALE_FECHA_HORA_TURNERO = 'es-CO'

// Cada cuánto se refresca el reloj del masthead. Cada minuto alcanza — un
// tick por segundo sería ruido visual innecesario en una pantalla que se lee
// de lejos y no necesita precisión de segundos.
export const INTERVALO_ACTUALIZACION_RELOJ_MS = 60000

// Anuncio de voz del llamado (ver useVozTurno.ts). No hay garantía de que
// Chrome/Edge tengan instalada una voz es-CO exacta, así que se prueba en
// este orden hasta encontrar una disponible: variante exacta de Colombia,
// luego variantes latinoamericanas (acento más cercano que el ibérico),
// y de ahí cualquier voz en español. Si instalar el turnero en otro país
// hace falta priorizar otra variante, se cambia acá, no en el composable.
export const PREFERENCIA_IDIOMA_VOZ = ['es-CO', 'es-419', 'es-MX', 'es-US']

// Lista fija de módulos físicos del CDA (ver TurnosParaLlamar.vue). El texto
// completo de cada opción es lo que se guarda tal cual en
// turno_llamados.modulo y usuario_preferencia_modulo.ultimo_modulo, y lo que
// se lee en voz alta en useVozTurno.ts — nunca se abrevia, así una sola
// línea acá cambia lo que se ve en pantalla, lo que queda en base de datos y
// lo que se anuncia. Orden exacto de negocio, no alfabético.
export const MODULOS_TURNERO = [
  'Módulo 1 - Caja SOAT',
  'Módulo 2 - Caja SOAT',
  'Módulo 3 - Caja SOAT',
  'Módulo 4 - Entrega',
  'Módulo 5 - Caja RTM',
  'Módulo 6 - Caja RTM',
] as const

export type ModuloTurnero = (typeof MODULOS_TURNERO)[number]

// Valor por defecto cuando la preferencia guardada del usuario no coincide
// con ninguna de las 6 opciones fijas (p. ej. datos de prueba viejos con
// texto libre tipo "Caja 2") — cae acá en vez de romper el select o mostrar
// un valor inválido. Ver TurnosParaLlamar.vue::cargarTurnos().
export const MODULO_TURNERO_DEFECTO: ModuloTurnero = MODULOS_TURNERO[0]

// Locución por clips pregrabados (ver useClipsAnuncio.ts): cada módulo es UN
// clip en assets/sonidos/voz/ con el módulo completo ("módulo cinco, caja
// RTM"). El Record obliga a que los 6 tengan clip; si cambia un texto de
// MODULOS_TURNERO hay que cambiarlo también en scripts/generar-clips-voz.py y
// regenerar. Un módulo guardado que no sea uno de los 6 se anuncia con
// speechSynthesis (respaldo).
export const CLIPS_VOZ_MODULO: Record<ModuloTurnero, string> = {
  'Módulo 1 - Caja SOAT': 'modulo-1',
  'Módulo 2 - Caja SOAT': 'modulo-2',
  'Módulo 3 - Caja SOAT': 'modulo-3',
  'Módulo 4 - Entrega': 'modulo-4',
  'Módulo 5 - Caja RTM': 'modulo-5',
  'Módulo 6 - Caja RTM': 'modulo-6',
}

// Si un clip no dispara 'ended' ni 'error' en este tiempo, se salta al
// siguiente. El clip más largo (modulo-6) dura ~2.5 s.
export const CLIP_VOZ_TIMEOUT_MS = 4000

// Página de prueba de la locución (/turnero/prueba-voz,
// TurneroPruebaVozView.vue): existe en `npm run dev` y, en un build, solo si
// se compila con VITE_TURNERO_PRUEBA_VOZ=true (para probar en el TV). En el
// build normal la ruta no se registra y su código no entra al bundle.
export const PRUEBA_VOZ_HABILITADA =
  import.meta.env.DEV || import.meta.env.VITE_TURNERO_PRUEBA_VOZ === 'true'

// Llamado de pregunta (tipoLlamado === 'pregunta', botón "Preguntar" en
// TurnosParaLlamar.vue): siempre con el módulo REAL — solo cambia la
// instrucción, para distinguirlo a simple vista de un llamado a módulo
// ("Diríjase a"). En pantalla no se repite "Turno con placa …" porque la
// placa ya se ve en grande al lado; la voz sí dice la frase completa (ver
// useVozTurno.ts): "Turno con placa {placa}, por favor acérquese al {módulo}."
//  - Hero (PanelEntrega.vue) y modal (ModalLlamado.vue): esta instrucción +
//    el módulo debajo.
//  - Histórico (TarjetaEntrega.vue): "{PREFIJO} · {módulo}".
export const INSTRUCCION_LLAMADO_PREGUNTA = 'Por favor acérquese a'
export const PREFIJO_HISTORICO_PREGUNTA = 'Pregunta'
