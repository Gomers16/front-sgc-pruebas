import { describe, expect, it } from 'vitest'
import {
  etiquetaConvenio,
  etiquetaConvenioConCodigo,
  filtroConvenio,
} from '../conveniosService'

describe('etiquetaConvenio', () => {
  it('muestra "NOMBRE · NEGOCIO" cuando hay negocio', () => {
    expect(etiquetaConvenio({ nombre: 'JUAN PEREZ', establecimiento: 'TALLER EL PISTON' })).toBe(
      'JUAN PEREZ · TALLER EL PISTON'
    )
  })

  it('sin negocio queda solo el nombre, sin separador colgando', () => {
    expect(etiquetaConvenio({ nombre: 'JUAN PEREZ', establecimiento: null })).toBe('JUAN PEREZ')
    expect(etiquetaConvenio({ nombre: 'JUAN PEREZ', establecimiento: '   ' })).toBe('JUAN PEREZ')
    expect(etiquetaConvenio({ nombre: 'JUAN PEREZ' })).toBe('JUAN PEREZ')
  })

  it('recorta espacios y no repite el negocio si es igual al nombre', () => {
    expect(etiquetaConvenio({ nombre: '  JUAN  ', establecimiento: ' TALLER ' })).toBe('JUAN · TALLER')
    expect(etiquetaConvenio({ nombre: 'Lavadero Sol', establecimiento: 'LAVADERO SOL' })).toBe(
      'Lavadero Sol'
    )
  })

  it('oculta el negocio si el nombre ya lo contiene, sin tildes ni mayúsculas', () => {
    expect(
      etiquetaConvenio({
        nombre: 'ALVARO SANCHEZ / PARQUEADERO DAWTAWN',
        establecimiento: 'PARQUEADERO DAWTAWN',
      })
    ).toBe('ALVARO SANCHEZ / PARQUEADERO DAWTAWN')
    expect(
      etiquetaConvenio({ nombre: 'Taller Mecánico El Sol - Pedro', establecimiento: 'TALLER MECANICO el  sol' })
    ).toBe('Taller Mecánico El Sol - Pedro')
  })

  it('si el negocio solo coincide en parte, se muestra completo', () => {
    expect(
      etiquetaConvenio({ nombre: 'ALVARO SANCHEZ / PARQUEADERO', establecimiento: 'PARQUEADERO DAWTAWN' })
    ).toBe('ALVARO SANCHEZ / PARQUEADERO · PARQUEADERO DAWTAWN')
  })

  it('sin convenio devuelve cadena vacía; sin nombre usa el negocio', () => {
    expect(etiquetaConvenio(null)).toBe('')
    expect(etiquetaConvenio(undefined)).toBe('')
    expect(etiquetaConvenio({ nombre: '', establecimiento: 'TALLER' })).toBe('TALLER')
  })
})

describe('etiquetaConvenioConCodigo', () => {
  it('antepone el código y oculta SIN-COD', () => {
    expect(
      etiquetaConvenioConCodigo({ codigo: 'c-12', nombre: 'JUAN', establecimiento: 'TALLER' })
    ).toBe('C-12 — JUAN · TALLER')
    expect(etiquetaConvenioConCodigo({ codigo: 'SIN-COD', nombre: 'JUAN', establecimiento: 'TALLER' })).toBe(
      'JUAN · TALLER'
    )
    expect(etiquetaConvenioConCodigo({ codigo: null, nombre: 'JUAN' })).toBe('JUAN')
  })
})

describe('filtroConvenio (custom-filter de los desplegables)', () => {
  const item = { raw: { nombre: 'JOSÉ GÓMEZ', establecimiento: 'Parqueadero Central' } }
  const titulo = etiquetaConvenio(item.raw)

  it('encuentra por nombre o por negocio, sin tildes ni mayúsculas', () => {
    expect(filtroConvenio(titulo, 'jose', item)).toBe(true)
    expect(filtroConvenio(titulo, 'PARQUEADERO', item)).toBe(true)
    expect(filtroConvenio(titulo, 'centrál', item)).toBe(true)
  })

  it('con varias palabras exige todas, aunque mezclen nombre y negocio', () => {
    expect(filtroConvenio(titulo, 'gomez central', item)).toBe(true)
    expect(filtroConvenio(titulo, 'gomez lavadero', item)).toBe(false)
  })

  it('búsqueda vacía deja pasar todo; sin coincidencia descarta', () => {
    expect(filtroConvenio(titulo, '', item)).toBe(true)
    expect(filtroConvenio(titulo, 'taller', item)).toBe(false)
  })
})
