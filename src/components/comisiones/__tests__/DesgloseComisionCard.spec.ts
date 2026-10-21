// La tarjeta solo muestra el desglose del backend: caso, descuento, quién
// cobra (antes/después o estimado), la regla, la configuración usada y las
// alertas. Aquí se prueba qué muestra, no el dibujo de Vuetify.
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DesgloseComisionCard from '../DesgloseComisionCard.vue'
import type { DesgloseComision } from '@/services/desgloseComision'

const STUBS = Object.fromEntries(
  ['v-card', 'v-chip', 'v-spacer', 'v-table', 'v-alert'].map((n) => [
    n,
    { template: '<div><slot /></div>' },
  ]),
)

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

const montar = (desglose: DesgloseComision, titulo?: string) =>
  mount(DesgloseComisionCard, {
    props: { desglose, ...(titulo ? { titulo } : {}) },
    global: { stubs: STUBS },
    slots: { acciones: '<a data-test="accion">Corregir</a>' },
  })

// Intl pone espacios duros: se comparan solo los dígitos.
const digitos = (s: string) => s.replace(/\D/g, '')

describe('DesgloseComisionCard', () => {
  it('título por defecto, caso, escenario, vehículo y la acción del padre', () => {
    const w = montar(base())
    expect(w.text()).toContain('Comisión según este descuento')
    expect(w.get('[data-test="desglose-caso"]').text()).toMatch(
      /Comercial con convenio\s*· Cliente nuevo\s*· Carro/,
    )
    expect(w.find('[data-test="accion"]').exists()).toBe(true)
    expect(montar(base(), 'Según el motor').text()).toContain('Según el motor')
  })

  it('descuento con su origen y la marca de avance', () => {
    const t = montar(base()).get('[data-test="desglose-descuento"]').text()
    expect(t).toContain('QAT-AVANCE · Del dateo')
    expect(t).toContain('El dateo trae marca de avance')
    const sin = montar(
      base({
        descuento: { codigo: null, origen: null, origenTexto: 'Sin descuento', esAvance: false },
      }),
    )
      .get('[data-test="desglose-descuento"]')
      .text()
    expect(sin).toContain('ninguno · Sin descuento')
    expect(sin).not.toContain('avance')
  })

  it('quién cobra: antes y después, con quién recibe la parte del convenio', () => {
    const w = montar(base())
    const filas = w.findAll('[data-test="desglose-beneficiarios"] tbody tr')
    expect(filas).toHaveLength(2)
    expect(filas[0]!.text()).toContain('QAT Comercial')
    expect(filas[0]!.text()).toContain('Asesor comercial')
    const celdas1 = filas[1]!.findAll('td')
    expect(filas[1]!.text()).toContain('Convenio · TALLER')
    expect(filas[1]!.text()).toContain('lo cobra QAT Asesor Convenio')
    expect(digitos(celdas1[1]!.text())).toBe('5000')
    expect(digitos(celdas1[2]!.text())).toBe('0')
    // La baja se marca en rojo; sin cambio, sin color.
    expect(celdas1[2]!.find('strong').classes()).toContain('text-red-darken-2')
    expect(filas[0]!.findAll('td')[2]!.find('strong').classes()).toEqual([])
    expect(w.get('[data-test="desglose-beneficiarios"] thead').text()).toMatch(/Antes\s*Después/)
  })

  it('estimado: chip ESTIMADO, sin columna "Antes"', () => {
    const d = base({ estimado: true })
    d.beneficiarios = d.beneficiarios.map((b) => ({ ...b, antes: null }))
    const w = montar(d)
    expect(w.find('[data-test="desglose-estimado"]').exists()).toBe(true)
    expect(w.get('[data-test="desglose-beneficiarios"] thead').text()).not.toContain('Antes')
    expect(w.get('[data-test="desglose-beneficiarios"] thead').text()).toContain('Estimado')
    const celdas = w.findAll('[data-test="desglose-beneficiarios"] tbody tr')[1]!.findAll('td')
    expect(celdas[1]!.text()).toBe('')
  })

  it('sin recalcular se avisa', () => {
    expect(montar(base({ recalculado: false })).text()).toContain('Sin recalcular')
    expect(montar(base()).text()).not.toContain('Sin recalcular')
  })

  it('regla y regla guardada solo si son distintas', () => {
    expect(montar(base()).get('[data-test="desglose-regla"]').text()).not.toContain(
      'Regla guardada hoy',
    )
    const t = montar(base({ reglaGuardada: 'CASO1_NUEVO_DIRECTO' }))
      .get('[data-test="desglose-regla"]')
      .text()
    expect(t).toContain('Regla: CASO3_COMERCIAL_CON_CONVENIO_AVANCE')
    expect(t).toContain('Regla guardada hoy: CASO1_NUEVO_DIRECTO')
  })

  it('configuración: origen de cada valor y "no interviene"; el cero usado en rojo', () => {
    const w = montar(base())
    const filas = w.findAll('[data-test="desglose-config"]')
    expect(filas[0]!.text()).toContain('(Global #2 · VEHICULO · base)')
    expect(filas[0]!.text()).not.toContain('no interviene')
    expect(filas[1]!.text()).toContain('(Fila propia #15 · VEHICULO · incentivo)')
    expect(filas[1]!.text()).toContain('no interviene')
    expect(filas[1]!.find('strong').classes()).not.toContain('text-red-darken-2')

    const d = base()
    d.configuracion[1] = { ...d.configuracion[1]!, usado: true }
    const cero = montar(d).findAll('[data-test="desglose-config"]')[1]!
    expect(cero.find('strong').classes()).toContain('text-red-darken-2')
  })

  it('muestra cada alerta del backend con su código', () => {
    const w = montar(
      base({
        alertas: [
          { codigo: 'CONFIG_EN_CERO', tipo: 'warning', mensaje: 'El incentivo está en $0.' },
          {
            codigo: 'DISTINTO_AL_MOTOR',
            tipo: 'error',
            mensaje: 'Lo guardado no es lo del motor.',
          },
        ],
      }),
    )
    expect(w.get('[data-test="desglose-alerta-CONFIG_EN_CERO"]').text()).toBe(
      'El incentivo está en $0.',
    )
    expect(w.get('[data-test="desglose-alerta-DISTINTO_AL_MOTOR"]').text()).toBe(
      'Lo guardado no es lo del motor.',
    )
  })
})
