import { signOut } from '../../core/auth/authService.js';

const NAV_ITEMS = {
  seller: [
    { hash: '#/seller', label: '📊 Dashboard' },
    { hash: '#/seller/products', label: '🍜 Kelola Produk' },
    { hash: '#/seller/orders', label: '🎫 Pesanan' },
  ],
  admin: [
    { hash: '#/admin', label: '📊 Dashboard' },
    { hash: '#/admin/sellers', label: '✅ Verifikasi Penjual' },
    { hash: '#/admin/orders', label: '📦 Monitoring Pesanan' },
    { hash: '#/admin/reports', label: '📑 Rekap Laporan' },
  ],
};

export function renderShell(role, currentHash) {
  const items = NAV_ITEMS[role] || [];
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar__brand">
          <div class="sidebar__brand-mark"></div>
          Kantin DWP
        </div>
        <nav>
          ${items.map((item) => `
            <a href="${item.hash}" class="nav-link ${currentHash === item.hash ? 'active' : ''}">${item.label}</a>
          `).join('')}
        </nav>
        <div style="margin-top:auto; padding-top: var(--space-6);">
          <button class="btn btn--ghost btn--block" id="btn-logout">🚪 Keluar</button>
        </div>
      </aside>
      <main id="shell-content"></main>
    </div>
  `;
}

export function bindShellEvents(container) {
  container.querySelector('#btn-logout')?.addEventListener('click', async () => {
    await signOut();
    window.location.hash = '#/';
  });
}
