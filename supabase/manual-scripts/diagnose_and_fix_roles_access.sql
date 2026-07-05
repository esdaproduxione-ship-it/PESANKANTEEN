-- 1) Cek apakah RLS AKTIF di tabel roles (dan tabel lain yang relevan).
--    Kalau rowsecurity = true TAPI tidak ada policy sama sekali,
--    SEMUA akses baca akan diblokir diam-diam untuk role authenticated.
select relname as table_name, relrowsecurity as rls_aktif
from pg_class
where relname in ('roles', 'users', 'sellers', 'product_categories')
  and relnamespace = 'public'::regnamespace;

-- 2) Cek policy yang ada di tabel roles (kalau RLS aktif tapi hasil ini KOSONG,
--    itu penyebabnya: RLS aktif tanpa policy = akses tertutup total)
select policyname, cmd, qual
from pg_policies
where tablename = 'roles';

-- 3) Cek grant privilege langsung di tabel roles untuk role anon/authenticated
select grantee, privilege_type
from information_schema.role_table_grants
where table_name = 'roles';

-- 4) PERBAIKAN LANGSUNG — aman dijalankan meskipun tidak yakin akar masalahnya:
--    matikan RLS di tabel roles (memang seharusnya publik, cuma daftar nama role)
--    dan pastikan grant select ada.
alter table roles disable row level security;
grant select on roles to anon, authenticated;
notify pgrst, 'reload schema';
