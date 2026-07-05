import { fetchSellersWithStatus } from '../../productService.js';
import { fetchProducts } from '../../productService.js';
import { renderSellerStatusBadge } from '../../../components/Badge.js';
import { formatRupiah } from '../../../core/utils/formatters.js';
import { addToCart, cartStore, getCartCount } from '../cart/cartService.js';
import { showToast } from '../../shared/toast/toast.js';

export async function renderCatalogView(container) {
  container.innerHTML = `<div class="empty-state">Memuat katalog...</div>`;

  const [sellers, products] = await Promise.all([fetchSellersWithStatus(), fetchProducts()]);
  let searchTerm = '';
  let activeSellerId = null;

  function draw() {
    const filteredProducts = products.filter((p) => {
      const matchSeller = !activeSellerId || p.seller_id === activeSellerId;
      const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSeller && matchSearch;
    });

    container.innerHTML = `
      <header class="catalog-header">
        <div class="container" style="padding-top: var(--space-5); padding-bottom: var(--space-4);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-5);">
            <h1 class="display" style="font-size: var(--fs-2xl);">🍽️ Kantin DWP</h1>
            <div style="display:flex; gap: var(--space-2); align-items:center;">
              <a href="#/login" style="font-size: var(--fs-sm); color:var(--color-text-muted); white-space:nowrap;">🔑 Masuk</a>
              <button class="btn btn--primary" id="btn-open-cart">
                🛒 Keranjang (${getCartCount()})
              </button>
            </div>
          </div>
          <input type="search" id="search-input" placeholder="Cari makanan atau minuman..."
            value="${searchTerm}"
            style="width:100%; padding: var(--space-3) var(--space-4); border-radius: var(--radius-pill); border:1px solid var(--color-border); font-size: var(--fs-base);" />
        </div>
      </header>

      <div class="container">
        <h2 style="font-size: var(--fs-lg); margin-bottom: var(--space-3);">Penjual</h2>
        <div style="display:flex; gap: var(--space-3); overflow-x:auto; padding-bottom: var(--space-4);">
          <button class="btn ${!activeSellerId ? 'btn--primary' : 'btn--secondary'} btn--sm" data-seller="">Semua</button>
          ${sellers.map((s) => `
            <div class="card" style="min-width:200px; cursor:pointer;" data-seller-card="${s.id}">
              <div style="display:flex; justify-content:space-between; align-items:start;">
                <strong>${s.business_name}</strong>
              </div>
              <p style="font-size: var(--fs-xs); color:var(--color-text-muted); margin: var(--space-2) 0;">${s.description || ''}</p>
              ${renderSellerStatusBadge(s.condition_status)}
            </div>
          `).join('')}
        </div>

        <h2 style="font-size: var(--fs-lg); margin: var(--space-5) 0 var(--space-3);">Produk</h2>
        <div class="product-grid">
          ${filteredProducts.length ? filteredProducts.map((p) => `
            <div class="product-card">
              <div class="product-card__image">${p.stock === 0 ? '😔' : '🍛'}</div>
              <div class="product-card__body">
                <strong>${p.name}</strong>
                ${p.is_favorite ? '<span class="badge badge--has-orders" style="margin-left:6px;">⭐ Favorit</span>' : ''}
                ${p.stock === 0 ? '<span class="badge badge--busy" style="margin-left:6px;">Habis</span>' : ''}
                <div class="product-card__price" style="margin: var(--space-2) 0;">${formatRupiah(p.sell_price)}</div>
                <button class="btn btn--primary btn--sm btn--block" data-add-product="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
                  + Tambah ke Keranjang
                </button>
              </div>
            </div>
          `).join('') : `<div class="empty-state">Produk tidak ditemukan. Coba kata kunci lain.</div>`}
        </div>
      </div>
    `;

    container.querySelector('#search-input')?.addEventListener('input', (e) => {
      const cursorPos = e.target.selectionStart;
      searchTerm = e.target.value;
      draw();
      const newInput = container.querySelector('#search-input');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(cursorPos, cursorPos);
      }
    });

    container.querySelectorAll('[data-seller-card]').forEach((el) => {
      el.addEventListener('click', () => {
        activeSellerId = activeSellerId === el.dataset.sellerCard ? null : el.dataset.sellerCard;
        draw();
      });
    });

    container.querySelector('[data-seller=""]')?.addEventListener('click', () => {
      activeSellerId = null;
      draw();
    });

    container.querySelectorAll('[data-add-product]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const product = products.find((p) => p.id === btn.dataset.addProduct);
        addToCart(product);
        showToast(`${product.name} ditambahkan ke keranjang`);
        draw();
      });
    });

    container.querySelector('#btn-open-cart')?.addEventListener('click', () => {
      window.location.hash = '#/cart';
    });
  }

  cartStore.subscribe(() => draw());
  draw();
}
