import { fetchAllOrdersForAdmin } from '../../orderService.js';
import { ORDER_STATUS_LABEL } from '../../../config/constants.js';
import { formatRupiah, formatDateTime } from '../../../core/utils/formatters.js';

export async function renderAdminOrdersView(container) {
  const orders = await fetchAllOrdersForAdmin();

  container.innerHTML = `
    <div class="container" style="padding: var(--space-5) 0 var(--space-8);">
      <h1 class="display" style="margin-bottom: var(--space-5);">Monitoring Transaksi & Pesanan</h1>
      <table class="data-table">
        <thead><tr><th>No. Order</th><th>Penjual</th><th>Pembeli</th><th>Status</th><th>Total</th><th>Waktu</th></tr></thead>
        <tbody>
          ${orders.map((o) => `
            <tr>
              <td class="mono">${o.order_number}</td>
              <td>${o.sellers?.business_name || o.seller_id}</td>
              <td>${o.customers?.name || o.customer_name || '-'}</td>
              <td>${ORDER_STATUS_LABEL[o.status] || o.status}</td>
              <td class="price">${formatRupiah(o.total_amount)}</td>
              <td>${formatDateTime(o.created_at)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
