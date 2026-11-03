# ke-pacitan-data-new

Data aplikasi **Ke Pacitan**. Aplikasi mengunduh file di sini lewat
`https://raw.githubusercontent.com/fikibl8/ke-pacitan-data-new/main/<file>`.

## master.json

| Kunci | Isi |
|---|---|
| `categories` | chip kategori di Beranda (`id` harus sama dengan `category` di `places`) |
| `heroSlides` | banner geser di Beranda |
| `places` | tempat wisata/kuliner/pitstop/camping (kartu, detail, biaya, fasilitas, video YouTube) |
| `jlsPoints` | daftar titik pandang & rest area di tab Rute JLS (`placeId` opsional, membuka detail tempat) |
| `checklistGroups`, `checklist` | daftar wishlist di tab Jurnal |

Cara menambah tempat: salin satu objek di `places`, beri `id` baru yang unik, ubah isinya, lalu commit.
`youtubeId` adalah kode setelah `watch?v=` di URL YouTube. Aplikasi memeriksa pembaruan tiap 6 jam,
jadi perubahan muncul tanpa merilis versi baru.

Aplikasi menolak file yang formatnya tidak valid dan memakai data tersimpan, jadi pastikan JSON valid
(cek di https://jsonlint.com sebelum commit).

## reviews.json

Diisi otomatis oleh GitHub Actions ([workflow](.github/workflows/reviews.yml)) tiap Senin 03:00 WIB, memakai SerpApi
dan kata kunci `reviewQuery` di `master.json`. Butuh secret repo `SERPAPI_KEY`
(Settings → Secrets and variables → Actions). Jalankan manual: tab **Actions → Perbarui review Google Maps → Run workflow**.
Jika hasil pencarian salah tempat, isi `reviewDataId` pada tempat itu di `master.json`.
