import { signInWithUsername, signUpSeller, getCurrentRole } from '../../core/auth/authService.js';
import { showToast } from '../shared/toast/toast.js';
import { isRequired } from '../../core/utils/validators.js';
import { TURNSTILE_SITE_KEY } from '../../config/constants.js';

const ROLE_REDIRECT = {
  admin: '#/admin',
  superadmin: '#/admin',
  seller: '#/seller',
};

export function renderLoginView(container) {
  let mode = 'login'; // 'login' | 'register' (register hanya untuk seller)
  let captchaToken = '';
  let turnstileWidgetId = null;
  let captchaRevealed = false;

  function draw() {
    container.innerHTML = `
      <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background: linear-gradient(135deg, var(--color-orange-soft), var(--color-yellow-soft));">
        <div class="card" style="width:100%; max-width:400px;">
          <div style="text-align:center; margin-bottom: var(--space-5);">
            <div class="sidebar__brand-mark" style="margin:0 auto var(--space-3);"></div>
            <h1 class="display" style="font-size: var(--fs-xl);">Kantin DWP</h1>
            <p style="color:var(--color-text-muted); font-size:var(--fs-sm);">
              ${mode === 'login' ? 'Masuk ke Akun Kamu' : 'Registrasi Penjual'}
            </p>
          </div>

          <form id="auth-form" autocomplete="off">
            <div class="field">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" autocomplete="off" required />
            </div>
            ${mode === 'register' ? `
              <div class="field">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" autocomplete="off" required />
                <small style="color:var(--color-text-muted);">Dipakai untuk pemulihan akun, bukan untuk login.</small>
              </div>
            ` : ''}
            <div class="field">
              <label for="password">Kata Sandi</label>
              <input type="password" id="password" name="password" autocomplete="new-password" required minlength="6" />
            </div>
            ${mode === 'register' ? `
              <div class="field">
                <label for="fullName">Nama Lengkap</label>
                <input type="text" id="fullName" name="fullName" autocomplete="off" required />
              </div>
              <div class="field">
                <label for="businessName">Nama Usaha</label>
                <input type="text" id="businessName" name="businessName" autocomplete="off" required />
              </div>
            ` : ''}

            <div class="field" id="captcha-field" style="${TURNSTILE_SITE_KEY && !captchaRevealed ? 'display:none;' : ''}">
              ${TURNSTILE_SITE_KEY ? `
                <label style="margin-bottom:6px; display:block;">Verifikasi Keamanan</label>
                <div id="turnstile-container"></div>
              ` : `
                <div style="font-size: var(--fs-xs); color:var(--color-text-muted); background:var(--color-orange-soft); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);">
                  ⚠️ CAPTCHA belum dikonfigurasi (VITE_TURNSTILE_SITE_KEY kosong).
                </div>
              `}
            </div>
            ${TURNSTILE_SITE_KEY && !captchaRevealed ? `
              <p id="captcha-hint" style="font-size: var(--fs-xs); color:var(--color-text-muted); margin: 0 0 var(--space-3);">
                Isi username &amp; password terlebih dahulu untuk memunculkan verifikasi keamanan.
              </p>
            ` : ''}

            <button type="submit" class="btn btn--primary btn--block" id="btn-submit" ${TURNSTILE_SITE_KEY && !captchaToken ? 'disabled' : ''}>
              ${mode === 'login' ? 'Masuk' : 'Daftar sebagai Penjual'}
            </button>
          </form>

          <p style="text-align:center; margin-top: var(--space-4); font-size: var(--fs-sm);">
            ${mode === 'login' ? 'Penjual belum punya akun?' : 'Sudah punya akun?'}
            <a href="#" id="toggle-mode" style="color:var(--color-orange-dark); font-weight:600;">
              ${mode === 'login' ? 'Daftar di sini' : 'Masuk di sini'}
            </a>
          </p>
          <p style="text-align:center; margin-top: var(--space-2); font-size: var(--fs-xs); color:var(--color-text-muted);">
            Satu form untuk semua akun — sistem otomatis mendeteksi apakah kamu admin atau penjual.
          </p>
          <p style="text-align:center; margin-top: var(--space-2);">
            <a href="#/" style="font-size: var(--fs-sm); color:var(--color-text-muted);">&larr; Kembali ke Katalog Pembeli</a>
          </p>
        </div>
      </div>
    `;

    if (captchaRevealed) renderTurnstile();

    const usernameInput = container.querySelector('#username');
    const passwordInput = container.querySelector('#password');
    const checkReveal = () => {
      if (!TURNSTILE_SITE_KEY || captchaRevealed) return;
      if (usernameInput.value.trim() && passwordInput.value) {
        captchaRevealed = true;
        draw();
      }
    };
    usernameInput.addEventListener('input', checkReveal);
    passwordInput.addEventListener('input', checkReveal);

    container.querySelector('#toggle-mode')?.addEventListener('click', (e) => {
      e.preventDefault();
      mode = mode === 'login' ? 'register' : 'login';
      captchaToken = '';
      captchaRevealed = false;
      draw();
    });

    container.querySelector('#auth-form').addEventListener('submit', handleSubmit);
  }

  function renderTurnstile() {
    if (!TURNSTILE_SITE_KEY) return;
    const mount = container.querySelector('#turnstile-container');
    if (!mount || typeof window.turnstile === 'undefined') {
      setTimeout(renderTurnstile, 300);
      return;
    }
    if (mount.dataset.rendered) return; // hindari render dobel
    mount.dataset.rendered = 'true';
    turnstileWidgetId = window.turnstile.render(mount, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token) => {
        captchaToken = token;
        const btn = container.querySelector('#btn-submit');
        if (btn) btn.disabled = false;
      },
      'expired-callback': () => { captchaToken = ''; },
      'error-callback': () => { captchaToken = ''; },
    });
  }

  function resetForm() {
    captchaToken = '';
    captchaRevealed = false;
    turnstileWidgetId = null;
    draw();
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
        const destination = ROLE_REDIRECT[actualRole];
        if (!destination) {
          showToast('Login berhasil, tapi role akun tidak dikenali. Hubungi admin.');
          resetForm();
          return;
        }
        showToast('Login berhasil');
        // Form dikosongkan total (bukan sekadar dipindah halaman) supaya
        // tidak ada sisa username/password akun sebelumnya yang tertinggal
        // di form kalau ada orang lain login berikutnya di perangkat sama.
        resetForm();
        window.location.hash = destination;
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
        resetForm();
      }
    } catch (err) {
      showToast('Gagal: ' + err.message);
      resetForm();
    }
  }

  draw();
}
