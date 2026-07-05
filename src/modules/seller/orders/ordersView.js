import { fetchSellerOrders } from '../../orderService.js';
import { formatRupiah, timeAgo } from '../../../core/utils/formatters.js';
import { ORDER_STATUS_LABEL } from '../../../config/constants.js';
import { printReceipt } from '../../shared/receipt/receiptPrint.js';

export async function renderSellerOrdersView(container, seller) {
  const orders = await fetchSellerOrders(seller.id);
  let filter = 'all';

  function draw() {
    const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

    container.innerHTML = `
      <div class="container" style="padding: var(--space-5) 0 var(--space-8);">
        <h1 class="display" style="font-size: var(--fs-2xl); margin-bottom: var(--space-4);">Semua Pesanan</h1>

        <div style="display:flex; gap: var(--space-2); margin-bottom: var(--space-4); flex-wrap:wrap;">
          ${['all', 'pending', 'processing', 'completed', 'cancelled'].map((s) => `
            <button class="btn ${filter === s ? 'btn--primary' : 'btn--ghost'} btn--sm" data-filter="${s}">
              ${s === 'all' ? 'Semua' : ORDER_STATUS_LABEL[s] || s}
            </button>
          `).join('')}
        </div>

        ${filtered.length === 0 ? `
          <div class="empty-state">Belum ada pesanan${filter !== 'all' ? ' dengan status ini' : ''}.</div>
        ` : `
          <table class="data-table">
            <thead><tr><th>No. Order</th><th>Waktu</th><th>Pembeli</th><th>Status</th><th>Total</th><th>Aksi</th></tr></thead>
            <tbody>
              ${filtered.map((o) => `
                <tr>
                  <td class="mono">${o.order_number}</td>
                  <td>${timeAgo(o.created_at)}</td>
                  <td>${o.customer_name || o.customers?.name || '-'}</td>
                  <td>${ORDER_STATUS_LABEL[o.status] || o.status}</td>
                  <td class="price">${formatRupiah(o.total_amount)}</td>
                  <td><button class="btn btn--ghost btn--sm" data-print="${o.id}">🖨️ Nota</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;

    container.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => { filter = btn.dataset.filter; draw(); });
    });
    container.querySelectorAll('[data-print]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const order = orders.find((o) => o.id === btn.dataset.print);
        printReceipt(order, seller, 'thermal58');
      });
    });
  }

  draw();
}
