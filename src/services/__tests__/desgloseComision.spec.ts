// Textos y utilidades del desglose de comisión: origen de cada valor de
// configuración, diferencia por beneficiario y el texto general del efecto
// del descuento, que debe decir lo mismo que el motor (calcularComision).
import { describe, expect, it } from 'vitest'
import {
  ETIQUETA_ROL,
  TEXTO_EFECTO_DESCUENTO,
  diferenciaBeneficiario,
  origenValorConfig,
  type BeneficiarioComision,
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
    expect(t).toContain('Asesor convenio que se datea a sí mismo: queda en $0')
    expect(t).toContain('Comercial con convenio: el comercial cobra igual; el convenio queda en $0')
    expect(t).toContain('si el cliente es nuevo')
    expect(t).not.toMatch(/valor básico de dateo/i)
    expect(t).not.toMatch(/Incentivo final/i)
  })
})
