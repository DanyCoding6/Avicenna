import { esc } from '../format.js';
import { icons } from '../icons.js';
import { emptyState } from '../ui.js';
import { avatar } from '../components/index.js';

export const header = { title: 'Scholar', backTo: '/hub/scholars' };

export async function render({ api, params, me }) {
  const s = await api.scholars.get(params.id);
  if (!s) return emptyState('Scholar not found');
  const isMe = s.id === me.id;
  const line = s.role === 'alumni' ? `Alumni · Cohort ${s.cohort}` : s.role === 'scholar' ? `${s.subject} · ${s.university}${s.year_of_study ? ` · Year ${s.year_of_study}` : ''}` : (s.currently || '');
  return `
    <div class="profile-head">
      ${avatar(s, 'avatar--xl')}
      <h1 class="profile-head__name">${esc(s.full_name)}</h1>
      <div class="profile-head__line">${esc(line)}</div>
      ${s.role === 'scholar' ? `<div class="meta mt-2">Cohort ${esc(s.cohort)}</div>` : ''}
      ${s.currently ? `<p class="profile-head__currently">“${esc(s.currently)}”</p>` : ''}
    </div>
    <div class="profile-actions">
      ${isMe ? `<a class="btn btn--secondary" href="#/profile">${icons.edit} Edit profile</a>` : ''}
      ${s.email ? `<a class="btn btn--ghost" href="mailto:${esc(s.email)}">${icons.mail} Email</a>` : ''}
      ${s.phone && s.phone_visible ? `<a class="btn btn--ghost" href="tel:${esc(s.phone.replace(/\s/g, ''))}">${icons.phone} Call</a>` : ''}
      ${s.linkedin_url ? `<a class="btn btn--ghost" href="${esc(s.linkedin_url)}" target="_blank" rel="noopener">${icons.external} LinkedIn</a>` : ''}
    </div>
    ${s.bio ? `<div class="prose"><p>${esc(s.bio)}</p></div>` : ''}
    ${s.interests?.length ? `<section class="section"><div class="section__head"><span class="label">Interests</span></div><div class="chips" style="padding:0">${s.interests.map((i) => `<span class="chip">${esc(i)}</span>`).join('')}</div></section>` : ''}`;
}
