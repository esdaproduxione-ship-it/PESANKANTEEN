import { supabase, isSupabaseConfigured } from '../../../config/supabaseClient.js';
import { mockSellers } from '../../../config/mockData.js';
import { showToast } from '../../shared/toast/toast.js';

async function fetchAllSellers() {
  if (!isSupabaseConfigured) return mockSellers;
  const { data, error } = await supabase.from('sellers').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function setSellerVerification(sellerId, status, note = '') {
  if (!isSupabaseConfigured) {
    console.info('[admin/sellers] Mode demo — verifikasi disimulasikan.', sellerId, status);
    return;
  }
  const { error } = await supabase.from('sellers').update({ verification_status: status, rejection_note: note }).eq('id', sellerId);
  if (error) throw error;
}

export async function renderAdminSellersView(container) {
  let sellers = await fetchAllSellers();

  function draw() {
    container.innerHTML = `
      <div class="container" style="padding: var(--space-5) 0 var(--space-8);">
        <h1 class="display" style="margin-bottom: var(--space-5);">Verifikasi Penjual</h1>
        <table class="data-table">
          <thead><tr><th>Nama Usaha</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            ${sellers.map((s) => `
              <tr>
                <td>${s.business_name}</td>
                <td>
                  <span class="badge ${s.verification_status === 'approved' ? 'badge--no-orders' : s.verification_status === 'rejected' ? 'badge--busy' : 'badge--has-orders'}">
                    ${{ approved: 'Disetujui', pending: 'Menunggu', rejected: 'Ditolak' }[s.verification_status] || s.verification_status}
                  </span>
                </td>
                <td style="display:flex; gap: var(--space-2);">
                  ${s.verification_status !== 'approved' ? `<button class="btn btn--primary btn--sm" data-approve="${s.id}">Setujui</button>` : ''}
                  ${s.verification_status !== 'rejected' ? `<button class="btn btn--ghost btn--sm" data-reject="${s.id}">Tolak</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('[data-approve]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await setSellerVerification(btn.dataset.approve, 'approved');
        sellers = sellers.map((s) => s.id === btn.dataset.approve ? { ...s, verification_status: 'approved' } : s);
        showToast('Penjual disetujui');
        draw();
      });
    });

    container.querySelectorAll('[data-reject]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const note = prompt('Alasan penolakan (opsional):') || '';
        await setSellerVerification(btn.dataset.reject, 'rejected', note);
        sellers = sellers.map((s) => s.id === btn.dataset.reject ? { ...s, verification_status: 'rejected' } : s);
        showToast('Penjual ditolak');
        draw();
      });
    });
  }

  draw();
}
