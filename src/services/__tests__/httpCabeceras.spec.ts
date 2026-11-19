import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { download, downloadConCabeceras, get, http, HttpError } from '../http'

// onHeaders y downloadConCabeceras (2026-11-19) son aditivos: las llamadas
// existentes (sin onHeaders) se comportan igual que antes.

const fetchMock = vi.fn()

function respuesta(body: BodyInit | null, init: ResponseInit & { headers?: Record<string, string> }) {
  return new Response(body, init)
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  localStorage.setItem('token', 'tok-123')
})
afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('http sin onHeaders (comportamiento de siempre)', () => {
  it('GET JSON: mismo init de fetch (sin campos nuevos) y mismo resultado', async () => {
    fetchMock.mockResolvedValue(
      respuesta(JSON.stringify({ ok: 1 }), { status: 200, headers: { 'content-type': 'application/json' } }),
    )
    const r = await get<{ ok: number }>('/api/x', { params: { a: 1, b: '' } })
    expect(r).toEqual({ ok: 1 })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/x\?a=1$/)
    expect(Object.keys(init).sort()).toEqual(['credentials', 'headers', 'method', 'signal'])
    expect(init.headers.Authorization).toBe('Bearer tok-123')
    expect(init).not.toHaveProperty('onHeaders')
  })

  it('download() sigue devolviendo solo el Blob', async () => {
    fetchMock.mockResolvedValue(respuesta('abc', { status: 200, headers: { 'x-detalle-truncado': '5' } }))
    const b = await download('/api/f')
    expect(typeof b.text).toBe('function')
    expect(await b.text()).toBe('abc')
  })

  it('error: sigue lanzando HttpError con status, mensaje y data', async () => {
    fetchMock.mockResolvedValue(
      respuesta(JSON.stringify({ message: 'nop', code: 'X' }), {
        status: 409,
        headers: { 'content-type': 'application/json' },
      }),
    )
    await expect(get('/api/x')).rejects.toMatchObject({ status: 409, message: 'nop', data: { code: 'X' } })
    await expect(get('/api/x')).rejects.toBeInstanceOf(HttpError)
  })
})

describe('onHeaders y downloadConCabeceras', () => {
  it('onHeaders recibe las cabeceras solo en respuestas OK', async () => {
    const onHeaders = vi.fn()
    fetchMock.mockResolvedValueOnce(respuesta('{}', { status: 200, headers: { 'content-type': 'application/json', 'x-a': '1' } }))
    await http('/api/x', { onHeaders })
    expect(onHeaders).toHaveBeenCalledTimes(1)
    expect(onHeaders.mock.calls[0][0].get('x-a')).toBe('1')

    fetchMock.mockResolvedValueOnce(respuesta('{}', { status: 500, headers: { 'content-type': 'application/json' } }))
    await expect(http('/api/x', { onHeaders })).rejects.toBeInstanceOf(HttpError)
    expect(onHeaders).toHaveBeenCalledTimes(1)
  })

  it('downloadConCabeceras devuelve Blob + Headers', async () => {
    fetchMock.mockResolvedValue(
      respuesta('xlsx', {
        status: 200,
        headers: { 'content-disposition': 'attachment; filename="a.xlsx"', 'x-detalle-truncado': '20000' },
      }),
    )
    const { blob, headers } = await downloadConCabeceras('/api/f', { desde: '2026-11-01' })
    expect(await blob.text()).toBe('xlsx')
    expect(headers.get('x-detalle-truncado')).toBe('20000')
    expect(fetchMock.mock.calls[0][0]).toMatch(/desde=2026-11-01/)
  })
})
