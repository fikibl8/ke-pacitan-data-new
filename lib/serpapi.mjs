// Ambil rating + review Google Maps lewat SerpApi. Dipakai app (saat detail dibuka) dan scripts/fetch-reviews.mjs.
// Biaya: 1 kredit per request.

async function serp(key, params) {
  const url = new URL('https://serpapi.com/search.json');
  for (const [k, v] of Object.entries({ hl: 'id', api_key: key, ...params })) url.searchParams.set(k, v);
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// q: kata kunci pencarian; dataId (opsional): lewati pencarian bila hasilnya salah tempat.
// SerpApi hanya memberi 5 review per request (tanpa halaman berikutnya), tetapi tiap urutan memberi review
// yang berbeda. Jadi beberapa urutan digabung, duplikat dibuang, dan hanya review berteks yang dipakai.
// Satu tempat ≈ 1 pencarian (dilewati bila dataId diketahui) + 4 request review.
const SORTS = [
  ['qualityScore', 4],
  ['newestFirst', 3],
  ['ratingHigh', 3],
  ['ratingLow', 2],
];

export async function fetchPlaceReviews({ key, q, dataId, target = 10 }) {
  let found = {};
  if (!dataId) {
    const s = await serp(key, { engine: 'google_maps', type: 'search', q });
    found = s.place_results || s.local_results?.[0] || {};
    dataId = found.data_id;
    if (!dataId) throw new Error('tempat tidak ditemukan');
  }

  const reviews = [];
  const seen = new Set();
  let info = {};
  for (const [sort_by, cap] of SORTS) {
    if (reviews.length >= target) break;
    const r = await serp(key, { engine: 'google_maps_reviews', data_id: dataId, sort_by });
    info = r.place_info || info;
    let added = 0;
    for (const rv of r.reviews || []) {
      const text = (rv.extracted_snippet?.original || rv.snippet || '').trim();
      const uid = rv.review_id || `${rv.user?.name}|${text.slice(0, 40)}`;
      if (!text || seen.has(uid) || added >= cap || reviews.length >= target) continue;
      seen.add(uid);
      added++;
      reviews.push({ author: rv.user?.name || 'Pengguna Google', rating: rv.rating, text, time: rv.date || '' });
    }
  }

  return {
    matched: info.title || found.title,
    address: info.address || found.address,
    rating: info.rating ?? found.rating ?? null,
    total: info.reviews ?? found.reviews ?? 0,
    mapsUri: found.place_id
      ? `https://www.google.com/maps/place/?q=place_id:${found.place_id}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
    dataId,
    reviews,
  };
}
