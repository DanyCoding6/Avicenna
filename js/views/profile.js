import { esc } from '../format.js';
import { icons, khatam } from '../icons.js';
import { bindActions, toast, confirm } from '../ui.js';
import { avatar } from '../components/index.js';
import { APP_VERSION, DEMO } from '../config.js';
import { sheet } from '../ui.js';
import { refresh } from '../router.js';

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
      <div class="section__head"><span class="label label--muted">Scholarship</span></div>
      <div class="ledger">
        <a class="ledger-row" href="#/scholarship"><span class="ledger-row__icon">${icons.file}</span><span class="ledger-row__body"><span class="ledger-row__title">My scholarship</span><span class="ledger-row__sub">Funding status, key dates, documents</span></span><span class="ledger-row__trail">${icons.chevronRight}</span></a>
        <button class="ledger-row" type="button" data-action="calendar"><span class="ledger-row__icon">${icons.calendarPlus}</span><span class="ledger-row__body"><span class="ledger-row__title">Subscribe in your calendar</span><span class="ledger-row__sub">Events, sessions and bookings in your phone's calendar</span></span><span class="ledger-row__trail">${icons.chevronRight}</span></button>
        ${me.role === 'staff' ? `<a class="ledger-row" href="#/staff"><span class="ledger-row__icon">${icons.building}</span><span class="ledger-row__body"><span class="ledger-row__title">Staff console</span><span class="ledger-row__sub">Events, announcements, requests, people</span></span><span class="ledger-row__trail">${icons.chevronRight}</span></a>` : ''}
      </div>
    </section>
    <section class="section">
      <div class="section__head"><span class="label label--muted">App</span></div>
      <div class="ledger">
        ${DEMO ? `<label class="switch" style="padding:8px 0;border-bottom:1px solid var(--hairline)"><span><span style="display:block;font-weight:500">Preview as staff</span><span class="secondary" style="font-size:13px">Demo only: shows the staff console</span></span><input type="checkbox" id="demo-staff" ${me.role === 'staff' ? 'checked' : ''}><span class="switch__track"></span></label>` : ''}
        <button class="ledger-row" type="button" data-action="install"><span class="ledger-row__icon">${icons.share}</span><span class="ledger-row__body"><span class="ledger-row__title">Add to home screen</span><span class="ledger-row__sub">Full-screen, offline, one tap away</span></span><span class="ledger-row__trail">${icons.chevronRight}</span></button>
        <button class="ledger-row" type="button" data-action="signout"><span class="ledger-row__icon">${icons.logout}</span><span class="ledger-row__body"><span class="ledger-row__title">${DEMO ? 'Reset demo data' : 'Sign out'}</span><span class="ledger-row__sub">${DEMO ? 'Demo mode: no Supabase project configured' : 'You will need a new code to sign back in'}</span></span></button>
      </div>
      <p class="muted mt-6" style="font-size:13px;text-align:center">Avicenna ${esc(APP_VERSION)} · ${DEMO ? 'demo mode' : 'connected'}</p>
    </section>`;
}

export function mount(root, { api, refreshMe, signOut }) {
  root.querySelector('#demo-staff')?.addEventListener('change', async (e) => { await api.setDemoRole(e.target.checked ? 'staff' : null); await refreshMe(); toast(e.target.checked ? 'Previewing as staff' : 'Back to scholar view'); refresh(); });
  root.querySelector('#profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const patch = { currently: f.currently.value.trim(), bio: f.bio.value.trim(), year_of_study: Number(f.year_of_study.value) || null, linkedin_url: f.linkedin_url.value.trim() || null, phone: f.phone.value.trim() || null, phone_visible: f.phone_visible.checked, interests: f.interests.value.split(',').map((s) => s.trim()).filter(Boolean) };
    try { await api.updateMe(patch); await refreshMe(); toast('Profile saved'); } catch (err) { toast(err.message, { type: 'error' }); }
  });
  bindActions(root, {
    install: () => window.avicenna.showInstallHelp(),
    calendar: async () => {
      const url = await api.calendar.url();
      const webcal = url ? url.replace(/^https?:\/\//, 'webcal://') : null;
      sheet({
        title: 'Your Avicenna calendar',
        body: url ? `<p class="secondary">Subscribe once and every event you RSVP to, coaching session, Adam Hub booking, project milestone and scholarship deadline appears in your calendar and stays up to date.</p>
          <div class="field mt-4"><span class="field__label label">Calendar address</span><div class="row"><input class="input grow" readonly value="${esc(webcal)}" id="cal-url"><button class="btn btn--ghost" type="button" id="cal-copy">Copy</button></div></div>
          <div class="mt-6 label">iPhone</div><p class="secondary">Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar, paste the address.</p>
          <div class="mt-4 label">Google Calendar</div><p class="secondary">On a computer: Other calendars → + → From URL, paste the address. It then syncs to your phone.</p>
          <div class="mt-4 label">Android / Outlook</div><p class="secondary">Add a calendar by URL and paste the address.</p>
          <p class="field__hint mt-4">Anyone with this address can read your calendar. Reset it if it leaks.</p>`
          : `<p class="secondary">The calendar feed goes live once the app is connected to Supabase and the <code>calendar</code> function is deployed. In demo mode there is nothing to subscribe to yet.</p>`,
        actions: url ? [{ label: 'Reset address', kind: 'btn--danger', onClick: async () => { await api.calendar.rotate(); toast('New address created'); } }, { label: 'Done' }] : [{ label: 'OK' }],
        onMount: (s) => s.body.querySelector('#cal-copy')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(s.body.querySelector('#cal-url').value); toast('Copied'); } catch (_) { s.body.querySelector('#cal-url').select(); } }),
      });
    },
    signout: async () => { if (await confirm({ title: DEMO ? 'Reset demo data?' : 'Sign out?', body: DEMO ? 'RSVPs, bookings and posts you made in the demo will be cleared.' : 'You can sign back in with a new code any time.', confirmLabel: DEMO ? 'Reset' : 'Sign out', danger: true })) signOut(); },
  });
}
