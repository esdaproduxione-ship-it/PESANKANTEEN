-- Supabase Auth secara native berbasis EMAIL (bukan username). Supaya user
-- bisa login pakai username, kita simpan username di public.users, lalu
-- sediakan RPC publik yang HANYA mengembalikan email dari sebuah username
-- (tidak membocorkan data lain), dipanggil sebelum signInWithPassword().

alter table users
    add column if not exists username text unique;

-- Isi username awal dari bagian sebelum '@' di email, supaya akun lama
-- tetap bisa login (bisa diganti user nanti). Tambahkan angka acak kalau
-- terjadi duplikat.
update users
set username = lower(split_part(email, '@', 1)) || '_' || substr(id::text, 1, 4)
where username is null;

alter table users
    alter column username set not null;

create or replace function rpc_get_email_by_username(p_username text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select email from users where lower(username) = lower(p_username) limit 1;
$$;

grant execute on function rpc_get_email_by_username(text) to anon, authenticated;

-- Trigger auto-buat profil (migrasi 0005) juga perlu diisi username default,
-- supaya user yang dibuat lewat Supabase Dashboard tetap punya username.
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, role_id, full_name, email, username)
  values (
    new.id,
    (select id from roles where name = 'seller'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    lower(split_part(new.email, '@', 1)) || '_' || substr(new.id::text, 1, 4)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
