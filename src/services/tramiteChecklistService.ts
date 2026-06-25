import { get, put } from './http'

export interface TramiteChecklist {
  sedeId: number
  fecha: string
  turnoNumero: number

  tarjetaPropiedad:       boolean | null
  soat:                   boolean | null
  fotocopiaCedula:        boolean | null
  runtVendedor:           boolean | null
  runtComprador:          boolean | null
  antecedentesComprador:  boolean | null
  antecedentesVendedor:   boolean | null
  levantaPrendaOriginal:  boolean | null
  inscribePrendaOriginal: boolean | null
  camaraComercio:         boolean | null
  certificadoImpuestos:   boolean | null
  declaracionExtrajuicio: boolean | null
  pazSalvoEmpresa:        boolean | null
  cesionDerechoEmpresa:   boolean | null

  observaciones: string | null
}

const BASE = '/api/tramites/checklist'

export const TramiteChecklistService = {
  getByTurno(sedeId: number, fecha: string, turnoNumero: number) {
    const params = new URLSearchParams({
      sedeId: String(sedeId),
      fecha,
      turnoNumero: String(turnoNumero),
    })
    return get<TramiteChecklist>(`${BASE}?${params}`)
  },

  upsert(data: Partial<TramiteChecklist>) {
    return put<TramiteChecklist, Partial<TramiteChecklist>>(BASE, data)
  },
}
