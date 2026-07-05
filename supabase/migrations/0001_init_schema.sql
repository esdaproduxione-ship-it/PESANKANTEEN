-- ============================================================
-- KANTIN DWP - MIGRATION SQL (digabung dari Tahap 2)
-- ============================================================

-- ---- Block 1 ----
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create type verification_status as enum ('pending', 'approved', 'rejected');
create type order_status as enum ('pending', 'processing', 'ready', 'completed', 'cancelled');
create type payment_status as enum ('unpaid', 'pending_confirmation', 'paid', 'failed');
create type notification_type as enum ('new_order', 'order_cancelled', 'system');
create type promotion_type as enum ('percentage', 'fixed_amount');

-- ---- Block 2 ----
-- ROLES
create table roles (
    id uuid primary key default gen_random_uuid(),
    name text unique not null check (name in ('admin', 'seller')),
    description text
);

-- USERS (extends auth.users via trigger)
create table users (
    id uuid primary key references auth.users(id) on delete cascade,
    role_id uuid not null references roles(id),
    full_name text not null,
    email text unique not null,
    phone text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_users_role on users(role_id);

-- PRODUCT CATEGORIES
create table product_categories (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    icon text,
    created_at timestamptz default now()
);

-- PAYMENT METHODS
create table payment_methods (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    type text not null check (type in ('qris', 'bank_transfer', 'cod')),
    is_active boolean default true
);

-- SETTINGS (key-value config, termasuk extra_fee_minimum & threshold "ramai")
create table settings (
    id uuid primary key default gen_random_uuid(),
    key text unique not null,
    value text not null,
    description text,
    updated_at timestamptz default now()
);

insert into settings (key, value, description) values
    ('min_extra_fee', '1000', 'Biaya minimum tambahan per produk (Rp)'),
    ('busy_threshold_orders', '5', 'Jumlah order aktif dalam window untuk status Sedang Ramai'),
    ('busy_threshold_minutes', '15', 'Rentang waktu (menit) perhitungan status Sedang Ramai');

-- ---- Block 3 ----
-- SELLERS
create table sellers (
    id uuid primary key default gen_random_uuid(),
    user_id uuid unique not null references users(id) on delete cascade,
    business_name text not null,
    logo_url text,
    photo_url text,
    description text,
    address text,
    qris_image_url text,
    bank_account text,
    is_open boolean default false,
    verification_status verification_status default 'pending',
    rejection_note text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_sellers_verification on sellers(verification_status);

-- PRODUCTS
create table products (
    id uuid primary key default gen_random_uuid(),
    seller_id uuid not null references sellers(id) on delete cascade,
    category_id uuid references product_categories(id),
    name text not null,
    description text,
    image_url text,
    base_price numeric(12,2) not null check (base_price >= 0),
    extra_fee numeric(12,2) not null default 1000 check (extra_fee >= 1000),
    sell_price numeric(12,2) generated always as (base_price + extra_fee) stored,
    stock int not null default 0 check (stock >= 0),
    is_available boolean generated always as (stock > 0) stored,
    is_favorite boolean default false,
    is_new boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_products_seller on products(seller_id);
create index idx_products_category on products(category_id);

-- PROMOTIONS
create table promotions (
    id uuid primary key default gen_random_uuid(),
    seller_id uuid not null references sellers(id) on delete cascade,
    product_id uuid references products(id) on delete cascade,
    type promotion_type not null,
    value numeric(12,2) not null check (value > 0),
    start_date timestamptz not null,
    end_date timestamptz not null,
    is_active boolean default true,
    created_at timestamptz default now(),
    constraint chk_promo_date check (end_date > start_date)
);
create index idx_promotions_product on promotions(product_id);

-- ---- Block 4 ----
-- CUSTOMERS (guest, tanpa auth)
create table customers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    whatsapp text not null,
    address text not null,
    created_at timestamptz default now()
);
create index idx_customers_whatsapp on customers(whatsapp);

-- ORDERS (1 order = 1 penjual, hasil order-splitting saat checkout)
create table orders (
    id uuid primary key default gen_random_uuid(),
    order_number text unique not null,
    customer_id uuid not null references customers(id),
    seller_id uuid not null references sellers(id),
    status order_status not null default 'pending',
    subtotal numeric(12,2) not null default 0,
    extra_fee_total numeric(12,2) not null default 0,
    total_amount numeric(12,2) generated always as (subtotal + extra_fee_total) stored,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index idx_orders_seller on orders(seller_id);
create index idx_orders_customer on orders(customer_id);
create index idx_orders_status on orders(status);
create index idx_orders_created_at on orders(created_at);

-- ORDER_ITEMS (snapshot nama & harga agar histori tidak berubah walau produk diedit)
create table order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete cascade,
    product_id uuid references products(id),
    product_name_snapshot text not null,
    price_snapshot numeric(12,2) not null,
    qty int not null check (qty > 0),
    subtotal numeric(12,2) generated always as (price_snapshot * qty) stored
);
create index idx_order_items_order on order_items(order_id);

-- PAYMENTS
create table payments (
    id uuid primary key default gen_random_uuid(),
    order_id uuid unique not null references orders(id) on delete cascade,
    payment_method_id uuid not null references payment_methods(id),
    status payment_status not null default 'unpaid',
    proof_url text,
    amount numeric(12,2) not null,
    paid_at timestamptz,
    created_at timestamptz default now()
);
create index idx_payments_status on payments(status);

-- NOTIFICATIONS (untuk trigger alert suara realtime ke penjual)
create table notifications (
    id uuid primary key default gen_random_uuid(),
    seller_id uuid not null references sellers(id) on delete cascade,
    order_id uuid references orders(id) on delete cascade,
    type notification_type not null default 'new_order',
    is_read boolean default false,
    created_at timestamptz default now()
);
create index idx_notifications_seller_unread on notifications(seller_id, is_read);

-- ---- Block 5 ----
-- AUDIT_LOGS
create table audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id),
    action text not null,
    entity text not null,
    entity_id uuid,
    metadata jsonb,
    created_at timestamptz default now()
);
create index idx_audit_logs_entity on audit_logs(entity, entity_id);

-- TRANSACTION_LOGS (jejak perubahan status order untuk transparansi & nota)
create table transaction_logs (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete cascade,
    event text not null,
    metadata jsonb,
    created_at timestamptz default now()
);
create index idx_transaction_logs_order on transaction_logs(order_id);

-- ---- Block 6 ----
create or replace function fn_check_max_admin()
returns trigger as $$
begin
    if (select count(*) from users u
        join roles r on r.id = u.role_id
        where r.name = 'admin' and u.is_active = true) >= 5
       and new.role_id = (select id from roles where name = 'admin')
    then
        raise exception 'Maksimal 5 akun admin sudah tercapai';
    end if;
    return new;
end;
$$ language plpgsql security definer;

create trigger trg_check_max_admin
before insert on users
for each row execute function fn_check_max_admin();

-- ---- Block 7 ----
create or replace function fn_generate_order_number()
returns trigger as $$
begin
    new.order_number := 'DWP-' || to_char(now(), 'YYYYMMDD') || '-' ||
                         upper(substr(replace(new.id::text, '-', ''), 1, 6));
    return new;
end;
$$ language plpgsql;

create trigger trg_generate_order_number
before insert on orders
for each row execute function fn_generate_order_number();

-- ---- Block 8 ----
create or replace function fn_notify_new_order()
returns trigger as $$
begin
    insert into notifications (seller_id, order_id, type)
    values (new.seller_id, new.id, 'new_order');

    insert into transaction_logs (order_id, event, metadata)
    values (new.id, 'order_created', jsonb_build_object('status', new.status));

    return new;
end;
$$ language plpgsql;

create trigger trg_notify_new_order
after insert on orders
for each row execute function fn_notify_new_order();

-- ---- Block 9 ----
create or replace function fn_log_order_status_change()
returns trigger as $$
begin
    if old.status is distinct from new.status then
        insert into transaction_logs (order_id, event, metadata)
        values (new.id, 'status_changed',
                jsonb_build_object('from', old.status, 'to', new.status));
    end if;
    new.updated_at := now();
    return new;
end;
$$ language plpgsql;

create trigger trg_log_order_status_change
before update on orders
for each row execute function fn_log_order_status_change();

-- ---- Block 10 ----
create or replace function fn_audit_products()
returns trigger as $$
begin
    insert into audit_logs (user_id, action, entity, entity_id, metadata)
    values (
        auth.uid(),
        tg_op,
        'products',
        coalesce(new.id, old.id),
        jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
    );
    return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger trg_audit_products
after insert or update or delete on products
for each row execute function fn_audit_products();

-- ---- Block 11 ----
create or replace view v_seller_status as
select
    s.id as seller_id,
    s.business_name,
    s.is_open,
    count(o.id) filter (
        where o.status in ('pending', 'processing')
    ) as active_orders,
    count(o.id) filter (
        where o.status in ('pending', 'processing')
        and o.created_at >= now() - (
            (select value from settings where key = 'busy_threshold_minutes')::int * interval '1 minute'
        )
    ) as recent_active_orders,
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
group by s.id, s.business_name, s.is_open;

-- ---- Block 12 ----
create or replace view v_admin_dashboard_summary as
select
    (select count(*) from sellers where verification_status = 'approved') as total_sellers,
    (select count(*) from products where is_available) as total_active_products,
    (select count(*) from orders) as total_orders,
    (select coalesce(sum(total_amount),0) from orders where status = 'completed') as total_omzet,
    (select count(*) from orders where created_at::date = current_date) as orders_today,
    (select count(*) from orders where date_trunc('month', created_at) = date_trunc('month', now())) as orders_this_month;

-- ---- Block 13 ----
create or replace view v_top_products as
select
    p.id as product_id,
    p.name,
    s.business_name as seller_name,
    sum(oi.qty) as total_sold,
    sum(oi.subtotal) as total_revenue
from order_items oi
join products p on p.id = oi.product_id
join sellers s on s.id = p.seller_id
join orders o on o.id = oi.order_id
where o.status = 'completed'
group by p.id, p.name, s.business_name
order by total_sold desc;

-- ---- Block 14 ----
create or replace view v_seller_unread_notifications as
select seller_id, count(*) as unread_count
from notifications
where is_read = false
group by seller_id;

-- ---- Block 15 ----
alter table users enable row level security;
alter table sellers enable row level security;
alter table products enable row level security;
alter table promotions enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table notifications enable row level security;
alter table customers enable row level security;
alter table audit_logs enable row level security;
alter table transaction_logs enable row level security;
alter table settings enable row level security;

-- Helper: cek role user saat ini
create or replace function fn_is_admin()
returns boolean as $$
    select exists (
        select 1 from users u join roles r on r.id = u.role_id
        where u.id = auth.uid() and r.name = 'admin'
    );
$$ language sql security definer stable;

create or replace function fn_current_seller_id()
returns uuid as $$
    select id from sellers where user_id = auth.uid();
$$ language sql security definer stable;

-- USERS: admin lihat semua, user lihat diri sendiri
create policy users_select on users for select
    using (fn_is_admin() or id = auth.uid());
create policy users_update_self on users for update
    using (id = auth.uid());

-- SELLERS: publik boleh lihat yang approved, penjual kelola milik sendiri, admin kelola semua
create policy sellers_select_public on sellers for select
    using (verification_status = 'approved' or fn_is_admin() or user_id = auth.uid());
create policy sellers_update_own on sellers for update
    using (user_id = auth.uid() or fn_is_admin());
create policy sellers_insert_own on sellers for insert
    with check (user_id = auth.uid());

-- PRODUCTS: publik lihat produk toko approved, penjual CRUD milik sendiri, admin CRUD semua
create policy products_select_public on products for select
    using (
        exists (select 1 from sellers s where s.id = seller_id and s.verification_status = 'approved')
        or fn_is_admin()
        or seller_id = fn_current_seller_id()
    );
create policy products_modify_own on products for insert with check (seller_id = fn_current_seller_id() or fn_is_admin());
create policy products_update_own on products for update using (seller_id = fn_current_seller_id() or fn_is_admin());
create policy products_delete_own on products for delete using (seller_id = fn_current_seller_id() or fn_is_admin());

-- ORDERS: penjual lihat order miliknya, admin lihat semua, pembeli tanpa auth diakses via RPC security definer (bukan langsung table)
create policy orders_select_seller_admin on orders for select
    using (seller_id = fn_current_seller_id() or fn_is_admin());
create policy orders_update_seller_admin on orders for update
    using (seller_id = fn_current_seller_id() or fn_is_admin());

-- ORDER_ITEMS: ikut aturan order induk
create policy order_items_select on order_items for select
    using (
        exists (
            select 1 from orders o
            where o.id = order_id
            and (o.seller_id = fn_current_seller_id() or fn_is_admin())
        )
    );

-- PAYMENTS: sama seperti orders
create policy payments_select on payments for select
    using (
        exists (
            select 1 from orders o
            where o.id = order_id
            and (o.seller_id = fn_current_seller_id() or fn_is_admin())
        )
    );

-- NOTIFICATIONS: hanya penjual pemilik & admin
create policy notifications_select_own on notifications for select
    using (seller_id = fn_current_seller_id() or fn_is_admin());
create policy notifications_update_own on notifications for update
    using (seller_id = fn_current_seller_id() or fn_is_admin());

-- AUDIT_LOGS & TRANSACTION_LOGS: hanya admin yang boleh membaca
create policy audit_logs_admin_only on audit_logs for select using (fn_is_admin());
create policy transaction_logs_admin_only on transaction_logs for select using (fn_is_admin());

-- SETTINGS: publik boleh baca (untuk kalkulasi harga di client), hanya admin yang boleh ubah
create policy settings_select_public on settings for select using (true);
create policy settings_update_admin on settings for update using (fn_is_admin());

-- ---- Block 16 ----
-- RPC: Ambil detail order untuk pembeli (validasi order_id + whatsapp)
create or replace function rpc_get_order_for_guest(p_order_id uuid, p_whatsapp text)
returns json as $$
    select json_build_object(
        'order', to_jsonb(o),
        'items', (select json_agg(oi) from order_items oi where oi.order_id = o.id),
        'payment', (select to_jsonb(p) from payments p where p.order_id = o.id),
        'seller', (select json_build_object('business_name', s.business_name, 'logo_url', s.logo_url)
                   from sellers s where s.id = o.seller_id)
    )
    from orders o
    join customers c on c.id = o.customer_id
    where o.id = p_order_id and c.whatsapp = p_whatsapp;
$$ language sql security definer stable;

