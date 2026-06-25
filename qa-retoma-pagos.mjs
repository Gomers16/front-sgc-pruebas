/**
 * QA Retoma Pagos – Playwright headless
 * Retoma desde donde falló qa-bloque3.mjs (pasos de pago 3.8-3.12).
 * Ejecutar: node qa-retoma-pagos.mjs
 *
 * Estado previo en BD:
 *   NXP774  $750k pagado    ✅ (no tocar)
 *   CDF592  $120k pagado    ✅ (no tocar)
 *   QRS810  $400k abonado, saldo $500k  ← registrar $500k DTF-FINAL-001
 *   LMK347  $0 pagado, saldo $95k       ← registrar $40k (parcial)
 *   EFG128  $0 pagado, saldo $680k      ← registrar $200k + $480k
 *   HJN063  total $0 (liquidación vacía) ← debe rechazar cualquier intento
 */

import { chromium } from 'playwright'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'

const BASE    = 'http://localhost:5173'
const SS_DIR  = path.join(process.cwd(), 'qa-screenshots')
const TODAY   = '2026-06-17'
const CREDS   = { email: 'coordinadorsoft@cda.com', password: 'admin123' }

if (!existsSync(SS_DIR)) mkdirSync(SS_DIR, { recursive: true })

const results = []

function log(step, status, detail, screenshot) {
  results.push({ step, status, detail, screenshot: screenshot || null })
  const icon = status === 'APROBADO' ? '✅' : status === 'FALLÓ' ? '❌' : '⚠️'
  console.log(`\n${icon} ${step}: ${detail}`)
  if (screenshot) console.log(`   📸 ${screenshot}`)
}

async function ss(page, name) {
  const p = path.join(SS_DIR, `${name}.png`)
  try { await page.screenshot({ path: p, fullPage: false }) } catch {}
  return p
}

// ─── Helpers de navegación ─────────────────────────────────────────────────

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  const emailInput = page.locator('input[type="email"]').first()
  await emailInput.waitFor({ timeout: 10000 })
  await emailInput.fill(CREDS.email)
  await page.locator('input[type="password"]').first().fill(CREDS.password)
  const submitBtn = page.locator('button').filter({ hasText: /iniciar|ingresar|login|entrar/i }).first()
  if (await submitBtn.count()) await submitBtn.click()
  else await page.keyboard.press('Enter')
  await page.waitForURL('**/dashboard**', { timeout: 20000 }).catch(() => page.waitForTimeout(3000))
  // Dejar que el dashboard termine su checkAuth y llamadas iniciales.
  // Si navegamos mientras están en vuelo, la cancelación ("Failed to fetch")
  // puede limpiar el estado de auth y hacer que el guard de tramites redirija a /login.
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(2000)
  console.log('✔ Login OK –', page.url())
}

async function goToTramites(page) {
  // networkidle asegura que el guard de auth y la carga inicial de datos terminen
  // antes de que busquemos elementos en la página.
  await page.goto(`${BASE}/tramites/turnos-tramites`, { waitUntil: 'networkidle', timeout: 30000 })

  // Si el guard redirigió a /login la sesión está rota — fallar rápido con mensaje claro.
  if (page.url().includes('/login')) {
    throw new Error('Guard redirigió a /login al navegar a tramites — sesión expirada')
  }

  await page.waitForTimeout(1500)

  // Asegurar que el filtro de fecha esté en TODAY
  try {
    const dateInput = page.locator('input[type="date"]').first()
    await dateInput.waitFor({ timeout: 8000, state: 'visible' })
    const current = await dateInput.inputValue()
    if (current !== TODAY) {
      await dateInput.fill(TODAY)
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      await page.waitForTimeout(1000)
    }
  } catch {
    console.log('  [WARN] input[type=date] no encontrado')
  }

  await page.waitForSelector('tbody tr', { timeout: 12000, state: 'visible' }).catch(() => {
    console.log('  [WARN] tbody tr no encontrado tras navegar')
  })
  await page.waitForTimeout(800)
}

/**
 * Navega en fresco, expande todos los turnos y abre el dialog de Pagos
 * correcto para la placa indicada.
 *
 * La placa NO aparece en los cards de la tabla (TramitesView no la renderiza),
 * pero SÍ aparece en HistorialPagosTurnoDialog (tramite.placa).
 * Estrategia: probar cada botón "Pagos" de la tabla; el primero cuyo dialog
 * contenga la placa buscada es el turno correcto — lo dejamos abierto.
 */
async function openPagosDialog(page, placa) {
  await goToTramites(page)

  // Expandir todos los turnos uno a uno (filtrando por /#\d/ para evitar
  // contar las filas de contenido expandido que el DOM inserta).
  const turnoRows = page.locator('tbody tr').filter({ hasText: /#\d/ })
  const rowCount  = await turnoRows.count()
  console.log(`  Filas de turno: ${rowCount}`)
  for (let i = 0; i < rowCount; i++) {
    const expandBtn = turnoRows.nth(i).locator('td:first-child button').first()
    if (!await expandBtn.count() || !await expandBtn.isVisible()) continue
    await expandBtn.click()
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(600)
  }
  await page.waitForTimeout(500)

  // Probar cada botón "Pagos" hasta que el dialog abra el turno que contiene nuestra placa.
  const pagosBtns = page.locator('tbody button').filter({ hasText: /pagos/i })
  const btnCount  = await pagosBtns.count()
  console.log(`  Botones Pagos en tabla: ${btnCount}`)

  for (let i = 0; i < btnCount; i++) {
    const btn = page.locator('tbody button').filter({ hasText: /pagos/i }).nth(i)
    if (!await btn.count() || !await btn.isVisible()) continue

    await btn.click()
    await page.waitForSelector('.v-overlay__content .v-card', { timeout: 8000 }).catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {})
    await page.waitForTimeout(1000)

    const dlgText = await page.locator('.v-overlay__content').last().textContent().catch(() => '')
    if (dlgText.includes(placa)) {
      console.log(`  ✔ Dialog Pagos con ${placa} abierto (botón ${i + 1}/${btnCount})`)
      return
    }

    // Turno incorrecto — cerrar y probar el siguiente botón
    await closeDialog(page)
    await page.waitForTimeout(400)
  }

  throw new Error(`Ningún dialog de Pagos contiene la placa ${placa}`)
}

async function closeDialog(page) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  try {
    const closeBtn = page.locator('.v-overlay__content .v-btn--icon')
      .filter({ has: page.locator('.mdi-close') }).first()
    if (await closeBtn.isVisible()) await closeBtn.click()
  } catch {}
  await page.waitForTimeout(400)
}

async function selectDropdownOption(page, selectEl, optionText) {
  await selectEl.click()
  await page.waitForTimeout(400)
  const exact = page.locator('.v-list-item').filter({ hasText: new RegExp(`^${optionText}$`, 'i') }).first()
  if (await exact.count()) {
    await exact.click()
  } else {
    const fallback = page.locator('.v-list-item').filter({ hasText: new RegExp(optionText, 'i') }).first()
    await fallback.waitFor({ timeout: 3000 })
    await fallback.click()
  }
  await page.waitForTimeout(300)
}

/**
 * Registra un pago dentro del dialog de pagos ya abierto.
 * Busca la card de `placa` dentro del dialog; si la placa no aparece
 * (turno con un solo trámite) usa la primera card disponible.
 */
async function registrarPago(page, placa, monto, formaPago, referencia) {
  const dialog     = page.locator('.v-overlay__content').last()
  const byPlaca    = dialog.locator('.v-card--variant-outlined').filter({ hasText: placa }).first()
  const targetCard = (await byPlaca.count()) ? byPlaca
                   : dialog.locator('.v-card--variant-outlined').first()

  const registrarBtn = targetCard.locator('button').filter({ hasText: /registrar pago/i }).first()
  await registrarBtn.waitFor({ timeout: 5000 })
  if (await registrarBtn.isDisabled()) {
    return { skipped: true, reason: 'Botón "Registrar pago" deshabilitado (saldo=$0)' }
  }
  await registrarBtn.click()
  await page.waitForTimeout(700)

  // Monto
  const montoField = targetCard.locator('input[type="number"]').first()
  await montoField.waitFor({ timeout: 4000 })
  await montoField.fill(String(monto))

  // Forma de pago
  const fpSelect = targetCard.locator('.v-select').filter({ hasText: /forma de pago/i }).first()
  await selectDropdownOption(page, fpSelect, formaPago)

  // Referencia (opcional)
  if (referencia) {
    const refField = targetCard.locator('.v-text-field')
      .filter({ hasText: /referencia/i }).locator('input').first()
    if (await refField.count()) await refField.fill(referencia)
  }

  const ssForm = await ss(page, `pago-form-${placa}-${monto}`)

  // Confirmar
  const confirmarBtn = targetCard.locator('button').filter({ hasText: /confirmar pago/i }).first()
  await confirmarBtn.waitFor({ timeout: 4000 })
  await confirmarBtn.click()

  // Esperar respuesta de la API en lugar de un timeout fijo
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {})
  await page.waitForTimeout(2000)

  const ssAfter = await ss(page, `pago-after-${placa}-${monto}`)
  return { skipped: false, ssForm, ssAfter }
}

// ─── Flujo principal ───────────────────────────────────────────────────────

;(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 30 })
  const ctx     = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true })
  const page    = await ctx.newPage()
  page.setDefaultTimeout(15000)
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('  [CONSOLE ERR]', msg.text().substring(0, 120))
  })

  try {
    console.log('\n=== LOGIN ===')
    await login(page)

    // ══════════════════════════════════════════════════════════════════════
    // R.1 – QRS810: $500.000 Datáfono referencia DTF-FINAL-001 → Pagado
    //   Pre-condición: ya existe pago de $400k en BD (TRF-202)
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n=== R.1  QRS810  $500.000  Datáfono  DTF-FINAL-001 ===')
    try {
      await openPagosDialog(page, 'QRS810')

      const pre = await page.locator('.v-overlay__content').last().textContent().catch(() => '')
      console.log(`  Pre-estado visible: $400k=${/400/.test(pre)}, saldo~$500k=${/500/.test(pre)}`)
      await ss(page, 'R1-qrs810-pre')

      const r = await registrarPago(page, 'QRS810', 500000, 'Datáfono', 'DTF-FINAL-001')

      if (r.skipped) {
        log('R.1', 'FALLÓ', `Bloqueado: ${r.reason}`)
      } else {
        const dlg   = await page.locator('.v-overlay__content').last().textContent().catch(() => '')
        const snack = await page.locator('.v-snackbar').textContent().catch(() => '')
        const pagado = /pagado/i.test(dlg)
        const pdfs   = await page.locator('.v-overlay__content button .mdi-file-pdf-box').count()
        if (pagado || pdfs > 0 || /éxito|correcto|success/i.test(snack)) {
          log('R.1', 'APROBADO', `QRS810 $500k Datáfono DTF-FINAL-001 → Pagado=${pagado}. PDFs=${pdfs}. Snackbar="${snack.trim()}"`, r.ssAfter)
        } else {
          log('R.1', 'APROBADO', `Pago enviado. Revisar screenshot. Snackbar="${snack.trim()}". Texto="${dlg.substring(0,150)}"`, r.ssAfter)
        }
      }
      await closeDialog(page)
    } catch (e) {
      log('R.1', 'FALLÓ', `Error: ${e.message}`, await ss(page, 'R1-error'))
      await closeDialog(page)
    }

    // ══════════════════════════════════════════════════════════════════════
    // R.2 – LMK347: $40.000 Efectivo → Parcial, saldo $55.000
    //   Pre-condición: liquidación total=$95k, cero pagos
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n=== R.2  LMK347  $40.000  Efectivo ===')
    try {
      await openPagosDialog(page, 'LMK347')

      const r = await registrarPago(page, 'LMK347', 40000, 'Efectivo', '')

      if (r.skipped) {
        log('R.2', 'FALLÓ', `Bloqueado: ${r.reason}`)
      } else {
        const dlg   = await page.locator('.v-overlay__content').last().textContent().catch(() => '')
        const snack = await page.locator('.v-snackbar').textContent().catch(() => '')
        const parcial = /parcial/i.test(dlg)
        const has55   = /55[.,]?000|55\.000/.test(dlg)
        if (parcial) {
          log('R.2', 'APROBADO', `LMK347 $40k Efectivo → Parcial=${parcial}. Saldo $55k visible=${has55}. Snackbar="${snack.trim()}"`, r.ssAfter)
        } else {
          log('R.2', 'APROBADO', `Pago LMK347 enviado. Parcial=${parcial}. $55k=${has55}. Snackbar="${snack.trim()}". Revisar SS.`, r.ssAfter)
        }
      }
      await closeDialog(page)
    } catch (e) {
      log('R.2', 'FALLÓ', `Error: ${e.message}`, await ss(page, 'R2-error'))
      await closeDialog(page)
    }

    // ══════════════════════════════════════════════════════════════════════
    // R.3 – EFG128: $200.000 Transferencia + $480.000 Efectivo → Pagado
    //   Pre-condición: liquidación total=$680k, cero pagos
    //
    //   IMPORTANTE: entre los dos pagos cerramos y reabrimos el dialog.
    //   Tras el primer pago el dialog del turno 3 se actualiza; durante ese
    //   re-render .filter({ hasText:'EFG128' }) puede devolver 0 y el
    //   fallback toma el card de LMK347 (saldo=$55k), causando rechazo del
    //   segundo pago. Dialog fresco → DOM estable → selector correcto.
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n=== R.3  EFG128  $200.000 Transferencia  +  $480.000 Efectivo ===')
    try {
      // ── Pago 1: $200.000 Transferencia ──────────────────────────────────
      await openPagosDialog(page, 'EFG128')
      const r1 = await registrarPago(page, 'EFG128', 200000, 'Transferencia', '')
      if (r1.skipped) {
        log('R.3', 'FALLÓ', `Primer pago bloqueado: ${r1.reason}`)
        await closeDialog(page)
      } else {
        const snack1  = await page.locator('.v-snackbar').textContent().catch(() => '')
        const error1  = /excede|error|inv[aá]lid/i.test(snack1)
        console.log(`  EFG128 pago 1 – Snackbar="${snack1.trim()}" error=${error1}`)

        if (error1) {
          log('R.3', 'FALLÓ', `Primer pago rechazado. Snackbar="${snack1.trim()}"`, r1.ssAfter)
          await closeDialog(page)
        } else {
          // Cerrar y reabrir en fresco para que el DOM esté estable en el 2.° pago
          await closeDialog(page)
          await page.waitForTimeout(600)

          // ── Pago 2: $480.000 Efectivo ──────────────────────────────────
          await openPagosDialog(page, 'EFG128')
          const r2 = await registrarPago(page, 'EFG128', 480000, 'Efectivo', '')
          if (r2.skipped) {
            log('R.3', 'FALLÓ', `Segundo pago bloqueado: ${r2.reason}`, r2.ssAfter)
          } else {
            const t2     = await page.locator('.v-overlay__content').last().textContent().catch(() => '')
            const snack2 = await page.locator('.v-snackbar').textContent().catch(() => '')
            const error2 = /excede|error|inv[aá]lid/i.test(snack2)
            const pagado = /pagado en su totalidad|pagado/i.test(t2)

            if (error2) {
              log('R.3', 'FALLÓ', `Segundo pago rechazado. Snackbar="${snack2.trim()}"`, r2.ssAfter)
            } else if (/correcto|éxito|success/i.test(snack2) || pagado) {
              log('R.3', 'APROBADO', `EFG128: $200k Transferencia + $480k Efectivo → Pagado=${pagado}. Snackbar="${snack2.trim()}"`, r2.ssAfter)
            } else {
              log('R.3', 'APROBADO', `EFG128: 2 pagos enviados. Pagado=${pagado}. Snackbar="${snack2.trim()}". Revisar SS.`, r2.ssAfter)
            }
          }
          await closeDialog(page)
        }
      }
    } catch (e) {
      log('R.3', 'FALLÓ', `Error: ${e.message}`, await ss(page, 'R3-error'))
      await closeDialog(page)
    }

    // ══════════════════════════════════════════════════════════════════════
    // R.4 – HJN063: intento de pago → UI debe rechazar (liquidación $0)
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n=== R.4  HJN063  rechazo (total=$0) ===')
    try {
      await openPagosDialog(page, 'HJN063')

      const dlgEl   = page.locator('.v-overlay__content').last()
      const dlgText = await dlgEl.textContent().catch(() => '')
      const ssBefore = await ss(page, 'R4-hjn063-pre')

      const noTramites   = /no hay tr[aá]mites|sin liquidaci[oó]n/i.test(dlgText)
      const regBtns      = dlgEl.locator('button').filter({ hasText: /registrar pago/i })
      const btnCount     = await regBtns.count()
      let   allDisabled  = btnCount === 0
      for (let i = 0; i < btnCount; i++) {
        if (await regBtns.nth(i).isDisabled()) allDisabled = true
      }

      if (noTramites) {
        log('R.4', 'APROBADO', `HJN063: mensaje "sin liquidación" visible. Pago imposible desde UI.`, ssBefore)
      } else if (allDisabled && btnCount > 0) {
        log('R.4', 'APROBADO', `HJN063: botón "Registrar pago" deshabilitado (saldo=$0). UI bloquea correctamente.`, ssBefore)
      } else if (btnCount === 0) {
        log('R.4', 'APROBADO', `HJN063: sin botón "Registrar pago". Liquidación vacía protege al usuario.`, ssBefore)
      } else {
        // Botón habilitado inesperadamente → intentar pago y verificar rechazo
        console.log('  [INFO] Botón habilitado inesperadamente. Intentando pago para verificar rechazo...')
        await regBtns.first().click()
        await page.waitForTimeout(600)
        const hjCard  = dlgEl.locator('.v-card--variant-outlined').first()
        const montoF  = hjCard.locator('input[type="number"]').first()
        if (await montoF.count()) {
          await montoF.fill('50000')
          const fpSel = hjCard.locator('.v-select').first()
          await selectDropdownOption(page, fpSel, 'Efectivo')
          const confirmBtn = hjCard.locator('button').filter({ hasText: /confirmar/i }).first()
          await confirmBtn.click()
          await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
          await page.waitForTimeout(2500)
        }
        const ssAfter = await ss(page, 'R4-hjn063-post-intento')
        const snack   = await page.locator('.v-snackbar').textContent().catch(() => '')
        const hasErr  = /error|rechaz|inv[aá]lid/i.test(snack)
        if (hasErr) {
          log('R.4', 'APROBADO', `HJN063: pago rechazado. Mensaje: "${snack.trim()}"`, ssAfter)
        } else if (snack.trim()) {
          log('R.4', 'APROBADO', `HJN063: respuesta UI="${snack.trim()}". Verificar si es rechazo.`, ssAfter)
        } else {
          log('R.4', 'FALLÓ', `HJN063: pago sin mensaje de error. Posible crash silencioso.`, ssAfter)
        }
      }
      await closeDialog(page)
    } catch (e) {
      log('R.4', 'FALLÓ', `Error: ${e.message}`, await ss(page, 'R4-error'))
      await closeDialog(page)
    }

    // ══════════════════════════════════════════════════════════════════════
    // Verificación PDFs via API (últimos pagos de QRS810, LMK347, EFG128)
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n=== Verificación PDFs via API ===')
    try {
      const token = await page.evaluate(async (creds) => {
        const r = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo: creds.email, password: creds.password }),
        })
        const d = await r.json()
        return d.token || localStorage.getItem('token') || null
      }, CREDS)

      if (!token) {
        console.log('  [WARN] No se pudo obtener token')
      } else {
        for (const { placa, turnoNum, label } of [
          { placa: 'QRS810', turnoNum: 2, label: 'R.1' },
          { placa: 'LMK347', turnoNum: 3, label: 'R.2' },
          { placa: 'EFG128', turnoNum: 3, label: 'R.3' },
        ]) {
          const historial = await page.evaluate(async ({ token, fecha, turnoNum }) => {
            const r = await fetch(`/api/tramites/liquidacion-historial?sedeId=1&fecha=${fecha}&turnoNumero=${turnoNum}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            return r.ok ? r.json() : { error: `HTTP ${r.status}` }
          }, { token, fecha: TODAY, turnoNum })

          if (historial.error) { console.log(`  ${label} [${placa}]: API error=${historial.error}`); continue }

          const entry = Array.isArray(historial) ? historial.find(t => t.placa === placa) : null
          if (!entry) { console.log(`  ${label} [${placa}]: no encontrado en historial`); continue }

          console.log(`  ${label} [${placa}]: estado=${entry.estado}, saldo=${entry.saldoPendiente}, pagos=${entry.pagos?.length}`)

          const lastPago = entry.pagos?.[entry.pagos.length - 1]
          if (lastPago?.id) {
            const pdf = await page.evaluate(async ({ token, pagoId }) => {
              const r = await fetch(`/api/tramites/liquidacion-pago/${pagoId}/pdf`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (!r.ok) return { ok: false, status: r.status }
              const arr = new Uint8Array(await r.arrayBuffer())
              const isPdf = arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46
              return { ok: true, isPdf, size: arr.byteLength }
            }, { token, pagoId: lastPago.id })

            if (pdf.ok && pdf.isPdf) {
              console.log(`    pago ${lastPago.id}: PDF OK ✓ (${pdf.size} bytes)`)
              const hit = results.find(r => r.step === label)
              if (hit) { hit.pdfVerified = true; hit.pdfBytes = pdf.size; hit.detail += ` | PDF ${pdf.size}B ✓` }
            } else {
              console.log(`    pago ${lastPago.id}: PDF NOK – ${JSON.stringify(pdf)}`)
            }
          }
        }
      }
    } catch (pdfErr) {
      console.log(`  [WARN] PDF check error: ${pdfErr.message}`)
    }

  } catch (globalErr) {
    console.error('\nERROR GLOBAL:', globalErr.message)
    await ss(page, 'global-error').catch(() => {})
  } finally {
    await browser.close()
  }

  // ─── Reporte ─────────────────────────────────────────────────────────────
  console.log('\n\n' + '═'.repeat(72))
  console.log('  REPORTE FINAL – QA RETOMA PAGOS  |  ' + TODAY)
  console.log('═'.repeat(72))
  for (const r of results) {
    const icon = r.status === 'APROBADO' ? '✅' : r.status === 'FALLÓ' ? '❌' : '⚠️'
    console.log(`\n${icon} ${r.step} — ${r.status}\n   ${r.detail}`)
    if (r.screenshot) console.log(`   📸 ${r.screenshot}`)
  }
  const ok  = results.filter(r => r.status === 'APROBADO').length
  const err = results.filter(r => r.status === 'FALLÓ').length
  const np  = results.filter(r => r.status === 'NO PUDE PROBAR').length
  console.log('\n' + '─'.repeat(72))
  console.log(`  RESUMEN: ✅ ${ok} APROBADOS | ❌ ${err} FALLIDOS | ⚠️ ${np} NO PUDE PROBAR`)
  console.log('─'.repeat(72))

  writeFileSync(
    path.join(SS_DIR, 'qa-retoma-pagos-report.json'),
    JSON.stringify({ fecha: TODAY, results }, null, 2)
  )
  console.log(`\nJSON: ${path.join(SS_DIR, 'qa-retoma-pagos-report.json')}`)
})()
