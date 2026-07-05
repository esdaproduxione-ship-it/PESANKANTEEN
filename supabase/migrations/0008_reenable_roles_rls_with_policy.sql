-- Memperbaiki peringatan linter Supabase "RLS Disabled in Public" untuk
-- tabel roles. Sebelumnya RLS dimatikan total sebagai perbaikan darurat;
-- sekarang kita aktifkan lagi TAPI langsung sertakan policy publik-baca
-- (tabel ini memang cuma daftar nama role, tidak sensitif), supaya tidak
-- mengulang bug "RLS aktif tanpa policy = akses tertutup total".

alter table roles enable row level security;

drop policy if exists roles_select_public on roles;
create policy roles_select_public on roles for select
    using (true);
