-- 1) Pastikan role 'superadmin' benar-benar ada:
select id, name from roles;

-- 2) Cek role_id admin_kanteen sekarang, dan namanya:
select u.id, u.username, u.role_id, r.name as role_name
from users u
left join roles r on r.id = u.role_id
where u.username = 'admin_kanteen';

-- 3) Kalau hasil no.2 menunjukkan role_name BUKAN 'superadmin',
--    jalankan ini untuk memperbaikinya (aman dijalankan berkali-kali):
insert into roles (name) values ('superadmin') on conflict (name) do nothing;

update users
set role_id = (select id from roles where name = 'superadmin')
where username = 'admin_kanteen';

-- 4) Verifikasi ulang:
select u.username, r.name as role_name
from users u
left join roles r on r.id = u.role_id
where u.username = 'admin_kanteen';
