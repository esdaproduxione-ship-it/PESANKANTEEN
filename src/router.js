import { authStore } from './core/auth/authService.js';
import { canAccess } from './core/auth/authGuard.js';
import { renderShell, bindShellEvents } from './modules/shared/shell.js';

import { renderCatalogView } from './modules/buyer/catalog/catalogView.js';
import { renderCartView } from './modules/buyer/cart/cartView.js';
import { renderCheckoutView } from './modules/buyer/checkout/checkoutView.js';
import { renderOrderTrackingView } from './modules/buyer/orderTracking/trackingView.js';
import { renderLoginView } from './modules/auth/loginView.js';

import { renderSellerDashboard } from './modules/seller/dashboard/dashboardView.js';
import { renderSellerProductsView } from './modules/seller/products/productsView.js';
import { renderSellerProfileView } from './modules/seller/profile/profileView.js';
import { fetchSellerOrders } from './modules/orderService.js';

import { renderAdminDashboard } from './modules/admin/dashboard/dashboardView.js';
import { renderAdminSellersView } from './modules/admin/sellers/sellersView.js';
import { renderAdminOrdersView } from './modules/admin/orders/ordersView.js';
import { renderAdminReportsView } from './modules/admin/reports/reportsView.js';

import { mockSellers } from './config/mockData.js';

const appRoot = document.getElementById('app');
let cleanupCurrentView = null;

function parseHash() {
  const [path, queryString] = window.location.hash.replace('#', '').split('?');
  const query = Object.fromEntries(new URLSearchParams(queryString || ''));
  return { path: path || '/', query };
}

async function renderRoute() {
  if (typeof cleanupCurrentView === 'function') {
    cleanupCurrentView();
    cleanupCurrentView = null;
  }

  const { path, query } = parseHash();
  const { loading, profile } = authStore.getState();

  if (loading) {
    appRoot.innerHTML = `<div class="empty-state">Memuat aplikasi...</div>`;
    return;
  }

  // ---- Rute publik pembeli (tanpa akun) ----
  if (path === '/') return renderCatalogView(appRoot);
  if (path === '/cart') { cleanupCurrentView = renderCartView(appRoot); return; }
  if (path === '/checkout') return renderCheckoutView(appRoot);
  if (path === '/tracking') return renderOrderTrackingView(appRoot, { orderId: query.order, whatsapp: query.wa });

  // ---- Rute autentikasi ----
  if (path === '/login/seller') return renderLoginView(appRoot, { role: 'seller' });
  if (path === '/login/admin') return renderLoginView(appRoot, { role: 'admin' });

  // ---- Rute penjual (terproteksi) ----
  if (path.startsWith('/seller')) {
    if (!canAccess(['seller'])) {
      window.location.hash = '#/login/seller';
      return;
    }
    const seller = profile?.sellers?.[0] || mockSellers[0]; // fallback demo
    appRoot.innerHTML = renderShell('seller', '#' + path);
    bindShellEvents(appRoot);
    const content = appRoot.querySelector('#shell-content');

    if (path === '/seller') {
      cleanupCurrentView = await renderSellerDashboard(content, seller);
    } else if (path === '/seller/products') {
      await renderSellerProductsView(content, seller);
    } else if (path === '/seller/orders') {
      const orders = await fetchSellerOrders(seller.id);
      content.innerHTML = `<div class="container" style="padding:var(--space-5) 0;"><h1 class="display">Semua Pesanan</h1><p style="color:var(--color-text-muted); margin-top:var(--space-3);">${orders.length} pesanan ditemukan. Lihat detail di menu Dashboard.</p></div>`;
    } else if (path === '/seller/profile') {
      await renderSellerProfileView(content, seller);
    }
    return;
  }

  // ---- Rute admin (terproteksi) ----
  if (path.startsWith('/admin')) {
    if (!canAccess(['admin', 'superadmin'])) {
      window.location.hash = '#/login/admin';
      return;
    }
    appRoot.innerHTML = renderShell('admin', '#' + path);
    bindShellEvents(appRoot);
    const content = appRoot.querySelector('#shell-content');

    if (path === '/admin') await renderAdminDashboard(content);
    else if (path === '/admin/sellers') await renderAdminSellersView(content);
    else if (path === '/admin/orders') await renderAdminOrdersView(content);
    else if (path === '/admin/reports') await renderAdminReportsView(content);
    return;
  }

  appRoot.innerHTML = `<div class="empty-state">Halaman tidak ditemukan. <a href="#/">Kembali ke beranda</a></div>`;
}

export function initRouter() {
  window.addEventListener('hashchange', renderRoute);
  authStore.subscribe(renderRoute);
  renderRoute();
}
