import { supabase, isSupabaseConfigured } from '../../../config/supabaseClient.js';
import { playAlertLoop, showBrowserNotification } from './audioAlert.js';
import { showToast } from '../../shared/toast/toast.js';

let activeChannel = null;

/**
 * Berlangganan channel notifikasi khusus milik penjual (di-scope per seller_id
 * agar penjual lain tidak menerima notifikasi ini). Dipanggil saat dashboard
 * penjual dibuka, dan WAJIB di-unsubscribe saat keluar halaman untuk mencegah
 * alert suara dobel (lihat unsubscribeSellerNotifications).
 */
export function subscribeSellerNotifications(sellerId, { onNewOrder } = {}) {
  if (!isSupabaseConfigured) {
    console.info('[realtimeSubscriber] Mode demo — simulasi notifikasi tidak otomatis tersambung ke Supabase Realtime.');
    return () => {};
  }

  if (activeChannel) {
    unsubscribeSellerNotifications();
  }

  activeChannel = supabase
    .channel(`notifications:seller_id=eq.${sellerId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `seller_id=eq.${sellerId}`,
      },
      (payload) => {
        const notification = payload.new;
        playAlertLoop();
        showToast('🔔 Pesanan baru masuk!');
        showBrowserNotification('Pesanan Baru — Kantin DWP', 'Ada pesanan baru yang menunggu konfirmasi.');
        onNewOrder?.(notification);
      }
    )
    .subscribe();

  return unsubscribeSellerNotifications;
}

export function unsubscribeSellerNotifications() {
  if (activeChannel) {
    supabase.removeChannel(activeChannel);
    activeChannel = null;
  }
}

/**
 * Berlangganan perubahan status order (untuk memperbarui indikator kondisi
 * penjual — busy/has_orders/no_orders — secara realtime, lihat Tahap 2 view v_seller_status).
 */
export function subscribeSellerOrdersChanges(sellerId, onChange) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`orders:seller_id=eq.${sellerId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `seller_id=eq.${sellerId}` },
      onChange
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
