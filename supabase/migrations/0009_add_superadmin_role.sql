-- Menambahkan role 'superadmin' — tingkat di atas admin biasa.
-- superadmin otomatis mewarisi semua akses admin (lihat fn_is_admin di bawah),
-- ditambah kemampuan khusus: membuat akun penjual baru & reset password
-- penjual (lewat Edge Function, karena butuh service role key).

-- Tabel roles awalnya cuma mengizinkan name in ('admin','seller') lewat
-- CHECK constraint. Longgarkan dulu supaya 'superadmin' bisa dimasukkan.
alter table roles drop constraint if exists roles_name_check;
alter table roles add constraint roles_name_check check (name in ('admin', 'seller', 'superadmin'));

insert into roles (name) values ('superadmin') on conflict (name) do nothing;

create or replace function fn_is_admin()
returns boolean as $$
    select exists (
        select 1 from users u join roles r on r.id = u.role_id
        where u.id = auth.uid() and r.name in ('admin', 'superadmin')
    );
$$ language sql security definer stable;

create or replace function fn_is_superadmin()
returns boolean as $$
    select exists (
        select 1 from users u join roles r on r.id = u.role_id
        where u.id = auth.uid() and r.name = 'superadmin'
    );
$$ language sql security definer stable;

-- ============================================================
-- Cara menaikkan akun admin yang sudah ada jadi superadmin:
--
--   update users set role_id = (select id from roles where name = 'superadmin')
--   where username = 'admin_kanteen';
-- ============================================================
