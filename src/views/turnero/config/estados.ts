// Catálogo de estados de la columna "Seguimiento". El orden de aparición en
// pantalla (por_llamar -> certificacion -> en_proceso) lo decide el backend
// en colaTurnero() (turno_llamados_controller.ts) — este archivo solo define
// cómo se ve cada uno, no en qué orden salen.
// Cuando un turno recibe su llamado deja de mostrarse aquí y pasa a la
// columna de la derecha (ver composables/useTurnos.ts).

export interface EstadoInfo {
  etiqueta: string
  color: string
}

export const ESTADOS: Record<string, EstadoInfo> = {
  en_proceso: {
    etiqueta: 'En proceso',
    color: 'var(--gris-azulado)',
  },
  // Exclusivo de RTM (RUNT es el registro nacional de tránsito) — ver el
  // guard en colaTurnero() que evita que otro servicio llegue a este estado
  // aunque tenga tieneFacturacion=true.
  certificacion: {
    etiqueta: 'Certificación RUNT',
    color: 'var(--amarillo)',
  },
  // Turno ya finalizado/certificado, esperando a que lo llamen a un módulo
  // (mismo turno que alimenta TurnosParaLlamar.vue del lado admin). Color
  // propio, distinto de los de canal (--canal-*) y de los otros dos estados,
  // para que se distinga de un vistazo como "el más avanzado de los tres".
  por_llamar: {
    etiqueta: 'Listo para entregar',
    color: '#22D3EE', // cian — no colisiona con --canal-rtm (#4FA3FF), --canal-soat (amarillo), --canal-preventiva (#4ADE80) ni --canal-peri (#A78BFA)
  },
}

export function obtenerEstado(codigo: string): EstadoInfo {
  return ESTADOS[codigo] ?? { etiqueta: codigo, color: 'var(--gris-azulado)' }
}
