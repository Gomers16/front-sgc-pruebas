import { describe, expect, it } from 'vitest'
import {
  colorResultado,
  esExtensionEvidencia,
  etiquetaMedio,
  etiquetaResultado,
  fmtFecha,
  fmtPct,
  fraccionSeguimiento,
  gestionIdParaDatear,
  hoyBogota,
  mensajeErrorDateoGestion,
  mensajeErrorGestion,
  mesActualBogota,
  mesAnterior,
  normalizarPlaca,
  nuevaIdempotencyKey,
  placaValida,
  presentarMeta,
  puedeAutorizarExtra,
  rangoDeMes,
  seguimientoAgotado,
  textoSeguimiento,
} from '../telemercadeoHelpers'
import {
  leerCabecerasExcel,
  normalizarCatalogos,
  normalizarPaginaGestiones,
  normalizeListShape,
  type SeguimientoPlaca,
} from '@/services/telemercadeoService'

describe('etiquetas', () => {
  it('medio y resultado con etiqueta en español; desconocidos tal cual', () => {
    expect(etiquetaMedio('WHATSAPP')).toBe('WhatsApp')
    expect(etiquetaMedio('SMS')).toBe('Mensaje de texto')
    expect(etiquetaMedio('FAX')).toBe('FAX')
    expect(etiquetaMedio(null)).toBe('—')
    expect(etiquetaResultado('YA_REALIZADO')).toBe('Ya lo realizó')
    expect(etiquetaResultado('DATEADO')).toBe('Dateado')
    expect(etiquetaResultado(undefined)).toBe('—')
    expect(colorResultado('DATEADO')).toBe('success')
    expect(colorResultado('OTRO')).toBe('grey')
  })
})

describe('seguimiento', () => {
  it('formato "seguimiento n de max"', () => {
    expect(textoSeguimiento(1, 3)).toBe('Seguimiento 1 de 3')
    expect(textoSeguimiento(null, undefined)).toBe('Seguimiento 0 de 0')
    expect(fraccionSeguimiento(2, 4)).toBe('2/4')
    expect(seguimientoAgotado(3, 3)).toBe(true)
    expect(seguimientoAgotado(2, 3)).toBe(false)
    expect(seguimientoAgotado(0, 0)).toBe(false)
  })

  const seg = (o: Partial<SeguimientoPlaca> = {}, ug: Partial<SeguimientoPlaca['ultima_gestion']> = {}): SeguimientoPlaca => ({
    placa: 'ABC123',
    n: 1,
    limite: 3,
    ciclo_abierto: true,
    ...o,
    ultima_gestion: {
      id: 50,
      fecha: '2026-11-19T10:00:00.000-05:00',
      medio: 'LLAMADA',
      resultado: 'INTERESADO',
      agente_id: 7,
      agente_nombre: 'A',
      servicio_id: 1,
      ...ug,
    },
  })

  it('gestionIdParaDatear solo con ciclo abierto, misma placa, propia y sin dateo', () => {
    expect(gestionIdParaDatear(seg(), 'ABC123', 7)).toBe(50)
    expect(gestionIdParaDatear(seg(), 'ABC123', 8)).toBeNull()
    expect(gestionIdParaDatear(seg(), 'XYZ999', 7)).toBeNull()
    expect(gestionIdParaDatear(seg({ ciclo_abierto: false }), 'ABC123', 7)).toBeNull()
    expect(gestionIdParaDatear(seg({}, { resultado: 'DATEADO' }), 'ABC123', 7)).toBeNull()
    expect(gestionIdParaDatear(null, 'ABC123', 7)).toBeNull()
    expect(gestionIdParaDatear(seg(), 'ABC123', null)).toBeNull()
  })

  it('puedeAutorizarExtra: ciclo abierto y numero_en_ciclo en el límite', () => {
    const g = (numero_en_ciclo: number, limite: number, ciclo_abierto = true) => ({
      seguimiento: { ciclo_id: 1, numero_en_ciclo, limite, ciclo_abierto, cerrado_motivo: null },
    })
    expect(puedeAutorizarExtra(g(3, 3))).toBe(true)
    expect(puedeAutorizarExtra(g(2, 3))).toBe(false)
    expect(puedeAutorizarExtra(g(3, 3, false))).toBe(false)
    expect(puedeAutorizarExtra(g(3, 4))).toBe(false)
  })
})

describe('presentarMeta (avance / ritmo / sin meta)', () => {
  it('sin meta definida: nunca 0% ni semáforo', () => {
    const p = presentarMeta({ meta: null, avance: 5, faltante: null, pct: null, pct_ritmo: null, semaforo: 'SIN_META' })
    expect(p.sinMeta).toBe(true)
    expect(p.etiqueta).toBe('Sin meta definida')
    expect(p.color).toBeNull()
    expect(p.avance).toBeNull()
    expect(p.ritmo).toBeNull()
    expect(p.barra).toBeNull()
    expect(p.cifra).toBe('5')
    expect(JSON.stringify(p)).not.toContain('0%')
  })

  it('meta 0 o ausente también es sin meta', () => {
    expect(presentarMeta({ meta: 0, avance: 0, faltante: null, pct: null, pct_ritmo: null, semaforo: 'SIN_META' }).sinMeta).toBe(true)
    expect(presentarMeta(undefined).sinMeta).toBe(true)
  })

  it('con meta: dos cifras etiquetadas (avance vs meta completa y ritmo vs hoy)', () => {
    const p = presentarMeta({ meta: 20, avance: 5, faltante: 15, pct: 25, pct_ritmo: 83.3, semaforo: 'ROJO' })
    expect(p.sinMeta).toBe(false)
    expect(p.cifra).toBe('5 de 20')
    expect(p.avance).toBe('Avance 25%')
    expect(p.ritmo).toBe('Ritmo 83.3%')
    expect(p.faltante).toBe('Faltan 15')
    expect(p.color).toBe('error')
    expect(p.etiqueta).toBe('Atrasado')
    expect(p.barra).toBe(25)
  })

  it('meta cumplida y barra acotada a 100', () => {
    const p = presentarMeta({ meta: 10, avance: 12, faltante: 0, pct: 120, pct_ritmo: 120, semaforo: 'VERDE' })
    expect(p.faltante).toBe('Meta cumplida')
    expect(p.color).toBe('success')
    expect(p.barra).toBe(100)
  })

  it('fmtPct', () => {
    expect(fmtPct(null)).toBe('—')
    expect(fmtPct(0)).toBe('0%')
    expect(fmtPct(12.5)).toBe('12.5%')
  })
})

describe('fechas en Bogotá', () => {
  it('hoyBogota usa la zona de Bogotá, no la del navegador', () => {
    // 03:00 UTC del 1 de diciembre = 22:00 del 30 de noviembre en Bogotá.
    expect(hoyBogota(new Date('2026-12-01T03:00:00Z'))).toBe('2026-11-30')
    expect(mesActualBogota(new Date('2026-12-01T03:00:00Z'))).toEqual({ mes: 11, anio: 2026 })
    expect(hoyBogota(new Date('2026-12-01T06:00:00Z'))).toBe('2026-12-01')
  })

  it('mesAnterior y rangoDeMes', () => {
    expect(mesAnterior({ mes: 1, anio: 2027 })).toEqual({ mes: 12, anio: 2026 })
    expect(mesAnterior({ mes: 11, anio: 2026 })).toEqual({ mes: 10, anio: 2026 })
    expect(rangoDeMes(2, 2028)).toEqual({ desde: '2028-02-01', hasta: '2028-02-29' })
    expect(rangoDeMes(11, 2026)).toEqual({ desde: '2026-11-01', hasta: '2026-11-30' })
    expect(fmtFecha('2026-11-19')).toBe('19/11/2026')
    expect(fmtFecha(null)).toBe('—')
  })
})

describe('formulario', () => {
  it('idempotency_key cumple el formato del backend', () => {
    const k = nuevaIdempotencyKey()
    expect(k).toMatch(/^[A-Za-z0-9_-]{8,64}$/)
    expect(nuevaIdempotencyKey()).not.toBe(k)
  })

  it('placa normalizada como el backend', () => {
    expect(normalizarPlaca(' abc-12 3')).toBe('ABC123')
    expect(placaValida('abc-123')).toBe(true)
    expect(placaValida('!!')).toBe(false)
    expect(esExtensionEvidencia('foto.HEIC')).toBe(true)
    expect(esExtensionEvidencia('doc.pdf')).toBe(false)
  })
})

describe('errores', () => {
  it('409 SEGUIMIENTO_LIMITE con mensaje claro', () => {
    const m = mensajeErrorGestion({ status: 409, data: { code: 'SEGUIMIENTO_LIMITE', n: 3, limite: 3 } })
    expect(m).toContain('3 de 3')
    expect(m).toContain('gerencia')
  })
  it('otros errores: mensaje del backend o genérico', () => {
    expect(mensajeErrorGestion({ status: 400, data: { message: 'x' } })).toBe('x')
    expect(mensajeErrorGestion({ status: 500 })).toBe('No se pudo registrar la gestión.')
    expect(mensajeErrorGestion({ status: 403, data: {} })).toContain('permiso')
  })
  it('códigos del dateo desde gestión', () => {
    expect(mensajeErrorDateoGestion('GESTION_YA_DATEADA')).toContain('ya tiene un dateo')
    expect(mensajeErrorDateoGestion('GESTION_AJENA')).toContain('otro asesor')
    expect(mensajeErrorDateoGestion('GESTION_PLACA_DISTINTA')).toContain('misma')
    expect(mensajeErrorDateoGestion('DATEO_ACTIVO')).toBeNull()
  })
})

describe('normalización de respuestas', () => {
  it('cola: rtm_vigentes y seguimiento con valores por defecto', () => {
    const r = normalizeListShape(
      { data: [{ clave: 'a', placas: [] }], meta: { total: 1, current_page: 1, per_page: 25 } },
      { page: 1, perPage: 25 },
    )
    expect(r.data[0].rtm_vigentes).toEqual([])
    expect(r.data[0].seguimiento).toBeNull()
    expect(r.total).toBe(1)
    expect(r.contadores.POR_VENCER.total).toBe(0)
  })

  it('catálogos: descarta DATEADO aunque llegue', () => {
    const c = normalizarCatalogos({
      origenes: [{ id: 1, codigo: 'REDES', nombre: 'Redes' }],
      resultados: [
        { value: 'INTERESADO', title: 'Interesado' },
        { value: 'DATEADO', title: 'Dateado' },
      ],
    })
    expect(c.resultados.map((x) => x.value)).toEqual(['INTERESADO'])
    expect(c.medios).toEqual([])
    expect(normalizarCatalogos(null).origenes).toEqual([])
  })

  it('página de gestiones { data, meta }', () => {
    const p = normalizarPaginaGestiones({ data: [{ id: 1 }], meta: { total: 30, per_page: 10 } }, { page: 2, perPage: 10 })
    expect(p.data).toHaveLength(1)
    expect(p.meta).toEqual({ total: 30, current_page: 2, per_page: 10, last_page: 3 })
    expect(normalizarPaginaGestiones(undefined, { page: 1, perPage: 25 }).meta.total).toBe(0)
  })

  it('cabeceras del Excel: nombre y aviso de truncado', () => {
    const h = new Headers({
      'content-disposition': 'attachment; filename="Telemercadeo_20261101_a_20261130.xlsx"',
      'x-detalle-truncado': '20000',
    })
    expect(leerCabecerasExcel(h)).toEqual({ nombre: 'Telemercadeo_20261101_a_20261130.xlsx', truncado: 20000 })
    expect(leerCabecerasExcel(new Headers()).truncado).toBeNull()
  })
})
