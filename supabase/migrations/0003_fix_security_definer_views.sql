-- ============================================================
-- KANTIN DWP - FIX: Security Definer View Warning
-- Supabase Database Linter (0010_security_definer_view)
--
-- Secara default, view PostgreSQL berjalan dengan hak akses pemilik
-- view (mirip SECURITY DEFINER), bukan hak akses user yang men-query.
-- Ini berbahaya karena RLS pada tabel dasar bisa "terlewati" —
-- misalnya v_seller_status/v_admin_dashboard_summary yang meng-agregasi
-- tabel `orders` bisa saja menampilkan data lintas-penjual walau RLS
-- pada tabel `orders` seharusnya membatasi per seller_id.
--
-- Solusi: set `security_invoker = true` agar view berjalan dengan
-- hak akses (dan RLS) milik user yang men-query, bukan pemilik view.
-- Tersedia sejak PostgreSQL 15 (didukung penuh di Supabase).
-- ============================================================

alter view public.v_seller_status set (security_invoker = true);
alter view public.v_admin_dashboard_summary set (security_invoker = true);
alter view public.v_top_products set (security_invoker = true);
alter view public.v_seller_unread_notifications set (security_invoker = true);

-- ------------------------------------------------------------
-- Catatan penting terkait perubahan perilaku setelah fix ini:
-- ------------------------------------------------------------
-- Dengan security_invoker = true, RLS pada tabel `orders`, `sellers`,
-- dll akan DITEGAKKAN sesuai user yang memanggil view. Ini berarti:
--
-- 1. v_admin_dashboard_summary & v_top_products
--    Hanya admin yang boleh melihat ringkasan LINTAS SEMUA penjual.
--    Perlu policy SELECT eksplisit di tabel dasar (orders, sellers,
--    products) yang mengizinkan role admin membaca semua baris —
--    ini SUDAH tersedia lewat policy `orders_select_seller_admin`,
--    `sellers_select_public`, dst. di 0001_init_schema.sql (memakai
--    fn_is_admin()). Pastikan hanya user dengan role admin yang
--    memanggil kedua view ini dari sisi client.
--
-- 2. v_seller_status
--    View ini perlu bisa dibaca PUBLIK (termasuk pembeli tanpa akun/
--    anon) agar badge kondisi penjual tampil di katalog. Tabel dasar
--    `sellers` sudah punya policy publik untuk seller yang approved,
--    tapi tabel `orders` TIDAK publik (hanya admin & seller pemilik).
--    Akibatnya, setelah security_invoker=true, kolom `active_orders`
--    akan bernilai 0/kosong untuk pemanggil anon karena RLS memblokir
--    akses ke baris `orders` orang lain — condition_status bisa salah
--    tampil sebagai 'no_orders' padahal sebenarnya ramai.
--
--    Untuk itu, kondisi penjual TIDAK dihitung langsung dari view ini
--    oleh anon, melainkan lewat RPC security definer khusus yang HANYA
--    mengembalikan agregat (count), bukan data order mentah — lihat
--    fungsi `rpc_get_public_seller_status` di bawah.
--
-- 3. v_seller_unread_notifications
--    Tetap aman diakses oleh penjual pemilik karena tabel
--    `notifications` sudah punya RLS `notifications_select_own`.
-- ============================================================

-- RPC pengganti akses publik ke kondisi penjual (aman untuk anon,
-- hanya mengekspos agregat/status, tidak mengekspos data order mentah).
create or replace function rpc_get_public_seller_status()
returns table (
    seller_id uuid,
    business_name text,
    is_open boolean,
    condition_status text
) as $$
    select
        s.id,
        s.business_name,
        s.is_open,
        case
            when not s.is_open then 'closed'
            when count(o.id) filter (
                where o.status in ('pending','processing')
                and o.created_at >= now() - (
                    (select value from settings where key = 'busy_threshold_minutes')::int * interval '1 minute'
                )
            ) >= (select value from settings where key = 'busy_threshold_orders')::int
            then 'busy'
            when count(o.id) filter (where o.status in ('pending','processing')) > 0
            then 'has_orders'
            else 'no_orders'
        end as condition_status
    from sellers s
    left join orders o on o.seller_id = s.id
    where s.verification_status = 'approved'
    group by s.id, s.business_name, s.is_open;
$$ language sql security definer stable;

comment on function rpc_get_public_seller_status is
  'Dipakai khusus untuk katalog pembeli (anon). SECURITY DEFINER di sini '
  'disengaja & aman karena hanya mengembalikan agregat status, bukan data '
  'order mentah — berbeda dengan view yang mengekspos kolom apa adanya.';

grant execute on function rpc_get_public_seller_status to anon;
