-- Jalankan di Supabase SQL Editor. Ini akan:
-- 1) Memastikan email admin@kantindwp.local berstatus TERKONFIRMASI
-- 2) Memaksa password-nya jadi "pesankanteen@2026" secara pasti

update auth.users
set
  encrypted_password = crypt('pesankanteen@2026', gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where email = 'admin@kantindwp.local';

-- Cek hasilnya (pastikan email_confirmed_at TIDAK null):
select id, email, email_confirmed_at
from auth.users
where email = 'admin@kantindwp.local';
