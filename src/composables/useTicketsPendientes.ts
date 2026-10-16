// src/composables/useTicketsPendientes.ts
//
// Contador de tickets pendientes (GET /tickets/pendientes/contador) compartido
// por la insignia del menú lateral y la bandeja. Solo SUPER_ADMIN/GERENCIA
// (el backend responde 403 a los demás). Estado a nivel de módulo: todas las
// vistas ven el mismo número y cualquiera puede refrescarlo (p. ej. después de
// aprobar o rechazar).

import { ref } from 'vue'
import { getContadorPendientesTickets } from '@/services/ticketsService'

const pendientes = ref<number | null>(null)
let enCurso: Promise<void> | null = null

export function useTicketsPendientes() {
  async function refrescarPendientes() {
    if (enCurso) return enCurso
    enCurso = getContadorPendientesTickets()
      .then((r) => {
        pendientes.value = r.pendientes
      })
      .catch(() => {
        // Sin permiso o sin red: no se muestra la insignia.
        pendientes.value = null
      })
      .finally(() => {
        enCurso = null
      })
    return enCurso
  }

  return { pendientes, refrescarPendientes }
}
