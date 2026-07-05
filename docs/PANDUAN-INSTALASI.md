# Panduan Instalasi — Kantin DWP

## 1. Prasyarat

* Node.js versi 18 atau lebih baru
* Akun [Supabase](https://supabase.com) (gratis untuk mulai)
* Git

## 2. Kloning & Instal Dependensi

```bash
git clone https://github.com/esda-project/kantin-dwp.git
cd kantin-dwp
npm install
```

## 3. Membuat Project Supabase

1. Buka [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**
2. Catat **Project URL** dan **anon public key** dari menu **Project Settings → API**
3. Buka **SQL Editor** di dashboard Supabase, lalu jalankan berkas migration secara berurutan:
   - `supabase/migrations/0001_init_schema.sql`
   - `supabase/migrations/0002_rpc_guest_checkout.sql`
4. Jalankan seed data:
   - `supabase/seed.sql`
5. Buat akun admin pertama:
   - Buka **Authentication → Users → Add User**, isi email & password
   - Salin `User UID` yang muncul
   - Di SQL Editor, jalankan:
     ```sql
     insert into users (id, role_id, full_name, email)
     values (
       '<tempel_user_uid_di_sini>',
       (select id from roles where name = 'admin'),
       'Nama Admin',
       'admin@kantindwp.local'
     );
     ```

## 4. Konfigurasi Environment Variable

```bash
cp .env.example .env
```

Isi `.env` dengan nilai dari Supabase:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Tanpa mengisi `.env`**, aplikasi tetap bisa dijalankan dalam **mode demo** memakai data contoh (mock data) — cocok untuk melihat tampilan UI tanpa setup backend.

## 5. Siapkan Berkas Suara Notifikasi

Ganti berkas placeholder di `public/sounds/new-order-alert.mp3` dengan file suara notifikasi asli (lihat instruksi di `public/sounds/README-GANTI-FILE-SUARA.txt`).

## 6. Menjalankan Secara Lokal

```bash
npm run dev
```

Buka `http://localhost:5173` di browser.

- Halaman utama (`/`) → Katalog pembeli (publik, tanpa login)
- `/#/login/seller` → Login/registrasi penjual
- `/#/login/admin` → Login admin

## 7. Build untuk Produksi

```bash
npm run build
```

Hasil build ada di folder `dist/`, siap di-deploy ke Vercel (lihat `docs/PANDUAN-DEPLOYMENT.md`).
