-- Jaga-jaga: pastikan tabel roles bisa di-select oleh anon & authenticated.
-- Tabel ini tidak diaktifkan RLS-nya (memang publik/statis, cuma daftar
-- nama role), tapi kalau project ini pernah di-migrasi dengan cara yang
-- tidak lewat default privilege Supabase, grant eksplisit ini memastikan
-- select selalu berhasil.
grant select on roles to anon, authenticated;
grant select on product_categories to anon, authenticated;

-- Refresh schema cache PostgREST, supaya perubahan relasi/kolom terbaru
-- (migrasi 0004-0006) langsung dikenali tanpa perlu restart manual project.
notify pgrst, 'reload schema';
