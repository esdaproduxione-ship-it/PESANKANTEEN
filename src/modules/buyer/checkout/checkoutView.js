import { groupCartBySeller, getCartTotal, clearCart, cartStore } from '../cart/cartService.js';
import { formatRupiah } from '../../../core/utils/formatters.js';
import { validateCheckoutForm, sanitizeText } from '../../../core/utils/validators.js';
import { submitGuestCheckout } from '../../orderService.js';
import { showToast } from '../../shared/toast/toast.js';
import { PAYMENT_TYPE } from '../../../config/constants.js';

export function renderCheckoutView(container) {
  const grouped = groupCartBySeller();
  const total = getCartTotal();
  let selectedPayment = PAYMENT_TYPE.QRIS;
  let errors = {};

  function draw() {
    if (Object.keys(grouped).length === 0) {
      container.innerHTML = `<div class="container"><div class="empty-state">Keranjang kosong. <a href="#/">Kembali ke katalog</a></div></div>`;
      return;
    }

    container.innerHTML = `
      <div class="container" style="max-width:640px; padding: var(--space-5) var(--space-5) var(--space-8);">
        <a href="#/cart" class="btn btn--ghost" style="margin-bottom: var(--space-4);">&larr; Kembali</a>
        <h1 class="display" style="margin-bottom: var(--space-5);">Checkout</h1>

        <div class="card" style="margin-bottom: var(--space-5);">
          <h3 style="margin-bottom: var(--space-3);">Ringkasan Pesanan</h3>
          <p style="font-size: var(--fs-sm); color: var(--color-text-muted); margin-bottom: var(--space-3);">
            Pesanan akan dipisah menjadi ${Object.keys(grouped).length} order (per penjual).
          </p>
          <div class="ticket__perforation"></div>
          <div style="display:flex; justify-content:space-between; font-weight:700;">
            <span>Total</span><span class="price">${formatRupiah(total)}</span>
          </div>
        </div>

        <form id="checkout-form">
          <div class="field">
            <label for="name">Nama Lengkap</label>
            <input type="text" id="name" name="name" required />
            ${errors.name ? `<span style="color:var(--color-red); font-size:var(--fs-xs);">${errors.name}</span>` : ''}
          </div>
          <div class="field">
            <label for="whatsapp">Nomor WhatsApp</label>
            <input type="tel" id="whatsapp" name="whatsapp" placeholder="08xxxxxxxxxx" required />
            ${errors.whatsapp ? `<span style="color:var(--color-red); font-size:var(--fs-xs);">${errors.whatsapp}</span>` : ''}
          </div>
          <div class="field">
            <label for="address">Alamat Pengiriman</label>
            <textarea id="address" name="address" rows="2" required></textarea>
            ${errors.address ? `<span style="color:var(--color-red); font-size:var(--fs-xs);">${errors.address}</span>` : ''}
          </div>
          <div class="field">
            <label for="notes">Catatan Pesanan (opsional)</label>
            <textarea id="notes" name="notes" rows="2"></textarea>
          </div>

          <div class="field">
            <label>Metode Pembayaran</label>
            <div style="display:flex; gap: var(--space-2);">
              ${[
                [PAYMENT_TYPE.QRIS, 'QRIS'],
                [PAYMENT_TYPE.BANK_TRANSFER, 'Transfer Bank'],
                [PAYMENT_TYPE.COD, 'COD'],
              ].map(([value, label]) => `
                <button type="button" class="btn ${selectedPayment === value ? 'btn--primary' : 'btn--secondary'} btn--sm" data-payment="${value}">
                  ${label}
                </button>
              `).join('')}
            </div>
          </div>

          <button type="submit" class="btn btn--primary btn--block" style="margin-top: var(--space-4);">
            Buat Pesanan — ${formatRupiah(total)}
          </button>
        </form>
      </div>
    `;

    container.querySelectorAll('[data-payment]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedPayment = btn.dataset.payment;
        draw();
      });
    });

    container.querySelector('#checkout-form').addEventListener('submit', handleSubmit);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const customer = {
      name: sanitizeText(form.get('name')),
      whatsapp: sanitizeText(form.get('whatsapp')),
      address: sanitizeText(form.get('address')),
      notes: sanitizeText(form.get('notes')),
    };

    const { isValid, errors: validationErrors } = validateCheckoutForm(customer);
    errors = validationErrors;
    if (!isValid) return draw();

    try {
      const orders = await submitGuestCheckout({ customer, groupedItems: grouped, paymentMethodId: selectedPayment });
      clearCart();
      showToast('Pesanan berhasil dibuat!');
      window.location.hash = `#/tracking?order=${orders[0].id || orders[0].order_number}&wa=${customer.whatsapp}`;
    } catch (err) {
      showToast('Gagal membuat pesanan: ' + err.message);
    }
  }

  draw();
}
