-- Sebelumnya, akun admin pertama harus dibuat dengan cara:
--   1. Buat user di Supabase Auth (dashboard)
--   2. Copy-paste UUID user tsb secara manual ke tabel public.users
-- Langkah manual ini rawan salah ketik/salah copy, sehingga id di auth.users
-- berbeda dengan id di public.users -> login gagal (profil tidak ditemukan).
--
-- Migrasi ini menambahkan trigger yang OTOMATIS membuat baris public.users
-- setiap kali ada user baru di auth.users (baik lewat dashboard, maupun
-- lewat signUp aplikasi). Defaultnya role 'seller' (hak akses paling rendah);
-- untuk menaikkan jadi admin, cukup UPDATE berdasarkan EMAIL (bukan UUID),
-- lihat contoh di akhir file ini.

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, role_id, full_name, email)
  values (
    new.id,
    (select id from roles where name = 'seller'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ============================================================
-- Cara membuat/menaikkan akun ADMIN sekarang (tanpa copy-paste UUID):
--
-- 1. Buat user di Supabase Dashboard -> Authentication -> Users -> Add user
--    (isi email & password saja, trigger di atas otomatis membuat baris
--    public.users dengan role 'seller').
-- 2. Jalankan query ini untuk menaikkan role-nya jadi admin, cukup pakai EMAIL:
--
--    update users set role_id = (select id from roles where name = 'admin')
--    where email = 'admin@kantindwp.local';
-- ============================================================
