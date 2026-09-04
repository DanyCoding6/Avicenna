import { esc, monthName, dateLong, relative, daysUntil, plural } from '../format.js';
import { icons } from '../icons.js';
import { strandRow, cadence } from '../components/index.js';

export const header = { top: true };

export async function render({ api }) {
  const s = await api.programme.status();
  const n = s.cadence.done + s.cadence.booked;
  const coachingStatus = `${monthName()} · ${n >= 2 ? 'both sessions in the diary' : `${n} of 2 booked`}`;
  const curStatus = `Chapter ${s.curriculum.current?.position} of ${s.curriculum.total} · ${esc(s.curriculum.current?.title || '')}`;
  const p = s.project;
  const projStatus = p ? (p.next_milestone ? `${esc(p.next_milestone.title)} due ${dateLong(p.next_milestone.due_on)}${p.presentation ? ` · presentation in ${plural(daysUntil(p.presentation.starts_at), 'day')}` : ''}` : 'All milestones done') : 'No project yet this year';
  const mentorStatus = s.nextMeeting ? `Next catch-up ${dateLong(s.nextMeeting.met_at)} with ${esc(s.mentor?.full_name || 'your mentor')}` : s.mentor ? `${esc(s.mentor.full_name)} · ${esc(s.mentor.currently || '')}` : 'Mentor to be assigned';
  const chapStatus = s.openChaplaincy ? `Request ${esc(s.openChaplaincy.status)} · ${relative(s.openChaplaincy.created_at)}` : 'Confidential · request a conversation';
  return `
    <div class="events-head"><h1>Programme</h1><p class="secondary mt-2">Five strands, one year. Coaching first.</p></div>
    <div class="strand-status mt-2">${cadence(s.cadence)}</div>
    <div class="ledger mt-2">
      ${strandRow({ href: '/programme/coaching', icon: icons.compass, title: 'Coaching', status: coachingStatus, badge: s.unread.coach })}
      ${strandRow({ href: '/programme/curriculum', icon: icons.book, title: 'Curriculum', status: curStatus })}
      ${strandRow({ href: '/programme/project', icon: icons.flag, title: 'Project', status: projStatus })}
      ${strandRow({ href: '/programme/mentorship', icon: icons.handshake, title: 'Mentorship', status: mentorStatus, badge: s.unread.mentor })}
      ${strandRow({ href: '/programme/chaplaincy', icon: icons.moon, title: 'Chaplaincy', status: chapStatus, confidential: true })}
    </div>
    <div class="notice mt-6">${icons.info}<div>Two coaching sessions a month, a monthly mentor catch-up, curriculum sessions roughly fortnightly, and one project a year ending in a final presentation. Chaplaincy is there whenever you need it.</div></div>`;
}
