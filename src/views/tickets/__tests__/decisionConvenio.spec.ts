import { describe, expect, it } from 'vitest'
import {
  asignadoSegunBusqueda,
  avisoConvenioEnObservacion,
  camposConvenioAprobar,
  camposConvenioCrear,
  casoTrasCorreccion,
  cobraGuardado,
  convenioElegido,
  puedeCorregirConvenio,
  etiquetaOpcionConvenio,
  observacionMencionaConvenio,
  sinConvenioDecidido,
  textoReglaDescuentoConvenio,
} from '../decisionConvenio'

describe('convenioElegido', () => {
  it('undefined mientras no elija; null con "Sin convenio"; el id si eligió', () => {
    expect(convenioElegido(undefined, false)).toBeUndefined()
    expect(convenioElegido(null, false)).toBeUndefined()
    expect(convenioElegido(40, false)).toBe(40)
    expect(convenioElegido(40, true)).toBeNull()
    expect(convenioElegido(null, true)).toBeNull()
  })
})

describe('camposConvenioCrear', () => {
  it('sin decidir no se puede enviar', () => {
    expect(camposConvenioCrear(undefined, false)).toBeNull()
  })
  it('convenio elegido o "Sin convenio (directo)"', () => {
    expect(camposConvenioCrear(40, false)).toEqual({ convenio_id: 40 })
    expect(camposConvenioCrear(null, false)).toEqual({ convenio_id: null, sin_convenio: true })
  })
  it('asesor convenio: no elige (el backend pone el suyo)', () => {
    expect(camposConvenioCrear(undefined, true)).toEqual({})
  })
})

describe('camposConvenioAprobar', () => {
  const base = { caso: 'SIN_CONVENIO' as const, convenioActual: null, sinConvenioExplicito: true }

  it('sin convenio decidido al crear: no manda nada', () => {
    expect(camposConvenioAprobar({ ...base, elegido: null })).toEqual({})
  })
  it('ticket viejo sin convenio (null o 0): pide confirmar', () => {
    expect(camposConvenioAprobar({ ...base, sinConvenioExplicito: null, elegido: null })).toEqual({
      confirmar_sin_convenio: true,
    })
    expect(camposConvenioAprobar({ ...base, sinConvenioExplicito: 0, elegido: null })).toEqual({
      confirmar_sin_convenio: true,
    })
  })
  it('ticket viejo sin elegir nada: no se puede aprobar', () => {
    expect(camposConvenioAprobar({ ...base, sinConvenioExplicito: null, elegido: undefined })).toBeNull()
  })
  it('poner un convenio a un ticket sin convenio', () => {
    expect(camposConvenioAprobar({ ...base, elegido: 40 })).toEqual({ convenio_id: 40 })
  })
  it('quitar el convenio: convenio_id null y confirmación', () => {
    expect(
      camposConvenioAprobar({
        caso: 'CONVENIO_COMERCIAL',
        convenioActual: 40,
        sinConvenioExplicito: 0,
        elegido: null,
      }),
    ).toEqual({ convenio_id: null, confirmar_sin_convenio: true })
  })
  it('mismo convenio: no se corrige', () => {
    expect(
      camposConvenioAprobar({
        caso: 'CONVENIO_COMERCIAL',
        convenioActual: 40,
        sinConvenioExplicito: false,
        elegido: 40,
      }),
    ).toEqual({})
  })
  it('Caso 2: el convenio es el del asesor convenio', () => {
    expect(
      camposConvenioAprobar({
        caso: 'CONVENIO_SELF',
        convenioActual: null,
        sinConvenioExplicito: null,
        elegido: undefined,
      }),
    ).toEqual({})
  })
})

describe('aviso de la observación', () => {
  it('detecta "convenio" sin importar mayúsculas ni tildes', () => {
    expect(observacionMencionaConvenio('vino por el CONVENÍO del taller')).toBe(true)
    expect(observacionMencionaConvenio('Convenios varios')).toBe(true)
    expect(observacionMencionaConvenio('cliente de fachada')).toBe(false)
    expect(observacionMencionaConvenio(null)).toBe(false)
  })
  it('solo avisa si queda sin convenio', () => {
    expect(avisoConvenioEnObservacion(true, null)).toBe(true)
    expect(avisoConvenioEnObservacion(true, undefined)).toBe(true)
    expect(avisoConvenioEnObservacion(true, 40)).toBe(false)
    expect(avisoConvenioEnObservacion(false, null)).toBe(false)
  })
})

describe('textos', () => {
  it('sinConvenioDecidido lee TINYINT', () => {
    expect(sinConvenioDecidido(1)).toBe(true)
    expect(sinConvenioDecidido(true)).toBe(true)
    expect(sinConvenioDecidido(0)).toBe(false)
    expect(sinConvenioDecidido(null)).toBe(false)
  })
  it('marca los convenios no asignados', () => {
    expect(etiquetaOpcionConvenio({ nombre: 'PEDRO', establecimiento: null, asignado: false })).toBe(
      'PEDRO · no asignado',
    )
    expect(etiquetaOpcionConvenio({ nombre: 'PEDRO', establecimiento: null, asignado: true })).toBe(
      'PEDRO',
    )
  })
  it('regla del descuento con convenio: solo se muestra en Casos 2 y 3', () => {
    expect(textoReglaDescuentoConvenio('SIN_CONVENIO')).toBeNull()
    expect(textoReglaDescuentoConvenio(null)).toBeNull()
    expect(textoReglaDescuentoConvenio('CONVENIO_COMERCIAL')).toMatch(/convenio queda en \$0/)
    expect(textoReglaDescuentoConvenio('CONVENIO_SELF')).toMatch(/asesor convenio queda en \$0/)
  })
})

describe('corrección del convenio después de aprobar', () => {
  const com = (estado: string | null, o: { id?: number | null; liq?: boolean } = {}) => ({
    id: o.id === undefined ? 7 : o.id,
    estado,
    en_liquidacion: o.liq ?? false,
    monto_asesor: 0,
    monto_convenio: 0,
  })

  it('solo con la comisión PENDIENTE fuera de liquidaciones, o sin comisión todavía', () => {
    expect(puedeCorregirConvenio(com('PENDIENTE')).puede).toBe(true)
    expect(puedeCorregirConvenio(com(null, { id: null })).puede).toBe(true)
    expect(puedeCorregirConvenio(com('APROBADA'))).toEqual({
      puede: false,
      motivo: 'La comisión está APROBADA: requiere un ajuste aparte.',
    })
    expect(puedeCorregirConvenio(com('PAGADA')).puede).toBe(false)
    expect(puedeCorregirConvenio(com('PENDIENTE', { liq: true })).motivo).toMatch(/liquidación/)
    expect(puedeCorregirConvenio(null).puede).toBe(false)
  })

  it('la decisión guardada se lee como interruptor (null = Cobra)', () => {
    expect(cobraGuardado(null)).toBe(true)
    expect(cobraGuardado(1)).toBe(true)
    expect(cobraGuardado(0)).toBe(false)
    expect(cobraGuardado(false)).toBe(false)
  })

  it('caso tras la corrección', () => {
    expect(casoTrasCorreccion(undefined)).toBeNull()
    expect(casoTrasCorreccion(null)).toBe('SIN_CONVENIO')
    expect(casoTrasCorreccion(40)).toBe('CONVENIO_COMERCIAL')
  })
})

describe('convenio que trae el dateo: ¿asignado?', () => {
  const filas = [
    { id: 40, asignado: true },
    { id: 41, asignado: false },
  ]
  it('si aparece en la búsqueda, manda su marca', () => {
    expect(asignadoSegunBusqueda(40, filas, true)).toBe(true)
    expect(asignadoSegunBusqueda(41, filas, true)).toBe(false)
  })
  it('COMERCIAL (solo asignados): si no aparece, no está asignado', () => {
    expect(asignadoSegunBusqueda(99, filas, false)).toBe(false)
  })
  it('gerencia (con no asignados): si no aparece, no se sabe', () => {
    expect(asignadoSegunBusqueda(99, filas, true)).toBeNull()
  })
})
