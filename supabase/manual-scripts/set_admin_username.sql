-- ============================================================
-- LANGKAH 1 — Lihat dulu email akun admin yang SUDAH kamu buat di
-- Supabase Auth (Authentication > Users). Jalankan ini untuk melihat
-- daftarnya:
-- ============================================================
select id, email, created_at from auth.users order by created_at desc;


-- ============================================================
-- LANGKAH 2 — Copy salah satu EMAIL dari hasil di atas (yang memang
-- kamu niatkan sebagai akun admin), lalu GANTI 'EMAIL_ADMIN_DI_SINI'
-- di bawah dengan email tersebut. Jalankan query ini:
-- ============================================================
update users
set
  username = 'adminkanteen',
  role_id = (select id from roles where name = 'admin')
where email = 'EMAIL_ADMIN_DI_SINI';

-- Cek hasilnya:
select id, email, username, role_id,
  (select name from roles where id = users.role_id) as role_name
from users
where username = 'adminkanteen';
-- Pastikan baris muncul dengan role_name = 'admin'.


-- ============================================================
-- LANGKAH 3 — Pastikan PASSWORD di Supabase Auth memang
-- "pesankanteen@2026". Kalau kamu tidak yakin passwordnya persis itu:
-- Buka Authentication > Users > klik akun admin tsb > "Reset Password"
-- atau opsi "..." > set password baru secara manual ke password yang
-- kamu mau pakai. (Password TIDAK disimpan di tabel users, hanya di
-- Supabase Auth, jadi tidak bisa dicek/diubah lewat SQL biasa.)


-- ============================================================
-- KALAU BELUM ADA AKUN ADMIN SAMA SEKALI di Auth (hasil Langkah 1 kosong
-- atau tidak ada yang cocok), buat dulu:
-- Authentication > Users > Add user
--   Email: admin@kantindwp.local (atau email apapun)
--   Password: pesankanteen@2026
-- Baru jalankan Langkah 2 di atas dengan email itu.
-- ============================================================
