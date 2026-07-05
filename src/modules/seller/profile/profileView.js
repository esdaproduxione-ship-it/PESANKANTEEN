import { updateSellerProfile, uploadSellerLogo } from '../../sellerService.js';
import { sanitizeText, isRequired, isValidWhatsapp } from '../../../core/utils/validators.js';
import { showToast } from '../../shared/toast/toast.js';
import { ORDERED_DAY_KEYS, getDayLabel, isWithinOperatingHours } from '../../../core/utils/operatingHours.js';

const DEFAULT_HOURS = { open: '09:00', close: '15:00', closed: false };

export async function renderSellerProfileView(container, seller) {
  let logoPreview = seller.logo_url || '';
  let pendingLogoFile = null;
  const hours = { ...seller.operating_hours };
  ORDERED_DAY_KEYS.forEach((day) => { if (!hours[day]) hours[day] = { ...DEFAULT_HOURS }; });

  function draw() {
    const liveStatus = isWithinOperatingHours(hours);

    container.innerHTML = `
      <div class="container" style="padding: var(--space-5) 0 var(--space-8); max-width:640px;">
        <h1 class="display" style="font-size: var(--fs-2xl); margin-bottom: var(--space-5);">Profil Toko</h1>

        <div class="card" style="margin-bottom: var(--space-5);">
          <h3 style="margin-bottom: var(--space-4);">Foto Profil / Logo Toko</h3>
          <div style="display:flex; align-items:center; gap: var(--space-4);">
            <div style="width:88px; height:88px; border-radius:50%; overflow:hidden; background:var(--color-orange-soft); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              ${logoPreview
                ? `<img src="${logoPreview}" alt="Logo toko" style="width:100%; height:100%; object-fit:cover;" />`
                : `<span style="font-size:32px;">🏪</span>`}
            </div>
            <div>
              <input type="file" id="logo-input" accept="image/*" style="display:none;" />
              <button type="button" class="btn btn--secondary btn--sm" id="btn-pick-logo">Pilih Foto</button>
              <p style="font-size: var(--fs-xs); color:var(--color-text-muted); margin-top: var(--space-2);">JPG/PNG, maks. 2MB.</p>
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom: var(--space-5);">
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
              <label for="is_open" style="margin:0;">Toko Diaktifkan</label>
              <select id="is_open" name="is_open">
                <option value="true" ${seller.is_open ? 'selected' : ''}>Ya (ikuti jadwal di bawah)</option>
                <option value="false" ${!seller.is_open ? 'selected' : ''}>Tidak (tutup sementara, abaikan jadwal)</option>
              </select>
            </div>

            <h3 style="margin: var(--space-5) 0 var(--space-2);">Jam Operasional</h3>
            <p style="font-size: var(--fs-sm); color:var(--color-text-muted); margin-bottom: var(--space-3);">
              Status toko di katalog pembeli akan otomatis mengikuti jadwal ini (waktu WIB), selama "Toko Diaktifkan" = Ya.
              Status sekarang: <strong>${liveStatus === null ? '-' : liveStatus ? 'Buka' : 'Tutup'}</strong>
            </p>
            <div style="display:flex; flex-direction:column; gap: var(--space-2); margin-bottom: var(--space-4);">
              ${ORDERED_DAY_KEYS.map((day) => `
                <div style="display:flex; align-items:center; gap: var(--space-3); flex-wrap:wrap;">
                  <span style="width:70px; font-weight:600; font-size: var(--fs-sm);">${getDayLabel(day)}</span>
                  <label style="display:flex; align-items:center; gap:4px; font-weight:400; font-size: var(--fs-sm);">
                    <input type="checkbox" data-day-closed="${day}" ${hours[day].closed ? 'checked' : ''} style="width:auto;" /> Libur
                  </label>
                  <input type="time" data-day-open="${day}" value="${hours[day].open || '09:00'}" ${hours[day].closed ? 'disabled' : ''} style="width:auto;" />
                  <span>s/d</span>
                  <input type="time" data-day-close="${day}" value="${hours[day].close || '15:00'}" ${hours[day].closed ? 'disabled' : ''} style="width:auto;" />
                </div>
              `).join('')}
            </div>

            <button type="submit" class="btn btn--primary btn--block">Simpan Perubahan</button>
          </form>
        </div>
      </div>
    `;

    container.querySelector('#btn-pick-logo').addEventListener('click', () => {
      container.querySelector('#logo-input').click();
    });
    container.querySelector('#logo-input').addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      pendingLogoFile = file;
      logoPreview = URL.createObjectURL(file);
      draw();
    });

    ORDERED_DAY_KEYS.forEach((day) => {
      container.querySelector(`[data-day-closed="${day}"]`).addEventListener('change', (e) => {
        hours[day].closed = e.target.checked;
        draw();
      });
    });

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

    // Kumpulkan jadwal terbaru dari input di form
    ORDERED_DAY_KEYS.forEach((day) => {
      const openInput = container.querySelector(`[data-day-open="${day}"]`);
      const closeInput = container.querySelector(`[data-day-close="${day}"]`);
      hours[day] = {
        open: openInput.value || '09:00',
        close: closeInput.value || '15:00',
        closed: hours[day].closed,
      };
    });

    const patch = {
      business_name,
      description: sanitizeText(form.get('description')),
      whatsapp: whatsapp ? String(whatsapp).trim() : null,
      is_open: form.get('is_open') === 'true',
      operating_hours: hours,
    };

    try {
      if (pendingLogoFile) {
        const logoUrl = await uploadSellerLogo(seller.user_id, pendingLogoFile);
        patch.logo_url = logoUrl;
      }
      const updated = await updateSellerProfile(seller.id, patch);
      Object.assign(seller, updated);
      pendingLogoFile = null;
      showToast('Profil toko diperbarui');
      draw();
    } catch (err) {
      showToast('Gagal menyimpan: ' + err.message);
    }
  }

  draw();
}
