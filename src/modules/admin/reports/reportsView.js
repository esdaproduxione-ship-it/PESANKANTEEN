import { fetchAllOrdersForAdmin } from '../../orderService.js';
import { formatRupiah, formatDate } from '../../../core/utils/formatters.js';
import { showToast } from '../../shared/toast/toast.js';

export async function renderAdminReportsView(container) {
  const orders = await fetchAllOrdersForAdmin();

  container.innerHTML = `
    <div class="container" style="padding: var(--space-5) 0 var(--space-8);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-5);">
        <h1 class="display">Rekap Laporan</h1>
        <div style="display:flex; gap: var(--space-2);">
          <button class="btn btn--secondary" id="btn-export-excel">📊 Ekspor Excel</button>
          <button class="btn btn--primary" id="btn-export-pdf">📄 Ekspor PDF</button>
        </div>
      </div>

      <table class="data-table">
        <thead><tr><th>No. Order</th><th>Penjual</th><th>Tanggal</th><th>Total</th></tr></thead>
        <tbody>
          ${orders.map((o) => `
            <tr>
              <td class="mono">${o.order_number}</td>
              <td>${o.sellers?.business_name || o.seller_id}</td>
              <td>${formatDate(o.created_at)}</td>
              <td class="price">${formatRupiah(o.total_amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelector('#btn-export-excel').addEventListener('click', async () => {
    const XLSX = await import('xlsx');
    const rows = orders.map((o) => ({
      'No. Order': o.order_number,
      Penjual: o.sellers?.business_name || o.seller_id,
      Tanggal: formatDate(o.created_at),
      Total: o.total_amount,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Transaksi');
    XLSX.writeFile(workbook, 'Rekap-Transaksi-Kantin-DWP.xlsx');
    showToast('Laporan Excel diunduh');
  });

  container.querySelector('#btn-export-pdf').addEventListener('click', async () => {
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.text('Rekap Transaksi — Kantin DWP', 14, 16);
    doc.autoTable({
      startY: 22,
      head: [['No. Order', 'Penjual', 'Tanggal', 'Total']],
      body: orders.map((o) => [o.order_number, o.sellers?.business_name || o.seller_id, formatDate(o.created_at), formatRupiah(o.total_amount)]),
    });
    doc.save('Rekap-Transaksi-Kantin-DWP.pdf');
    showToast('Laporan PDF diunduh');
  });
}
