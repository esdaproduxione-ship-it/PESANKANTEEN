import { supabase, isSupabaseConfigured } from '../../config/supabaseClient.js';

const VISITOR_KEY_STORAGE = 'kantin_dwp_visitor_key';
const LAST_LOGGED_STORAGE = 'kantin_dwp_visitor_last_logged';

function getOrCreateVisitorKey() {
  try {
    let key = localStorage.getItem(VISITOR_KEY_STORAGE);
    if (!key) {
      key = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(VISITOR_KEY_STORAGE, key);
    }
    return key;
  } catch {
    // localStorage tidak tersedia (mis. mode privat ketat) — pakai id sekali pakai
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function alreadyLoggedToday() {
  try {
    const last = localStorage.getItem(LAST_LOGGED_STORAGE);
    const today = new Date().toISOString().slice(0, 10);
    return last === today;
  } catch {
    return false;
  }
}

function markLoggedToday() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(LAST_LOGGED_STORAGE, today);
  } catch {
    // abaikan kalau localStorage tidak tersedia
  }
}

/**
 * Mencatat satu kunjungan aplikasi hari ini (maksimal 1x per visitor per hari).
 * Dipanggil sekali saat aplikasi pertama kali dimuat (lihat main.js).
 * Gagal diam-diam (tidak boleh mengganggu pengalaman pengguna) jika Supabase
 * belum dikonfigurasi atau request gagal (mis. offline).
 */
export async function trackVisit() {
  if (!isSupabaseConfigured || !supabase) return;
  if (alreadyLoggedToday()) return;

  try {
    const visitorKey = getOrCreateVisitorKey();
    const { error } = await supabase.rpc('rpc_log_visit', {
      p_visitor_key: visitorKey,
      p_path: window.location.hash || '#/',
      p_user_agent: navigator.userAgent?.slice(0, 255) || null,
    });
    if (error) throw error;
    markLoggedToday();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[Kantin DWP] Gagal mencatat kunjungan:', err.message || err);
  }
}
