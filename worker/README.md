# Penerima rekomendasi tempat (Cloudflare Worker)

Aplikasi mengirim rekomendasi tempat ke Worker ini; Worker menyimpannya ke GitHub sebagai
`request/req_<KODE-APLIKASI>.json` (mis. `request/req_AE-1000-PCT.json`). Satu berkas per kode, tiap kiriman
ditambahkan ke daftar `requests` (maks. 20 per kode). Token GitHub hanya ada di Worker, tidak di aplikasi.

## ⚠️ Pakai repo PRIVATE untuk permintaan
Repo `ke-pacitan-data-new` itu **public**. Jika `request/` ditulis ke sana, nama/kontak/catatan pengirim
bisa dibaca siapa saja. Buat repo private terpisah (mis. `ke-pacitan-requests`) dan isi `GITHUB_REPO` ke repo itu.

## Langkah (gratis, tanpa kartu)
1. Buat repo private `ke-pacitan-requests` (centang "Add a README").
2. GitHub → Settings → Developer settings → Fine-grained tokens → token baru:
   hanya repo `ke-pacitan-requests`, izin **Contents: Read and write**.
3. Daftar di cloudflare.com (gratis), lalu di folder ini:
   ```bash
   cd worker
   npx wrangler login
   npx wrangler secret put GITHUB_TOKEN     # tempel token dari langkah 2
   npx wrangler deploy
   ```
4. Salin URL hasil deploy (`https://ke-pacitan-request.<akun>.workers.dev`) ke `master.json` → `app.requestEndpoint`, commit & push.
5. Uji: `node worker/test.mjs` (tanpa jaringan), atau kirim satu rekomendasi dari aplikasi dan lihat berkas baru di repo private.

## Perlindungan spam
Siapa pun yang tahu URL bisa mengirim. Batasan bawaan: ukuran 8 KB, format kode `XX-0000-PCT`, maks. 20 kiriman per kode.
Tambahkan *Rate limiting rule* di dashboard Cloudflare (gratis) bila mulai ada penyalahgunaan.
