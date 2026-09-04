import { esc } from '../format.js';
import { icons, khatam } from '../icons.js';
import { bindActions, toast, confirm } from '../ui.js';
import { avatar } from '../components/index.js';
import { APP_VERSION, DEMO } from '../config.js';

export const header = { title: 'You', backTo: '/home' };

export async function render({ me }) {
  return `
    <div class="profile-head">${avatar(me, 'avatar--xl')}<h1 class="profile-head__name">${esc(me.full_name)}</h1><div class="profile-head__line">${esc(me.subject)} · ${esc(me.university)} · Cohort ${esc(me.cohort)}</div></div>
    <form class="wrap mt-6" id="profile-form">
      <label class="field"><span class="field__label label">Currently</span><input class="input" name="currently" maxlength="120" value="${esc(me.currently || '')}" placeholder="One line on what you're up to"><div class="field__hint">Shown on your directory card. Keep it fresh.</div></label>
      <label class="field"><span class="field__label label">About</span><textarea class="textarea" name="bio" maxlength="500">${esc(me.bio || '')}</textarea></label>
      <label class="field"><span class="field__label label">Year of study</span><input class="input" name="year_of_study" type="number" min="1" max="6" value="${esc(me.year_of_study || '')}"></label>
      <label class="field"><span class="field__label label">LinkedIn</span><input class="input" name="linkedin_url" type="url" value="${esc(me.linkedin_url || '')}" placeholder="https://linkedin.com/in/…"></label>
      <label class="field"><span class="field__label label">Phone</span><input class="input" name="phone" type="tel" value="${esc(me.phone || '')}"></label>
      <label class="switch mt-4"><span>Show my phone number to other scholars</span><input type="checkbox" name="phone_visible" ${me.phone_visible ? 'checked' : ''}><span class="switch__track"></span></label>
      <label class="field"><span class="field__label label">Interests</span><input class="input" name="interests" value="${esc((me.interests || []).join(', '))}" placeholder="Comma separated"></label>
      <button class="btn btn--primary btn--block mt-6" type="submit">Save</button>
    </form>
    <section class="section">
      <div class="section__head"><span class="label label--muted">App</span></div>
      <div class="ledger">
        <button class="ledger-row" type="button" data-action="install"><span class="ledger-row__icon">${icons.share}</span><span class="ledger-row__body"><span class="ledger-row__title">Add to home screen</span><span class="ledger-row__sub">Full-screen, offline, one tap away</span></span><span class="ledger-row__trail">${icons.chevronRight}</span></button>
        <button class="ledger-row" type="button" data-action="signout"><span class="ledger-row__icon">${icons.logout}</span><span class="ledger-row__body"><span class="ledger-row__title">${DEMO ? 'Reset demo data' : 'Sign out'}</span><span class="ledger-row__sub">${DEMO ? 'Demo mode: no Supabase project configured' : 'You will need a new code to sign back in'}</span></span></button>
      </div>
      <p class="muted mt-6" style="font-size:13px;text-align:center">Avicenna ${esc(APP_VERSION)} · ${DEMO ? 'demo mode' : 'connected'}</p>
    </section>`;
}

export function mount(root, { api, refreshMe, signOut }) {
  root.querySelector('#profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const patch = { currently: f.currently.value.trim(), bio: f.bio.value.trim(), year_of_study: Number(f.year_of_study.value) || null, linkedin_url: f.linkedin_url.value.trim() || null, phone: f.phone.value.trim() || null, phone_visible: f.phone_visible.checked, interests: f.interests.value.split(',').map((s) => s.trim()).filter(Boolean) };
    try { await api.updateMe(patch); await refreshMe(); toast('Profile saved'); } catch (err) { toast(err.message, { type: 'error' }); }
  });
  bindActions(root, {
    install: () => window.avicenna.showInstallHelp(),
    signout: async () => { if (await confirm({ title: DEMO ? 'Reset demo data?' : 'Sign out?', body: DEMO ? 'RSVPs, bookings and posts you made in the demo will be cleared.' : 'You can sign back in with a new code any time.', confirmLabel: DEMO ? 'Reset' : 'Sign out', danger: true })) signOut(); },
  });
}
