# 🍽️ Kantin DWP

Aplikasi Manajemen Kantin DWP — menghubungkan Admin, Penjual, dan Pembeli dalam satu ekosistem digital untuk transaksi, pemasaran produk, dan pelaporan kantin.

## Fitur Utama

- 🛒 Katalog & checkout tanpa perlu akun untuk pembeli
- 🔔 Notifikasi suara realtime untuk pesanan masuk (penjual)
- 🟢🟡🔴⚪ Indikator kondisi penjual (ramai/ada pesanan/tidak ada pesanan/tutup) realtime
- 🧾 Cetak/unduh nota pesanan (PDF, thermal 58/80mm, A4)
- 📊 Dashboard admin & penjual dengan statistik dan grafik
- 📑 Ekspor laporan ke PDF dan Excel
- 🔐 Row Level Security (RLS) penuh di setiap tabel
- 📱 Siap dikembangkan menjadi Progressive Web App (PWA)

## Teknologi

HTML5 · CSS3 · JavaScript ES6+ (Vanilla, modular) · Supabase (Auth, PostgreSQL, Realtime, Storage) · Vite · Vercel

## Mulai Cepat

```bash
npm install
cp .env.example .env   # isi kredensial Supabase Anda
npm run dev
```

Tanpa mengisi `.env`, aplikasi otomatis berjalan dalam **mode demo** dengan data contoh.

## Dokumentasi

| Dokumen | Deskripsi |
|---|---|
| [`docs/PANDUAN-INSTALASI.md`](docs/PANDUAN-INSTALASI.md) | Setup lokal & Supabase dari nol |
| [`docs/PANDUAN-DEPLOYMENT.md`](docs/PANDUAN-DEPLOYMENT.md) | Deploy ke GitHub & Vercel |
| [`docs/PANDUAN-PENGGUNA.md`](docs/PANDUAN-PENGGUNA.md) | Panduan pemakaian untuk pembeli/penjual/admin |

## Struktur Project

Lihat penjelasan lengkap arsitektur & struktur folder di dokumen Tahap 3 pengembangan (arsitektur sistem).

## Status Pengembangan

Versi ini adalah **MVP siap-deploy** yang mengimplementasikan seluruh alur inti (auth, katalog, keranjang multi-penjual, checkout tanpa akun, notifikasi suara realtime, indikator kondisi penjual, cetak nota, dashboard admin/penjual, ekspor laporan). Fitur lanjutan seperti promo/diskon otomatis di UI, audit log viewer, dan pengaturan aplikasi lengkap dapat dikembangkan lanjut mengikuti pola arsitektur yang sudah ditetapkan.

## Lisensi

Internal — Pemerintah Kota Batu / Bagian Perekonomian dan Sumber Daya Alam.
