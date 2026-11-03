// Daftarkan foto milik sendiri ke master.json (tempat wisata DAN item Darurat/Pitstop/Penginapan).
//
//   node scripts/add-photos.mjs --init                    -> buat folder foto-baru/<nama-tempat>/ untuk semua tempat
//   (salin foto ke folder tempat yang sesuai: jpg, png, heic, ...)
//   node scripts/add-photos.mjs --credit "Foto: Nama Anda"  -> kecilkan foto (1200 px), simpan ke images/places/, isi master.json
//   node scripts/add-photos.mjs --dry                     -> hanya tampilkan apa yang akan dilakukan
//
// Butuh macOS (memakai `sips` untuk mengecilkan foto, termasuk HEIC dari iPhone).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const MAX_PER_PLACE = 6;
const credit = opt('--credit', 'Foto: Ke Pacitan');

const masterPath = root + 'master.json';
const master = JSON.parse(readFileSync(masterPath, 'utf8'));
const slug = (n) => n.toLowerCase().replace(/&/g, ' dan ').normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// semua target: tempat wisata + item layanan
const targets = [];
for (const p of master.places) targets.push({ kind: 'Tempat', name: p.name, slug: slug(p.name), obj: p });
for (const s of master.services || []) for (const g of s.groups) for (const it of g.items) targets.push({ kind: s.title, name: it.name, slug: slug(it.name), obj: it });

const seen = new Set();
for (const t of targets) {
  if (seen.has(t.slug)) t.slug += '-' + t.kind.toLowerCase();
  seen.add(t.slug);
}

const inbox = root + 'foto-baru/';
if (flag('--init')) {
  mkdirSync(inbox, { recursive: true });
  let md = '# Folder foto\n\nSalin foto ke folder tempat yang sesuai, lalu jalankan `node scripts/add-photos.mjs --credit "Foto: Nama Anda"`.\nMaksimal ' + MAX_PER_PLACE + ' foto per tempat; urutan mengikuti nama berkas (1.jpg, 2.jpg, ...).\n\n| Folder | Tempat | Jenis |\n|---|---|---|\n';
  for (const t of targets) {
    mkdirSync(inbox + t.slug, { recursive: true });
    md += `| ${t.slug} | ${t.name} | ${t.kind} |\n`;
  }
  writeFileSync(inbox + 'DAFTAR.md', md);
  console.log(`Folder dibuat di foto-baru/ untuk ${targets.length} tempat. Daftar lengkap: foto-baru/DAFTAR.md`);
  process.exit(0);
}

if (!existsSync(inbox)) {
  console.error('Folder foto-baru/ belum ada. Jalankan dulu: node scripts/add-photos.mjs --init');
  process.exit(1);
}

const isPhoto = (f) => /\.(jpe?g|png|heic|heif|webp)$/i.test(f);
mkdirSync(root + 'images/places', { recursive: true });
let changed = 0;
for (const t of targets) {
  const dir = inbox + t.slug;
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter(isPhoto).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).slice(0, MAX_PER_PLACE);
  if (!files.length) continue;

  const mine = [];
  files.forEach((f, i) => {
    const dst = `images/places/${t.slug}-${i + 1}.jpg`;
    if (!flag('--dry')) {
      const tmp = root + 'images/places/.tmp-' + f.replace(/[^a-z0-9.]/gi, '_');
      copyFileSync(`${dir}/${f}`, tmp);
      try {
        execFileSync('sips', ['-Z', '1200', '-s', 'format', 'jpeg', '-s', 'formatOptions', '72', tmp, '--out', root + dst], { stdio: 'ignore' });
      } finally {
        rmSync(tmp, { force: true });
      }
    }
    mine.push({ src: dst, credit, mine: true });
  });

  // ganti foto milik sendiri sebelumnya; foto dari sumber lain (mis. Wikimedia Commons) tetap ada di belakang
  const others = (t.obj.images || []).filter((im) => !im.mine);
  t.obj.images = [...mine, ...others];
  changed++;
  console.log(`✔ ${t.name}: ${files.length} foto → images/places/${t.slug}-*.jpg`);
}

if (!changed) {
  console.log('Belum ada foto di folder foto-baru/<tempat>/. Salin foto dulu lalu jalankan lagi.');
  process.exit(0);
}
if (flag('--dry')) {
  console.log(`(dry-run) ${changed} tempat akan diperbarui.`);
  process.exit(0);
}
master.version = (master.version || 0) + 1;
master.updatedAt = new Date().toISOString().slice(0, 10);
writeFileSync(masterPath, JSON.stringify(master, null, 2) + '\n');
console.log(`\nSelesai: ${changed} tempat diperbarui, master.json versi ${master.version}.`);
execFileSync('node', [root + 'scripts/validate-master.mjs'], { stdio: 'inherit' });
console.log('Langkah berikutnya: git add -A && git commit -m "foto tempat" && git push');
