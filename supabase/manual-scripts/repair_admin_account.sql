-- ============================================================
-- SCRIPT PERBAIKAN SEKALI JALAN — jalankan manual di SQL Editor,
-- BUKAN bagian dari migrasi otomatis (karena email admin berbeda-beda
-- tiap instalasi). Hapus/abaikan file ini setelah dipakai.
-- ============================================================

-- 1) Lihat dulu akun yang benar-benar ada di Supabase Auth:
select id, email, created_at from auth.users order by created_at desc;

-- 2) Lihat isi tabel public.users saat ini (untuk bandingkan):
select id, email, role_id, full_name from public.users order by created_at desc;

-- 3) Setelah tahu email admin yang benar dari hasil query no.1, jalankan salah satu:

-- Kalau baris untuk email itu SUDAH ADA di public.users (id-nya saja yang beda),
-- cara termudah: hapus baris lama yang salah, lalu biarkan trigger baru
-- (migrasi 0005) yang membuatkan ulang saat user login berikutnya —
-- ATAU langsung upsert manual pakai id yang benar dari auth.users:
insert into users (id, role_id, full_name, email)
select
  au.id,
  (select id from roles where name = 'admin'),
  coalesce(au.raw_user_meta_data->>'full_name', 'Admin'),
  au.email
from auth.users au
where au.email = 'GANTI_DENGAN_EMAIL_ADMIN_YANG_BENAR'
on conflict (id) do update set
  role_id = excluded.role_id,
  email = excluded.email;

-- Kalau ternyata ada baris LAMA di public.users dengan id yang salah
-- (tidak match auth.users manapun), bersihkan baris yatim tersebut:
delete from users
where id not in (select id from auth.users);
