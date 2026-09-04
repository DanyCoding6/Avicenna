import { esc } from '../format.js';
import { bindActions, emptyState } from '../ui.js';
import { eventRow, opportunityRow, seasonHero, segmented, chips } from '../components/index.js';
import { prefs } from '../store.js';

export const header = { top: true };
const FILTERS = [
  { value: 'all', label: 'All' }, { value: 'cohort', label: 'My cohort' }, { value: 'foundation', label: 'Foundation' },
  { value: 'online', label: 'Online' }, { value: 'adam_hub', label: 'Adam Hub' },
];
const filterFn = { all: () => true, cohort: (e) => e.scope === 'cohort', foundation: (e) => e.scope === 'foundation', online: (e) => e.venue === 'online', adam_hub: (e) => e.venue === 'adam_hub' };

export async function render({ api, query }) {
  const seg = query.seg || prefs.get('events-seg', 'upcoming');
  const filter = query.f || 'all';
  const [ev, ops] = await Promise.all([api.events.list(), api.opportunities.list()]);
  const openOps = ops.filter((o) => new Date(o.deadline) > new Date());
  const list = seg === 'past' ? ev.past : ev.upcoming;
  const filtered = list.filter(filterFn[filter] || filterFn.all);
  const retreat = seg === 'upcoming' && filter === 'all' ? ev.upcoming.find((e) => e.kind === 'retreat') : null;
  let body;
  if (seg === 'opportunities') {
    const closed = ops.filter((o) => new Date(o.deadline) <= new Date());
    body = `${openOps.length ? `<div class="ledger mt-4">${openOps.map(opportunityRow).join('')}</div>` : emptyState('Nothing open right now', 'New opportunities are announced on Home.')}
      ${closed.length ? `<div class="section"><div class="section__head"><span class="label label--muted">Closed</span></div></div><div class="ledger">${closed.map(opportunityRow).join('')}</div>` : ''}`;
  } else {
    body = `${chips(FILTERS, filter)}
      ${retreat ? seasonHero(retreat) : ''}
      ${filtered.length ? `<div class="ledger mt-4">${filtered.filter((e) => e !== retreat).map((e) => eventRow(e, { muted: seg === 'past' })).join('')}</div>` : emptyState(seg === 'past' ? 'No past events here' : 'Nothing coming up', 'Try another filter.')}`;
  }
  return `
    <div class="events-head"><h1>Events</h1></div>
    <div class="mt-4">${segmented([{ value: 'upcoming', label: 'Upcoming', count: ev.upcoming.length }, { value: 'past', label: 'Past', count: ev.past.length }, { value: 'opportunities', label: 'Opportunities', count: openOps.length }], seg)}</div>
    ${body}`;
}

export function mount(root, { navigate, query }) {
  bindActions(root, {
    segment: (el) => { prefs.set('events-seg', el.dataset.value); navigate(`/events?seg=${el.dataset.value}`); },
    chip: (el) => navigate(`/events?seg=${query.seg || prefs.get('events-seg', 'upcoming')}&f=${el.dataset.value}`),
  });
}
