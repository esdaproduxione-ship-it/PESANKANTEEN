-- Jam operasional per hari, dipakai untuk menentukan status buka/tutup
-- otomatis berdasarkan jadwal (di luar toggle manual is_open yang sudah ada).
-- Format: { "mon": {"open":"09:00","close":"15:00","closed":false}, ... }
alter table sellers
    add column if not exists operating_hours jsonb default '{
      "mon": {"open": "09:00", "close": "15:00", "closed": false},
      "tue": {"open": "09:00", "close": "15:00", "closed": false},
      "wed": {"open": "09:00", "close": "15:00", "closed": false},
      "thu": {"open": "09:00", "close": "15:00", "closed": false},
      "fri": {"open": "09:00", "close": "14:00", "closed": false},
      "sat": {"open": "09:00", "close": "14:00", "closed": true},
      "sun": {"open": "09:00", "close": "14:00", "closed": true}
    }'::jsonb;

-- ============================================================
-- Storage bucket untuk foto profil/logo toko penjual.
-- Publik-baca (supaya tampil di katalog pembeli tanpa perlu login),
-- tapi upload/update/delete hanya untuk pemilik toko sendiri.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('seller-logos', 'seller-logos', true)
on conflict (id) do nothing;

drop policy if exists "seller_logos_public_read" on storage.objects;
create policy "seller_logos_public_read" on storage.objects
    for select using (bucket_id = 'seller-logos');

drop policy if exists "seller_logos_owner_write" on storage.objects;
create policy "seller_logos_owner_write" on storage.objects
    for insert with check (
        bucket_id = 'seller-logos' and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "seller_logos_owner_update" on storage.objects;
create policy "seller_logos_owner_update" on storage.objects
    for update using (
        bucket_id = 'seller-logos' and (storage.foldername(name))[1] = auth.uid()::text
    );

drop policy if exists "seller_logos_owner_delete" on storage.objects;
create policy "seller_logos_owner_delete" on storage.objects
    for delete using (
        bucket_id = 'seller-logos' and (storage.foldername(name))[1] = auth.uid()::text
    );

-- Catatan: file diunggah dengan path "<user_id>/logo.jpg" dari sisi aplikasi,
-- sehingga policy di atas (mencocokkan folder pertama = auth.uid()) berhasil
-- membatasi setiap penjual hanya bisa upload/ubah/hapus logo miliknya sendiri.
