// Validasi master.json: dijalankan otomatis (GitHub Actions) tiap push, bisa juga manual: node scripts/validate-master.mjs
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const m = JSON.parse(readFileSync(new URL('master.json', root), 'utf8'));
const errors = [];
const inPacitan = (lat, lng) => typeof lat === 'number' && typeof lng === 'number' && lat > -8.6 && lat < -7.8 && lng > 110.6 && lng < 111.6;

const ids = new Set();
for (const p of m.places || []) {
  const tag = `places[${p.id}] "${p.name}"`;
  if (ids.has(p.id)) errors.push(`${tag}: id ganda`);
  ids.add(p.id);
  if (!inPacitan(p.lat, p.lng)) errors.push(`${tag}: lat/lng wajib ada dan harus di wilayah Pacitan (dapat ${p.lat}, ${p.lng})`);
  if (!(m.categories || []).some((c) => c.id === p.category)) errors.push(`${tag}: kategori "${p.category}" tidak ada di categories`);
  for (const im of p.images || []) if (!/^https?:/.test(im.src) && !existsSync(new URL(im.src, root))) errors.push(`${tag}: berkas foto tidak ada: ${im.src}`);
}
for (const s of m.services || []) for (const g of s.groups) for (const it of g.items)
  if (!inPacitan(it.lat, it.lng)) errors.push(`services[${s.id}] "${it.name}": lat/lng wajib ada dan harus di wilayah Pacitan`);
for (const h of m.heroSlides || []) if (h.placeId && !ids.has(h.placeId)) errors.push(`heroSlides[${h.id}]: placeId ${h.placeId} tidak ada`);
for (const j of m.jlsPoints || []) if (j.placeId && !ids.has(j.placeId)) errors.push(`jlsPoints[${j.id}]: placeId ${j.placeId} tidak ada`);

if (errors.length) {
  console.error('master.json TIDAK valid:\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log(`master.json valid: versi ${m.version}, ${m.places.length} tempat, semua punya lat/lng.`);
