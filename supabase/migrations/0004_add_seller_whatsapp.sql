-- Menambahkan kolom whatsapp pada tabel sellers untuk fitur Profil Toko
-- (kontak yang ditampilkan/dipakai penjual, terpisah dari whatsapp pembeli di tabel customers).

alter table sellers
    add column if not exists whatsapp text;

comment on column sellers.whatsapp is 'Nomor WhatsApp kontak toko, diisi/diubah lewat halaman Profil Toko penjual.';
