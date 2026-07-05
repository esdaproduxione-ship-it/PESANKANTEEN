-- ============================================================
-- KANTIN DWP - SEED DATA AWAL
-- Jalankan setelah migration 0001_init_schema.sql
-- ============================================================

insert into roles (name, description) values
    ('admin', 'Administrator/pengelola kantin'),
    ('seller', 'Penjual/tenant kantin')
on conflict (name) do nothing;

insert into payment_methods (name, type, is_active) values
    ('QRIS', 'qris', true),
    ('Transfer Bank BCA', 'bank_transfer', true),
    ('Transfer Bank BRI', 'bank_transfer', true),
    ('Bayar di Tempat (COD)', 'cod', true);

insert into product_categories (name, icon) values
    ('Makanan Berat', '🍛'),
    ('Lauk & Sayur', '🥗'),
    ('Camilan', '🍟'),
    ('Minuman', '🥤'),
    ('Dessert', '🍮');

-- Catatan: akun admin pertama tetap harus dibuat lewat Supabase Auth
-- (signUp / dashboard Supabase), lalu di-link manual ke tabel `users`
-- dengan role_id = (select id from roles where name = 'admin').
-- Contoh setelah membuat user di Supabase Auth:
--
-- insert into users (id, role_id, full_name, email)
-- values (
--   '<auth_user_id_dari_supabase_auth>',
--   (select id from roles where name = 'admin'),
--   'Nama Admin',
--   'admin@kantindwp.local'
-- );
