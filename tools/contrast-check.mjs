// WCAG contrast check for every text token on every surface token, resolved from css/brand.css + css/tokens.css.
import { readFileSync } from 'node:fs';
const css = readFileSync('css/brand.css', 'utf8') + readFileSync('css/tokens.css', 'utf8');
const vars = {}; for (const m of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
const resolve = (v, depth = 0) => { if (depth > 10) return v; const m = /^var\(--([\w-]+)\)$/.exec(v); return m ? resolve(vars[m[1]], depth + 1) : v; };
const hex = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
const lum = (rgb) => { const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [l1, l2] = [lum(hex(a)), lum(hex(b))].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); };
const surfaces = ['surface-0', 'surface-1', 'surface-2'];
const texts = { 'text-1': 4.5, 'text-2': 4.5, 'text-3': 4.5, accent: 3, link: 4.5, success: 3, danger: 3 }; // accent/success/danger appear on ≥13px mono caps or as marks; require large-text AA
const extra = [['accent-ink', 'accent', 4.5], ['accent-ink', 'success', 4.5], ['accent-ink', 'danger', 4.5], ['surface-0', 'text-1', 4.5]];
let fail = 0;
console.log('token'.padEnd(10), ...surfaces.map((s) => s.padEnd(11)));
for (const [t, min] of Object.entries(texts)) {
  const row = [t.padEnd(10)];
  for (const s of surfaces) { const r = ratio(resolve(vars[t]), resolve(vars[s])); const ok = r >= min; if (!ok) fail++; row.push(`${r.toFixed(2)}${ok ? '  ' : ' ✗'}`.padEnd(11)); }
  console.log(...row);
}
for (const [fg, bg, min] of extra) { const r = ratio(resolve(vars[fg]), resolve(vars[bg])); const ok = r >= min; if (!ok) fail++; console.log(`${fg} on ${bg}`.padEnd(24), r.toFixed(2), ok ? '' : '✗'); }
if (fail) { console.log(`\n${fail} pair(s) below target`); process.exit(1); }
console.log('\ncontrast check passed');
