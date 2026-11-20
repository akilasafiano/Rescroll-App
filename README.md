# ReScroll — Scroll with Intention

ReScroll adalah aplikasi web (React + Vite) dengan API lokal (Express) yang mengalihkan kebiasaan *doomscrolling* menjadi kebiasaan membaca singkat yang bermakna. Pengguna mendapat XP, streak, dan badge dari check-in harian serta bacaan yang diselesaikan.

## Fitur utama
- Login dengan email dan kata sandi, atau dengan Google (Google Identity Services).
- Onboarding dan personalisasi topik.
- **Home**: check-in harian dengan streak, security check (cek kebocoran email), dan 4 artikel harian.
- **Library**: 11 e-book dan 11 artikel. E-book mencakup bacaan klasik domain publik, ringkasan buku, dan bacaan edukasi buatan tim.
- **Pencarian** artikel dan e-book (judul, topik, dan isi bacaan) dengan saran langsung saat mengetik.
- **Navigasi samping**: rail penuh tinggi halaman. Menekan Home, Library, atau Profil membuka panel menu di sampingnya.
- **Reader**: tombol selesai aktif setelah timer habis dan halaman digulir sampai akhir.
- **Profil**: edit akun, dashboard reflektif, pengaturan dan privasi, serta dialog konfirmasi saat keluar akun.
- Bisa dipasang sebagai PWA dan dikemas menjadi APK Android dengan Capacitor.

## Kebutuhan
- Node.js 20 LTS (disarankan) dan npm
- Android Studio dan Android SDK, hanya jika ingin membuat APK

## Menjalankan di komputer sendiri
1. Ekstrak atau clone project ini.
2. Di folder utama, jalankan `npm run setup` (menginstal dependensi root, `client`, dan `server`).
3. Salin `server/.env.example` menjadi `server/.env`, lalu isi `GOOGLE_CLIENT_ID`.
4. Salin `client/.env.example` menjadi `client/.env`, lalu isi `VITE_GOOGLE_CLIENT_ID` dengan nilai yang **sama** dengan langkah 3.
5. Jalankan `npm run dev`, lalu buka `http://localhost:5173`.

Data pengguna disimpan di `server/data/db.json` (dibuat otomatis saat pertama kali dijalankan), dan foto profil di `client/public/uploads/`. Ini penyimpanan untuk pengembangan lokal, bukan untuk produksi. Lakukan backup bila datanya penting.

## Mengelola konten
Semua artikel dan e-book ada di `server/data/contents.json`. Setiap item memiliki kolom berikut:

| Kolom | Fungsi |
|---|---|
| `id`, `type` | Pengenal dan jenis (`article` atau `ebook`) |
| `title`, `sub`, `topic` | Judul, subjudul, dan topik |
| `xp`, `min` | XP yang didapat dan estimasi menit baca |
| `secs` | (opsional) durasi timer baca dalam detik, menimpa nilai bawaan |
| `cover`, `coverFull` | Gambar sampul. `coverFull: true` berarti gambar sudah memuat judul, sehingga tidak ditimpa teks |
| `body` | Daftar paragraf. Awali dengan `## ` untuk membuat judul bab |

Gambar sampul disimpan di `client/public/assets/`. Restart server setelah mengubah `contents.json`.

## Pengaturan Google Sign-In
1. Buka https://console.cloud.google.com/ lalu pilih atau buat project.
2. Atur OAuth consent screen (Google Auth Platform). Saat mode Testing, tambahkan akun Google-mu sebagai test user.
3. Di Clients / Credentials, buat OAuth Client ID bertipe **Web application**.
4. Pada Authorized JavaScript origins, tambahkan `http://localhost:5173`, dan nanti domain HTTPS asli saat sudah di-deploy. Untuk alur popup Google Identity Services, redirect URI tidak diperlukan.
5. Salin Client ID (berakhiran `.apps.googleusercontent.com`) ke `client/.env` dan `server/.env` seperti langkah di atas.
6. Restart `npm run dev` setelah menyimpan kedua file. Jangan menaruh Client Secret di variabel `VITE_` atau file frontend mana pun.

Frontend meminta ID token dari Google, lalu backend memeriksa token itu dan mencocokkan audience-nya dengan `GOOGLE_CLIENT_ID`. Client ID hanyalah pengenal aplikasi, bukan kata sandi.

## Integrasi sosial
Halaman Social Library sengaja dikeluarkan dari alur utama. Integrasi TikTok dan Instagram masih tahap berikutnya dan membutuhkan aplikasi developer, konfigurasi OAuth, izin, dan (bila diwajibkan) peninjauan platform. Pengambilan data profil publik secara paksa (*scraping*) bukan integrasi yang tersedia.

## Memasang sebagai PWA
Setelah aplikasi berjalan lewat localhost atau HTTPS, pilih opsi *Install App* di browser. Manifest dan service worker sudah disediakan.

## Membuat APK Android dengan Capacitor
1. Jalankan `npm run setup` dan `npm run build`.
2. Jalankan `npm run android:add` sekali untuk membuat project Android.
3. Jalankan `npm run android:sync` setiap kali selesai build web.
4. Jalankan `npm run android:open`, lalu di Android Studio pilih Build > Build Bundle(s) / APK(s) > Build APK(s).

Sebelum membuat APK, isi `VITE_API_BASE_URL` di `client/.env` dengan alamat backend yang sudah di-deploy dan berakhiran `/api`. APK tidak bisa memakai proxy Vite di laptopmu. Deploy API Express beserta database dan folder uploads-nya lebih dulu. Project Android tidak disertakan di repo ini karena Android Studio dan SDK harus terpasang di komputer yang membuatnya.

## Catatan penting
- Database JSON dan uploads lokal hanya cocok untuk prototipe kelas. Untuk produksi, gunakan database terkelola, penyimpanan objek privat, HTTPS, pembatasan laju permintaan (*rate limiting*), sesi server yang aman, perlindungan CSRF bila relevan, dan alur OAuth produksi.
- Jangan meng-commit file `.env`, database pengguna, atau uploads pribadi. `.gitignore` sudah mengaturnya.
- Teks e-book klasik (A Tale of Two Cities, Memoirs of Sherlock Holmes, Little Women) berasal dari karya domain publik. Untuk buku yang masih dilindungi hak cipta, aplikasi hanya menampilkan ringkasan yang ditulis tim, bukan teks bukunya.
