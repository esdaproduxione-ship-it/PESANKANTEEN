import { fetchSellerProducts, createProduct, updateProduct, deleteProduct } from '../../productService.js';
import { formatRupiah } from '../../../core/utils/formatters.js';
import { validateProductForm, sanitizeText } from '../../../core/utils/validators.js';
import { showToast } from '../../shared/toast/toast.js';
import { DEFAULT_SETTINGS } from '../../../config/constants.js';

export async function renderSellerProductsView(container, seller) {
  let products = await fetchSellerProducts(seller.id);
  let editingProduct = null;

  function draw() {
    container.innerHTML = `
      <div class="container" style="padding: var(--space-5) 0 var(--space-8);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-5);">
          <h1 class="display" style="font-size: var(--fs-2xl);">Kelola Produk</h1>
          <button class="btn btn--primary" id="btn-add-product">+ Tambah Produk</button>
        </div>

        <div id="product-form-area"></div>

        <table class="data-table">
          <thead><tr><th>Produk</th><th>Harga Jual</th><th>Stok</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            ${products.map((p) => `
              <tr>
                <td>${p.name} ${p.is_favorite ? '⭐' : ''}</td>
                <td class="price">${formatRupiah(p.sell_price)}</td>
                <td>${p.stock}</td>
                <td>${p.stock > 0 ? '<span class="badge badge--no-orders">Tersedia</span>' : '<span class="badge badge--busy">Habis</span>'}</td>
                <td style="display:flex; gap: var(--space-2);">
                  <button class="btn btn--secondary btn--sm" data-edit="${p.id}">Edit</button>
                  <button class="btn btn--ghost btn--sm" data-delete="${p.id}">Hapus</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelector('#btn-add-product')?.addEventListener('click', () => openForm(null));
    container.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => openForm(products.find((p) => p.id === btn.dataset.edit)));
    });
    container.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Hapus produk ini?')) return;
        try {
          await deleteProduct(btn.dataset.delete);
          products = products.filter((p) => p.id !== btn.dataset.delete);
          showToast('Produk dihapus');
          draw();
        } catch (err) {
          showToast('Gagal menghapus: ' + err.message);
        }
      });
    });
  }

  function openForm(product) {
    editingProduct = product;
    const formArea = container.querySelector('#product-form-area');
    formArea.innerHTML = `
      <div class="card" style="margin-bottom: var(--space-5);">
        <h3 style="margin-bottom: var(--space-4);">${product ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
        <form id="product-form">
          <div class="field">
            <label for="name">Nama Produk</label>
            <input type="text" id="name" name="name" value="${product?.name || ''}" required />
          </div>
          <div class="field">
            <label for="base_price">Harga Dasar (Rp)</label>
            <input type="number" id="base_price" name="base_price" value="${product?.base_price || ''}" min="0" required />
          </div>
          <div class="field">
            <label for="extra_fee">Biaya Kirim Pesanan (per satuan bungkus/gelas/mangkok, min. Rp${DEFAULT_SETTINGS.min_extra_fee})</label>
            <input type="number" id="extra_fee" name="extra_fee" value="${product?.extra_fee || DEFAULT_SETTINGS.min_extra_fee}" min="${DEFAULT_SETTINGS.min_extra_fee}" required />
          </div>
          <div class="field">
            <label for="stock">Stok</label>
            <input type="number" id="stock" name="stock" value="${product?.stock ?? 0}" min="0" required />
          </div>
          <div style="display:flex; gap: var(--space-3);">
            <button type="submit" class="btn btn--primary">Simpan</button>
            <button type="button" class="btn btn--ghost" id="btn-cancel-form">Batal</button>
          </div>
        </form>
      </div>
    `;

    formArea.querySelector('#btn-cancel-form').addEventListener('click', () => { formArea.innerHTML = ''; });
    formArea.querySelector('#product-form').addEventListener('submit', handleSubmit);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const payload = {
      name: sanitizeText(form.get('name')),
      base_price: Number(form.get('base_price')),
      extra_fee: Number(form.get('extra_fee')),
      stock: Number(form.get('stock')),
      seller_id: seller.id,
    };

    const { isValid, errors } = validateProductForm(payload);
    if (!isValid) {
      showToast(Object.values(errors)[0]);
      return;
    }

    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, payload);
        products = products.map((p) => p.id === editingProduct.id ? { ...p, ...updated, sell_price: payload.base_price + payload.extra_fee } : p);
        showToast('Produk diperbarui');
      } else {
        const created = await createProduct(payload);
        products = [...products, { ...created, sell_price: payload.base_price + payload.extra_fee }];
        showToast('Produk ditambahkan');
      }
      draw();
    } catch (err) {
      showToast('Gagal menyimpan produk: ' + err.message);
    }
  }

  draw();
}
