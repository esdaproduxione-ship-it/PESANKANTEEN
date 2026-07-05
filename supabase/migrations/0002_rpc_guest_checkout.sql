-- ============================================================
-- KANTIN DWP - RPC checkout tamu (atomik, transaksional)
-- Menggantikan pendekatan multi-insert dari client (lihat catatan
-- di src/modules/orderService.js) dengan satu panggilan RPC agar
-- customer + orders + order_items + payments per penjual tercipta
-- dalam satu transaksi database (all-or-nothing).
-- ============================================================

create or replace function rpc_submit_guest_checkout(
    p_customer_name text,
    p_customer_whatsapp text,
    p_customer_address text,
    p_notes text,
    p_payment_method_id uuid,
    p_grouped_items jsonb -- format: [{ "seller_id": "...", "items": [{ "product_id":"...", "name":"...", "price":..., "qty":... }] }]
)
returns jsonb as $$
declare
    v_customer_id uuid;
    v_order_id uuid;
    v_seller jsonb;
    v_item jsonb;
    v_subtotal numeric;
    v_created_orders jsonb := '[]'::jsonb;
begin
    insert into customers (name, whatsapp, address)
    values (p_customer_name, p_customer_whatsapp, p_customer_address)
    returning id into v_customer_id;

    for v_seller in select * from jsonb_array_elements(p_grouped_items)
    loop
        v_subtotal := 0;
        for v_item in select * from jsonb_array_elements(v_seller->'items')
        loop
            v_subtotal := v_subtotal + ((v_item->>'price')::numeric * (v_item->>'qty')::int);
        end loop;

        insert into orders (customer_id, seller_id, subtotal, notes)
        values (v_customer_id, (v_seller->>'seller_id')::uuid, v_subtotal, p_notes)
        returning id into v_order_id;

        insert into order_items (order_id, product_id, product_name_snapshot, price_snapshot, qty)
        select
            v_order_id,
            (item->>'product_id')::uuid,
            item->>'name',
            (item->>'price')::numeric,
            (item->>'qty')::int
        from jsonb_array_elements(v_seller->'items') as item;

        insert into payments (order_id, payment_method_id, amount, status)
        values (v_order_id, p_payment_method_id, v_subtotal, 'unpaid');

        v_created_orders := v_created_orders || jsonb_build_object('order_id', v_order_id);
    end loop;

    return jsonb_build_object('customer_id', v_customer_id, 'orders', v_created_orders);
exception
    when others then
        raise exception 'Checkout gagal: %', sqlerrm;
end;
$$ language plpgsql security definer;

-- Izinkan role anon (guest) memanggil RPC ini
grant execute on function rpc_submit_guest_checkout to anon;
grant execute on function rpc_get_order_for_guest to anon;
