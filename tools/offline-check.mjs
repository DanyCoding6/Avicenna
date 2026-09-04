// Verifies the service worker installs and the shell + a data view render offline.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(execSync('npm root -g').toString().trim() + '/');
const { chromium, devices } = require('playwright');
const base = process.env.BASE || 'http://127.0.0.1:8080/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'] });
const page = await ctx.newPage();
await page.goto(base + '#/events', { waitUntil: 'networkidle' });
await page.waitForFunction(() => navigator.serviceWorker?.controller || navigator.serviceWorker?.ready.then(() => true), null, { timeout: 15000 });
await page.waitForTimeout(1500);
const cached = await page.evaluate(async () => { const keys = await caches.keys(); const c = await caches.open(keys.find((k) => k.startsWith('avicenna-shell'))); return (await c.keys()).length; });
console.log('precached entries:', cached);
await ctx.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
const text = (await page.locator('#view').innerText()).slice(0, 60).replace(/\s+/g, ' ');
const offlineBar = await page.locator('.offline-bar').isVisible();
console.log('offline render:', JSON.stringify(text), '| offline bar visible:', offlineBar);
await page.screenshot({ path: process.argv[2] || 'offline.png' });
await browser.close();
if (!text.includes('Events') || cached < 40) { console.log('OFFLINE CHECK FAILED'); process.exit(1); }
console.log('offline check passed');
