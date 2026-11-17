/**
 * Cédula del convenio para mostrar en pantalla (modal Liquidación RTM y
 * Trazabilidad RTM). Misma regla que formatearCedulaConvenio() del backend
 * (reportes_administrativos_controller.ts) usada en los Excel:
 *  - sin convenio → '—'
 *  - convenio con cédula vacía o inventada por el seeder (9999 + 6 dígitos)
 *    → 'Pendiente'
 *  - cédula real → el número tal cual, como texto.
 */
export const CEDULA_PENDIENTE = 'Pendiente'

export function formatearCedulaConvenio(
  docNumero: string | null | undefined,
  hayConvenio = true,
): string {
  if (!hayConvenio) return '—'
  const doc = String(docNumero ?? '').trim()
  if (!doc || /^9999\d{6}$/.test(doc)) return CEDULA_PENDIENTE
  return doc
}
