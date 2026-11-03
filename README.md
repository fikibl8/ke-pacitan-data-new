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

## images/

Foto tempat (JPEG, lebar maks. 1200 px). Alamat di `master.json` ditulis relatif, mis. `images/1-1.jpg`; aplikasi menambahkan
alamat repo ini di depannya. Tiap foto punya `credit` dan `source` yang ditampilkan di halaman detail.
Foto saat ini berasal dari Wikimedia Commons (CC BY-SA / CC BY / domain publik); rinciannya ada di [images/CREDITS.md](images/CREDITS.md).
Tempat tanpa foto otomatis memakai latar gradasi. Jika menambah foto sendiri, ukurannya dikecilkan dulu (±200–300 KB) dan
isi `credit` (mis. `Foto: nama Anda`).

## Menambah foto sendiri (per tempat)

Tiap tempat wisata dan tiap item Darurat/Pitstop/Penginapan bisa punya foto sendiri (maks. 6, tampil sebagai slider).

```bash
node scripts/add-photos.mjs --init                          # sekali saja: buat folder foto-baru/<nama-tempat>/
# salin foto ke folder tempat yang sesuai (jpg, png, heic dari iPhone juga bisa)
node scripts/add-photos.mjs --credit "Foto: Nama Anda"      # kecilkan, simpan ke images/places/, isi master.json
git add -A && git commit -m "foto tempat" && git push
```

Daftar nama folder ada di `foto-baru/DAFTAR.md`. Folder `foto-baru/` berisi foto asli dan tidak ikut di-push (ada di `.gitignore`).
Menjalankan skrip lagi akan mengganti foto milik sendiri, sedangkan foto dari sumber lain (mis. Wikimedia Commons) tetap dipertahankan.
