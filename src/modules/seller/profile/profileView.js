import { updateSellerProfile } from '../../sellerService.js';
import { sanitizeText, isRequired, isValidWhatsapp } from '../../../core/utils/validators.js';
import { showToast } from '../../shared/toast/toast.js';

export async function renderSellerProfileView(container, seller) {
  function draw() {
    container.innerHTML = `
      <div class="container" style="padding: var(--space-5) 0 var(--space-8); max-width:560px;">
        <h1 class="display" style="font-size: var(--fs-2xl); margin-bottom: var(--space-5);">Profil Toko</h1>

        <div class="card">
          <form id="profile-form">
            <div class="field">
              <label for="business_name">Nama Usaha</label>
              <input type="text" id="business_name" name="business_name" value="${seller.business_name || ''}" required />
            </div>
            <div class="field">
              <label for="description">Deskripsi Toko</label>
              <textarea id="description" name="description" rows="3">${seller.description || ''}</textarea>
            </div>
            <div class="field">
              <label for="whatsapp">Nomor WhatsApp Toko</label>
              <input type="text" id="whatsapp" name="whatsapp" value="${seller.whatsapp || ''}" placeholder="08xxxxxxxxxx" />
            </div>
            <div class="field" style="display:flex; align-items:center; gap: var(--space-3);">
              <label for="is_open" style="margin:0;">Status Toko</label>
              <select id="is_open" name="is_open">
                <option value="true" ${seller.is_open ? 'selected' : ''}>Buka</option>
                <option value="false" ${!seller.is_open ? 'selected' : ''}>Tutup</option>
              </select>
            </div>
            <button type="submit" class="btn btn--primary btn--block">Simpan Perubahan</button>
          </form>
        </div>
      </div>
    `;

    container.querySelector('#profile-form').addEventListener('submit', handleSubmit);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const whatsapp = form.get('whatsapp');

    const business_name = sanitizeText(form.get('business_name'));
    if (!isRequired(business_name)) {
      showToast('Nama usaha wajib diisi');
      return;
    }
    if (whatsapp && !isValidWhatsapp(whatsapp)) {
      showToast('Nomor WhatsApp tidak valid');
      return;
    }

    const patch = {
      business_name,
      description: sanitizeText(form.get('description')),
      whatsapp: whatsapp ? String(whatsapp).trim() : null,
      is_open: form.get('is_open') === 'true',
    };

    try {
      const updated = await updateSellerProfile(seller.id, patch);
      Object.assign(seller, updated);
      showToast('Profil toko diperbarui');
      draw();
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message);
    }
  }

  draw();
}
