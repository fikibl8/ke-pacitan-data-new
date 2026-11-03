// Cloudflare Worker: menerima rekomendasi tempat dari aplikasi dan menyimpannya ke GitHub sebagai
//   request/req_<KODE-APLIKASI>.json   (satu berkas per kode; tiap kiriman ditambahkan ke daftar "requests")
// Token GitHub hanya ada di Worker (secret), TIDAK pernah ada di aplikasi.
//
// Variabel: GITHUB_TOKEN (secret), GITHUB_REPO (mis. "fikibl8/ke-pacitan-requests"), GITHUB_BRANCH (default "main")

const CODE_RE = /^[A-Z]{2}-\d{4}-PCT$/;
const MAX_BODY = 8 * 1024;
const MAX_PER_CODE = 20;

const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const b64 = (s) => btoa(unescape(encodeURIComponent(s)));
const unb64 = (s) => decodeURIComponent(escape(atob(s.replace(/\n/g, ''))));

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const reply = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

export function buildEntry(body) {
  const code = clip(body?.code, 20).toUpperCase();
  if (!CODE_RE.test(code)) throw Object.assign(new Error('kode aplikasi tidak valid'), { status: 400 });
  const name = clip(body?.place?.name, 120);
  if (name.length < 3) throw Object.assign(new Error('nama tempat minimal 3 karakter'), { status: 400 });
  const mapsUrl = clip(body?.place?.mapsUrl, 300);
  if (mapsUrl && !/^https?:\/\//i.test(mapsUrl)) throw Object.assign(new Error('tautan peta harus diawali http(s)://'), { status: 400 });
  return {
    code,
    entry: {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      lang: clip(body?.lang, 5),
      appVersion: clip(body?.appVersion, 20),
      platform: clip(body?.platform, 20),
      place: { name, category: clip(body?.place?.category, 40), address: clip(body?.place?.address, 200), mapsUrl, notes: clip(body?.place?.notes, 600) },
      contact: { name: clip(body?.contact?.name, 60), contact: clip(body?.contact?.contact, 100) },
    },
  };
}

export async function handle(request, env, fetchImpl = fetch) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return reply({ ok: false, error: 'gunakan POST' }, 405);

  const text = await request.text();
  if (text.length > MAX_BODY) return reply({ ok: false, error: 'permintaan terlalu besar' }, 413);
  let built;
  try {
    built = buildEntry(JSON.parse(text));
  } catch (e) {
    return reply({ ok: false, error: e.status ? e.message : 'format JSON tidak valid' }, e.status || 400);
  }
  const { code, entry } = built;

  const repo = env.GITHUB_REPO, branch = env.GITHUB_BRANCH || 'main';
  const url = `https://api.github.com/repos/${repo}/contents/request/req_${code}.json`;
  const headers = { Authorization: `Bearer ${env.GITHUB_TOKEN}`, 'User-Agent': 'ke-pacitan-request-worker', Accept: 'application/vnd.github+json' };

  for (let attempt = 0; attempt < 2; attempt++) {
    let sha, doc = { code, requests: [] };
    const cur = await fetchImpl(`${url}?ref=${branch}`, { headers });
    if (cur.status === 200) {
      const j = await cur.json();
      sha = j.sha;
      try { doc = JSON.parse(unb64(j.content)); } catch { /* berkas rusak: mulai ulang */ }
    } else if (cur.status !== 404) {
      return reply({ ok: false, error: `GitHub membaca berkas: HTTP ${cur.status}` }, 502);
    }
    doc.requests = Array.isArray(doc.requests) ? doc.requests : [];
    if (doc.requests.length >= MAX_PER_CODE) return reply({ ok: false, error: 'batas kiriman untuk kode ini tercapai' }, 429);
    doc.requests.push(entry);

    const put = await fetchImpl(url, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `request: ${code} (${entry.place.name.slice(0, 40)})`, content: b64(JSON.stringify(doc, null, 2) + '\n'), branch, ...(sha ? { sha } : {}) }),
    });
    if (put.status === 200 || put.status === 201) return reply({ ok: true, id: entry.id });
    if (put.status !== 409 && put.status !== 422) return reply({ ok: false, error: `GitHub menyimpan berkas: HTTP ${put.status}` }, 502);
  }
  return reply({ ok: false, error: 'gagal menyimpan, coba lagi' }, 502);
}

export default { fetch: (request, env) => handle(request, env) };
