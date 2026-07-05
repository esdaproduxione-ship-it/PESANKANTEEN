import './styles/base.css';
import './styles/components.css';
import './styles/print.css';

import { initAuth } from './core/auth/authService.js';
import { initRouter } from './router.js';

async function bootstrap() {
  await initAuth();
  initRouter();

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.warn('[PWA] Gagal mendaftarkan service worker:', err);
    });
  }
}

bootstrap();
