// Textos y utilidades del desglose de comisión: origen de cada valor de
// configuración, diferencia por beneficiario y el texto general del efecto
// del descuento, que debe decir lo mismo que el motor (calcularComision).
import { describe, expect, it } from 'vitest'
import {
  ETIQUETA_ROL,
  TEXTO_AVANCE_ASESOR_CONVENIO,
  TEXTO_AVANCE_CONVENIO,
  TEXTO_EFECTO_DESCUENTO,
  casoDelTurno,
  impactoInformativoEspecialCaja,
  textoAvance,
  avisosVisibles,
  colorEstadoComision,
  diferenciaBeneficiario,
  diferenciaTotal,
  estadoVisible,
  origenValorConfig,
  totalDespues,
  type AlertaComision,
  type BeneficiarioComision,
  type DesgloseComision,
  type ValorConfigUsado,
} from '../desgloseComision'

const valor = (v: Partial<ValorConfigUsado>): ValorConfigUsado => ({
  campo: 'base',
  etiqueta: 'Base',
  valor: 0,
  fuente: 'GLOBAL',
  tabla: 'comision_configs',
  filaId: 2,
  asesorId: null,
  tipoVehiculo: 'VEHICULO',
  columna: 'base',
  usado: true,
  ...v,
})

const beneficiario = (antes: number | null, despues: number): BeneficiarioComision => ({
  rol: 'ASESOR_COMERCIAL',
  id: 1,
  nombre: 'QAT Asesor',
  tipo: null,
  cobraAsesorConvenio: null,
  antes,
  despues,
})

describe('origenValorConfig', () => {
  it('fila global con vehículo y columna', () => {
    expect(origenValorConfig(valor({}))).toBe('Global #2 · VEHICULO · base')
  })

  it('fila propia sin tipo de vehículo', () => {
    expect(
      origenValorConfig(
        valor({ fuente: 'FILA_PROPIA', filaId: 15, tipoVehiculo: null, columna: 'incentivo' }),
      ),
    ).toBe('Fila propia #15 · incentivo')
  })

  it('respaldo del código no muestra fila', () => {
    expect(origenValorConfig(valor({ fuente: 'RESPALDO', filaId: null }))).toBe(
      'Respaldo del código (sin fila)',
    )
  })
})

describe('diferenciaBeneficiario', () => {
  it('después − antes, con signo', () => {
    expect(diferenciaBeneficiario(beneficiario(17280, 4300))).toBe(-12980)
    expect(diferenciaBeneficiario(beneficiario(4300, 17280))).toBe(12980)
    expect(diferenciaBeneficiario(beneficiario(8640, 8640))).toBe(0)
  })

  it('sin "antes" (estimado) no hay diferencia', () => {
    expect(diferenciaBeneficiario(beneficiario(null, 4300))).toBeNull()
  })
})

describe('textos', () => {
  it('etiquetas de los tres beneficiarios', () => {
    expect(ETIQUETA_ROL).toEqual({
      ASESOR_COMERCIAL: 'Asesor comercial',
      ASESOR_CONVENIO: 'Asesor convenio',
      CONVENIO: 'Convenio',
    })
  })

  it('el efecto general del descuento nombra los tres casos y no promete el "valor básico de dateo"', () => {
    const t = TEXTO_EFECTO_DESCUENTO
    expect(t).toContain('Sin convenio y cliente nuevo')
    expect(t).toContain('valor de recurrencia')
    expect(t).toContain(
      'Asesor convenio que se datea a sí mismo: su comisión queda en cero con Avance',
    )
    expect(t).toContain(
      'Comercial con convenio: el comercial cobra su valor normal; el convenio queda en cero con Avance',
    )
    expect(t).toContain('si el cliente es nuevo')
    expect(t).not.toMatch(/valor básico de dateo/i)
    expect(t).not.toMatch(/Incentivo final/i)
  })
})

const desglose = (
  beneficiarios: BeneficiarioComision[],
  alertas: AlertaComision[] = [],
  estimado = false,
) => ({ estimado, beneficiarios, alertas }) as unknown as DesgloseComision

describe('diferenciaTotal y totalDespues', () => {
  it('suma después − antes de todos los beneficiarios', () => {
    const d = desglose([beneficiario(17280, 4300), { ...beneficiario(5000, 0), rol: 'CONVENIO' }])
    expect(diferenciaTotal(d)).toBe(-17980)
    expect(totalDespues(d)).toBe(4300)
    expect(diferenciaTotal(desglose([beneficiario(8640, 8640)]))).toBe(0)
  })

  it('estimado (sin "antes"): no hay diferencia', () => {
    expect(diferenciaTotal(desglose([beneficiario(null, 4300)], [], true))).toBeNull()
  })
})

describe('estado del chip', () => {
  it('el de la comisión, o ESTIMADO si es estimado o no hay estado', () => {
    const d = desglose([beneficiario(0, 0)])
    expect(estadoVisible(d, 'APROBADA')).toBe('APROBADA')
    expect(estadoVisible(d, null)).toBe('ESTIMADO')
    expect(estadoVisible(desglose([], [], true), 'PENDIENTE')).toBe('ESTIMADO')
  })

  it('colores', () => {
    expect(colorEstadoComision('PAGADA')).toBe('red-darken-2')
    expect(colorEstadoComision('APROBADA')).toBe('blue')
    expect(colorEstadoComision('ANULADA')).toBe('grey')
    expect(colorEstadoComision('ESTIMADO')).toBe('indigo')
    expect(colorEstadoComision('PENDIENTE')).toBe('orange-darken-2')
  })
})

describe('avisosVisibles', () => {
  const a = (codigo: AlertaComision['codigo'], tipo: AlertaComision['tipo'] = 'warning') => ({
    codigo,
    tipo,
    mensaje: `mensaje largo de ${codigo}`,
  })

  it('solo config en $0, ticket sin comisión, pagada/liquidada y continuidad vacía; uno por tipo', () => {
    const d = desglose(
      [],
      [
        a('CONFIG_EN_CERO'),
        a('CONFIG_EN_CERO'),
        a('SIN_COMISION_TICKET'),
        a('AVANCE_HEREDADO', 'info'),
        a('SIN_CONTINUIDAD'),
        a('ESTIMADO', 'info'),
        a('NO_MODIFICADA'),
        a('DISTINTO_AL_MOTOR', 'error'),
      ],
    )
    expect(avisosVisibles(d, 'PAGADA')).toEqual([
      { codigo: 'PAGADA', tipo: 'error', texto: 'Comisión ya pagada' },
      { codigo: 'CONFIG_EN_CERO', tipo: 'warning', texto: 'Valor en $0 por la configuración' },
      { codigo: 'SIN_COMISION_TICKET', tipo: 'warning', texto: 'Ticket aprobado «sin comisión»' },
      { codigo: 'SIN_CONTINUIDAD', tipo: 'warning', texto: 'Continuidad vacía: no se recalculó' },
    ])
  })

  it('en liquidación (sin estar pagada) y sin avisos', () => {
    expect(avisosVisibles(desglose([]), 'APROBADA', true)).toEqual([
      { codigo: 'EN_LIQUIDACION', tipo: 'error', texto: 'Comisión ya en una liquidación' },
    ])
    expect(avisosVisibles(desglose([]), 'PENDIENTE')).toEqual([])
  })

  it('cada aviso cabe en una línea (≤ 40 caracteres)', () => {
    const d = desglose([], [a('CONFIG_EN_CERO'), a('SIN_COMISION_TICKET'), a('SIN_CONTINUIDAD')])
    for (const x of [...avisosVisibles(d, 'PAGADA'), ...avisosVisibles(d, 'APROBADA', true)]) {
      expect(x.texto.length).toBeLessThanOrEqual(40)
    }
  })
})

describe('Avance: textos de caja y edición (sin cifras)', () => {
  it('AVANCE como descuento final: el convenio queda en cero; el comercial cobra normal', () => {
    expect(textoAvance({ caso: 'CONVENIO_COMERCIAL', codigo: 'AVANCE' })).toBe(
      TEXTO_AVANCE_CONVENIO,
    )
    expect(textoAvance({ caso: 'CONVENIO_SELF', codigo: 'AVANCE' })).toBe(
      TEXTO_AVANCE_ASESOR_CONVENIO,
    )
    expect(TEXTO_AVANCE_CONVENIO).toContain('El asesor comercial cobra su valor normal')
  })

  it('Avance cambiado o quitado: avisa que el convenio vuelve a cobrar', () => {
    expect(
      textoAvance({ caso: 'CONVENIO_COMERCIAL', codigo: 'INFORMATIVO', traiaAvance: 'DATEO' }),
    ).toBe(
      'El dateo traía Avance. Si lo cambias o lo quitas, el convenio volverá a cobrar su comisión.',
    )
    expect(textoAvance({ caso: 'CONVENIO_SELF', codigo: null, traiaAvance: 'FACTURA' })).toBe(
      'La factura traía Avance. Si lo cambias o lo quitas, el asesor convenio volverá a cobrar su comisión.',
    )
  })

  it('no aplica en Caso 1, sin caso conocido, ni sin Avance antes ni ahora', () => {
    expect(textoAvance({ caso: 'SIN_CONVENIO', codigo: 'AVANCE', traiaAvance: 'DATEO' })).toBeNull()
    expect(textoAvance({ caso: null, codigo: 'AVANCE' })).toBeNull()
    expect(textoAvance({ caso: 'CONVENIO_COMERCIAL', codigo: 'INFORMATIVO' })).toBeNull()
    expect(textoAvance({ caso: 'CONVENIO_COMERCIAL', codigo: 'AVANCE_PROPIETARIO' })).toBeNull()
  })

  it('caso del turno según quién datea y si hay convenio', () => {
    expect(casoDelTurno({ tieneComercial: true, tieneConvenio: true })).toBe('CONVENIO_COMERCIAL')
    expect(casoDelTurno({ tieneComercial: false, tieneConvenio: true })).toBe('CONVENIO_SELF')
    expect(casoDelTurno({ tieneComercial: true, tieneConvenio: false })).toBe('SIN_CONVENIO')
    expect(casoDelTurno({ tieneComercial: false, tieneConvenio: false })).toBeNull()
  })

  it('efecto por persona del informativo especial en caja: el Caso 3 ya no dice que el comercial baja', () => {
    expect(impactoInformativoEspecialCaja('CONVENIO_COMERCIAL')).toEqual({
      comercial: 'cobra su valor normal (no cambia)',
      convenio: 'queda en cero si el cliente es nuevo',
    })
    expect(impactoInformativoEspecialCaja('CONVENIO_SELF')).toEqual({
      comercial: null,
      convenio: 'queda en cero',
    })
    expect(impactoInformativoEspecialCaja('SIN_CONVENIO')?.comercial).toContain(
      'valor de recurrencia',
    )
    expect(impactoInformativoEspecialCaja(null)).toBeNull()
  })

  it('ningún texto de ayuda lleva cifras escritas', () => {
    const textos = [
      TEXTO_EFECTO_DESCUENTO,
      TEXTO_AVANCE_CONVENIO,
      TEXTO_AVANCE_ASESOR_CONVENIO,
      textoAvance({ caso: 'CONVENIO_COMERCIAL', codigo: null, traiaAvance: 'DATEO' })!,
      ...(['CONVENIO_COMERCIAL', 'CONVENIO_SELF', 'SIN_CONVENIO'] as const).flatMap((c) =>
        Object.values(impactoInformativoEspecialCaja(c)!).filter(Boolean),
      ),
    ]
    for (const t of textos) expect(t).not.toMatch(/\$|\d/)
  })
})
