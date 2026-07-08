import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import path from 'path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT    = './test-screenshots'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

// Capture console errors
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push(e.message))

console.log('→ Navigating to http://localhost:5173 ...')
await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 })
await page.screenshot({ path: path.join(OUT, '01-login.png'), fullPage: true })
console.log('✓ Screenshot 01-login.png')

// Login
const emailInput = page.locator('input[type="email"]')
await emailInput.waitFor({ timeout: 10000 })
await emailInput.fill('hmonrob@gmail.com')
await page.locator('input[type="password"]').fill('') // password not known, fill empty to see form
await page.screenshot({ path: path.join(OUT, '02-login-filled.png'), fullPage: true })
console.log('✓ Screenshot 02-login-filled.png')
console.log('ℹ Cannot auto-login (password unknown). Showing login page state.')

console.log('\nConsole errors so far:', errors.length ? errors : 'none')

await browser.close()
