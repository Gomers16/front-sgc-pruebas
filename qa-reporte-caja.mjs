/**
 * QA Reporte de Caja – Playwright headless
 * Ejecutar: node qa-reporte-caja.mjs
 */

import { chromium } from 'playwright'
import { mkdirSync, existsSync } from 'fs'
import path from 'path'

const BASE   = 'http://localhost:5173'
const SS_DIR = path.join(process.cwd(), 'qa-screenshots')
const CREDS  = { email: 'coordinadorsoft@cda.com', password: 'admin123' }

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

// Espera que la URL no sea login y que el DOM tenga al menos un elemento de app
async function waitApp(page, timeout = 10000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const url = page.url()
    if (!url.includes('/login')) {
      // Espera a que aparezca el v-app o al menos el body con contenido
      const ok = await page.locator('#app, .v-application').isVisible({ timeout: 2000 }).catch(() => false)
      if (ok) return true
    }
    await page.waitForTimeout(300)
  }
  return false
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.waitForTimeout(1000)

  // Llena email
  const emailInput = page.locator('input[type="email"]').first()
  await emailInput.waitFor({ state: 'visible', timeout: 8000 })
  await emailInput.fill(CREDS.email)

  // Llena password
  const passInput = page.locator('input[type="password"]').first()
  await passInput.fill(CREDS.password)

  // Submit
  const submitBtn = page.getByRole('button', { name: /Ingresar|Iniciar|Login|Entrar/i }).first()
  const hasBtnNamed = await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)
  if (hasBtnNamed) {
    await submitBtn.click()
  } else {
    await page.locator('button[type="submit"]').first().click()
  }

  // Espera salir de /login
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 12000 })
  await page.waitForTimeout(1500)
  console.log('🔐 Login OK –', page.url())
}

// Navega a la ruta y espera a que la página cargue (sale de /login si redirige)
async function gotoRC(page) {
  await page.goto(`${BASE}/tramites/reporte-caja`, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.waitForTimeout(1200)
  // Si redirige a login, re-loguear
  if (page.url().includes('/login')) {
    console.log('   ↪ Redirigió a login, re-autenticando...')
    await login(page)
    await page.goto(`${BASE}/tramites/reporte-caja`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(1200)
  }
}

// Hace clic en un botón por texto visible (compatible con Vuetify).
// Usa force:true para que el v-navigation-drawer en hover no intercepte.
async function clickText(page, text, timeout = 8000) {
  const byRole = page.getByRole('button', { name: new RegExp(text, 'i') }).first()
  const v1 = await byRole.isVisible({ timeout: 2000 }).catch(() => false)
  if (v1) { await byRole.click({ force: true, timeout }); return }

  const byFilter = page.locator('button').filter({ hasText: new RegExp(text, 'i') }).first()
  await byFilter.click({ force: true, timeout })
}

// ── 2.1 Navegación directa ────────────────────────────────────────────────────
async function test21(page) {
  try {
    await gotoRC(page)
    const url = page.url()
    if (url.includes('/login')) {
      log('2.1 Navegación directa', 'FALLÓ', `Redirigió a login: ${url}`)
      return
    }

    const title = page.locator('h2, .text-h5, .text-h6').filter({ hasText: /reporte de caja/i }).first()
    const found = await title.isVisible({ timeout: 5000 }).catch(() => false)
    const ssPath = await ss(page, '2.1-nav-directa')

    if (!found) {
      const bodySnippet = (await page.locator('body').innerText()).slice(0, 200)
      log('2.1 Navegación directa', 'FALLÓ', `Título no visible. URL: ${url}. Cuerpo: ${bodySnippet}`, ssPath)
    } else {
      log('2.1 Navegación directa', 'APROBADO', `Página carga sin 404 ni pantalla blanca. URL: ${url}`, ssPath)
    }
  } catch (e) {
    log('2.1 Navegación directa', 'FALLÓ', `Excepción: ${e.message}`)
  }
}

// ── 2.2 Desde TramitesView ────────────────────────────────────────────────────
async function test22(page) {
  try {
    await page.goto(`${BASE}/tramites`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(1500)

    if (page.url().includes('/login')) {
      await login(page)
      await page.goto(`${BASE}/tramites`, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForTimeout(1500)
    }

    // Chequea si TramitesView cargó correctamente
    const tramitesTitle = page.locator('h2').filter({ hasText: /cola de tr[aá]mites/i }).first()
    const titleOk = await tramitesTitle.isVisible({ timeout: 4000 }).catch(() => false)

    if (!titleOk) {
      const ssPath = await ss(page, '2.2-tramitesview-error')
      log('2.2 Botón en TramitesView', 'FALLÓ',
        `TramitesView no cargó correctamente (título no visible). URL: ${page.url()}`, ssPath)
      return
    }

    // Busca el botón "Reporte de Caja"
    const btn = page.getByRole('button', { name: /reporte de caja/i }).first()
    const v1 = await btn.isVisible({ timeout: 3000 }).catch(() => false)
    const btnAlt = page.locator('button, a').filter({ hasText: /reporte de caja/i }).first()
    const v2 = await btnAlt.isVisible({ timeout: 3000 }).catch(() => false)

    if (!v1 && !v2) {
      const ssPath = await ss(page, '2.2-no-btn')
      log('2.2 Botón en TramitesView', 'FALLÓ', 'Botón "Reporte de Caja" no encontrado en /tramites', ssPath)
      return
    }

    await (v1 ? btn : btnAlt).click()
    await page.waitForTimeout(1500)
    const landed = page.url().includes('reporte-caja')
    const ssPath = await ss(page, '2.2-nav-desde-tramites')
    log('2.2 Botón en TramitesView', landed ? 'APROBADO' : 'FALLÓ',
      landed ? `Navegó a ${page.url()}` : `URL inesperada: ${page.url()}`, ssPath)
  } catch (e) {
    log('2.2 Botón en TramitesView', 'FALLÓ', `Excepción: ${e.message}`)
  }
}

// ── 2.3 "Hoy" y métricas ─────────────────────────────────────────────────────
async function test23(page) {
  try {
    await gotoRC(page)

    // Debug: lista todos los botones visibles
    const botonesTexto = await page.locator('button').allInnerTexts()
    console.log('   [debug] Botones en /reporte-caja:', botonesTexto.map(t => t.trim()).filter(Boolean).join(' | '))

    await clickText(page, 'Hoy')
    await page.waitForTimeout(300)
    await clickText(page, 'Consultar')
    await page.waitForTimeout(2500)

    const bodyText  = await page.locator('body').innerText()
    const hasUndef  = /\$\s*undefined|\$\s*NaN/i.test(bodyText)
    const cards     = await page.locator('.v-card').filter({ hasText: /\$\s*[\d.,]/ }).count()
    const ssPath    = await ss(page, '2.3-hoy-metricas')

    if (hasUndef) {
      log('2.3 Métricas "Hoy"', 'FALLÓ', 'Se encontró "$undefined" o "$NaN" en la página', ssPath)
    } else if (cards === 0) {
      const snippet = bodyText.slice(0, 300)
      log('2.3 Métricas "Hoy"', 'FALLÓ', `No hay tarjetas con montos. Página: ${snippet}`, ssPath)
    } else {
      log('2.3 Métricas "Hoy"', 'APROBADO', `${cards} tarjeta(s) con montos válidos, sin $undefined/$NaN`, ssPath)
    }
  } catch (e) {
    const ssPath = await ss(page, '2.3-error').catch(() => '')
    log('2.3 Métricas "Hoy"', 'FALLÓ', `Excepción: ${e.message}`, ssPath)
  }
}

// ── 2.4 "Esta semana" ────────────────────────────────────────────────────────
async function test24(page) {
  try {
    await gotoRC(page)

    // Total de "Hoy"
    await clickText(page, 'Hoy')
    await clickText(page, 'Consultar')
    await page.waitForTimeout(2500)

    const extractTotal = async () => {
      const txt = await page.locator('.v-card').filter({ hasText: /TOTAL INGRESADO/i })
        .first().innerText().catch(() => '')
      const m = txt.match(/\$\s*([\d.,]+)/)
      if (!m) return 0
      return parseInt(m[1].replace(/\./g, '').replace(',', ''), 10)
    }
    const totalHoy = await extractTotal()

    // Ahora "Esta semana"
    await clickText(page, 'Esta semana')
    await page.waitForTimeout(300)
    const fechaInicioVal = await page.locator('input[type="date"]').first().inputValue()
    const todayStr = new Date().toISOString().slice(0, 10)

    await clickText(page, 'Consultar')
    await page.waitForTimeout(2500)
    const totalSemana = await extractTotal()
    const ssPath = await ss(page, '2.4-semana-metricas')

    const rangoOk  = fechaInicioVal !== '' && fechaInicioVal !== todayStr
    const totalOk  = totalSemana >= totalHoy

    if (!rangoOk) {
      log('2.4 "Esta semana"', 'FALLÓ',
        `fechaInicio no cambió a lunes (valor=${fechaInicioVal}, hoy=${todayStr})`, ssPath)
    } else if (!totalOk) {
      log('2.4 "Esta semana"', 'FALLÓ',
        `Total semana (${totalSemana}) < total hoy (${totalHoy}) — inconsistente`, ssPath)
    } else {
      log('2.4 "Esta semana"', 'APROBADO',
        `fechaInicio=${fechaInicioVal} (inicio semana), totalSemana=${totalSemana} >= totalHoy=${totalHoy}`, ssPath)
    }
  } catch (e) {
    const ssPath = await ss(page, '2.4-error').catch(() => '')
    log('2.4 "Esta semana"', 'FALLÓ', `Excepción: ${e.message}`, ssPath)
  }
}

// ── 2.5 Rango sin pagos ──────────────────────────────────────────────────────
async function test25(page) {
  try {
    await gotoRC(page)
    const inputs = page.locator('input[type="date"]')
    await inputs.nth(0).waitFor({ state: 'visible', timeout: 6000 })
    await inputs.nth(0).fill('2026-01-01')
    await inputs.nth(1).fill('2026-01-31')
    await clickText(page, 'Consultar')
    await page.waitForTimeout(2500)

    const bodyText = await page.locator('body').innerText()
    const noData   = /no hay pagos registrados en este per/i.test(bodyText)
    const crashed  = /Uncaught|TypeError.*undefined|cannot read/i.test(bodyText)

    if (crashed) {
      log('2.5 Rango sin pagos', 'FALLÓ', `Crash detectado: ${bodyText.slice(0, 120)}`)
    } else if (!noData) {
      log('2.5 Rango sin pagos', 'FALLÓ',
        `Mensaje "No hay pagos" no apareció. Snippet: ${bodyText.slice(0, 200)}`)
    } else {
      log('2.5 Rango sin pagos', 'APROBADO', 'Mensaje de período sin pagos visible, sin crash')
    }
  } catch (e) {
    log('2.5 Rango sin pagos', 'FALLÓ', `Excepción: ${e.message}`)
  }
}

// Consulta "Hoy"; si está vacío, recae en "Esta semana"
async function consultarConDatos(page) {
  await clickText(page, 'Hoy')
  await clickText(page, 'Consultar')
  await page.waitForTimeout(2500)
  const bodyText = await page.locator('body').innerText()
  if (/no hay pagos registrados/i.test(bodyText)) {
    console.log('   [info] Hoy sin pagos, probando con "Esta semana"')
    await clickText(page, 'Esta semana')
    await clickText(page, 'Consultar')
    await page.waitForTimeout(2500)
    return 'Esta semana'
  }
  return 'Hoy'
}

// ── 2.6 Expandir liquidación ─────────────────────────────────────────────────
async function test26(page) {
  try {
    await gotoRC(page)
    const periodo = await consultarConDatos(page)

    // Busca el chevron dentro de una tarjeta de liquidación (descarta el del nav drawer)
    const chevron = page.locator('.v-card-text .mdi-chevron-down').first()
    const hasChevron = await chevron.isVisible({ timeout: 4000 }).catch(() => false)

    if (!hasChevron) {
      const ssPath = await ss(page, '2.6-sin-liquidaciones')
      const bodyText = await page.locator('body').innerText()
      const noData = /no hay pagos registrados/i.test(bodyText)
      log('2.6 Expandir liquidación',
        noData ? 'NO PUDE PROBAR' : 'FALLÓ',
        noData
          ? `No hay liquidaciones en "${periodo}" para expandir`
          : 'No se encontró botón de expansión aunque hay contenido',
        ssPath)
      return
    }

    await chevron.click({ force: true })
    await page.waitForTimeout(1200)

    const tabla = page.locator('.v-table, table').filter({ hasText: /Fecha|Monto/i }).first()
    const tablaVisible = await tabla.isVisible({ timeout: 3000 }).catch(() => false)
    const ssPath = await ss(page, '2.6-expandir-liquidacion')

    if (!tablaVisible) {
      log('2.6 Expandir liquidación', 'FALLÓ', 'Tabla de pagos no apareció tras expandir', ssPath)
    } else {
      const filas = await tabla.locator('tbody tr').count()
      log('2.6 Expandir liquidación', 'APROBADO',
        `Tabla de "Pagos en el período" visible con ${filas} fila(s)`, ssPath)
    }
  } catch (e) {
    const ssPath = await ss(page, '2.6-error').catch(() => '')
    log('2.6 Expandir liquidación', 'FALLÓ', `Excepción: ${e.message}`, ssPath)
  }
}

// ── 2.7 Chip "Turno #N" ──────────────────────────────────────────────────────
async function test27(page) {
  try {
    await gotoRC(page)
    const periodo = await consultarConDatos(page)

    const bodyText = await page.locator('body').innerText()
    const noData = /no hay pagos registrados/i.test(bodyText)
    if (noData) {
      log('2.7 Chip "Turno #N"', 'NO PUDE PROBAR', `No hay liquidaciones en "${periodo}" para verificar el chip`)
      return
    }

    const chips = page.locator('.v-chip').filter({ hasText: /Turno\s*#\d+/i })
    const count = await chips.count()

    if (count === 0) {
      // Toma screenshot para diagnóstico
      const ssPath = await ss(page, '2.7-no-chip-turno')
      log('2.7 Chip "Turno #N"', 'FALLÓ',
        'Ningún chip con texto "Turno #N" encontrado (¿backend retorna turnoNumero?)', ssPath)
    } else {
      const sample = await chips.first().innerText().catch(() => '?')
      log('2.7 Chip "Turno #N"', 'APROBADO',
        `${count} chip(s) de turno visibles, ej: "${sample.trim()}"`)
    }
  } catch (e) {
    log('2.7 Chip "Turno #N"', 'FALLÓ', `Excepción: ${e.message}`)
  }
}

// ── 2.8 Chips de estado ──────────────────────────────────────────────────────
async function test28(page) {
  try {
    await gotoRC(page)
    const periodo = await consultarConDatos(page)

    const bodyText = await page.locator('body').innerText()
    const noData = /no hay pagos registrados/i.test(bodyText)
    if (noData) {
      log('2.8 Chips de estado', 'NO PUDE PROBAR', `No hay liquidaciones en "${periodo}" para verificar chips`)
      return
    }

    const estadosEncontrados = {}
    for (const label of ['Pendiente', 'Parcial', 'Pagado']) {
      const chip = page.locator('.v-chip').filter({ hasText: new RegExp(`^${label}$`, 'i') }).first()
      const visible = await chip.isVisible({ timeout: 2000 }).catch(() => false)
      if (visible) {
        const bg = await chip.evaluate(el => {
          const s = window.getComputedStyle(el)
          return `bg:${s.backgroundColor} color:${s.color}`
        }).catch(() => '?')
        estadosEncontrados[label] = bg
      }
    }

    const found = Object.keys(estadosEncontrados)
    if (found.length === 0) {
      log('2.8 Chips de estado', 'FALLÓ', 'No se encontraron chips de estado (Pendiente/Parcial/Pagado)')
    } else {
      const detail = found.map(k => `${k}(${estadosEncontrados[k]})`).join(', ')
      log('2.8 Chips de estado', 'APROBADO',
        `Chips presentes: ${found.join(', ')}. Estilos: ${detail}`)
    }
  } catch (e) {
    log('2.8 Chips de estado', 'FALLÓ', `Excepción: ${e.message}`)
  }
}

// ── Runner ────────────────────────────────────────────────────────────────────
;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page    = await context.newPage()

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('  [browser error]', msg.text().slice(0, 150))
  })

  try {
    await login(page)
  } catch (e) {
    console.error('❌ Login falló:', e.message)
    await ss(page, 'login-error')
    await browser.close()
    process.exit(1)
  }

  await test21(page)
  await test22(page)
  await test23(page)
  await test24(page)
  await test25(page)
  await test26(page)
  await test27(page)
  await test28(page)

  await browser.close()

  console.log('\n' + '═'.repeat(60))
  console.log('RESUMEN QA – REPORTE DE CAJA')
  console.log('═'.repeat(60))
  const aprobados = results.filter(r => r.status === 'APROBADO').length
  const fallidos  = results.filter(r => r.status === 'FALLÓ').length
  const noPudo    = results.filter(r => r.status === 'NO PUDE PROBAR').length
  console.log(`✅ Aprobados   : ${aprobados}`)
  console.log(`❌ Fallidos    : ${fallidos}`)
  console.log(`⚠️  Sin probar  : ${noPudo}`)
  console.log('═'.repeat(60))
  for (const r of results) {
    const icon = r.status === 'APROBADO' ? '✅' : r.status === 'FALLÓ' ? '❌' : '⚠️'
    console.log(`${icon} ${r.step}`)
    if (r.screenshot) console.log(`   📸 ${r.screenshot}`)
  }
})()
