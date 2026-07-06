-- ============================================================
-- KANTIN DWP - Statistik Pengunjung Harian
-- Menambahkan pencatatan kunjungan aplikasi (jumlah pengunjung
-- harian + rekapitulasinya) untuk ditampilkan di panel Admin/Superadmin.
--
-- Pendekatan:
-- 1. Tabel visitor_logs menyimpan satu baris per kunjungan (per hari
--    per visitor_key). visitor_key adalah id acak yang disimpan di
--    localStorage browser pengunjung (lihat src/core/utils/visitorTracker.js),
--    JADI TIDAK MENYIMPAN DATA PRIBADI (bukan nama/email/nomor HP).
-- 2. Insert dilakukan lewat RPC security definer (rpc_log_visit),
--    mengikuti pola yang sama seperti rpc_submit_guest_checkout,
--    supaya pengunjung anonim (belum login) tetap bisa mencatat
--    kunjungan tanpa perlu policy insert langsung ke tabel.
-- 3. View v_visitor_daily_recap meng-agregasi jumlah kunjungan &
--    jumlah pengunjung unik per hari, hanya bisa dibaca oleh admin/superadmin.
-- ============================================================

create table visitor_logs (
    id uuid primary key default gen_random_uuid(),
    visitor_key text not null,
    visit_date date not null default current_date,
    path text,
    user_agent text,
    created_at timestamptz default now()
);

create index idx_visitor_logs_date on visitor_logs(visit_date);
create index idx_visitor_logs_date_key on visitor_logs(visit_date, visitor_key);

alter table visitor_logs enable row level security;

-- Hanya admin/superadmin yang boleh membaca data statistik pengunjung.
-- Tidak ada policy insert/update/delete langsung — semua insert lewat
-- fungsi rpc_log_visit (security definer) di bawah.
create policy visitor_logs_select_admin on visitor_logs for select
    using (fn_is_admin());

-- ---- RPC pencatatan kunjungan ----
-- p_visitor_key: id acak yang dibuat & disimpan di localStorage browser.
-- Dibatasi maksimal 1 baris tercatat per visitor_key per hari (dicek di
-- sisi client sebelum memanggil RPC ini), tapi kita tetap jaga di sini
-- dengan idx unik longgar (tidak unique constraint keras, supaya kalau
-- ada race condition tidak melempar error ke user).
create or replace function rpc_log_visit(
    p_visitor_key text,
    p_path text default null,
    p_user_agent text default null
)
returns void as $$
begin
    if p_visitor_key is null or length(trim(p_visitor_key)) = 0 then
        return;
    end if;

    -- Cegah duplikasi: kalau visitor_key ini sudah tercatat hari ini, skip.
    if exists (
        select 1 from visitor_logs
        where visitor_key = p_visitor_key
          and visit_date = current_date
    ) then
        return;
    end if;

    insert into visitor_logs (visitor_key, path, user_agent)
    values (p_visitor_key, p_path, p_user_agent);
end;
$$ language plpgsql security definer;

grant execute on function rpc_log_visit(text, text, text) to anon, authenticated;

-- ---- View rekap harian ----
create or replace view v_visitor_daily_recap as
select
    visit_date,
    count(*) as total_kunjungan,
    count(distinct visitor_key) as pengunjung_unik
from visitor_logs
group by visit_date
order by visit_date desc;

-- security_invoker supaya RLS tabel visitor_logs tetap berlaku sesuai
-- user yang query (hanya admin/superadmin yang bisa lihat isinya),
-- konsisten dengan v_admin_dashboard_summary dkk.
alter view public.v_visitor_daily_recap set (security_invoker = true);

-- ---- View ringkasan (kartu statistik) ----
create or replace view v_visitor_summary as
select
    (select count(*) from visitor_logs where visit_date = current_date) as pengunjung_hari_ini,
    (select count(distinct visitor_key) from visitor_logs where visit_date = current_date) as pengunjung_unik_hari_ini,
    (select count(*) from visitor_logs where visit_date >= current_date - interval '6 days') as total_7_hari,
    (select count(*) from visitor_logs where date_trunc('month', visit_date) = date_trunc('month', current_date)) as total_bulan_ini,
    (select count(*) from visitor_logs) as total_sepanjang_waktu;

alter view public.v_visitor_summary set (security_invoker = true);
