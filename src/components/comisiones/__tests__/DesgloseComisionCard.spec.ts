// La tarjeta solo muestra el desglose del backend. Por defecto: quién cobra
// (antes → después), la diferencia, el estado y los avisos cortos; el caso,
// el descuento, la regla, la configuración y la explicación van en el panel
// "Ver cómo se calculó". Aquí se prueba qué muestra, no el dibujo de Vuetify.
import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import DesgloseComisionCard from '../DesgloseComisionCard.vue'
import type { DesgloseComision } from '@/services/desgloseComision'

const STUBS = {
  ...Object.fromEntries(
    [
      'v-card',
      'v-chip',
      'v-spacer',
      'v-table',
      'v-alert',
      'v-expansion-panel',
      'v-expansion-panel-title',
    ].map((n) => [n, { template: '<div><slot /></div>' }]),
  ),
  'v-expansion-panels': {
    props: ['modelValue'],
    template: '<div data-stub="panels" :data-abierto="modelValue ?? \'\'"><slot /></div>',
  },
  'v-expansion-panel-text': { template: '<div data-test="panel-texto"><slot /></div>' },
}

const base = (d: Partial<DesgloseComision> = {}): DesgloseComision => ({
  estimado: false,
  recalculado: true,
  caso: 'CONVENIO_COMERCIAL',
  casoTexto: 'Comercial con convenio',
  escenario: 'NUEVO',
  escenarioTexto: 'Cliente nuevo',
  continuidad: { aplica: false, estado: null, texto: '' },
  tipoVehiculo: 'VEHICULO',
  descuento: { codigo: 'QAT-AVANCE', origen: 'DATEO', origenTexto: 'Del dateo', esAvance: true },
  regla: 'CASO3_COMERCIAL_CON_CONVENIO_AVANCE',
  explicacion: 'El asesor cobra su valor; el convenio queda en $0 por el avance.',
  reglaGuardada: 'CASO3_COMERCIAL_CON_CONVENIO_AVANCE',
  beneficiarios: [
    {
      rol: 'ASESOR_COMERCIAL',
      id: 1,
      nombre: 'QAT Comercial',
      tipo: null,
      cobraAsesorConvenio: null,
      antes: 8640,
      despues: 8640,
    },
    {
      rol: 'CONVENIO',
      id: 9,
      nombre: 'QAT Convenio',
      tipo: 'TALLER',
      cobraAsesorConvenio: { id: 7, nombre: 'QAT Asesor Convenio' },
      antes: 5000,
      despues: 0,
    },
  ],
  configuracion: [
    {
      campo: 'valor_asesor',
      etiqueta: 'Valor asesor',
      valor: 8640,
      fuente: 'GLOBAL',
      tabla: 'comision_configs',
      filaId: 2,
      asesorId: null,
      tipoVehiculo: 'VEHICULO',
      columna: 'base',
      usado: true,
    },
    {
      campo: 'incentivo',
      etiqueta: 'Incentivo convenio',
      valor: 0,
      fuente: 'FILA_PROPIA',
      tabla: 'comision_configs',
      filaId: 15,
      asesorId: 7,
      tipoVehiculo: 'VEHICULO',
      columna: 'incentivo',
      usado: false,
    },
  ],
  alertas: [],
  ...d,
})

const montar = (
  desglose: DesgloseComision,
  props: { estado?: string | null; enLiquidacion?: boolean } = {},
) =>
  mount(DesgloseComisionCard, {
    props: { desglose, estado: 'PENDIENTE', ...props },
    global: { stubs: STUBS },
    slots: { acciones: '<a data-test="accion">Corregir manualmente en Comisiones</a>' },
  })

// Intl pone espacios duros: se comparan solo los dígitos.
const digitos = (s: string) => s.replace(/\D/g, '')

/** Texto visible sin abrir el panel "Ver cómo se calculó". */
const visible = (w: VueWrapper) => {
  const panel = w.get('[data-test="panel-texto"]').text()
  return w.text().replace(panel, '')
}

describe('DesgloseComisionCard: lo que se ve por defecto', () => {
  it('título, chip de estado y el enlace del padre', () => {
    const w = montar(base())
    expect(w.text()).toContain('Comisión según este descuento')
    expect(w.get('[data-test="desglose-estado"]').text()).toBe('PENDIENTE')
    expect(w.get('[data-test="accion"]').text()).toBe('Corregir manualmente en Comisiones')
  })

  it('una fila por beneficiario con nombre, rol y antes → después', () => {
    const filas = montar(base()).findAll('[data-test="desglose-beneficiarios"] tbody tr')
    expect(filas).toHaveLength(2)
    expect(filas[0]!.text()).toContain('QAT Comercial')
    expect(filas[0]!.text()).toContain('Asesor comercial')
    expect(filas[1]!.text()).toContain('QAT Convenio')
    expect(filas[1]!.text()).toContain('Convenio')
    const monto = filas[1]!.findAll('td')[1]!
    expect(monto.text()).toContain('→')
    expect(digitos(monto.text())).toBe('50000')
    expect(monto.find('strong').classes()).toContain('text-red-darken-2')
    const sinCambio = filas[0]!.findAll('td')[1]!.find('strong').classes()
    expect(sinCambio).not.toContain('text-red-darken-2')
    expect(sinCambio).not.toContain('text-green-darken-2')
  })

  it('Caso 2: una sola fila, "Asesor convenio"', () => {
    const w = montar(
      base({
        caso: 'CONVENIO_SELF',
        beneficiarios: [
          {
            rol: 'ASESOR_CONVENIO',
            id: 7,
            nombre: 'QAT Asesor Convenio',
            tipo: null,
            cobraAsesorConvenio: null,
            antes: 0,
            despues: 0,
          },
        ],
      }),
    )
    const filas = w.findAll('[data-test="desglose-beneficiarios"] tbody tr')
    expect(filas).toHaveLength(1)
    expect(filas[0]!.text()).toContain('Asesor convenio')
  })

  it('diferencia total con signo, "Sin cambio" o el total estimado', () => {
    const baja = montar(base()).get('[data-test="desglose-diferencia"]')
    expect(baja.text()).toMatch(/^Diferencia:\s*−/)
    expect(digitos(baja.text())).toBe('5000')
    expect(baja.find('strong').classes()).toContain('text-red-darken-2')

    const igual = base()
    igual.beneficiarios = igual.beneficiarios.map((b) => ({ ...b, despues: b.antes! }))
    expect(montar(igual).get('[data-test="desglose-diferencia"]').text()).toBe('Sin cambio')

    const est = base({ estimado: true })
    est.beneficiarios = est.beneficiarios.map((b) => ({ ...b, antes: null, despues: 4300 }))
    const w = montar(est, { estado: null })
    expect(w.get('[data-test="desglose-diferencia"]').text()).toMatch(/^Estimado:/)
    expect(digitos(w.get('[data-test="desglose-diferencia"]').text())).toBe('8600')
    expect(w.get('[data-test="desglose-estado"]').text()).toBe('ESTIMADO')
    expect(w.get('[data-test="desglose-beneficiarios"]').text()).not.toContain('→')
  })

  it('avisos cortos solo si aplican; los demás quedan en el panel', () => {
    const sinAvisos = montar(base())
    expect(sinAvisos.findAll('[data-test^="desglose-aviso-"]')).toHaveLength(0)

    const w = montar(
      base({
        alertas: [
          { codigo: 'CONFIG_EN_CERO', tipo: 'warning', mensaje: 'Incentivo en $0 (fila #15).' },
          { codigo: 'CONFIG_EN_CERO', tipo: 'warning', mensaje: 'Base en $0 (fila #2).' },
          { codigo: 'SIN_COMISION_TICKET', tipo: 'warning', mensaje: 'Ticket #1843 sin comisión.' },
          { codigo: 'SIN_CONTINUIDAD', tipo: 'warning', mensaje: 'Continuidad vacía, largo.' },
          {
            codigo: 'DISTINTO_AL_MOTOR',
            tipo: 'error',
            mensaje: 'Lo guardado no es lo del motor.',
          },
        ],
      }),
      { estado: 'PAGADA' },
    )
    const avisos = w.findAll('[data-test^="desglose-aviso-"]').map((a) => a.text())
    expect(avisos).toEqual([
      'Comisión ya pagada',
      'Valor en $0 por la configuración',
      'Ticket aprobado «sin comisión»',
      'Continuidad vacía: no se recalculó',
    ])
    expect(visible(w)).not.toContain('Lo guardado no es lo del motor.')
    expect(w.get('[data-test="desglose-alerta-DISTINTO_AL_MOTOR"]').text()).toBe(
      'Lo guardado no es lo del motor.',
    )
    expect(w.get('[data-test="desglose-estado"]').text()).toBe('PAGADA')
  })

  it('en liquidación también avisa', () => {
    const w = montar(base(), { estado: 'APROBADA', enLiquidacion: true })
    expect(w.get('[data-test="desglose-aviso-EN_LIQUIDACION"]').text()).toBe(
      'Comisión ya en una liquidación',
    )
  })

  it('no muestra caso, descuento, regla, configuración ni explicación fuera del panel', () => {
    const v = visible(montar(base()))
    for (const t of [
      'Comercial con convenio',
      'Cliente nuevo',
      'QAT-AVANCE',
      'Del dateo',
      'CASO3_COMERCIAL_CON_CONVENIO_AVANCE',
      'Valor asesor',
      'El asesor cobra su valor',
    ]) {
      expect(v).not.toContain(t)
    }
  })
})

describe('DesgloseComisionCard: panel "Ver cómo se calculó"', () => {
  it('cerrado por defecto', () => {
    const w = montar(base())
    expect(w.text()).toContain('Ver cómo se calculó')
    expect(w.get('[data-stub="panels"]').attributes('data-abierto')).toBe('')
  })

  it('caso, escenario, vehículo, descuento con origen y marca de avance', () => {
    const w = montar(base())
    expect(w.get('[data-test="desglose-caso"]').text()).toMatch(
      /Comercial con convenio\s*· Cliente nuevo\s*· Carro/,
    )
    const d = w.get('[data-test="desglose-descuento"]').text()
    expect(d).toContain('QAT-AVANCE · Del dateo')
    expect(d).toContain('El dateo trae marca de avance')
  })

  it('regla y regla guardada solo si son distintas; "Sin recalcular"', () => {
    expect(montar(base()).get('[data-test="desglose-regla"]').text()).not.toContain(
      'Regla guardada hoy',
    )
    const w = montar(base({ reglaGuardada: 'CASO1_NUEVO_DIRECTO', recalculado: false }))
    const t = w.get('[data-test="desglose-regla"]').text()
    expect(t).toContain('El asesor cobra su valor')
    expect(t).toContain('Regla: CASO3_COMERCIAL_CON_CONVENIO_AVANCE')
    expect(t).toContain('Regla guardada hoy: CASO1_NUEVO_DIRECTO')
    expect(w.get('[data-test="desglose-caso"]').text()).toContain('Sin recalcular')
  })

  it('configuración: origen de cada valor y "no interviene"; el cero usado en rojo', () => {
    const filas = montar(base()).findAll('[data-test="desglose-config"]')
    expect(filas[0]!.text()).toContain('(Global #2 · VEHICULO · base)')
    expect(filas[1]!.text()).toContain('(Fila propia #15 · VEHICULO · incentivo)')
    expect(filas[1]!.text()).toContain('no interviene')
    expect(filas[1]!.find('strong').classes()).not.toContain('text-red-darken-2')

    const d = base()
    d.configuracion[1] = { ...d.configuracion[1]!, usado: true }
    const cero = montar(d).findAll('[data-test="desglose-config"]')[1]!
    expect(cero.find('strong').classes()).toContain('text-red-darken-2')
  })
})
