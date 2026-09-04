import { esc, daysUntil, dateFull, plural } from '../format.js';
import { icons } from '../icons.js';
import { bindActions, toast, emptyState, sheet, haptic } from '../ui.js';
import { rail, avatar } from '../components/index.js';
import { refresh } from '../router.js';

export const header = { title: 'Project', backTo: '/programme' };

export async function render({ api }) {
  const p = await api.project.current();
  if (!p) return emptyState('No project this year yet', 'Your team and brief are set after the Winter Retreat.');
  const days = p.presentation ? daysUntil(p.presentation.starts_at) : null;
  return `
    <div class="strand-hero"><span class="label">${esc(p.academic_year)} project</span><h1 class="strand-hero__title mt-2">${esc(p.title)}</h1><p class="strand-hero__sub">${esc(p.summary)}</p></div>
    <div class="panel mt-6 row-between">
      <div><div class="label">Final presentation</div>${p.presentation ? `<div class="mt-2" style="font-weight:500">${esc(dateFull(p.presentation.starts_at))}</div><div class="secondary">${esc(p.presentation.location)}</div>` : '<div class="secondary mt-2">Date to be confirmed</div>'}</div>
      ${days != null ? `<div class="countdown"><span class="countdown__n">${days}</span><span class="countdown__l">days</span></div>` : ''}
    </div>
    <section class="section"><div class="section__head"><span class="label">Team</span></div><div class="row">${p.members.map((m) => `<a href="#/scholar/${esc(m.id)}" class="row" style="gap:8px;color:inherit">${avatar(m)}<span class="secondary">${esc(m.full_name.split(' ')[0])}</span></a>`).join('')}</div></section>
    <section class="section"><div class="section__head"><span class="label">Milestones</span><span class="meta">${p.done_count} of ${p.milestones.length}</span></div>${rail(p.milestones)}</section>
    <section class="section"><div class="section__head"><span class="label">Deliverable</span></div>${p.deliverable_path ? `<a class="btn btn--ghost" href="#">${icons.file} Download submission</a>` : `<button class="btn btn--secondary" type="button" data-action="upload">${icons.share} Upload draft or final</button><p class="field__hint mt-2">PDF or slides, up to 25 MB. Uploads go live once storage is connected.</p>`}</section>
    ${p.presentation ? `<div class="wrap mt-6"><a class="btn btn--ghost btn--block" href="#/events/${esc(p.presentation.id)}">${icons.events} Presentation event</a></div>` : ''}`;
}

export function mount(root, { api }) {
  bindActions(root, {
    'toggle-milestone': async (el) => { haptic(); await api.project.toggleMilestone(Number(el.dataset.idx)); refresh(); },
    upload: () => {
      if (!api.project.upload) { toast('Available once Supabase storage is connected'); return; }
      const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf,.pptx,.key,.docx';
      input.addEventListener('change', async () => { const f = input.files[0]; if (!f) return; if (f.size > 25 * 1024 * 1024) { toast('Keep it under 25 MB', { type: 'error' }); return; } toast('Uploading…'); try { await api.project.upload(f); toast('Submitted'); refresh(); } catch (e) { toast(e.message, { type: 'error' }); } });
      input.click();
    },
  });
}
