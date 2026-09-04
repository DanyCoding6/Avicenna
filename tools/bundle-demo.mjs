// Bundles the app into ONE self-contained HTML file (demo mode) for sharing: dist/avicenna-demo.html.
// It inlines CSS, fonts (as data URIs) and every ES module (rewritten into a tiny module registry).
// No service worker or manifest in this build; it exists to show the app, not to install it.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const rd = (p) => readFileSync(join(root, p), 'utf8');
const out = process.argv[2] || join(root, 'dist/avicenna-demo.html');

// ---- CSS with fonts inlined
const fontUri = (file) => `data:font/woff2;base64,${readFileSync(join(root, 'fonts', file)).toString('base64')}`;
let css = ['brand', 'tokens', 'base', 'components', 'views'].map((f) => rd(`css/${f}.css`)).join('\n');
css = css.replace(/url\('\.\.\/fonts\/([^']+)'\)/g, (_, f) => `url('${fontUri(f)}')`);

// ---- JS: collect the module graph from js/app.js
const modules = new Map(); // id -> source
const order = [];
function collect(id) {
  if (modules.has(id)) return;
  let src = rd(id);
  modules.set(id, null);
  const deps = [];
  src.replace(/import\s+(?:[^'"]+?\s+from\s+)?['"](\.[^'"]+)['"]/g, (_, rel) => { deps.push(norm(id, rel)); return _; });
  src.replace(/import\(\s*['"](\.[^'"]+)['"]\s*\)/g, (_, rel) => { deps.push(norm(id, rel)); return _; });
  deps.forEach(collect);
  modules.set(id, src);
  order.push(id);
}
const norm = (from, rel) => relative(root, resolve(dirname(join(root, from)), rel)).replace(/\\/g, '/');

function transform(id, src) {
  const exportsList = [];
  let s = src;
  // static imports
  s = s.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"](\.[^'"]+)['"];?/g, (_, ns, rel) => `const ${ns} = __req('${norm(id, rel)}');`);
  s = s.replace(/import\s+\{([^}]*)\}\s+from\s+['"](\.[^'"]+)['"];?/g, (_, names, rel) => {
    const list = names.split(',').map((n) => n.trim()).filter(Boolean).map((n) => { const [a, b] = n.split(/\s+as\s+/); return b ? `${a}: ${b}` : a; });
    return `const { ${list.join(', ')} } = __req('${norm(id, rel)}');`;
  });
  s = s.replace(/import\s+(\w+)\s+from\s+['"](\.[^'"]+)['"];?/g, (_, def, rel) => `const ${def} = __req('${norm(id, rel)}').default;`);
  // dynamic imports
  s = s.replace(/import\(\s*['"](\.[^'"]+)['"]\s*\)/g, (_, rel) => `Promise.resolve(__req('${norm(id, rel)}'))`);
  // exports
  s = s.replace(/^export\s+(const|let|var)\s+(\w+)/gm, (_, kw, name) => { exportsList.push(name); return `${kw} ${name}`; });
  s = s.replace(/^export\s+(async\s+)?function\s+(\w+)/gm, (_, a, name) => { exportsList.push(name); return `${a || ''}function ${name}`; });
  s = s.replace(/^export\s+\{([^}]*)\};?/gm, (_, names) => { names.split(',').map((n) => n.trim()).filter(Boolean).forEach((n) => { const [a, b] = n.split(/\s+as\s+/); exportsList.push(b ? `${b}: ${a}` : a); }); return ''; });
  const defs = exportsList.map((e) => { const [name, local] = e.includes(':') ? e.split(':').map((x) => x.trim()) : [e, e]; return `Object.defineProperty(__exports, '${name}', { get: () => ${local}, enumerable: true });`; }).join('\n');
  return `__define('${id}', function (__exports, __req) {\n${s}\n${defs}\n});`;
}

// Demo config: force DEMO mode regardless of js/config.js contents.
collect('js/app.js');
modules.set('js/config.js', ["export const SUPABASE_URL = '';", "export const SUPABASE_ANON_KEY = '';", "export const APP_VERSION = 'demo';", "export const DEMO = true;"].join('\n'));
const js = `
const __mods = {}, __cache = {};
function __define(id, fn) { __mods[id] = fn; }
function __req(id) { if (__cache[id]) return __cache[id]; const ex = {}; __cache[id] = ex; __mods[id](ex, __req); return ex; }
${order.map((id) => transform(id, modules.get(id))).join('\n')}
__req('js/app.js');
`;

// ---- HTML shell (from index.html, without manifest/sw/vendor)
const iconSvg = rd('icons/favicon.svg');
const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>Avicenna</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1">
<meta name="theme-color" content="#070F22">
<meta name="color-scheme" content="dark">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="icon" href="data:image/svg+xml;base64,${Buffer.from(iconSvg).toString('base64')}">
<style>
${css}
/* Demo frame on wide screens: show the app at phone width */
@media (min-width: 700px) { body { background: #04091a; } .app { max-width: 430px; margin: 0 auto; min-height: 100dvh; box-shadow: 0 0 0 1px rgba(147,169,236,.16); background: var(--surface-0); } .tabbar { max-width: 430px; left: 50%; transform: translateX(-50%); } .toasts { max-width: 430px; left: 50%; transform: translateX(-50%); } .sheet { max-width: 430px; } .ptr { max-width: 430px; left: 50%; transform: translateX(-50%); } }
</style>
</head>
<body>
<div class="app" id="app">
  <div class="offline-bar" role="status">Offline · showing saved data</div>
  <header class="header" id="header" hidden></header>
  <main class="main" id="view" aria-live="polite"></main>
  <nav class="tabbar" id="tabbar" aria-label="Main" hidden><div class="tabbar__inner" id="tabs"></div></nav>
</div>
<div class="sheet-root" id="sheet-root"></div>
<div class="toasts" id="toasts"></div>
<script>
${js.replace(/<\/script>/g, '<\\/script>')}
</script>
</body>
</html>`;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`wrote ${relative(root, out)} (${(html.length / 1024).toFixed(0)} KB, ${order.length} modules)`);
