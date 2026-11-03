// Buat privacy.html (dwibahasa) dari master.json -> bisa dipublikasikan lewat GitHub Pages untuk tautan kebijakan privasi di Play Store.
//   node scripts/build-privacy.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const m = JSON.parse(readFileSync(new URL('master.json', root), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const block = (lang, title) => `<section lang="${lang}"><h2>${title}</h2><p class="date">${lang === 'en' ? 'Last updated' : 'Diperbarui'}: ${esc(m.privacy.updatedAt)}</p>${m.privacy[lang].map((s) => `<h3>${esc(s.h)}</h3><p>${esc(s.p)}</p>`).join('')}${m.app?.contactEmail ? `<p><b>${lang === 'en' ? 'Contact' : 'Kontak'}:</b> <a href="mailto:${esc(m.app.contactEmail)}">${esc(m.app.contactEmail)}</a></p>` : ''}</section>`;
const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ke Pacitan — Kebijakan Privasi / Privacy Policy</title>
<style>body{font:16px/1.6 system-ui,sans-serif;max-width:720px;margin:0 auto;padding:24px;color:#0f2a2e}h1{color:#3d9a8b}h2{margin-top:40px;border-bottom:2px solid #d9ebe6;padding-bottom:6px}h3{margin:22px 0 4px}.date{color:#5b7077;font-size:14px}</style></head>
<body><h1>Ke Pacitan</h1><p><a href="#id">Bahasa Indonesia</a> · <a href="#en">English</a></p>
<div id="id">${block('id', 'Kebijakan Privasi')}</div><div id="en">${block('en', 'Privacy Policy')}</div></body></html>
`;
writeFileSync(new URL('privacy.html', root), html);
console.log('privacy.html dibuat (' + html.length + ' byte)');
