import { fetchOrderForGuest } from '../../orderService.js';
import { ORDER_STATUS_LABEL } from '../../../config/constants.js';
import { formatRupiah, formatDateTime } from '../../../core/utils/formatters.js';
import { downloadReceiptPdf } from '../../shared/receipt/receiptPdf.js';

export async function renderOrderTrackingView(container, { orderId, whatsapp }) {
  container.innerHTML = `<div class="empty-state">Memuat status pesanan...</div>`;

  try {
    const order = await fetchOrderForGuest(orderId, whatsapp);
    if (!order) {
      container.innerHTML = `<div class="empty-state">Pesanan tidak ditemukan. Periksa kembali nomor order dan WhatsApp.</div>`;
      return;
    }

    const statusSteps = ['pending', 'processing', 'ready', 'completed'];
    const currentIndex = statusSteps.indexOf(order.status);

    container.innerHTML = `
      <div class="container" style="max-width: 480px; padding: var(--space-5) var(--space-5) var(--space-8);">
        <a href="#/" class="btn btn--ghost" style="margin-bottom: var(--space-4);">&larr; Kembali ke Katalog</a>
        <h1 class="display" style="margin-bottom: var(--space-5);">Status Pesanan</h1>

        <div class="ticket ticket--new">
          <div class="ticket__header">
            <span class="order-number">${order.order_number}</span>
            <span class="badge badge--has-orders">${ORDER_STATUS_LABEL[order.status] || order.status}</span>
          </div>
          <p style="font-size: var(--fs-sm); color: var(--color-text-muted);">${formatDateTime(order.created_at)}</p>
          <div class="ticket__perforation"></div>

          <div style="display:flex; justify-content:space-between; margin-bottom: var(--space-4);">
            ${statusSteps.map((step, i) => `
              <div style="text-align:center; flex:1; opacity:${i <= currentIndex ? 1 : 0.35};">
                <div style="font-size:20px;">${i <= currentIndex ? '✅' : '⭕'}</div>
                <div style="font-size:var(--fs-xs); margin-top:4px;">${ORDER_STATUS_LABEL[step]}</div>
              </div>
            `).join('')}
          </div>

          <div class="ticket__perforation"></div>
          <div style="display:flex; justify-content:space-between; font-weight:700;">
            <span>Total</span><span class="price">${formatRupiah(order.total_amount)}</span>
          </div>
        </div>

        <button class="btn btn--secondary btn--block" style="margin-top: var(--space-4);" id="btn-download-receipt">
          📄 Unduh Nota (PDF)
        </button>
      </div>
    `;

    container.querySelector('#btn-download-receipt')?.addEventListener('click', () => {
      downloadReceiptPdf(order, order.seller, 'a4');
    });
  } catch (err) {
    container.innerHTML = `<div class="empty-state">Gagal memuat status pesanan: ${err.message}</div>`;
  }
}
