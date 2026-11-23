import { describe, expect, it } from 'vitest'
import {
  construirPayloadDateo,
  leerGestionIdQuery,
  mostrarAsesorEnDateo,
  mostrarConvenioEnDateo,
  mostrarOrigenTele,
  opcionesOrigen,
  requiereGestion,
  type CreateDateoPayload,
  type FormDateo,
} from '../payloadDateo'

/**
 * Copia literal del armado de payload que tenía DateoCreate.vue antes de
 * Telemercadeo (submitDateo). Sin gestión, construirPayloadDateo debe dar
 * exactamente lo mismo.
 */
function payloadAnterior(
  form: FormDateo,
  puedeSeleccionarDescuento: boolean,
  confirmarExcepcion = false,
): CreateDateoPayload {
  const payload: CreateDateoPayload = {
    canal: form.canal,
    origen: 'UI',
    agente_id: form.agente_id,
    convenio_id: form.convenio_id,
    placa: form.placa ? form.placa.toUpperCase().trim() : null,
    telefono: form.telefono || null,
    observacion: form.observacion || null,
    descuento_id: puedeSeleccionarDescuento ? (form.descuento_id || null) : null,
    es_avance: form.es_avance || false,
    comprobante_avance_url: form.es_avance ? (form.comprobante_avance_url || null) : null,
    servicio_id: form.servicio_id || null,
  }
  if (form.imagen_url) {
    payload.imagen_url = form.imagen_url
    payload.imagen_mime = form.imagen_mime ?? null
    payload.imagen_tamano_bytes = form.imagen_tamano_bytes ?? null
    payload.imagen_hash = form.imagen_hash ?? null
    payload.imagen_origen_id = form.imagen_origen_id ?? null
  }
  if (confirmarExcepcion) payload.confirmar_excepcion = true
  return payload
}

const base: FormDateo = {
  canal: 'ASESOR',
  agente_id: 12,
  convenio_id: 40,
  placa: 'abc123 ',
  telefono: '3001234567',
  observacion: 'obs',
  descuento_id: 2,
  es_avance: true,
  comprobante_avance_url: '/api/uploads/dateos/2026/11/c.png',
  imagen_url: '/api/uploads/dateos/2026/11/i.png',
  imagen_mime: 'image/png',
  imagen_tamano_bytes: 100,
  imagen_hash: null,
  imagen_origen_id: 'i.png',
  servicio_id: 1,
}

describe('construirPayloadDateo sin gestión (regresión: igual que antes)', () => {
  const variantes: Array<[string, Partial<FormDateo>, boolean, boolean]> = [
    ['asesor comercial con convenio y avance', {}, true, false],
    ['sin descuento seleccionable', {}, false, false],
    ['con confirmar_excepcion', {}, true, true],
    ['fachada sin agente ni imagen', { canal: 'FACHADA', agente_id: null, convenio_id: null, imagen_url: null, es_avance: false, descuento_id: null }, false, false],
    ['TELE manual sin gestión', { canal: 'TELE', convenio_id: null, es_avance: false }, true, false],
    ['campos vacíos', { placa: '', telefono: '', observacion: '', servicio_id: null }, true, false],
  ]
  it.each(variantes)('%s', (_nombre, cambios, puede, confirmar) => {
    const form = { ...base, ...cambios }
    const nuevo = construirPayloadDateo(form, {
      puedeSeleccionarDescuento: puede,
      confirmarExcepcion: confirmar,
      gestion: null,
    })
    expect(nuevo).toStrictEqual(payloadAnterior(form, puede, confirmar))
    expect(nuevo).not.toHaveProperty('telemercadeo_gestion_id')
    expect(nuevo).not.toHaveProperty('telemercadeo_origen_id')
    // Un origen suelto no se cuela fuera del canal Telemercadeo.
    expect(
      construirPayloadDateo(form, {
        puedeSeleccionarDescuento: puede,
        confirmarExcepcion: confirmar,
        origenTeleId: form.canal === 'TELE' ? null : 3,
      }),
    ).toStrictEqual(payloadAnterior(form, puede, confirmar))
  })
})

describe('construirPayloadDateo con gestión de Telemercadeo', () => {
  it('fuerza TELE, servicio de la gestión, sin agente/convenio/descuento y manda la gestión', () => {
    const p = construirPayloadDateo(
      { ...base, servicio_id: 3 },
      { puedeSeleccionarDescuento: true, gestion: { id: 77, servicio_id: 1 } },
    )
    expect(p).toMatchObject({
      canal: 'TELE',
      agente_id: null,
      convenio_id: null,
      descuento_id: null,
      es_avance: false,
      comprobante_avance_url: null,
      servicio_id: 1,
      telemercadeo_gestion_id: 77,
      placa: 'ABC123',
      telefono: '3001234567',
      imagen_url: base.imagen_url,
    })
    expect(p).not.toHaveProperty('confirmar_excepcion')
  })

  it('respeta confirmar_excepcion', () => {
    const p = construirPayloadDateo(base, {
      puedeSeleccionarDescuento: false,
      confirmarExcepcion: true,
      gestion: { id: 1, servicio_id: 1 },
    })
    expect(p.confirmar_excepcion).toBe(true)
  })
})

describe('leerGestionIdQuery', () => {
  it('lee enteros positivos y descarta el resto', () => {
    expect(leerGestionIdQuery('12')).toBe(12)
    expect(leerGestionIdQuery(['5'])).toBe(5)
    expect(leerGestionIdQuery(undefined)).toBeNull()
    expect(leerGestionIdQuery('')).toBeNull()
    expect(leerGestionIdQuery('abc')).toBeNull()
    expect(leerGestionIdQuery('0')).toBeNull()
    expect(leerGestionIdQuery('1.5')).toBeNull()
  })
})

describe('mostrarConvenioEnDateo', () => {
  it('oculta el convenio con una gestión de Telemercadeo y lo muestra sin ella', () => {
    expect(mostrarConvenioEnDateo(77)).toBe(false)
    expect(mostrarConvenioEnDateo(null)).toBe(true)
  })
})

describe('asesor de Telemercadeo', () => {
  it('con gestión manda el origen elegido', () => {
    const p = construirPayloadDateo(base, {
      puedeSeleccionarDescuento: true,
      gestion: { id: 77, servicio_id: 1 },
      origenTeleId: 3,
    })
    expect(p).toMatchObject({ canal: 'TELE', telemercadeo_gestion_id: 77, telemercadeo_origen_id: 3 })
  })

  it('SA/GER con canal TELE: el payload de siempre más el origen', () => {
    const form: FormDateo = { ...base, canal: 'TELE' }
    expect(
      construirPayloadDateo(form, { puedeSeleccionarDescuento: true, origenTeleId: 2 }),
    ).toStrictEqual({ ...payloadAnterior(form, true), telemercadeo_origen_id: 2 })
  })

  it('selector Origen: con gestión, o SA/GER con canal Telemercadeo', () => {
    expect(mostrarOrigenTele(12, false, 'TELE')).toBe(true)
    expect(mostrarOrigenTele(null, true, 'TELE')).toBe(true)
    for (const canal of ['ASESOR', 'FACHADA', 'REDES'] as const) {
      expect(mostrarOrigenTele(null, true, canal)).toBe(false)
    }
    expect(mostrarOrigenTele(null, false, 'TELE')).toBe(false)
  })

  it('el asesor de Telemercadeo sin gestión va a Mi gestión; los demás no', () => {
    expect(requiereGestion(null, true)).toBe(true)
    expect(requiereGestion(12, true)).toBe(false)
    expect(requiereGestion(null, false)).toBe(false)
  })

  it('tipo y agente visibles para Telemercadeo; los demás, como siempre', () => {
    expect(mostrarAsesorEnDateo('TELE', 12, true)).toBe(true)
    expect(mostrarAsesorEnDateo('TELE', null, true)).toBe(true)
    expect(mostrarAsesorEnDateo('TELE', 12, false)).toBe(false)
    expect(mostrarAsesorEnDateo('ASESOR', null, false)).toBe(true)
    expect(mostrarAsesorEnDateo('FACHADA', null, false)).toBe(false)
    expect(mostrarConvenioEnDateo(null, true)).toBe(false)
  })

  it('opciones: los activos, más el de la gestión si ya no está activo', () => {
    const activos = [{ id: 1, nombre: 'Recurrencia' }]
    expect(opcionesOrigen(activos, null)).toEqual(activos)
    expect(opcionesOrigen(activos, { id: 1, nombre: 'Recurrencia' })).toEqual(activos)
    expect(opcionesOrigen(activos, { id: 9, nombre: 'Viejo' })).toHaveLength(2)
  })
})
