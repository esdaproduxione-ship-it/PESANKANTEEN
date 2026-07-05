import { formatRupiah, formatDateTime } from '../../../core/utils/formatters.js';

/**
 * Menghasilkan markup nota dari data order (bukan file statis — selalu
 * digenerate ulang dari data terbaru di database, sesuai spesifikasi).
 */
export function renderThermalReceipt(order, seller) {
  const itemsRows = order.items.map((item) => `
    <div class="receipt-thermal__row">
      <span>${item.qty}x ${escapeHtml(item.name)}</span>
      <span>${formatRupiah(item.price * item.qty)}</span>
    </div>
  `).join('');

  return `
    <div class="receipt-thermal">
      <div class="receipt-thermal__center">
        <strong>${escapeHtml(seller?.business_name || 'Kantin DWP')}</strong><br/>
        Nota Pesanan
      </div>
      <div class="receipt-thermal__divider"></div>
      <div>No: ${order.order_number}</div>
      <div>${formatDateTime(order.created_at)}</div>
      <div class="receipt-thermal__divider"></div>
      ${itemsRows}
      <div class="receipt-thermal__divider"></div>
      <div class="receipt-thermal__row receipt-thermal__total">
        <span>TOTAL</span>
        <span>${formatRupiah(order.total_amount)}</span>
      </div>
      <div class="receipt-thermal__divider"></div>
      <div class="receipt-thermal__center">
        Terima kasih telah berbelanja!<br/>
        ${escapeHtml(order.customer_name)} • ${escapeHtml(order.customer_whatsapp)}
      </div>
    </div>
  `;
}

export function renderA4Receipt(order, seller) {
  const itemsRows = order.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${item.qty}</td>
      <td>${formatRupiah(item.price)}</td>
      <td>${formatRupiah(item.price * item.qty)}</td>
    </tr>
  `).join('');

  return `
    <div class="receipt-a4">
      <div class="receipt-a4__header">
        <div>
          <h2>${escapeHtml(seller?.business_name || 'Kantin DWP')}</h2>
          <p>Nota Pesanan Resmi</p>
        </div>
        <div style="text-align:right">
          <div><strong>No. Order:</strong> ${order.order_number}</div>
          <div>${formatDateTime(order.created_at)}</div>
        </div>
      </div>
      <p><strong>Pembeli:</strong> ${escapeHtml(order.customer_name)} (${escapeHtml(order.customer_whatsapp)})</p>
      <table>
        <thead><tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <h3 style="text-align:right; margin-top:16px;">Total: ${formatRupiah(order.total_amount)}</h3>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
