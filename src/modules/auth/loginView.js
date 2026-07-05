import { signInWithPassword, signUpSeller } from '../../core/auth/authService.js';
import { showToast } from '../shared/toast/toast.js';

export function renderLoginView(container, { role = 'seller' } = {}) {
  let mode = 'login'; // 'login' | 'register' (register hanya untuk seller)

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
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required />
            </div>
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
          <p style="text-align:center; margin-top: var(--space-2);">
            <a href="#/" style="font-size: var(--fs-sm); color:var(--color-text-muted);">&larr; Kembali ke Katalog Pembeli</a>
          </p>
        </div>
      </div>
    `;

    container.querySelector('#toggle-mode')?.addEventListener('click', (e) => {
      e.preventDefault();
      mode = mode === 'login' ? 'register' : 'login';
      draw();
    });

    container.querySelector('#auth-form').addEventListener('submit', handleSubmit);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    const email = form.get('email');
    const password = form.get('password');

    try {
      if (mode === 'login') {
        await signInWithPassword(email, password);
        showToast('Login berhasil');
        window.location.hash = role === 'admin' ? '#/admin' : '#/seller';
      } else {
        await signUpSeller({
          email, password,
          fullName: form.get('fullName'),
          businessName: form.get('businessName'),
        });
        showToast('Registrasi berhasil! Menunggu verifikasi admin.');
        mode = 'login';
        draw();
      }
    } catch (err) {
      showToast('Gagal: ' + err.message);
    }
  }

  draw();
}
