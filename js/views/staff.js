// Staff console: role-gated. Chaplaincy is deliberately absent.
import { esc } from '../format.js';
import { bindActions, emptyState, skeletonPage } from '../ui.js';
import { segmented } from '../components/index.js';
import { prefs } from '../store.js';
import * as inbox from './staff/inbox.js';
import * as events from './staff/events.js';
import * as announcements from './staff/announcements.js';
import * as opportunities from './staff/opportunities.js';
import * as journal from './staff/journal.js';
import * as scholars from './staff/scholars.js';
import * as coaching from './staff/coaching.js';

const SECTIONS = { inbox, events, announcements, opportunities, journal, scholars, coaching };
export const header = { title: 'Staff', backTo: '/profile' };
export const skeleton = () => skeletonPage({ title: false, block: false, rows: 5 });

export async function render(ctx) {
  if (ctx.me.role !== 'staff') return emptyState('Staff only', 'Ask the programme team if you should have access.');
  const seg = SECTIONS[ctx.params.section] ? ctx.params.section : prefs.get('staff-seg', 'inbox');
  ctx.section = seg;
  const counts = await ctx.api.staff.counts();
  const n = (counts.space || 0) + (counts.interest || 0) + (counts.documents || 0);
  const body = await SECTIONS[seg].render(ctx);
  return `
    <div class="mt-2">${segmented([{ value: 'inbox', label: 'Inbox', count: n || null }, { value: 'events', label: 'Events' }, { value: 'announcements', label: 'Announce' }, { value: 'opportunities', label: 'Opps' }, { value: 'journal', label: 'Journal' }, { value: 'scholars', label: 'People' }, { value: 'coaching', label: 'Coaching' }], seg)}</div>
    <div id="staff-body">${body}</div>`;
}

export function mount(root, ctx) {
  if (ctx.me.role !== 'staff') return;
  bindActions(root, { segment: (el) => { prefs.set('staff-seg', el.dataset.value); ctx.navigate(`/staff/${el.dataset.value}`); } });
  SECTIONS[ctx.section].mount?.(root.querySelector('#staff-body'), ctx);
}
