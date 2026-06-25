/**
 * QA EFG128 solo – registra los 2 pagos pendientes de EFG128.
 * Ejecutar: node qa-efg128-solo.mjs
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'fs'
import path from 'path'

const BASE  = 'http://localhost:5173'
const TODAY = '2026-06-17'
const CREDS = { email: 'coordinadorsoft@cda.com', password: 'admin123' }
const SS_DIR = path.join(process.cwd(), 'qa-screenshots')

async function ss(page, name) {
  const p = path.join(SS_DIR, `${name}.png`)
  try { await page.screenshot({ path: p, fullPage: false }) } catch {}
  return p
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.locator('input[type="email"]').first().fill(CREDS.email)
  await page.locator('input[type="password"]').first().fill(CREDS.password)
  const btn = page.locator('button').filter({ hasText: /iniciar|ingresar|login|entrar/i }).first()
  if (await btn.count()) await btn.click(); else await page.keyboard.press('Enter')
  await page.waitForURL('**/dashboard**', { timeout: 20000 }).catch(() => page.waitForTimeout(3000))
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(2000)
  console.log('✔ Login OK –', page.url())
}

async function goToTramites(page) {
  await page.goto(`${BASE}/tramites/turnos-tramites`, { waitUntil: 'networkidle', timeout: 30000 })
  if (page.url().includes('/login')) throw new Error('Guard redirigió a /login')
  await page.waitForTimeout(1500)
  try {
    const di = page.locator('input[type="date"]').first()
    await di.waitFor({ timeout: 8000, state: 'visible' })
    if (await di.inputValue() !== TODAY) {
      await di.fill(TODAY)
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      await page.waitForTimeout(1000)
    }
  } catch { console.log('  [WARN] date input no encontrado') }
  await page.waitForSelector('tbody tr', { timeout: 12000, state: 'visible' }).catch(() => {})
  await page.waitForTimeout(800)
}

async function openPagosDialog(page, placa) {
  await goToTramites(page)
  const turnoRows = page.locator('tbody tr').filter({ hasText: /#\d/ })
  const n = await turnoRows.count()
  for (let i = 0; i < n; i++) {
    const btn = turnoRows.nth(i).locator('td:first-child button').first()
    if (!await btn.count() || !await btn.isVisible()) continue
    await btn.click()
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(600)
  }
  await page.waitForTimeout(500)

  const pagosBtns = page.locator('tbody button').filter({ hasText: /pagos/i })
  const total = await pagosBtns.count()
  for (let i = 0; i < total; i++) {
    const b = page.locator('tbody button').filter({ hasText: /pagos/i }).nth(i)
    if (!await b.count() || !await b.isVisible()) continue
    await b.click()
    await page.waitForSelector('.v-overlay__content .v-card', { timeout: 8000 }).catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {})
    await page.waitForTimeout(1000)
    const txt = await page.locator('.v-overlay__content').last().textContent().catch(() => '')
    if (txt.includes(placa)) { console.log(`  ✔ Dialog con ${placa} (botón ${i+1}/${total})`); return }
    await page.keyboard.press('Escape'); await page.waitForTimeout(400)
  }
  throw new Error(`No se encontró dialog con ${placa}`)
}

async function closeDialog(page) {
  await page.keyboard.press('Escape'); await page.waitForTimeout(500)
  try {
    const c = page.locator('.v-overlay__content .v-btn--icon').filter({ has: page.locator('.mdi-close') }).first()
    if (await c.isVisible()) await c.click()
  } catch {}
  await page.waitForTimeout(400)
}

async function selectOpt(page, sel, text) {
  await sel.click(); await page.waitForTimeout(400)
  const opt = page.locator('.v-list-item').filter({ hasText: new RegExp(`^${text}$`, 'i') }).first()
  if (await opt.count()) { await opt.click() }
  else { const f = page.locator('.v-list-item').filter({ hasText: new RegExp(text, 'i') }).first(); await f.waitFor({ timeout: 3000 }); await f.click() }
  await page.waitForTimeout(300)
}

async function registrarPago(page, placa, monto, forma) {
  const dlg  = page.locator('.v-overlay__content').last()
  const card = (await dlg.locator('.v-card--variant-outlined').filter({ hasText: placa }).count())
    ? dlg.locator('.v-card--variant-outlined').filter({ hasText: placa }).first()
    : dlg.locator('.v-card--variant-outlined').first()

  const regBtn = card.locator('button').filter({ hasText: /registrar pago/i }).first()
  await regBtn.waitFor({ timeout: 5000 })
  if (await regBtn.isDisabled()) return { skipped: true, reason: 'botón deshabilitado (saldo=0)' }
  await regBtn.click(); await page.waitForTimeout(700)

  await card.locator('input[type="number"]').first().fill(String(monto))
  await selectOpt(page, card.locator('.v-select').filter({ hasText: /forma de pago/i }).first(), forma)

  await ss(page, `efg128-form-${monto}`)
  const conf = card.locator('button').filter({ hasText: /confirmar pago/i }).first()
  await conf.waitFor({ timeout: 4000 }); await conf.click()
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {})
  await page.waitForTimeout(2000)
  return { skipped: false, ssAfter: await ss(page, `efg128-after-${monto}`) }
}

;(async () => {
  const browser = await chromium.launch({ headless: true, slowMo: 30 })
  const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true })
  const page = await ctx.newPage()
  page.setDefaultTimeout(15000)

  let resultado = 'FALLÓ'
  let detalle   = ''

  try {
    await login(page)

    // ── Pago 1: $200.000 Transferencia ──────────────────────────────────
    console.log('\n── EFG128 pago 1: $200.000 Transferencia ──')
    await openPagosDialog(page, 'EFG128')
    const r1 = await registrarPago(page, 'EFG128', 200000, 'Transferencia')
    if (r1.skipped) throw new Error(`Pago 1 bloqueado: ${r1.reason}`)
    const snack1 = await page.locator('.v-snackbar').textContent().catch(() => '')
    if (/excede|error|inv[aá]lid/i.test(snack1)) throw new Error(`Pago 1 rechazado: "${snack1.trim()}"`)
    console.log(`  Pago 1 OK. Snackbar="${snack1.trim()}"`)

    // Cerrar y reabrir para DOM limpio
    await closeDialog(page)
    await page.waitForTimeout(600)

    // ── Pago 2: $480.000 Efectivo ────────────────────────────────────────
    console.log('\n── EFG128 pago 2: $480.000 Efectivo ──')
    await openPagosDialog(page, 'EFG128')
    const r2 = await registrarPago(page, 'EFG128', 480000, 'Efectivo')
    if (r2.skipped) throw new Error(`Pago 2 bloqueado: ${r2.reason}`)
    const snack2 = await page.locator('.v-snackbar').textContent().catch(() => '')
    const dlgTxt = await page.locator('.v-overlay__content').last().textContent().catch(() => '')
    if (/excede|error|inv[aá]lid/i.test(snack2)) throw new Error(`Pago 2 rechazado: "${snack2.trim()}"`)
    console.log(`  Pago 2 OK. Snackbar="${snack2.trim()}"`)

    const pagado = /pagado en su totalidad|pagado/i.test(dlgTxt)
    resultado = 'APROBADO'
    detalle   = `EFG128: $200k Transferencia + $480k Efectivo → Pagado=${pagado}. Snackbar="${snack2.trim()}"`

    await closeDialog(page)

    // ── Verificación PDF via API ─────────────────────────────────────────
    console.log('\n── Verificación PDF EFG128 ──')
    const token = await page.evaluate(async (creds) => {
      const r = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ correo: creds.email, password: creds.password }) })
      const d = await r.json(); return d.token || localStorage.getItem('token') || null
    }, CREDS)

    if (token) {
      const hist = await page.evaluate(async ({ token, fecha }) => {
        const r = await fetch(`/api/tramites/liquidacion-historial?sedeId=1&fecha=${fecha}&turnoNumero=3`, { headers: { Authorization: `Bearer ${token}` } })
        return r.ok ? r.json() : { error: `HTTP ${r.status}` }
      }, { token, fecha: TODAY })

      const entry = Array.isArray(hist) ? hist.find(t => t.placa === 'EFG128') : null
      if (entry) {
        console.log(`  EFG128 API: estado=${entry.estado}, saldo=${entry.saldoPendiente}, pagos=${entry.pagos?.length}`)
        const lastPago = entry.pagos?.[entry.pagos.length - 1]
        if (lastPago?.id) {
          const pdf = await page.evaluate(async ({ token, id }) => {
            const r = await fetch(`/api/tramites/liquidacion-pago/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
            if (!r.ok) return { ok: false, status: r.status }
            const a = new Uint8Array(await r.arrayBuffer())
            return { ok: true, isPdf: a[0]===0x25&&a[1]===0x50&&a[2]===0x44&&a[3]===0x46, size: a.byteLength }
          }, { token, id: lastPago.id })
          if (pdf.ok && pdf.isPdf) {
            console.log(`  PDF pago ${lastPago.id}: OK ✓ (${pdf.size} bytes)`)
            detalle += ` | API: ${entry.estado}, saldo=${entry.saldoPendiente} | PDF ${pdf.size}B ✓`
          } else {
            console.log(`  PDF pago ${lastPago.id}: ${JSON.stringify(pdf)}`)
          }
        }
      }
    }

  } catch (err) {
    detalle = err.message
    await ss(page, 'efg128-error')
    console.error('ERROR:', err.message)
  } finally {
    await browser.close()
  }

  const icon = resultado === 'APROBADO' ? '✅' : '❌'
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  ${icon} EFG128 — ${resultado}`)
  console.log(`  ${detalle}`)
  console.log('═'.repeat(60))

  writeFileSync(
    path.join(SS_DIR, 'qa-efg128-report.json'),
    JSON.stringify({ fecha: TODAY, resultado, detalle }, null, 2)
  )
})()
