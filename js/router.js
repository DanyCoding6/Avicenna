// Hash router: '#/events/:id' → view. Views are { render(ctx) → html, mount(root, ctx), header(ctx) }.
const routes = [];
let ctxFactory = () => ({});
let current = null;
const listeners = new Set();

export function defineRoutes(defs, factory) { routes.length = 0; routes.push(...defs.map(compile)); ctxFactory = factory; }
export function onRoute(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function compile(def) {
  const keys = [];
  if (def.path === '*') return { ...def, re: /^$/, keys, wildcard: true };
  const re = new RegExp('^' + def.path.replace(/\//g, '\\/').replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^\\/]+)'; }) + '$');
  return { ...def, re, keys };
}

export function parse(hash = location.hash) {
  const [pathPart, queryPart = ''] = (hash.replace(/^#/, '') || '/home').split('?');
  const query = Object.fromEntries(new URLSearchParams(queryPart));
  for (const r of routes) {
    if (r.wildcard) continue;
    const m = r.re.exec(pathPart);
    if (m) return { route: r, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])), query, path: pathPart };
  }
  return { route: routes.find((r) => r.path === '*'), params: {}, query, path: pathPart };
}

export const navigate = (hash, { replace = false } = {}) => { if (replace) location.replace('#' + hash.replace(/^#/, '')); else location.hash = hash; };
export const back = (fallback = '/home') => { if (history.state?.avicenna) history.back(); else navigate(fallback, { replace: true }); };

let renderSeq = 0;
export async function render() {
  const main = document.getElementById('view');
  const match = parse();
  const ctx = { ...ctxFactory(), ...match, navigate };
  const seq = ++renderSeq;
  current = match;
  listeners.forEach((fn) => fn(match, ctx));
  try {
    const html = await match.route.view.render(ctx);
    if (seq !== renderSeq) return; // a newer navigation won
    main.classList.remove('view-enter');
    main.innerHTML = html;
    void main.offsetWidth;
    main.classList.add('view-enter');
    window.scrollTo(0, 0);
    await match.route.view.mount?.(main, ctx);
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="empty"><div class="empty__title">Something went wrong</div><div class="empty__sub">${(err && err.message) || err}</div></div>`;
  }
}

export function start() {
  window.addEventListener('hashchange', () => { history.replaceState({ avicenna: true }, ''); render(); });
  if (!location.hash) navigate('/home', { replace: true });
  return render();
}
export const currentRoute = () => current;
export const refresh = () => render();
