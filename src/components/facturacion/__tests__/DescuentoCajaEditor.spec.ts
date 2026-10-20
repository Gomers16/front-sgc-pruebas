// Reglas del bloque de descuento compartido por el modal de confirmación
// (FacturacionSubirTicket.vue) y la edición del Historial: monto fijo al
// máximo por vehículo, reinicio al cambiar de descuento, consecutivo con
// descuento en uso y documentos de Policía.
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DescuentoCajaEditor from '../DescuentoCajaEditor.vue'

vi.mock('@/services/facturacion_service', () => ({
  FacturacionService: {
    verificarConsecutivoDescuento: vi.fn(async (valor: string) => ({
      valor,
      valido: true,
      exists: false,
      bloqueante: false,
      tickets: [],
    })),
    subirDocumentoPolicia: vi.fn(),
  },
}))

// Vuetify como stubs (con su contenido): aquí se prueban las reglas, no el dibujo.
const STUBS = Object.fromEntries(
  [
    'v-card',
    'v-chip',
    'v-icon',
    'v-row',
    'v-col',
    'v-text-field',
    'v-slider',
    'v-select',
    'v-autocomplete',
    'v-alert',
    'v-textarea',
    'v-divider',
    'v-img',
    'v-progress-circular',
  ].map((n) => [n, { template: '<div><slot /></div>' }]),
)
const DESCUENTOS = [
  { id: 1, codigo: 'INFORMATIVO', nombre: 'Informativo', valorCarro: 50000, valorMoto: 30000 },
  {
    id: 3,
    codigo: 'INFORMATIVO_EMPLEADO',
    nombre: 'Informativo Empleado',
    valorCarro: 60000,
    valorMoto: 35000,
  },
  {
    id: 4,
    codigo: 'INFORMATIVO_POLICIA',
    nombre: 'Informativo Policía',
    valorCarro: 100000,
    valorMoto: 60000,
  },
]

function montar(props: Record<string, unknown> = {}) {
  return mount(DescuentoCajaEditor, {
    global: { stubs: STUBS },
    props: {
      modo: 'caja',
      descuentos: DESCUENTOS,
      usuarios: [{ id: 7, nombre: 'Gerente' }],
      esMoto: false,
      ticketId: 10,
      descuentoId: null,
      monto: 0,
      autorizadoPorId: null,
      observacion: '',
      consecutivo: '',
      ...props,
    },
  })
}
const ultimo = <T>(w: ReturnType<typeof montar>, ev: string) => w.emitted(ev)?.at(-1)?.[0] as T

describe('DescuentoCajaEditor', () => {
  it('monto fijo: al elegir Empleado el monto queda en el máximo del vehículo (g2)', async () => {
    const w = montar()
    await w.setProps({ descuentoId: 3 })
    expect(ultimo<number>(w, 'update:monto')).toBe(60000)

    const moto = montar({ esMoto: true })
    await moto.setProps({ descuentoId: 3 })
    expect(ultimo<number>(moto, 'update:monto')).toBe(35000)
  })

  it('otro descuento con monto libre: el monto y la observación vuelven a cero', async () => {
    const w = montar({ descuentoId: 3, monto: 60000, observacion: 'nota' })
    await w.setProps({ descuentoId: 1 })
    expect(ultimo<number>(w, 'update:monto')).toBe(0)
    expect(ultimo<string>(w, 'update:observacion')).toBe('')
  })

  it('el consecutivo se pide solo con descuento en uso; vacío queda bloqueado', async () => {
    const sin = montar()
    expect(sin.find('[data-test="consecutivo-descuento"]').exists()).toBe(false)
    const con = montar({ descuentoId: 1 })
    expect(con.find('[data-test="consecutivo-descuento"]').exists()).toBe(true)
    expect(ultimo<boolean>(con, 'update:consecutivoBloqueado')).toBe(true)
  })

  it('pre-marcado sin detalle (f3): sin selector, pero el consecutivo se pide igual', () => {
    const w = montar({
      modo: 'premarcado',
      descuentoPremarcadoId: 9,
      descuentoPremarcado: null,
      ocultarMonto: true,
    })
    expect(w.find('[data-test="descuento-selector"]').exists()).toBe(false)
    expect(w.find('[data-test="consecutivo-descuento"]').exists()).toBe(true)
  })

  it('Policía: pide los documentos; los que el ticket ya tiene cuentan como cargados', () => {
    const faltan = montar({ descuentoId: 4 })
    expect(faltan.text()).toContain('Documentos requeridos')
    expect(ultimo<boolean>(faltan, 'update:documentosCompletos')).toBe(false)

    const listos = montar({
      descuentoId: 4,
      documentosCargados: ['carnet', 'tarjeta_propiedad', 'cedula'],
    })
    expect(ultimo<boolean>(listos, 'update:documentosCompletos')).toBe(true)
  })
})
