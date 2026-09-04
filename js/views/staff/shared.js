// Helpers shared by the staff console sections.
import { sheet, toast, confirm } from '../../ui.js';
import { form, readForm } from '../../components/form.js';
import { refresh } from '../../router.js';
import { esc } from '../../format.js';

// A sheet with a schema-driven form; onSave receives typed data. Returns nothing.
export function formSheet({ title, fields, onSave, saveLabel = 'Save', onDelete, deleteLabel = 'Delete', confirmDelete }) {
  const actions = [];
  if (onDelete) actions.push({ label: deleteLabel, kind: 'btn--danger', onClick: async () => { if (await confirm({ title: confirmDelete?.title || `${deleteLabel}?`, body: confirmDelete?.body || 'This cannot be undone.', confirmLabel: deleteLabel, danger: true })) { await onDelete(); toast('Deleted'); refresh(); return true; } return false; } });
  actions.push({ label: saveLabel, onClick: async (s) => { const { data, errors } = readForm(s.body, fields); if (errors.length) { toast(`Needed: ${errors.slice(0, 3).join(', ')}`, { type: 'error' }); return false; } try { await onSave(data); toast('Saved'); refresh(); } catch (e) { toast(e.message, { type: 'error' }); return false; } } });
  sheet({ title, body: form(fields), actions, onMount: (s) => s.body.querySelector('input, textarea, select')?.focus() });
}

export const staffRow = ({ title, sub, meta, pill, action = 'edit', id, muted = false }) => `
  <button class="ledger-row ledger-row--pad${muted ? ' ledger-row--muted' : ''}" type="button" data-action="${esc(action)}" data-id="${esc(id)}" style="grid-template-columns: 1fr auto">
    <span class="ledger-row__body"><span class="ledger-row__title">${esc(title)}</span>${sub ? `<span class="ledger-row__sub">${sub}</span>` : ''}${meta ? `<span class="ledger-row__meta">${meta}</span>` : ''}${pill ? `<span class="row mt-2" style="gap:6px;flex-wrap:wrap">${pill}</span>` : ''}</span>
    <span class="ledger-row__trail"><svg viewBox="0 0 24 24"><path d="m9.5 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  </button>`;

export const addButton = (label, action = 'add') => `<div class="wrap mt-4"><button class="btn btn--primary btn--block" type="button" data-action="${esc(action)}">+ ${esc(label)}</button></div>`;

export const YEAR_OPTIONS = (() => { const y = new Date().getFullYear(); return [y - 2, y - 1, y, y + 1].map((n) => `${n}/${String(n + 1).slice(2)}`); })();
export const COHORT_OPTIONS = (() => { const y = new Date().getFullYear(); return Array.from({ length: 6 }, (_, i) => String(y - 4 + i)); })();
