import { supabase, isSupabaseConfigured } from '../config/supabaseClient.js';
import { mockOrders } from '../config/mockData.js';

/**
 * Checkout tanpa akun (guest). Memecah item keranjang per penjual menjadi
 * beberapa order (order splitting), sesuai Business Process Tahap 1.
 */
export async function submitGuestCheckout({ customer, groupedItems, paymentMethodId }) {
  if (!isSupabaseConfigured) {
    console.info('[orderService] Mode demo — checkout disimulasikan.', { customer, groupedItems });
    return Object.keys(groupedItems).map((sellerId) => ({
      order_number: 'DEMO-' + Date.now(),
      seller_id: sellerId,
      status: 'pending',
    }));
  }

  // Menggunakan RPC transaksional (all-or-nothing) — lihat
  // supabase/migrations/0002_rpc_guest_checkout.sql — agar insert
  // customer + orders + order_items + payments per penjual atomik.
  const groupedPayload = Object.entries(groupedItems).map(([sellerId, items]) => ({
    seller_id: sellerId,
    items: items.map((i) => ({ product_id: i.product_id, name: i.name, price: i.price, qty: i.qty })),
  }));

  const { data, error } = await supabase.rpc('rpc_submit_guest_checkout', {
    p_customer_name: customer.name,
    p_customer_whatsapp: customer.whatsapp,
    p_customer_address: customer.address,
    p_notes: customer.notes || '',
    p_payment_method_id: paymentMethodId,
    p_grouped_items: groupedPayload,
  });
  if (error) throw error;
  return data.orders;
}

export async function fetchOrderForGuest(orderId, whatsapp) {
  if (!isSupabaseConfigured) {
    return mockOrders.find((o) => o.id === orderId) || mockOrders[0];
  }
  const { data, error } = await supabase.rpc('rpc_get_order_for_guest', {
    p_order_id: orderId,
    p_whatsapp: whatsapp,
  });
  if (error) throw error;
  return data;
}

export async function fetchSellerOrders(sellerId) {
  if (!isSupabaseConfigured) {
    return mockOrders.filter((o) => o.seller_id === sellerId);
  }
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), customers(name, whatsapp)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId, status) {
  if (!isSupabaseConfigured) {
    console.info('[orderService] Mode demo — status diubah (simulasi).', orderId, status);
    return { id: orderId, status };
  }
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', orderId).select().single();
  if (error) throw error;
  return data;
}

export async function fetchAllOrdersForAdmin() {
  if (!isSupabaseConfigured) return mockOrders;
  const { data, error } = await supabase
    .from('orders')
    .select('*, sellers(business_name), customers(name, whatsapp)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
