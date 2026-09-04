import { esc } from '../format.js';
import { icons } from '../icons.js';
import { bindActions, skeletonPage } from '../ui.js';
import { segmented } from '../components/index.js';
import { prefs } from '../store.js';
import * as directory from './directory.js';
import * as feed from './feed.js';
import * as space from './space.js';

export const header = { top: true };
export const skeleton = () => skeletonPage({ block: false, rows: 6 });
const SEGS = { scholars: directory, feed, space };

export async function render(ctx) {
  const seg = SEGS[ctx.params.segment] ? ctx.params.segment : prefs.get('hub-seg', 'scholars');
  ctx.segment = seg;
  const body = await SEGS[seg].render(ctx);
  return `
    <div class="hub-head"><h1>Hub</h1></div>
    <div class="mt-4">${segmented([{ value: 'scholars', label: 'Scholars' }, { value: 'feed', label: 'Feed' }, { value: 'space', label: 'Adam Hub' }], seg)}</div>
    <div id="hub-body">${body}</div>`;
}

export function mount(root, ctx) {
  bindActions(root, { segment: (el) => { prefs.set('hub-seg', el.dataset.value); ctx.navigate(`/hub/${el.dataset.value}`); } });
  SEGS[ctx.segment].mount?.(root.querySelector('#hub-body'), ctx);
}
