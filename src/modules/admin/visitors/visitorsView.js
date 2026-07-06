import { fetchVisitorDailyRecap, fetchVisitorSummary } from '../../visitorService.js';
import { formatDate } from '../../../core/utils/formatters.js';
import { showToast } from '../../shared/toast/toast.js';

export async function renderAdminVisitorsView(container) {
  const [summary, recap] = await Promise.all([
    fetchVisitorSummary(),
    fetchVisitorDailyRecap(30),
  ]);

  // recap datang dari view terurut visit_date desc (hari ini paling atas).
  // Buat urutan ascending untuk grafik (kiri = lama, kanan = baru).
  const recapAsc = [...recap].reverse();

  container.innerHTML = `
    <div class="container" style="padding: var(--space-5) 0 var(--space-8);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-5);">
        <h1 class="display">Statistik Pengunjung</h1>
        <button class="btn btn--secondary" id="btn-export-visitors">📊 Ekspor Excel</button>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: var(--space-4); margin-bottom: var(--space-6);">
        <div class="metric-card">
          <div class="metric-card__label">Pengunjung Hari Ini</div>
          <div class="metric-card__value">${summary.pengunjung_hari_ini ?? 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-card__label">Pengunjung Unik Hari Ini</div>
          <div class="metric-card__value">${summary.pengunjung_unik_hari_ini ?? 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-card__label">Total 7 Hari Terakhir</div>
          <div class="metric-card__value">${summary.total_7_hari ?? 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-card__label">Total Bulan Ini</div>
          <div class="metric-card__value">${summary.total_bulan_ini ?? 0}</div>
        </div>
        <div class="metric-card">
          <div class="metric-card__label">Total Sepanjang Waktu</div>
          <div class="metric-card__value">${summary.total_sepanjang_waktu ?? 0}</div>
        </div>
      </div>

      <div class="card" style="margin-bottom: var(--space-6);">
        <h3 style="margin-bottom: var(--space-3);">Tren Kunjungan Harian (30 Hari Terakhir)</h3>
        <canvas id="chart-visitors" height="90"></canvas>
      </div>

      <div class="card">
        <h3 style="margin-bottom: var(--space-3);">Rekapitulasi Harian</h3>
        <table class="data-table">
          <thead>
            <tr><th>Tanggal</th><th>Jumlah Kunjungan</th><th>Pengunjung Unik</th></tr>
          </thead>
          <tbody>
            ${recap.length === 0 ? `
              <tr><td colspan="3" class="empty-state">Belum ada data kunjungan.</td></tr>
            ` : recap.map((r) => `
              <tr>
                <td>${formatDate(r.visit_date)}</td>
                <td>${r.total_kunjungan}</td>
                <td>${r.pengunjung_unik}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  renderChart(container.querySelector('#chart-visitors'), recapAsc);

  container.querySelector('#btn-export-visitors').addEventListener('click', async () => {
    const XLSX = await import('xlsx');
    const rows = recap.map((r) => ({
      Tanggal: formatDate(r.visit_date),
      'Jumlah Kunjungan': r.total_kunjungan,
      'Pengunjung Unik': r.pengunjung_unik,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistik Pengunjung');
    XLSX.writeFile(workbook, 'Statistik-Pengunjung-Kantin-DWP.xlsx');
    showToast('Rekap pengunjung diunduh');
  });
}

async function renderChart(canvas, recapAsc) {
  if (!canvas) return;
  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: recapAsc.map((r) => new Date(r.visit_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })),
      datasets: [
        {
          label: 'Total Kunjungan',
          data: recapAsc.map((r) => r.total_kunjungan),
          borderColor: '#FF7A29',
          backgroundColor: 'rgba(255,122,41,0.15)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Pengunjung Unik',
          data: recapAsc.map((r) => r.pengunjung_unik),
          borderColor: '#2A7DE1',
          backgroundColor: 'rgba(42,125,225,0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: true } } },
  });
}
