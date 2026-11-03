// Ambil review Google Maps (SerpApi) untuk tiap tempat di master.json -> reviews.json.
// Dijalankan mingguan oleh GitHub Actions (.github/workflows/reviews.yml); bisa juga manual:
//   SERPAPI_KEY=... node scripts/fetch-reviews.mjs
// Bila satu tempat gagal, review lama tempat itu dipertahankan, dan script gagal hanya jika SEMUA tempat gagal.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fetchPlaceReviews } from '../lib/serpapi.mjs';

const key = process.env.SERPAPI_KEY;
if (!key) {
  console.error('SERPAPI_KEY belum diisi.');
  process.exit(1);
}

const master = JSON.parse(readFileSync(new URL('../master.json', import.meta.url), 'utf8'));
const FILE = new URL('../reviews.json', import.meta.url);
const old = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : {};
const out = { ...old };
let ok = 0;

for (const p of master.places) {
  if (!p.reviewQuery && !p.reviewDataId) continue;
  try {
    const d = await fetchPlaceReviews({
      key,
      q: p.reviewQuery,
      dataId: p.reviewDataId || old[p.id]?.dataId, // dataId lama dipakai ulang -> hemat 1 kredit
    });
    if (!d.reviews.length) throw new Error('tidak ada review berteks');
    out[p.id] = d;
    ok++;
    console.log(`✔ [${p.id}] ${p.name} → cocok dengan: ${d.matched} (${d.address}) — ${d.reviews.length} review`);
  } catch (e) {
    console.error(`✖ [${p.id}] ${p.name}: ${e.message} (review lama dipertahankan)`);
  }
}

writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n');
if (!ok) process.exit(1);
