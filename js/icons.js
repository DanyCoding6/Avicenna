// Monoline SVG icons (24px grid, 1.5px stroke). Strings, so they can be dropped into templates.
const svg = (body, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;

// The khatam: two squares, one rotated 45°, the eight-pointed star of Islamic geometry.
export const khatam = (cls = 'khatam') => svg(
  `<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">
     <rect x="5" y="5" width="14" height="14"/>
     <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)"/>
   </g>`, cls);
export const khatamSolid = (cls = 'khatam') => svg(
  `<g fill="currentColor"><rect x="6" y="6" width="12" height="12"/><rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)"/></g>`, cls);

const stroke = (paths) => `<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;

export const icons = {
  home: svg(stroke(`<path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 10v9.5h11V10"/><path d="M10 19.5v-5h4v5"/>`)),
  events: svg(stroke(`<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M8 13h2M13 13h3M8 16.5h5"/>`)),
  programme: svg(stroke(`<path d="M12 6.5c-1.6-1.4-3.8-2-7.5-2v13c3.7 0 5.9.6 7.5 2 1.6-1.4 3.8-2 7.5-2v-13c-3.7 0-5.9.6-7.5 2Z"/><path d="M12 6.5v13"/>`)),
  hub: svg(stroke(`<rect x="6.5" y="6.5" width="11" height="11"/><rect x="6.5" y="6.5" width="11" height="11" transform="rotate(45 12 12)"/>`)),
  chevronLeft: svg(stroke(`<path d="m14.5 6-6 6 6 6"/>`)),
  chevronRight: svg(stroke(`<path d="m9.5 6 6 6-6 6"/>`)),
  check: svg(stroke(`<path d="m5 12.5 4.5 4.5L19 7.5"/>`)),
  plus: svg(stroke(`<path d="M12 5v14M5 12h14"/>`)),
  x: svg(stroke(`<path d="M6 6l12 12M18 6 6 18"/>`)),
  pin: svg(stroke(`<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.5"/>`)),
  clock: svg(stroke(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`)),
  video: svg(stroke(`<rect x="3.5" y="6.5" width="12" height="11" rx="2"/><path d="m15.5 10.5 5-2.5v8l-5-2.5"/>`)),
  link: svg(stroke(`<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`)),
  lock: svg(stroke(`<rect x="5.5" y="10.5" width="13" height="10" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>`)),
  heart: svg(stroke(`<path d="M12 20s-7.5-4.6-7.5-10A4 4 0 0 1 12 7.6 4 4 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/>`)),
  comment: svg(stroke(`<path d="M4.5 6.5A2 2 0 0 1 6.5 4.5h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4.5 3.5v-3.5h-1v-10Z"/>`)),
  send: svg(stroke(`<path d="M20 4 4 10.5l7 2.5 2.5 7L20 4Z"/><path d="M11 13l9-9"/>`)),
  search: svg(stroke(`<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>`)),
  calendarPlus: svg(stroke(`<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4M12 12v5M9.5 14.5h5"/>`)),
  share: svg(stroke(`<path d="M12 4v11M8 8l4-4 4 4"/><path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>`)),
  file: svg(stroke(`<path d="M7 3.5h7l4.5 4.5v12.5h-11.5Z"/><path d="M14 3.5V8h4.5"/><path d="M9.5 13h5M9.5 16h5"/>`)),
  play: svg(stroke(`<circle cx="12" cy="12" r="8.5"/><path d="m10 9 5 3-5 3Z"/>`)),
  external: svg(stroke(`<path d="M14 5h5v5M19 5l-8 8"/><path d="M17 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5 18V9a1.5 1.5 0 0 1 1.5-1.5H11"/>`)),
  bell: svg(stroke(`<path d="M6.5 16.5v-5a5.5 5.5 0 0 1 11 0v5l1.5 2h-14l1.5-2Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>`)),
  user: svg(stroke(`<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.5 3.5-5.5 7-5.5s6.2 2 7 5.5"/>`)),
  users: svg(stroke(`<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3 2.6-4.8 5.5-4.8s4.9 1.8 5.5 4.8"/><path d="M15.5 5.7a3 3 0 0 1 0 5.6M17 14.4c2.1.5 3.2 2 3.5 4.6"/>`)),
  edit: svg(stroke(`<path d="M4.5 19.5h4l10-10-4-4-10 10v4Z"/><path d="m13 7 4 4"/>`)),
  info: svg(stroke(`<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.5"/>`)),
  spark: svg(stroke(`<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8Z"/>`)),
  compass: svg(stroke(`<circle cx="12" cy="12" r="8.5"/><path d="m15 9-2 6-4 2 2-6Z"/>`)),
  book: svg(stroke(`<path d="M5 4.5h10a3 3 0 0 1 3 3v12H8a3 3 0 0 0-3 3V4.5Z"/><path d="M5 19.5A3 3 0 0 1 8 16.5h10"/>`)),
  flag: svg(stroke(`<path d="M6 21V4"/><path d="M6 4.5h11l-2 4 2 4H6"/>`)),
  handshake: svg(stroke(`<path d="M3.5 8.5 8 6l4 2 4-2 4.5 2.5-3 7-3 1.5-2.5-2.5"/><path d="M8 6l-1 7 3.5 3 2 1.5 2-1.5"/>`)),
  moon: svg(stroke(`<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z"/>`)),
  building: svg(stroke(`<path d="M4.5 20.5h15M6 20.5V5.5l6-2 6 2v15"/><path d="M9 9h2M13 9h2M9 12.5h2M13 12.5h2M9 16h2M13 16h2"/>`)),
  logout: svg(stroke(`<path d="M10 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h4"/><path d="M15 8l4 4-4 4M9 12h10"/>`)),
  download: svg(stroke(`<path d="M12 4v11M8 11l4 4 4-4"/><path d="M5 19.5h14"/>`)),
  wifiOff: svg(stroke(`<path d="M4 4l16 16"/><path d="M8.5 15.5a5 5 0 0 1 5.5-1"/><path d="M5 12a10 10 0 0 1 4-2.5M12 6.5a10 10 0 0 1 7 2.8M15.5 15.5a5 5 0 0 0-1-1"/><circle cx="12" cy="18.5" r=".5"/>`)),
  phone: svg(stroke(`<path d="M6 4.5h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.5 1.5A15 15 0 0 1 4.5 6 1.5 1.5 0 0 1 6 4.5Z"/>`)),
  mail: svg(stroke(`<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>`)),
};
