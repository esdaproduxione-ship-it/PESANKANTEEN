import { signInWithUsername, signUpSeller, getCurrentRole, authStore } from '../../core/auth/authService.js';
import { showToast } from '../shared/toast/toast.js';
import { isRequired } from '../../core/utils/validators.js';
import { TURNSTILE_SITE_KEY } from '../../config/constants.js';

export function renderLoginView(container, { role = 'seller' } = {}) {
  let mode = 'login'; // 'login' | 'register' (register hanya untuk seller)
  let captchaToken = '';
  let turnstileWidgetId = null;

  function draw() {
    container.innerHTML = `
      <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background: linear-gradient(135deg, var(--color-orange-soft), var(--color-yellow-soft));">
        <div class="card" style="width:100%; max-width:400px;">
          <div style="text-align:center; margin-bottom: var(--space-5);">
            <div class="sidebar__brand-mark" style="margin:0 auto var(--space-3);"></div>
            <h1 class="display" style="font-size: var(--fs-xl);">Kantin DWP</h1>
            <p style="color:var(--color-text-muted); font-size:var(--fs-sm);">
              ${role === 'admin' ? 'Login Admin' : mode === 'login' ? 'Login Penjual' : 'Registrasi Penjual'}
            </p>
          </div>

          <form id="auth-form">
            <div class="field">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" autocomplete="username" required />
            </div>
            ${mode === 'register' ? `
              <div class="field">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required />
                <small style="color:var(--color-text-muted);">Dipakai untuk pemulihan akun, bukan untuk login.</small>
              </div>
            ` : ''}
            <div class="field">
              <label for="password">Kata Sandi</label>
              <input type="password" id="password" name="password" required minlength="6" />
            </div>
            ${role === 'seller' && mode === 'register' ? `
              <div class="field">
                <label for="fullName">Nama Lengkap</label>
                <input type="text" id="fullName" name="fullName" required />
              </div>
              <div class="field">
                <label for="businessName">Nama Usaha</label>
                <input type="text" id="businessName" name="businessName" required />
              </div>
            ` : ''}

            ${TURNSTILE_SITE_KEY ? `
              <div class="field">
                <div id="turnstile-container"></div>
              </div>
            ` : `
              <div class="field" style="font-size: var(--fs-xs); color:var(--color-text-muted); background:var(--color-orange-soft); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);">
                ⚠️ CAPTCHA belum dikonfigurasi (VITE_TURNSTILE_SITE_KEY kosong). Login tetap berfungsi tanpa proteksi CAPTCHA.
              </div>
            `}

            <button type="submit" class="btn btn--primary btn--block">
              ${mode === 'login' ? 'Masuk' : 'Daftar sebagai Penjual'}
            </button>
          </form>

          ${role === 'seller' ? `
            <p style="text-align:center; margin-top: var(--space-4); font-size: var(--fs-sm);">
              ${mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
              <a href="#" id="toggle-mode" style="color:var(--color-orange-dark); font-weight:600;">
                ${mode === 'login' ? 'Daftar di sini' : 'Masuk di sini'}
              </a>
            </p>
          ` : ''}
          <p style="text-align:center; margin-top: var(--space-2); font-size: var(--fs-sm);">
            ${role === 'admin'
              ? '<a href="#/login/seller" style="color:var(--color-text-muted);">Masuk sebagai Penjual &rarr;</a>'
              : '<a href="#/login/admin" style="color:var(--color-text-muted);">Masuk sebagai Admin &rarr;</a>'}
          </p>
          <p style="text-align:center; margin-top: var(--space-2);">
            <a href="#/" style="font-size: var(--fs-sm); color:var(--color-text-muted);">&larr; Kembali ke Katalog Pembeli</a>
          </p>
        </div>
      </div>
    `;

    renderTurnstile();

    container.querySelector('#toggle-mode')?.addEventListener('click', (e) => {
      e.preventDefault();
      mode = mode === 'login' ? 'register' : 'login';
      captchaToken = '';
      draw();
    });

    container.querySelector('#auth-form').addEventListener('submit', handleSubmit);
  }

  function renderTurnstile() {
    if (!TURNSTILE_SITE_KEY) return;
    const mount = container.querySelector('#turnstile-container');
    if (!mount || typeof window.turnstile === 'undefined') {
      // Skrip Turnstile mungkin belum selesai dimuat; coba lagi sebentar.
      setTimeout(renderTurnstile, 300);
      return;
    }
    turnstileWidgetId = window.turnstile.render(mount, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token) => { captchaToken = token; },
      'expired-callback': () => { captchaToken = ''; },
      'error-callback': () => { captchaToken = ''; },
    });
  }

  function resetCaptcha() {
    captchaToken = '';
    if (TURNSTILE_SITE_KEY && window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const username = form.get('username')?.trim();
    const password = form.get('password');

    if (!isRequired(username)) {
      showToast('Username wajib diisi');
      return;
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      showToast('Mohon selesaikan verifikasi CAPTCHA terlebih dahulu');
      return;
    }

    try {
      if (mode === 'login') {
        await signInWithUsername(username, password, captchaToken);
        const actualRole = getCurrentRole();
        const roleOk = role === 'admin' ? ['admin', 'superadmin'].includes(actualRole) : actualRole === role;
        if (!roleOk) {
          const rawProfile = authStore.getState().profile;
          showToast(
            `Role tidak cocok. Data profil mentah: ${JSON.stringify(rawProfile)}`,
            { duration: 15000 }
          );
          resetCaptcha();
          return;
        }
        showToast('Login berhasil');
        window.location.hash = role === 'admin' ? '#/admin' : '#/seller';
      } else {
        await signUpSeller({
          username,
          email: form.get('email'),
          password,
          fullName: form.get('fullName'),
          businessName: form.get('businessName'),
          captchaToken,
        });
        showToast('Registrasi berhasil! Menunggu verifikasi admin.');
        mode = 'login';
        draw();
      }
    } catch (err) {
      showToast('Gagal: ' + err.message);
      resetCaptcha();
    }
  }

  draw();
}
