// "Preguntar" sobre un turno todavía sin llamar viaja en ultimosLlamados con
// enModulo=false SOLO para disparar modal + voz: PanelEntrega no debe
// pintarlo en el hero ni en el histórico (el turno ya se ve en la cola de la
// izquierda — no se duplica). Una pregunta sobre un turno YA llamado
// (enModulo=true) sí se pinta, con "Por favor acérquese a" / "Pregunta · …".
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PanelEntrega from '../PanelEntrega.vue'
import type { TurnoLlamado } from '../../composables/useTurnos'

function llamado(
  id: string,
  llamadoEn: string,
  tipoLlamado: TurnoLlamado['tipoLlamado'],
  enModulo: boolean
): TurnoLlamado {
  return {
    id,
    placa: `PLC${id}`,
    turno: id,
    canal: 'RTM',
    modulo: `Módulo ${id} - Caja RTM`,
    llamadoEn,
    tipoLlamado,
    enModulo,
  }
}

describe('PanelEntrega', () => {
  it('no pinta en hero ni histórico una pregunta sobre un turno sin llamar (enModulo=false)', () => {
    const wrapper = mount(PanelEntrega, {
      props: {
        hablando: false,
        turnos: [
          llamado('9', '2026-01-01T12:00:00.000-05:00', 'pregunta', false),
          llamado('5', '2026-01-01T11:00:00.000-05:00', 'modulo', true),
          llamado('6', '2026-01-01T10:00:00.000-05:00', 'modulo', true),
        ],
      },
    })

    const texto = wrapper.text()
    expect(texto).not.toContain('PLC9')
    // El hero pasa a ser el llamado real más reciente, no la pregunta.
    expect(wrapper.find('.panel-entrega__hero-placa').text()).toBe('PLC5')
    expect(wrapper.find('.panel-entrega__hero-instruccion').text()).toBe('Diríjase a')
    expect(wrapper.findAll('.fila-entrega')).toHaveLength(1)
  })

  it('pinta una pregunta sobre un turno ya llamado (enModulo=true) con su texto propio', () => {
    const wrapper = mount(PanelEntrega, {
      props: {
        hablando: false,
        turnos: [
          llamado('5', '2026-01-01T12:00:00.000-05:00', 'pregunta', true),
          llamado('6', '2026-01-01T11:00:00.000-05:00', 'pregunta', true),
        ],
      },
    })

    expect(wrapper.find('.panel-entrega__hero-instruccion').text()).toBe('Por favor acérquese a')
    expect(wrapper.find('.panel-entrega__hero-modulo').text()).toBe('Módulo 5 - Caja RTM')
    expect(wrapper.find('.fila-entrega__celda--modulo').text()).toBe('Pregunta · Módulo 6 - Caja RTM')
  })
})
