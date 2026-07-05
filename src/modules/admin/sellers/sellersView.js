import { supabase, isSupabaseConfigured } from '../../../config/supabaseClient.js';
import { mockSellers } from '../../../config/mockData.js';
import { showToast } from '../../shared/toast/toast.js';
import { superadminCreateSeller, superadminResetPassword } from '../../superadminService.js';
import { getCurrentRole } from '../../../core/auth/authService.js';
import { isRequired } from '../../../core/utils/validators.js';

async function fetchAllSellers() {
  if (!isSupabaseConfigured) return mockSellers;
  const { data, error } = await supabase.from('sellers').select('*, users(id, full_name, username, email)').order('created_at', { ascending: false });
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
  const isSuperadmin = getCurrentRole() === 'superadmin';

  function draw() {
    container.innerHTML = `
      <div class="container" style="padding: var(--space-5) 0 var(--space-8);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-5); flex-wrap:wrap; gap: var(--space-3);">
          <h1 class="display">Kelola Penjual</h1>
          ${isSuperadmin ? `<button class="btn btn--primary" id="btn-new-seller">+ Buat Akun Penjual Baru</button>` : ''}
        </div>

        <table class="data-table">
          <thead><tr><th>Nama Usaha</th><th>Username</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            ${sellers.map((s) => `
              <tr>
                <td>${s.business_name}</td>
                <td>${s.users?.username || '-'}</td>
                <td>
                  <span class="badge ${s.verification_status === 'approved' ? 'badge--no-orders' : s.verification_status === 'rejected' ? 'badge--busy' : 'badge--has-orders'}">
                    ${{ approved: 'Disetujui', pending: 'Menunggu', rejected: 'Ditolak' }[s.verification_status] || s.verification_status}
                  </span>
                </td>
                <td style="display:flex; gap: var(--space-2); flex-wrap:wrap;">
                  ${s.verification_status !== 'approved' ? `<button class="btn btn--primary btn--sm" data-approve="${s.id}">Setujui</button>` : ''}
                  ${s.verification_status !== 'rejected' ? `<button class="btn btn--ghost btn--sm" data-reject="${s.id}">Tolak</button>` : ''}
                  ${isSuperadmin && s.users?.id ? `<button class="btn btn--ghost btn--sm" data-reset="${s.users.id}" data-reset-name="${s.users.username}">🔑 Reset Password</button>` : ''}
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

    container.querySelectorAll('[data-reset]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const newPassword = prompt(`Password baru untuk "${btn.dataset.resetName}" (minimal 6 karakter):`);
        if (!newPassword) return;
        if (newPassword.length < 6) {
          showToast('Password minimal 6 karakter');
          return;
        }
        try {
          await superadminResetPassword(btn.dataset.reset, newPassword);
          showToast('Password berhasil direset');
        } catch (err) {
          showToast('Gagal reset password: ' + err.message);
        }
      });
    });

    container.querySelector('#btn-new-seller')?.addEventListener('click', openCreateSellerModal);
  }

  function openCreateSellerModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card" style="max-width:420px;">
        <h2 style="margin-bottom: var(--space-4);">Buat Akun Penjual Baru</h2>
        <form id="new-seller-form">
          <div class="field">
            <label for="ns-username">Username</label>
            <input type="text" id="ns-username" required />
          </div>
          <div class="field">
            <label for="ns-email">Email</label>
            <input type="email" id="ns-email" required />
          </div>
          <div class="field">
            <label for="ns-password">Password Awal</label>
            <input type="password" id="ns-password" minlength="6" required />
          </div>
          <div class="field">
            <label for="ns-fullname">Nama Lengkap</label>
            <input type="text" id="ns-fullname" required />
          </div>
          <div class="field">
            <label for="ns-business">Nama Usaha</label>
            <input type="text" id="ns-business" required />
          </div>
          <div style="display:flex; gap: var(--space-2); margin-top: var(--space-4);">
            <button type="button" class="btn btn--ghost" id="ns-cancel" style="flex:1;">Batal</button>
            <button type="submit" class="btn btn--primary" style="flex:1;">Buat Akun</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#ns-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#new-seller-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = overlay.querySelector('#ns-username').value.trim();
      const email = overlay.querySelector('#ns-email').value.trim();
      const password = overlay.querySelector('#ns-password').value;
      const fullName = overlay.querySelector('#ns-fullname').value.trim();
      const businessName = overlay.querySelector('#ns-business').value.trim();

      if (![username, email, password, fullName, businessName].every(isRequired)) {
        showToast('Semua field wajib diisi');
        return;
      }

      try {
        await superadminCreateSeller({ username, email, password, fullName, businessName });
        showToast('Akun penjual berhasil dibuat');
        overlay.remove();
        sellers = await fetchAllSellers();
        draw();
      } catch (err) {
        showToast('Gagal membuat akun: ' + err.message);
      }
    });
  }

  draw();
}
