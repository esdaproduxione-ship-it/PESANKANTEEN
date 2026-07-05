# Panduan Deployment — Kantin DWP (GitHub & Vercel)

## 1. Push ke GitHub

```bash
cd kantin-dwp
git init
git add .
git commit -m "Initial commit: Kantin DWP"
git branch -M main
git remote add origin https://github.com/esda-project/kantin-dwp.git
git push -u origin main
```

> ⚠️ **Penting**: pastikan `.env` **tidak ikut ter-commit** (sudah dikecualikan lewat `.gitignore`). Kredensial Supabase hanya boleh disetel lewat Environment Variables di Vercel, bukan disimpan dalam kode.

## 2. Deploy ke Vercel

### Opsi A — Lewat Dashboard Vercel
1. Buka [vercel.com/new](https://vercel.com/new)
2. Import repository `esda-project/kantin-dwp` dari GitHub
3. Framework preset: pilih **Vite**
4. Build command: `npm run build` (otomatis terdeteksi)
5. Output directory: `dist` (otomatis terdeteksi)
6. Pada bagian **Environment Variables**, tambahkan:
   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | URL project Supabase Anda |
   | `VITE_SUPABASE_ANON_KEY` | anon public key Supabase Anda |
7. Klik **Deploy**

### Opsi B — Lewat Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```
Saat diminta, masukkan environment variable yang sama seperti di atas.

## 3. Konfigurasi Supabase untuk Domain Produksi

1. Di Supabase Dashboard → **Authentication → URL Configuration**
2. Tambahkan domain Vercel Anda (mis. `https://kantin-dwp.vercel.app`) ke **Site URL** dan **Redirect URLs**

## 4. Verifikasi Pasca-Deploy

- [ ] Katalog pembeli tampil tanpa error di domain produksi
- [ ] Login penjual & admin berhasil terhubung ke Supabase (bukan mode demo)
- [ ] Notifikasi suara aktif setelah tombol "Aktifkan Notifikasi Suara" ditekan
- [ ] Checkout guest berhasil membuat order baru (cek tabel `orders` di Supabase)
- [ ] Cetak nota (thermal & PDF) berfungsi

## 5. Update Aplikasi di Kemudian Hari

Vercel otomatis re-deploy setiap kali ada `git push` ke branch `main`:

```bash
git add .
git commit -m "Update: <deskripsi perubahan>"
git push
```

Jika ada perubahan skema database, buat file migration baru di `supabase/migrations/` dan jalankan manual lewat SQL Editor Supabase (Supabase tidak menjalankan migration otomatis dari repo tanpa Supabase CLI/CI terpisah).
