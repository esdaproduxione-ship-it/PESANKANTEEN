import './styles/base.css';
import './styles/components.css';
import './styles/print.css';

import { initAuth } from './core/auth/authService.js';
import { initRouter } from './router.js';

async function bootstrap() {
  try {
    await initAuth();
    initRouter();
  } catch (err) {
    console.error('[Kantin DWP] Gagal memulai aplikasi:', err);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; text-align:center; font-family:system-ui,sans-serif;">
          <div>
            <h1 style="margin-bottom:8px;">⚠️ Aplikasi gagal dimuat</h1>
            <p style="color:#666;">Terjadi kesalahan saat memulai aplikasi. Coba muat ulang halaman.<br/>Jika masalah berlanjut, hubungi admin.</p>
          </div>
        </div>
      `;
    }
    return;
  }

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.warn('[PWA] Gagal mendaftarkan service worker:', err);
    });
  }
}

bootstrap();
