import { fetchSellerOrders, updateOrderStatus } from '../../orderService.js';
import { subscribeSellerNotifications, subscribeSellerOrdersChanges } from '../notifications/realtimeSubscriber.js';
import {
  unlockAudio, isAudioUnlocked, isMuted, setMuted, stopAlertLoop,
  requestBrowserNotificationPermission,
} from '../notifications/audioAlert.js';
import { renderSellerStatusBadge } from '../../../components/Badge.js';
import { ORDER_STATUS_LABEL } from '../../../config/constants.js';
import { formatRupiah, timeAgo } from '../../../core/utils/formatters.js';
import { printReceipt } from '../../shared/receipt/receiptPrint.js';
import { showToast } from '../../shared/toast/toast.js';

export async function renderSellerDashboard(container, seller) {
  let orders = await fetchSellerOrders(seller.id);
  let unsubscribeNotif = null;
  let unsubscribeOrders = null;

  function activeConditionStatus() {
    const active = orders.filter((o) => ['pending', 'processing'].includes(o.status));
    if (!seller.is_open) return 'closed';
    if (active.length >= 5) return 'busy';
    if (active.length > 0) return 'has_orders';
    return 'no_orders';
  }

  function draw() {
    const condition = activeConditionStatus();
    const pendingOrders = orders.filter((o) => o.status === 'pending');
    const otherOrders = orders.filter((o) => o.status !== 'pending');

    container.innerHTML = `
      <div class="container" style="padding: var(--space-5) 0 var(--space-8);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-5);">
          <div>
            <h1 class="display" style="font-size: var(--fs-2xl);">${seller.business_name}</h1>
            ${renderSellerStatusBadge(condition)}
          </div>
          <div style="display:flex; gap: var(--space-2); align-items:center;">
            ${!isAudioUnlocked() ? `<button class="btn btn--primary" id="btn-unlock-audio">🔊 Aktifkan Notifikasi Suara</button>` : ''}
            <button class="btn btn--secondary btn--sm" id="btn-toggle-mute">${isMuted() ? '🔇 Bisukan' : '🔊 Suara Aktif'}</button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: var(--space-4); margin-bottom: var(--space-6);">
          <div class="metric-card"><div class="metric-card__label">Pesanan Menunggu</div><div class="metric-card__value">${pendingOrders.length}</div></div>
          <div class="metric-card"><div class="metric-card__label">Total Pesanan Hari Ini</div><div class="metric-card__value">${orders.length}</div></div>
          <div class="metric-card"><div class="metric-card__label">Status Toko</div><div class="metric-card__value" style="font-size:var(--fs-lg);">${seller.is_open ? 'Buka' : 'Tutup'}</div></div>
        </div>

        <h2 style="margin-bottom: var(--space-3);">🎫 Pesanan Masuk (Perlu Aksi)</h2>
        <div style="display:flex; flex-direction:column; gap: var(--space-4); margin-bottom: var(--space-6);">
          ${pendingOrders.length ? pendingOrders.map(renderTicket).join('') : `<div class="empty-state">Tidak ada pesanan menunggu. Tenang dulu ☕</div>`}
        </div>

        <h2 style="margin-bottom: var(--space-3);">Riwayat Pesanan Lain</h2>
        <table class="data-table">
          <thead><tr><th>No. Order</th><th>Pembeli</th><th>Status</th><th>Total</th><th>Aksi</th></tr></thead>
          <tbody>
            ${otherOrders.map((o) => `
              <tr>
                <td class="mono">${o.order_number}</td>
                <td>${o.customer_name || o.customers?.name || '-'}</td>
                <td>${ORDER_STATUS_LABEL[o.status]}</td>
                <td class="price">${formatRupiah(o.total_amount)}</td>
                <td><button class="btn btn--ghost btn--sm" data-print="${o.id}">🖨️ Nota</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    bindEvents();
  }

  function renderTicket(order) {
    return `
      <div class="ticket ticket--new" data-order-id="${order.id}">
        <div class="ticket__header">
          <span class="order-number">${order.order_number}</span>
          <span style="font-size:var(--fs-xs); color:var(--color-text-muted);">${timeAgo(order.created_at)}</span>
        </div>
        <div>${(order.items || order.order_items || []).map((i) => `${i.qty}x ${i.name || i.product_name_snapshot}`).join(', ')}</div>
        <div class="ticket__perforation"></div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="price" style="font-weight:700;">${formatRupiah(order.total_amount)}</span>
          <div style="display:flex; gap: var(--space-2);">
            <button class="btn btn--secondary btn--sm" data-ack="${order.id}">Tandai Dilihat</button>
            <button class="btn btn--primary btn--sm" data-accept="${order.id}">Terima & Proses</button>
          </div>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    container.querySelector('#btn-unlock-audio')?.addEventListener('click', async () => {
      const ok = await unlockAudio();
      showToast(ok ? 'Notifikasi suara diaktifkan' : 'Gagal mengaktifkan suara, coba lagi');
      await requestBrowserNotificationPermission();
      draw();
    });

    container.querySelector('#btn-toggle-mute')?.addEventListener('click', () => {
      setMuted(!isMuted());
      draw();
    });

    container.querySelectorAll('[data-ack]').forEach((btn) => {
      btn.addEventListener('click', () => {
        stopAlertLoop();
        showToast('Notifikasi ditandai sudah dilihat');
      });
    });

    container.querySelectorAll('[data-accept]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        stopAlertLoop();
        await updateOrderStatus(btn.dataset.accept, 'processing');
        orders = orders.map((o) => o.id === btn.dataset.accept ? { ...o, status: 'processing' } : o);
        showToast('Pesanan diterima & diproses');
        draw();
      });
    });

    container.querySelectorAll('[data-print]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const order = orders.find((o) => o.id === btn.dataset.print);
        printReceipt(order, seller, 'thermal58');
      });
    });
  }

  unsubscribeNotif = subscribeSellerNotifications(seller.id, {
    onNewOrder: async () => {
      orders = await fetchSellerOrders(seller.id);
      draw();
    },
  });

  unsubscribeOrders = subscribeSellerOrdersChanges(seller.id, async () => {
    orders = await fetchSellerOrders(seller.id);
    draw();
  });

  draw();

  // Dikembalikan agar router bisa unsubscribe saat berpindah halaman
  // (mencegah alert suara dobel — lihat catatan Tahap 3).
  return () => {
    unsubscribeNotif?.();
    unsubscribeOrders?.();
    stopAlertLoop();
  };
}
