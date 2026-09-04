// Schema-driven forms for sheets. fields: [{ name, label, type, options, required, value, hint, half, placeholder, min, max, step, rows }]
import { esc } from '../format.js';

const control = (f) => {
  const v = f.value ?? '';
  const common = `name="${esc(f.name)}" id="f-${esc(f.name)}" ${f.required ? 'required' : ''} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''}`;
  switch (f.type) {
    case 'textarea': return `<textarea class="textarea" ${common} ${f.rows ? `style="min-height:${f.rows * 24 + 24}px"` : ''}>${esc(v)}</textarea>`;
    case 'select': return `<select class="select" ${common}>${(f.options || []).map((o) => { const [val, label] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(label)}</option>`; }).join('')}</select>`;
    case 'checkbox': return `<label class="switch"><span>${esc(f.label)}</span><input type="checkbox" name="${esc(f.name)}" id="f-${esc(f.name)}" ${v ? 'checked' : ''}><span class="switch__track"></span></label>`;
    case 'number': return `<input class="input" type="number" ${common} value="${esc(v)}" ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} ${f.step ? `step="${f.step}"` : ''}>`;
    case 'tags': return `<input class="input" type="text" ${common} value="${esc(Array.isArray(v) ? v.join(', ') : v)}">`;
    case 'datetime': return `<input class="input" type="datetime-local" ${common} value="${esc(toLocalInput(v))}">`;
    case 'date': return `<input class="input" type="date" ${common} value="${esc(v ? String(v).slice(0, 10) : '')}">`;
    default: return `<input class="input" type="${esc(f.type || 'text')}" ${common} value="${esc(v)}">`;
  }
};

export const toLocalInput = (d) => { if (!d) return ''; const x = new Date(d); if (isNaN(x)) return ''; const p = (n) => String(n).padStart(2, '0'); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`; };

export function form(fields) {
  const out = []; let i = 0;
  while (i < fields.length) {
    const f = fields[i];
    const one = (g) => g.type === 'checkbox' ? `<div class="field">${control(g)}${g.hint ? `<div class="field__hint">${esc(g.hint)}</div>` : ''}</div>` : `<label class="field"><span class="field__label label">${esc(g.label)}${g.required ? '' : ' <span class="muted">· optional</span>'}</span>${control(g)}${g.hint ? `<div class="field__hint">${esc(g.hint)}</div>` : ''}</label>`;
    if (f.half && fields[i + 1]?.half) { out.push(`<div class="form-row">${one(f)}${one(fields[i + 1])}</div>`); i += 2; }
    else { out.push(one(f)); i += 1; }
  }
  return `<div class="stack" data-form>${out.join('')}</div>`;
}

export function readForm(root, fields) {
  const data = {}; const errors = [];
  for (const f of fields) {
    const el = root.querySelector(`[name="${f.name}"]`); if (!el) continue;
    let v;
    if (f.type === 'checkbox') v = el.checked;
    else if (f.type === 'number') v = el.value === '' ? null : Number(el.value);
    else if (f.type === 'tags') v = el.value.split(',').map((s) => s.trim()).filter(Boolean);
    else if (f.type === 'datetime') v = el.value ? new Date(el.value).toISOString() : null;
    else v = el.value.trim() === '' ? null : el.value.trim();
    if (f.required && (v == null || v === '' || (Array.isArray(v) && !v.length))) errors.push(f.label);
    data[f.name] = v;
  }
  return { data, errors };
}
