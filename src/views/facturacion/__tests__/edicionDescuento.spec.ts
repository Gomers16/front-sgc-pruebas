import { describe, expect, it } from 'vitest'
import {
  avisoComision,
  bodyEdicion,
  formInicialEdicion,
  hayCambioEdicion,
  modalComision,
  motivoEdicionValido,
  requiereAutorizador,
  totalesEdicion,
  type TicketParaEditar,
} from '../edicionDescuento'
import { autorizadoresDescuento, mapearDescuentosActivos } from '../descuentoFacturacion'

const CON_DESCUENTO: TicketParaEditar = {
  id: 10,
  estado: 'CONFIRMADA',
  descuentoId: 1,
  descuentoMontoAplicado: '20000.00',
  autorizadoPorId: 7,
  descuentoObservacion: 'Cliente pide en caja el descuento',
  consecutivoDescuento: 'D-001',
  total: '180000.00',
  totalFactura: '180000.00',
  totalSinDescuento: '200000.00',
}
const SIN_DESCUENTO: TicketParaEditar = {
  id: 11,
  estado: 'CONFIRMADA',
  total: 150000,
  totalFactura: 150000,
}

describe('editar descuento: estado inicial y cambios', () => {
  it('precarga el descuento actual del ticket', () => {
    expect(formInicialEdicion(CON_DESCUENTO)).toEqual({
      descuentoId: 1,
      monto: 20000,
      autorizadoPorId: 7,
      observacion: 'Cliente pide en caja el descuento',
      consecutivo: 'D-001',
    })
    expect(formInicialEdicion(SIN_DESCUENTO)).toEqual({
      descuentoId: null,
      monto: 0,
      autorizadoPorId: null,
      observacion: '',
      consecutivo: '',
    })
  })

  it('si nada cambia no se puede guardar (espacios de la observación no cuentan)', () => {
    const inicial = formInicialEdicion(CON_DESCUENTO)
    expect(hayCambioEdicion(inicial, { ...inicial })).toBe(false)
    expect(
      hayCambioEdicion(inicial, { ...inicial, observacion: `  ${inicial.observacion} ` }),
    ).toBe(false)
    expect(hayCambioEdicion(inicial, { ...inicial, monto: 15000 })).toBe(true)
    expect(hayCambioEdicion(inicial, { ...inicial, consecutivo: 'D-002' })).toBe(true)
    expect(hayCambioEdicion(inicial, { ...inicial, descuentoId: null })).toBe(true)
  })

  it('sin descuento, lo que quede en monto o consecutivo no cuenta como cambio', () => {
    const inicial = formInicialEdicion(SIN_DESCUENTO)
    expect(hayCambioEdicion(inicial, { ...inicial, monto: 5000, consecutivo: 'X' })).toBe(false)
  })

  it('motivo obligatorio de mínimo 5 caracteres (sin contar espacios)', () => {
    expect(motivoEdicionValido('')).toBe(false)
    expect(motivoEdicionValido('  abcd  ')).toBe(false)
    expect(motivoEdicionValido('abcde')).toBe(true)
  })

  it('un descuento distinto al que tenía el ticket pide quién lo autorizó', () => {
    const inicial = formInicialEdicion(CON_DESCUENTO)
    expect(requiereAutorizador(inicial, { ...inicial, monto: 1000 })).toBe(false)
    expect(requiereAutorizador(inicial, { ...inicial, descuentoId: 3 })).toBe(true)
    expect(requiereAutorizador(inicial, { ...inicial, descuentoId: null })).toBe(false)
  })
})

describe('editar descuento: total antes y después', () => {
  it('se recalcula desde total_sin_descuento', () => {
    const inicial = formInicialEdicion(CON_DESCUENTO)
    expect(totalesEdicion(CON_DESCUENTO, { ...inicial, monto: 5000 })).toEqual({
      antes: 180000,
      despues: 195000,
    })
  })

  it('al quitar el descuento vuelve al total original', () => {
    const inicial = formInicialEdicion(CON_DESCUENTO)
    expect(totalesEdicion(CON_DESCUENTO, { ...inicial, descuentoId: null }).despues).toBe(200000)
  })

  it('sin total_sin_descuento usa el total actual (+ el descuento anterior)', () => {
    const inicial = formInicialEdicion(SIN_DESCUENTO)
    expect(totalesEdicion(SIN_DESCUENTO, { ...inicial, descuentoId: 1, monto: 20000 })).toEqual({
      antes: 150000,
      despues: 130000,
    })
    // Un descuento en $0 no cambia el total.
    expect(totalesEdicion(SIN_DESCUENTO, { ...inicial, descuentoId: 2, monto: 0 }).despues).toBe(
      150000,
    )
  })
})

describe('editar descuento: lo que se envía', () => {
  it('con descuento envía el bloque completo y el motivo sin espacios', () => {
    const inicial = formInicialEdicion(CON_DESCUENTO)
    expect(bodyEdicion({ ...inicial, observacion: '  ' }, '  Corrección de caja ')).toEqual({
      descuento_id: 1,
      descuento_monto_aplicado: 20000,
      autorizado_por_id: 7,
      descuento_observacion: null,
      consecutivo_descuento: 'D-001',
      motivo_edicion: 'Corrección de caja',
    })
  })

  it('quitar el descuento envía descuento_id null', () => {
    const inicial = formInicialEdicion(CON_DESCUENTO)
    expect(bodyEdicion({ ...inicial, descuentoId: null }, 'No aplicaba')).toEqual({
      descuento_id: null,
      motivo_edicion: 'No aplicaba',
    })
  })
})

describe('editar descuento: aviso y modal de la comisión', () => {
  const formatCOP = (n: number) => `$${n.toLocaleString('es-CO')}`
  const base = {
    comisionId: 55,
    estado: 'PENDIENTE',
    antes: null,
    despues: null,
    diferencia: { asesor: 0, convenio: 0, total: 0 },
    liquidacionIds: [] as number[],
    enLiquidacion: false,
    requiereConfirmacionPago: false,
  }
  const recalculo = {
    ...base,
    antes: { monto: 17280, montoAsesor: 17280, montoConvenio: 0 },
    despues: { monto: 4300, montoAsesor: 4300, montoConvenio: 0 },
    diferencia: { asesor: -12980, convenio: 0, total: -12980 },
  }

  it('ANULADA: aviso del backend con el número de la comisión y sin modal', () => {
    const texto = 'La comisión #55 está ANULADA: no se modificó.'
    const c = { ...base, estado: 'ANULADA', accion: 'NO_MODIFICADA' as const, mensaje: texto }
    expect(avisoComision(c)).toEqual({ tipo: 'warning', texto })
    expect(modalComision(c, formatCOP)).toBeNull()
  })

  it('PENDIENTE y APROBADA: modal "cambiará de $X a $Y" sin casilla', () => {
    for (const estado of ['PENDIENTE', 'APROBADA']) {
      const c = { ...recalculo, estado, accion: 'RECALCULADA' as const, mensaje: null }
      expect(avisoComision(c).tipo).toBe('success')
      expect(modalComision(c, formatCOP)).toEqual({
        tipo: 'cambio',
        titulo: 'Confirmar cambio de comisión',
        texto: `La comisión #55 (${estado}) cambiará de $17.280 a $4.300.`,
        requiereCasilla: false,
      })
    }
  })

  it('PAGADA: advertencia fuerte con la diferencia y casilla obligatoria', () => {
    const c = {
      ...recalculo,
      estado: 'PAGADA',
      accion: 'AJUSTADA_TRAS_PAGO' as const,
      mensaje: 'x',
      requiereConfirmacionPago: true,
    }
    const m = modalComision(c, formatCOP)!
    expect(m.tipo).toBe('pagada')
    expect(m.requiereCasilla).toBe(true)
    expect(m.titulo).toBe('Esta comisión ya fue pagada')
    expect(m.texto).toBe(
      'Esta comisión ya fue pagada. Se modificará el monto en el sistema, pero el dinero ya entregado no cambia. Diferencia: −$12.980. La comisión #55 (PAGADA) cambiará de $17.280 a $4.300.',
    )
    expect(avisoComision(c).tipo).toBe('warning')
  })

  it('en liquidación (aunque siga PENDIENTE): igual que PAGADA, con el número de la liquidación', () => {
    const c = {
      ...recalculo,
      accion: 'AJUSTADA_TRAS_PAGO' as const,
      mensaje: null,
      liquidacionIds: [12],
      enLiquidacion: true,
      requiereConfirmacionPago: true,
    }
    const m = modalComision(c, formatCOP)!
    expect(m.requiereCasilla).toBe(true)
    expect(m.texto).toContain('Esta comisión ya está en la liquidación #12.')
  })

  it('sin continuidad o sin comisión: sin modal', () => {
    const sinCont = {
      ...base,
      accion: 'SIN_CONTINUIDAD' as const,
      mensaje: 'No se pudo recalcular: falta la continuidad guardada.',
    }
    expect(avisoComision(sinCont)).toEqual({ tipo: 'warning', texto: sinCont.mensaje })
    expect(modalComision(sinCont, formatCOP)).toBeNull()
    const sinCom = { ...base, comisionId: null, accion: 'SIN_COMISION' as const, mensaje: null }
    expect(avisoComision(sinCom)).toEqual({
      tipo: 'info',
      texto: 'El ticket no tiene comisión que recalcular.',
    })
    expect(modalComision(sinCom, formatCOP)).toBeNull()
  })

  it('al guardar una comisión pagada se envía confirmar_comision_pagada', () => {
    const inicial = formInicialEdicion(CON_DESCUENTO)
    expect(bodyEdicion(inicial, 'Motivo largo', true).confirmar_comision_pagada).toBe(true)
    expect(bodyEdicion(inicial, 'Motivo largo')).not.toHaveProperty('confirmar_comision_pagada')
    expect(bodyEdicion({ ...inicial, descuentoId: null }, 'Motivo largo', true)).toEqual({
      descuento_id: null,
      motivo_edicion: 'Motivo largo',
      confirmar_comision_pagada: true,
    })
  })
})

describe('catálogos compartidos con el modal de confirmación', () => {
  it('descuentos activos en camel o snake', () => {
    expect(
      mapearDescuentosActivos([
        {
          id: 1,
          codigo: 'INFORMATIVO',
          nombre: 'Informativo',
          valor_carro: 50000,
          valor_moto: 30000,
        },
        {
          id: 3,
          codigo: 'INFORMATIVO_EMPLEADO',
          nombre: 'Empleado',
          valorCarro: 60000,
          valorMoto: 35000,
        },
      ]),
    ).toEqual([
      { id: 1, codigo: 'INFORMATIVO', nombre: 'Informativo', valorCarro: 50000, valorMoto: 30000 },
      {
        id: 3,
        codigo: 'INFORMATIVO_EMPLEADO',
        nombre: 'Empleado',
        valorCarro: 60000,
        valorMoto: 35000,
      },
    ])
  })

  it('autorizadores: cargos de la lista o rol GERENCIA', () => {
    const u = (id: number, cargo: string | null, rol: string) => ({
      id,
      nombres: `N${id}`,
      apellidos: 'X',
      cargo: cargo ? { nombre: cargo } : null,
      rol: { nombre: rol },
    })
    expect(
      autorizadoresDescuento([
        u(1, 'Lider de sede', 'OPERATIVO_TURNOS'),
        u(2, null, 'GERENCIA'),
        u(3, 'CAJERA', 'OPERATIVO_TURNOS'),
      ]),
    ).toEqual([
      { id: 1, nombre: 'N1 X' },
      { id: 2, nombre: 'N2 X' },
    ])
  })
})
