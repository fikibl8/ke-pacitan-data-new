// Uji lokal tanpa jaringan: GitHub dipalsukan di memori.  node worker/test.mjs
import { handle } from './request-worker.mjs';

const files = new Map(); // path -> { sha, content(base64) }
let sha = 0;
const fakeGithub = async (url, init = {}) => {
  const path = new URL(url).pathname.split('/contents/')[1];
  if (!init.method || init.method === 'GET') {
    const f = files.get(path);
    return f ? new Response(JSON.stringify(f), { status: 200 }) : new Response('{}', { status: 404 });
  }
  const b = JSON.parse(init.body);
  const cur = files.get(path);
  if (cur && b.sha !== cur.sha) return new Response('{}', { status: 409 });
  files.set(path, { sha: String(++sha), content: b.content });
  return new Response('{}', { status: cur ? 200 : 201 });
};
const env = { GITHUB_TOKEN: 'x', GITHUB_REPO: 'o/r', GITHUB_BRANCH: 'main' };
const post = (body, raw) => handle(new Request('https://w/', { method: 'POST', body: raw ?? JSON.stringify(body) }), env, fakeGithub);
const ok = (c, m) => { if (!c) { console.error('✖', m); process.exit(1); } console.log('✔', m); };
const valid = { code: 'AE-1000-PCT', lang: 'id', appVersion: '1.0.0', platform: 'android', place: { name: 'Pantai Ngiroboyo', category: 'Pantai', address: 'Kec. Pringkuku', mapsUrl: 'https://maps.app.goo.gl/x', notes: 'Pantai sepi, ada warung' }, contact: { name: 'Budi', contact: 'budi@example.com' } };

let r = await post(valid); ok(r.status === 200 && (await r.json()).ok, 'kiriman pertama tersimpan (berkas baru)');
const saved = JSON.parse(Buffer.from(files.get('request/req_AE-1000-PCT.json').content, 'base64').toString());
ok(saved.code === 'AE-1000-PCT' && saved.requests.length === 1 && saved.requests[0].place.name === 'Pantai Ngiroboyo', 'isi berkas request/req_AE-1000-PCT.json benar');
r = await post({ ...valid, place: { ...valid.place, name: 'Air Terjun Baru' } }); ok(r.status === 200, 'kiriman kedua dari kode yang sama ditambahkan');
ok(JSON.parse(Buffer.from(files.get('request/req_AE-1000-PCT.json').content, 'base64').toString()).requests.length === 2, 'berkas berisi 2 permintaan');
r = await post({ ...valid, code: 'bad' }); ok(r.status === 400, 'kode tidak valid ditolak (400)');
r = await post({ ...valid, place: { name: 'ab' } }); ok(r.status === 400, 'nama tempat terlalu pendek ditolak (400)');
r = await post({ ...valid, place: { ...valid.place, mapsUrl: 'javascript:alert(1)' } }); ok(r.status === 400, 'tautan non-http ditolak (400)');
r = await post(null, '{bukan json'); ok(r.status === 400, 'JSON rusak ditolak (400)');
r = await post(null, 'x'.repeat(9000)); ok(r.status === 413, 'permintaan terlalu besar ditolak (413)');
r = await handle(new Request('https://w/', { method: 'GET' }), env, fakeGithub); ok(r.status === 405, 'GET ditolak (405)');
r = await handle(new Request('https://w/', { method: 'OPTIONS' }), env, fakeGithub); ok(r.status === 204 && r.headers.get('Access-Control-Allow-Origin') === '*', 'preflight CORS (204)');
for (let i = 0; i < 18; i++) await post({ ...valid, place: { ...valid.place, name: 'Tempat ' + i } });
r = await post(valid); ok(r.status === 429, 'batas 20 kiriman per kode (429)');
r = await post({ ...valid, code: 'ZZ-9999-PCT', place: { ...valid.place, name: 'Nama ✓ “unicode”' } }); ok(r.status === 200, 'karakter unicode diterima');
console.log('\nSemua uji Worker lolos.');
