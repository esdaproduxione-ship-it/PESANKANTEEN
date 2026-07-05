import { mockDashboardSummary } from '../../../config/mockData.js';
import { supabase, isSupabaseConfigured } from '../../../config/supabaseClient.js';
import { formatRupiah } from '../../../core/utils/formatters.js';

async function fetchDashboardSummary() {
  if (!isSupabaseConfigured) return mockDashboardSummary;
  const { data, error } = await supabase.from('v_admin_dashboard_summary').select('*').single();
  if (error) throw error;
  return data;
}

export async function renderAdminDashboard(container) {
  const summary = await fetchDashboardSummary();

  container.innerHTML = `
    <div class="container" style="padding: var(--space-5) 0 var(--space-8);">
      <h1 class="display" style="margin-bottom: var(--space-5);">Dashboard Admin</h1>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: var(--space-4); margin-bottom: var(--space-6);">
        <div class="metric-card"><div class="metric-card__label">Total Penjual</div><div class="metric-card__value">${summary.total_sellers}</div></div>
        <div class="metric-card"><div class="metric-card__label">Produk Aktif</div><div class="metric-card__value">${summary.total_active_products}</div></div>
        <div class="metric-card"><div class="metric-card__label">Total Transaksi</div><div class="metric-card__value">${summary.total_orders}</div></div>
        <div class="metric-card"><div class="metric-card__label">Total Omzet</div><div class="metric-card__value" style="font-size:var(--fs-xl);">${formatRupiah(summary.total_omzet)}</div></div>
        <div class="metric-card"><div class="metric-card__label">Pesanan Hari Ini</div><div class="metric-card__value">${summary.orders_today}</div></div>
        <div class="metric-card"><div class="metric-card__label">Pesanan Bulan Ini</div><div class="metric-card__value">${summary.orders_this_month}</div></div>
      </div>

      <div class="card">
        <h3 style="margin-bottom: var(--space-3);">Grafik Transaksi & Omzet</h3>
        <canvas id="chart-omzet" height="100"></canvas>
      </div>
    </div>
  `;

  renderChart(container.querySelector('#chart-omzet'));
}

async function renderChart(canvas) {
  if (!canvas) return;
  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      datasets: [{
        label: 'Omzet Harian (Rp)',
        data: [420000, 380000, 510000, 460000, 600000, 720000, 580000],
        borderColor: '#FF7A29',
        backgroundColor: 'rgba(255,122,41,0.15)',
        tension: 0.4,
        fill: true,
      }],
    },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });
}
