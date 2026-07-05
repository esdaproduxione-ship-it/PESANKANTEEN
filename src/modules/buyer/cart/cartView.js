import { cartStore, updateQty, removeFromCart, getCartTotal } from './cartService.js';
import { formatRupiah } from '../../../core/utils/formatters.js';

export function renderCartView(container) {
  function draw() {
    const { items } = cartStore.getState();
    const total = getCartTotal();

    container.innerHTML = `
      <div class="container" style="padding: var(--space-5) var(--space-5) var(--space-8);">
        <a href="#/" class="btn btn--ghost" style="margin-bottom: var(--space-4);">&larr; Kembali ke Katalog</a>
        <h1 class="display" style="margin-bottom: var(--space-5);">Keranjang Belanja</h1>

        ${items.length === 0 ? `
          <div class="empty-state">
            <p>Keranjang kosong. Ayo pilih menu favoritmu!</p>
            <a href="#/" class="btn btn--primary" style="margin-top: var(--space-4);">Lihat Katalog</a>
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap: var(--space-3);">
            ${items.map((item) => `
              <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong>${item.name}</strong>
                  <div class="price" style="color:var(--color-text-muted); font-size: var(--fs-sm);">${formatRupiah(item.price)} / item</div>
                </div>
                <div style="display:flex; align-items:center; gap: var(--space-3);">
                  <button class="btn btn--secondary btn--sm" data-decrease="${item.product_id}">-</button>
                  <span class="mono">${item.qty}</span>
                  <button class="btn btn--secondary btn--sm" data-increase="${item.product_id}">+</button>
                  <button class="btn btn--ghost btn--sm" data-remove="${item.product_id}">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="ticket" style="margin-top: var(--space-6);">
            <div class="ticket__header">
              <span>Total Belanja</span>
              <span class="price" style="font-size: var(--fs-xl); color: var(--color-orange-dark);">${formatRupiah(total)}</span>
            </div>
            <div class="ticket__perforation"></div>
            <a href="#/checkout" class="btn btn--primary btn--block">Lanjut ke Checkout</a>
          </div>
        `}
      </div>
    `;

    container.querySelectorAll('[data-increase]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = cartStore.getState().items.find((i) => i.product_id === btn.dataset.increase);
        updateQty(item.product_id, item.qty + 1);
      });
    });
    container.querySelectorAll('[data-decrease]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = cartStore.getState().items.find((i) => i.product_id === btn.dataset.decrease);
        updateQty(item.product_id, item.qty - 1);
      });
    });
    container.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => removeFromCart(btn.dataset.remove));
    });
  }

  const unsubscribe = cartStore.subscribe(draw);
  draw();
  return unsubscribe;
}
