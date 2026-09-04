// Rasterise icons/icon.svg into the PNG sizes the manifest needs. Run: NODE_PATH=$(npm root -g) node tools/make-icons.mjs
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(execSync('npm root -g').toString().trim() + '/');
const { chromium } = require('playwright');
import { readFileSync, writeFileSync } from 'node:fs';
const svg = readFileSync(new URL('../icons/icon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
const sizes = [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['apple-touch-icon.png', 180, false], ['icon-maskable-512.png', 512, true]];
for (const [name, size, maskable] of sizes) {
  await page.setViewportSize({ width: size, height: size });
  // Maskable icons need the artwork inside the central 80% safe zone.
  const scale = maskable ? 0.8 : 1;
  await page.setContent(`<body style="margin:0;background:#070F22;width:${size}px;height:${size}px;display:grid;place-items:center;overflow:hidden"><div style="width:${size * scale}px;height:${size * scale}px">${svg.replace('<svg ', `<svg width="${size * scale}" height="${size * scale}" `)}</div></body>`);
  const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: size, height: size } });
  writeFileSync(new URL(`../icons/${name}`, import.meta.url), buf);
  console.log('wrote', name);
}
await browser.close();
