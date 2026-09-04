// Dates, numbers and text helpers. Everything is en-GB.
const LOCALE = 'en-GB';
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const toDate = (d) => (d instanceof Date ? d : new Date(d));
export const isSameDay = (a, b) => { a = toDate(a); b = toDate(b); return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); };
export const startOfDay = (d) => { const x = toDate(d); return new Date(x.getFullYear(), x.getMonth(), x.getDate()); };

export const dayParts = (d) => { d = toDate(d); return { num: String(d.getDate()), mon: d.toLocaleDateString(LOCALE, { month: 'short' }).replace('.', '') }; };
export const time = (d) => toDate(d).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
export const weekday = (d) => toDate(d).toLocaleDateString(LOCALE, { weekday: 'short' });
export const dateLong = (d) => toDate(d).toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });
export const dateFull = (d) => toDate(d).toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
export const monthName = (d = new Date()) => toDate(d).toLocaleDateString(LOCALE, { month: 'long' });
export const monthYear = (d = new Date()) => toDate(d).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });

export function range(start, end) {
  const s = toDate(start), e = end ? toDate(end) : null;
  if (!e) return `${dateLong(s)} · ${time(s)}`;
  if (isSameDay(s, e)) return `${dateLong(s)} · ${time(s)}–${time(e)}`;
  const sameMonth = s.getMonth() === e.getMonth();
  return sameMonth
    ? `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString(LOCALE, { month: 'short' })}`
    : `${s.getDate()} ${s.toLocaleDateString(LOCALE, { month: 'short' })} – ${e.getDate()} ${e.toLocaleDateString(LOCALE, { month: 'short' })}`;
}

export const daysUntil = (d) => Math.round((startOfDay(d) - startOfDay(new Date())) / 86400000);

export function relative(d) {
  const diff = toDate(d) - Date.now();
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60000), h = Math.round(abs / 3600000), days = Math.round(abs / 86400000);
  const past = diff < 0;
  if (m < 1) return 'now';
  if (m < 60) return past ? `${m}m ago` : `in ${m}m`;
  if (h < 24) return past ? `${h}h ago` : `in ${h}h`;
  if (days === 1) return past ? 'yesterday' : 'tomorrow';
  if (days < 7) return past ? `${days}d ago` : `in ${days} days`;
  return dateLong(d);
}

export function deadlineLabel(d) {
  const n = daysUntil(d);
  if (n < 0) return 'Closed';
  if (n === 0) return 'Closes today';
  if (n === 1) return 'Closes tomorrow';
  return `Closes in ${n} days`;
}

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
export const firstName = (name = '') => name.split(/\s+/)[0] || '';
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const greetingLine = () => { const h = new Date().getHours(); return h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
export const academicYear = (d = new Date()) => { d = toDate(d); const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; return `${y}/${String(y + 1).slice(2)}`; };
export const nl2p = (s) => esc(s).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
