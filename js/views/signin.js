// Sign-in: email → 6-digit code (the same email also carries a magic link for desktop).
import { khatam, icons } from '../icons.js';
import { esc } from '../format.js';
import { toast } from '../ui.js';

export const header = null;

export function render() {
  return `<div class="signin">
    ${khatam('signin__mark')}
    <h1 class="signin__title">Salaam.<br>Welcome to Avicenna.</h1>
    <p class="signin__sub">The scholars' app for the Avicenna Foundation. Sign in with the email address the foundation holds for you.</p>
    <form class="signin__form" id="signin-email" novalidate>
      <label class="field"><span class="field__label label">Email</span><input class="input" type="email" name="email" inputmode="email" autocomplete="email" placeholder="you@university.ac.uk" required></label>
      <button class="btn btn--primary btn--block mt-6" type="submit">Send me a code</button>
    </form>
    <form class="signin__form" id="signin-code" hidden novalidate>
      <p class="secondary">We sent a six-digit code to <strong id="signin-sent-to" style="color:var(--paper-100)"></strong>. Enter it here, or tap the link in the email if you are on a computer.</p>
      <label class="field"><span class="field__label label">Code</span><input class="input input--code" type="text" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="••••••" required></label>
      <button class="btn btn--primary btn--block mt-6" type="submit">Sign in</button>
      <button class="btn btn--quiet btn--block mt-2" type="button" data-action="change-email">Use a different email</button>
    </form>
    <p class="signin__foot">Access is by invitation. If your email is not recognised, contact the programme team.</p>
  </div>`;
}

export function mount(root, { api, onSignedIn }) {
  const emailForm = root.querySelector('#signin-email');
  const codeForm = root.querySelector('#signin-code');
  let email = '';
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    email = emailForm.email.value.trim().toLowerCase();
    if (!/.+@.+\..+/.test(email)) { toast('Enter a valid email address', { type: 'error' }); return; }
    const btn = emailForm.querySelector('button'); btn.disabled = true;
    try {
      const r = await api.auth.signIn(email);
      if (r?.error) throw r.error;
      root.querySelector('#signin-sent-to').textContent = email;
      emailForm.hidden = true; codeForm.hidden = false; codeForm.code.focus();
    } catch (err) {
      const msg = /database error|not on the avicenna/i.test(err.message || '') ? 'This email is not on the scholars list. Contact the programme team.' : (err.message || 'Could not send the code');
      toast(msg, { type: 'error', duration: 5000 });
    }
    finally { btn.disabled = false; }
  });
  codeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = codeForm.code.value.replace(/\D/g, '');
    if (code.length !== 6) { toast('The code is six digits', { type: 'error' }); return; }
    const btn = codeForm.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      const r = await api.auth.verify(email, code);
      if (r?.error) throw r.error;
      onSignedIn?.();
    } catch (err) { toast(err.message || 'That code did not work', { type: 'error' }); btn.disabled = false; }
  });
  codeForm.querySelector('[data-action=change-email]').addEventListener('click', () => { codeForm.hidden = true; emailForm.hidden = false; });
}
