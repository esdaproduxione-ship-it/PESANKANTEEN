-- 1) Lihat semua role yang benar-benar ada di tabel roles:
select id, name from roles;

-- 2) Bandingkan dengan role_id yang tersimpan di akun ini
--    (harusnya salah satu id dari hasil query no.1 di atas):
select id, email, username, role_id, full_name
from users
where id = '21dc5fd6-727a-4b5a-9234-f7220bc74122';

-- 3) Perbaiki: paksa akun ini jadi role admin yang benar
--    (dijalankan terlepas dari apa penyebab sebelumnya):
update users
set role_id = (select id from roles where name = 'admin')
where id = '21dc5fd6-727a-4b5a-9234-f7220bc74122';

-- 4) Verifikasi hasilnya — role_name HARUS tampil 'admin', bukan null:
select id, email, username, role_id,
  (select name from roles where id = users.role_id) as role_name
from users
where id = '21dc5fd6-727a-4b5a-9234-f7220bc74122';
