// Screenshot every route at iPhone size and report console errors. Run with a static server on :8080.
// NODE_PATH=$(npm root -g) node tools/screenshot.mjs [outdir]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(execSync('npm root -g').toString().trim() + '/');
const { chromium, devices } = require('playwright');
import { mkdirSync } from 'node:fs';
const out = process.argv[2] || 'shots';
mkdirSync(out, { recursive: true });
const base = process.env.BASE || 'http://127.0.0.1:8080/';
const routes = ['/home', '/events', '/events?seg=past', '/events?seg=opportunities', '/events/e-winter', '/opportunities/op-1', '/programme', '/programme/coaching', '/programme/curriculum', '/programme/curriculum/mod-5', '/programme/project', '/programme/mentorship', '/programme/chaplaincy', '/thread/c-yusuf', '/hub/scholars', '/hub/feed', '/hub/space', '/scholar/s-omar', '/post/hp-1', '/journal', '/journal/j-1', '/profile'];
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: 'dark' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`); });
page.on('requestfailed', (r) => errors.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));
await page.goto(base + '#/home', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
for (const r of routes) {
  await page.goto(base + '#' + r);
  await page.waitForTimeout(500);
  const name = r.replace(/^\//, '').replace(/[\/?=]/g, '_') || 'home';
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: process.env.FULL === '1' });
  const text = (await page.locator('#view').innerText()).slice(0, 80).replace(/\s+/g, ' ');
  console.log(r.padEnd(34), text);
}
await browser.close();
if (errors.length) { console.log('\nERRORS:'); errors.forEach((e) => console.log(' ', e)); process.exit(1); }
console.log('\nno errors');
